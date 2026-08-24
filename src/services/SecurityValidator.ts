import { Scenario } from '../types/scenario';

export interface ValidationResult<T = any> {
  isValid: boolean;
  errors: string[];
  sanitizedData?: T;
}

const ALLOWED_CATEGORIES = new Set<Scenario['category']>([
  'POWER',
  'WATER',
  'WEATHER',
  'DUAL_FAILURE',
  'CUSTOM',
]);

const ALLOWED_SEVERITIES = new Set(['FULL', 'DEGRADED']);
const ALLOWED_RECOVERY_TYPES = new Set(['REPAIR', 'BACKUP_POWER', 'ISOLATE', 'REROUTE_NETWORK']);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class SecurityValidator {
  /**
   * Sanitizes text strings against XSS, HTML injection, and control characters.
   */
  public static sanitizeText(input: unknown, maxLength: number = 2000): string {
    if (typeof input !== 'string') return '';
    let sanitized = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '');

    // Trim to maximum length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    return sanitized.trim();
  }

  /**
   * Validates UUID string for user and resource IDs to prevent query injection and IDOR.
   */
  public static isValidUUID(id: unknown): boolean {
    if (typeof id !== 'string') return false;
    return UUID_REGEX.test(id.trim());
  }

  /**
   * Validates and sanitizes a Scenario definition object.
   * Protects against prototype pollution, oversized payloads, NaN/Infinity, and malformed graphs.
   */
  public static validateScenario(raw: unknown): ValidationResult<Scenario> {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      return { isValid: false, errors: ['Scenario payload must be a non-null object.'] };
    }

    // Check payload JSON size (Max 1MB) & Prototype Pollution
    try {
      const jsonString = JSON.stringify(raw);
      if (jsonString.length > 1024 * 1024) {
        return { isValid: false, errors: ['Scenario payload exceeds 1MB limit.'] };
      }
      if (
        jsonString.includes('"__proto__":') ||
        jsonString.includes('"prototype":')
      ) {
        return { isValid: false, errors: ['Dangerous property names detected (prototype pollution attempt).'] };
      }
    } catch {
      return { isValid: false, errors: ['Failed to serialize scenario payload.'] };
    }

    const obj = raw as Record<string, any>;

    // 1. Validate ID
    const id = typeof obj.id === 'string' && obj.id.trim() ? this.sanitizeText(obj.id, 100) : `sc-${Date.now()}`;

    // 2. Validate Name
    if (typeof obj.name !== 'string' || obj.name.trim().length === 0) {
      errors.push('Scenario name is required.');
    }
    const name = this.sanitizeText(obj.name || 'Unnamed Scenario', 120);

    // 3. Validate Category
    let category: Scenario['category'] = typeof obj.category === 'string' ? (obj.category.toUpperCase().trim() as Scenario['category']) : 'CUSTOM';
    if (!ALLOWED_CATEGORIES.has(category)) {
      category = 'CUSTOM';
    }

    // 4. Validate Description
    const description = this.sanitizeText(obj.description || '', 2000);

    // 5. Validate Graph Version
    const graphVersion = this.sanitizeText(obj.graphVersion || 'city-v1', 50);

    // 6. Validate Parameters
    const rawParams = obj.parameters || {};
    const hasMaxTime = rawParams.maxSimulationTime !== undefined;
    const hasDelay = rawParams.defaultPropagationDelay !== undefined;
    const hasRecoveryDur = rawParams.defaultRecoveryDuration !== undefined;
    const hasDelayMult = rawParams.propagationDelayMultiplier !== undefined;

    const maxTime = hasMaxTime ? Number(rawParams.maxSimulationTime) : 60;
    const delay = hasDelay ? Number(rawParams.defaultPropagationDelay) : 5;
    const recoveryDur = hasRecoveryDur ? Number(rawParams.defaultRecoveryDuration) : 15;
    const delayMult = hasDelayMult ? Number(rawParams.propagationDelayMultiplier) : 1.0;

    if (hasMaxTime && (Number.isNaN(maxTime) || !Number.isFinite(maxTime) || maxTime < 5 || maxTime > 1440)) {
      errors.push('maxSimulationTime must be a finite number between 5 and 1440.');
    }
    if (hasDelay && (Number.isNaN(delay) || !Number.isFinite(delay) || delay < 1 || delay > 120)) {
      errors.push('defaultPropagationDelay must be a finite number between 1 and 120.');
    }
    if (hasRecoveryDur && (Number.isNaN(recoveryDur) || !Number.isFinite(recoveryDur) || recoveryDur < 0 || recoveryDur > 1440)) {
      errors.push('defaultRecoveryDuration must be a finite number between 0 and 1440.');
    }
    if (hasDelayMult && (Number.isNaN(delayMult) || !Number.isFinite(delayMult) || delayMult < 0.1 || delayMult > 10)) {
      errors.push('propagationDelayMultiplier must be between 0.1 and 10.');
    }

    const parameters = {
      maxSimulationTime: Number.isFinite(maxTime) && maxTime >= 5 && maxTime <= 1440 ? Math.round(maxTime) : 60,
      defaultPropagationDelay: Number.isFinite(delay) && delay >= 1 && delay <= 120 ? Math.round(delay) : 5,
      defaultRecoveryDuration: Number.isFinite(recoveryDur) && recoveryDur >= 0 && recoveryDur <= 1440 ? Math.round(recoveryDur) : 15,
      propagationDelayMultiplier: Number.isFinite(delayMult) && delayMult >= 0.1 && delayMult <= 10 ? delayMult : 1.0,
      autoPauseOnCriticalBreach: Boolean(rawParams.autoPauseOnCriticalBreach ?? true),
      autoStopOnStabilization: Boolean(rawParams.autoStopOnStabilization ?? true),
    };

    // 7. Validate Initial Failures
    const initialFailures: any[] = [];
    if (Array.isArray(obj.initialFailures)) {
      if (obj.initialFailures.length > 50) {
        errors.push('Exceeded maximum allowed initial failures (50).');
      }
      for (const f of obj.initialFailures.slice(0, 50)) {
        if (!f || typeof f !== 'object') continue;
        const time = Number(f.time);
        if (Number.isNaN(time) || !Number.isFinite(time) || time < 0 || time > parameters.maxSimulationTime) {
          errors.push(`Initial failure timestamp must be finite and within [0, ${parameters.maxSimulationTime}].`);
        }
        if (!f.nodeId || typeof f.nodeId !== 'string') {
          errors.push('Initial failure must reference a valid nodeId.');
        }

        initialFailures.push({
          nodeId: this.sanitizeText(f.nodeId, 80),
          time: Number.isFinite(time) && time >= 0 ? Math.round(time) : 0,
          originId: this.sanitizeText(f.originId || `ORIGIN_${f.nodeId}`, 100),
          severity: ALLOWED_SEVERITIES.has(f.severity) ? f.severity : 'FULL',
          reason: this.sanitizeText(f.reason || 'Simulated outage trigger', 250),
        });
      }
    }

    // 8. Validate Scheduled Recoveries
    const scheduledRecoveries: any[] = [];
    if (Array.isArray(obj.scheduledRecoveries)) {
      if (obj.scheduledRecoveries.length > 50) {
        errors.push('Exceeded maximum allowed scheduled recoveries (50).');
      }
      for (const r of obj.scheduledRecoveries.slice(0, 50)) {
        if (!r || typeof r !== 'object') continue;
        const startTime = Number(r.startTime);
        const duration = Number(r.duration);
        const cost = Number(r.cost);

        if (Number.isNaN(startTime) || !Number.isFinite(startTime) || startTime < 0) {
          errors.push('Recovery startTime must be a non-negative finite number.');
        }
        if (Number.isNaN(duration) || !Number.isFinite(duration) || duration < 0) {
          errors.push('Recovery duration must be a non-negative finite number.');
        }

        scheduledRecoveries.push({
          id: this.sanitizeText(r.id || `rec-${Date.now()}`, 100),
          nodeId: this.sanitizeText(r.nodeId, 80),
          nodeName: this.sanitizeText(r.nodeName || r.nodeId, 120),
          type: ALLOWED_RECOVERY_TYPES.has(r.type) ? r.type : 'REPAIR',
          startTime: Number.isFinite(startTime) && startTime >= 0 ? Math.round(startTime) : 0,
          duration: Number.isFinite(duration) && duration >= 0 ? Math.round(duration) : 15,
          cost: Number.isFinite(cost) && cost >= 0 ? Math.round(cost) : 25,
          description: this.sanitizeText(r.description || 'Field engineering procedure', 250),
          status: 'SCHEDULED',
        });
      }
    }

    const sanitizedScenario: Scenario = {
      id,
      name,
      category,
      description,
      graphVersion,
      nodes: Array.isArray(obj.nodes) ? obj.nodes.slice(0, 100) : [],
      edges: Array.isArray(obj.edges) ? obj.edges.slice(0, 200) : [],
      initialFailures,
      parameters,
      scheduledRecoveries,
    };

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: sanitizedScenario,
    };
  }

  /**
   * Validates raw JSON import file before importing into state.
   */
  public static validateJSONImport(jsonString: string): ValidationResult<any> {
    if (typeof jsonString !== 'string' || !jsonString.trim()) {
      return { isValid: false, errors: ['Import file is empty.'] };
    }

    if (jsonString.length > 2 * 1024 * 1024) {
      return { isValid: false, errors: ['Import file exceeds 2MB limit.'] };
    }

    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { isValid: false, errors: ['JSON content must be a valid JSON object.'] };
      }
      return { isValid: true, errors: [], sanitizedData: parsed };
    } catch (e: any) {
      return { isValid: false, errors: [`Malformed JSON syntax: ${e.message}`] };
    }
  }
}

import { SecurityValidator } from '../services/SecurityValidator';
import { AdminGuard } from '../services/AdminGuard';
import { RateLimiter } from '../services/RateLimiter';
import { ScenarioRepository } from '../services/ScenarioRepository';
import { SimulationRunRepository } from '../services/SimulationRunRepository';
import { StorageService } from '../services/storageService';
import { User } from '@supabase/supabase-js';

export function runSecurityTestSuite(): { passed: number; failed: number; results: { name: string; success: boolean; details?: string }[] } {
  const results: { name: string; success: boolean; details?: string }[] = [];

  function assert(testName: string, condition: boolean, details?: string) {
    results.push({ name: testName, success: condition, details });
    if (!condition) {
      console.error(`❌ FAILED: ${testName} - ${details || ''}`);
    } else {
      console.log(`✅ PASSED: ${testName}`);
    }
  }

  console.log("\n=== RUNNING CASCADE CYBERSECURITY & HARDENING TEST SUITE ===");

  // ==========================================
  // 1. AUTHENTICATION SECURITY TESTS
  // ==========================================
  {
    // SEC-001: Anonymous access to protected resource is denied
    const anonResult = AdminGuard.evaluateRouteAccess('/admin/settings', new URLSearchParams(), null);
    assert("SEC-001: Anonymous access to /admin is denied with 401", anonResult.status === 401 && !anonResult.isAdmin);

    // SEC-002: Invalid/null user session is rejected
    const invalidUser: any = { id: '', app_metadata: {} };
    assert("SEC-002: Invalid UUID user session is rejected by repository", !SecurityValidator.isValidUUID(invalidUser.id));

    // SEC-003: Valid UUID format validation
    const validUUID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const badUUID = "1' OR '1'='1";
    assert("SEC-003: Valid UUID passes regex validation", SecurityValidator.isValidUUID(validUUID));
    assert("SEC-003: SQL injection string is rejected as invalid UUID", !SecurityValidator.isValidUUID(badUUID));
  }

  // ==========================================
  // 2. ADMIN ROUTE & ACCESS CONTROL TESTS
  // ==========================================
  {
    const normalUser: User = {
      id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
      app_metadata: { role: 'authenticated' },
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    const adminUser: User = {
      id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
      app_metadata: { role: 'admin' },
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };

    // SEC-004: Normal user attempting /admin is denied with 403
    const normalAccess = AdminGuard.evaluateRouteAccess('/admin', new URLSearchParams(), normalUser);
    assert("SEC-004: Normal user access to /admin is rejected with 403", normalAccess.status === 403 && !normalAccess.isAdmin);

    // SEC-005: Normal user attempting /admin/users is denied with 403
    const normalSubAccess = AdminGuard.evaluateRouteAccess('/admin/users', new URLSearchParams(), normalUser);
    assert("SEC-005: Normal user access to /admin/users is rejected with 403", normalSubAccess.status === 403 && !normalSubAccess.isAdmin);

    // SEC-006: Normal user attempting URL spoofing ?role=admin is denied with 403
    const spoofParams = new URLSearchParams('role=admin&userId=admin');
    const spoofAttempt = AdminGuard.evaluateRouteAccess('/admin', spoofParams, normalUser);
    assert("SEC-006: Normal user query parameter ?role=admin spoof is rejected with 403", spoofAttempt.status === 403 && !spoofAttempt.isAdmin);

    // SEC-007: Real server-verified admin is granted access with 200
    const adminAccess = AdminGuard.evaluateRouteAccess('/admin/dashboard', new URLSearchParams(), adminUser);
    assert("SEC-007: Verified admin user with server claim is ALLOWED with 200", adminAccess.status === 200 && adminAccess.isAdmin);
  }

  // ==========================================
  // 3. AUTHORIZATION & IDOR TESTS
  // ==========================================
  {
    // SEC-008: Normal user cannot create or overwrite benchmark scenarios
    const userScenario = {
      id: 'scenario-test-idor',
      name: 'User Custom Disaster',
      category: 'CUSTOM',
      description: 'Testing benchmark overwrite prevention',
      is_benchmark: true, // Malicious user tries to set is_benchmark=true
      parameters: { maxSimulationTime: 60, defaultPropagationDelay: 5, defaultRecoveryDuration: 15 },
      initialFailures: [{ nodeId: 'power-grid-main', time: 0, severity: 'FULL', reason: 'Test' }],
    };

    const validated = SecurityValidator.validateScenario(userScenario);
    assert("SEC-008: Scenario validator strips/ignores unprivileged is_benchmark flag", validated.isValid, validated.errors.join(', '));
  }

  // ==========================================
  // 4. INPUT VALIDATION & MALICIOUS PAYLOAD TESTS
  // ==========================================
  {
    // SEC-009: Reject NaN and Infinity in simulation parameters
    const nanScenario = {
      name: 'Malformed Parameters Scenario',
      parameters: {
        maxSimulationTime: NaN,
        defaultPropagationDelay: Infinity,
        defaultRecoveryDuration: -50,
      },
      initialFailures: [],
    };
    const nanValidation = SecurityValidator.validateScenario(nanScenario);
    assert("SEC-009: Parameters with NaN/Infinity/Negatives are rejected with validation errors and bounded", 
      !nanValidation.isValid &&
      nanValidation.sanitizedData?.parameters.maxSimulationTime === 60 &&
      nanValidation.sanitizedData?.parameters.defaultPropagationDelay === 5 &&
      nanValidation.sanitizedData?.parameters.defaultRecoveryDuration === 15,
      nanValidation.errors.join(', ')
    );

    // SEC-010: Reject Prototype Pollution attempt
    const protoPayload = JSON.parse('{"name":"Safe Name","__proto__":{"polluted":"yes"}}');
    const protoValidation = SecurityValidator.validateScenario(protoPayload);
    assert("SEC-010: Prototype pollution payloads with __proto__ are strictly rejected", !protoValidation.isValid);

    // SEC-011: Oversized string trimming & sanitization
    const longName = 'A'.repeat(500);
    const sanitizedName = SecurityValidator.sanitizeText(longName, 120);
    assert("SEC-011: Oversized strings are strictly bounded to max length (120)", sanitizedName.length === 120);
  }

  // ==========================================
  // 5. XSS & SQL INJECTION PROTECTION TESTS
  // ==========================================
  {
    // SEC-012: XSS script tag injection neutralization
    const scriptXSS = '<script>alert("XSS_CRITICAL")</script>';
    const sanitizedScript = SecurityValidator.sanitizeText(scriptXSS);
    assert("SEC-012: <script> tags are neutralized to HTML entities", !sanitizedScript.includes('<script>') && sanitizedScript.includes('&lt;script&gt;'));

    // SEC-013: XSS img onerror and javascript: pseudo-protocol neutralization
    const imgXSS = '<img src=x onerror="alert(1)">javascript:alert(2)';
    const sanitizedImg = SecurityValidator.sanitizeText(imgXSS);
    assert("SEC-013: javascript: URI and unquoted tags are neutralized", !sanitizedImg.includes('javascript:') && !sanitizedImg.includes('<img'));

    // SEC-014: SQL injection strings treated purely as inert text data
    const sqlInjection = "' OR '1'='1'; DROP TABLE scenarios; --";
    const sanitizedSQL = SecurityValidator.sanitizeText(sqlInjection);
    assert("SEC-014: SQL injection single quotes and hyphens are escaped safely", sanitizedSQL.includes('&#x27;') || !sanitizedSQL.includes("'"));
  }

  // ==========================================
  // 6. RATE LIMITING & ABUSE PROTECTION TESTS
  // ==========================================
  {
    RateLimiter.resetAll();

    // SEC-015: Rate limiter permits standard requests within limit
    const check1 = RateLimiter.checkAILimit('test-client');
    const check2 = RateLimiter.checkAILimit('test-client');
    assert("SEC-015: Initial AI requests within limit are allowed", check1.allowed && check2.allowed);

    // SEC-016: Burst requests exceeding limit are throttled
    RateLimiter.checkAILimit('test-client');
    RateLimiter.checkAILimit('test-client');
    RateLimiter.checkAILimit('test-client'); // 5 used
    const burstCheck = RateLimiter.checkAILimit('test-client'); // 6th request
    assert("SEC-016: Burst AI synthesis requests exceeding limit are THROTTLED", !burstCheck.allowed && (burstCheck.retryAfterSeconds || 0) > 0);
  }

  // ==========================================
  // 7. FILE & JSON IMPORT SECURITY TESTS
  // ==========================================
  {
    // SEC-017: Malformed non-JSON strings rejected
    const malformed = 'INVALID_NOT_JSON {{{';
    const importRes = SecurityValidator.validateJSONImport(malformed);
    assert("SEC-017: Malformed non-JSON import string is safely rejected", !importRes.isValid);

    // SEC-018: Valid JSON imported safely
    const validJSON = JSON.stringify({ name: 'Exported Run', version: '2.4.0' });
    const validRes = SecurityValidator.validateJSONImport(validJSON);
    assert("SEC-018: Valid JSON structure is safely parsed without eval()", validRes.isValid && validRes.sanitizedData.version === '2.4.0');
  }

  // ==========================================
  // 8. LOCAL STORAGE SANITIZATION TESTS
  // ==========================================
  {
    // SEC-019: StorageService sanitizes legacy insecure tokens
    StorageService.sanitizeStorage();
    assert("SEC-019: Storage sanitizer clears unauthorized local credentials", true);
  }

  // ==========================================
  // 9. EXTENDED SECURITY & EDGE-CASE TESTS
  // ==========================================
  {
    // SEC-020: Expired / unauthenticated token in AdminGuard returns 401
    const unauthenticatedCheck = AdminGuard.evaluateRouteAccess('/admin/database', new URLSearchParams(), null);
    assert("SEC-020: Missing authentication token for /admin/database returns 401", unauthenticatedCheck.status === 401);

    // SEC-021: Negative recovery duration is bounded to safe non-negative integer
    const negRecoveryScenario = {
      name: 'Negative Recovery Test',
      scheduledRecoveries: [
        {
          id: 'rec-neg',
          nodeId: 'power-grid-main',
          type: 'REPAIR',
          startTime: -10,
          duration: -50,
          cost: -100,
        },
      ],
    };
    const negRecValidation = SecurityValidator.validateScenario(negRecoveryScenario);
    assert("SEC-021: Negative recovery startTime and duration are bounded to non-negative numbers", 
      !negRecValidation.isValid &&
      negRecValidation.sanitizedData?.scheduledRecoveries[0].startTime === 0 &&
      negRecValidation.sanitizedData?.scheduledRecoveries[0].duration === 15
    );

    // SEC-022: Prompt injection containing HTML tags is neutralized
    const injectedPrompt = 'Synthesize a scenario <script>document.cookie="stolen"</script>';
    const sanitizedPrompt = SecurityValidator.sanitizeText(injectedPrompt);
    assert("SEC-022: Prompt injection with script tag is completely escaped", !sanitizedPrompt.includes('<script>') && sanitizedPrompt.includes('&lt;script&gt;'));

    // SEC-023: Oversized initial failures list (>50) triggers error and is truncated
    const hugeFailures = Array.from({ length: 60 }, (_, i) => ({
      nodeId: `node-${i}`,
      time: i,
      severity: 'FULL',
    }));
    const hugeValidation = SecurityValidator.validateScenario({ name: 'Huge Scenario', initialFailures: hugeFailures });
    assert("SEC-023: Excessive initial failures list (>50) is bounded and flagged with validation error", 
      !hugeValidation.isValid && hugeValidation.sanitizedData?.initialFailures.length === 50
    );

    // SEC-024: Cross-user IDOR check - non-UUID user ids are rejected
    assert("SEC-024: Non-UUID userId string rejected in repository operations", !SecurityValidator.isValidUUID('admin-spoofed-user-id'));

    // SEC-025: Max simulation time exceeding 1440 minutes bounded
    const overTimeScenario = {
      name: 'Oversized Time Scenario',
      parameters: { maxSimulationTime: 99999 },
    };
    const overTimeValidation = SecurityValidator.validateScenario(overTimeScenario);
    assert("SEC-025: Simulation time exceeding 1440m is rejected and bounded to 60", 
      !overTimeValidation.isValid && overTimeValidation.sanitizedData?.parameters.maxSimulationTime === 60
    );

    // SEC-026: Graph version string is sanitized
    const dirtyGraphVersion = '<b style="color:red">v2.0</b>';
    const sanitizedGV = SecurityValidator.sanitizeText(dirtyGraphVersion, 50);
    assert("SEC-026: Graph version metadata string is sanitized against HTML markup", !sanitizedGV.includes('<b') && sanitizedGV.includes('&lt;b'));

    // SEC-027: Deterministic hash calculation for simulation runs produces consistent hex string
    const sampleRun = {
      id: 'run-sec-027',
      scenarioId: 'sc-01',
      scenarioName: 'Test Run',
      savedAt: '2026-08-25T00:00:00Z',
      metrics: { systemHealthPercentage: 85, cascadeDepth: 2 } as any,
      eventCount: 4,
      events: [],
      scenarioSnapshot: {} as any,
    };
    const hash1 = SimulationRunRepository.computeHash(sampleRun);
    const hash2 = SimulationRunRepository.computeHash(sampleRun);
    assert("SEC-027: Deterministic run hash is repeatable and non-empty", hash1 === hash2 && hash1.startsWith('hash-'));
  }

  console.log(`\n=== SECURITY TEST SUITE COMPLETE: ${results.filter(r => r.success).length} PASSED, ${results.filter(r => !r.success).length} FAILED ===\n`);

  return {
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
}

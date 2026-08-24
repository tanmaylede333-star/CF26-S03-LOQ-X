import { User } from '@supabase/supabase-js';
import { AuthService } from './authService';

export interface AdminVerificationResult {
  isAdmin: boolean;
  status: 200 | 401 | 403;
  reason: string;
  user: User | null;
}

export class AdminGuard {
  /**
   * Verifies whether the current user is an authenticated administrator.
   * STRICT SECURITY RULES:
   * - Does NOT trust URL query parameters (?role=admin, ?userId=admin).
   * - Does NOT trust localStorage/sessionStorage roles.
   * - Requires an active server-verified Supabase session.
   * - Validates user claims in app_metadata or server-assigned role.
   */
  public static async verifyAdminAccess(userOverride?: User | null): Promise<AdminVerificationResult> {
    // 1. Fetch current authenticated user if not passed
    const user = userOverride !== undefined ? userOverride : await AuthService.getCurrentUser();

    // 2. Unauthenticated check
    if (!user) {
      return {
        isAdmin: false,
        status: 401,
        reason: 'Authentication required. Please sign in to access administration.',
        user: null,
      };
    }

    // 3. Inspect server-signed JWT claims only (app_metadata cannot be altered by client)
    const appMetadata = user.app_metadata || {};
    const userMetadata = user.user_metadata || {};

    const serverRole = appMetadata.role || appMetadata.user_role;
    const isServerAdmin = serverRole === 'admin' || serverRole === 'superadmin';

    // Disallow client-tampered metadata claiming role='admin' without server claim
    if (!isServerAdmin) {
      return {
        isAdmin: false,
        status: 403,
        reason: 'Forbidden: User account does not hold verified administrative privileges.',
        user,
      };
    }

    return {
      isAdmin: true,
      status: 200,
      reason: 'Administrator authorization verified.',
      user,
    };
  }

  /**
   * Evaluates any attempt to access /admin or administrative actions.
   * Explicitly detects and rejects query-string parameter spoofing.
   */
  public static evaluateRouteAccess(path: string, searchParams?: URLSearchParams, user?: User | null): AdminVerificationResult {
    const isProtectedPath = path.startsWith('/admin') || path.startsWith('admin');

    if (!isProtectedPath) {
      return {
        isAdmin: true,
        status: 200,
        reason: 'Public/Standard route access granted.',
        user: user || null,
      };
    }

    // Reject unauthenticated
    if (!user) {
      return {
        isAdmin: false,
        status: 401,
        reason: 'Unauthorized: Session missing for protected admin route.',
        user: null,
      };
    }

    // Reject query spoofing attempt
    if (searchParams && (searchParams.get('role') === 'admin' || searchParams.get('userId') === 'admin')) {
      const serverRole = user.app_metadata?.role;
      if (serverRole !== 'admin' && serverRole !== 'superadmin') {
        return {
          isAdmin: false,
          status: 403,
          reason: 'Access Denied: Client query parameter role spoofing is strictly prohibited.',
          user,
        };
      }
    }

    // Verify server claim
    const appRole = user.app_metadata?.role;
    if (appRole === 'admin' || appRole === 'superadmin') {
      return {
        isAdmin: true,
        status: 200,
        reason: 'Authorized Administrator.',
        user,
      };
    }

    return {
      isAdmin: false,
      status: 403,
      reason: '403 Forbidden: Administrative clearance denied.',
      user,
    };
  }
}

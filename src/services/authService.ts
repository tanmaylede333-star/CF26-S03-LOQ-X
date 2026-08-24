import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
}

export class AuthService {
  public static async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('Supabase auth get user error:', error.message);
        return null;
      }
      return user;
    } catch (e) {
      console.warn('Failed to fetch current user:', e);
      return null;
    }
  }

  public static async getSession(): Promise<Session | null> {
    if (!isSupabaseConfigured() || !supabase) return null;
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Supabase auth get session error:', error.message);
        return null;
      }
      return session;
    } catch (e) {
      console.warn('Failed to get session:', e);
      return null;
    }
  }

  public static async signUp(
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ user: User | null; error: Error | null }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { user: null, error: new Error('Supabase is not configured. Please add valid credentials to .env.local') };
    }
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          },
        },
      });
      if (error) return { user: null, error };
      return { user: data.user, error: null };
    } catch (e: any) {
      return { user: null, error: e };
    }
  }

  public static async signInWithOAuth(provider: 'google' | 'github' = 'google'): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: new Error('Supabase is not configured.') };
    }
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        },
      });
      return { error };
    } catch (e: any) {
      return { error: e };
    }
  }

  public static async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { user: null, error: new Error('Supabase is not configured. Please add valid credentials to .env.local') };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { user: null, error };
      return { user: data.user, error: null };
    } catch (e: any) {
      return { user: null, error: e };
    }
  }

  public static async signOut(): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured() || !supabase) return { error: null };
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (e: any) {
      return { error: e };
    }
  }

  public static onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ): { unsubscribe: () => void } {
    if (!isSupabaseConfigured() || !supabase) {
      return { unsubscribe: () => {} };
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return { unsubscribe: () => subscription.unsubscribe() };
  }
}

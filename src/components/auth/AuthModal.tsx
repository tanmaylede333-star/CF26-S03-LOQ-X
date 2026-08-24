import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { User } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onAuthSuccess: (user: User | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (mode === 'SIGNUP') {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify.');
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'SIGNUP') {
        const { user, error } = await AuthService.signUp(email, password, name);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Account created successfully! Logging you in...');
          onAuthSuccess(user);
          if (user) {
            setTimeout(onClose, 800);
          }
        }
      } else {
        const { user, error } = await AuthService.signIn(email, password);
        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('Logged in successfully!');
          onAuthSuccess(user);
          setTimeout(onClose, 600);
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    const { error } = await AuthService.signInWithOAuth('google');
    if (error) {
      setErrorMsg(error.message);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await AuthService.signOut();
    onAuthSuccess(null);
    setLoading(false);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none font-sans"
      onClick={onClose}
    >
      {/* Neo-brutalist Uiverse Auth Form Container */}
      <div
        className="uiverse-auth-form"
        style={{ maxWidth: '340px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button at top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full border-2 border-[#1e293b] bg-white flex items-center justify-center text-[#1e293b] hover:bg-[#ff5555] hover:text-white transition-colors font-bold text-xs cursor-pointer shadow-[2px_2px_0px_#1e293b]"
          title="Close modal"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {currentUser ? (
          /* Logged In State */
          <div className="w-full flex flex-col items-center gap-4 py-2 text-center">
            <div className="uiverse-title">
              Active Session
              <span>{currentUser.email}</span>
            </div>
            <p className="text-xs text-[#64748b] font-medium">
              Connected to Supabase PostgreSQL cloud sync.
            </p>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={loading}
              className="uiverse-button-confirm"
            >
              {loading ? 'Exiting...' : 'Sign Out'}
            </button>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-start gap-3">
            {/* Top Switcher Tabs: Sign In / Create Account */}
            <div className="flex items-center gap-2 w-full pr-8">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`px-3 py-1 text-xs font-bold rounded border-2 border-[#1e293b] transition-all cursor-pointer ${
                  mode === 'LOGIN'
                    ? 'bg-[#1e293b] text-white shadow-[2px_2px_0px_#495464]'
                    : 'bg-white text-[#1e293b] shadow-[2px_2px_0px_#1e293b] hover:bg-slate-50'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('SIGNUP');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`px-3 py-1 text-xs font-bold rounded border-2 border-[#1e293b] transition-all cursor-pointer ${
                  mode === 'SIGNUP'
                    ? 'bg-[#1e293b] text-white shadow-[2px_2px_0px_#495464]'
                    : 'bg-white text-[#1e293b] shadow-[2px_2px_0px_#1e293b] hover:bg-slate-50'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Title */}
            <div className="uiverse-title mt-1">
              {mode === 'SIGNUP' ? 'Create Account,' : 'Welcome,'}
              <span>{mode === 'SIGNUP' ? 'fill details to register' : 'sign in to continue'}</span>
            </div>

            {/* Error / Success Notifications */}
            {errorMsg && (
              <div className="w-full p-2 text-xs font-semibold text-red-700 bg-red-100 border-2 border-red-500 rounded">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="w-full p-2 text-xs font-semibold text-emerald-800 bg-emerald-100 border-2 border-emerald-500 rounded">
                {successMsg}
              </div>
            )}

            {/* In SIGNUP mode: Name input */}
            {mode === 'SIGNUP' && (
              <input
                type="text"
                placeholder="Full Name / Operator Handle"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="uiverse-input"
                required
              />
            )}

            {/* Email input */}
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="uiverse-input"
              required
              autoFocus
            />

            {/* Password input */}
            <input
              type="password"
              placeholder={mode === 'SIGNUP' ? 'Password (min 6 chars)' : 'Password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="uiverse-input"
              required
            />

            {/* In SIGNUP mode: Confirm password input */}
            {mode === 'SIGNUP' && (
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="uiverse-input"
                required
              />
            )}

            {/* Google provider button */}
            <div className="uiverse-login-with">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="uiverse-button-log"
                title="Continue with Google"
              >
                G
              </button>
            </div>

            {/* Submit Button ("Let's go ->" or "Create Acc ->") */}
            <button
              type="submit"
              disabled={loading}
              className="uiverse-button-confirm"
            >
              {loading ? (
                'Loading...'
              ) : mode === 'SIGNUP' ? (
                <>
                  Create Acc <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Let`s go <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Mode Toggle Footer Link */}
            <div className="w-full text-center mt-1">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'SIGNUP' ? 'LOGIN' : 'SIGNUP');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="text-[12px] font-bold text-[#64748b] hover:text-[#1e293b] underline transition-colors cursor-pointer"
              >
                {mode === 'SIGNUP'
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Create Account"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

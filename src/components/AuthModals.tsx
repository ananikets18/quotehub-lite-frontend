import React, { useState } from 'react';
import { login, signup } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle } from 'lucide-react';

type AuthModalsProps = {
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err && typeof err === 'object') {
    const maybe = err as { response?: { data?: { errors?: { message?: string }[] } } };
    const apiMessage = maybe.response?.data?.errors?.[0]?.message;
    if (apiMessage) return apiMessage;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

export function AuthModals({ onToast }: AuthModalsProps) {
  const { showAuthModal, setShowAuthModal, setCurrentUser } = useAuth();
  
  const [authForm, setAuthForm] = useState({ fullName: '', username: '', email: '', password: '', passwordConfirmation: '' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  if (!showAuthModal) return null;

  const closeOnOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setShowAuthModal(null);
      setAuthError('');
      setAuthSuccess('');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      if (showAuthModal === 'login') {
        const data = await login({ email: authForm.email, password: authForm.password });
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setShowAuthModal(null);
        onToast(`Welcome back, ${data.user.name}!`);
      } else if (showAuthModal === 'signup') {
        const res = await signup(authForm);
        setCurrentUser(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
        setShowAuthModal(null);
        onToast(`Welcome to Quoteshub, ${res.user.name.split(' ')[0]}!`);
      } else if (showAuthModal === 'forgot-password') {
        const { requestPasswordReset } = await import('../api');
        const res = await requestPasswordReset(authForm.email);
        setAuthSuccess(res.message || 'Password reset link sent.');
      }
      setAuthForm({ fullName: '', username: '', email: '', password: '', passwordConfirmation: '' });
    } catch (err: unknown) {
      setAuthError(getErrorMessage(err, 'Authentication failed'));
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeOnOverlayClick} role="dialog" aria-modal="true" aria-label="Authentication">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {showAuthModal === 'login' ? 'Welcome Back' 
             : showAuthModal === 'forgot-password' ? 'Reset Password' 
             : 'Join Quoteshub'}
          </h2>
          <p className="modal-subtitle">
            {showAuthModal === 'login'
              ? 'Sign in to save, share and curate quotes.'
              : showAuthModal === 'forgot-password'
              ? 'Enter your email and we will send you a reset link.'
              : 'Create your free account in seconds.'}
          </p>
        </div>
        <form onSubmit={handleAuth}>
          <div className="modal-body">
            {authError && (
              <div className="form-alert error" role="alert">
                <AlertCircle size={15} />
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="form-alert success" role="alert" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                {authSuccess}
              </div>
            )}

            {showAuthModal === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-name">Full Name *</label>
                <input
                  id="auth-name"
                  required
                  type="text"
                  className="form-input"
                  value={authForm.fullName}
                  onChange={e => setAuthForm({ ...authForm, fullName: e.target.value })}
                  placeholder="Your full name"
                  autoComplete="name"
                  autoFocus
                />
              </div>
            )}

            {showAuthModal === 'signup' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-username">Username *</label>
                <input
                  id="auth-username"
                  required
                  type="text"
                  className="form-input"
                  value={authForm.username}
                  onChange={e => setAuthForm({ ...authForm, username: e.target.value })}
                  placeholder="e.g. quote_lover"
                  pattern="[a-zA-Z0-9]+"
                  title="Only alphanumeric characters are allowed"
                  autoComplete="username"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="auth-email">Email *</label>
              <input
                id="auth-email"
                required
                type="email"
                className="form-input"
                value={authForm.email}
                onChange={e => setAuthForm({ ...authForm, email: e.target.value })}
                placeholder="you@example.com"
                autoComplete={showAuthModal === 'login' ? 'email' : 'username'}
                autoFocus={showAuthModal === 'login'}
              />
            </div>

            {showAuthModal !== 'forgot-password' && (
              <div className="form-group">
                <label className="form-label" htmlFor="auth-password">Password *</label>
                <input
                  id="auth-password"
                  required
                  type="password"
                  className="form-input"
                  value={authForm.password}
                  onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  autoComplete={showAuthModal === 'login' ? 'current-password' : 'new-password'}
                  minLength={8}
                />
              </div>
            )}

            {showAuthModal === 'signup' && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="auth-confirm-password">Confirm Password *</label>
                <input
                  id="auth-confirm-password"
                  required
                  type="password"
                  className="form-input"
                  value={authForm.passwordConfirmation}
                  onChange={e => setAuthForm({ ...authForm, passwordConfirmation: e.target.value })}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                />
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn-cancel" onClick={() => { setShowAuthModal(null); setAuthError(''); setAuthSuccess(''); }}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={authLoading}
                id={showAuthModal === 'login' ? 'btn-login' : showAuthModal === 'forgot-password' ? 'btn-reset' : 'btn-signup'}
              >
                {authLoading
                  ? 'Please wait…'
                  : showAuthModal === 'login' ? 'Sign In' : showAuthModal === 'forgot-password' ? 'Send Link' : 'Create Account'
                }
              </button>
            </div>
            <div className="auth-switch">
              {showAuthModal === 'login' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                  <div>
                    Don't have an account?{' '}
                    <button type="button" onClick={() => { setShowAuthModal('signup'); setAuthError(''); }}>
                      Sign up free
                    </button>
                  </div>
                  <button type="button" onClick={() => { setShowAuthModal('forgot-password'); setAuthError(''); }} style={{ fontSize: '0.875rem' }}>
                    Forgot your password?
                  </button>
                </div>
              ) : (
                <>Already a member?{' '}
                  <button type="button" onClick={() => { setShowAuthModal('login'); setAuthError(''); setAuthSuccess(''); }}>
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

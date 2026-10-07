import React, { useState } from 'react';
import { X, Shield, User, Lock, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    user,
    isAdmin,
    login,
    register,
    quickLoginDemo,
    quickLoginAdmin,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'quick'>('quick');
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(emailOrUsername, password);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setIsSubmitting(true);
    try {
      await register(email, username, password);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden p-6 text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-100">Media Hub Identity</h3>
              <p className="text-xs text-stone-400">Authentication & Access Control</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Status Banner */}
        {user ? (
          <div className="my-4 p-3 rounded-xl bg-stone-800/80 border border-stone-700/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-sm">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-stone-100 flex items-center gap-1.5">
                    {user.username}
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isAdmin
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-stone-400">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1 text-xs rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition"
            >
              Log Out
            </button>
          </div>
        ) : (
          <div className="my-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center space-x-2 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Sign in to access watchlists, playback, reading progress, and admin settings.</span>
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex p-1 my-3 bg-stone-950/80 rounded-xl border border-stone-800 text-xs font-medium">
          <button
            onClick={() => {
              setMode('quick');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              mode === 'quick' ? 'bg-amber-500 text-black font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Quick Login
          </button>
          <button
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              mode === 'signin' ? 'bg-amber-500 text-black font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition ${
              mode === 'signup' ? 'bg-amber-500 text-black font-semibold' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: 1-Click Quick Login */}
        {mode === 'quick' && (
          <div className="space-y-3 py-1">
            <div className="p-3.5 rounded-xl bg-stone-800/50 border border-stone-700/50 hover:border-amber-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <User className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-stone-200">Demo User</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  STANDARD
                </span>
              </div>
              <p className="text-xs text-stone-400 mb-3">
                Full access to movies, anime, books, personal watchlist, favorites, and progress tracking.
              </p>
              <button
                disabled={isSubmitting}
                onClick={async () => {
                  setError(null);
                  setIsSubmitting(true);
                  try {
                    await quickLoginDemo();
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In as Demo User'}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-800/50 border border-stone-700/50 hover:border-amber-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-stone-200">Administrator</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  FULL ADMIN
                </span>
              </div>
              <p className="text-xs text-stone-400 mb-3">
                Manage metadata providers, toggle TMDB / OpenLibrary, configure API keys, and scan storage.
              </p>
              <button
                disabled={isSubmitting}
                onClick={async () => {
                  setError(null);
                  setIsSubmitting(true);
                  try {
                    await quickLoginAdmin();
                  } catch (err: any) {
                    setError(err.message);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="w-full py-2 px-3 rounded-lg bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 text-xs transition"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In as Administrator'}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Custom Sign In */}
        {mode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-3 py-1">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Email or Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="admin or demo@mediahub.com"
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 text-xs transition mt-2"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Tab 3: Custom Sign Up */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-3 py-1">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="cinemafan"
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-1">Password (min 8 chars)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 text-xs transition mt-2"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

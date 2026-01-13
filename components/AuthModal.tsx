
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadGoogleScript, initializeGoogleSignIn, renderGoogleButton, type GoogleUser } from '../utils/googleAuth';
import { signInWithGoogleRedirect } from '../utils/googleAuthRedirect';
import { googleLogin, register as registerApi, login as loginApi, saveToken } from '../utils/authApi';
import SocialLoginLoading from './SocialLoginLoading';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  onSuccess: (user: { name: string; email: string; picture?: string }) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  // Handle Google Sign-In success (defined early with useCallback)
  const handleGoogleSuccess = useCallback(async (googleUserData: GoogleUser) => {
    setIsLoading(true);
    setError('');

    // Track start time untuk minimum display duration
    const startTime = Date.now();
    const minLoadingDuration = 1500; // 1.5 detik minimum

    try {
      if (!googleUserData.credential) {
        throw new Error('Google credential missing');
      }

      const response = await googleLogin(googleUserData.credential);

      if (response.data?.token) {
        saveToken(response.data.token);
      }

      // Ensure loading screen shows for minimum duration
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingDuration - elapsed);

      setTimeout(() => {
        onSuccess({
          name: response.data?.user.name || googleUserData.name,
          email: response.data?.user.email || googleUserData.email,
          picture: response.data?.user.profile_picture || googleUserData.picture,
        });
        setIsLoading(false);
      }, remainingTime);
    } catch (err) {
      // Ensure minimum loading time even on error
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingDuration - elapsed);

      setTimeout(() => {
        console.error('Google Sign-In Error:', err);
        setError(err instanceof Error ? err.message : 'Login dengan Google gagal.');
        setIsLoading(false);
      }, remainingTime);
    }
  }, [onSuccess]);

  // Load and Initialize Google Sign-In ONCE
  useEffect(() => {
    const setupGoogle = async () => {
      try {
        await loadGoogleScript();

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId || clientId === 'your-google-client-id-here.apps.googleusercontent.com') {
          console.error('Google Client ID not configured');
          return;
        }

        // Initialize ONCE with callback
        initializeGoogleSignIn(clientId, handleGoogleSuccess);
        setGoogleLoaded(true);
      } catch (err) {
        console.error('Failed to load Google Sign-In:', err);
      }
    };

    setupGoogle();
  }, [handleGoogleSuccess]); // Include handleGoogleSuccess in deps

  // Render Google button when modal opens and Google is loaded
  useEffect(() => {
    if (isOpen && googleLoaded && googleButtonRef.current) {
    }
  }, [isOpen, googleLoaded, mode]);

  // Reset form when mode or modal changes
  useEffect(() => {
    setMode(initialMode);
    setError('');
    setFormData({ name: '', email: '', password: '' });
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let response;

      if (mode === 'register') {
        response = await registerApi({
          email: formData.email,
          name: formData.name,
          password: formData.password,
        });
      } else {
        response = await loginApi({
          email: formData.email,
          password: formData.password,
        });
      }

      if (response.data?.token) {
        saveToken(response.data.token);
      }

      onSuccess({
        name: response.data?.user.name || formData.name,
        email: response.data?.user.email || formData.email,
        picture: response.data?.user.profile_picture,
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === 'Google') {
      // Google button is already rendered via renderButton()
      // Click will be handled automatically
      return;
    } else if (provider === 'GitHub') {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
      if (!clientId || clientId === 'your-github-client-id-here') {
        setError('GitHub Client ID belum dikonfigurasi di .env.local');
        return;
      }

      setIsLoading(true);
      // Construct GitHub OAuth URL
      const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
      window.location.href = githubUrl;
    } else {
      // Other Providers simulation
      setIsLoading(true);
      setTimeout(() => {
        onSuccess({
          name: `${provider} User`,
          email: `${provider.toLowerCase()}@example.com`
        });
        setIsLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>

      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        <div className="h-2 bg-[#2d6cea]"></div>

        <div className="p-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-[800] text-slate-900 tracking-tight">
              {mode === 'login' ? 'Masuk Akun' : 'Daftar Akun'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-8">
            <button
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'login' ? 'bg-white shadow-lg text-[#2d6cea]' : 'text-slate-500'}`}
              onClick={() => setMode('login')}
            >
              Log In
            </button>
            <button
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'register' ? 'bg-white shadow-lg text-[#2d6cea]' : 'text-slate-500'}`}
              onClick={() => setMode('register')}
            >
              Sign Up
            </button>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* Google Button - Redirect Flow (No Popup) */}
            <button
              onClick={() => {
                const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
                if (!clientId || clientId === 'your-google-client-id-here.apps.googleusercontent.com') {
                  setError('Google Client ID belum dikonfigurasi di .env.local');
                  return;
                }

                // Use redirect flow instead of popup
                signInWithGoogleRedirect({
                  clientId: clientId,
                  redirectUri: `${window.location.origin}/auth/google/callback`,
                  scope: 'openid email profile',
                });
              }}
              className="flex items-center justify-center gap-3 py-3.5 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-blue-100 transition-all font-bold text-slate-700 text-sm active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M24 12.27c0-.85-.07-1.68-.21-2.48H12v4.69h6.74a5.75 5.75 0 01-2.49 3.77v3.12h4.03c2.36-2.17 3.72-5.37 3.72-8.9z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-4.03-3.12c-1.11.74-2.54 1.18-3.91 1.18-3.01 0-5.56-2.04-6.47-4.78H1.36v3.2A11.99 11.99 0 0012 24z" />
                <path fill="#FBBC05" d="M5.53 14.38a7.22 7.22 0 010-4.61v-3.2H1.36a11.99 11.99 0 000 11.01l4.17-3.2z" />
                <path fill="#4285F4" d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44A11.97 11.97 0 0012 0C7.32 0 3.32 2.69 1.36 6.58l4.17 3.2c.91-2.74 3.46-4.78 6.47-4.78z" />
              </svg>
              Google
            </button>

            {/* GitHub Button */}
            <button
              onClick={() => handleSocialLogin('GitHub')}
              className="flex items-center justify-center gap-3 py-3.5 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-blue-100 transition-all font-bold text-slate-700 text-sm active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </button>

            {/* Hidden Google Button (Real OAuth) */}
            <div
              ref={googleButtonRef}
              className="hidden"
              aria-hidden="true"
            />
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-4 text-slate-400 font-black tracking-widest">Atau dengan Email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-[#2d6cea] outline-none transition-all font-semibold"
                  placeholder="Budi Santoso"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Anda</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-[#2d6cea] outline-none transition-all font-semibold"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-[#2d6cea] outline-none transition-all font-semibold"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-rose-500 text-sm font-bold text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-[#2d6cea] hover:bg-blue-600 text-white font-[800] rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-70 flex items-center justify-center text-lg"
            >
              {isLoading ? 'Memproses...' : (mode === 'login' ? 'Masuk Sekarang' : 'Daftar Sekarang')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm font-medium">
              {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
              <button
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="ml-2 text-[#2d6cea] font-bold hover:underline"
              >
                {mode === 'login' ? 'Daftar Gratis' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Google Loading Overlay */}
      <SocialLoginLoading provider="Google" isVisible={isLoading} />
    </div>
  );
};

export default AuthModal;


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadGoogleScript, initializeGoogleSignIn, renderGoogleButton, type GoogleUser } from '../utils/googleAuth';
import { googleLogin, register as registerApi, login as loginApi, saveToken } from '../utils/authApi';

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

    try {
      const response = await googleLogin({
        email: googleUserData.email,
        name: googleUserData.name,
        picture: googleUserData.picture,
        sub: googleUserData.sub,
      });

      if (response.data?.token) {
        saveToken(response.data.token);
      }

      onSuccess({
        name: response.data?.user.name || googleUserData.name,
        email: response.data?.user.email || googleUserData.email,
        picture: response.data?.user.profile_picture || googleUserData.picture,
      });

      setIsLoading(false);
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      setError(err instanceof Error ? err.message : 'Login dengan Google gagal.');
      setIsLoading(false);
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
      renderGoogleButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: mode === 'register' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        width: googleButtonRef.current.offsetWidth || 300,
      });
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
    } else {
      // Facebook masih simulasi
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
            {/* Custom Google Button (Trigger) */}
            <button
              onClick={() => {
                // Trigger the hidden Google button
                const googleBtn = googleButtonRef.current?.querySelector('div[role="button"]') as HTMLElement;
                if (googleBtn) {
                  googleBtn.click();
                } else {
                  setError('Google Sign-In belum siap. Mohon tunggu...');
                }
              }}
              disabled={!googleLoaded}
              className="flex items-center justify-center gap-3 py-3.5 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-blue-100 transition-all font-bold text-slate-700 text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M24 12.27c0-.85-.07-1.68-.21-2.48H12v4.69h6.74a5.75 5.75 0 01-2.49 3.77v3.12h4.03c2.36-2.17 3.72-5.37 3.72-8.9z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-4.03-3.12c-1.11.74-2.54 1.18-3.91 1.18-3.01 0-5.56-2.04-6.47-4.78H1.36v3.2A11.99 11.99 0 0012 24z" />
                <path fill="#FBBC05" d="M5.53 14.38a7.22 7.22 0 010-4.61v-3.2H1.36a11.99 11.99 0 000 11.01l4.17-3.2z" />
                <path fill="#4285F4" d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44A11.97 11.97 0 0012 0C7.32 0 3.32 2.69 1.36 6.58l4.17 3.2c.91-2.74 3.46-4.78 6.47-4.78z" />
              </svg>
              Google
            </button>

            {/* Facebook Button */}
            <button
              onClick={() => handleSocialLogin('Facebook')}
              className="flex items-center justify-center gap-3 py-3.5 border-2 border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-blue-100 transition-all font-bold text-slate-700 text-sm active:scale-95"
            >
              <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
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
    </div>
  );
};

export default AuthModal;

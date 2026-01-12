import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Hero from './components/Hero';
import HostingPlans from './components/HostingPlans';
import Features from './components/Features';
import Comparison from './components/Comparison';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import PromoSection from './components/PromoSection';
import ServerLocations from './components/ServerLocations';
import TechStack from './components/TechStack';
import TrustSection from './components/TrustSection';
import DashboardPage from './pages/Dashboard';
import { isAuthenticated, githubLogin, saveToken } from './utils/authApi';
import HostingPage from './pages/Hosting';
import DomainsPage from './pages/Domains';
import EmailPage from './pages/Email';
import DatabasesPage from './pages/Databases';
import SSLPage from './pages/SSL';
import FileManagerPage from './pages/FileManager';
import BillingPage from './pages/Billing';
import SupportPage from './pages/Support';
import TemplatesPage from './pages/Templates';
import ProfilePage from './pages/Profile';
import CartPage from './pages/Cart';
import SolutionsPage from './pages/Solutions';
import BantuanPage from './pages/Bantuan';
import GoogleCallback from './pages/GoogleCallback';
import SocialLoginLoading from './components/SocialLoginLoading';
import { Toaster } from 'react-hot-toast';




// Landing Page Component
const LandingPage: React.FC<{
  user: { name: string; email: string } | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
}> = ({ user, onOpenAuth, onLogout }) => {
  return (
    <>
      <Header
        user={user}
        onOpenAuth={onOpenAuth}
        onLogout={onLogout}
      />

      <main className="flex-grow">
        <Hero onOpenAuth={() => onOpenAuth('register')} />
        <TrustSection />
        <TechStack />
        <Features />
        <ServerLocations />
        <HostingPlans onSelectPlan={() => onOpenAuth('register')} />
        <PromoSection />
        <Comparison />
        <Testimonials />
        <FAQ />
      </main>

      <Footer />

      {/* Scroll to Top Button */}
      <button
        className="fixed bottom-8 right-8 z-40 bg-[#2d6cea] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform active:scale-95 group"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg className="w-6 h-6 group-hover:-translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/628123456789"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-8 z-40 bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.767 5.767 0 1.258.405 2.424 1.092 3.371l-.715 2.614 2.673-.701c.906.515 1.944.811 3.051.811 3.181 0 5.767-2.586 5.767-5.767 0-3.181-2.586-5.767-5.767-5.767zm3.371 8.203c-.144.405-.831.744-1.144.787-.314.043-.687.058-1.116-.072-.258-.078-.58-.192-.989-.371-1.74-.766-2.887-2.531-2.973-2.644-.086-.114-.7-.931-.7-1.774 0-.844.444-1.259.601-1.43.158-.171.344-.214.458-.214.114 0 .229.001.329.005.107.004.25.016.387.351.144.351.487 1.187.529 1.274.043.086.072.186.014.3-.058.114-.086.186-.171.286-.086.1-.186.229-.258.3-.086.086-.171.186-.072.357.1.171.444.731.954 1.187.658.587 1.216.771 1.387.857.171.086.271.071.371-.043.1-.114.429-.5.544-.672.114-.171.229-.143.387-.086.158.057 1.001.472 1.173.558.171.086.286.129.329.2.043.072.043.415-.101.82zM12 2C6.477 2 2 6.477 2 12c0 1.891.528 3.657 1.445 5.161L2 22l4.991-1.313A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
        </svg>
      </a>
    </>
  );
};

const App: React.FC = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLoginSuccess = (userData: { name: string; email: string }) => {
    setUser(userData);
    setIsAuthModalOpen(false);
    // Redirect to dashboard after successful login
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Detect GitHub Callback
  const githubTriggered = React.useRef(false);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // Process GitHub callback if code exists (regardless of current auth status)
    // This allows re-login after closing browser
    if (code && !githubTriggered.current) {
      githubTriggered.current = true;
      
      // FIX: Hapus code dari URL SEGERA agar request kedua tidak memprosesnya
      window.history.replaceState({}, document.title, window.location.pathname);

      const performGithubLogin = async () => {
        // Show loading state
        setGithubLoading(true);
        setIsAuthModalOpen(true);

        // Track start time untuk minimum display duration
        const startTime = Date.now();
        const minLoadingDuration = 1500; // 1.5 detik minimum

        try {
          const response = await githubLogin(code);

          if (response.data?.token) {
            // Save new token (this will replace any old token)
            saveToken(response.data.token);

            setUser({
              name: response.data.user.name,
              email: response.data.user.email
            });

            // Clean URL to remove code parameter
            window.history.replaceState({}, document.title, "/");

            // Ensure loading screen shows for minimum duration
            const elapsed = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadingDuration - elapsed);

            setTimeout(() => {
              window.location.href = '/dashboard';
            }, remainingTime);
          } else {
            // Ensure minimum loading time even on error
            const elapsed = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadingDuration - elapsed);

            setTimeout(() => {
              alert('Login gagal: Tidak menerima token dari server');
              window.history.replaceState({}, document.title, "/");
              setIsAuthModalOpen(false);
              setGithubLoading(false);
            }, remainingTime);
          }
        } catch (err) {
          // Ensure minimum loading time even on error
          const elapsed = Date.now() - startTime;
          const remainingTime = Math.max(0, minLoadingDuration - elapsed);

          setTimeout(() => {
            alert(`Login GitHub gagal: ${err instanceof Error ? err.message : 'Unknown error'}\n\nSilakan coba lagi.`);
            // Clean URL and close modal on error
            window.history.replaceState({}, document.title, "/");
            setIsAuthModalOpen(false);
            setGithubLoading(false);
          }, remainingTime);
        }
      };

      performGithubLogin();
    }
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col selection:bg-blue-100 selection:text-blue-900">
          <Routes>
            {/* Landing Page */}
            <Route
              path="/"
              element={
                <LandingPage
                  user={user}
                  onOpenAuth={handleOpenAuth}
                  onLogout={handleLogout}
                />
              }
            />

            {/* Dashboard (Protected) */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/hosting" element={<HostingPage />} />
            <Route path="/domains" element={<DomainsPage />} />
            <Route path="/email" element={<EmailPage />} />
            <Route path="/databases" element={<DatabasesPage />} />
            <Route path="/ssl" element={<SSLPage />} />
            <Route path="/files" element={<FileManagerPage />} />
            <Route path="/billing" element={<BillingPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/solutions" element={<SolutionsPage />} />
        <Route path="/bantuan" element={<BantuanPage />} />


            {/* OAuth Callbacks */}
            <Route path="/auth/google/callback" element={<GoogleCallback />} />

            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* GitHub Loading Overlay */}
          <SocialLoginLoading provider="GitHub" isVisible={githubLoading} />

          {/* Auth Modal Overlay - Global */}
          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            initialMode={authMode}
            onSuccess={handleLoginSuccess}
          />
          <Toaster position="top-center" />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

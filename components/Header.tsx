
import React, { useState, useEffect } from 'react';

interface HeaderProps {
  user: { name: string; email: string } | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onOpenAuth, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when window is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navLinks = [
    { name: 'Beranda', href: '#' },
    { name: 'Hosting', href: '#hosting' },
    { name: 'Domain', href: '#domain' },
    { name: 'AI Assistant', href: '#ai-assistant' },
    { name: 'Promo', href: '#promo' },
    { name: 'Bantuan', href: '#faq' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
        isScrolled || mobileMenuOpen ? 'bg-white shadow-xl py-3' : 'bg-transparent py-6'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-11 h-11 bg-[#2d6cea] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:rotate-6 transition-transform duration-300">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className={`text-2xl font-[800] tracking-tight transition-colors duration-300 ${isScrolled || mobileMenuOpen ? 'text-slate-900' : 'text-white'}`}>
            HostModern
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-9">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              className={`text-[15px] font-bold tracking-wide transition-all relative group/nav ${
                isScrolled ? 'text-slate-600 hover:text-[#2d6cea]' : 'text-white/90 hover:text-white'
              }`}
            >
              {link.name}
              <span className={`absolute -bottom-1.5 left-0 w-0 h-0.5 bg-[#2d6cea] transition-all duration-300 group-hover/nav:w-full ${!isScrolled && 'bg-white'}`}></span>
            </a>
          ))}
        </nav>

        {/* Desktop Auth / User */}
        <div className="hidden md:flex items-center gap-5">
          {user ? (
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-3 py-2 px-2 pr-5 rounded-2xl transition-all border group ${
                  isScrolled ? 'bg-slate-50 border-slate-200 hover:border-blue-200' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-110 transition-transform">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black opacity-50 leading-none mb-1">HELLO,</p>
                  <p className="text-sm font-black tracking-tight">{user.name.split(' ')[0]}</p>
                </div>
                <svg className={`w-4 h-4 opacity-50 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 p-3 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="px-5 py-4 border-b border-slate-50 mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Akun Saya</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <button className="w-full text-left px-5 py-3 text-sm text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all flex items-center gap-4 group">
                      <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v7.586a1 1 0 01-.293.707l-4 4a1 1 0 01-.707.293H6a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                      </div>
                      Dashboard
                    </button>
                    <button className="w-full text-left px-5 py-3 text-sm text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all flex items-center gap-4 group">
                      <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                      </div>
                      Domains
                    </button>
                    <button className="w-full text-left px-5 py-3 text-sm text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-all flex items-center gap-4 group">
                      <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      Billing
                    </button>
                  </div>
                  <div className="h-px bg-slate-50 my-2"></div>
                  <button 
                    onClick={onLogout}
                    className="w-full text-left px-5 py-4 text-sm text-rose-500 font-black hover:bg-rose-50 rounded-xl transition-all flex items-center gap-4 group"
                  >
                    <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </div>
                    Keluar Akun
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button 
                onClick={() => onOpenAuth('login')}
                className={`px-7 py-3 text-[15px] font-black rounded-2xl transition-all active:scale-95 ${
                  isScrolled ? 'text-slate-700 hover:bg-slate-100' : 'text-white bg-white/10 border border-white/20 hover:bg-white/20 backdrop-blur-md'
                }`}
              >
                Masuk
              </button>
              <button 
                onClick={() => onOpenAuth('register')}
                className="px-8 py-3 bg-[#2d6cea] text-white text-[15px] font-black rounded-2xl hover:bg-blue-600 transition-all shadow-[0_15px_30px_-5px_rgba(45,108,234,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(45,108,234,0.5)] active:scale-95"
              >
                Coba Gratis
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className={`lg:hidden p-3 rounded-2xl transition-all active:scale-90 ${
            isScrolled || mobileMenuOpen ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white backdrop-blur-md'
          }`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2.5" 
              className="transition-all duration-300"
              d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} 
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`lg:hidden fixed inset-0 z-[55] transition-all duration-500 ease-in-out ${
        mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}>
        <div 
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
        
        <div className={`absolute top-[76px] right-4 left-4 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-6 transition-all duration-500 transform ${
          mobileMenuOpen ? 'translate-y-0 scale-100' : '-translate-y-10 scale-95'
        }`}>
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-5 text-slate-800 text-xl font-black hover:bg-slate-50 rounded-2xl transition-all active:translate-x-2"
              >
                {link.name}
                <svg className="w-5 h-5 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
              </a>
            ))}
            
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col gap-4">
              {user ? (
                <>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-900 leading-none mb-1">{user.name}</p>
                      <p className="text-sm font-bold text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <button className="w-full py-5 bg-[#2d6cea] text-white font-black rounded-[1.5rem] shadow-xl text-lg">Dashboard Hosting</button>
                  <button onClick={onLogout} className="w-full py-4 text-rose-500 font-black text-lg">Keluar Akun</button>
                </>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => {onOpenAuth('login'); setMobileMenuOpen(false);}} 
                    className="w-full py-5 text-slate-900 font-black bg-slate-100 rounded-[1.5rem] text-lg active:scale-95 transition-transform"
                  >
                    Masuk
                  </button>
                  <button 
                    onClick={() => {onOpenAuth('register'); setMobileMenuOpen(false);}} 
                    className="w-full py-5 bg-[#2d6cea] text-white font-black rounded-[1.5rem] shadow-xl text-lg active:scale-95 transition-transform"
                  >
                    Daftar Sekarang
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

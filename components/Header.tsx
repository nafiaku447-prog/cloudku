import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  user: { name: string; email: string } | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
  isSolid?: boolean;
}

const Header: React.FC<HeaderProps> = ({ user, onOpenAuth, onLogout, isSolid = false }) => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeMegamenu, setActiveMegamenu] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      
      // Calculate scroll progress
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
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
    { name: 'Aplikasi', href: '/solutions', isNew: true },

    { name: 'Bantuan', href: '/bantuan' },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileMenuOpen(false);
    setActiveMegamenu(null);

    // If we are not on the landing page, we should navigate back to it with the hash
    if (location.pathname !== '/') {
      return; // Let the default anchor link behavior navigate to /#hash
    }

    e.preventDefault();
    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        const offset = 80; // Header height
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  const megamenuItems = {
    'Hosting': [
      { 
        name: 'Shared Hosting', 
        desc: 'Sempurna untuk website baru', 
        icon: (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ), 
        href: '#hosting' 
      },
      { 
        name: 'Cloud Hosting', 
        desc: 'Resource dedicated & skalabel', 
        icon: (
          <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        ), 
        href: '#hosting' 
      },
      { 
        name: 'WordPress Hosting', 
        desc: 'Optimasi khusus WordPress', 
        icon: (
          <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        ), 
        href: '#hosting' 
      },
      { 
        name: 'VPS Hosting', 
        desc: 'Kendali penuh root server', 
        icon: (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        ), 
        href: '#hosting' 
      },
    ],
    'Domain': [
      { 
        name: 'Cari Domain', 
        desc: 'Temukan alamat impian Anda', 
        icon: (
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        ), 
        href: '#domain' 
      },
      { 
        name: 'Transfer Domain', 
        desc: 'Pindahkan domain ke kami', 
        icon: (
          <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        ), 
        href: '#domain' 
      },
      { 
        name: 'Whois Privacy', 
        desc: 'Lindungi data pribadi Anda', 
        icon: (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ), 
        href: '#domain' 
      },
      { 
        name: 'Domain .id', 
        desc: 'Identitas lokal Indonesia', 
        icon: (
          <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ), 
        href: '#domain' 
      },
    ]
  };

  const showSolid = isScrolled || mobileMenuOpen || isSolid;

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ${
        showSolid ? 'bg-white shadow-xl py-3' : 'bg-transparent py-6'
      }`}
    >
      {/* Scroll Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-transparent z-[70]">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>
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
          <span className={`text-2xl font-[800] tracking-tight transition-colors duration-300 ${showSolid ? 'text-slate-900' : 'text-white'}`}>
            HostModern
          </span>
          <div className="flex flex-col -mt-1 ml-1">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md leading-none border transition-colors ${
              showSolid 
                ? 'bg-blue-50 text-blue-600 border-blue-100' 
                : 'bg-white/10 text-white/80 border-white/20'
            }`}>
              v2.4.0
            </span>
            <div className={`flex items-center gap-1 mt-0.5 ml-0.5 transition-opacity duration-300 ${showSolid ? 'opacity-100' : 'opacity-60'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className={`text-[8px] font-bold uppercase tracking-wider ${showSolid ? 'text-slate-400' : 'text-white'}`}>ID-JKT</span>
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-9">
          {navLinks.map((link) => {
            const hasMegamenu = megamenuItems[link.name as keyof typeof megamenuItems];
            
            return (
              <div 
                key={link.name}
                className="relative group/megamenu"
                onMouseEnter={() => hasMegamenu && setActiveMegamenu(link.name)}
                onMouseLeave={() => setActiveMegamenu(null)}
              >
                {link.href.startsWith('#') ? (
                  <a 
                    href={location.pathname === '/' ? link.href : `/${link.href}`}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className={`text-[15px] font-bold tracking-wide transition-all relative py-2 flex items-center gap-1.5 ${
                      showSolid ? 'text-blue-600 hover:text-blue-700' : 'text-white/90 hover:text-white'
                    }`}
                  >
                    {link.name}
                    {hasMegamenu && (
                      <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${activeMegamenu === link.name ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                    <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover/megamenu:w-full ${!showSolid && 'bg-white'}`}></span>
                  </a>
                ) : (
                  <Link 
                    to={link.href}
                    className={`text-[15px] font-bold tracking-wide transition-all relative py-2 flex items-center gap-2 ${
                      showSolid ? 'text-blue-600 hover:text-blue-700' : 'text-white/90 hover:text-white'
                    }`}
                  >
                    {link.name}
                    {link.isNew && (
                      <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter animate-bounce">
                        New
                      </span>
                    )}
                    <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover/megamenu:w-full ${!showSolid && 'bg-white'}`}></span>
                  </Link>
                )}

                {/* Megamenu Dropdown */}
                {hasMegamenu && (
                  <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-4 w-[500px] transition-all duration-300 ${
                    activeMegamenu === link.name ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-4 pointer-events-none'
                  }`}>
                    <div className="bg-white rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.2)] border border-slate-100 p-6 grid grid-cols-2 gap-3 origin-top">
                      {hasMegamenu.map((item, idx) => (
                        <a
                          key={idx}
                          href={item.href}
                          onClick={(e) => handleSmoothScroll(e, item.href)}
                          className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all group/item"
                        >
                          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl group-hover/item:scale-110 transition-transform bg-gradient-to-br from-blue-50 to-indigo-50">
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 mb-0.5">{item.name}</p>
                            <p className="text-[11px] font-bold text-slate-400 leading-tight">{item.desc}</p>
                          </div>
                        </a>
                      ))}
                      <div className="col-span-2 mt-2 pt-4 border-t border-slate-50">
                        <a href="#" className="flex items-center justify-center gap-2 text-xs font-black text-[#2d6cea] hover:gap-3 transition-all">
                          Lihat Semua {link.name}
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Desktop Auth / User / Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Live Support Badge */}
          <div className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
            showSolid 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
              : 'bg-white/5 border-white/10 text-white/90'
          }`}>
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[11px] font-black tracking-wider uppercase">Live Support</span>
          </div>

          {/* Shopping Cart */}
          <Link to="/cart" className={`p-2.5 rounded-xl transition-all relative group ${
            showSolid ? 'text-blue-600 hover:bg-slate-100' : 'text-white/90 hover:bg-white/10'
          }`}>
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125">
              1
            </span>
          </Link>

          <div className={`w-px h-8 mx-1 opacity-10 ${showSolid ? 'bg-slate-900' : 'bg-white'}`}></div>

          {user ? (
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-3 py-2 px-2 pr-5 rounded-2xl transition-all border group ${
                  showSolid ? 'bg-slate-50 border-slate-200 hover:border-blue-200' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
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
            showSolid ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white backdrop-blur-md'
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
              link.href.startsWith('#') ? (
                <a 
                  key={link.name} 
                  href={location.pathname === '/' ? link.href : `/${link.href}`}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className="flex items-center justify-between p-5 text-slate-800 text-xl font-black hover:bg-slate-50 rounded-2xl transition-all active:translate-x-2"
                >
                  {link.name}
                  <svg className="w-5 h-5 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7-7" /></svg>
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-5 text-slate-800 text-xl font-black hover:bg-slate-50 rounded-2xl transition-all active:translate-x-2"
                >
                  <div className="flex items-center gap-3">
                    {link.name}
                    {link.isNew && (
                      <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">
                        New
                      </span>
                    )}
                  </div>
                  <svg className="w-5 h-5 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7-7" /></svg>
                </Link>
              )
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


import React, { useState, useRef } from 'react';
import { checkDomain, type DomainCheckResult } from '../utils/domainChecker';

type DomainResult = DomainCheckResult;

interface HeroProps {
  onOpenAuth: () => void;
}

const Hero: React.FC<HeroProps> = ({ onOpenAuth }) => {
  const [domain, setDomain] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<DomainResult | null>(null);
  const [error, setError] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);

  const validateDomain = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return 'Silakan masukkan nama domain';
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!trimmed.includes('.') || !domainRegex.test(trimmed)) {
      return 'Format domain tidak valid (misal: bisnissaya.com)';
    }
    return null;
  };

  const performCheck = async (targetDomain: string) => {
    const validationError = validateDomain(targetDomain);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsChecking(true);
    setResult(null);

    try {
      // Use the domain checker utility (supports both WHOIS API and simulation)
      const data = await checkDomain(targetDomain);

      setResult(data);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    } catch (err) {
      console.error('Domain check error:', err);
      setError('Gagal mengecek domain. Silakan coba lagi.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <section className="relative pt-32 pb-24 lg:pt-56 lg:pb-40 gradient-hero overflow-hidden" id="domain">
      {/* Dynamic Glows */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[1000px] h-[1000px] bg-blue-500/20 rounded-full blur-[160px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[140px] pointer-events-none animate-pulse" style={{ animationDelay: '3s' }}></div>

      <div className="container mx-auto px-4 md:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 border border-white/20 rounded-full text-white text-xs font-bold mb-12 backdrop-blur-2xl hover:bg-white/20 transition-all cursor-default shadow-2xl tracking-wider uppercase">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
          Promo Terbatas: Diskon 75% + Domain Gratis
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-[800] text-white mb-8 leading-[1.05] max-w-5xl mx-auto tracking-tight drop-shadow-2xl">
          Hosting Tercepat untuk <br /> <span className="text-emerald-300">Website Masa Depan</span>
        </h1>

        <p className="text-xl md:text-2xl text-white/80 mb-14 max-w-3xl mx-auto leading-relaxed font-medium">
          Mulai dari <span className="font-extrabold text-white bg-blue-600/50 px-3 py-1 rounded-xl">Rp 10.900/bln</span>. Performa server NVMe Gen 4 yang tak tertandingi dengan garansi uang kembali.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-20">
          <button
            onClick={onOpenAuth}
            className="w-full md:w-auto px-14 py-6 bg-white text-[#2d6cea] font-extrabold rounded-2xl text-xl hover:scale-105 hover:shadow-[0_20px_50px_rgba(255,255,255,0.3)] transition-all active:scale-95"
          >
            Mulai Sekarang
          </button>
          <div className="flex gap-4 md:gap-8 items-center text-white/70 text-sm font-semibold">
            <span className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Uptime 99.9%</span>
            <span className="flex items-center gap-2"><svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> Support 24/7</span>
          </div>
        </div>

        {/* Domain Search */}
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => { e.preventDefault(); performCheck(domain); }}
            className="bg-white/95 p-3.5 rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] flex flex-col md:flex-row gap-3 transition-all duration-500 backdrop-blur-xl border border-white focus-within:ring-[15px] focus-within:ring-white/10 focus-within:scale-[1.01] group"
          >
            <div className="flex-grow flex items-center px-6">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase())}
                placeholder="Cari nama domain impian (misal: bisnissaya.com)"
                className="w-full py-5 text-slate-900 outline-none placeholder:text-slate-400 bg-transparent text-xl font-bold"
                disabled={isChecking}
              />
            </div>
            <button
              type="submit"
              disabled={isChecking}
              className="bg-[#2d6cea] hover:bg-blue-600 text-white font-extrabold py-5 px-14 rounded-[2rem] transition-all shadow-xl shadow-blue-500/30 active:scale-95 disabled:opacity-70 flex items-center justify-center min-w-[220px] text-lg"
            >
              {isChecking ? 'Mengecek...' : 'Cek Domain'}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-rose-500/90 backdrop-blur-xl text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 animate-[slideUp_0.4s_ease-out]">
              <svg className="w-7 h-7 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-lg font-bold">{error}</span>
            </div>
          )}

          {/* Results Area */}
          <div ref={resultRef}>
            {result && (
              <div className="mt-12 bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-[slideUp_0.6s_ease-out] text-left border-b-[10px] border-[#2d6cea]">
                <div className="p-10 md:p-14">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-4xl font-black text-slate-900">{result.domain}</h3>
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${result.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {result.status === 'available' ? 'Tersedia' : 'Terdaftar'}
                        </span>
                      </div>
                      <p className="text-slate-500 font-medium mb-3">
                        {result.status === 'available'
                          ? 'Domain premium untuk branding bisnis Anda.'
                          : 'Domain ini sudah terdaftar.'}
                      </p>

                      {/* WHOIS Info (if domain is taken and we have registrar info) */}
                      {result.status === 'taken' && result.registrar && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Informasi WHOIS</h5>
                          <div className="space-y-2 text-sm">
                            {result.registrar && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Registrar:</span>
                                <span className="font-bold text-slate-900">{result.registrar}</span>
                              </div>
                            )}
                            {result.createdDate && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Terdaftar:</span>
                                <span className="font-bold text-slate-900">
                                  {new Date(result.createdDate).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                            {result.expiryDate && (
                              <div className="flex justify-between">
                                <span className="text-slate-500">Kadaluarsa:</span>
                                <span className="font-bold text-slate-900">
                                  {new Date(result.expiryDate).toLocaleDateString('id-ID', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {result.status === 'available' && (
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-right min-w-[240px]">
                        <div className="text-3xl font-black text-[#2d6cea] mb-4">{result.price}</div>
                        <button onClick={onOpenAuth} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                          Beli Sekarang
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Alternative Suggestions */}
                  {result.suggestions && result.suggestions.length > 0 && (
                    <div className="mt-8 pt-8 border-t-2 border-slate-100">
                      <h4 className="text-xl font-black text-slate-800 mb-5">Domain Alternatif untuk Anda</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {result.suggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            className={`p-5 rounded-2xl border-2 transition-all hover:scale-105 cursor-pointer ${suggestion.status === 'available'
                              ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400'
                              : 'border-slate-200 bg-slate-50 opacity-60'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-bold text-slate-900">{suggestion.extension}</span>
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${suggestion.status === 'available'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-300 text-slate-600'
                                }`}>
                                {suggestion.status === 'available' ? 'Tersedia' : 'Terdaftar'}
                              </span>
                            </div>
                            <div className="text-lg font-black text-[#2d6cea] mb-3">{suggestion.price}</div>
                            {suggestion.status === 'available' && (
                              <button
                                onClick={onOpenAuth}
                                className="w-full bg-gradient-to-r from-[#2d6cea] to-blue-600 text-white font-bold py-2 px-4 rounded-xl text-sm hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                              >
                                Pilih Domain
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
};

export default Hero;
import React from 'react';

const PromoSection: React.FC = () => {
  return (
    <section className="py-24 bg-white" id="promo">
      <div className="container mx-auto px-4 md:px-8">
        <div className="relative rounded-[3rem] bg-gradient-to-r from-slate-900 to-[#1a4ab0] overflow-hidden p-10 md:p-20 shadow-[0_32px_80px_-20px_rgba(26,74,176,0.4)]">
          {/* Decorative shapes */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-300 text-xs font-black uppercase tracking-widest mb-6">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                Penawaran Terbatas
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                Migrasi ke HostModern & Hemat Hingga <span className="text-emerald-400">75%</span>
              </h2>
              <p className="text-slate-300 text-lg md:text-xl mb-10 leading-relaxed">
                Dapatkan Cloud Hosting premium dengan kecepatan NVMe Gen 4, SSL Gratis, dan Bantuan 24/7. Hanya untuk 50 pelanggan pertama hari ini!
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button className="w-full sm:w-auto px-10 py-5 bg-white text-[#1a4ab0] font-black rounded-2xl hover:scale-105 transition-transform shadow-2xl active:scale-95 text-lg">
                  Klaim Diskon Sekarang
                </button>
                <div className="flex items-center gap-2 text-white/60 text-sm font-bold">
                  <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Garansi Uang Kembali
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 grid grid-cols-2 gap-4 w-full lg:w-auto">
              {[
                { label: 'Website Terhost', val: '50.000+' },
                { label: 'Uptime Score', val: '99.99%' },
                { label: 'Rating User', val: '4.9/5.0' },
                { label: 'Support 24/7', val: '< 1 Menit' }
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-3xl hover:bg-white/10 transition-colors">
                  <div className="text-emerald-400 text-2xl font-black mb-1">{stat.val}</div>
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoSection;

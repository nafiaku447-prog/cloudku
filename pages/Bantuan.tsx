import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FAQ from '../components/FAQ';

const BantuanPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'Hosting & Server',
      desc: 'Panduan teknis mengenai cPanel, VPS, dan manajemen server.',
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
      topics: ['Setup Website', 'Config PHP', 'Backup Data']
    },
    {
      title: 'Domain & DNS',
      desc: 'Segala hal tentang pendaftaran dan pengaturan domain.',
      icon: (
        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
      topics: ['Transfer Domain', 'Update Nameservers', 'Privacy Protection']
    },
    {
      title: 'Pembayaran',
      desc: 'Informasi tagihan, metode pembayaran, dan refund.',
      icon: (
        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      topics: ['Konfirmasi Bayar', 'Metode Cicilan', 'Invoice Masalah']
    },
    {
      title: 'Keamanan',
      desc: 'Tips menjaga keamanan akun dan website Anda.',
      icon: (
        <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      topics: ['Instalasi SSL', 'Two-Factor Auth', 'Scan Malware']
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header user={null} onOpenAuth={() => {}} onLogout={() => {}} />
      
      <main className="flex-grow">
        {/* Search Hero */}
        <section className="gradient-hero pt-48 pb-32 px-4 shadow-inner">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-6xl font-[900] text-white mb-8 tracking-tight">Ada yang bisa kami bantu?</h1>
            
            <div className="relative max-w-2xl mx-auto group">
              <input 
                type="text" 
                placeholder="Cari kata kunci... (misal: SSH, SSL, Domain)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-6 px-10 bg-white/95 backdrop-blur-xl rounded-[2.5rem] border border-white/20 text-slate-800 text-lg font-bold shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] outline-none focus:ring-8 focus:ring-white/10 transition-all placeholder:text-slate-400"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#2d6cea] p-4 rounded-3xl text-white shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <span className="text-white/60 text-sm font-bold">Populer:</span>
              {['Ganti Nameservers', 'Bayar Virtual Account', 'Upgrade VPS'].map((tag) => (
                <button key={tag} className="text-xs font-black text-white hover:text-blue-200 transition-colors uppercase tracking-wider">{tag}</button>
              ))}
            </div>
          </div>
        </section>

        {/* Categories Grid */}
        <section className="py-24 bg-white -mt-16 rounded-t-[4rem] relative z-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {categories.map((cat, idx) => (
                <div 
                  key={idx}
                  className="group p-8 rounded-[3rem] border border-slate-100 bg-white hover:border-blue-500/30 hover:shadow-[0_40px_80px_-20px_rgba(45,108,234,0.15)] transition-all duration-500 cursor-pointer flex flex-col sm:flex-row gap-8 items-start"
                >
                  <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:scale-110 transition-all duration-500">
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{cat.title}</h3>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6 italic">{cat.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {cat.topics.map((topic) => (
                        <span key={topic} className="px-4 py-2 bg-slate-100 text-slate-600 text-[10px] font-black rounded-xl uppercase tracking-wider hover:bg-slate-200 transition-colors">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <div className="bg-slate-50">
          <FAQ />
        </div>

        {/* Bottom Contact CTA */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Butuh Bantuan Lebih Lanjut?</h2>
                <p className="text-white/60 text-lg font-medium mb-10 max-w-xl mx-auto leading-relaxed">
                  Tim ahli kami siap membantu Anda 24 jam setiap hari melalui berbagai channel komunikasi.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button className="w-full sm:w-auto px-10 py-5 bg-[#2d6cea] text-white font-black rounded-[1.5rem] shadow-xl shadow-blue-500/30 hover:bg-blue-600 active:scale-95 transition-all text-sm uppercase tracking-widest">
                    Mulai Live Chat
                  </button>
                  <button className="w-full sm:w-auto px-10 py-5 bg-white/10 text-white font-black rounded-[1.5rem] border border-white/20 hover:bg-white/20 transition-all text-sm uppercase tracking-widest backdrop-blur-sm">
                    Kirim Tiket
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BantuanPage;

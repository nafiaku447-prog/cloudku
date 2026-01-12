import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const SolutionsPage: React.FC = () => {
  const solutions = [
    {
      id: 'n8n',
      name: 'n8n Automation Hosting',
      tagline: 'Automasi Workflow Tanpa Batas',
      description: 'Jalankan n8n di infrastruktur cloud yang dioptimalkan. Hubungkan ribuan aplikasi dan buat workflow automasi yang kompleks tanpa biaya lisensi per-eksekusi.',
      icon: 'https://imagedelivery.net/LqiWLm-3MGbYHtFuUbcBtA/4c331fc8-1805-4123-77d2-181a5825da00/w=1280,sharpen=1', 
      iconColor: 'text-rose-600',
      features: [
        'Instalasi n8n Sekali Klik',
        'Infrastruktur Dedicated',
        'Resource Skalabel',
        'Akses Database Penuh',
        'Keamanan Tier-1'
      ],
      price: '99.000',
      color: 'rose'
    },
    {
      id: 'minecraft',
      name: 'Minecraft Game Server',
      tagline: 'Server Game Ultra-Low Latency',
      description: 'Nikmati pengalaman bermain Minecraft tanpa lag bersama teman-teman. Server kami dilengkapi dengan Anti-DDoS dan latensi rendah khusus untuk region Indonesia.',
      icon: 'https://www.vectorlogo.zone/logos/minecraft/minecraft-icon.svg',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      features: [
        'Lokasi Server Indonesia (ID-JKT)',
        'NVMe SSD Storage',
        'Anti-DDoS Protection',
        'Panel Kontrol Pterodactyl',
        'Dukungan Mod & Plugin'
      ],
      price: '45.000',
      color: 'emerald'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header user={null} onOpenAuth={() => {}} onLogout={() => {}} />
      
      <main className="flex-grow">
        {/* Page Hero - Matching Landing Style */}
        <div className="gradient-hero pt-48 pb-20 px-4 text-center">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Solusi Cloud Instan</h1>
            <p className="text-white/80 max-w-2xl mx-auto text-lg font-medium opacity-90 transition-opacity hover:opacity-100">
              Infrastruktur khusus yang dioptimalkan untuk aplikasi favorit Anda. 
              Siap pakai dalam hitungan menit tanpa ribet konfigurasi manual.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl -mt-10 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {solutions.map((item) => (
              <div 
                key={item.id}
                className="group bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/50 hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className={`w-20 h-20 ${item.iconBg} rounded-3xl flex items-center justify-center p-5 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                    <img src={item.icon} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mulai Dari</span>
                    <p className="text-3xl font-black text-slate-900">Rp {item.price}<span className="text-sm text-slate-400 font-bold">/bln</span></p>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="text-2xl font-black text-slate-900 mb-2">{item.name}</h2>
                  <p className={`text-sm font-black text-${item.color}-600 uppercase tracking-wider mb-4`}>{item.tagline}</p>
                  <p className="text-slate-500 leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>

                <div className="space-y-4 mb-10 flex-grow">
                  {item.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full ${item.iconBg} flex items-center justify-center`}>
                        <svg className={`w-3 h-3 ${item.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-bold text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button className={`w-full py-5 rounded-2xl font-black text-white bg-slate-900 hover:bg-blue-600 transition-all shadow-xl active:scale-95 text-lg flex items-center justify-center gap-2 group/btn`}>
                  Luncurkan Sekarang
                  <svg className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* New App Comming Soon Info */}
          <div className="mt-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl -ml-24 -mb-24"></div>
            
            <h3 className="text-3xl font-black mb-4 relative z-10">Request Aplikasi Pilihan Anda?</h3>
            <p className="text-blue-100 max-w-xl mx-auto mb-10 font-medium relative z-10">
              Punya aplikasi atau platform yang ingin dideploy dengan satu klik? Beritahu tim kami dan kami akan menyediakannya untuk Anda.
            </p>
            <button className="bg-white text-blue-600 px-10 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all active:scale-95 shadow-xl shadow-black/10 relative z-10">
              Hubungi Tim Ahli
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SolutionsPage;

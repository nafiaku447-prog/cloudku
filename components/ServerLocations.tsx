
import React from 'react';

const ServerLocations: React.FC = () => {
  const locations = [
    { name: 'Jakarta', country: 'Indonesia', flag: '🇮🇩', latency: '< 5ms' },
    { name: 'Singapore', country: 'Singapore', flag: '🇸🇬', latency: '< 15ms' },
    { name: 'Tokyo', country: 'Japan', flag: '🇯🇵', latency: '< 45ms' },
    { name: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', latency: '< 180ms' },
    { name: 'San Francisco', country: 'USA', flag: '🇺🇸', latency: '< 220ms' },
  ];

  return (
    <section className="py-24 bg-white overflow-hidden" id="locations">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              Global Network
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
              Akses Website <span className="text-[#2d6cea]">Kilat</span> Dari Mana Saja
            </h2>
            <p className="text-slate-600 text-lg mb-10 max-w-xl leading-relaxed">
              Infrastruktur Tier 3 kami tersebar di 5+ lokasi strategis di seluruh dunia. Dapatkan latency terendah khusus untuk pengunjung di Indonesia dengan server Jakarta.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              {locations.slice(0, 4).map((loc, i) => (
                <div key={i} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all group">
                  <div className="text-2xl mb-2">{loc.flag}</div>
                  <h4 className="font-black text-slate-900 group-hover:text-[#2d6cea] transition-colors">{loc.name}</h4>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{loc.latency} Latency</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="relative z-10 bg-slate-900 rounded-[3rem] p-4 shadow-3xl overflow-hidden group">
              <img 
                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000" 
                alt="Global Network Map" 
                className="rounded-[2.5rem] opacity-60 group-hover:scale-110 transition-transform"
                style={{ transitionDuration: '10s' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
              
              {/* Pulsing Dots for Locations */}
              <div className="absolute top-[60%] left-[65%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping scale-150"></div>
                  <div className="relative w-4 h-4 bg-white border-4 border-blue-500 rounded-full"></div>
                </div>
                <div className="mt-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Jakarta Hub</span>
                </div>
              </div>

              <div className="absolute bottom-10 left-10 right-10">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-black text-xl">Uptime 99.99%</p>
                      <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">SLA Guaranteed Performance</p>
                    </div>
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background elements */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServerLocations;

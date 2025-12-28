
import React, { useState } from 'react';
import { HOSTING_TIERS } from '../constants';

interface HostingPlansProps {
  onSelectPlan: () => void;
}

const HostingPlans: React.FC<HostingPlansProps> = ({ onSelectPlan }) => {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section className="py-24 bg-slate-50" id="hosting">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Pilih Paket Hosting Anda</h2>
          <p className="text-slate-600 max-w-2xl mx-auto mb-12 text-lg">
            Temukan paket yang sesuai dengan kebutuhan website Anda. Dari personal blog hingga skala enterprise.
          </p>

          {/* Enhanced Toggle Switch */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <button 
              onClick={() => setIsYearly(false)}
              className={`text-sm font-black transition-all duration-300 uppercase tracking-widest ${!isYearly ? 'text-[#2d6cea] scale-110' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Bulanan
            </button>
            
            <button 
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-20 h-10 rounded-full transition-all duration-500 ease-in-out flex items-center px-1.5 shadow-inner outline-none active:scale-90 ${
                isYearly ? 'bg-[#2d6cea]' : 'bg-slate-300'
              }`}
            >
              <div className={`w-7 h-7 bg-white rounded-full shadow-lg transition-transform duration-300 transform ease-out ${
                isYearly ? 'translate-x-10' : 'translate-x-0'
              }`}></div>
            </button>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsYearly(true)}
                className={`text-sm font-black transition-all duration-300 uppercase tracking-widest ${isYearly ? 'text-[#2d6cea] scale-110' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Tahunan
              </button>
              <span className={`text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full uppercase tracking-wider transition-all duration-500 transform ${
                isYearly ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-75 -translate-x-2'
              }`}>
                Hemat 60%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HOSTING_TIERS.map((tier) => (
            <div 
              key={tier.id}
              className={`relative bg-white rounded-[2.5rem] p-10 transition-all duration-500 border-2 flex flex-col h-full ${
                tier.isPopular ? 'border-[#2d6cea] shadow-[0_40px_100px_-20px_rgba(45,108,234,0.3)] scale-105 z-10' : 'border-transparent shadow-2xl hover:scale-[1.02]'
              }`}
            >
              {tier.isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#2d6cea] text-white text-[10px] font-black py-2 px-8 rounded-full uppercase tracking-[0.2em] shadow-xl">
                  Paling Populer
                </div>
              )}

              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">{tier.name}</h3>
              <p className="text-slate-500 text-sm mb-8 font-medium">Cocok untuk website {tier.id === 'personal' ? 'pribadi sederhana' : tier.id === 'bisnis' ? 'toko online berkembang' : 'skala korporasi'}.</p>
              
              <div className="mb-10 min-h-[90px] flex flex-col justify-end">
                <span className={`text-slate-400 text-sm line-through block font-bold transition-all duration-300 ${isYearly ? 'opacity-100' : 'opacity-0'}`}>
                  Rp {(tier.priceMonthly * 2).toLocaleString('id-ID')}
                </span>
                <div className="flex items-baseline gap-1 mt-1 transition-all duration-300 transform">
                  <span className="text-lg font-black text-slate-900">Rp</span>
                  <span className="text-5xl font-black text-slate-900 tabular-nums tracking-tighter">
                    {(isYearly ? tier.priceYearly : tier.priceMonthly).toLocaleString('id-ID')}
                  </span>
                  <span className="text-slate-500 font-bold ml-1 text-sm">/bln</span>
                </div>
              </div>

              <button 
                onClick={onSelectPlan}
                className={`w-full py-5 px-6 rounded-2xl font-black transition-all mb-10 active:scale-95 text-lg shadow-xl ${
                tier.isPopular 
                  ? 'bg-[#2d6cea] text-white hover:bg-blue-600 shadow-blue-500/30' 
                  : 'bg-blue-50 text-[#2d6cea] hover:bg-blue-100 shadow-blue-500/5'
              }`}>
                Pilih Paket
              </button>

              <div className="space-y-5 flex-grow">
                {tier.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-4 group/feature">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors group-hover/feature:bg-emerald-100">
                      <svg className="w-4 h-4 text-emerald-500 transition-transform duration-300 group-hover/feature:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-slate-600 text-sm font-bold group-hover/feature:text-slate-900 transition-colors leading-tight">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-slate-400 text-sm font-bold flex items-center justify-center gap-3 bg-white py-4 px-8 rounded-full shadow-sm w-fit mx-auto border border-slate-50 cursor-default hover:shadow-md transition-shadow">
            <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Harga sudah termasuk PPN 11% — Garansi Uang Kembali 30 Hari Tanpa Syarat
          </p>
        </div>
      </div>
    </section>
  );
};

export default HostingPlans;

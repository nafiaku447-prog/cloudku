import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface PlanDetails {
  id: string;
  name: string;
  basePrice: number;
  discount24: number;
  discount48: number;
}

const CartPage: React.FC = () => {
  const [duration, setDuration] = useState(24);
  const [backupActive, setBackupActive] = useState(false);
  const [serverLocation, setServerLocation] = useState('Malaysia');
  const [selectedOS, setSelectedOS] = useState('Ubuntu');
  const [searchOS, setSearchOS] = useState('');
  const [osCategory, setOsCategory] = useState('OS biasa');
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isPeriodOpen, setIsPeriodOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');

  const periodOptions = [
    { value: 1, label: '1 bulan' },
    { value: 12, label: '12 bulan' },
    { value: 24, label: '24 bulan' },
    { value: 48, label: '48 bulan' },
  ];

  const locationsGrouped = [
    {
      region: 'Asia',
      items: [
        { name: 'Malaysia', latency: '192 ms' },
        { name: 'Singapore', latency: '210 ms' },
        { name: 'Indonesia', latency: '180 ms' },
      ]
    },
    {
      region: 'North America',
      items: [
        { name: 'Amerika Serikat - Phoenix', latency: '344 ms' },
        { name: 'Amerika Serikat - Boston', latency: '435 ms' },
      ]
    },
    {
      region: 'South America',
      items: [
        { name: 'Brasil', latency: '450 ms' },
      ]
    }
  ];

  const plans: Record<string, PlanDetails> = {
    'kvm2': {
      id: 'kvm2',
      name: 'KVM 2',
      basePrice: 310900,
      discount24: 0.65, // Example discount
      discount48: 0.75
    }
  };

  const currentPlan = plans['kvm2'];
  const monthlyPrice = Math.round(currentPlan.basePrice * (1 - (duration >= 48 ? currentPlan.discount48 : currentPlan.discount24)));
  const subtotal = monthlyPrice * duration + (backupActive ? 99900 * duration : 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price).replace('IDR', 'Rp');
  };

  const osList = [
    { id: 'almalinux', name: 'AlmaLinux', icon: 'https://www.vectorlogo.zone/logos/almalinux/almalinux-icon.svg' },
    { id: 'debian', name: 'Debian', icon: 'https://www.vectorlogo.zone/logos/debian/debian-icon.svg' },
    { id: 'rockylinux', name: 'Rocky Linux', icon: 'https://www.vectorlogo.zone/logos/rockylinux/rockylinux-icon.svg' },
    { id: 'ubuntu', name: 'Ubuntu', icon: 'https://www.vectorlogo.zone/logos/ubuntu/ubuntu-icon.svg' },
    { id: 'alpinelinux', name: 'Alpine Linux', icon: 'https://www.vectorlogo.zone/logos/alpinelinux/alpinelinux-icon.svg' },
    { id: 'archlinux', name: 'Arch Linux', icon: 'https://www.vectorlogo.zone/logos/archlinux/archlinux-icon.svg' },
    { id: 'centos', name: 'CentOS', icon: 'https://www.vectorlogo.zone/logos/centos/centos-icon.svg' },
    { id: 'cloudlinux', name: 'CloudLinux', icon: 'https://www.vectorlogo.zone/logos/cloudlinux/cloudlinux-icon.svg' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header 
        user={null} 
        onOpenAuth={() => {}} 
        onLogout={() => {}} 
      />
      
      <main className="flex-grow">
        {/* Page Hero - Matching Landing Style */}
        <div className="gradient-hero pt-48 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">Selesaikan Pesanan Anda</h1>
            <p className="text-white/80 max-w-2xl text-lg font-medium opacity-90">
              Konfigurasikan server Anda dan nikmati performa cloud terbaik di kelasnya. 
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-6xl -mt-10 pb-20">

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column */}
            <div className="flex-grow space-y-6">
              {/* Product Card */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">{currentPlan.name}</h2>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Durasi</label>
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                      <div className="relative w-full md:w-64">
                        <button 
                          onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                          className={`w-full flex items-center justify-between p-4 bg-white border-2 rounded-2xl font-bold text-slate-700 transition-all ${
                            isPeriodOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-100 hover:border-slate-200 shadow-sm'
                          }`}
                        >
                          <span>{duration} bulan</span>
                          <svg 
                            className={`w-5 h-5 transition-transform duration-300 text-slate-400 ${isPeriodOpen ? 'rotate-180' : ''}`} 
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        {isPeriodOpen && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                            {periodOptions.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => {
                                  setDuration(opt.value);
                                  setIsPeriodOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                  duration === opt.value 
                                    ? 'bg-blue-50 text-blue-600' 
                                    : 'text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {opt.label}
                                {duration === opt.value && (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex-grow flex items-center justify-between">
                        <span className="bg-[#ccff00] text-slate-900 text-[11px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase">
                          Hemat Rp4.896.000
                        </span>
                        <div className="text-right">
                          <p className="text-2xl font-black text-slate-900">{formatPrice(monthlyPrice)}/bln</p>
                          <p className="text-sm font-bold text-slate-400 line-through">{formatPrice(currentPlan.basePrice)}/bln</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-medium text-slate-400">
                    Biaya perpanjangan {formatPrice(monthlyPrice * 1.2)}/bln untuk 2 tahun. Bisa dibatalkan kapan saja.
                  </p>

                  {/* Promo Banner */}
                  <div className="bg-slate-950 rounded-2xl p-4 flex items-center justify-between group overflow-hidden relative">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#ccff00] rounded-xl flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform">
                        <svg className="w-7 h-7 text-slate-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12.7 2.29c-.39-.39-1.02-.39-1.41 0l-9 9c-.39.39-.39 1.02 0 1.41l9 9c.39.39 1.02.39 1.41 0l9-9c.39-.39.39-1.02 0-1.41l-9-9zM7.5 10.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm9 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#ccff00] uppercase tracking-widest">Promo Tahun Baru</p>
                        <p className="text-sm font-bold text-white">Makin hemat pilih paket 24 bulan + gratis 1 bulan</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       {[ {v: '00', l: 'H'}, {v: '18', l: 'J'}, {v: '45', l: 'M'}, {v: '12', l: 'D'}].map((t, i) => (
                         <div key={i} className="bg-white/10 px-2 py-1 rounded text-center min-w-[36px]">
                           <p className="text-xs font-black text-white leading-none">{t.v}</p>
                           <p className="text-[8px] font-black text-white/40 uppercase">{t.l}</p>
                         </div>
                       ))}
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-sm font-bold text-emerald-800">
                      Selamat! Anda dapat domain <span className="font-black">GRATIS</span> + 1 bulan <span className="font-black">GRATIS</span> di pembelian ini. 
                    </p>
                  </div>
                </div>
              </div>

              {/* Add-on Card */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex items-center justify-between group cursor-pointer" onClick={() => setBackupActive(!backupActive)}>
                <div className="flex items-start gap-4">
                  <div className={`w-6 h-6 rounded-md border-2 mt-1 flex items-center justify-center transition-all ${backupActive ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-200 group-hover:border-blue-400'}`}>
                    {backupActive && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-black text-slate-800">Backup harian otomatis</h3>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">Direkomendasikan</span>
                    </div>
                    <p className="text-sm font-medium text-slate-400">Backup data VPS setiap hari agar tetap aman dan mudah dikembalikan.</p>
                  </div>
                </div>
                <p className="text-xl font-black text-slate-900">Rp99.900/bln</p>
              </div>

              {/* Server Location */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative">
                <h3 className="text-xl font-black text-slate-900 mb-2">Pilih lokasi server</h3>
                <p className="text-sm font-medium text-slate-400 mb-6">Pilih lokasi server yang paling dekat dengan Anda atau audiens Anda untuk performa optimal.</p>
                
                {/* Custom Combobox */}
                <div className="relative">
                  <button 
                    onClick={() => setIsLocationOpen(!isLocationOpen)}
                    className={`w-full p-4 bg-slate-50 border transition-all rounded-2xl font-bold text-slate-700 flex items-center justify-between group ${isLocationOpen ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {serverLocation}
                    </span>
                    <svg className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isLocationOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {isLocationOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="p-3 border-b border-slate-50">
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Search..." 
                            autoFocus
                            value={searchLocation}
                            onChange={(e) => setSearchLocation(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto scrollbar-hide py-2">
                        {locationsGrouped.map((group) => {
                          const filteredItems = group.items.filter(item => item.name.toLowerCase().includes(searchLocation.toLowerCase()));
                          if (filteredItems.length === 0) return null;

                          return (
                            <div key={group.region}>
                              <div className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                                {group.region}
                              </div>
                              {filteredItems.map((item) => (
                                <button
                                  key={item.name}
                                  onClick={() => {
                                    setServerLocation(item.name);
                                    setIsLocationOpen(false);
                                    setSearchLocation('');
                                  }}
                                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors group/item"
                                >
                                  <span className={`text-sm font-bold ${serverLocation === item.name ? 'text-blue-600' : 'text-slate-700'}`}>
                                    {item.name}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-400">
                                    Latensi bagus <span className="font-bold text-slate-500">{item.latency}</span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Latensi terbaik untuk area Anda terdeteksi di {serverLocation}
                </div>
              </div>

              {/* OS Selection */}
              <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-black text-slate-900">Pilih OS</h3>
                  <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">Opsional</span>
                </div>
                <p className="text-sm font-medium text-slate-400 mb-6">Pilih OS, control panel, atau aplikasi yang ingin diinstal. Bisa diubah kapan saja melalui dashboard VPS.</p>

                <div className="relative mb-6">
                  <input 
                    type="text" 
                    placeholder="Cari OS" 
                    value={searchOS}
                    onChange={(e) => setSearchOS(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                  {['OS biasa', 'OS dengan panel', 'Aplikasi'].map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setOsCategory(cat)}
                      className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[13px] font-black transition-all ${osCategory === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {osList.filter(os => os.name.toLowerCase().includes(searchOS.toLowerCase())).map((os) => (
                    <div 
                      key={os.id}
                      onClick={() => setSelectedOS(os.name)}
                      className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedOS === os.name 
                          ? 'border-blue-600 ring-4 ring-blue-500/5 bg-white shadow-xl shadow-blue-500/10' 
                          : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-10 h-10 flex items-center justify-center">
                          <img 
                            src={os.icon} 
                            alt={os.name} 
                            className={`w-full h-full object-contain ${os.id === 'ubuntu' ? '' : 'opacity-90'}`} 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg';
                            }}
                          />
                        </div>
                        <span className={`text-lg font-black tracking-tight ${selectedOS === os.name ? 'text-slate-900' : 'text-slate-700'}`}>
                          {os.name}
                        </span>
                      </div>
                      <button className="text-slate-200 hover:text-amber-400 transition-colors">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-10 text-center">
                  <button className="text-sm font-black text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 w-full group">
                    <span className="border-b-2 border-transparent group-hover:border-blue-200">Lihat lebih banyak</span>
                    <svg className={`w-4 h-4 transition-transform group-hover:translate-y-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Summary (Sticky) */}
            <div className="lg:w-96 shrink-0 relative">
              <div className="sticky top-32 bg-white rounded-[2.5rem] p-8 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] border border-slate-100 transition-all duration-500 hover:shadow-[0_50px_100px_-20px_rgba(45,108,234,0.15)]">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                   Daftar pesanan
                </h3>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <p className="font-black text-slate-800">{currentPlan.name}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase">Paket {duration} bulan</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{formatPrice(monthlyPrice * duration)}</p>
                      <p className="text-[10px] font-bold text-slate-400 line-through">{formatPrice(currentPlan.basePrice * duration)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                    <div className="flex items-center gap-1">
                      Nama Domain
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] line-through text-slate-400">Rp430.000</p>
                       <p className="text-slate-900">Rp0</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                    <p>1 bulan ekstra</p>
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] line-through text-slate-400">Rp113.900</p>
                       <p className="text-slate-900">Rp0</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                    <p>Proteksi Privasi Domain WHOIS</p>
                    <p className="text-slate-900">Rp0</p>
                  </div>

                  {backupActive && (
                    <div className="flex justify-between items-center text-sm font-bold text-slate-600">
                      <p>Backup harian otomatis</p>
                      <p className="text-slate-900">{formatPrice(99900 * duration)}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-50">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-bold text-slate-400 uppercase">Pajak</p>
                      <p className="text-slate-400 font-bold">-</p>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight mt-1">(Dihitung setelah informasi penagihan)</p>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-8 pt-4 border-t-2 border-slate-50">
                  <div>
                    <p className="text-[28px] font-black text-slate-900 leading-none">{formatPrice(subtotal)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-400 line-through">{formatPrice((currentPlan.basePrice * duration) + (backupActive ? 99900 * duration : 0))}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase">Total Subtotal</p>
                  </div>
                </div>

                <a href="#" className="block text-center text-sm font-black text-blue-600 hover:text-blue-700 mb-8">Punya Kode Kupon?</a>

                <button className="w-full py-5 bg-[#2d6cea] text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-95 text-lg">
                  Lanjutkan
                </button>

                <div className="mt-6 flex items-center justify-center gap-2 text-slate-400">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                   <span className="text-[11px] font-black uppercase tracking-wider">Jaminan 30 hari uang kembali</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;

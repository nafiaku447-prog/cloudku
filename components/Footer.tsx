
import React from 'react';

const Footer: React.FC = () => {
  const sections = [
    {
      title: 'Layanan',
      links: ['Web Hosting', 'WordPress Hosting', 'Cloud Hosting', 'Email Hosting', 'Domain', 'Website Builder']
    },
    {
      title: 'Perusahaan',
      links: ['Tentang Kami', 'Kontak Kami', 'Karier', 'Blog', 'Afiliasi', 'Testimonial']
    },
    {
      title: 'Bantuan',
      links: ['Pusat Bantuan', 'Tutorial', 'Komunitas', 'Ketentuan Layanan', 'Kebijakan Privasi', 'Sitemap']
    }
  ];

  return (
    <footer className="bg-slate-900 text-slate-300 pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#2d6cea] rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">HostModern</span>
            </div>
            <p className="mb-8 text-slate-400 max-w-sm">
              Misi kami adalah memberikan solusi web hosting yang terjangkau, cepat, dan aman bagi semua orang untuk membangun kehadiran online mereka.
            </p>
            <div className="flex items-center gap-4">
              {['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'].map(s => (
                <a key={s} href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#2d6cea] transition-colors">
                  <span className="sr-only">{s}</span>
                  <div className="w-5 h-5 bg-slate-400"></div> {/* Replace with actual icons */}
                </a>
              ))}
            </div>
          </div>

          {/* Links Cols */}
          {sections.map(section => (
            <div key={section.title}>
              <h4 className="text-white font-bold mb-6">{section.title}</h4>
              <ul className="space-y-4 text-sm">
                {section.links.map(link => (
                  <li key={link}>
                    <a href="#" className="hover:text-[#2d6cea] transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Payments & Legal */}
        <div className="border-t border-slate-800 pt-10 mt-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex flex-wrap justify-center gap-4">
              {['Visa', 'Mastercard', 'PayPal', 'GOPAY', 'OVO', 'DANA', 'BCA', 'BNI'].map(p => (
                <div key={p} className="px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold text-slate-400">
                  {p}
                </div>
              ))}
            </div>
            <div className="text-sm text-slate-500 text-center lg:text-right">
              <p>&copy; {new Date().getFullYear()} HostModern Hosting International. Seluruh hak cipta dilindungi undang-undang.</p>
              <p className="mt-1">Dibuat dengan ❤️ untuk performa website terbaik.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


import React from 'react';

const TrustSection: React.FC = () => {
  const partners = [
    { name: 'Google Cloud', logo: 'https://www.vectorlogo.zone/logos/google_cloud/google_cloud-ar21.svg' },
    { name: 'DigitalOcean', logo: 'https://www.vectorlogo.zone/logos/digitalocean/digitalocean-ar21.svg' },
    { name: 'Cloudflare', logo: 'https://www.vectorlogo.zone/logos/cloudflare/cloudflare-ar21.svg' },
    { name: 'GitHub', logo: 'https://logo.clearbit.com/github.com' },
    { name: 'Slack', logo: 'https://www.vectorlogo.zone/logos/slack/slack-ar21.svg' },
  ];

  return (
    <section className="py-16 bg-white overflow-hidden border-b border-slate-50">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Stats Part */}
          <div className="flex-shrink-0 text-center lg:text-left border-b lg:border-b-0 lg:border-r border-slate-100 pb-8 lg:pb-0 lg:pr-20">
            <div className="flex items-center justify-center lg:justify-start gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className="w-5 h-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-3xl font-[900] text-slate-900 mb-1 tracking-tight">10.000+</p>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">User Terdaftar</p>
          </div>

          {/* Logos Part */}
          <div className="flex-grow">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 text-center lg:text-left opacity-60">
              Infrastruktur Kami Didukung Oleh
            </p>
            <div className="flex flex-wrap justify-center lg:justify-between items-center gap-10 lg:gap-8">
              {partners.map((p) => (
                <div key={p.name} className="h-8 lg:h-10 transition-all duration-500 hover:scale-110">
                  <img 
                    src={p.logo} 
                    alt={p.name} 
                    className="h-full w-auto grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default TrustSection;

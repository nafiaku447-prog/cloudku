
import React from 'react';

const Comparison: React.FC = () => {
  const comparisonData = [
    { feature: 'Jumlah Website', personal: '1', bisnis: '100', enterprise: '300' },
    { feature: 'SSD NVMe Storage', personal: '50 GB', bisnis: '100 GB', enterprise: '200 GB' },
    { feature: 'Estimasi Kunjungan', personal: '10rb/bulan', bisnis: '100rb/bulan', enterprise: '200rb/bulan' },
    { feature: 'Domain Gratis', personal: false, bisnis: true, enterprise: true },
    { feature: 'Email Akun', personal: '1 Akun', bisnis: 'Tak Terbatas', enterprise: 'Tak Terbatas' },
    { feature: 'SSL Gratis', personal: true, bisnis: true, enterprise: true },
    { feature: 'Backup', personal: 'Mingguan', bisnis: 'Harian', enterprise: 'Harian' },
    { feature: 'Support', personal: 'Chat 24/7', bisnis: 'Chat 24/7', enterprise: 'Prioritas 24/7' },
  ];

  const Check = () => (
    <svg className="w-5 h-5 text-emerald-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
    </svg>
  );

  const Cross = () => (
    <svg className="w-5 h-5 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <section className="py-24 bg-slate-50">
      <div className="container mx-auto px-4 md:px-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Bandingkan Fitur Paket</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-2xl overflow-hidden shadow-xl border-collapse">
            <thead>
              <tr className="bg-[#2d6cea] text-white">
                <th className="py-6 px-8 text-left font-bold text-lg">Fitur Utama</th>
                <th className="py-6 px-4 text-center font-bold text-lg">Personal</th>
                <th className="py-6 px-4 text-center font-bold text-lg">Bisnis</th>
                <th className="py-6 px-4 text-center font-bold text-lg">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-5 px-8 font-medium text-slate-700">{row.feature}</td>
                  <td className="py-5 px-4 text-center text-slate-600">
                    {typeof row.personal === 'boolean' ? (row.personal ? <Check /> : <Cross />) : row.personal}
                  </td>
                  <td className="py-5 px-4 text-center text-slate-600 bg-blue-50/30">
                    {typeof row.bisnis === 'boolean' ? (row.bisnis ? <Check /> : <Cross />) : row.bisnis}
                  </td>
                  <td className="py-5 px-4 text-center text-slate-600">
                    {typeof row.enterprise === 'boolean' ? (row.enterprise ? <Check /> : <Cross />) : row.enterprise}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="py-8 px-8"></td>
                <td className="py-8 px-4 text-center">
                  <button className="text-[#2d6cea] font-bold text-sm hover:underline">Pilih Personal</button>
                </td>
                <td className="py-8 px-4 text-center bg-blue-50/30">
                  <button className="bg-[#2d6cea] text-white py-2 px-6 rounded-lg font-bold text-sm shadow-lg shadow-blue-500/20">Pilih Bisnis</button>
                </td>
                <td className="py-8 px-4 text-center">
                  <button className="text-[#2d6cea] font-bold text-sm hover:underline">Pilih Enterprise</button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Comparison;

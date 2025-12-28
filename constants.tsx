
import { HostingTier, Testimonial, FAQItem } from './types';

export const PRIMARY_COLOR = '#2d6cea';

export const HOSTING_TIERS: HostingTier[] = [
  {
    id: 'personal',
    name: 'Personal',
    priceMonthly: 25000,
    priceYearly: 10900,
    features: ['1 Website', '50 GB SSD Storage', '10.000 Kunjungan Bulanan', 'SSL Gratis Selamanya', '1 Akun Email'],
  },
  {
    id: 'bisnis',
    name: 'Bisnis',
    priceMonthly: 65000,
    priceYearly: 29900,
    features: ['100 Website', '100 GB SSD Storage', '100.000 Kunjungan Bulanan', 'SSL & Domain Gratis', 'Email Tanpa Batas', 'Backup Harian'],
    isPopular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 120000,
    priceYearly: 49900,
    features: ['300 Website', '200 GB NVMe Storage', '200.000 Kunjungan Bulanan', 'Bantuan Prioritas 24/7', 'Alamat IP Dedicated', 'Object Cache (Redis)'],
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Budi Santoso",
    role: "Fullstack Developer",
    image: "https://picsum.photos/seed/budi/100/100",
    rating: 5,
    comment: "HostModern benar-benar mengubah cara saya mengelola klien. Panelnya sangat intuitif dan kecepatannya luar biasa!"
  },
  {
    id: 2,
    name: "Siska Amelia",
    role: "Owner Toko Online",
    image: "https://picsum.photos/seed/siska/100/100",
    rating: 5,
    comment: "Layanan support-nya sangat membantu. Ketika website saya down karena kesalahan plugin, mereka memperbaikinya dalam hitungan menit."
  },
  {
    id: 3,
    name: "Andi Wijaya",
    role: "Blogger Profesional",
    image: "https://picsum.photos/seed/andi/100/100",
    rating: 4,
    comment: "Pindah dari provider lama ke sini adalah keputusan terbaik tahun ini. Fitur WordPress Optimized-nya benar-benar terasa dampaknya."
  }
];

export const FAQS: FAQItem[] = [
  {
    question: "Bagaimana cara memindahkan website saya ke HostModern?",
    answer: "Kami menyediakan layanan migrasi gratis untuk semua paket hosting. Cukup hubungi tim support kami setelah Anda membeli paket, dan kami akan menangani sisanya."
  },
  {
    question: "Apa itu Garansi 30 Hari Uang Kembali?",
    answer: "Jika Anda tidak puas dengan layanan kami dalam 30 hari pertama, Anda dapat meminta pengembalian dana penuh tanpa syarat apapun."
  },
  {
    question: "Apakah saya mendapatkan domain gratis?",
    answer: "Ya, domain gratis (.com, .net, .id, dll) tersedia untuk paket Bisnis dan Enterprise dengan durasi langganan minimal 12 bulan."
  },
  {
    question: "Apakah HostModern mendukung WordPress?",
    answer: "Tentu! Semua server kami dioptimalkan khusus untuk WordPress dengan LiteSpeed Cache dan Object Cache untuk kecepatan maksimal."
  },
  {
    question: "Apa perbedaan SSD dan NVMe?",
    answer: "NVMe adalah generasi terbaru media penyimpanan yang 7x lebih cepat daripada SSD standar, tersedia di paket Enterprise kami."
  }
];

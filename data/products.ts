export interface ProductSpec {
  label: string;
  value: string;
}

export interface ActivationStep {
  step: number;
  title: string;
  desc: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  priceNote?: string;
  isAvailable: boolean;
  image: string;
  description: string;
  tagline?: string;
  antiGravityCompatible?: boolean;
  features: string[];
  specifications: ProductSpec[];
  activationSteps: ActivationStep[];
}

export const products: Product[] = [
  {
    id: "gemini-pro",
    name: "Google Gemini Pro",
    category: "AI Tools",
    duration: "18 Bulan",
    price: 50000,
    priceNote: "per link aktivasi",
    isAvailable: true,
    antiGravityCompatible: true,
    tagline: "Model AI Multimodal Tercanggih & Kompatibel Penuh dengan Anti Gravity",
    image: "/images/assetgemini1.png",
    description:
      "Model AI tercanggih Google untuk kebutuhan analisis, coding, dan konten kreatif profesional. Mendukung integrasi menyeluruh dan dapat digunakan langsung untuk Anti Gravity.",
    features: [
      "Bisa & kompatibel untuk Anti Gravity IDE / Coding Agents",
      "Link aktivasi akun resmi tanpa sharing",
      "Masa aktif panjang 18 Bulan penuh",
      "Model multimodal Google 1.5 Pro & konteks 1-2 Juta token",
      "Bisa untuk email pribadi Anda sendiri",
      "Kecepatan komputasi tinggi tanpa antrean jam sibuk",
    ],
    specifications: [
      { label: "Dukungan AI Tools", value: "Bisa untuk Anti Gravity IDE, AI Agents, & Google Workspace" },
      { label: "Model AI", value: "Gemini 1.5 Pro (Multimodal: Teks, Kode, Gambar, Audio, Video)" },
      { label: "Masa Aktif", value: "18 Bulan Penuh" },
      { label: "Metode Aktivasi", value: "Link Aktivasi Akun (dikirim via Email / Website)" },
      { label: "Tipe Akun", value: "Email Pribadi (Bukan Akun Bersama / Sharing)" },
      { label: "Kapasitas Konteks", value: "Hingga 1.000.000+ Token (Sangat optimal untuk codebase besar)" },
      { label: "Kecepatan Respon", value: "Prioritas Komputasi Tinggi" },
      { label: "Perangkat", value: "Web Browser, Android, iOS, IDE & API Tooling" },
    ],
    activationSteps: [
      {
        step: 1,
        title: "Pilih Produk Gemini Pro",
        desc: "Pilih paket Google Gemini Pro 18 Bulan di website Lapak Digitara, lalu klik tombol 'Pesan Sekarang' atau masukkan ke keranjang belanja.",
      },
      {
        step: 2,
        title: "Lakukan Pembayaran",
        desc: "Lakukan transfer pembayaran sesuai nominal (Rp 50.000) melalui QRIS, Transfer Bank, atau E-Wallet yang tertera saat pemesanan.",
      },
      {
        step: 3,
        title: "Konfirmasi ke Admin",
        desc: "Kirimkan bukti pembayaran dan alamat email yang ingin diaktifkan ke Admin melalui WhatsApp untuk proses verifikasi kilat.",
      },
      {
        step: 4,
        title: "Link Dikirim ke Email / Website",
        desc: "Admin akan langsung mengirimkan link aktivasi resmi ke email Anda atau melalui chat WhatsApp/website. Cukup klik link tersebut dan akun Gemini Pro Anda langsung aktif 18 bulan!",
      },
    ],
  },
  {
    id: "chatgpt-plus",
    name: "ChatGPT Plus",
    category: "AI Tools",
    duration: "1 Bulan",
    price: 125000,
    priceNote: "per akun / bulan",
    isAvailable: true,
    tagline: "Akses Eksklusif GPT-4o, DALL-E 3 & Fitur Analitik Lanjutan",
    image: "/images/assetchatgpt1.png",
    description:
      "Akses penuh ke model unggulan GPT-4o dengan kecepatan prioritas, analisis data tingkat lanjut, browsing internet, dan kreasi visual instan.",
    features: [
      "Model GPT-4o & GPT-4 Turbo prioritas",
      "DALL-E 3 Image Generation tanpa batas harian ketat",
      "Fitur Web Browsing & Analisis Dokumen/Spreadsheet",
      "Akses prioritas tanpa antrean pada jam sibuk",
      "Akses GPTs kustom dari OpenAI GPT Store",
    ],
    specifications: [
      { label: "Model AI", value: "GPT-4o, GPT-4 Turbo, GPT-3.5" },
      { label: "Masa Aktif", value: "1 Bulan (30 Hari)" },
      { label: "Metode Aktivasi", value: "Akun Privat / Link Aktivasi" },
      { label: "Fitur Unggulan", value: "Voice Mode, DALL-E 3, Data Analysis, Custom GPTs" },
      { label: "Perangkat", value: "Web, Mac Desktop App, Windows App, iOS, Android" },
    ],
    activationSteps: [
      {
        step: 1,
        title: "Pilih Produk ChatGPT Plus",
        desc: "Pilih paket ChatGPT Plus 1 Bulan di website Lapak Digitara lalu klik tombol Pesan Sekarang atau Masukkan Keranjang.",
      },
      {
        step: 2,
        title: "Lakukan Pembayaran",
        desc: "Selesaikan transaksi pembayaran sebesar Rp 125.000 via metode pembayaran yang praktis (QRIS/Bank).",
      },
      {
        step: 3,
        title: "Konfirmasi ke Admin",
        desc: "Konfirmasikan bukti transfer Anda ke WhatsApp Admin Lapak Digitara.",
      },
      {
        step: 4,
        title: "Link / Akses Dikirim Langsung",
        desc: "Link atau kredensial akun privat akan dikirimkan ke email atau chat WhatsApp Anda dalam hitungan menit.",
      },
    ],
  },
  {
    id: "duolingo-super",
    name: "Duolingo Super",
    category: "Edukasi",
    duration: "1 Tahun",
    price: 99000,
    priceNote: "per tahun",
    isAvailable: true,
    tagline: "Belajar Bahasa Asing Nyaman Tanpa Iklan dengan Nyawa Tak Terbatas",
    image: "/images/assetduo1.png",
    description:
      "Tingkatkan kemampuan 40+ bahasa asing di platform edukasi nomor 1 dunia tanpa batasan nyawa dan bebas semua gangguan iklan selama 1 tahun penuh.",
    features: [
      "Masa aktif 1 Tahun penuh",
      "Nyawa tak terbatas (Unlimited Hearts)",
      "Bebas dari semua iklan",
      "Fitur tes kenaikan level tanpa batasan",
      "Dapat diaktifkan ke akun Duolingo pribadi Anda",
    ],
    specifications: [
      { label: "Layanan", value: "Duolingo Super Subscription" },
      { label: "Masa Aktif", value: "1 Tahun (12 Bulan Penuh)" },
      { label: "Metode Aktivasi", value: "Invite Link / Akun Pribadi" },
      { label: "Fitur", value: "Unlimited Hearts, Mistake Review, No Ads" },
      { label: "Perangkat", value: "Android, iOS, Web Browser" },
    ],
    activationSteps: [
      {
        step: 1,
        title: "Pilih Duolingo Super",
        desc: "Pilih paket 1 Tahun Duolingo Super lalu klik Pesan Sekarang.",
      },
      {
        step: 2,
        title: "Lakukan Pembayaran",
        desc: "Selesaikan pembayaran sebesar Rp 99.000 melalui metode yang tersedia.",
      },
      {
        step: 3,
        title: "Konfirmasi ke Admin",
        desc: "Kirimkan bukti pembayaran beserta username/email Duolingo Anda ke Admin.",
      },
      {
        step: 4,
        title: "Link Aktivasi Dikirimkan",
        desc: "Admin mengirimkan link aktivasi resmi ke email atau WhatsApp Anda. Buka link dan akun langsung upgrade ke Super!",
      },
    ],
  },
  {
    id: "canva-pro",
    name: "Canva Pro",
    category: "Desain",
    duration: "1 Tahun",
    price: 45000,
    priceNote: "per tahun",
    isAvailable: false,
    image: "/images/assetall1.png",
    description: "Akses jutaan template grafis premium, brand kit, dan background remover instan.",
    features: [
      "Semua elemen & template pro",
      "Magic Resizer & AI Tools",
      "Penyimpanan Cloud 1TB",
      "Fitur Brand Kit & Font kustom",
    ],
    specifications: [
      { label: "Layanan", value: "Canva Pro Subscription" },
      { label: "Masa Aktif", value: "1 Tahun" },
      { label: "Status Stock", value: "Habis Stock (Segera Hadir)" },
    ],
    activationSteps: [
      { step: 1, title: "Pilih Produk", desc: "Pilih produk Canva Pro." },
      { step: 2, title: "Lakukan Pembayaran", desc: "Selesaikan pembayaran." },
      { step: 3, title: "Konfirmasi Admin", desc: "Kirim bukti transfer ke Admin." },
      { step: 4, title: "Aktivasi Dikirim", desc: "Link aktivasi dikirimkan ke email." },
    ],
  },
  {
    id: "youtube-premium",
    name: "YouTube Premium",
    category: "Hiburan",
    duration: "1 Tahun",
    price: 75000,
    priceNote: "per tahun",
    isAvailable: false,
    image: "/images/assetall1.png",
    description: "Nonton video tanpa jeda iklan, pemutaran di latar belakang, dan YouTube Music.",
    features: [
      "Bebas iklan di semua video",
      "Background play di ponsel",
      "Download video offline HD",
      "Termasuk YouTube Music Premium",
    ],
    specifications: [
      { label: "Layanan", value: "YouTube Premium & Music" },
      { label: "Masa Aktif", value: "1 Tahun" },
      { label: "Status Stock", value: "Habis Stock (Segera Hadir)" },
    ],
    activationSteps: [
      { step: 1, title: "Pilih Produk", desc: "Pilih YouTube Premium." },
      { step: 2, title: "Lakukan Pembayaran", desc: "Selesaikan pembayaran." },
      { step: 3, title: "Konfirmasi Admin", desc: "Kirim bukti transfer ke Admin." },
      { step: 4, title: "Aktivasi Dikirim", desc: "Link aktivasi dikirimkan ke email." },
    ],
  },
  {
    id: "spotify-premium",
    name: "Spotify Premium",
    category: "Musik",
    duration: "3 Bulan",
    price: 50000,
    priceNote: "per 3 bulan",
    isAvailable: false,
    image: "/images/assetall1.png",
    description: "Dengarkan jutaan lagu tanpa jeda iklan dengan kualitas audio tertinggi dan skip tanpa batas.",
    features: [
      "Bebas iklan saat mendengarkan",
      "Unlimited skip lagu",
      "Kualitas audio sangat tinggi 320kbps",
      "Bisa download lagu offline",
    ],
    specifications: [
      { label: "Layanan", value: "Spotify Premium Individual" },
      { label: "Masa Aktif", value: "3 Bulan" },
      { label: "Status Stock", value: "Habis Stock (Segera Hadir)" },
    ],
    activationSteps: [
      { step: 1, title: "Pilih Produk", desc: "Pilih Spotify Premium." },
      { step: 2, title: "Lakukan Pembayaran", desc: "Selesaikan pembayaran." },
      { step: 3, title: "Konfirmasi Admin", desc: "Kirim bukti transfer ke Admin." },
      { step: 4, title: "Aktivasi Dikirim", desc: "Link aktivasi dikirimkan ke email." },
    ],
  },
  {
    id: "netflix-premium",
    name: "Netflix Premium UHD",
    category: "Streaming",
    duration: "1 Bulan",
    price: 65000,
    priceNote: "per bulan",
    isAvailable: false,
    image: "/images/assetall1.png",
    description: "Tonton film dan serial orisinal Netflix dengan resolusi 4K Ultra HD dan audio spasial.",
    features: [
      "Resolusi 4K Ultra HD + HDR",
      "Audio Spasial Netflix",
      "Bisa di Smart TV, Laptop, dan HP",
      "Profil privat berpinside",
    ],
    specifications: [
      { label: "Layanan", value: "Netflix Premium Ultra HD 4K" },
      { label: "Masa Aktif", value: "1 Bulan" },
      { label: "Status Stock", value: "Habis Stock (Segera Hadir)" },
    ],
    activationSteps: [
      { step: 1, title: "Pilih Produk", desc: "Pilih Netflix Premium." },
      { step: 2, title: "Lakukan Pembayaran", desc: "Selesaikan pembayaran." },
      { step: 3, title: "Konfirmasi Admin", desc: "Kirim bukti transfer ke Admin." },
      { step: 4, title: "Aktivasi Dikirim", desc: "Akses akun dikirimkan ke email/WhatsApp." },
    ],
  },
  {
    id: "claude-pro",
    name: "Claude Pro",
    category: "AI Tools",
    duration: "1 Bulan",
    price: 140000,
    priceNote: "per bulan",
    isAvailable: false,
    image: "/images/assetall1.png",
    description: "Model AI penalaran tingkat tinggi Claude 3.5 Sonnet untuk penulisan dan coding presisi.",
    features: [
      "Akses model Claude 3.5 Sonnet",
      "Batas pesan 5x lebih banyak",
      "Fitur Artifacts interaktif",
      "Prioritas akses waktu puncak",
    ],
    specifications: [
      { label: "Layanan", value: "Claude Pro Anthropic" },
      { label: "Masa Aktif", value: "1 Bulan" },
      { label: "Status Stock", value: "Habis Stock (Segera Hadir)" },
    ],
    activationSteps: [
      { step: 1, title: "Pilih Produk", desc: "Pilih Claude Pro." },
      { step: 2, title: "Lakukan Pembayaran", desc: "Selesaikan pembayaran." },
      { step: 3, title: "Konfirmasi Admin", desc: "Kirim bukti transfer ke Admin." },
      { step: 4, title: "Aktivasi Dikirim", desc: "Link aktivasi dikirimkan ke email/WhatsApp." },
    ],
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

import Navbar from "@/components/Navbar";
import HeroSlider from "@/components/HeroSlider";
import ProductSection from "@/components/ProductSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Content: Hero Section with Interactive Carousel + Our Products */}
      <main className="flex-1 flex flex-col justify-start">
        <HeroSlider />
        <ProductSection />
      </main>

      {/* Minimalist footer */}
      <footer className="w-full border-t border-neutral-100 py-8 text-center text-xs text-neutral-400 mt-auto bg-neutral-50/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-widest text-neutral-900 uppercase">DIGITARA</span>
            <span>— Solusi Akun AI & Digital Premium</span>
          </div>
          <p>© {new Date().getFullYear()} Lapak Digitara. Semua hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}

import { notFound } from "next/navigation";
import { products, getProductById } from "@/data/products";
import ProductDetailClient from "@/components/ProductDetailClient";
import Navbar from "@/components/Navbar";

export async function generateStaticParams() {
  return products.map((product) => ({
    id: product.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) {
    return {
      title: "Produk Tidak Ditemukan - Lapak Digitara",
    };
  }

  return {
    title: `${product.name} (${product.duration}) - Lapak Digitara`,
    description: product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white flex flex-col">
      {/* Navbar with localStorage Cart Drawer */}
      <Navbar />

      {/* Main Detail Content */}
      <main className="flex-1">
        <ProductDetailClient product={product} />
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-100 py-8 text-center text-xs text-neutral-400 mt-auto bg-neutral-50/50">
        <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-widest text-neutral-900 uppercase">
              DIGITARA
            </span>
            <span>— Solusi Akun AI & Digital Premium</span>
          </div>
          <p>© {new Date().getFullYear()} Lapak Digitara. Semua hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}

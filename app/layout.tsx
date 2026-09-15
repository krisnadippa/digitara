import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import CartToast from "@/components/CartToast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lapak Digitara - Akun AI & Layanan Digital Premium",
  description: "Beli Google Gemini Pro, ChatGPT Plus, Duolingo Super, dan layanan digital premium terpercaya.",
  icons: {
    icon: "/images/logo13.png",
    shortcut: "/images/logo13.png",
    apple: "/images/logo13.png",
  },
  openGraph: {
    title: "Lapak Digitara - Akun AI & Layanan Digital Premium",
    description: "Beli Google Gemini Pro, ChatGPT Plus, Duolingo Super, dan layanan digital premium terpercaya.",
    url: "https://lapakdigitara.com",
    siteName: "Lapak Digitara",
    images: [
      {
        url: "/images/logo13.png",
        width: 800,
        height: 600,
        alt: "Lapak Digitara Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
          <CartDrawer />
          <CartToast />
        </CartProvider>
      </body>
    </html>
  );
}


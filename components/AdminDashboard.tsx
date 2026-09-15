"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Order } from "@/lib/orders";
import { StockItem } from "@/lib/stocks";
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  Tag,
  RefreshCw,
  Search,
  Check,
  X,
  Trash2,
  ExternalLink,
  LogOut,
  Clock,
  AlertCircle,
  CheckCircle2,
  Copy,
  Plus,
  Menu,
  ArrowRight,
  TrendingUp,
  MessageCircle,
  Mail,
  ChevronRight,
  CheckCheck,
  ShieldCheck,
  User,
  SlidersHorizontal,
} from "lucide-react";

type NavTab = "overview" | "stocks" | "orders" | "products";

interface ProductMeta {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  image: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    waitingConfirmation: 0,
    paid: 0,
    pending: 0,
    totalRevenue: 0,
  });
  const [orderFilter, setOrderFilter] = useState<"all" | "waiting" | "paid" | "pending">("waiting");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderActionLoading, setOrderActionLoading] = useState<string | null>(null);

  // Stocks State
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [stockSummary, setStockSummary] = useState<Record<string, { available: number; used: number; total: number }>>({});
  const [productList, setProductList] = useState<ProductMeta[]>([]);
  const [stockFilterProduct, setStockFilterProduct] = useState<string>("all");
  const [stockFilterStatus, setStockFilterStatus] = useState<string>("all");
  const [stockSearch, setStockSearch] = useState("");
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedProductForAdd, setSelectedProductForAdd] = useState<string>("gemini-pro");
  const [newLinksInput, setNewLinksInput] = useState<string>("");
  const [newNotesInput, setNewNotesInput] = useState<string>("");
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);

  // General State
  const [loading, setLoading] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>("");
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, label = "Tersalin ke clipboard!") => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast(label, "success");
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Fetch all orders
  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setOrderStats(data.stats);
      }
    } catch (e) {
      console.error("Failed to fetch admin orders:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch stocks & products
  const fetchStocks = async () => {
    try {
      const res = await fetch("/api/admin/stocks");
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = await res.json();
      if (data.success) {
        setStocks(data.stocks);
        setStockSummary(data.summary || {});
        if (data.products) setProductList(data.products);
      }
    } catch (e) {
      console.error("Failed to fetch admin stocks:", e);
    }
  };

  const refreshAllData = async (silent = false) => {
    await Promise.all([fetchOrders(silent), fetchStocks()]);
    setLastRefreshedAt(
      new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );
  };

  useEffect(() => {
    refreshAllData();

    // Auto refresh every 20 seconds, only when tab is active (saves Vercel request limits)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshAllData(true);
      }
    }, 20000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshAllData(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handleLogout = async () => {
    if (!confirm("Keluar dari panel admin Lapak Digitara?")) return;
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch (err) {
      console.error("Error logging out:", err);
      window.location.href = "/admin/login";
    }
  };

  // Order Actions
  const handleApproveOrder = async (orderId: string) => {
    if (!confirm(`Konfirmasi pembayaran & alokasikan link aktivasi untuk Order #${orderId}?`)) {
      return;
    }
    setOrderActionLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Pesanan berhasil di-ACC & link aktivasi dialokasikan!", "success");
        refreshAllData(true);
      } else {
        alert(data.error || "Gagal meng-ACC pesanan.");
      }
    } catch (e) {
      console.error(e);
      showToast("Terjadi kesalahan jaringan saat ACC pesanan.", "error");
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    if (!confirm(`Tolak pesanan #${orderId}? Stok yang mungkin teralokasi akan dikembalikan ke gudang.`)) return;
    setOrderActionLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Pesanan #${orderId} telah ditolak.`, "success");
        refreshAllData(true);
      }
    } catch (e) {
      console.error(e);
      showToast("Gagal menolak pesanan.", "error");
    } finally {
      setOrderActionLoading(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`Hapus permanen pesanan #${orderId}?`)) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Pesanan #${orderId} berhasil dihapus.`, "success");
        refreshAllData(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Stock Actions
  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const links = newLinksInput
      .split(/[\r\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (links.length === 0) {
      alert("Harap masukkan minimal 1 link aktivasi.");
      return;
    }

    setIsSubmittingStock(true);
    try {
      const res = await fetch("/api/admin/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProductForAdd,
          links,
          notes: newNotesInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Berhasil menambahkan ${data.addedCount} stok baru!`, "success");
        setNewLinksInput("");
        setNewNotesInput("");
        setIsAddStockModalOpen(false);
        fetchStocks();
      } else {
        alert(data.error || "Gagal menambahkan stok.");
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan jaringan saat menambah stok.", "error");
    } finally {
      setIsSubmittingStock(false);
    }
  };

  const handleDeleteStock = async (stockId: string) => {
    if (!confirm(`Hapus link stok #${stockId}? Link ini akan dihapus dari gudang.`)) return;
    try {
      const res = await fetch(`/api/admin/stocks/${stockId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Link stok #${stockId} berhasil dihapus.`, "success");
        fetchStocks();
      } else {
        alert(data.error || "Gagal menghapus stok.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    if (orderFilter === "waiting" && order.status !== "WAITING_CONFIRMATION") return false;
    if (orderFilter === "paid" && order.status !== "PAID") return false;
    if (orderFilter === "pending" && order.status !== "PENDING") return false;

    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchId = order.orderId.toLowerCase().includes(q);
      const matchName = order.buyerName.toLowerCase().includes(q);
      const matchEmail = order.buyerEmail.toLowerCase().includes(q);
      const matchPhone = order.buyerWhatsapp.toLowerCase().includes(q);
      const matchProduct = order.items.some((it) => it.name.toLowerCase().includes(q));
      return matchId || matchName || matchEmail || matchPhone || matchProduct;
    }
    return true;
  });

  // Filtered Stocks
  const filteredStocks = stocks.filter((stk) => {
    if (stockFilterProduct !== "all" && stk.productId !== stockFilterProduct) return false;
    if (stockFilterStatus !== "all" && stk.status !== stockFilterStatus) return false;

    if (stockSearch.trim()) {
      const q = stockSearch.toLowerCase();
      const matchProd = stk.productName.toLowerCase().includes(q);
      const matchLink = stk.activationLink.toLowerCase().includes(q);
      const matchOrder = stk.orderId?.toLowerCase().includes(q);
      const matchEmail = stk.buyerEmail?.toLowerCase().includes(q);
      return matchProd || matchLink || matchOrder || matchEmail;
    }
    return true;
  });

  // Total Available Stock
  const totalAvailableStockCount = Object.values(stockSummary).reduce(
    (sum, cur) => sum + (cur.available || 0),
    0
  );

  const parsedLinksCount = newLinksInput
    .split(/[\r\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0).length;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col md:flex-row antialiased font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-bottom-5 border ${
            toastMessage.type === "success"
              ? "bg-white text-emerald-800 border-emerald-200/80 shadow-emerald-500/10"
              : "bg-white text-rose-800 border-rose-200/80 shadow-rose-500/10"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3.5 bg-white border-b border-slate-200/80 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg tracking-wider text-slate-950 font-sans">DIGITARA</span>
            <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              Admin
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshAllData()}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION (CLEAN WHITE) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 shadow-[2px_0_12px_rgba(0,0,0,0.02)] ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header & Brand */}
        <div>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-neutral-950 flex items-center justify-center font-black text-white text-base shadow-sm">
                D
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base tracking-wider text-slate-950 uppercase font-sans">
                    DIGITARA
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="text-[11px] text-slate-400 font-semibold tracking-wider uppercase block">
                  Admin Panel
                </span>
              </div>
            </Link>

            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <div className="p-4">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 block mb-2">
              Menu Utama
            </span>

            <nav className="space-y-1.5">
              <button
                onClick={() => {
                  setActiveTab("overview");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "overview"
                    ? "bg-neutral-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Ringkasan Bisnis</span>
                </div>
                {orderStats.waitingConfirmation > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === "overview" ? "bg-amber-400 text-neutral-950" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {orderStats.waitingConfirmation} ACC
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab("stocks");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "stocks"
                    ? "bg-neutral-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Boxes className="w-4 h-4 shrink-0" />
                  <span>Kelola Stok & Aktivasi</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "stocks" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {totalAvailableStockCount} link
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("orders");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "orders"
                    ? "bg-neutral-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>Pesanan & Transaksi</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "orders" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("products");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "products"
                    ? "bg-neutral-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Tag className="w-4 h-4 shrink-0" />
                  <span>Katalog Produk</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "products" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {productList.length}
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer: Profile & Storefront */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors border border-slate-200/80 shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Lihat Toko Pelanggan</span>
          </Link>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white shadow-2xs flex items-center justify-center text-xs font-black text-slate-800 border border-slate-200">
                AD
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">Admin Lapak</p>
                <p className="text-[10px] text-emerald-600 font-bold">Super Admin</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Keluar dari panel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs"
        />
      )}

      {/* MAIN CONTENT AREA (CLEAN WHITE / SLATE) */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1 font-medium">
              <span>Panel Kendali</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-700 font-semibold">
                {activeTab === "overview" && "Dashboard Ringkasan"}
                {activeTab === "stocks" && "Inventaris Stok & Aktivasi"}
                {activeTab === "orders" && "Daftar Pesanan & Pembayaran"}
                {activeTab === "products" && "Katalog Produk"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              {activeTab === "overview" && "Dashboard Ringkasan"}
              {activeTab === "stocks" && "Kelola Stok Link Aktivasi"}
              {activeTab === "orders" && "Daftar Pesanan & Pembayaran"}
              {activeTab === "products" && "Katalog & Status Stok"}
            </h1>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {activeTab === "stocks" && (
              <button
                onClick={() => setIsAddStockModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs transition-all shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Tambah Stok Link</span>
              </button>
            )}

            <button
              onClick={() => refreshAllData()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors border border-slate-200 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? "animate-spin text-emerald-600" : ""}`} />
              <span>Refresh {lastRefreshedAt ? `(${lastRefreshedAt})` : ""}</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW / RINGKASAN */}
        {/* ======================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Waiting Confirmation Alert Banner */}
            {orderStats.waitingConfirmation > 0 && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-amber-950">
                      {orderStats.waitingConfirmation} Pesanan Menunggu ACC Anda!
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Pelanggan telah mengirim konfirmasi transfer. Cek mutasi Anda dan klik ACC untuk mengirimkan link aktivasi otomatis.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("orders");
                    setOrderFilter("waiting");
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs transition-colors shrink-0 shadow-xs"
                >
                  Lihat Pesanan Menunggu &rarr;
                </button>
              </div>
            )}

            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Omset
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-950">
                  {formatRupiah(orderStats.totalRevenue)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{orderStats.paid} transaksi lunas</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Menunggu ACC
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-600">
                  {orderStats.waitingConfirmation}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Perlu tindakan verifikasi</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Stok Link Siap Kirim
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <Boxes className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-700">
                  {totalAvailableStockCount}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Tersedia di gudang digital</p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Transaksi
                  </span>
                  <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-950">
                  {orderStats.totalOrders}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Semua status pemesanan</p>
              </div>
            </div>

            {/* Quick Product Stock Health */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">Status Stok Produk Digital</h3>
                  <p className="text-xs text-slate-500">Ringkasan stok link aktivasi siap kirim per produk</p>
                </div>
                <button
                  onClick={() => setActiveTab("stocks")}
                  className="text-xs font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                >
                  <span>Kelola Inventaris Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {productList.slice(0, 3).map((p) => {
                  const summary = stockSummary[p.id] || { available: 0, used: 0, total: 0 };

                  return (
                    <div
                      key={p.id}
                      className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                              <Image src={p.image} alt={p.name} width={34} height={34} className="object-contain" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-950">{p.name}</h4>
                              <p className="text-xs text-slate-500 font-medium">
                                {formatRupiah(p.price)} / {p.duration}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                              summary.available > 0
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                                : "bg-rose-50 text-rose-700 border-rose-200/80"
                            }`}
                          >
                            {summary.available > 0 ? "Tersedia" : "Habis"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 mb-4">
                          <span className="text-slate-500 font-medium">Stok Link Tersedia:</span>
                          <span
                            className={`font-mono font-bold text-sm ${
                              summary.available > 0 ? "text-emerald-700" : "text-slate-400"
                            }`}
                          >
                            {summary.available} link
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedProductForAdd(p.id);
                          setIsAddStockModalOpen(true);
                        }}
                        className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>+ Tambah Stok Link</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders Preview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">Pesanan Masuk Terkini</h3>
                  <p className="text-xs text-slate-500">5 transaksi terakhir yang tercatat di sistem</p>
                </div>
                <button
                  onClick={() => setActiveTab("orders")}
                  className="text-xs font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                >
                  <span>Semua Pesanan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
                {orders.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs font-medium">
                    Belum ada pesanan yang masuk ke sistem.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3.5 px-4">Order ID</th>
                          <th className="py-3.5 px-4">Pembeli</th>
                          <th className="py-3.5 px-4">Produk</th>
                          <th className="py-3.5 px-4">Total</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orders.slice(0, 5).map((ord) => (
                          <tr key={ord.orderId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-950">
                              #{ord.orderId}
                            </td>
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900">{ord.buyerName}</p>
                              <p className="text-[11px] text-slate-500">{ord.buyerEmail}</p>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">
                              {ord.items.map((it) => `${it.name} (x${it.quantity})`).join(", ")}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-950">
                              {formatRupiah(ord.totalAmount)}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                  ord.status === "PAID"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                                    : ord.status === "WAITING_CONFIRMATION"
                                    ? "bg-amber-50 text-amber-800 border-amber-200/80 animate-pulse"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}
                              >
                                {ord.status === "WAITING_CONFIRMATION" ? "Menunggu ACC" : ord.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {ord.status === "WAITING_CONFIRMATION" ? (
                                <button
                                  onClick={() => handleApproveOrder(ord.orderId)}
                                  disabled={orderActionLoading === ord.orderId}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-xs"
                                >
                                  {orderActionLoading === ord.orderId ? "Memproses..." : "ACC Kilat"}
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveTab("orders");
                                    setOrderSearch(ord.orderId);
                                  }}
                                  className="text-slate-600 hover:text-slate-950 font-bold text-xs"
                                >
                                  Lihat Detail
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: KELOLA STOK & AKTIVASI */}
        {/* ======================================================== */}
        {activeTab === "stocks" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Product Stock Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {productList.map((prod) => {
                const sum = stockSummary[prod.id] || { available: 0, used: 0, total: 0 };
                const isSelected = stockFilterProduct === prod.id;

                return (
                  <div
                    key={prod.id}
                    onClick={() => setStockFilterProduct(isSelected ? "all" : prod.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-slate-950 text-white border-slate-950 shadow-md"
                        : "bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isSelected ? "bg-white/10 border-white/20" : "bg-slate-50 border-slate-100"
                          }`}
                        >
                          <Image src={prod.image} alt={prod.name} width={26} height={26} className="object-contain" />
                        </div>
                        <div>
                          <h4
                            className={`font-bold text-xs truncate max-w-[150px] ${
                              isSelected ? "text-white" : "text-slate-950"
                            }`}
                          >
                            {prod.name}
                          </h4>
                          <span className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                            {prod.duration}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForAdd(prod.id);
                          setIsAddStockModalOpen(true);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isSelected
                            ? "bg-white/20 text-white border-white/30 hover:bg-white/30"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                        title="Tambah Stok Produk Ini"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>

                    <div
                      className={`flex items-center justify-between text-xs pt-2 border-t ${
                        isSelected ? "border-white/10" : "border-slate-100"
                      }`}
                    >
                      <span className={isSelected ? "text-slate-300" : "text-slate-500"}>Tersedia:</span>
                      <span
                        className={`font-mono font-bold text-sm ${
                          sum.available > 0
                            ? isSelected
                              ? "text-emerald-300"
                              : "text-emerald-700"
                            : isSelected
                            ? "text-rose-300"
                            : "text-slate-400"
                        }`}
                      >
                        {sum.available} link
                      </span>
                      <span className={`text-[10px] ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                        ({sum.used} terpakai)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter and Search Action Bar */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mr-1">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filter:</span>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setStockFilterStatus("all")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      stockFilterStatus === "all" ? "bg-white text-slate-950 shadow-2xs" : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    Semua ({stocks.length})
                  </button>
                  <button
                    onClick={() => setStockFilterStatus("AVAILABLE")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      stockFilterStatus === "AVAILABLE"
                        ? "bg-white text-emerald-800 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    Tersedia ({stocks.filter((s) => s.status === "AVAILABLE").length})
                  </button>
                  <button
                    onClick={() => setStockFilterStatus("USED")}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      stockFilterStatus === "USED"
                        ? "bg-white text-slate-950 shadow-2xs font-extrabold"
                        : "text-slate-600 hover:text-slate-950"
                    }`}
                  >
                    Terpakai ({stocks.filter((s) => s.status === "USED").length})
                  </button>
                </div>

                {/* Product Filter Dropdown */}
                <select
                  value={stockFilterProduct}
                  onChange={(e) => setStockFilterProduct(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold focus:outline-hidden focus:border-slate-400"
                >
                  <option value="all">Semua Produk</option>
                  {productList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari link, order ID, email pembeli..."
                  value={stockSearch}
                  onChange={(e) => setStockSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Stocks Table (Crisp White) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs">
              {filteredStocks.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">
                  Tidak ada data link aktivasi yang cocok dengan filter atau pencarian.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3.5 px-4">Produk</th>
                        <th className="py-3.5 px-4">Link Aktivasi</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Alokasi Order & Pembeli</th>
                        <th className="py-3.5 px-4">Tanggal Input</th>
                        <th className="py-3.5 px-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStocks.map((stk) => (
                        <tr key={stk.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-slate-950 block">{stk.productName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {stk.id}</span>
                          </td>
                          <td className="py-3.5 px-4 max-w-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-slate-900 font-medium text-xs truncate max-w-[260px] bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                                {stk.activationLink}
                              </span>
                              <button
                                onClick={() => copyToClipboard(stk.activationLink, "Link aktivasi berhasil disalin!")}
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                title="Salin Link"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={stk.activationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                title="Buka Link di Tab Baru"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            {stk.notes && (
                              <span className="text-[10px] text-slate-500 mt-1 block italic font-medium">
                                Catatan: {stk.notes}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                stk.status === "AVAILABLE"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {stk.status === "AVAILABLE" ? "Tersedia" : "Terpakai"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {stk.status === "USED" && stk.orderId ? (
                              <div>
                                <span className="font-mono font-bold text-slate-900 block">
                                  #{stk.orderId}
                                </span>
                                {stk.buyerEmail && (
                                  <span className="text-[11px] text-slate-500 block truncate">
                                    {stk.buyerEmail}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {new Date(stk.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {stk.status === "AVAILABLE" ? (
                              <button
                                onClick={() => handleDeleteStock(stk.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Hapus Link Ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Terkunci</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: PESANAN & TRANSAKSI */}
        {/* ======================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter Tabs & Search */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setOrderFilter("waiting")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    orderFilter === "waiting"
                      ? "bg-amber-500 text-white shadow-xs font-extrabold"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Menunggu ACC ({orderStats.waitingConfirmation})</span>
                </button>
                <button
                  onClick={() => setOrderFilter("paid")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                    orderFilter === "paid"
                      ? "bg-emerald-600 text-white shadow-xs font-extrabold"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Lunas ({orderStats.paid})</span>
                </button>
                <button
                  onClick={() => setOrderFilter("pending")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    orderFilter === "pending"
                      ? "bg-slate-900 text-white shadow-xs font-extrabold"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pending ({orderStats.pending})
                </button>
                <button
                  onClick={() => setOrderFilter("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    orderFilter === "all"
                      ? "bg-slate-900 text-white shadow-xs font-extrabold"
                      : "bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semua ({orders.length})
                </button>
              </div>

              {/* Order Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari ID, nama pembeli, email, HP..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Orders List Cards */}
            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/90 font-medium">
                Tidak ada pesanan pada filter ini.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((ord) => {
                  const isWaiting = ord.status === "WAITING_CONFIRMATION";
                  const isPaid = ord.status === "PAID";

                  return (
                    <div
                      key={ord.orderId}
                      className={`p-5 rounded-2xl border transition-all ${
                        isWaiting
                          ? "bg-white border-amber-300 shadow-md ring-2 ring-amber-500/10"
                          : "bg-white border-slate-200/90 shadow-2xs"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-base font-black text-slate-950">
                            #{ord.orderId}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              isPaid
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                                : isWaiting
                                ? "bg-amber-50 text-amber-900 border-amber-300 animate-pulse"
                                : ord.status === "REJECTED"
                                ? "bg-rose-50 text-rose-700 border-rose-200/80"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {isWaiting ? "Menunggu ACC Admin" : ord.status}
                          </span>

                          <span className="text-[11px] text-slate-500 font-medium">
                            {new Date(ord.createdAt).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-start lg:self-auto">
                          {isWaiting && (
                            <button
                              onClick={() => handleApproveOrder(ord.orderId)}
                              disabled={orderActionLoading === ord.orderId}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                            >
                              <CheckCheck className="w-4 h-4 stroke-[2.5]" />
                              <span>{orderActionLoading === ord.orderId ? "Memproses..." : "ACC & Kirim Link"}</span>
                            </button>
                          )}

                          <a
                            href={`https://wa.me/${ord.buyerWhatsapp?.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                              `Halo kak ${ord.buyerName}, ini dari Admin Lapak Digitara terkait pesanan #${ord.orderId}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-emerald-700 text-xs font-bold transition-colors border border-slate-200 flex items-center gap-1.5"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          {isWaiting && (
                            <button
                              onClick={() => handleRejectOrder(ord.orderId)}
                              disabled={orderActionLoading === ord.orderId}
                              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors border border-rose-200/70"
                            >
                              Tolak
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteOrder(ord.orderId)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Pesanan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Order Details Body */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            Informasi Pembeli
                          </span>
                          <p className="text-xs font-bold text-slate-900">{ord.buyerName}</p>
                          <p className="text-xs text-slate-500 font-medium">{ord.buyerEmail}</p>
                          <p className="text-xs text-slate-500 font-medium">{ord.buyerWhatsapp || "-"}</p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            Produk Dipesan
                          </span>
                          {ord.items.map((it, idx) => (
                            <div key={idx} className="text-xs text-slate-700 mb-0.5">
                              <span className="font-bold text-slate-900">{it.name}</span>{" "}
                              <span className="text-slate-500">({it.duration})</span> &times;{" "}
                              <span className="font-mono font-bold text-slate-950">{it.quantity}</span>
                            </div>
                          ))}
                          <div className="mt-1.5 font-mono text-sm font-black text-slate-950">
                            Total: {formatRupiah(ord.totalAmount)}
                          </div>
                        </div>

                        {/* Activation Link Section */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            Link Aktivasi Terkirim
                          </span>
                          {ord.activationLink ? (
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-mono text-slate-900 font-semibold truncate flex-1">
                                  {ord.activationLink}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(ord.activationLink, "Link aktivasi tersalin!")}
                                  className="p-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs"
                                  title="Salin Link"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                              {ord.emailSent && (
                                <span className="text-[10px] text-emerald-700 mt-1 flex items-center gap-1 font-bold">
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>Email aktivasi sudah terkirim ke pembeli</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic font-medium">
                              Belum dialokasikan (menunggu ACC)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: KATALOG PRODUK */}
        {/* ======================================================== */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {productList.map((p) => {
                const sum = stockSummary[p.id] || { available: 0, used: 0, total: 0 };

                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                          {p.category}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                            sum.available > 0
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                              : "bg-rose-50 text-rose-700 border-rose-200/80"
                          }`}
                        >
                          {sum.available > 0 ? `Tersedia (${sum.available})` : "Habis"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                        <div className="relative w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <Image src={p.image} alt={p.name} width={36} height={36} className="object-contain" />
                        </div>
                        <div>
                          <h3 className="font-black text-sm text-slate-950">{p.name}</h3>
                          <p className="text-xs font-mono text-slate-700 font-bold">
                            {formatRupiah(p.price)} / {p.duration}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/product/${p.id}`}
                        target="_blank"
                        className="text-xs text-slate-600 hover:text-slate-950 font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>Halaman Produk</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </Link>

                      <button
                        onClick={() => {
                          setSelectedProductForAdd(p.id);
                          setActiveTab("stocks");
                          setIsAddStockModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-2xs"
                      >
                        + Tambah Link
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: TAMBAH STOK LINK AKTIVASI (CLEAN WHITE) */}
      {/* ======================================================== */}
      {isAddStockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">Tambah Stok Link Aktivasi</h3>
                  <p className="text-xs text-slate-500">Masukkan satu atau banyak link aktivasi sekaligus</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddStockModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStockSubmit} className="space-y-4">
              {/* Product Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Produk</label>
                <select
                  value={selectedProductForAdd}
                  onChange={(e) => setSelectedProductForAdd(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                >
                  {productList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.duration})
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulk Activation Links Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Link Aktivasi (1 per baris untuk banyak link)
                  </label>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                    {parsedLinksCount} link terdeteksi
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={newLinksInput}
                  onChange={(e) => setNewLinksInput(e.target.value)}
                  placeholder={`https://one.google.com/explore-plan/gemini-link-1\nhttps://one.google.com/explore-plan/gemini-link-2\nhttps://one.google.com/explore-plan/gemini-link-3`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Format: Cukup paste link aktivasi dari Excel / Notepad. Setiap baris baru otomatis dihitung sebagai 1 unit stok.
                </p>
              </div>

              {/* Batch / Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Catatan Batch (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Batch Google Gemini 18 Bulan Resmi"
                  value={newNotesInput}
                  onChange={(e) => setNewNotesInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStockModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingStock || parsedLinksCount === 0}
                  className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {isSubmittingStock ? "Menyimpan..." : `Simpan ${parsedLinksCount} Stok Baru`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

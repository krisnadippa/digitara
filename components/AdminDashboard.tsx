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
  Percent,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Sparkles,
} from "lucide-react";

type NavTab = "overview" | "stocks" | "orders" | "products" | "discounts";

interface ProductMeta {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  duration: string;
  image: string;
  isAvailable?: boolean;
  priceNote?: string;
}

interface DiscountItem {
  id: string;
  code: string;
  name: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrder: number;
  maxDiscount?: number;
  isActive: boolean;
  usedCount: number;
  createdAt: string;
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

  // Discounts State
  const [discounts, setDiscounts] = useState<DiscountItem[]>([]);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountItem | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [discountName, setDiscountName] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<string>("");
  const [discountMinOrder, setDiscountMinOrder] = useState<string>("0");
  const [discountMaxDiscount, setDiscountMaxDiscount] = useState<string>("");
  const [discountIsActive, setDiscountIsActive] = useState(true);
  const [isSubmittingDiscount, setIsSubmittingDiscount] = useState(false);

  // Edit Product Pricing State
  const [isEditPriceModalOpen, setIsEditPriceModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMeta | null>(null);
  const [normalPriceVal, setNormalPriceVal] = useState<string>("");
  const [discountAmountVal, setDiscountAmountVal] = useState<string>("");
  const [finalPriceVal, setFinalPriceVal] = useState<string>("");
  const [editPriceNoteVal, setEditPriceNoteVal] = useState<string>("");
  const [editIsAvailableVal, setEditIsAvailableVal] = useState<boolean>(true);
  const [isSubmittingPrice, setIsSubmittingPrice] = useState(false);

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

  // Fetch discounts
  const fetchDiscounts = async () => {
    try {
      const res = await fetch("/api/admin/discounts");
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.discounts)) {
        setDiscounts(data.discounts);
      }
    } catch (e) {
      console.error("Failed to fetch admin discounts:", e);
    }
  };

  const refreshAllData = async (silent = false) => {
    await Promise.all([fetchOrders(silent), fetchStocks(), fetchDiscounts()]);
    setLastRefreshedAt(
      new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    );
  };

  useEffect(() => {
    refreshAllData();

    // Auto refresh every 5 seconds, only when tab is active for near real-time order notifications
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshAllData(true);
      }
    }, 5000);

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

  // Discount Actions
  const handleOpenCreateDiscount = () => {
    setEditingDiscount(null);
    setDiscountCode("");
    setDiscountName("");
    setDiscountType("PERCENTAGE");
    setDiscountValue("");
    setDiscountMinOrder("0");
    setDiscountMaxDiscount("");
    setDiscountIsActive(true);
    setIsDiscountModalOpen(true);
  };

  const handleOpenEditDiscount = (dsc: DiscountItem) => {
    setEditingDiscount(dsc);
    setDiscountCode(dsc.code);
    setDiscountName(dsc.name);
    setDiscountType(dsc.type);
    setDiscountValue(String(dsc.value));
    setDiscountMinOrder(String(dsc.minOrder || 0));
    setDiscountMaxDiscount(dsc.maxDiscount ? String(dsc.maxDiscount) : "");
    setDiscountIsActive(dsc.isActive);
    setIsDiscountModalOpen(true);
  };

  const handleSaveDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountCode.trim() || !discountName.trim() || !discountValue) {
      alert("Harap lengkapi kode kupon, nama promo, dan nilai diskon.");
      return;
    }
    setIsSubmittingDiscount(true);
    try {
      const payload = {
        code: discountCode.trim().toUpperCase(),
        name: discountName.trim(),
        type: discountType,
        value: Number(discountValue),
        minOrder: Number(discountMinOrder) || 0,
        maxDiscount: discountMaxDiscount ? Number(discountMaxDiscount) : undefined,
        isActive: discountIsActive,
      };

      let res;
      if (editingDiscount) {
        res = await fetch(`/api/admin/discounts/${editingDiscount.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/discounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Kupon diskon berhasil disimpan!", "success");
        setIsDiscountModalOpen(false);
        fetchDiscounts();
      } else {
        alert(data.error || "Gagal menyimpan kupon diskon.");
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan jaringan saat menyimpan kupon.", "error");
    } finally {
      setIsSubmittingDiscount(false);
    }
  };

  const handleToggleDiscountActive = async (dsc: DiscountItem) => {
    try {
      const res = await fetch(`/api/admin/discounts/${dsc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !dsc.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Kupon ${dsc.code} sekarang ${!dsc.isActive ? "Aktif" : "Nonaktif"}.`, "success");
        fetchDiscounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDiscount = async (id: string, code: string) => {
    if (!confirm(`Hapus kupon diskon ${code}?`)) return;
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || `Kupon ${code} berhasil dihapus.`, "success");
        fetchDiscounts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Product Pricing Actions
  const handleOpenEditProduct = (prod: ProductMeta) => {
    setEditingProduct(prod);
    setEditPriceNoteVal(prod.priceNote || "");
    setEditIsAvailableVal(prod.isAvailable !== undefined ? prod.isAvailable : true);

    if (prod.originalPrice && prod.originalPrice > prod.price) {
      setNormalPriceVal(String(prod.originalPrice));
      setDiscountAmountVal(String(prod.originalPrice - prod.price));
      setFinalPriceVal(String(prod.price));
    } else {
      setNormalPriceVal(String(prod.price));
      setDiscountAmountVal("");
      setFinalPriceVal(String(prod.price));
    }
    setIsEditPriceModalOpen(true);
  };

  const handleNormalPriceChange = (val: string) => {
    setNormalPriceVal(val);
    const normal = Number(val) || 0;
    const disc = Number(discountAmountVal) || 0;
    if (disc > 0 && normal >= disc) {
      setFinalPriceVal(String(normal - disc));
    } else if (disc === 0) {
      setFinalPriceVal(val);
    }
  };

  const handleDiscountAmountChange = (val: string) => {
    setDiscountAmountVal(val);
    const normal = Number(normalPriceVal) || 0;
    const disc = Number(val) || 0;
    if (disc > 0) {
      const final = Math.max(0, normal - disc);
      setFinalPriceVal(String(final));
    } else {
      setFinalPriceVal(String(normal));
    }
  };

  const handleFinalPriceChange = (val: string) => {
    setFinalPriceVal(val);
    const normal = Number(normalPriceVal) || 0;
    const final = Number(val) || 0;
    if (normal > final) {
      setDiscountAmountVal(String(normal - final));
    } else {
      setDiscountAmountVal("");
    }
  };

  const handleQuickDiscount = (amount: number) => {
    const normal = Number(normalPriceVal) || 0;
    if (amount <= 0) {
      setDiscountAmountVal("");
      setFinalPriceVal(String(normal));
    } else {
      setDiscountAmountVal(String(amount));
      setFinalPriceVal(String(Math.max(0, normal - amount)));
    }
  };

  const handleSaveProductPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmittingPrice(true);

    const normal = Number(normalPriceVal) || 0;
    const final = Number(finalPriceVal) || normal;
    const disc = Number(discountAmountVal) || 0;

    let originalPriceToSave: number | undefined = undefined;
    if (disc > 0 && normal > final) {
      originalPriceToSave = normal;
    }

    const calculatedDiscountPercent =
      originalPriceToSave && originalPriceToSave > final
        ? Math.round(((originalPriceToSave - final) / originalPriceToSave) * 100)
        : undefined;

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: editingProduct.id,
          price: final,
          originalPrice: originalPriceToSave,
          priceNote: editPriceNoteVal,
          isAvailable: editIsAvailableVal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Optimistic instant update
        setProductList((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  price: final,
                  originalPrice: originalPriceToSave,
                  discountPercent: calculatedDiscountPercent,
                  priceNote: editPriceNoteVal,
                  isAvailable: editIsAvailableVal,
                }
              : p
          )
        );

        showToast(`Harga produk ${editingProduct.name} berhasil disimpan!`, "success");
        setIsEditPriceModalOpen(false);
        fetchStocks();
      } else {
        alert(data.error || "Gagal memperbarui harga produk.");
      }
    } catch (err) {
      console.error(err);
      showToast("Terjadi kesalahan jaringan saat menyimpan harga.", "error");
    } finally {
      setIsSubmittingPrice(false);
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
                  <span>Katalog & Harga</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "products" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {productList.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("discounts");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "discounts"
                    ? "bg-neutral-950 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Percent className="w-4 h-4 shrink-0" />
                  <span>Kupon & Diskon</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "discounts"
                      ? "bg-white/20 text-white"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  }`}
                >
                  {discounts.filter((d) => d.isActive).length} aktif
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
                {activeTab === "products" && "Katalog & Pengaturan Harga"}
                {activeTab === "discounts" && "Kupon & Diskon Promo"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
              {activeTab === "overview" && "Dashboard Ringkasan"}
              {activeTab === "stocks" && "Kelola Stok Link Aktivasi"}
              {activeTab === "orders" && "Daftar Pesanan & Pembayaran"}
              {activeTab === "products" && "Katalog & Pengaturan Harga"}
              {activeTab === "discounts" && "Kelola Kupon & Promo Diskon"}
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

            {activeTab === "discounts" && (
              <button
                onClick={handleOpenCreateDiscount}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs transition-all shadow-xs active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ Buat Kupon Baru</span>
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
        {/* TAB 4: KATALOG PRODUK & HARGA */}
        {/* ======================================================== */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h3 className="font-black text-sm text-slate-900">Kelola Harga & Promo Produk</h3>
                <p className="text-xs text-slate-500">Ubah harga jual, pasang harga coret / promo diskon, dan atur ketersediaan produk.</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                {productList.length} Produk Terdaftar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {productList.map((p) => {
                const sum = stockSummary[p.id] || { available: 0, used: 0, total: 0 };
                const isManuallyDisabled = p.isAvailable === false;

                return (
                  <div
                    key={p.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                          {p.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isManuallyDisabled && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              Dinonaktifkan
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${
                              sum.available > 0 && !isManuallyDisabled
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                                : "bg-rose-50 text-rose-700 border-rose-200/80"
                            }`}
                          >
                            {sum.available > 0 && !isManuallyDisabled
                              ? `Stok Link (${sum.available})`
                              : isManuallyDisabled
                              ? "Toko Off"
                              : "Stok Habis"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 mb-4">
                        <div className="relative w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <Image src={p.image} alt={p.name} width={42} height={42} className="object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-sm text-slate-950 truncate">{p.name}</h3>
                          <span className="text-xs text-slate-500 font-medium block">{p.duration}</span>

                          {/* Dynamic Pricing Info */}
                          <div className="mt-1.5">
                            {p.originalPrice && p.originalPrice > p.price && (
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-xs text-slate-400 line-through">
                                  {formatRupiah(p.originalPrice)}
                                </span>
                                {p.discountPercent && (
                                  <span className="text-[9px] font-extrabold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200/60">
                                    Hemat {p.discountPercent}%
                                  </span>
                                )}
                              </div>
                            )}
                            <p className="text-sm font-mono text-slate-950 font-black">
                              {formatRupiah(p.price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleOpenEditProduct(p)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200/70"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Ubah Harga & Promo</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedProductForAdd(p.id);
                          setActiveTab("stocks");
                          setIsAddStockModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-2xs shrink-0"
                        title="Tambah link aktivasi ke stok"
                      >
                        + Stok
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: KUPON & DISKON PROMO */}
        {/* ======================================================== */}
        {activeTab === "discounts" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Total Kupon Terdaftar
                </span>
                <span className="text-2xl font-black text-slate-950">{discounts.length}</span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Kupon Aktif
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  {discounts.filter((d) => d.isActive).length}
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                  Total Digunakan Pembeli
                </span>
                <span className="text-2xl font-black text-slate-950">
                  {discounts.reduce((sum, d) => sum + (d.usedCount || 0), 0)}x
                </span>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-neutral-950 to-neutral-900 text-white shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-300 tracking-wider block mb-1">
                    Buat Kupon Promo
                  </span>
                  <span className="text-xs text-slate-300">Tingkatkan konversi penjualan</span>
                </div>
                <button
                  onClick={handleOpenCreateDiscount}
                  className="px-3 py-2 rounded-xl bg-white text-neutral-950 text-xs font-black hover:bg-slate-100 transition-colors shrink-0"
                >
                  + Tambah
                </button>
              </div>
            </div>

            {/* Coupons List / Table */}
            {discounts.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs">
                <Percent className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-1">Belum ada kupon diskon</h3>
                <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                  Buat kode kupon pertama Anda seperti DIGIBARU atau HEMAT5K untuk memberikan potongan harga menarik ke pembeli.
                </p>
                <button
                  onClick={handleOpenCreateDiscount}
                  className="px-4 py-2 rounded-xl bg-neutral-950 text-white text-xs font-bold shadow-xs hover:bg-neutral-800"
                >
                  + Buat Kupon Pertama
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-slate-700" />
                    <h3 className="text-sm font-black text-slate-950">Daftar Kode Promo & Diskon</h3>
                  </div>
                  <span className="text-xs text-slate-400 font-semibold">{discounts.length} kupon terdaftar</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {discounts.map((dsc) => (
                    <div
                      key={dsc.id}
                      className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                            dsc.type === "PERCENTAGE"
                              ? "bg-amber-50 text-amber-800 border border-amber-200/80"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                          }`}
                        >
                          {dsc.type === "PERCENTAGE" ? "%" : "Rp"}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="font-mono font-black text-sm text-slate-950 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                              {dsc.code}
                              <button
                                onClick={() => copyToClipboard(dsc.code, `Kode ${dsc.code} tersalin!`)}
                                className="text-slate-400 hover:text-slate-700"
                                title="Salin kode"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                dsc.isActive
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-slate-100 text-slate-500 border-slate-200"
                              }`}
                            >
                              {dsc.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                            <span className="text-xs font-bold text-slate-700">{dsc.name}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                            <span>
                              Potongan:{" "}
                              <strong className="text-slate-900 font-bold">
                                {dsc.type === "PERCENTAGE"
                                  ? `${dsc.value}% ${dsc.maxDiscount ? `(Maks. ${formatRupiah(dsc.maxDiscount)})` : ""}`
                                  : formatRupiah(dsc.value)}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Min. Belanja:{" "}
                              <strong className="text-slate-900 font-bold">
                                {dsc.minOrder > 0 ? formatRupiah(dsc.minOrder) : "Tanpa Minimum"}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Dipakai: <strong className="text-slate-900 font-bold">{dsc.usedCount}x</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => handleToggleDiscountActive(dsc)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                            dsc.isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                          }`}
                          title={dsc.isActive ? "Klik untuk nonaktifkan" : "Klik untuk aktifkan"}
                        >
                          {dsc.isActive ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-600" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-slate-400" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleOpenEditDiscount(dsc)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Edit kupon"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteDiscount(dsc.id, dsc.code)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200/60"
                          title="Hapus kupon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

      {/* ======================================================== */}
      {/* MODAL: UBAH HARGA & STATUS PRODUK (CLEAN WHITE) */}
      {/* ======================================================== */}
      {isEditPriceModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center p-1 border border-slate-200 shrink-0">
                  <Image src={editingProduct.image} alt={editingProduct.name} width={32} height={32} className="object-contain" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">Atur Harga & Promo Produk</h3>
                  <p className="text-xs text-slate-500 font-bold">{editingProduct.name} ({editingProduct.duration})</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditPriceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM ATUR HARGA & DISKON (OTOMATIS TERKURANGI) */}
            {(() => {
              const normal = Number(normalPriceVal) || 0;
              const disc = Number(discountAmountVal) || 0;
              const final = Number(finalPriceVal) || normal;
              const percent = normal > 0 && disc > 0 ? Math.round((disc / normal) * 100) : 0;

              return (
                <form onSubmit={handleSaveProductPricing} className="space-y-4">
                  {/* 1. HARGA NORMAL PRODUK */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Harga Normal / Standar Produk (Rp) *
                      </label>
                      <span className="text-[11px] font-semibold text-slate-400">Sebelum Diskon</span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                        Rp
                      </span>
                      <input
                        type="number"
                        required
                        min={0}
                        step={1000}
                        value={normalPriceVal}
                        onChange={(e) => handleNormalPriceChange(e.target.value)}
                        placeholder="Contoh: 65000"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Harga acuan normal produk (akan ditampilkan dicoret jika Anda memberi diskon).
                    </p>
                  </div>

                  {/* 2. POTONGAN DISKON (RP) */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-extrabold text-amber-950">
                        Potongan Diskon (Rp)
                      </label>
                      {disc > 0 && percent > 0 && (
                        <span className="text-[11px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                          Hemat {percent}%
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600 font-mono">
                        Rp
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={discountAmountVal}
                        onChange={(e) => handleDiscountAmountChange(e.target.value)}
                        placeholder="Contoh: 10000 (otomatis kurangi harga)"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-amber-300 text-sm font-bold text-amber-950 focus:outline-hidden focus:border-amber-500 transition-colors font-mono"
                      />
                    </div>

                    {/* Quick Discount Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mr-1">
                        Pilihan Cepat:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickDiscount(0)}
                        className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-colors ${
                          disc === 0 ? "bg-amber-700 text-white" : "bg-white text-amber-900 border border-amber-300 hover:bg-amber-100"
                        }`}
                      >
                        Tanpa Diskon
                      </button>
                      {[5000, 10000, 15000, 20000].map((nominal) => (
                        <button
                          key={nominal}
                          type="button"
                          onClick={() => handleQuickDiscount(nominal)}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition-colors ${
                            disc === nominal
                              ? "bg-amber-700 text-white"
                              : "bg-white text-amber-900 border border-amber-300 hover:bg-amber-100"
                          }`}
                        >
                          Rp {nominal.toLocaleString("id-ID")}
                        </button>
                      ))}
                    </div>

                    {disc > 0 ? (
                      <div className="mt-2.5 text-[11px] text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg">
                        <span>✓ Diskon Rp {disc.toLocaleString("id-ID")} diterapkan: Harga otomatis terkurangi dari Rp {normal.toLocaleString("id-ID")} menjadi Rp {final.toLocaleString("id-ID")}!</span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-800 font-medium mt-1.5">
                        Ketikkan nominal diskon (misal: 10000). Harga jual di bawah akan otomatis terpotong.
                      </p>
                    )}
                  </div>

                  {/* 3. HARGA JUAL AKHIR (OTOMATIS) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Harga Jual Bersih (Yang Ditagihkan ke Pembeli) *
                      </label>
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Otomatis Dihitung
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 font-mono">
                        Rp
                      </span>
                      <input
                        type="number"
                        required
                        min={0}
                        step={1000}
                        value={finalPriceVal}
                        onChange={(e) => handleFinalPriceChange(e.target.value)}
                        placeholder="55000"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-300 text-sm font-black text-emerald-950 focus:outline-hidden focus:border-emerald-500 focus:bg-white transition-colors font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Nominal ini yang akan dibayar oleh pembeli saat checkout.
                    </p>
                  </div>

                  {/* 4. PRATINJAU LANGSUNG (LIVE PREVIEW) */}
                  <div className="p-4 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-extrabold text-slate-400 mb-2.5">
                      <span>Pratinjau Tampilan Di Toko</span>
                      <span className="text-[10px] text-emerald-400 lowercase font-medium">real-time preview</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-slate-200 block truncate max-w-[200px]">
                          {editingProduct.name}
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-xl font-black font-mono text-emerald-400">
                            {formatRupiah(final)}
                          </span>
                          {disc > 0 && normal > final && (
                            <span className="text-xs text-slate-400 line-through font-mono">
                              {formatRupiah(normal)}
                            </span>
                          )}
                        </div>
                      </div>

                      {disc > 0 && normal > final ? (
                        <div className="text-right">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black">
                            -{percent}% DISKON
                          </span>
                          <span className="block text-[11px] text-emerald-300 font-bold mt-1">
                            Hemat {formatRupiah(disc)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 font-bold px-2 py-1 rounded-lg bg-slate-900 border border-slate-800">
                          Harga Normal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Keterangan Harga */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Keterangan Durasi / Satuan (Opsional)
                    </label>
                    <input
                      type="text"
                      value={editPriceNoteVal}
                      onChange={(e) => setEditPriceNoteVal(e.target.value)}
                      placeholder="Contoh: per link aktivasi, per bulan, per tahun"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                    />
                  </div>

                  {/* Status Ketersediaan */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Status Ketersediaan Toko</span>
                      <span className="text-[11px] text-slate-500">
                        {editIsAvailableVal ? "Produk aktif dan bisa dipesan pelanggan" : "Produk dinonaktifkan (tampil 'Habis Stok')"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditIsAvailableVal(!editIsAvailableVal)}
                      className={`p-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        editIsAvailableVal
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-slate-200 text-slate-600 border-slate-300"
                      }`}
                    >
                      {editIsAvailableVal ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                      <span>{editIsAvailableVal ? "Tersedia" : "Tutup"}</span>
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsEditPriceModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPrice}
                      className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4 stroke-[2.5]" />
                      <span>{isSubmittingPrice ? "Menyimpan..." : "Simpan Perubahan"}</span>
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: BUAT / EDIT KUPON DISKON (CLEAN WHITE) */}
      {/* ======================================================== */}
      {isDiscountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/80">
                  <Percent className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-950">
                    {editingDiscount ? "Edit Kupon Diskon" : "Buat Kupon Diskon Baru"}
                  </h3>
                  <p className="text-xs text-slate-500">Atur kode promo dan ketentuan potongan belanja</p>
                </div>
              </div>
              <button
                onClick={() => setIsDiscountModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiscount} className="space-y-4">
              {/* Kode Kupon */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kode Promo (Huruf Kapital) *
                </label>
                <input
                  type="text"
                  required
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                  placeholder="Contoh: DIGIBARU, HEMAT10, RAMADHAN"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-black text-slate-950 uppercase focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>

              {/* Nama Promo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Promo / Keterangan *
                </label>
                <input
                  type="text"
                  required
                  value={discountName}
                  onChange={(e) => setDiscountName(e.target.value)}
                  placeholder="Contoh: Promo Spesial Pengguna Baru 10%"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                />
              </div>

              {/* Tipe & Nilai Diskon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tipe Diskon *
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED">Potongan Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {discountType === "PERCENTAGE" ? "Besaran Persen (%) *" : "Besaran Potongan (Rp) *"}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={discountType === "PERCENTAGE" ? 100 : undefined}
                    step={discountType === "PERCENTAGE" ? 1 : 1000}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "PERCENTAGE" ? "10" : "15000"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Syarat Minimal Belanja & Maksimal Diskon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Min. Belanja (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={discountMinOrder}
                    onChange={(e) => setDiscountMinOrder(e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Maks. Diskon (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    disabled={discountType === "FIXED"}
                    value={discountMaxDiscount}
                    onChange={(e) => setDiscountMaxDiscount(e.target.value)}
                    placeholder={discountType === "FIXED" ? "Tidak berlaku" : "Misal: 25000"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:border-slate-400 focus:bg-white transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Status Aktif */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Status Kupon</span>
                  <span className="text-[11px] text-slate-500">
                    {discountIsActive ? "Kupon aktif dan dapat dipakai pelanggan" : "Kupon dinonaktifkan sementara"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setDiscountIsActive(!discountIsActive)}
                  className={`p-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    discountIsActive
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-slate-200 text-slate-600 border-slate-300"
                  }`}
                >
                  {discountIsActive ? <ToggleRight className="w-5 h-5 text-emerald-600" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  <span>{discountIsActive ? "Aktif" : "Nonaktif"}</span>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDiscountModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDiscount}
                  className="px-5 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-black transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{isSubmittingDiscount ? "Menyimpan..." : "Simpan Kupon"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  Mail,
  Trash2,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  getUserSavedOrders,
  removeUserOrder,
  syncUserOrderWithServer,
  UserSavedOrder,
  saveUserOrder,
} from "@/lib/userHistory";

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderHistoryModal({ isOpen, onClose }: OrderHistoryModalProps) {
  const [orders, setOrders] = useState<UserSavedOrder[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [manualOrderId, setManualOrderId] = useState("");
  const [isSearchingManual, setIsSearchingManual] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const loadOrders = () => {
    const list = getUserSavedOrders();
    setOrders(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadOrders();
      // Sync fresh status for any pending / waiting orders
      const list = getUserSavedOrders();
      const needSync = list.filter(
        (o) => o.status === "PENDING" || o.status === "WAITING_CONFIRMATION"
      );

      if (needSync.length > 0) {
        setIsSyncing(true);
        Promise.all(needSync.map((o) => syncUserOrderWithServer(o.orderId))).finally(() => {
          setIsSyncing(false);
          loadOrders();
        });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => loadOrders();
    window.addEventListener("lapakdigitara_orders_updated", handleUpdate);
    return () => window.removeEventListener("lapakdigitara_orders_updated", handleUpdate);
  }, []);

  if (!isOpen) return null;

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const copyText = (text: string, type: "id" | "link", val: string) => {
    navigator.clipboard.writeText(text);
    if (type === "id") {
      setCopiedId(val);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedLink(val);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = manualOrderId.trim().toUpperCase();
    if (!cleanId) return;

    setIsSearchingManual(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/orders/${cleanId}/status`);
      const data = await res.json();
      if (data.status) {
        saveUserOrder({
          orderId: cleanId,
          status: data.status,
          activationLink: data.activationLink,
          totalAmount: data.totalAmount || 0,
          buyerEmail: data.buyerEmail || "",
          buyerName: data.buyerName || "",
          items: data.items || [],
          createdAt: data.createdAt || new Date().toISOString(),
          paidAt: data.paidAt,
        });
        setManualOrderId("");
        loadOrders();
      } else {
        setSearchError("Nomor Order ID tidak ditemukan di server.");
      }
    } catch (err) {
      setSearchError("Gagal menghubungi server untuk cek order.");
    } finally {
      setIsSearchingManual(false);
    }
  };

  const handleRefreshAll = async () => {
    setIsSyncing(true);
    await Promise.all(orders.map((o) => syncUserOrderWithServer(o.orderId)));
    setIsSyncing(false);
    loadOrders();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-neutral-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-xs">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-neutral-950">
                Riwayat Pesanan Saya
              </h2>
              <p className="text-xs text-neutral-500">
                Status pesanan & link aktivasi tersimpan di browser Anda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshAll}
              disabled={isSyncing || orders.length === 0}
              className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100 transition-colors"
              title="Perbarui status pesanan dari server"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-emerald-600" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notice Info Box: Cek Folder SPAM */}
        <div className="bg-amber-50/90 border-b border-amber-200/80 px-5 py-3 flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed shrink-0">
          <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Penting tentang Email Aktivasi:</strong> Begitu pembayaran Anda di-ACC admin, link aktivasi dikirim otomatis ke email Anda. Jika email belum masuk di Inbox, mohon pastikan untuk memeriksa folder <strong>Spam</strong> atau <strong>Promosi</strong>.
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Manual Order ID Search Form */}
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={manualOrderId}
                onChange={(e) => setManualOrderId(e.target.value.toUpperCase())}
                placeholder="Punya Order ID lain? Masukkan di sini (misal: DIGI-123456)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 text-xs font-mono font-bold placeholder:font-sans placeholder:font-normal text-neutral-900 focus:outline-hidden focus:border-neutral-950 bg-neutral-50/50"
              />
            </div>
            <button
              type="submit"
              disabled={isSearchingManual || !manualOrderId.trim()}
              className="px-4 py-2.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold transition-all disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {isSearchingManual ? "Mencari..." : "Cek Order"}
            </button>
          </form>

          {searchError && (
            <p className="text-xs text-rose-600 font-medium">{searchError}</p>
          )}

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="py-12 text-center">
              <History className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-neutral-800 mb-1">
                Belum Ada Riwayat Pesanan
              </h3>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                Pesanan yang Anda buat di Lapak Digitara akan otomatis tersimpan di sini sehingga Anda dapat kembali kapan saja untuk memantau status atau mengambil link lisensi.
              </p>
              <Link
                href="/#products"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-neutral-950 text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-xs"
              >
                <span>Lihat Katalog Produk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => {
                const isPaid = ord.status === "PAID";
                const isWaiting = ord.status === "WAITING_CONFIRMATION";
                const isPending = ord.status === "PENDING";
                const isRejected = ord.status === "REJECTED";

                return (
                  <div
                    key={ord.orderId}
                    className="p-4 sm:p-5 rounded-2xl bg-white border border-neutral-200/90 shadow-2xs hover:border-neutral-300 transition-colors flex flex-col gap-3"
                  >
                    {/* Order Top Bar */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-neutral-100">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs text-neutral-950 bg-neutral-100 px-2.5 py-1 rounded-lg">
                          #{ord.orderId}
                        </span>
                        <button
                          onClick={() => copyText(ord.orderId, "id", ord.orderId)}
                          className="text-neutral-400 hover:text-neutral-700"
                          title="Salin Order ID"
                        >
                          {copiedId === ord.orderId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(ord.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isPaid && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Lunas & Selesai</span>
                          </span>
                        )}
                        {isWaiting && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                            <span>Sedang Dicek Admin</span>
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center gap-1">
                            <span>Menunggu Pembayaran</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <span>Dibatalkan</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    {ord.items && ord.items.length > 0 ? (
                      <div className="divide-y divide-neutral-50">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="py-2 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {it.image && (
                                <div className="relative w-8 h-8 rounded-lg bg-neutral-50 border border-neutral-100 shrink-0 overflow-hidden">
                                  <Image src={it.image} alt={it.name} fill className="object-contain p-0.5" />
                                </div>
                              )}
                              <div className="truncate">
                                <span className="font-bold text-neutral-900 block truncate">{it.name}</span>
                                <span className="text-[11px] text-neutral-500">
                                  {it.duration} (x{it.quantity})
                                </span>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-neutral-950 shrink-0">
                              {formatRupiah(it.price * it.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-500 py-1">
                        Total Pembayaran: <strong>{formatRupiah(ord.totalAmount)}</strong>
                      </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center pt-2 border-t border-neutral-100 text-xs font-black text-neutral-950">
                      <span>Total Tagihan</span>
                      <span className="text-sm font-mono">{formatRupiah(ord.totalAmount)}</span>
                    </div>

                    {/* Status Info / Activation Link Card */}
                    {isPaid && ord.activationLink && (
                      <div className="p-3 rounded-xl bg-neutral-900 text-white space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-emerald-400 font-bold">
                          <span>Link Lisensi Resmi Anda:</span>
                          <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px]">
                            Siap Digunakan
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-neutral-950 border border-neutral-700 rounded-lg p-2 text-xs font-mono text-emerald-300">
                          <span className="truncate flex-1">{ord.activationLink}</span>
                          <button
                            onClick={() => copyText(ord.activationLink!, "link", ord.orderId)}
                            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white shrink-0"
                            title="Salin Link"
                          >
                            {copiedLink === ord.orderId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <a
                            href={ord.activationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span>Buka & Klaim Lisensi</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Notice for WAITING */}
                    {isWaiting && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                        <p className="leading-relaxed">
                          ⏳ <strong>Pembayaran sedang dicek admin.</strong> Begitu di-ACC, link aktivasi akan tampil di sini dan otomatis masuk ke email Anda.
                        </p>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(
                            `Halo Admin Lapak Digitara, saya ingin menanyakan status pesanan Order #${ord.orderId} sebesar ${formatRupiah(ord.totalAmount)}. Terima kasih!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Hubungi Admin via WhatsApp</span>
                        </a>
                      </div>
                    )}

                    {/* Notice for PENDING */}
                    {isPending && (
                      <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700 flex items-center justify-between gap-2">
                        <span>Menunggu pembayaran QRIS dilakukan.</span>
                        <Link
                          href="/checkout"
                          onClick={onClose}
                          className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors"
                        >
                          Lanjutkan Bayar
                        </Link>
                      </div>
                    )}

                    {/* Bottom Actions: Check Sync & Remove */}
                    <div className="flex items-center justify-between pt-2 text-[11px] text-neutral-400">
                      <button
                        onClick={async () => {
                          await syncUserOrderWithServer(ord.orderId);
                          loadOrders();
                        }}
                        className="text-neutral-600 hover:text-neutral-950 font-semibold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Cek Status Sekarang</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Hapus pesanan #${ord.orderId} dari riwayat perangkat ini?`)) {
                            removeUserOrder(ord.orderId);
                          }
                        }}
                        className="text-neutral-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                        title="Hapus dari riwayat perangkat"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

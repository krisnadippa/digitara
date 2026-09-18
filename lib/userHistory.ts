export interface SavedOrderItem {
  id: string;
  name: string;
  duration: string;
  price: number;
  quantity: number;
  image: string;
}

export interface UserSavedOrder {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp: string;
  totalAmount: number;
  baseAmount: number;
  paymentMethod: string;
  status: "PENDING" | "WAITING_CONFIRMATION" | "PAID" | "REJECTED";
  activationLink?: string;
  items: SavedOrderItem[];
  createdAt: string;
  paidAt?: string;
  lastCheckedAt?: string;
}

const STORAGE_KEY = "lapakdigitara_user_orders";

export function getUserSavedOrders(): UserSavedOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return [];
  } catch (e) {
    console.error("Gagal membaca riwayat pesanan dari localStorage:", e);
    return [];
  }
}

export function saveUserOrder(order: Partial<UserSavedOrder> & { orderId: string }): void {
  if (typeof window === "undefined") return;
  try {
    const current = getUserSavedOrders();
    const index = current.findIndex((o) => o.orderId === order.orderId);

    const fullOrder: UserSavedOrder = {
      orderId: order.orderId,
      buyerName: order.buyerName || "",
      buyerEmail: order.buyerEmail || "",
      buyerWhatsapp: order.buyerWhatsapp || "",
      totalAmount: Number(order.totalAmount || 0),
      baseAmount: Number(order.baseAmount || order.totalAmount || 0),
      paymentMethod: order.paymentMethod || "qris",
      status: (order.status as any) || "PENDING",
      activationLink: order.activationLink,
      items: order.items || [],
      createdAt: order.createdAt || new Date().toISOString(),
      paidAt: order.paidAt,
      lastCheckedAt: new Date().toISOString(),
    };

    if (index !== -1) {
      current[index] = {
        ...current[index],
        ...fullOrder,
        items: fullOrder.items.length > 0 ? fullOrder.items : current[index].items,
      };
    } else {
      current.unshift(fullOrder);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    // Dispatch storage event for cross-component re-renders
    window.dispatchEvent(new Event("lapakdigitara_orders_updated"));
  } catch (e) {
    console.error("Gagal menyimpan pesanan ke localStorage:", e);
  }
}

export function updateUserOrderStatus(
  orderId: string,
  status: "PENDING" | "WAITING_CONFIRMATION" | "PAID" | "REJECTED",
  activationLink?: string,
  paidAt?: string
): void {
  if (typeof window === "undefined") return;
  try {
    const current = getUserSavedOrders();
    const index = current.findIndex((o) => o.orderId === orderId);
    if (index !== -1) {
      current[index].status = status;
      if (activationLink) current[index].activationLink = activationLink;
      if (paidAt) current[index].paidAt = paidAt;
      current[index].lastCheckedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new Event("lapakdigitara_orders_updated"));
    }
  } catch (e) {
    console.error("Gagal update status pesanan di localStorage:", e);
  }
}

export function removeUserOrder(orderId: string): void {
  if (typeof window === "undefined") return;
  try {
    const current = getUserSavedOrders();
    const filtered = current.filter((o) => o.orderId !== orderId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event("lapakdigitara_orders_updated"));
  } catch (e) {
    console.error("Gagal menghapus pesanan dari localStorage:", e);
  }
}

export async function syncUserOrderWithServer(orderId: string): Promise<UserSavedOrder | null> {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status) {
      updateUserOrderStatus(orderId, data.status, data.activationLink, data.paidAt);
      const orders = getUserSavedOrders();
      return orders.find((o) => o.orderId === orderId) || null;
    }
    return null;
  } catch (e) {
    console.error(`Gagal sync order #${orderId}:`, e);
    return null;
  }
}

import fs from "fs";
import path from "path";
import { getDb, isNeonConfigured, initOrdersTable } from "./db";

export interface OrderItem {
  id: string;
  name: string;
  duration: string;
  price: number;
  image: string;
  quantity: number;
}

export type OrderStatus = "PENDING" | "WAITING_CONFIRMATION" | "PAID" | "REJECTED";

export interface Order {
  orderId: string;
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp: string;
  items: OrderItem[];
  baseAmount: number;
  uniqueCode: number;
  totalAmount: number;
  paymentMethod: string;
  status: OrderStatus;
  activationLink: string;
  createdAt: string;
  paidAt?: string;
  emailSent?: boolean;
}

// -------------------------------------------------------------
// LOCAL JSON FALLBACK (Jika DATABASE_URL belum diatur)
// -------------------------------------------------------------
const ORDERS_FILE = path.join(process.cwd(), "data", "orders.json");

function ensureOrdersFile() {
  const dir = path.dirname(ORDERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([]), "utf-8");
  }
}

function getLocalOrders(): Order[] {
  try {
    ensureOrdersFile();
    const data = fs.readFileSync(ORDERS_FILE, "utf-8");
    return JSON.parse(data) as Order[];
  } catch (err) {
    console.error("Error reading local orders:", err);
    return [];
  }
}

function saveLocalOrders(orders: Order[]) {
  try {
    ensureOrdersFile();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving local orders:", err);
  }
}

// Helper untuk memetakan row Neon Postgres ke tipe Order
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToOrder(row: any): Order {
  let items: OrderItem[] = [];
  if (typeof row.items === "string") {
    try {
      items = JSON.parse(row.items);
    } catch {
      items = [];
    }
  } else if (Array.isArray(row.items)) {
    items = row.items;
  }

  return {
    orderId: row.order_id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    buyerWhatsapp: row.buyer_whatsapp,
    items,
    baseAmount: Number(row.base_amount),
    uniqueCode: Number(row.unique_code || 0),
    totalAmount: Number(row.total_amount),
    paymentMethod: row.payment_method,
    status: row.status as OrderStatus,
    activationLink: row.activation_link,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    paidAt: row.paid_at ? (row.paid_at instanceof Date ? row.paid_at.toISOString() : String(row.paid_at)) : undefined,
    emailSent: Boolean(row.email_sent),
  };
}

// -------------------------------------------------------------
// PUBLIC ASYNC API (NEON POSTGRES + LOCAL FALLBACK)
// -------------------------------------------------------------

export async function getAllOrders(): Promise<Order[]> {
  if (isNeonConfigured()) {
    try {
      await initOrdersTable();
      const sql = getDb();
      if (sql) {
        const rows = await sql`
          SELECT * FROM orders ORDER BY created_at DESC;
        `;
        return rows.map(mapRowToOrder);
      }
    } catch (err) {
      console.error("[Neon DB] Gagal mengambil orders, beralih ke local fallback:", err);
    }
  }

  return getLocalOrders();
}

export async function createOrder(data: {
  buyerName: string;
  buyerEmail: string;
  buyerWhatsapp: string;
  items: OrderItem[];
  baseAmount: number;
  paymentMethod: string;
}): Promise<Order> {
  const totalAmount = data.baseAmount;
  const uniqueCode = 0;
  const orderId = "DIGI-" + Math.floor(100000 + Math.random() * 900000);
  const activationLink = `https://lapakdigitara.com/redeem/${orderId.toLowerCase()}`;
  const nowIso = new Date().toISOString();

  const newOrder: Order = {
    orderId,
    buyerName: data.buyerName,
    buyerEmail: data.buyerEmail,
    buyerWhatsapp: data.buyerWhatsapp,
    items: data.items,
    baseAmount: data.baseAmount,
    uniqueCode,
    totalAmount,
    paymentMethod: data.paymentMethod,
    status: "PENDING",
    activationLink,
    createdAt: nowIso,
    emailSent: false,
  };

  if (isNeonConfigured()) {
    try {
      await initOrdersTable();
      const sql = getDb();
      if (sql) {
        await sql`
          INSERT INTO orders (
            order_id, buyer_name, buyer_email, buyer_whatsapp,
            items, base_amount, unique_code, total_amount,
            payment_method, status, activation_link, created_at, email_sent
          ) VALUES (
            ${newOrder.orderId}, ${newOrder.buyerName}, ${newOrder.buyerEmail}, ${newOrder.buyerWhatsapp},
            ${JSON.stringify(newOrder.items)}, ${newOrder.baseAmount}, ${newOrder.uniqueCode}, ${newOrder.totalAmount},
            ${newOrder.paymentMethod}, ${newOrder.status}, ${newOrder.activationLink}, ${newOrder.createdAt}, ${newOrder.emailSent}
          );
        `;
        return newOrder;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal menyimpan order baru, beralih ke local fallback:", err);
    }
  }

  // Fallback lokal
  const orders = getLocalOrders();
  orders.unshift(newOrder);
  saveLocalOrders(orders);
  return newOrder;
}

export async function getOrderById(orderId: string): Promise<Order | undefined> {
  if (isNeonConfigured()) {
    try {
      await initOrdersTable();
      const sql = getDb();
      if (sql) {
        const rows = await sql`
          SELECT * FROM orders WHERE order_id = ${orderId} LIMIT 1;
        `;
        if (rows.length > 0) {
          return mapRowToOrder(rows[0]);
        }
        return undefined;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal mencari order by ID:", err);
    }
  }

  const orders = getLocalOrders();
  return orders.find((o) => o.orderId === orderId);
}

export async function findPendingOrderByAmount(amount: number): Promise<Order | undefined> {
  if (isNeonConfigured()) {
    try {
      await initOrdersTable();
      const sql = getDb();
      if (sql) {
        const rows = await sql`
          SELECT * FROM orders
          WHERE (status = 'PENDING' OR status = 'WAITING_CONFIRMATION')
            AND total_amount = ${amount}
          ORDER BY created_at DESC
          LIMIT 1;
        `;
        if (rows.length > 0) {
          return mapRowToOrder(rows[0]);
        }
        return undefined;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal mencari pending order by amount:", err);
    }
  }

  const orders = getLocalOrders();
  return orders.find(
    (o) =>
      (o.status === "PENDING" || o.status === "WAITING_CONFIRMATION") &&
      Number(o.totalAmount) === Number(amount)
  );
}

export async function markOrderWaitingConfirmation(orderId: string): Promise<Order | undefined> {
  if (isNeonConfigured()) {
    try {
      await initOrdersTable();
      const sql = getDb();
      if (sql) {
        const rows = await sql`
          UPDATE orders
          SET status = 'WAITING_CONFIRMATION'
          WHERE order_id = ${orderId}
          RETURNING *;
        `;
        if (rows.length > 0) {
          return mapRowToOrder(rows[0]);
        }
        return undefined;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal update status waiting confirmation:", err);
    }
  }

  const orders = getLocalOrders();
  const index = orders.findIndex((o) => o.orderId === orderId);
  if (index === -1) return undefined;

  orders[index].status = "WAITING_CONFIRMATION";
  saveLocalOrders(orders);
  return orders[index];
}

export async function markOrderAsPaid(orderId: string, updatedActivationLink?: string): Promise<Order | undefined> {
  const paidAt = new Date().toISOString();

  if (isNeonConfigured()) {
    try {
      await initOrdersTable();
      const sql = getDb();
      if (sql) {
        let rows;
        if (updatedActivationLink) {
          rows = await sql`
            UPDATE orders
            SET status = 'PAID', paid_at = ${paidAt}, activation_link = ${updatedActivationLink}
            WHERE order_id = ${orderId}
            RETURNING *;
          `;
        } else {
          rows = await sql`
            UPDATE orders
            SET status = 'PAID', paid_at = ${paidAt}
            WHERE order_id = ${orderId}
            RETURNING *;
          `;
        }
        if (rows.length > 0) {
          return mapRowToOrder(rows[0]);
        }
        return undefined;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal update status lunas (PAID):", err);
    }
  }

  const orders = getLocalOrders();
  const index = orders.findIndex((o) => o.orderId === orderId);
  if (index === -1) return undefined;

  orders[index].status = "PAID";
  orders[index].paidAt = paidAt;
  if (updatedActivationLink) {
    orders[index].activationLink = updatedActivationLink;
  }
  saveLocalOrders(orders);
  return orders[index];
}

export async function rejectOrder(orderId: string): Promise<Order | undefined> {
  if (isNeonConfigured()) {
    try {
      await initOrdersTable();
      const sql = getDb();
      if (sql) {
        const rows = await sql`
          UPDATE orders
          SET status = 'REJECTED'
          WHERE order_id = ${orderId}
          RETURNING *;
        `;
        if (rows.length > 0) {
          return mapRowToOrder(rows[0]);
        }
        return undefined;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal tolak order:", err);
    }
  }

  const orders = getLocalOrders();
  const index = orders.findIndex((o) => o.orderId === orderId);
  if (index === -1) return undefined;

  orders[index].status = "REJECTED";
  saveLocalOrders(orders);
  return orders[index];
}

export async function deleteOrder(orderId: string): Promise<boolean> {
  if (isNeonConfigured()) {
    try {
      await initOrdersTable();
      const sql = getDb();
      if (sql) {
        const result = await sql`
          DELETE FROM orders WHERE order_id = ${orderId};
        `;
        return result !== null;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal menghapus order:", err);
    }
  }

  const orders = getLocalOrders();
  const filtered = orders.filter((o) => o.orderId !== orderId);
  if (filtered.length !== orders.length) {
    saveLocalOrders(filtered);
    return true;
  }
  return false;
}

export async function updateOrderEmailSent(orderId: string, emailSent: boolean): Promise<void> {
  if (isNeonConfigured()) {
    try {
      await initOrdersTable();
      const sql = getDb();
      if (sql) {
        await sql`
          UPDATE orders
          SET email_sent = ${emailSent}
          WHERE order_id = ${orderId};
        `;
        return;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal update status email_sent:", err);
    }
  }

  const orders = getLocalOrders();
  const index = orders.findIndex((o) => o.orderId === orderId);
  if (index !== -1) {
    orders[index].emailSent = emailSent;
    saveLocalOrders(orders);
  }
}

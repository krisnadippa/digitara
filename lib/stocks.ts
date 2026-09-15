import fs from "fs";
import path from "path";
import { getDb, isNeonConfigured } from "./db";
import { products } from "@/data/products";

export type StockStatus = "AVAILABLE" | "USED";

export interface StockItem {
  id: string;
  productId: string;
  productName: string;
  activationLink: string;
  notes?: string;
  status: StockStatus;
  orderId?: string;
  buyerEmail?: string;
  createdAt: string;
  usedAt?: string;
}

// -------------------------------------------------------------
// LOCAL JSON FALLBACK (Jika DATABASE_URL belum diatur / offline)
// -------------------------------------------------------------
const STOCKS_FILE = path.join(process.cwd(), "data", "stocks.json");

function ensureStocksFile() {
  const dir = path.dirname(STOCKS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(STOCKS_FILE)) {
    fs.writeFileSync(STOCKS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function getLocalStocks(): StockItem[] {
  try {
    ensureStocksFile();
    const data = fs.readFileSync(STOCKS_FILE, "utf-8");
    return JSON.parse(data) as StockItem[];
  } catch (err) {
    console.error("Error reading local stocks:", err);
    return [];
  }
}

function saveLocalStocks(stocks: StockItem[]) {
  try {
    ensureStocksFile();
    fs.writeFileSync(STOCKS_FILE, JSON.stringify(stocks, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving local stocks:", err);
  }
}

// -------------------------------------------------------------
// NEON POSTGRESQL INITIALIZATION & MAPPING
// -------------------------------------------------------------
declare global {
  // eslint-disable-next-line no-var
  var _stocksTableInitialized: boolean | undefined;
}

export async function initStocksTable(): Promise<boolean> {
  if (globalThis._stocksTableInitialized) return true;
  const sql = getDb();
  if (!sql) return false;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS stocks (
        id VARCHAR(50) PRIMARY KEY,
        product_id VARCHAR(100) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        activation_link TEXT NOT NULL,
        notes TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
        order_id VARCHAR(50),
        buyer_email VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        used_at TIMESTAMPTZ
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_stocks_product_status ON stocks (product_id, status);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_stocks_order_id ON stocks (order_id);
    `;

    globalThis._stocksTableInitialized = true;
    return true;
  } catch (err) {
    console.error("[Neon DB] Gagal inisialisasi tabel stocks:", err);
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToStockItem(row: any): StockItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    activationLink: row.activation_link,
    notes: row.notes || undefined,
    status: row.status as StockStatus,
    orderId: row.order_id || undefined,
    buyerEmail: row.buyer_email || undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    usedAt: row.used_at ? (row.used_at instanceof Date ? row.used_at.toISOString() : String(row.used_at)) : undefined,
  };
}

// -------------------------------------------------------------
// PUBLIC ASYNC API
// -------------------------------------------------------------

/**
 * Mengambil semua stok (diurutkan dari yang terbaru dibuat)
 */
export async function getAllStocks(): Promise<StockItem[]> {
  if (isNeonConfigured()) {
    try {
      await initStocksTable();
      const sql = getDb();
      if (sql) {
        const rows = await sql`
          SELECT * FROM stocks ORDER BY created_at DESC;
        `;
        return rows.map(mapRowToStockItem);
      }
    } catch (err) {
      console.error("[Neon DB] Gagal mengambil stok, fallback lokal:", err);
    }
  }

  const stocks = getLocalStocks();
  return stocks.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Mengambil stok yang masih tersedia (AVAILABLE)
 */
export async function getAvailableStocks(productId?: string): Promise<StockItem[]> {
  if (isNeonConfigured()) {
    try {
      await initStocksTable();
      const sql = getDb();
      if (sql) {
        if (productId) {
          const rows = await sql`
            SELECT * FROM stocks 
            WHERE status = 'AVAILABLE' AND product_id = ${productId}
            ORDER BY created_at ASC;
          `;
          return rows.map(mapRowToStockItem);
        } else {
          const rows = await sql`
            SELECT * FROM stocks 
            WHERE status = 'AVAILABLE'
            ORDER BY created_at ASC;
          `;
          return rows.map(mapRowToStockItem);
        }
      }
    } catch (err) {
      console.error("[Neon DB] Gagal mengambil stok tersedia:", err);
    }
  }

  const stocks = getLocalStocks();
  return stocks.filter((s) => {
    if (s.status !== "AVAILABLE") return false;
    if (productId && s.productId !== productId) return false;
    return true;
  });
}

/**
 * Mendapatkan ringkasan jumlah stok per produk
 */
export async function getStockSummary(): Promise<Record<string, { available: number; used: number; total: number }>> {
  const all = await getAllStocks();
  const summary: Record<string, { available: number; used: number; total: number }> = {};

  // Inisialisasi semua produk ke 0 secara default
  for (const prod of products) {
    summary[prod.id] = { available: 0, used: 0, total: 0 };
  }

  for (const item of all) {
    if (!summary[item.productId]) {
      summary[item.productId] = { available: 0, used: 0, total: 0 };
    }
    summary[item.productId].total += 1;
    if (item.status === "AVAILABLE") {
      summary[item.productId].available += 1;
    } else {
      summary[item.productId].used += 1;
    }
  }

  return summary;
}

/**
 * Menambahkan stok baru (bisa satuan atau banyak link sekaligus)
 */
export async function addStockItems(
  productId: string,
  productName: string,
  links: string[],
  notes?: string
): Promise<StockItem[]> {
  const cleanLinks = links
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (cleanLinks.length === 0) {
    return [];
  }

  const now = new Date();
  const newItems: StockItem[] = cleanLinks.map((link, idx) => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePart = Date.now().toString(36).toUpperCase();
    const id = `STK-${datePart}-${idx + 1}-${randomSuffix}`;
    return {
      id,
      productId,
      productName,
      activationLink: link,
      notes: notes || undefined,
      status: "AVAILABLE",
      createdAt: new Date(now.getTime() + idx * 100).toISOString(),
    };
  });

  if (isNeonConfigured()) {
    try {
      await initStocksTable();
      const sql = getDb();
      if (sql) {
        for (const item of newItems) {
          await sql`
            INSERT INTO stocks (
              id, product_id, product_name, activation_link, notes,
              status, created_at
            ) VALUES (
              ${item.id}, ${item.productId}, ${item.productName}, ${item.activationLink},
              ${item.notes || null}, ${item.status}, ${item.createdAt}
            );
          `;
        }
      }
    } catch (err) {
      console.error("[Neon DB] Gagal menambah stok ke database, fallback lokal:", err);
    }
  }

  const stocks = getLocalStocks();
  stocks.unshift(...newItems);
  saveLocalStocks(stocks);
  return newItems;
}

/**
 * Hapus stok (hanya boleh jika status masih AVAILABLE)
 */
export async function deleteStockItem(id: string): Promise<boolean> {
  let deleted = false;
  if (isNeonConfigured()) {
    try {
      await initStocksTable();
      const sql = getDb();
      if (sql) {
        const result = await sql`
          DELETE FROM stocks WHERE id = ${id} AND status = 'AVAILABLE' RETURNING id;
        `;
        if (result.length > 0) deleted = true;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal menghapus stok:", err);
    }
  }

  // Sinkronkan selalu dengan file cadangan lokal
  const stocks = getLocalStocks();
  const index = stocks.findIndex((s) => s.id === id);
  if (index !== -1 && stocks[index].status === "AVAILABLE") {
    stocks.splice(index, 1);
    saveLocalStocks(stocks);
    deleted = true;
  }
  return deleted;
}

/**
 * Alokasikan stok link aktivasi untuk pesanan saat di-ACC
 */
export async function allocateStockForOrder(
  orderId: string,
  buyerEmail: string,
  items: { id: string; name: string; quantity: number }[]
): Promise<{
  success: boolean;
  allocatedLinks: Record<string, string[]>;
  allLinks: string[];
  error?: string;
}> {
  const allStocks = await getAllStocks();
  const availablePool = allStocks.filter((s) => s.status === "AVAILABLE");

  // Validasi kecukupan stok sebelum alokasi
  for (const item of items) {
    const matchingAvailable = availablePool.filter((s) => s.productId === item.id);
    if (matchingAvailable.length < item.quantity) {
      return {
        success: false,
        allocatedLinks: {},
        allLinks: [],
        error: `Stok link aktivasi untuk ${item.name} tidak mencukupi! Butuh ${item.quantity}, tersedia ${matchingAvailable.length}. Silakan tambah stok terlebih dahulu di menu Kelola Stok.`,
      };
    }
  }

  const nowIso = new Date().toISOString();
  const allocatedLinks: Record<string, string[]> = {};
  const allLinks: string[] = [];
  const assignedStockIds: string[] = [];

  // Alokasi link
  for (const item of items) {
    allocatedLinks[item.id] = [];
    const matching = availablePool.filter((s) => s.productId === item.id);
    for (let i = 0; i < item.quantity; i++) {
      const stock = matching[i];
      assignedStockIds.push(stock.id);
      allocatedLinks[item.id].push(stock.activationLink);
      allLinks.push(stock.activationLink);
    }
  }

  // Update status stok menjadi USED
  if (isNeonConfigured()) {
    try {
      await initStocksTable();
      const sql = getDb();
      if (sql) {
        for (const stockId of assignedStockIds) {
          await sql`
            UPDATE stocks
            SET status = 'USED', order_id = ${orderId}, buyer_email = ${buyerEmail}, used_at = ${nowIso}
            WHERE id = ${stockId};
          `;
        }
        return { success: true, allocatedLinks, allLinks };
      }
    } catch (err) {
      console.error("[Neon DB] Gagal alokasi stok di DB, beralih ke lokal:", err);
    }
  }

  // Local fallback
  const stocks = getLocalStocks();
  for (const stock of stocks) {
    if (assignedStockIds.includes(stock.id)) {
      stock.status = "USED";
      stock.orderId = orderId;
      stock.buyerEmail = buyerEmail;
      stock.usedAt = nowIso;
    }
  }
  saveLocalStocks(stocks);

  return { success: true, allocatedLinks, allLinks };
}

/**
 * Lepaskan kembali stok jika pesanan ditolak / dibatalkan
 */
export async function releaseStockForOrder(orderId: string): Promise<void> {
  if (isNeonConfigured()) {
    try {
      await initStocksTable();
      const sql = getDb();
      if (sql) {
        await sql`
          UPDATE stocks
          SET status = 'AVAILABLE', order_id = NULL, buyer_email = NULL, used_at = NULL
          WHERE order_id = ${orderId};
        `;
        return;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal melepas stok:", err);
    }
  }

  const stocks = getLocalStocks();
  let updated = false;
  for (const stock of stocks) {
    if (stock.orderId === orderId) {
      stock.status = "AVAILABLE";
      stock.orderId = undefined;
      stock.buyerEmail = undefined;
      stock.usedAt = undefined;
      updated = true;
    }
  }
  if (updated) {
    saveLocalStocks(stocks);
  }
}

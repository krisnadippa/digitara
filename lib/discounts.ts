import fs from "fs";
import path from "path";
import { getDb, isNeonConfigured } from "./db";

export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Discount {
  id: string;
  code: string;
  name: string;
  type: DiscountType;
  value: number;
  minOrder: number;
  maxDiscount?: number;
  isActive: boolean;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
}

const DISCOUNTS_FILE = path.join(process.cwd(), "data", "discounts.json");

const DEFAULT_DISCOUNTS: Discount[] = [
  {
    id: "DSC-WELCOME-10",
    code: "DIGIBARU",
    name: "Diskon Pengguna Baru 10%",
    type: "PERCENTAGE",
    value: 10,
    minOrder: 40000,
    maxDiscount: 20000,
    isActive: true,
    usedCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "DSC-HEMAT-5K",
    code: "HEMAT5K",
    name: "Potongan Langsung Rp 5.000",
    type: "FIXED",
    value: 5000,
    minOrder: 50000,
    isActive: true,
    usedCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function ensureDiscountsFile() {
  const dir = path.dirname(DISCOUNTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DISCOUNTS_FILE)) {
    fs.writeFileSync(DISCOUNTS_FILE, JSON.stringify(DEFAULT_DISCOUNTS, null, 2), "utf-8");
  }
}

function getLocalDiscounts(): Discount[] {
  try {
    ensureDiscountsFile();
    const data = fs.readFileSync(DISCOUNTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading local discounts:", err);
    return DEFAULT_DISCOUNTS;
  }
}

function saveLocalDiscounts(data: Discount[]) {
  try {
    ensureDiscountsFile();
    fs.writeFileSync(DISCOUNTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving local discounts:", err);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var _discountsTableInitialized: boolean | undefined;
}

export async function initDiscountsTable(): Promise<boolean> {
  if (globalThis._discountsTableInitialized) return true;
  const sql = getDb();
  if (!sql) return false;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS discounts (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL,
        value NUMERIC NOT NULL,
        min_order NUMERIC NOT NULL DEFAULT 0,
        max_discount NUMERIC,
        is_active BOOLEAN DEFAULT TRUE,
        used_count INT DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    // Seed defaults if empty
    const countRes = await sql`SELECT count(*) as count FROM discounts;`;
    if (countRes[0] && Number(countRes[0].count) === 0) {
      for (const d of DEFAULT_DISCOUNTS) {
        await sql`
          INSERT INTO discounts (id, code, name, type, value, min_order, max_discount, is_active, used_count, created_at, updated_at)
          VALUES (
            ${d.id}, ${d.code}, ${d.name}, ${d.type}, ${d.value}, ${d.minOrder},
            ${d.maxDiscount ?? null}, ${d.isActive}, ${d.usedCount}, NOW(), NOW()
          )
          ON CONFLICT (code) DO NOTHING;
        `;
      }
    }

    globalThis._discountsTableInitialized = true;
    return true;
  } catch (err) {
    console.error("[Neon DB] Gagal inisialisasi tabel discounts:", err);
    return false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToDiscount(row: any): Discount {
  return {
    id: row.id,
    code: String(row.code).toUpperCase(),
    name: row.name,
    type: row.type as DiscountType,
    value: Number(row.value),
    minOrder: Number(row.min_order || 0),
    maxDiscount: row.max_discount ? Number(row.max_discount) : undefined,
    isActive: Boolean(row.is_active),
    usedCount: Number(row.used_count || 0),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  };
}

export async function getAllDiscounts(): Promise<Discount[]> {
  if (isNeonConfigured()) {
    try {
      await initDiscountsTable();
      const sql = getDb();
      if (sql) {
        const rows = await sql`SELECT * FROM discounts ORDER BY created_at DESC;`;
        if (rows.length > 0) {
          return rows.map(mapRowToDiscount);
        }
      }
    } catch (err) {
      console.error("[Neon DB] Gagal mengambil discounts, fallback lokal:", err);
    }
  }

  return getLocalDiscounts();
}

export async function getDiscountByCode(code: string): Promise<Discount | undefined> {
  const cleanCode = code.trim().toUpperCase();
  if (isNeonConfigured()) {
    try {
      await initDiscountsTable();
      const sql = getDb();
      if (sql) {
        const rows = await sql`
          SELECT * FROM discounts WHERE UPPER(code) = ${cleanCode} LIMIT 1;
        `;
        if (rows.length > 0) {
          return mapRowToDiscount(rows[0]);
        }
        return undefined;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal mencari discount by code:", err);
    }
  }

  const all = getLocalDiscounts();
  return all.find((d) => d.code.toUpperCase() === cleanCode);
}

export async function createDiscount(data: {
  code: string;
  name: string;
  type: DiscountType;
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  isActive?: boolean;
}): Promise<Discount> {
  const nowIso = new Date().toISOString();
  const id = "DSC-" + Date.now().toString(36).toUpperCase();
  const newDiscount: Discount = {
    id,
    code: data.code.trim().toUpperCase(),
    name: data.name.trim(),
    type: data.type,
    value: Number(data.value),
    minOrder: Number(data.minOrder || 0),
    maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
    isActive: data.isActive !== undefined ? data.isActive : true,
    usedCount: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  if (isNeonConfigured()) {
    try {
      await initDiscountsTable();
      const sql = getDb();
      if (sql) {
        await sql`
          INSERT INTO discounts (
            id, code, name, type, value, min_order, max_discount, is_active, used_count, created_at, updated_at
          ) VALUES (
            ${newDiscount.id}, ${newDiscount.code}, ${newDiscount.name}, ${newDiscount.type},
            ${newDiscount.value}, ${newDiscount.minOrder}, ${newDiscount.maxDiscount || null},
            ${newDiscount.isActive}, ${newDiscount.usedCount}, ${newDiscount.createdAt}, ${newDiscount.updatedAt}
          );
        `;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal simpan discount baru ke Neon, fallback lokal:", err);
    }
  }

  const local = getLocalDiscounts();
  local.unshift(newDiscount);
  saveLocalDiscounts(local);

  return newDiscount;
}

export async function updateDiscount(
  id: string,
  data: Partial<Omit<Discount, "id" | "createdAt" | "usedCount">>
): Promise<Discount | undefined> {
  const nowIso = new Date().toISOString();

  if (isNeonConfigured()) {
    try {
      await initDiscountsTable();
      const sql = getDb();
      if (sql) {
        const rows = await sql`
          UPDATE discounts SET
            code = COALESCE(${data.code ? data.code.trim().toUpperCase() : null}, code),
            name = COALESCE(${data.name || null}, name),
            type = COALESCE(${data.type || null}, type),
            value = COALESCE(${data.value !== undefined ? data.value : null}, value),
            min_order = COALESCE(${data.minOrder !== undefined ? data.minOrder : null}, min_order),
            max_discount = ${data.maxDiscount !== undefined ? data.maxDiscount : null},
            is_active = COALESCE(${data.isActive !== undefined ? data.isActive : null}, is_active),
            updated_at = ${nowIso}
          WHERE id = ${id}
          RETURNING *;
        `;
        if (rows.length > 0) {
          return mapRowToDiscount(rows[0]);
        }
      }
    } catch (err) {
      console.error("[Neon DB] Gagal update discount:", err);
    }
  }

  const local = getLocalDiscounts();
  const index = local.findIndex((d) => d.id === id);
  if (index === -1) return undefined;

  local[index] = {
    ...local[index],
    ...(data.code ? { code: data.code.trim().toUpperCase() } : {}),
    ...(data.name ? { name: data.name.trim() } : {}),
    ...(data.type ? { type: data.type } : {}),
    ...(data.value !== undefined ? { value: Number(data.value) } : {}),
    ...(data.minOrder !== undefined ? { minOrder: Number(data.minOrder) } : {}),
    maxDiscount: data.maxDiscount !== undefined ? data.maxDiscount : local[index].maxDiscount,
    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    updatedAt: nowIso,
  };

  saveLocalDiscounts(local);
  return local[index];
}

export async function deleteDiscount(id: string): Promise<boolean> {
  if (isNeonConfigured()) {
    try {
      await initDiscountsTable();
      const sql = getDb();
      if (sql) {
        const res = await sql`DELETE FROM discounts WHERE id = ${id} RETURNING id;`;
        if (res.length > 0) return true;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal hapus discount:", err);
    }
  }

  const local = getLocalDiscounts();
  const filtered = local.filter((d) => d.id !== id);
  if (filtered.length !== local.length) {
    saveLocalDiscounts(filtered);
    return true;
  }
  return false;
}

export async function recordDiscountUsage(code: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  if (isNeonConfigured()) {
    try {
      await initDiscountsTable();
      const sql = getDb();
      if (sql) {
        await sql`
          UPDATE discounts
          SET used_count = used_count + 1, updated_at = NOW()
          WHERE UPPER(code) = ${cleanCode};
        `;
        return;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal update used_count discount:", err);
    }
  }

  const local = getLocalDiscounts();
  const found = local.find((d) => d.code.toUpperCase() === cleanCode);
  if (found) {
    found.usedCount = (found.usedCount || 0) + 1;
    found.updatedAt = new Date().toISOString();
    saveLocalDiscounts(local);
  }
}

/**
 * Validasi diskon terhadap keranjang / jumlah belanja
 */
export function calculateDiscountAmount(
  discount: Discount,
  baseAmount: number
): { isValid: boolean; discountAmount: number; error?: string } {
  if (!discount.isActive) {
    return { isValid: false, discountAmount: 0, error: "Kupon diskon ini sedang tidak aktif." };
  }

  if (baseAmount < discount.minOrder) {
    return {
      isValid: false,
      discountAmount: 0,
      error: `Minimal transaksi untuk menggunakan kupon ini adalah Rp ${discount.minOrder.toLocaleString("id-ID")}.`,
    };
  }

  let amount = 0;
  if (discount.type === "PERCENTAGE") {
    amount = Math.round((baseAmount * discount.value) / 100);
    if (discount.maxDiscount && amount > discount.maxDiscount) {
      amount = discount.maxDiscount;
    }
  } else {
    amount = Math.min(baseAmount, discount.value);
  }

  return {
    isValid: true,
    discountAmount: amount,
  };
}

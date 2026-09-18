import fs from "fs";
import path from "path";
import { getDb, isNeonConfigured } from "./db";
import { products, Product } from "@/data/products";

export interface ProductPricingOverride {
  productId: string;
  price: number;
  originalPrice?: number;
  priceNote?: string;
  isAvailable?: boolean;
  updatedAt: string;
}

const PRICING_FILE = path.join(process.cwd(), "data", "pricing.json");

function ensurePricingFile() {
  const dir = path.dirname(PRICING_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(PRICING_FILE)) {
    fs.writeFileSync(PRICING_FILE, JSON.stringify({}, null, 2), "utf-8");
  }
}

function getLocalPricing(): Record<string, ProductPricingOverride> {
  try {
    ensurePricingFile();
    const data = fs.readFileSync(PRICING_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading local pricing overrides:", err);
    return {};
  }
}

function saveLocalPricing(data: Record<string, ProductPricingOverride>) {
  try {
    ensurePricingFile();
    fs.writeFileSync(PRICING_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving local pricing overrides:", err);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var _pricingTableInitialized: boolean | undefined;
}

export async function initPricingTable(): Promise<boolean> {
  if (globalThis._pricingTableInitialized) return true;
  const sql = getDb();
  if (!sql) return false;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS product_pricing (
        product_id VARCHAR(100) PRIMARY KEY,
        price NUMERIC NOT NULL,
        original_price NUMERIC,
        price_note VARCHAR(100),
        is_available BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    globalThis._pricingTableInitialized = true;
    return true;
  } catch (err) {
    console.error("[Neon DB] Gagal inisialisasi tabel product_pricing:", err);
    return false;
  }
}

export async function getAllPricingOverrides(): Promise<Record<string, ProductPricingOverride>> {
  if (isNeonConfigured()) {
    try {
      await initPricingTable();
      const sql = getDb();
      if (sql) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows: any[] = await sql`SELECT * FROM product_pricing;`;
        const result: Record<string, ProductPricingOverride> = {};
        for (const r of rows) {
          result[r.product_id] = {
            productId: r.product_id,
            price: Number(r.price),
            originalPrice: r.original_price ? Number(r.original_price) : undefined,
            priceNote: r.price_note || undefined,
            isAvailable: r.is_available !== null ? Boolean(r.is_available) : true,
            updatedAt: r.updated_at instanceof Date ? r.updated_at.toISOString() : String(r.updated_at),
          };
        }
        return result;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal membaca pricing overrides, fallback lokal:", err);
    }
  }

  return getLocalPricing();
}

export async function getMergedProducts(): Promise<
  (Product & { originalPrice?: number; discountPercent?: number })[]
> {
  const overrides = await getAllPricingOverrides();

  return products.map((base) => {
    const override = overrides[base.id];
    const finalPrice = override?.price !== undefined ? override.price : base.price;
    const originalPrice = override?.originalPrice;
    const isAvailable = override?.isAvailable !== undefined ? override.isAvailable : base.isAvailable;
    const priceNote = override?.priceNote || base.priceNote;

    let discountPercent: number | undefined = undefined;
    let computedOriginalPrice: number | undefined = originalPrice;

    if (originalPrice && originalPrice > 0) {
      if (originalPrice > finalPrice) {
        // Direct original strikethrough price (e.g. 80.000 > 65.000)
        discountPercent = Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
      } else if (originalPrice < finalPrice) {
        // Admin entered the discount amount itself (e.g. 15.000 discount on 65.000 price)
        // Original price before discount = finalPrice + discountAmount
        const discountAmount = originalPrice;
        computedOriginalPrice = finalPrice + discountAmount;
        discountPercent = Math.round((discountAmount / computedOriginalPrice) * 100);
      }
    }

    return {
      ...base,
      price: finalPrice,
      originalPrice: computedOriginalPrice,
      discountPercent,
      isAvailable,
      priceNote,
    };
  });
}

export async function getProductWithPricing(
  productId: string
): Promise<(Product & { originalPrice?: number; discountPercent?: number }) | undefined> {
  const all = await getMergedProducts();
  return all.find((p) => p.id === productId);
}

export async function updateProductPricing(
  productId: string,
  data: {
    price: number;
    originalPrice?: number;
    priceNote?: string;
    isAvailable?: boolean;
  }
): Promise<ProductPricingOverride> {
  const nowIso = new Date().toISOString();
  const override: ProductPricingOverride = {
    productId,
    price: Math.max(0, Math.round(data.price)),
    originalPrice: data.originalPrice ? Math.max(0, Math.round(data.originalPrice)) : undefined,
    priceNote: data.priceNote ? data.priceNote.trim() : undefined,
    isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
    updatedAt: nowIso,
  };

  if (isNeonConfigured()) {
    try {
      await initPricingTable();
      const sql = getDb();
      if (sql) {
        await sql`
          INSERT INTO product_pricing (
            product_id, price, original_price, price_note, is_available, updated_at
          ) VALUES (
            ${override.productId}, ${override.price}, ${override.originalPrice || null},
            ${override.priceNote || null}, ${override.isAvailable}, ${override.updatedAt}
          )
          ON CONFLICT (product_id) DO UPDATE SET
            price = EXCLUDED.price,
            original_price = EXCLUDED.original_price,
            price_note = EXCLUDED.price_note,
            is_available = EXCLUDED.is_available,
            updated_at = EXCLUDED.updated_at;
        `;
      }
    } catch (err) {
      console.error("[Neon DB] Gagal simpan pricing ke Neon, fallback lokal:", err);
    }
  }

  const local = getLocalPricing();
  local[productId] = override;
  saveLocalPricing(local);

  return override;
}

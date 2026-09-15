import { neon, NeonQueryFunction } from "@neondatabase/serverless";

declare global {
  // eslint-disable-next-line no-var
  var _neonClient: NeonQueryFunction<false, false> | undefined;
  // eslint-disable-next-line no-var
  var _ordersTableInitialized: boolean | undefined;
}

export function isNeonConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
}

export function getDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return null;
  }
  if (!globalThis._neonClient) {
    globalThis._neonClient = neon(dbUrl);
  }
  return globalThis._neonClient;
}

/**
 * Otomatis inisialisasi tabel orders jika belum ada di database Neon Postgres
 */
export async function initOrdersTable(): Promise<boolean> {
  if (globalThis._ordersTableInitialized) return true;
  const sql = getDb();
  if (!sql) return false;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        order_id VARCHAR(50) PRIMARY KEY,
        buyer_name VARCHAR(255) NOT NULL,
        buyer_email VARCHAR(255) NOT NULL,
        buyer_whatsapp VARCHAR(50) NOT NULL,
        items JSONB NOT NULL,
        base_amount NUMERIC NOT NULL,
        unique_code INT DEFAULT 0,
        total_amount NUMERIC NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        activation_link TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        paid_at TIMESTAMPTZ,
        email_sent BOOLEAN DEFAULT FALSE
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_orders_total_amount ON orders (total_amount);
    `;

    globalThis._ordersTableInitialized = true;
    console.log("[Neon DB] Tabel 'orders' berhasil diverifikasi / diinisialisasi.");
    return true;
  } catch (err) {
    console.error("[Neon DB] Gagal inisialisasi tabel orders:", err);
    return false;
  }
}

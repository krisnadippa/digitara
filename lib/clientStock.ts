let cachedSummary: Record<string, { available: number; used: number; total: number }> | null = null;
let lastFetchedTime = 0;
let inflightPromise: Promise<Record<string, { available: number; used: number; total: number }>> | null = null;

const CACHE_TTL_MS = 15000; // 15 detik client-side cache

export async function getClientStockSummary(forceRefresh = false): Promise<Record<string, { available: number; used: number; total: number }>> {
  const now = Date.now();

  if (!forceRefresh && cachedSummary && now - lastFetchedTime < CACHE_TTL_MS) {
    return cachedSummary;
  }

  if (inflightPromise) {
    return inflightPromise;
  }

  inflightPromise = (async () => {
    try {
      const res = await fetch("/api/stocks/summary", {
        headers: {
          "Accept": "application/json",
        },
      });
      const data = await res.json();
      if (data.success && data.summary) {
        cachedSummary = data.summary;
        lastFetchedTime = Date.now();
        return data.summary;
      }
      return cachedSummary || {};
    } catch (err) {
      console.error("Failed to fetch client stock summary:", err);
      return cachedSummary || {};
    } finally {
      inflightPromise = null;
    }
  })();

  return inflightPromise;
}

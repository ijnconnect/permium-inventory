import { supabaseServer } from "@/lib/supabaseServer";

export default async function StatsPage() {
  const sb = supabaseServer();

  // last 30 days OUT
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: rows } = await sb
    .from("transactions")
    .select("type, qty, created_at, items(sku,name), from:locations!transactions_from_location_id_fkey(code,name)")
    .gte("created_at", since);

  const outBySku = new Map<string, { name: string; total: number }>();
  const outByLoc = new Map<string, number>();

  for (const r of rows ?? []) {
    if ((r as any).type !== "OUT") continue;
    const sku = (r as any).items?.sku ?? "unknown";
    const name = (r as any).items?.name ?? "";
    const qty = (r as any).qty ?? 0;
    const loc = (r as any).from?.name ?? "unknown";

    outBySku.set(sku, { name, total: (outBySku.get(sku)?.total ?? 0) + qty });
    outByLoc.set(loc, (outByLoc.get(loc) ?? 0) + qty);
  }

  const topItems = [...outBySku.entries()].sort((a,b) => b[1].total - a[1].total).slice(0, 20);
  const topLocs = [...outByLoc.entries()].sort((a,b) => b[1] - a[1]);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>Stats (30 hari / 30 days)</h2>
      <p>
        Export transactions: <code>/api/export/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD</code>
      </p>

      <h3>Top OUT Items</h3>
      <ul>
        {topItems.map(([sku, v]) => (
          <li key={sku}><b>{sku}</b> — {v.name} : {v.total}</li>
        ))}
      </ul>

      <h3>OUT by Location</h3>
      <ul>
        {topLocs.map(([loc, total]) => (
          <li key={loc}><b>{loc}</b> : {total}</li>
        ))}
      </ul>
    </main>
  );
}

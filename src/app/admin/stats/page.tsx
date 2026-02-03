import { supabaseServer } from "@/lib/supabaseServer";

export default async function StatsPage() {
  const sb = supabaseServer();

  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const { data: rows, error } = await sb
    .from("transactions")
    .select(
      "type, qty, created_at, items(sku,name), from:locations!transactions_from_location_id_fkey(code,name)"
    )
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

  const topItems = [...outBySku.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 20);
  const topLocs = [...outByLoc.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <main className="container">
      <div className="card card-pad stack">
        <div className="row-between">
          <div>
            <h1 className="h1">Stats (30 hari / 30 days)</h1>
            <p className="sub">
              Export transactions:{" "}
              <code>/api/export/transactions?from=YYYY-MM-DD&amp;to=YYYY-MM-DD</code>
            </p>
          </div>
          <a className="btn btn-soft" href="/dashboard">
            Dashboard
          </a>
        </div>

        {error ? (
          <div className="badge badge-bad">Error: {error.message}</div>
        ) : null}

        <hr className="hr" />

        <div className="card card-pad">
          <div className="row-between">
            <div>
              <div className="label">Top OUT Items</div>
              <div className="helper">Jumlah item paling banyak keluar (30 hari)</div>
            </div>
            <span className="badge badge-ok">{topItems.length} item</span>
          </div>

          <div style={{ height: 10 }} />

          {topItems.length === 0 ? (
            <div className="helper">Tiada data OUT.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Item</th>
                    <th style={{ textAlign: "right" }}>Total OUT</th>
                  </tr>
                </thead>
                <tbody>
                  {topItems.map(([sku, v]) => (
                    <tr key={sku}>
                      <td className="kpi">{sku}</td>
                      <td>{v.name}</td>
                      <td style={{ textAlign: "right" }} className="kpi">
                        {v.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card card-pad">
          <div className="row-between">
            <div>
              <div className="label">OUT by Location</div>
              <div className="helper">Jumlah item keluar ikut lokasi (30 hari)</div>
            </div>
            <span className="badge badge-ok">{topLocs.length} lokasi</span>
          </div>

          <div style={{ height: 10 }} />

          {topLocs.length === 0 ? (
            <div className="helper">Tiada data lokasi.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Lokasi</th>
                    <th style={{ textAlign: "right" }}>Total OUT</th>
                  </tr>
                </thead>
                <tbody>
                  {topLocs.map(([loc, total]) => (
                    <tr key={loc}>
                      <td className="kpi">{loc}</td>
                      <td style={{ textAlign: "right" }} className="kpi">
                        {total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

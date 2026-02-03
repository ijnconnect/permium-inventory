// src/app/admin/inventory/page.tsx
import { getBaseUrl } from "@/lib/baseUrl";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  sku: string;
  name: string;
  store?: number;
  office?: number;
  vending?: number;
  total?: number;
};

export default async function InventoryAdminPage() {
  let rows: Row[] = [];
  let err: string | null = null;

  try {
    const base = await getBaseUrl();
    const url = `${base}/api/admin/inventory`;

    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // ✅ If it's HTML, show helpful message instead of "Unexpected token <"
      err = `API did not return JSON (HTTP ${res.status}). This usually means 404 or a redirect. Open this URL in browser to check: ${url}`;
      return renderPage(rows, err);
    }

    if (!res.ok) {
      err = json?.error ?? `Failed to load inventory (HTTP ${res.status})`;
    } else {
      rows = json?.rows ?? json ?? [];
    }
  } catch (e: any) {
    err = e?.message ?? String(e);
  }

  return renderPage(rows, err);
}

function renderPage(rows: Row[], err: string | null) {
  return (
    <main className="container">
      <div className="card card-pad stack">
        <div className="row-between">
          <div>
            <h1 className="h1">Inventory (Current Stock)</h1>
            <p className="sub">Latest snapshot by location</p>
          </div>
          <div className="row">
            <a className="btn btn-soft" href="/dashboard">Dashboard</a>
            <a className="btn btn-primary" href="/scan">Go to Scan</a>
          </div>
        </div>

        {err ? <div className="badge badge-bad">{err}</div> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item</th>
                <th style={{ textAlign: "right" }}>Office</th>
                <th style={{ textAlign: "right" }}>Store</th>
                <th style={{ textAlign: "right" }}>Vending</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="helper">No items found.</td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.sku}>
                    <td className="kpi">{r.sku}</td>
                    <td>{r.name}</td>
                    <td style={{ textAlign: "right" }}>{r.office ?? 0}</td>
                    <td style={{ textAlign: "right" }}>{r.store ?? 0}</td>
                    <td style={{ textAlign: "right" }}>{r.vending ?? 0}</td>
                    <td style={{ textAlign: "right" }} className="kpi">
                      {r.total ?? (r.office ?? 0) + (r.store ?? 0) + (r.vending ?? 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="helper">Tip: Use your export endpoint for CSV (if available).</div>
      </div>
    </main>
  );
}

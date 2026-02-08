export const dynamic = "force-dynamic";
export const revalidate = 0;

import { baseUrl } from "@/lib/baseUrl";

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
    const origin = await baseUrl();
    const res = await fetch(`${origin}/api/admin/inventory`, { cache: "no-store" });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // If still HTML, show a clearer message
      throw new Error(`API did not return JSON (HTTP ${res.status}). Check /api/admin/inventory.`);
    }

    if (!res.ok) err = json?.error ?? "Failed to load inventory";
    rows = json?.rows ?? [];
  } catch (e: any) {
    err = e?.message ?? String(e);
  }

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
            <a className="btn btn-primary" href="/scan/manual">Go to Stock Entry</a>
          </div>
        </div>

        {err ? <div className="badge badge-bad">{err}</div> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item</th>
                <th style={{ textAlign: "right" }}>Office (CCD)</th>
                <th style={{ textAlign: "right" }}>Store (Panas)</th>
                <th style={{ textAlign: "right" }}>Vending Machine</th>
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

        <div className="helper">
          Tip: Use your export endpoint for CSV (if available).
        </div>
      </div>
    </main>
  );
}

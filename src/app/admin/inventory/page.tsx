"use client";

import { useEffect, useState } from "react";

type Row = {
  sku: string;
  name: string;
  store: number;
  office: number;
  total: number;
};

export const dynamic = "force-dynamic";

export default function InventoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const res = await fetch("/api/admin/inventory", { cache: "no-store" });
      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) throw new Error(data?.error || "Failed to load inventory.");
      setRows(data?.rows ?? []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load inventory.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <div className="badge">Inventory</div>
          <h1 className="h1" style={{ marginTop: 10 }}>Inventory (Current Stock)</h1>
          <p className="p">Latest snapshot by location.</p>
        </div>

        <div className="btnRow">
          <a className="btn" href="/dashboard">Dashboard</a>
          <a className="btn btnPrimary" href="/scan/manual">Stock Entry</a>
        </div>
      </div>

      {err && <div className="notice error" style={{ marginBottom: 12 }}>{err}</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">SKU</th>
              <th align="left">Item</th>
              <th align="right">Office (CCD)</th>
              <th align="right">Store (Panas)</th>
              <th align="right">Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.sku}>
                <td>{r.sku}</td>
                <td>{r.name}</td>
                <td align="right">{r.office}</td>
                <td align="right">{r.store}</td>
                <td align="right"><strong>{r.total}</strong></td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ color: "#6b7280" }}>No items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="small" style={{ marginTop: 10 }}>
        {loading ? "Loading…" : `Showing ${rows.length} item(s).`}
      </div>

      <div className="btnRow" style={{ marginTop: 12 }}>
        <button className="btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </div>
  );
}

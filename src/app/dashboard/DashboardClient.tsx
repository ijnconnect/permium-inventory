"use client";

import { useEffect, useMemo, useState } from "react";

type InventoryRow = {
  sku: string;
  name: string;
  store: number;
  office: number;
  total: number;
};

type RecentTx = {
  id: string;
  ts: number;
  staff: string;
  itemSku: string;
  itemName: string;
  type: "IN" | "OUT";
  qty: number;
  loc: "store" | "office";
  locLabel: string;
  note?: string;
};

type DashboardPayload = {
  rows: InventoryRow[];
  recent: RecentTx[];
};

export default function DashboardClient() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [data, setData] = useState<DashboardPayload>({ rows: [], recent: [] });

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Dashboard API failed (${res.status}). ${text.slice(0, 140)}`);
      }

      const json = (await res.json()) as DashboardPayload;
      setData({ rows: json.rows ?? [], recent: json.recent ?? [] });
    } catch (e: any) {
      setErr(e?.message || "Failed to load dashboard.");
      setData({ rows: [], recent: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.rows;
    return data.rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q)
    );
  }, [query, data.rows]);

  return (
    <div>
      <div className="card">
        <div className="row">
          <div>
            <div className="badge">Dashboard</div>
            <h1 className="h1" style={{ marginTop: 10 }}>
              Premium Inventory Dashboard
            </h1>
            <p className="p">Stock summary and recent transactions.</p>
          </div>

          <div className="btnRow">
            <a className="btn" href="/admin/inventory">Inventory</a>
            <a className="btn" href="/admin/stats">Stats</a>
            <a className="btn btnPrimary" href="/scan/manual">Go to Stock Entry</a>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <div>
            <strong>Search Items</strong>
            <div className="small">Search by item name or SKU.</div>
          </div>

          <div className="btnRow">
            <button className="btn" onClick={load} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="field">
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search item name or SKU (e.g., "A4", "NP-A4-001")'
          />
        </div>

        {err && <div className="notice error" style={{ marginTop: 12 }}>{err}</div>}

        <div className="small" style={{ marginTop: 10 }}>
          Showing {filteredRows.length} item(s), {data.recent.length} transaction(s)
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <strong>Stock Summary</strong>
          <div className="badge">{filteredRows.length} item(s)</div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Item</th>
                <th align="left">SKU</th>
                <th align="right">Store (Panas)</th>
                <th align="right">Office (CCD)</th>
                <th align="right">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr key={r.sku}>
                  <td>{r.name}</td>
                  <td>{r.sku}</td>
                  <td align="right">{r.store}</td>
                  <td align="right">{r.office}</td>
                  <td align="right"><strong>{r.total}</strong></td>
                </tr>
              ))}
              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ color: "#6b7280" }}>No items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="row" style={{ marginBottom: 10 }}>
          <strong>Recent Transactions</strong>
          <div className="badge">{data.recent.length} record(s)</div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th align="left">Time</th>
                <th align="left">Staff</th>
                <th align="left">Type</th>
                <th align="left">Item</th>
                <th align="right">Qty</th>
                <th align="left">Location</th>
                <th align="left">Note</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.ts).toLocaleString()}</td>
                  <td>{t.staff || "-"}</td>
                  <td><span className="badge">{t.type}</span></td>
                  <td>{t.itemName} ({t.itemSku})</td>
                  <td align="right"><strong>{t.qty}</strong></td>
                  <td>{t.locLabel}</td>
                  <td style={{ color: "#6b7280" }}>{t.note || "-"}</td>
                </tr>
              ))}
              {!loading && data.recent.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ color: "#6b7280" }}>No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

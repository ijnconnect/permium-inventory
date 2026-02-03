"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type SummaryRow = {
  sku: string;
  name: string;
  store: number;
  office: number;
  vending: number;
  total: number;
};

type TxRow = {
  id: string;
  created_at: string;
  type: "IN" | "OUT" | "TRANSFER";
  qty: number;
  note: string | null;
  item: { sku: string; name: string } | null;
  from: string | null;
  to: string | null;
};

export default function DashboardPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [tx, setTx] = useState<TxRow[]>([]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    p.set("limit", "60");
    return p.toString();
  }, [q]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/dashboard?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to load dashboard");
      setSummary(data?.summary ?? []);
      setTx(data?.transactions ?? []);
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // simple debounce reload on search
  useEffect(() => {
    const t = setTimeout(() => load(), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // White corporate theme
  const c = {
    bg: "#F6F8FC",
    card: "#FFFFFF",
    border: "rgba(15,23,42,0.12)",
    text: "#0F172A",
    sub: "rgba(15,23,42,0.70)",
    input: "#F1F5F9",
    ijnRed: "#C1121F",
    good: "#16A34A",
    bad: "#DC2626",
    warn: "#F59E0B",
  };

  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: `linear-gradient(180deg, ${c.bg}, #FFFFFF)`,
    color: c.text,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    padding: 18,
  };

  const container: React.CSSProperties = { maxWidth: 1000, margin: "0 auto" };

  const card: React.CSSProperties = {
    background: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 10px 26px rgba(2,6,23,0.08)",
  };

  const input: React.CSSProperties = {
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: `1px solid ${c.border}`,
    background: c.input,
    color: c.text,
    fontSize: 16,
    outline: "none",
  };

  const btn: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 12,
    border: `1px solid ${c.border}`,
    background: "#fff",
    color: c.text,
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-block",
  };

  function badgeColor(type: TxRow["type"]) {
    if (type === "IN") return c.good;
    if (type === "OUT") return c.bad;
    return c.warn;
  }

  function fmtDate(iso: string) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <main style={page}>
      <div style={container}>
        {/* Header */}
        <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image src="/ijn-logo.png" alt="IJN" width={84} height={32} style={{ objectFit: "contain" }} priority />
            <div>
              <div style={{ fontSize: 16, fontWeight: 950 }}>Dashboard Inventori Premium</div>
              <div style={{ fontSize: 12, color: c.sub }}>Stock summary + recent transactions</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {/* These exist in your project already (you had export routes earlier). */}
            <a style={btn} href="/api/export/inventory">Export Inventory CSV</a>
            <a style={btn} href="/api/export/transactions">Export Transactions CSV</a>
            <a style={btn} href="/scan?loc=store&sig=TEMP&lang=bm">Go to Scan</a>
          </div>
        </div>

        {/* Search */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Cari Item</div>
          <div style={{ marginTop: 6, color: c.sub, fontSize: 13 }}>
            Taip nama atau SKU (contoh: “A4”, “NP-A4-001”)
          </div>

          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 140px", gap: 10 }}>
            <input
              style={input}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search item name or SKU..."
            />
            <button
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: `1px solid ${c.border}`,
                background: c.ijnRed,
                color: "#fff",
                fontWeight: 950,
                cursor: "pointer",
              }}
              onClick={() => load()}
            >
              Refresh
            </button>
          </div>

          {err ? (
            <div style={{ marginTop: 10, color: c.bad, fontWeight: 900 }}>
              {err}
            </div>
          ) : null}

          {loading ? (
            <div style={{ marginTop: 10, color: c.sub }}>Loading...</div>
          ) : (
            <div style={{ marginTop: 10, color: c.sub, fontSize: 13 }}>
              Showing {summary.length} item(s), {tx.length} transaction(s)
            </div>
          )}
        </div>

        {/* Stock summary */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Stock Summary</div>
          <div style={{ marginTop: 8, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  {["Item", "SKU", "Store", "Office", "Vending", "Total"].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "10px 10px",
                        fontSize: 12,
                        color: c.sub,
                        borderBottom: `1px solid ${c.border}`,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.map((r) => (
                  <tr key={r.sku}>
                    <td style={{ padding: "10px 10px", borderBottom: `1px solid ${c.border}`, fontWeight: 900 }}>
                      {r.name}
                    </td>
                    <td style={{ padding: "10px 10px", borderBottom: `1px solid ${c.border}`, color: c.sub }}>
                      {r.sku}
                    </td>
                    <td style={{ padding: "10px 10px", borderBottom: `1px solid ${c.border}` }}>{r.store}</td>
                    <td style={{ padding: "10px 10px", borderBottom: `1px solid ${c.border}` }}>{r.office}</td>
                    <td style={{ padding: "10px 10px", borderBottom: `1px solid ${c.border}` }}>{r.vending}</td>
                    <td style={{ padding: "10px 10px", borderBottom: `1px solid ${c.border}`, fontWeight: 950 }}>
                      {r.total}
                    </td>
                  </tr>
                ))}
                {!loading && summary.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 12, color: c.sub }}>
                      No items found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent transactions */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>Recent Transactions</div>
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {tx.map((r) => (
              <div
                key={r.id}
                style={{
                  border: `1px solid ${c.border}`,
                  borderRadius: 16,
                  padding: 12,
                  background: c.input,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 950 }}>
                    {r.item?.name ?? "Unknown Item"}{" "}
                    <span style={{ color: c.sub, fontWeight: 800 }}>
                      ({r.item?.sku ?? "?"})
                    </span>
                  </div>

                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: badgeColor(r.type),
                      color: "#fff",
                      fontWeight: 950,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.type} × {r.qty}
                  </span>
                </div>

                <div style={{ marginTop: 6, color: c.sub, fontSize: 13 }}>
                  {fmtDate(r.created_at)} •{" "}
                  {r.type === "TRANSFER"
                    ? `from ${r.from ?? "-"} → to ${r.to ?? "-"}`
                    : r.type === "OUT"
                    ? `from ${r.from ?? "-"}`
                    : `to ${r.to ?? "-"}`
                  }
                </div>

                {r.note ? (
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    <b>Note:</b> {r.note}
                  </div>
                ) : null}
              </div>
            ))}

            {!loading && tx.length === 0 ? (
              <div style={{ color: c.sub }}>No transactions found.</div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}

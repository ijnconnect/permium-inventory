"use client";

import { useEffect, useMemo, useState } from "react";

type TxType = "OUT" | "IN" | "TRANSFER";

type ItemRow = { sku: string; name: string };
type LocRow = { code: string; name: string };

export default function ScanManualClient() {
  const [pin, setPin] = useState("");
  const [pinOk, setPinOk] = useState(false);

  const [items, setItems] = useState<ItemRow[]>([]);
  const [locs, setLocs] = useState<LocRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const [itemSku, setItemSku] = useState("");
  const [fromLoc, setFromLoc] = useState("store");
  const [toLoc, setToLoc] = useState("office");
  const [type, setType] = useState<TxType>("OUT");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // load dropdown data
  useEffect(() => {
    (async () => {
      try {
        setLoadingList(true);
        const r = await fetch("/api/scan/meta", { cache: "no-store" });
        const j = await r.json();
        setItems(j.items ?? []);
        setLocs(j.locations ?? []);
        setItemSku((j.items?.[0]?.sku as string) ?? "");
      } catch (e: any) {
        setMsg(`❌ Failed to load item list: ${e?.message ?? "error"}`);
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  const canSubmit = useMemo(() => {
    if (!pinOk) return false;
    if (!itemSku) return false;
    if (!fromLoc) return false;
    if (qty < 1) return false;
    if (type === "TRANSFER" && !toLoc) return false;
    if (type === "TRANSFER" && toLoc === fromLoc) return false;
    return true;
  }, [pinOk, itemSku, fromLoc, toLoc, qty, type]);

  async function verifyPin() {
    setMsg("");
    try {
      const r = await fetch("/api/scan/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const j = await r.json();
      if (!r.ok) {
        setPinOk(false);
        setMsg(`❌ ${j?.error ?? "PIN invalid"}`);
        return;
      }
      setPinOk(true);
      setMsg("✅ PIN verified");
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "PIN verify failed"}`);
    }
  }

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    setMsg("");

    try {
      const body: any = {
        pin,
        type,
        itemSku,
        locCode: fromLoc,
        qty,
        note,
        toLocCode: type === "TRANSFER" ? toLoc : undefined,
      };

      const r = await fetch("/api/scan/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(`❌ ${j?.error ?? "Request failed"} (HTTP ${r.status})`);
        return;
      }

      setMsg("✅ Recorded");
      setNote("");
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Request failed"}`);
    } finally {
      setLoading(false);
    }
  }

  const card: React.CSSProperties = {
    background: "#fff",
    border: "1px solid #e6edf5",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  };

  const label: React.CSSProperties = { fontSize: 12, color: "#64748b", fontWeight: 800, letterSpacing: 0.3 };
  const h: React.CSSProperties = { fontSize: 18, fontWeight: 950, color: "#0f172a" };

  const input: React.CSSProperties = {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    border: "1px solid #d7e2ee",
    background: "#fff",
    fontSize: 15,
    outline: "none",
  };

  const btn: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d7e2ee",
    background: "#fff",
    fontWeight: 900,
    cursor: loading ? "not-allowed" : "pointer",
  };

  const primary: React.CSSProperties = {
    ...btn,
    background: "#b80f1a",
    border: "1px solid #b80f1a",
    color: "#fff",
  };

  return (
    <main style={{ minHeight: "100vh", background: "#f5f7fb", padding: 18, fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 1000, color: "#0f172a" }}>Scan Manual</div>
              <div style={{ color: "#64748b", fontWeight: 650 }}>Stock IN / OUT / TRANSFER (tanpa QR)</div>
            </div>
            <a href="/admin/inventory" style={{ textDecoration: "none", fontWeight: 900, color: "#0f172a" }}>
              Back to Inventory
            </a>
          </div>
        </div>

        {/* PIN */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={h}>Staff PIN</div>
          <div style={{ color: "#64748b", marginTop: 6, fontWeight: 650 }}>
            Untuk elak orang luar edit stok, masukkan PIN staff dulu.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              style={{ ...input, flex: 1 }}
              type="password"
            />
            <button style={pinOk ? btn : primary} onClick={verifyPin} disabled={loading}>
              {pinOk ? "Verified" : "Verify"}
            </button>
          </div>
        </div>

        {/* FORM */}
        <div style={{ ...card, marginTop: 12, opacity: pinOk ? 1 : 0.6 }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <div style={label}>ITEM</div>
              <select
                style={input}
                value={itemSku}
                disabled={!pinOk || loadingList}
                onChange={(e) => setItemSku(e.target.value)}
              >
                {items.map((it) => (
                  <option key={it.sku} value={it.sku}>
                    {it.sku} — {it.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={label}>LOKASI (FROM)</div>
                <select style={input} value={fromLoc} disabled={!pinOk} onChange={(e) => setFromLoc(e.target.value)}>
                  {locs.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={label}>TYPE</div>
                <select style={input} value={type} disabled={!pinOk} onChange={(e) => setType(e.target.value as TxType)}>
                  <option value="OUT">OUT (Keluar)</option>
                  <option value="IN">IN (Masuk)</option>
                  <option value="TRANSFER">TRANSFER (Pindah)</option>
                </select>
              </div>
            </div>

            {type === "TRANSFER" ? (
              <div>
                <div style={label}>LOKASI (TO)</div>
                <select style={input} value={toLoc} disabled={!pinOk} onChange={(e) => setToLoc(e.target.value)}>
                  {locs.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <div style={{ marginTop: 6, color: "#64748b", fontWeight: 650 }}>
                  (To location mesti lain dari From location)
                </div>
              </div>
            ) : null}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={label}>QTY</div>
                <input
                  style={input}
                  type="number"
                  min={1}
                  value={qty}
                  disabled={!pinOk}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
                />
              </div>
              <div>
                <div style={label}>NOTE (OPTIONAL)</div>
                <input style={input} value={note} disabled={!pinOk} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>

            <button style={primary} disabled={!canSubmit || loading} onClick={submit}>
              {loading ? "Saving..." : "Submit"}
            </button>

            {msg ? (
              <div style={{ fontWeight: 900, color: msg.startsWith("✅") ? "#0f172a" : "#b80f1a" }}>{msg}</div>
            ) : null}
          </div>
        </div>

        <div style={{ marginTop: 12, color: "#64748b", fontWeight: 650, fontSize: 13 }}>
          QR flow masih boleh guna: <b>/scan/do?item=SKU&loc=store&sig=...&lang=bm</b>
        </div>
      </div>
    </main>
  );
}

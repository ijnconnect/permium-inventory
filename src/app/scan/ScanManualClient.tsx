"use client";

import { useEffect, useMemo, useState } from "react";

type TxType = "OUT" | "IN" | "TRANSFER";
type Loc = "store" | "office" | "vending";

const STAFF = ["Danial", "Farisha", "Fatiha", "Amira", "Izrinda", "Harith", "Intern"] as const;

const LOC_LABEL: Record<Loc, string> = {
  store: "Store (Panas)",
  office: "Office (CCD)",
  vending: "Vending Machine",
};

export default function ScanManualClient() {
  // basic gate
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  // form
  const [staff, setStaff] = useState<(typeof STAFF)[number]>("Danial");
  const [type, setType] = useState<TxType>("OUT");
  const [loc, setLoc] = useState<Loc>("store");
  const [toLoc, setToLoc] = useState<Loc>("office");
  const [qty, setQty] = useState<number>(1);
  const [note, setNote] = useState<string>("");

  // items
  const [items, setItems] = useState<Array<{ sku: string; name: string }>>([]);
  const [itemSku, setItemSku] = useState<string>("");

  // status
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  // load items list (you need an endpoint that returns items)
  useEffect(() => {
    (async () => {
      try {
        // ✅ you likely already have /api/items or similar.
        // If your endpoint name is different, change it here.
        const res = await fetch("/api/items", { cache: "no-store" });
        const json = await res.json();
        const list = json?.rows ?? json ?? [];
        setItems(list);
        if (list?.[0]?.sku) setItemSku(list[0].sku);
      } catch {
        // ignore; page can still work if you type SKU manually later
      }
    })();
  }, []);

  const canSubmit = useMemo(() => {
    if (!unlocked) return false;
    if (!itemSku) return false;
    if (!loc) return false;
    if (!qty || qty < 1) return false;
    if (type === "TRANSFER" && toLoc === loc) return false;
    return true;
  }, [unlocked, itemSku, loc, qty, type, toLoc]);

  function unlock() {
    // ✅ requested PIN
    if (pin === "0000") setUnlocked(true);
    else setMsg("Incorrect PIN.");
  }

  async function submit() {
    if (!canSubmit) return;

    setLoading(true);
    setMsg("");

    try {
      const body: any = {
        itemSku,
        locCode: loc,
        type,
        qty,
        note: note ? `[${staff}] ${note}` : `[${staff}]`,
      };

      if (type === "TRANSFER") body.toLocCode = toLoc;

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch {}

      if (!res.ok) {
        setMsg(data?.error ? `❌ ${data.error} (HTTP ${res.status})` : `❌ Request failed (HTTP ${res.status})`);
        return;
      }

      setMsg("✅ Transaction recorded.");
      setNote("");
      setQty(1);
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Request failed"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 18, maxWidth: 720, margin: "0 auto", fontFamily: "system-ui" }}>
      <div style={card()}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#0f172a" }}>Stock Entry</div>
            <div style={{ color: "#64748b", fontWeight: 600 }}>
              Record IN / OUT / TRANSFER (manual mode)
            </div>
          </div>
          <a href="/admin/inventory" style={btnSoft()}>Back to Inventory</a>
        </div>
      </div>

      {!unlocked ? (
        <div style={{ ...card(), marginTop: 12 }}>
          <div style={{ fontWeight: 900, color: "#0f172a", fontSize: 18 }}>Staff Verification</div>
          <div style={{ color: "#64748b", marginTop: 6 }}>
            Enter staff PIN to access stock entry.
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              inputMode="numeric"
              style={input()}
            />
            <button onClick={unlock} style={btnPrimary()} disabled={!pin}>
              Unlock
            </button>
          </div>

          {msg ? <div style={{ marginTop: 10, fontWeight: 800, color: "#b91c1c" }}>{msg}</div> : null}
        </div>
      ) : (
        <div style={{ ...card(), marginTop: 12 }}>
          <div style={{ display: "grid", gap: 12 }}>
            {/* Staff */}
            <div>
              <div style={label()}>Staff</div>
              <select value={staff} onChange={(e) => setStaff(e.target.value as any)} style={input()}>
                {STAFF.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Item */}
            <div>
              <div style={label()}>Item</div>
              {items.length > 0 ? (
                <select value={itemSku} onChange={(e) => setItemSku(e.target.value)} style={input()}>
                  {items.map((it) => (
                    <option key={it.sku} value={it.sku}>
                      {it.sku} — {it.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={itemSku}
                  onChange={(e) => setItemSku(e.target.value)}
                  placeholder="Type SKU (e.g., NP-A4-001)"
                  style={input()}
                />
              )}
            </div>

            {/* Type + Location */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={label()}>Transaction</div>
                <select value={type} onChange={(e) => setType(e.target.value as TxType)} style={input()}>
                  <option value="OUT">OUT (Issue)</option>
                  <option value="IN">IN (Restock)</option>
                  <option value="TRANSFER">TRANSFER (Move)</option>
                </select>
              </div>

              <div>
                <div style={label()}>From Location</div>
                <select value={loc} onChange={(e) => setLoc(e.target.value as Loc)} style={input()}>
                  <option value="store">{LOC_LABEL.store}</option>
                  <option value="office">{LOC_LABEL.office}</option>
                  <option value="vending">{LOC_LABEL.vending}</option>
                </select>
              </div>
            </div>

            {/* Transfer To */}
            {type === "TRANSFER" ? (
              <div>
                <div style={label()}>To Location</div>
                <select value={toLoc} onChange={(e) => setToLoc(e.target.value as Loc)} style={input()}>
                  <option value="store">{LOC_LABEL.store}</option>
                  <option value="office">{LOC_LABEL.office}</option>
                  <option value="vending">{LOC_LABEL.vending}</option>
                </select>
                {toLoc === loc ? (
                  <div style={{ marginTop: 6, color: "#b91c1c", fontWeight: 700 }}>
                    “To Location” must be different from “From Location”.
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Qty + Note */}
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12 }}>
              <div>
                <div style={label()}>Quantity</div>
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
                  style={input()}
                />
              </div>
              <div>
                <div style={label()}>Note (optional)</div>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., customer request / event / replacement"
                  style={input()}
                />
              </div>
            </div>

            <button style={btnPrimary()} disabled={!canSubmit || loading} onClick={submit}>
              {loading ? "Saving..." : "Submit"}
            </button>

            {msg ? (
              <div style={{ fontWeight: 900, color: msg.startsWith("✅") ? "#0f172a" : "#b91c1c" }}>
                {msg}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}

function card(): React.CSSProperties {
  return {
    background: "white",
    border: "1px solid #e6edf6",
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
  };
}

function label(): React.CSSProperties {
  return { fontSize: 13, fontWeight: 900, color: "#334155", marginBottom: 6 };
}

function input(): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid #d6dde6",
    fontSize: 15,
    background: "white",
    color: "#0f172a",
  };
}

function btnPrimary(): React.CSSProperties {
  return {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #b80f1a",
    background: "#b80f1a",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  };
}

function btnSoft(): React.CSSProperties {
  return {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #d6dde6",
    background: "white",
    color: "#0f172a",
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-block",
  };
}

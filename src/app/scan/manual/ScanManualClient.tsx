"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { sku: string; name: string };
type TxType = "IN" | "OUT";
type LocKey = "store" | "office";

const STAFF = ["Danial", "Farisha", "Fatiha", "Amira", "Izrinda", "Harith", "Intern"] as const;

const LOCATIONS: { key: LocKey; label: string }[] = [
  { key: "office", label: "Office (CCD)" },
  { key: "store", label: "Store (Panas)" },
];

export default function ScanManualClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [staff, setStaff] = useState<string>(STAFF[0]);
  const [itemSku, setItemSku] = useState("");
  const [type, setType] = useState<TxType>("IN");
  const [qty, setQty] = useState<number>(1);
  const [loc, setLoc] = useState<LocKey>("office");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ kind: "idle" | "error" | "success"; text?: string }>({
    kind: "idle",
  });

  const selectedItem = useMemo(() => items.find((i) => i.sku === itemSku), [items, itemSku]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingItems(true);
        const res = await fetch("/api/items", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load items.");
        const data = (await res.json()) as { items: Item[] };

        if (!mounted) return;
        const list = data.items ?? [];
        setItems(list);
        setItemSku(list[0]?.sku ?? "");
      } catch (e: any) {
        if (!mounted) return;
        setMsg({ kind: "error", text: e?.message || "Unable to load items." });
      } finally {
        if (!mounted) return;
        setLoadingItems(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function submit() {
    setMsg({ kind: "idle" });

    if (!staff || !itemSku || !Number.isFinite(qty) || qty <= 0 || !loc || !type) {
      setMsg({ kind: "error", text: "Please complete all required fields." });
      return;
    }

    const payload = {
      staff,
      itemSku,
      type,
      qty: Math.floor(qty),
      loc,
      note: note ? note : undefined,
    };

    try {
      setSubmitting(true);
      const res = await fetch("/api/scan/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        setMsg({ kind: "error", text: data?.error || "Submission failed." });
        return;
      }

      setMsg({ kind: "success", text: data?.message || "Transaction recorded successfully." });
      setQty(1);
      setNote("");
    } catch {
      setMsg({ kind: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <div className="badge">Manual Stock Entry</div>
          <div className="small" style={{ marginTop: 6 }}>
            Enter transactions without QR scanning.
          </div>
        </div>

        <div className="btnRow">
          <a className="btn" href="/admin/inventory">View Inventory</a>
          <a className="btn" href="/dashboard">Dashboard</a>
        </div>
      </div>

      {loadingItems ? (
        <div className="notice">Loading items…</div>
      ) : (
        <div className="formGrid">
          <div className="field">
            <label className="label">Staff</label>
            <select className="select" value={staff} onChange={(e) => setStaff(e.target.value)}>
              {STAFF.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label">Transaction Type</label>
            <select className="select" value={type} onChange={(e) => setType(e.target.value as TxType)}>
              <option value="IN">IN (Restock)</option>
              <option value="OUT">OUT (Take)</option>
            </select>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label className="label">Item</label>
         <select className="input" value={itemSku} onChange={(e) => setItemSku(e.target.value)}>
  <option value="">Select an item…</option>
  {items.map((it) => (
    <option key={it.sku} value={it.sku}>
      {it.name} ({it.sku})
    </option>
  ))}
</select>

            {selectedItem && <div className="small">Selected: {selectedItem.name}</div>}
          </div>

          <div className="field">
            <label className="label">Quantity</label>
            <input
              className="input"
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <label className="label">Location</label>
            <select className="select" value={loc} onChange={(e) => setLoc(e.target.value as LocKey)}>
              {LOCATIONS.map((l) => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label className="label">Note (Optional)</label>
            <textarea
              className="textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add context if required."
            />
          </div>
        </div>
      )}

      {msg.kind === "error" && <div className="notice error" style={{ marginTop: 12 }}>{msg.text}</div>}
      {msg.kind === "success" && <div className="notice success" style={{ marginTop: 12 }}>{msg.text}</div>}

      <div className="btnRow" style={{ marginTop: 12 }}>
        <button className="btn btnPrimary" onClick={submit} disabled={submitting || loadingItems}>
          {submitting ? "Submitting…" : "Submit Transaction"}
        </button>
      </div>
    </div>
  );
}

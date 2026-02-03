"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { t, Lang } from "@/lib/i18n";

type TxType = "OUT" | "IN" | "TRANSFER";
type ToastKind = "success" | "error" | "info";

type Toast = {
  kind: ToastKind;
  text: string;
} | null;

export default function ScanDoPage() {
  const sp = useSearchParams();

  const sku = sp.get("item") || "";
  const loc = sp.get("loc") || "";
  const sig = sp.get("sig") || "";
  const lang = (sp.get("lang") as Lang) || "bm";

  const [itemName, setItemName] = useState<string>("");
  const [itemLoading, setItemLoading] = useState<boolean>(false);

  const [qty, setQty] = useState<number>(1);
  const [toLoc, setToLoc] = useState<string>("store");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast>(null);

  const valid = useMemo(() => sku && loc && sig, [sku, loc, sig]);

  function locLabel(code: string) {
    const map: Record<string, { bm: string; en: string }> = {
      store: { bm: "Kedai", en: "Store" },
      office: { bm: "Pejabat", en: "Office" },
      vending: { bm: "Mesin", en: "Vending" },
    };
    const v = map[code];
    if (!v) return code;
    return t(lang, `${v.bm} (${code})`, `${v.en} (${code})`);
  }

  function showToast(kind: ToastKind, bm: string, en: string) {
    setToast({ kind, text: t(lang, bm, en) });
    setTimeout(() => setToast(null), 4000);
  }

  function toastDot(kind: ToastKind) {
    if (kind === "success") return "#16A34A";
    if (kind === "error") return "#DC2626";
    return "#F59E0B";
  }

  // fetch item name
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!sku) return;
      setItemLoading(true);
      try {
        const res = await fetch(`/api/item?sku=${encodeURIComponent(sku)}`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          if (res.ok) setItemName(data?.name || "");
          else setItemName("");
        }
      } finally {
        if (!cancelled) setItemLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sku]);

  async function submit(type: TxType, quickQty?: number) {
    if (!valid) {
      showToast("error", "QR tidak lengkap.", "Invalid QR.");
      return;
    }

    setLoading(true);
    setToast(null);

    const body: any = { itemSku: sku, locCode: loc, sig, type, note };
    if (type === "OUT") body.qty = quickQty ?? qty;
    if (type === "IN") body.qty = quickQty ?? qty;
    if (type === "TRANSFER") {
      body.qty = quickQty ?? qty;
      body.toLocCode = toLoc;
    }

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch {}

      if (!res.ok) {
        const msg = data?.error ? String(data.error) : "Request failed";
        setToast({ kind: "error", text: `❌ ${msg} (HTTP ${res.status})` });
        return;
      }

      if (type === "IN") showToast("success", "✅ Stok berjaya ditambah", "✅ Restock recorded");
      if (type === "OUT") showToast("success", "✅ Berjaya direkod KELUAR", "✅ OUT recorded");
      if (type === "TRANSFER") showToast("success", "✅ Berjaya PINDAH lokasi", "✅ Transfer recorded");
    } catch (e: any) {
      setToast({ kind: "error", text: `❌ Network error: ${e?.message ?? e}` });
    } finally {
      setLoading(false);
    }
  }

  // White corporate theme
  const c = {
    bg: "#F6F8FC",
    card: "#FFFFFF",
    border: "rgba(15,23,42,0.12)",
    text: "#0F172A",
    sub: "rgba(15,23,42,0.70)",
    ijnRed: "#C1121F",
    ijnRed2: "#E11D2E",
    input: "#F1F5F9",
  };

  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: `linear-gradient(180deg, ${c.bg}, #FFFFFF)`,
    color: c.text,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    padding: 18,
  };

  const container: React.CSSProperties = { maxWidth: 560, margin: "0 auto" };

  const card: React.CSSProperties = {
    background: c.card,
    border: `1px solid ${c.border}`,
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 10px 26px rgba(2,6,23,0.08)",
  };

  // IMPORTANT: force text color black
  const btnBase: React.CSSProperties = {
    padding: "14px 16px",
    borderRadius: 14,
    border: `1px solid ${c.border}`,
    background: "#fff",
    color: "#0F172A", // ✅ black text
    fontWeight: 950,
    fontSize: 16,
    cursor: "pointer",
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    color: "#fff",
    border: "1px solid rgba(193,18,31,0.25)",
    background: `linear-gradient(135deg, ${c.ijnRed}, ${c.ijnRed2})`,
  };

  const btnSoft: React.CSSProperties = {
    ...btnBase,
    background: c.input,
  };

  const disabledStyle: React.CSSProperties = {
    opacity: 0.55,
    cursor: "not-allowed",
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

  const chip: React.CSSProperties = {
    padding: "8px 10px",
    borderRadius: 999,
    border: `1px solid ${c.border}`,
    textDecoration: "none",
    fontWeight: 800,
    color: c.text,
    background: "#fff",
  };

  return (
    <main style={page}>
      <div style={container}>
        {/* Header */}
        <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image src="/ijn-logo.png" alt="IJN" width={84} height={32} style={{ objectFit: "contain" }} priority />
            <div>
              <div style={{ fontSize: 14, fontWeight: 950 }}>
                {t(lang, "Imbas Item", "Scan Item")}
              </div>
              <div style={{ fontSize: 12, color: c.sub }}>
                {t(lang, "Rekod keluar/masuk stok", "Record stock movement")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <a style={chip} href={`/scan/do?item=${encodeURIComponent(sku)}&loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(sig)}&lang=bm`}>BM</a>
            <a style={chip} href={`/scan/do?item=${encodeURIComponent(sku)}&loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(sig)}&lang=en`}>EN</a>
          </div>
        </div>

        {/* Back to item picker */}
        <div style={{ marginTop: 10 }}>
          <a
            href={`/scan?loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(sig)}&lang=${encodeURIComponent(lang)}`}
            style={{ ...chip, display: "inline-block" }}
          >
            ← {t(lang, "Tukar Item", "Change Item")}
          </a>
        </div>

        {!valid ? (
          <div style={{ ...card, marginTop: 12, borderColor: "rgba(220,38,38,0.35)" }}>
            <div style={{ fontWeight: 950, color: "#DC2626" }}>
              {t(lang, "QR tidak lengkap", "Invalid QR")}
            </div>
          </div>
        ) : (
          <>
            {/* Item card */}
            <div style={{ ...card, marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: c.sub, fontWeight: 800 }}>{t(lang, "ITEM", "ITEM")}</div>
                  <div style={{ fontSize: 18, fontWeight: 950, marginTop: 2 }}>
                    {itemLoading ? t(lang, "Memuatkan...", "Loading...") : (itemName || sku)}
                  </div>
                  <div style={{ fontSize: 12, color: c.sub, marginTop: 2 }}>
                    SKU: <span style={{ fontWeight: 800 }}>{sku}</span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: c.sub, fontWeight: 800 }}>{t(lang, "LOKASI", "LOCATION")}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, marginTop: 2 }}>{locLabel(loc)}</div>
                </div>
              </div>
            </div>

            {/* Toast */}
            {toast ? (
              <div style={{ ...card, marginTop: 12, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: toastDot(toast.kind) }} />
                  <div style={{ fontWeight: 850 }}>{toast.text}</div>
                </div>
              </div>
            ) : null}

            {/* Qty + note */}
            <div style={{ ...card, marginTop: 12 }}>
              <div style={{ fontWeight: 900, fontSize: 13, color: c.sub }}>{t(lang, "Kuantiti", "Quantity")}</div>

              <div style={{ display: "grid", gridTemplateColumns: "64px 1fr 64px", gap: 10, marginTop: 8 }}>
                <button style={{ ...btnSoft, fontSize: 18, ...(loading ? disabledStyle : {}) }} disabled={loading} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                  −
                </button>

                <input style={input} type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))} />

                <button style={{ ...btnSoft, fontSize: 18, ...(loading ? disabledStyle : {}) }} disabled={loading} onClick={() => setQty((q) => q + 1)}>
                  +
                </button>
              </div>

              <div style={{ fontWeight: 900, fontSize: 13, color: c.sub, marginTop: 14 }}>{t(lang, "Nota (optional)", "Note (optional)")}</div>
              <input style={{ ...input, marginTop: 8 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t(lang, "cth: ambil untuk pelanggan", "e.g., taken for customer")} />
            </div>

            {/* Actions */}
            <div style={{ ...card, marginTop: 12 }}>
              <div style={{ display: "grid", gap: 10 }}>
                <button style={{ ...btnPrimary, ...(loading ? disabledStyle : {}) }} disabled={loading} onClick={() => submit("OUT", 1)}>
                  {loading ? t(lang, "Memproses...", "Processing...") : t(lang, "KELUAR -1 (Pantas)", "OUT -1 (Quick)")}
                </button>

                <button style={{ ...btnSoft, ...(loading ? disabledStyle : {}) }} disabled={loading} onClick={() => submit("OUT")}>
                  {t(lang, "KELUAR ikut kuantiti", "OUT using quantity")}
                </button>

                <button style={{ ...btnSoft, ...(loading ? disabledStyle : {}) }} disabled={loading} onClick={() => submit("IN")}>
                  {t(lang, "MASUK / Restock", "IN / Restock")}
                </button>

                <div style={{ marginTop: 6, padding: 12, borderRadius: 16, border: `1px solid ${c.border}`, background: c.input }}>
                  <div style={{ fontWeight: 950 }}>{t(lang, "PINDAH (TRANSFER)", "TRANSFER")}</div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10, marginTop: 10 }}>
                    <select value={toLoc} onChange={(e) => setToLoc(e.target.value)} style={input}>
                      <option value="store">Store / Kedai</option>
                      <option value="office">Office / Pejabat</option>
                      <option value="vending">Vending / Mesin</option>
                    </select>

                    <button style={{ ...btnSoft, ...(loading ? disabledStyle : {}) }} disabled={loading} onClick={() => submit("TRANSFER")}>
                      {t(lang, "PINDAH", "MOVE")}
                    </button>
                  </div>

                  <div style={{ marginTop: 8, color: c.sub, fontSize: 12 }}>
                    {t(lang, "Guna PINDAH untuk pindah stok lokasi.", "Use TRANSFER to move stock between locations.")}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

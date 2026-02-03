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

export default function ScanDoClient() {
  const sp = useSearchParams();

  // read params
  const item = sp.get("item") || "";
  const loc = sp.get("loc") || "store";
  const sig = sp.get("sig") || "";
  const lang = (sp.get("lang") as Lang) || "bm";

  const [qty, setQty] = useState<number>(1);
  const [toLoc, setToLoc] = useState<string>("store");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast>(null);

  const valid = useMemo(() => !!(item && loc && sig), [item, loc, sig]);

  // auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const tmr = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(tmr);
  }, [toast]);

  const palette = {
    bg: "#f4f6f9",
    card: "#ffffff",
    text: "#0f172a",
    sub: "#475569",
    line: "#e5e7eb",
    brand: "#b5121b", // IJN-ish red
    brandDark: "#8b0e15",
    good: "#16a34a",
    bad: "#dc2626",
    warn: "#d97706",
  };

  function toastColor(kind: ToastKind) {
    if (kind === "success") return palette.good;
    if (kind === "error") return palette.bad;
    return palette.warn;
  }

  async function submit(type: TxType, quickQty?: number) {
    if (!valid) {
      setToast({ kind: "error", text: t(lang, "QR tak lengkap.", "Invalid QR.") });
      return;
    }

    setLoading(true);
    setToast(null);

    const body: any = { itemSku: item, locCode: loc, sig, type, note };
    body.qty = quickQty ?? qty;
    if (type === "TRANSFER") body.toLocCode = toLoc;

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
        setToast({
          kind: "error",
          text: (data?.error ? `❌ ${data.error}` : `❌ Request failed`) + ` (HTTP ${res.status})`,
        });
        return;
      }

      setToast({ kind: "success", text: t(lang, "✅ Berjaya direkod", "✅ Recorded") });
      setNote("");
      // optional: keep qty as-is
    } catch (e: any) {
      setToast({ kind: "error", text: `❌ Network error: ${e?.message ?? String(e)}` });
    } finally {
      setLoading(false);
    }
  }

  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: palette.bg,
    color: palette.text,
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
    padding: 16,
  };

  const card: React.CSSProperties = {
    background: palette.card,
    border: `1px solid ${palette.line}`,
    borderRadius: 18,
    padding: 16,
    boxShadow: "0 10px 30px rgba(15,23,42,0.06)",
  };

  const btnBase: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 16,
    border: `1px solid ${palette.line}`,
    fontWeight: 800,
    fontSize: 16,
    cursor: "pointer",
  };

  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    background: palette.brand,
    borderColor: palette.brand,
    color: "#111111", // YOU ASKED: black text
  };

  const btnGhost: React.CSSProperties = {
    ...btnBase,
    background: "#f8fafc",
    color: "#111111", // black text
  };

  const btnDisabled: React.CSSProperties = {
    opacity: 0.6,
    cursor: "not-allowed",
  };

  return (
    <main style={page}>
      <div style={{ maxWidth: 680, margin: "0 auto", display: "grid", gap: 14 }}>
        {/* Header */}
        <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image src="/ijn-logo.png" alt="IJN" width={48} height={48} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.2 }}>
                {t(lang, "Sistem Inventori Premium", "Premium Inventory System")}
              </div>
              <div style={{ color: palette.sub, fontWeight: 600, fontSize: 13 }}>
                {t(lang, "Rekod stok dengan pantas", "Quick stock recording")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, fontWeight: 800 }}>
            <a
              style={{ textDecoration: "none", color: palette.text }}
              href={`/scan/do?item=${encodeURIComponent(item)}&loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(
                sig
              )}&lang=bm`}
            >
              BM
            </a>
            <span style={{ color: palette.sub }}>|</span>
            <a
              style={{ textDecoration: "none", color: palette.text }}
              href={`/scan/do?item=${encodeURIComponent(item)}&loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(
                sig
              )}&lang=en`}
            >
              EN
            </a>
          </div>
        </div>

        {/* Toast */}
        {toast ? (
          <div
            style={{
              ...card,
              borderColor: toastColor(toast.kind),
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ fontWeight: 800 }}>{toast.text}</div>
            <button style={{ ...btnGhost, width: "auto", padding: "10px 12px" }} onClick={() => setToast(null)}>
              OK
            </button>
          </div>
        ) : null}

        {/* Invalid QR */}
        {!valid ? (
          <div style={card}>
            <div style={{ fontWeight: 900, fontSize: 18, color: palette.bad }}>
              {t(lang, "QR tidak lengkap", "Invalid QR")}
            </div>
            <div style={{ marginTop: 8, color: palette.sub, fontWeight: 600 }}>
              {t(
                lang,
                "Pastikan link ada item, loc, sig. Contoh: /scan/do?item=NP-A4-001&loc=store&sig=TEMP",
                "Make sure link has item, loc, sig. Example: /scan/do?item=NP-A4-001&loc=store&sig=TEMP"
              )}
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
              <a href={`/scan?loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(sig)}&lang=${lang}`}>
                <button style={btnPrimary}>{t(lang, "Pergi ke Pilih Item", "Go to Item Picker")}</button>
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* Item card */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: palette.sub, fontWeight: 800, letterSpacing: 0.6 }}>
                    {t(lang, "ITEM", "ITEM")}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 950, marginTop: 2 }}>
                    {item}
                  </div>
                  <div style={{ marginTop: 2, color: palette.sub, fontWeight: 700 }}>
                    {t(lang, "SKU", "SKU")}: <span style={{ fontWeight: 900 }}>{item}</span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: palette.sub, fontWeight: 800, letterSpacing: 0.6 }}>
                    {t(lang, "LOKASI", "LOCATION")}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 950, marginTop: 2 }}>
                    {loc === "store"
                      ? t(lang, "Kedai", "Store")
                      : loc === "office"
                      ? t(lang, "Pejabat", "Office")
                      : loc === "vending"
                      ? t(lang, "Vending", "Vending")
                      : loc}
                    <span style={{ color: palette.sub, fontWeight: 800 }}> ({loc})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Qty + Note */}
            <div style={{ ...card, display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{t(lang, "Kuantiti", "Quantity")}</div>
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    style={{ ...btnGhost, width: 64 }}
                    disabled={loading}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 16,
                      border: `1px solid ${palette.line}`,
                      fontSize: 16,
                      fontWeight: 800,
                      background: "#f8fafc",
                      color: "#111111",
                    }}
                  />
                  <button
                    style={{ ...btnGhost, width: 64 }}
                    disabled={loading}
                    onClick={() => setQty((q) => q + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{t(lang, "Nota (optional)", "Note (optional)")}</div>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t(lang, "cth: ambil untuk pelanggan", "e.g., taken for customer")}
                  style={{
                    width: "100%",
                    padding: 14,
                    borderRadius: 16,
                    border: `1px solid ${palette.line}`,
                    fontSize: 16,
                    fontWeight: 700,
                    background: "#f8fafc",
                    marginTop: 10,
                    color: "#111111",
                  }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "grid", gap: 10 }}>
              <button
                style={{ ...btnPrimary, ...(loading ? btnDisabled : {}) }}
                disabled={loading}
                onClick={() => submit("OUT", 1)}
              >
                {t(lang, "KELUAR -1 (Pantas)", "OUT -1 (Quick)")}
              </button>

              <button
                style={{ ...btnGhost, ...(loading ? btnDisabled : {}) }}
                disabled={loading}
                onClick={() => submit("OUT")}
              >
                {t(lang, "KELUAR ikut kuantiti", "OUT using quantity")}
              </button>

              <button
                style={{ ...btnGhost, ...(loading ? btnDisabled : {}) }}
                disabled={loading}
                onClick={() => submit("IN")}
              >
                {t(lang, "MASUK / Restock", "IN / Restock")}
              </button>

              <div style={card}>
                <div style={{ fontWeight: 950, fontSize: 18 }}>{t(lang, "PINDAH (TRANSFER)", "TRANSFER")}</div>
                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                  <select
                    value={toLoc}
                    onChange={(e) => setToLoc(e.target.value)}
                    style={{
                      flex: 1,
                      padding: 14,
                      borderRadius: 16,
                      border: `1px solid ${palette.line}`,
                      fontSize: 16,
                      fontWeight: 800,
                      background: "#f8fafc",
                      color: "#111111",
                    }}
                  >
                    <option value="store">{t(lang, "Store / Kedai", "Store")}</option>
                    <option value="office">{t(lang, "Office / Pejabat", "Office")}</option>
                    <option value="vending">{t(lang, "Vending / Mesin", "Vending")}</option>
                  </select>

                  <button
                    style={{ ...btnPrimary, width: 160, ...(loading ? btnDisabled : {}) }}
                    disabled={loading}
                    onClick={() => submit("TRANSFER")}
                  >
                    {t(lang, "PINDAH", "MOVE")}
                  </button>
                </div>

                <div style={{ marginTop: 10, color: palette.sub, fontWeight: 700 }}>
                  {t(lang, "Guna PINDAH untuk pindah stok lokasi.", "Use MOVE to transfer stock between locations.")}
                </div>
              </div>
            </div>

            {/* Quick navigation */}
            <div style={{ textAlign: "center", color: palette.sub, fontWeight: 700, marginTop: 6 }}>
              <a
                href={`/scan?loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(sig)}&lang=${lang}`}
                style={{ color: palette.brand, fontWeight: 900, textDecoration: "none" }}
              >
                {t(lang, "← Tukar item", "← Change item")}
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

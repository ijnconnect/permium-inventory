"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { t, Lang } from "@/lib/i18n";

type TxType = "OUT" | "IN" | "TRANSFER";

export default function ScanClient() {
  const sp = useSearchParams();

  const item = sp.get("item") || "";
  const loc = sp.get("loc") || "store";
  const sig = sp.get("sig") || "";
  const lang = (sp.get("lang") as Lang) || "bm";

  const [qty, setQty] = useState<number>(1);
  const [toLoc, setToLoc] = useState<string>("store");
  const [note, setNote] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const valid = useMemo(() => Boolean(item && loc && sig), [item, loc, sig]);

  async function submit(type: TxType, quickQty?: number) {
    if (!valid) return;

    setLoading(true);
    setMsg("");

    try {
      const body: any = { itemSku: item, locCode: loc, sig, type, note };

      if (type === "OUT" || type === "IN") body.qty = quickQty ?? qty;
      if (type === "TRANSFER") {
        body.qty = quickQty ?? qty;
        body.toLocCode = toLoc;
      }

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
        setMsg((data?.error ? `❌ ${data.error}` : `❌ Request failed`) + ` (HTTP ${res.status})`);
        return;
      }

      setMsg(t(lang, "✅ Berjaya direkod", "✅ Recorded"));
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? "Request failed"}`);
    } finally {
      setLoading(false);
    }
  }

  const btnStyle: React.CSSProperties = {
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #d6dde6",
    fontWeight: 800,
    fontSize: 16,
    background: "white",
    cursor: loading ? "not-allowed" : "pointer",
  };

  const primaryBtn: React.CSSProperties = {
    ...btnStyle,
    background: "#b80f1a", // IJN-ish red
    color: "#111", // you asked black text
    border: "1px solid #b80f1a",
  };

  return (
    <main style={{ padding: 18, maxWidth: 560, margin: "0 auto", fontFamily: "system-ui" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: 14,
          borderRadius: 18,
          border: "1px solid #e7edf4",
          background: "white",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/ijn-logo.png" alt="IJN" width={44} height={44} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.1 }}>
              {t(lang, "Imbas Item", "Scan Item")}
            </div>
            <div style={{ fontSize: 13, color: "#566" }}>
              {t(lang, "Rekod stok dengan cepat & kemas", "Record stock quickly & neatly")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, fontWeight: 800 }}>
          <a
            style={{ textDecoration: "none", color: "#111" }}
            href={`/scan?item=${encodeURIComponent(item)}&loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(sig)}&lang=bm`}
          >
            BM
          </a>
          <span style={{ color: "#999" }}>|</span>
          <a
            style={{ textDecoration: "none", color: "#111" }}
            href={`/scan?item=${encodeURIComponent(item)}&loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(sig)}&lang=en`}
          >
            EN
          </a>
        </div>
      </div>

      {!valid ? (
        <p style={{ marginTop: 14, color: "#b80f1a", fontWeight: 800 }}>
          {t(lang, "QR tidak lengkap. Pastikan ada item, loc, sig.", "Invalid QR. Missing item/loc/sig.")}
        </p>
      ) : (
        <>
          {/* Item card */}
          <div
            style={{
              marginTop: 14,
              padding: 16,
              borderRadius: 18,
              border: "1px solid #e7edf4",
              background: "white",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: 0.6, color: "#667" }}>{t(lang, "ITEM", "ITEM")}</div>
                <div style={{ fontSize: 26, fontWeight: 950, color: "#0f172a" }}>{item}</div>
                <div style={{ color: "#6b7280", fontWeight: 700 }}>SKU: {item}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, letterSpacing: 0.6, color: "#667" }}>{t(lang, "LOKASI", "LOCATION")}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{loc}</div>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div
            style={{
              marginTop: 14,
              padding: 16,
              borderRadius: 18,
              border: "1px solid #e7edf4",
              background: "white",
              boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a" }}>{t(lang, "Kuantiti", "Quantity")}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button style={btnStyle} disabled={loading} onClick={() => setQty((q) => Math.max(1, q - 1))}>
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
                  borderRadius: 14,
                  border: "1px solid #d6dde6",
                  fontSize: 16,
                }}
              />
              <button style={btnStyle} disabled={loading} onClick={() => setQty((q) => q + 1)}>
                +
              </button>
            </div>

            <div style={{ marginTop: 12, fontWeight: 900, fontSize: 16, color: "#0f172a" }}>
              {t(lang, "Nota (optional)", "Note (optional)")}
            </div>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t(lang, "cth: ambil untuk pelanggan", "e.g., taken for customer")}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 14,
                border: "1px solid #d6dde6",
                fontSize: 16,
                marginTop: 8,
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <button style={primaryBtn} disabled={loading} onClick={() => submit("OUT", 1)}>
              {t(lang, "KELUAR -1 (Pantas)", "OUT -1 (Quick)")}
            </button>

            <button style={btnStyle} disabled={loading} onClick={() => submit("OUT")}>
              {t(lang, "KELUAR ikut kuantiti", "OUT using quantity")}
            </button>

            <button style={btnStyle} disabled={loading} onClick={() => submit("IN")}>
              {t(lang, "MASUK / Restock", "IN / Restock")}
            </button>

            <div style={{ padding: 16, borderRadius: 18, border: "1px solid #e7edf4", background: "white" }}>
              <div style={{ fontWeight: 950, fontSize: 18, color: "#0f172a" }}>
                {t(lang, "PINDAH (TRANSFER)", "TRANSFER")}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <select
                  value={toLoc}
                  onChange={(e) => setToLoc(e.target.value)}
                  style={{
                    flex: 1,
                    padding: 14,
                    borderRadius: 14,
                    border: "1px solid #d6dde6",
                    fontSize: 16,
                    background: "white",
                  }}
                >
                  <option value="store">Store / Kedai</option>
                  <option value="office">Office / Pejabat</option>
                  <option value="vending">Vending / Mesin</option>
                </select>

                <button style={btnStyle} disabled={loading} onClick={() => submit("TRANSFER")}>
                  {t(lang, "PINDAH", "MOVE")}
                </button>
              </div>
              <div style={{ marginTop: 10, color: "#667", fontWeight: 650 }}>
                {t(lang, "Guna PINDAH untuk pindah stok lokasi.", "Use MOVE to transfer stock between locations.")}
              </div>
            </div>
          </div>

          {msg ? (
            <div style={{ marginTop: 12, fontWeight: 900, color: msg.startsWith("✅") ? "#0f172a" : "#b80f1a" }}>
              {msg}
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

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
  const lang = ((sp.get("lang") as Lang) || "bm") as Lang;

  const [qty, setQty] = useState<number>(1);
  const [toLoc, setToLoc] = useState<string>("store");
  const [note, setNote] = useState<string>("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // if your QR always has item+loc+sig
  const valid = useMemo(() => Boolean(item && loc && sig), [item, loc, sig]);

  async function submit(txType: TxType, quickQty?: number) {
    if (!valid) return;

    setLoading(true);
    setMsg("");

    try {
      const body: any = {
        itemSku: item,
        locCode: loc,
        sig,
        type: txType,
        note: note || undefined,
      };

      const finalQty = quickQty ?? qty;

      if (txType === "OUT" || txType === "IN") body.qty = finalQty;
      if (txType === "TRANSFER") {
        body.qty = finalQty;
        body.toLocCode = toLoc;
      }

      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(
          (data?.error ? `❌ ${data.error}` : `❌ ${t(lang, "requestFail")}`) +
            ` (HTTP ${res.status})`
        );
        return;
      }

      setMsg(`✅ ${t(lang, "berjaya")}`);
    } catch (e: any) {
      setMsg(`❌ ${e?.message ?? t(lang, "networkError")}`);
    } finally {
      setLoading(false);
    }
  }

  const card: React.CSSProperties = {
    padding: 16,
    borderRadius: 18,
    border: "1px solid #e7edf4",
    background: "white",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  };

  const btn: React.CSSProperties = {
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid #d6dde6",
    fontWeight: 850,
    fontSize: 16,
    background: "white",
    cursor: loading ? "not-allowed" : "pointer",
  };

  const btnPrimary: React.CSSProperties = {
    ...btn,
    background: "#b80f1a",
    color: "#fff",
    border: "1px solid #b80f1a",
  };

  return (
    <main style={{ padding: 18, maxWidth: 560, margin: "0 auto", fontFamily: "system-ui" }}>
      {/* Header */}
      <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Image src="/ijn-logo.png" alt="IJN" width={44} height={44} />
          <div>
            <div style={{ fontWeight: 950, fontSize: 18, lineHeight: 1.1 }}>
              {t(lang, "title")}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 650 }}>
              {t(lang, "subtitle")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, fontWeight: 900 }}>
          <a
            style={{ textDecoration: "none", color: "#0f172a" }}
            href={`/scan?item=${encodeURIComponent(item)}&loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(sig)}&lang=bm`}
          >
            BM
          </a>
          <span style={{ color: "#94a3b8" }}>|</span>
          <a
            style={{ textDecoration: "none", color: "#0f172a" }}
            href={`/scan?item=${encodeURIComponent(item)}&loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(sig)}&lang=en`}
          >
            EN
          </a>
        </div>
      </div>

      {!valid ? (
        <p style={{ marginTop: 14, color: "#b80f1a", fontWeight: 900 }}>
          {t(lang, "invalidQr")}
        </p>
      ) : (
        <>
          {/* Item card */}
          <div style={{ ...card, marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: 0.6, color: "#64748b", fontWeight: 900 }}>
                  {t(lang, "item")}
                </div>
                <div style={{ fontSize: 26, fontWeight: 980, color: "#0f172a" }}>{item}</div>
                <div style={{ color: "#64748b", fontWeight: 750 }}>SKU: {item}</div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, letterSpacing: 0.6, color: "#64748b", fontWeight: 900 }}>
                  {t(lang, "lokasi")}
                </div>
                <div style={{ fontSize: 18, fontWeight: 950, color: "#0f172a" }}>{loc}</div>
              </div>
            </div>
          </div>

          {/* Quantity + note */}
          <div style={{ ...card, marginTop: 14 }}>
            <div style={{ fontWeight: 950, fontSize: 18, color: "#0f172a" }}>{t(lang, "kuantiti")}</div>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button style={btn} disabled={loading} onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>

              <input
                className="input"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
                style={{ flex: 1 }}
              />

              <button style={btn} disabled={loading} onClick={() => setQty((q) => q + 1)}>
                +
              </button>
            </div>

            <div style={{ marginTop: 12, fontWeight: 950, fontSize: 16, color: "#0f172a" }}>
              {t(lang, "nota")}
            </div>

            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t(lang, "contohNota")}
              style={{ marginTop: 8 }}
            />
          </div>

          {/* Actions */}
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <button style={btnPrimary} disabled={loading} onClick={() => submit("OUT", 1)}>
              {t(lang, "keluar")} -1 ({t(lang, "pantas")})
            </button>

            <button style={btn} disabled={loading} onClick={() => submit("OUT")}>
              {t(lang, "keluar")} {t(lang, "ikutKuantiti")}
            </button>

            <button style={btn} disabled={loading} onClick={() => submit("IN")}>
              {t(lang, "masuk")}
            </button>

            <div style={{ ...card, boxShadow: "none" }}>
              <div style={{ fontWeight: 980, fontSize: 18, color: "#0f172a" }}>
                {t(lang, "transfer")}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <select
                  className="select"
                  value={toLoc}
                  onChange={(e) => setToLoc(e.target.value)}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  <option value="store">Store / Kedai</option>
                  <option value="office">Office / Pejabat</option>
                  <option value="vending">Vending / Mesin</option>
                </select>

                <button style={btnPrimary} disabled={loading} onClick={() => submit("TRANSFER")}>
                  {t(lang, "pindah")}
                </button>
              </div>

              <div style={{ marginTop: 10, color: "#64748b", fontWeight: 650 }}>
                {t(lang, "transferHelp")}
              </div>
            </div>
          </div>

          {msg ? (
            <div style={{ marginTop: 12, fontWeight: 900, color: msg.startsWith("✅") ? "#166534" : "#b80f1a" }}>
              {msg}
            </div>
          ) : null}
        </>
      )}
    </main>
  );
}

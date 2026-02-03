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

const palette = {
  good: "#16a34a",
  bad: "#b91c1c",
  warn: "#b45309",
};

function toastDot(kind: ToastKind) {
  if (kind === "success") return palette.good;
  if (kind === "error") return palette.bad;
  return palette.warn;
}

export default function ScanDoClient() {
  const sp = useSearchParams();

  const item = sp.get("item") || "";
  const loc = sp.get("loc") || "store";
  const sig = sp.get("sig") || "";
  const lang = ((sp.get("lang") as Lang) || "bm") as Lang;

  const [qty, setQty] = useState<number>(1);
  const [toLoc, setToLoc] = useState<string>("store");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [toast, setToast] = useState<Toast>(null);

  // Optional: display name if you already fetch item details somewhere else.
  // For now we just show SKU.
  const displaySku = useMemo(() => item || "-", [item]);

  useEffect(() => {
    const tmr = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(tmr);
  }, [toast?.text]);

  async function submit(txType: TxType, overrideQty?: number) {
    const finalQty = Math.max(1, Number.isFinite(overrideQty) ? (overrideQty as number) : qty);

    setLoading(true);
    setToast({ kind: "info", text: t(lang, "loading") });

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          item,
          loc,
          sig,
          type: txType,
          qty: finalQty,
          toLoc: txType === "TRANSFER" ? toLoc : undefined,
          note: note || undefined,
          lang,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setToast({
          kind: "error",
          text: (json?.error ?? t(lang, "requestFail")) as string,
        });
        return;
      }

      setToast({
        kind: "success",
        text:
          txType === "OUT"
            ? `${t(lang, "keluar")} -${finalQty}`
            : txType === "IN"
            ? `${t(lang, "masuk")} +${finalQty}`
            : `${t(lang, "pindah")} (${finalQty})`,
      });

      // reset note after success (optional)
      // setNote("");
    } catch (e: any) {
      setToast({ kind: "error", text: e?.message ?? t(lang, "networkError") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      {/* Top header */}
      <div className="card card-pad row-between" style={{ marginBottom: 14 }}>
        <div className="row" style={{ gap: 12 }}>
          <Image src="/ijn-logo.png" alt="IJN" width={46} height={46} priority />
          <div>
            <div className="h1">{t(lang, "title")}</div>
            <div className="sub">{t(lang, "subtitle")}</div>
          </div>
        </div>

        <div className="row" style={{ gap: 8 }}>
          <a className="pill" href={`/scan?loc=${encodeURIComponent(loc)}&lang=bm`}>
            BM
          </a>
          <a className="pill" href={`/scan?loc=${encodeURIComponent(loc)}&lang=en`}>
            EN
          </a>
        </div>
      </div>

      {/* Item summary */}
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="row-between">
          <div>
            <div className="sub" style={{ fontWeight: 900, letterSpacing: 0.4 }}>
              {t(lang, "item")}
            </div>
            <div style={{ fontSize: 28, fontWeight: 950, marginTop: 2 }}>{displaySku}</div>
            <div className="sub">
              SKU: <b>{displaySku}</b>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div className="sub" style={{ fontWeight: 900, letterSpacing: 0.4 }}>
              {t(lang, "lokasi")}
            </div>
            <div style={{ fontSize: 22, fontWeight: 950, marginTop: 2 }}>{loc}</div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card card-pad stack">
        <div>
          <div className="label">{t(lang, "kuantiti")}</div>
          <div className="row" style={{ gap: 10 }}>
            <button
              className="btn btn-soft"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={loading}
              style={{ width: 56 }}
            >
              −
            </button>

            <input
              className="input"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || "1", 10)))}
            />

            <button
              className="btn btn-soft"
              onClick={() => setQty((q) => q + 1)}
              disabled={loading}
              style={{ width: 56 }}
            >
              +
            </button>
          </div>
        </div>

        <div>
          <div className="label">{t(lang, "nota")}</div>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t(lang, "contohNota")}
            disabled={loading}
          />
        </div>

        <div className="stack" style={{ gap: 10 }}>
          {/* OUT */}
          <button
            className="btn btn-primary"
            onClick={() => submit("OUT")}
            disabled={loading || !item}
            style={{ fontSize: 18, padding: "16px 14px" }}
          >
            {t(lang, "keluar")} -{qty} ({t(lang, "pantas")})
          </button>

          {/* OUT use qty */}
          <button
            className="btn btn-soft"
            onClick={() => submit("OUT", qty)}
            disabled={loading || !item}
            style={{ fontSize: 16, padding: "14px 14px", color: "var(--text)" }}
          >
            {t(lang, "keluar")} {t(lang, "ikutKuantiti")}
          </button>

          {/* IN */}
          <button
            className="btn btn-soft"
            onClick={() => submit("IN")}
            disabled={loading || !item}
            style={{ fontSize: 16, padding: "14px 14px", color: "var(--text)" }}
          >
            {t(lang, "masuk")}
          </button>

          {/* TRANSFER */}
          <div className="card card-pad" style={{ background: "#fbfdff" }}>
            <div className="label">{t(lang, "transfer")}</div>
            <div className="row" style={{ gap: 10 }}>
              <select
                className="select"
                value={toLoc}
                onChange={(e) => setToLoc(e.target.value)}
                disabled={loading}
              >
                <option value="store">Store / Kedai</option>
                <option value="office">Office / Pejabat</option>
                <option value="vending">Vending / Mesin</option>
              </select>

              <button
                className="btn btn-primary"
                onClick={() => submit("TRANSFER")}
                disabled={loading || !item}
                style={{ width: 140 }}
              >
                {t(lang, "pindah")}
              </button>
            </div>
            <div className="helper">Guna PINDAH untuk pindah stok lokasi.</div>
          </div>

          <div className="helper">
            QR biasa boleh terus guna <b>/scan</b> untuk pilih item dahulu.
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast ? (
        <div className="toast" role="status" aria-live="polite">
          <div className="toast-dot" style={{ background: toastDot(toast.kind) }} />
          <div className="toast-text">{toast.text}</div>
        </div>
      ) : null}
    </main>
  );
}

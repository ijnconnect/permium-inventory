"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { t, Lang } from "@/lib/i18n";

type ItemRow = { sku: string; name: string };

export default function ScanHomePage() {
  const sp = useSearchParams();
  const lang = (sp.get("lang") as Lang) || "bm";

  // QR still can pass loc + sig (so staff don't need to choose these)
  const sig = sp.get("sig") || "";
  const qrLoc = sp.get("loc") || "";

  const [items, setItems] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>("");

  const [sku, setSku] = useState<string>("");
  const [loc, setLoc] = useState<string>(qrLoc || "store");

  const ready = useMemo(() => sku && loc && sig, [sku, loc, sig]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch("/api/items");
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load items");

        const list: ItemRow[] = data?.items ?? [];
        if (!cancelled) {
          setItems(list);
          // default first item
          if (!sku && list.length) setSku(list[0].sku);
        }
      } catch (e: any) {
        if (!cancelled) setErr(String(e?.message ?? e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const btnPrimary: React.CSSProperties = {
    padding: "14px 16px",
    borderRadius: 14,
    border: "1px solid rgba(193,18,31,0.25)",
    background: `linear-gradient(135deg, ${c.ijnRed}, ${c.ijnRed2})`,
    color: "#fff",
    fontWeight: 950,
    fontSize: 16,
    cursor: "pointer",
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
        <div
          style={{
            ...card,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Image
              src="/ijn-logo.png"
              alt="IJN"
              width={84}
              height={32}
              style={{ objectFit: "contain" }}
              priority
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 950 }}>
                {t(lang, "Sistem Inventori Premium", "Premium Inventory System")}
              </div>
              <div style={{ fontSize: 12, color: c.sub }}>
                {t(lang, "Pilih item dan rekod stok", "Select item and record stock")}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <a style={chip} href={`/scan?loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(sig)}&lang=bm`}>
              BM
            </a>
            <a style={chip} href={`/scan?loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(sig)}&lang=en`}>
              EN
            </a>
          </div>
        </div>

        {/* Main */}
        <div style={{ ...card, marginTop: 12 }}>
          <div style={{ fontWeight: 950, fontSize: 16 }}>
            {t(lang, "Pilih Item", "Choose Item")}
          </div>
          <div style={{ marginTop: 8, color: c.sub, fontSize: 13 }}>
            {t(
              lang,
              "QR boleh bawa anda ke sini. Lepas pilih item, tekan Teruskan.",
              "QR can bring you here. After choosing item, press Continue."
            )}
          </div>

          {sig ? null : (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: `1px solid ${c.border}`, background: c.input }}>
              <b style={{ color: c.text }}>
                {t(lang, "Tiada sig dalam link.", "No sig in link.")}
              </b>{" "}
              <span style={{ color: c.sub }}>
                {t(lang, "Untuk sementara, tambah &sig=TEMP pada URL.", "For now, add &sig=TEMP to the URL.")}
              </span>
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: c.sub }}>
              {t(lang, "Item", "Item")}
            </div>

            {loading ? (
              <div style={{ marginTop: 8, color: c.sub }}>{t(lang, "Memuatkan item...", "Loading items...")}</div>
            ) : err ? (
              <div style={{ marginTop: 8, color: "#DC2626", fontWeight: 900 }}>{err}</div>
            ) : (
              <select style={{ ...input, marginTop: 8 }} value={sku} onChange={(e) => setSku(e.target.value)}>
                {items.map((it) => (
                  <option key={it.sku} value={it.sku}>
                    {it.name} ({it.sku})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: c.sub }}>
              {t(lang, "Lokasi", "Location")}
            </div>
            <select style={{ ...input, marginTop: 8 }} value={loc} onChange={(e) => setLoc(e.target.value)}>
              <option value="store">Store / Kedai</option>
              <option value="office">Office / Pejabat</option>
              <option value="vending">Vending / Mesin</option>
            </select>
          </div>

          <div style={{ marginTop: 14 }}>
            <a
              href={`/scan/do?item=${encodeURIComponent(sku)}&loc=${encodeURIComponent(loc)}&sig=${encodeURIComponent(sig || "TEMP")}&lang=${encodeURIComponent(lang)}`}
              style={{
                ...btnPrimary,
                display: "inline-block",
                textAlign: "center",
                width: "100%",
                opacity: sku ? 1 : 0.6,
                pointerEvents: sku ? "auto" : "none",
              }}
            >
              {t(lang, "TERUSKAN", "CONTINUE")}
            </a>
          </div>
        </div>

        <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: c.sub }}>
          {t(lang, "Tip: Simpan link ini sebagai QR umum.", "Tip: Save this link as a general QR.")}
        </div>
      </div>
    </main>
  );
}

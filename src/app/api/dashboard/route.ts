import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const sb = supabaseServer();

  const { data: inv, error: invErr } = await sb
    .from("inventory_snapshot")
    .select("sku,name,store,office")
    .order("sku", { ascending: true });

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });

  const rows =
    (inv ?? []).map((r: any) => ({
      sku: r.sku,
      name: r.name,
      store: Number(r.store ?? 0),
      office: Number(r.office ?? 0),
      total: Number(r.store ?? 0) + Number(r.office ?? 0),
    })) ?? [];

  const { data: tx, error: txErr } = await sb
    .from("transactions")
    .select("id,ts,staff,item_sku,type,qty,loc,note")
    .order("ts", { ascending: false })
    .limit(20);

  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 });

  const skuToName = new Map(rows.map((r) => [r.sku, r.name]));
  const recent =
    (tx ?? []).map((t: any) => ({
      id: t.id,
      ts: new Date(t.ts).getTime(),
      staff: t.staff,
      itemSku: t.item_sku,
      itemName: skuToName.get(t.item_sku) || t.item_sku,
      type: t.type,
      qty: t.qty,
      loc: t.loc,
      locLabel: t.loc === "store" ? "Store (Panas)" : "Office (CCD)",
      note: t.note ?? undefined,
    })) ?? [];

  return NextResponse.json({ rows, recent });
}

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function isLoc(v: any): v is "office" | "store" {
  return v === "office" || v === "store";
}
function isType(v: any): v is "IN" | "OUT" {
  return v === "IN" || v === "OUT";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const staff = String(body?.staff ?? "").trim();
  const itemSku = String(body?.itemSku ?? "").trim();
  const type = String(body?.type ?? "").toUpperCase();
  const qty = Number(body?.qty);
  const loc = body?.loc;
  const note = body?.note ? String(body.note) : null;

  if (!staff || !itemSku || !isType(type) || !Number.isFinite(qty) || qty <= 0 || !isLoc(loc)) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  const sb = supabaseServer();

  // Validate item exists
  const { data: item, error: itemErr } = await sb
    .from("items")
    .select("sku,name,is_active")
    .eq("sku", itemSku)
    .maybeSingle();

  if (itemErr) return NextResponse.json({ error: itemErr.message }, { status: 500 });
  if (!item || !item.is_active) return NextResponse.json({ error: "Selected item is not valid." }, { status: 400 });

  // Prevent negative stock on OUT
  if (type === "OUT") {
    const { data: snap, error: snapErr } = await sb
      .from("inventory_snapshot")
      .select("store,office")
      .eq("sku", itemSku)
      .maybeSingle();

    if (snapErr) return NextResponse.json({ error: snapErr.message }, { status: 500 });

    const current = loc === "store" ? Number(snap?.store ?? 0) : Number(snap?.office ?? 0);
    if (current < qty) {
      return NextResponse.json({ error: "Insufficient stock in the selected location." }, { status: 400 });
    }
  }

  const { error } = await sb.from("transactions").insert({
    staff,
    item_sku: itemSku,
    type,
    qty: Math.floor(qty),
    loc,
    note,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const locLabel = loc === "store" ? "Store (Panas)" : "Office (CCD)";
  const message =
    type === "IN"
      ? `Restocked ${qty} × ${item.name} to ${locLabel} (Staff: ${staff}).`
      : `Recorded OUT: ${qty} × ${item.name} from ${locLabel} (Staff: ${staff}).`;

  return NextResponse.json({ ok: true, message });
}

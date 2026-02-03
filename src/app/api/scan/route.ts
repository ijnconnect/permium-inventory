import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
// import { verifySig } from "@/lib/sign";

type TxType = "IN" | "OUT" | "TRANSFER";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { itemSku, locCode, sig, type, qty, toLocCode, note } = body as {
    itemSku?: string;
    locCode?: string;
    sig?: string;
    type?: TxType;
    qty?: number;
    toLocCode?: string;
    note?: string;
  };

  if (!itemSku || !locCode || !sig || !type) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // ✅ TEMP: disable signature for local testing
  // if (!verifySig(itemSku, locCode, sig)) {
  //   return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  // }

  const q = Math.floor(Number(qty ?? 1));
  if (!Number.isFinite(q) || q <= 0) {
    return NextResponse.json({ error: "Invalid qty" }, { status: 400 });
  }

  const sb = supabaseServer();

  const { data: item, error: itemErr } = await sb
    .from("items")
    .select("id, sku, name")
    .eq("sku", itemSku)
    .single();

  if (itemErr || !item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const { data: fromLoc, error: locErr } = await sb
    .from("locations")
    .select("id, code")
    .eq("code", locCode)
    .single();

  if (locErr || !fromLoc) {
    return NextResponse.json({ error: "Location not found" }, { status: 404 });
  }

  let toLoc: { id: string; code: string } | null = null;

  if (type === "IN") {
    toLoc = fromLoc;
  }

  if (type === "TRANSFER") {
    if (!toLocCode) {
      return NextResponse.json({ error: "Missing toLocCode" }, { status: 400 });
    }
    const res = await sb
      .from("locations")
      .select("id, code")
      .eq("code", toLocCode)
      .single();

    if (res.error || !res.data) {
      return NextResponse.json({ error: "To location not found" }, { status: 404 });
    }
    toLoc = res.data;
  }

  // Prevent negative stock for OUT/TRANSFER
  if (type === "OUT" || type === "TRANSFER") {
    const { data: stockRow, error: stockErr } = await sb
      .from("stock_levels")
      .select("qty")
      .eq("item_id", item.id)
      .eq("location_id", fromLoc.id)
      .maybeSingle();

    if (stockErr) {
      return NextResponse.json({ error: stockErr.message }, { status: 500 });
    }

    const current = stockRow?.qty ?? 0;
    if (current - q < 0) {
      return NextResponse.json(
        { error: `Not enough stock. Current=${current}` },
        { status: 409 }
      );
    }
  }

  const tx: any = {
    item_id: item.id,
    type,
    qty: q,
    note: note ?? null,
    actor: "qr",
  };

  if (type === "OUT") tx.from_location_id = fromLoc.id;
  if (type === "IN") tx.to_location_id = toLoc!.id;
  if (type === "TRANSFER") {
    tx.from_location_id = fromLoc.id;
    tx.to_location_id = toLoc!.id;
  }

  const ins = await sb.from("transactions").insert(tx).select("id").single();
  if (ins.error) {
    return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, txId: ins.data.id });
}

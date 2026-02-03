import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const pin = body?.pin; // if you choose to send pin
  if (!process.env.SCAN_PIN) return NextResponse.json({ error: "SCAN_PIN not set" }, { status: 500 });
  if (!pin || pin !== process.env.SCAN_PIN) return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });

  const { type, itemSku, locCode, toLocCode, qty, note } = body;

  if (!type || !itemSku || !locCode) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const q = Number(qty ?? 0);
  if (!Number.isFinite(q) || q <= 0) {
    return NextResponse.json({ error: "Invalid qty" }, { status: 400 });
  }

  if (type === "TRANSFER" && (!toLocCode || toLocCode === locCode)) {
    return NextResponse.json({ error: "Invalid toLocCode" }, { status: 400 });
  }

  const sb = supabaseServer();

  const insert = {
    type,
    item_sku: itemSku,
    qty: q,
    note: note ?? null,
    from_loc_code: locCode,
    to_loc_code: type === "TRANSFER" ? toLocCode : null,
  };

  const { error } = await sb.from("transactions").insert(insert as any);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

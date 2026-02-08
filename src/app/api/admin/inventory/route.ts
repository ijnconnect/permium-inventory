import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const sb = supabaseServer();

    // 1) Pull all items
    const { data: items, error: itemsErr } = await sb
      .from("items")
      .select("id, sku, name")
      .order("sku", { ascending: true });

    if (itemsErr) throw itemsErr;

    // 2) Pull all locations (code must match: store/office/vending)
    const { data: locs, error: locErr } = await sb
      .from("locations")
      .select("id, code, name");

    if (locErr) throw locErr;

    const locIdByCode = new Map<string, string>();
    for (const l of locs ?? []) locIdByCode.set(l.code, l.id);

    // 3) Pull all transactions (or last N days if you want)
    const { data: txs, error: txErr } = await sb
      .from("transactions")
      .select("type, qty, item_id, from_location_id, to_location_id");

    if (txErr) throw txErr;

    // 4) Compute snapshot by (item, location)
    const storeId = locIdByCode.get("store");
    const officeId = locIdByCode.get("office");
    const vendingId = locIdByCode.get("vending");

    const byItemLoc = new Map<string, number>(); // key = `${itemId}:${locId}`

    for (const t of txs ?? []) {
      const type = (t as any).type as "IN" | "OUT" | "TRANSFER";
      const qty = Number((t as any).qty ?? 0);
      const itemId = (t as any).item_id as string | null;

      if (!itemId || !qty) continue;

      const fromId = (t as any).from_location_id as string | null;
      const toId = (t as any).to_location_id as string | null;

      const add = (iid: string, lid: string, delta: number) => {
        const k = `${iid}:${lid}`;
        byItemLoc.set(k, (byItemLoc.get(k) ?? 0) + delta);
      };

      if (type === "IN") {
        // IN adds to "to" if present, else to "from"
        const target = toId ?? fromId;
        if (target) add(itemId, target, qty);
      } else if (type === "OUT") {
        // OUT removes from "from"
        if (fromId) add(itemId, fromId, -qty);
      } else if (type === "TRANSFER") {
        // TRANSFER moves from -> to
        if (fromId) add(itemId, fromId, -qty);
        if (toId) add(itemId, toId, qty);
      }
    }

    const rows =
      (items ?? []).map((it) => {
        const store = storeId ? byItemLoc.get(`${it.id}:${storeId}`) ?? 0 : 0;
        const office = officeId ? byItemLoc.get(`${it.id}:${officeId}`) ?? 0 : 0;
        const vending = vendingId ? byItemLoc.get(`${it.id}:${vendingId}`) ?? 0 : 0;
        const total = store + office + vending;

        return {
          sku: it.sku,
          name: it.name,
          store,
          office,
          vending,
          total,
        };
      }) ?? [];

    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}

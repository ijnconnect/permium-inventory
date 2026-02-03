import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

type ItemRow = { id: string; sku: string; name: string };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qRaw = (searchParams.get("q") || "").trim();
    const q = qRaw.length ? qRaw : null;

    const limit = Math.max(5, Math.min(200, Number(searchParams.get("limit") || 60)));

    const sb = supabaseServer();

    // 1) If search query exists, find matching item IDs
    let itemIds: string[] | null = null;

    if (q) {
      const { data: items, error: itemErr } = await sb
        .from("items")
        .select("id, sku, name")
        .or(`sku.ilike.%${q}%,name.ilike.%${q}%`)
        .limit(200);

      if (itemErr) {
        return NextResponse.json({ error: itemErr.message }, { status: 500 });
      }

      itemIds = (items ?? []).map((x: ItemRow) => x.id);

      if (!itemIds.length) {
        return NextResponse.json({ summary: [], transactions: [] });
      }
    }

    // 2) Stock summary (stock_levels -> items + locations)
    let stockQuery = sb
      .from("stock_levels")
      .select("qty, items(id,sku,name), locations(code)");

    if (itemIds) stockQuery = stockQuery.in("item_id", itemIds);

    const { data: stockRows, error: stockErr } = await stockQuery;

    if (stockErr) {
      return NextResponse.json({ error: stockErr.message }, { status: 500 });
    }

    const map = new Map<
      string,
      { sku: string; name: string; store: number; office: number; vending: number; total: number }
    >();

    for (const r of stockRows ?? []) {
      const it = (r as any).items;
      const loc = (r as any).locations?.code;
      const qty = Number((r as any).qty ?? 0);

      if (!it?.sku) continue;

      const key = it.sku as string;
      const cur =
        map.get(key) ??
        { sku: it.sku, name: it.name ?? it.sku, store: 0, office: 0, vending: 0, total: 0 };

      if (loc === "store") cur.store += qty;
      else if (loc === "office") cur.office += qty;
      else if (loc === "vending") cur.vending += qty;

      cur.total = cur.store + cur.office + cur.vending;
      map.set(key, cur);
    }

    const summary = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));

    // 3) Recent transactions (use your WORKING FK join names)
    // from: locations!transactions_from_location_id_fkey(code,name)
    // to:   locations!transactions_to_location_id_fkey(code,name)  (most likely)
    let txQuery = sb
      .from("transactions")
      .select(
        `
        id, type, qty, note, created_at,
        items(sku,name),
        from:locations!transactions_from_location_id_fkey(code,name),
        to:locations!transactions_to_location_id_fkey(code,name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (itemIds) txQuery = txQuery.in("item_id", itemIds);

    const { data: txRows, error: txErr } = await txQuery;

    // If "to" FK name is different, Supabase will error here.
    // We'll catch it and retry with only "from" join (so dashboard still loads).
    if (txErr) {
      // retry: from only
      const retry = await sb
        .from("transactions")
        .select(
          `
          id, type, qty, note, created_at,
          items(sku,name),
          from:locations!transactions_from_location_id_fkey(code,name)
        `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

      if (retry.error) {
        return NextResponse.json({ error: retry.error.message }, { status: 500 });
      }

      const transactionsFallback = (retry.data ?? []).map((r: any) => ({
        id: r.id,
        created_at: r.created_at,
        type: r.type,
        qty: r.qty,
        note: r.note,
        item: r.items ? { sku: r.items.sku, name: r.items.name } : null,
        from: r.from?.code ?? null,
        to: null,
      }));

      return NextResponse.json({ summary, transactions: transactionsFallback });
    }

    const transactions = (txRows ?? []).map((r: any) => ({
      id: r.id,
      created_at: r.created_at,
      type: r.type,
      qty: r.qty,
      note: r.note,
      item: r.items ? { sku: r.items.sku, name: r.items.name } : null,
      from: r.from?.code ?? null,
      to: r.to?.code ?? null,
    }));

    return NextResponse.json({ summary, transactions });
  } catch (e: any) {
    console.error("GET /api/dashboard crashed:", e);
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}

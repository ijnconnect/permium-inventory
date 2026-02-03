import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();

  const { data: rows, error } = await sb
    .from("stock_levels")
    .select("qty, updated_at, items(sku,name), locations(code,name)");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = ["sku","item_name","location_code","location_name","qty","updated_at"];
  const lines = [header.join(",")];

  for (const r of rows ?? []) {
    const sku = (r as any).items?.sku ?? "";
    const itemName = (r as any).items?.name ?? "";
    const locCode = (r as any).locations?.code ?? "";
    const locName = (r as any).locations?.name ?? "";
    const qty = (r as any).qty ?? 0;
    const updatedAt = (r as any).updated_at ?? "";
    const esc = (s: any) => `"${String(s ?? "").replaceAll(`"`, `""`)}"`;
    lines.push([esc(sku), esc(itemName), esc(locCode), esc(locName), qty, esc(updatedAt)].join(","));
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventory_snapshot.csv"`,
    },
  });
}

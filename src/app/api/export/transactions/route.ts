import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const sb = supabaseServer();

  let q = sb
    .from("transactions")
    .select("created_at,type,qty,note, items(sku,name), from:locations!transactions_from_location_id_fkey(code,name), to:locations!transactions_to_location_id_fkey(code,name)")
    .order("created_at", { ascending: true });

  if (from) q = q.gte("created_at", `${from}T00:00:00Z`);
  if (to) q = q.lte("created_at", `${to}T23:59:59Z`);

  const { data: rows, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = ["created_at","type","sku","item_name","from_location","to_location","qty","note"];
  const lines = [header.join(",")];
  const esc = (s: any) => `"${String(s ?? "").replaceAll(`"`, `""`)}"`;

  for (const r of rows ?? []) {
    const sku = (r as any).items?.sku ?? "";
    const itemName = (r as any).items?.name ?? "";
    const fromLoc = (r as any).from?.code ?? "";
    const toLoc = (r as any).to?.code ?? "";
    lines.push([
      esc((r as any).created_at),
      esc((r as any).type),
      esc(sku),
      esc(itemName),
      esc(fromLoc),
      esc(toLoc),
      (r as any).qty ?? 0,
      esc((r as any).note ?? ""),
    ].join(","));
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions.csv"`,
    },
  });
}

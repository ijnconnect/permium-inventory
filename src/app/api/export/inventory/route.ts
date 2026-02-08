import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("inventory_snapshot")
    .select("sku,name,store,office")
    .order("sku", { ascending: true });

  if (error) return new Response(error.message, { status: 500 });

  const header = ["SKU", "Item", "Store (Panas)", "Office (CCD)", "Total"];
  const lines = [header.join(",")];

  for (const r of data ?? []) {
    const store = Number((r as any).store ?? 0);
    const office = Number((r as any).office ?? 0);
    const total = store + office;
    const row = [
      (r as any).sku,
      `"${String((r as any).name ?? "").replaceAll(`"`, `""`)}"`,
      String(store),
      String(office),
      String(total),
    ];
    lines.push(row.join(","));
  }

  const csv = lines.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="inventory.csv"',
    },
  });
}

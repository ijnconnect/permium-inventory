import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("transactions")
    .select("id,ts,staff,item_sku,type,qty,loc,note")
    .order("ts", { ascending: false })
    .limit(5000);

  if (error) return new Response(error.message, { status: 500 });

  const header = ["Time", "Staff", "SKU", "Type", "Qty", "Location", "Note"];
  const lines = [header.join(",")];

  for (const t of data ?? []) {
    const locLabel = (t as any).loc === "store" ? "Store (Panas)" : "Office (CCD)";
    const row = [
      `"${new Date((t as any).ts).toISOString()}"`,
      `"${String((t as any).staff ?? "").replaceAll(`"`, `""`)}"`,
      (t as any).item_sku,
      (t as any).type,
      String((t as any).qty),
      `"${locLabel}"`,
      `"${String((t as any).note ?? "").replaceAll(`"`, `""`)}"`,
    ];
    lines.push(row.join(","));
  }

  const csv = lines.join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="transactions.csv"',
    },
  });
}

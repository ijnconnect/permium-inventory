import { supabaseServer } from "@/lib/supabaseServer";
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const sb = supabaseServer();

  const { data: items } = await sb.from("items").select("id, sku, name").eq("is_active", true).order("name");
  const { data: locs } = await sb.from("locations").select("id, code, name").order("name");
  const { data: stock } = await sb.from("stock_levels").select("item_id, location_id, qty");

  const stockMap = new Map<string, number>();
  for (const s of stock ?? []) stockMap.set(`${s.item_id}|${s.location_id}`, s.qty);

  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>Inventory (Stok Semasa)</h2>
      <p>
        <a href="/api/export/inventory" target="_blank">Download Inventory Snapshot CSV</a>
      </p>

      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>SKU</th>
              <th style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>Item</th>
              {(locs ?? []).map((l) => (
                <th key={l.id} style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #eee" }}>
                  {l.name}
                </th>
              ))}
              <th style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #eee" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((it) => {
              let total = 0;
              const cols = (locs ?? []).map((l) => {
                const q = stockMap.get(`${it.id}|${l.id}`) ?? 0;
                total += q;
                const danger = q < 0;
                return (
                  <td key={l.id} style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #f4f4f4", color: danger ? "crimson" : undefined }}>
                    {q}
                  </td>
                );
              });

              return (
                <tr key={it.id}>
                  <td style={{ padding: 10, borderBottom: "1px solid #f4f4f4" }}>{it.sku}</td>
                  <td style={{ padding: 10, borderBottom: "1px solid #f4f4f4" }}>{it.name}</td>
                  {cols}
                  <td style={{ textAlign: "right", padding: 10, borderBottom: "1px solid #f4f4f4", fontWeight: 800 }}>{total}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}

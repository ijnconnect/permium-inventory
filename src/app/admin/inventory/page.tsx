export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = {
  sku: string;
  name: string;
  store?: number;
  office?: number;
  vending?: number;
  total?: number;
};

export default async function InventoryAdminPage() {
  let rows: Row[] = [];
  let err: string | null = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/admin/inventory`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) err = json?.error ?? "Failed to load inventory";
    rows = json?.rows ?? json ?? [];
  } catch (e: any) {
    err = e?.message ?? String(e);
  }

  return (
    <main className="container">
      <div className="card card-pad stack">
        <div className="row-between">
          <div>
            <h1 className="h1">Inventory (Stok Semasa)</h1>
            <p className="sub">Paparan snapshot terkini mengikut lokasi</p>
          </div>
          <div className="row">
            <a className="btn btn-soft" href="/dashboard">
              Dashboard
            </a>
            <a className="btn btn-primary" href="/scan">
              Go to Scan
            </a>
          </div>
        </div>

        {err ? <div className="badge badge-bad">{err}</div> : null}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item</th>
                <th style={{ textAlign: "right" }}>Office / Pejabat</th>
                <th style={{ textAlign: "right" }}>Store / Kedai</th>
                <th style={{ textAlign: "right" }}>Vending / Mesin</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="helper">
                    No items found.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.sku}>
                    <td className="kpi">{r.sku}</td>
                    <td>{r.name}</td>
                    <td style={{ textAlign: "right" }}>{r.office ?? 0}</td>
                    <td style={{ textAlign: "right" }}>{r.store ?? 0}</td>
                    <td style={{ textAlign: "right" }}>{r.vending ?? 0}</td>
                    <td style={{ textAlign: "right" }} className="kpi">
                      {r.total ?? (r.office ?? 0) + (r.store ?? 0) + (r.vending ?? 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="helper">
          Tip: Kalau nak export CSV, guna endpoint export yang awak dah buat (kalau ada).
        </div>
      </div>
    </main>
  );
}

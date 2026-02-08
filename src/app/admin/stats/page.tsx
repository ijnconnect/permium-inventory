import Link from "next/link";
import { listItems, listTxLog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function StatsPage() {
  const tx = listTxLog();
  const items = listItems();
  const nameBySku = new Map(items.map((i) => [i.sku, i.name]));

  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const last30 = tx.filter((t) => t.ts >= since);

  const outBySku = new Map<string, number>();
  const outByLoc = new Map<string, number>();
  const outByStaff = new Map<string, number>();

  for (const t of last30) {
    if (t.type !== "OUT") continue;
    outBySku.set(t.itemSku, (outBySku.get(t.itemSku) || 0) + t.qty);
    outByLoc.set(t.loc, (outByLoc.get(t.loc) || 0) + t.qty);
    outByStaff.set(t.staff, (outByStaff.get(t.staff) || 0) + t.qty);
  }

  const topOutItems = [...outBySku.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sku, total]) => ({ sku, name: nameBySku.get(sku) || sku, total }));

  const locLabel = (k: string) => (k === "store" ? "Store (Panas)" : "Office (CCD)");

  const staffRows = [...outByStaff.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="h1">Stats (Last 30 Days)</h1>
          <p className="p">Summary of OUT transactions for the last 30 days.</p>
        </div>

        <div className="btnRow">
          <Link className="btn" href="/dashboard">Dashboard</Link>
          <Link className="btn btnPrimary" href="/scan/manual">Stock Entry</Link>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <strong>Top OUT Items</strong>
          <div className="badge">{topOutItems.length} item(s)</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">SKU</th>
              <th align="left">Item</th>
              <th align="right">Total OUT</th>
            </tr>
          </thead>
          <tbody>
            {topOutItems.map((r) => (
              <tr key={r.sku}>
                <td>{r.sku}</td>
                <td>{r.name}</td>
                <td align="right"><strong>{r.total}</strong></td>
              </tr>
            ))}
            {topOutItems.length === 0 && (
              <tr>
                <td colSpan={3} style={{ color: "#6b7280" }}>
                  No OUT transactions in the last 30 days.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <strong>OUT by Location</strong>
          <div className="badge">{outByLoc.size} location(s)</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Location</th>
              <th align="right">Total OUT</th>
            </tr>
          </thead>
          <tbody>
            {[...outByLoc.entries()].map(([loc, total]) => (
              <tr key={loc}>
                <td>{locLabel(loc)}</td>
                <td align="right"><strong>{total}</strong></td>
              </tr>
            ))}
            {outByLoc.size === 0 && (
              <tr>
                <td colSpan={2} style={{ color: "#6b7280" }}>
                  No OUT transactions in the last 30 days.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 8 }}>
          <strong>OUT by Staff</strong>
          <div className="badge">{staffRows.length} staff</div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Staff</th>
              <th align="right">Total OUT</th>
            </tr>
          </thead>
          <tbody>
            {staffRows.map(([staff, total]) => (
              <tr key={staff}>
                <td>{staff}</td>
                <td align="right"><strong>{total}</strong></td>
              </tr>
            ))}
            {staffRows.length === 0 && (
              <tr>
                <td colSpan={2} style={{ color: "#6b7280" }}>
                  No OUT transactions in the last 30 days.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

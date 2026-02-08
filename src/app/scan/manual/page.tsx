import ScanManualClient from "./ScanManualClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ManualStockEntryPage() {
  return (
    <div className="card">
      <ScanManualClient />
    </div>
  );
}
{/* build stamp: 2026-02-09 */}

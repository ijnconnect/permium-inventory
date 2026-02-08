import ScanManualClient from "./ScanManualClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ManualPage() {
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 980 }}>
        <ScanManualClient />
      </div>
    </div>
  );
}

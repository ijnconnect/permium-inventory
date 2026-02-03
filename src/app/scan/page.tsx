import ScanClient from "./ScanClient";

// IMPORTANT: this must be in a SERVER file (no "use client")
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ScanPage() {
  return <ScanClient />;
}

import Image from "next/image";
import styles from "./page.module.css";
export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Premium Inventory</h1>
      <p>Use QR to scan: /scan?item=SKU&loc=store|office|vending&sig=...</p>
      <ul>
        <li><a href="/admin/inventory">Admin Inventory</a></li>
        <li><a href="/admin/stats">Admin Stats</a></li>
      </ul>
    </main>
  );
}
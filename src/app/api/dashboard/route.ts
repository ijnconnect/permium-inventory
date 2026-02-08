import { NextResponse } from "next/server";
import { computeInventory, listTxLog, listItems } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = computeInventory();
  const tx = listTxLog().slice(0, 20);

  const items = listItems();
  const nameBySku = new Map(items.map((i) => [i.sku, i.name]));

  const recent = tx.map((t) => ({
    ...t,
    itemName: nameBySku.get(t.itemSku) || t.itemSku,
  }));

  return NextResponse.json({ rows, recent });
}

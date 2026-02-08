import type { InventoryRow, Item, LocationKey, TxRecord, TxType } from "./types";

const ITEMS: Item[] = [
  { sku: "NP-A4-001", name: "A4 Notepad" },
  { sku: "MC-001", name: "Medicine Container" },
];

const TX_LOG: TxRecord[] = [];

const STAFF_LIST = ["Danial", "Farisha", "Fatiha", "Amira", "Izrinda", "Harith", "Intern"] as const;

function clampPositiveInt(v: unknown) {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i <= 0) return null;
  return i;
}

function isLoc(v: any): v is LocationKey {
  return v === "store" || v === "office";
}

function isType(v: any): v is TxType {
  return v === "IN" || v === "OUT";
}

export function listItems(): Item[] {
  return ITEMS;
}

export function listTxLog(): TxRecord[] {
  // newest first
  return TX_LOG.slice().sort((a, b) => b.ts - a.ts);
}

export function computeInventory(): InventoryRow[] {
  const bySku: Record<string, InventoryRow> = {};

  for (const it of ITEMS) {
    bySku[it.sku] = { sku: it.sku, name: it.name, store: 0, office: 0, total: 0 };
  }

  for (const tx of TX_LOG) {
    const row = bySku[tx.itemSku];
    if (!row) continue;

    if (tx.type === "IN") {
      if (tx.loc === "store") row.store += tx.qty;
      if (tx.loc === "office") row.office += tx.qty;
    } else {
      if (tx.loc === "store") row.store -= tx.qty;
      if (tx.loc === "office") row.office -= tx.qty;
    }
  }

  const rows = Object.values(bySku).map((r) => ({ ...r, total: r.store + r.office }));
  rows.sort((a, b) => a.sku.localeCompare(b.sku));
  return rows;
}

export function addManualTx(input: any):
  | { ok: true; message: string; tx: TxRecord }
  | { ok: false; error: string } {
  const staff = String(input?.staff ?? "").trim();
  const itemSku = String(input?.itemSku ?? "").trim();
  const typeRaw = String(input?.type ?? "").toUpperCase();
  const qty = clampPositiveInt(input?.qty);
  const loc = input?.loc;
  const note = input?.note ? String(input.note) : undefined;

  if (!staff || !itemSku || !isType(typeRaw) || qty === null || !isLoc(loc)) {
    return { ok: false, error: "Missing fields." };
  }

  // Optional: restrict staff to known list (you can remove this if you want)
  if (!STAFF_LIST.includes(staff as any)) {
    return { ok: false, error: "Staff is not valid." };
  }

  const item = ITEMS.find((i) => i.sku === itemSku);
  if (!item) return { ok: false, error: "Selected item is not valid." };

  const inv = computeInventory();
  const row = inv.find((r) => r.sku === itemSku);
  const currentStock = loc === "store" ? (row?.store ?? 0) : (row?.office ?? 0);

  if (typeRaw === "OUT" && currentStock < qty) {
    return { ok: false, error: "Insufficient stock in the selected location." };
  }

  const now = Date.now();
  const id = `${now}-${Math.random().toString(16).slice(2)}`;

  const tx: TxRecord = {
    id,
    ts: now,
    staff,
    itemSku,
    type: typeRaw,
    qty,
    loc,
    note,
  };

  TX_LOG.push(tx);

  const locLabel = loc === "store" ? "Store (Panas)" : "Office (CCD)";
  const message =
    typeRaw === "IN"
      ? `Restocked ${qty} × ${item.name} to ${locLabel} (Staff: ${staff}).`
      : `Recorded OUT: ${qty} × ${item.name} from ${locLabel} (Staff: ${staff}).`;

  return { ok: true, message, tx };
}

export function addManualTx(input: any):
  | { ok: true; message: string }
  | { ok: false; error: string } {
  const typeRaw = String(input?.type ?? "").toUpperCase();
  const type = typeRaw === "IN" || typeRaw === "OUT" ? typeRaw : "";

  const itemSku = String(input?.itemSku ?? input?.sku ?? "");
  const qtyRaw = input?.qty ?? input?.quantity;
  const qty = typeof qtyRaw === "number" ? Math.floor(qtyRaw) : Number(qtyRaw);

  const locRaw = String(input?.loc ?? input?.location ?? "").toLowerCase();
  const loc =
    locRaw === "store" ? "store" :
    locRaw === "office" ? "office" :
    "";

  const note = input?.note ? String(input.note) : undefined;

  if (!type || !itemSku || !Number.isFinite(qty) || qty <= 0 || !loc) {
    return { ok: false, error: "Missing fields." };
  }

  const item = ITEMS.find((i) => i.sku === itemSku);
  if (!item) return { ok: false, error: "Selected item is not valid." };

  // Prevent negative stock for OUT
  const inv = computeInventory();
  const current = inv.find((r) => r.sku === itemSku);
  const stockAtLoc = loc === "store" ? (current?.store ?? 0) : (current?.office ?? 0);

  if (type === "OUT" && stockAtLoc < qty) {
    return { ok: false, error: "Insufficient stock in the selected location." };
  }

  const now = Date.now();
  const id = `${now}-${Math.random().toString(16).slice(2)}`;

  // Keep TxRecord compatible (fill unused fields)
  const rec: TxRecord = {
    id,
    ts: now,
    pin: "",
    staff: "",
    itemSku,
    type,
    qty,
    loc,
    note,
  };

  TX_LOG.push(rec);

  const locLabel = loc === "store" ? "Store (Panas)" : "Office (CCD)";
  const message =
    type === "IN"
      ? `Restocked ${qty} ${item.name} to ${locLabel}.`
      : `Recorded OUT: Took ${qty} ${item.name} from ${locLabel}.`;

  return { ok: true, message };
}

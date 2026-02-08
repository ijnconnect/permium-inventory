export type LocationKey = "store" | "office";
export type TxType = "IN" | "OUT";

export type Item = {
  sku: string;
  name: string;
};

export type InventoryRow = {
  sku: string;
  name: string;
  store: number;
  office: number;
  total: number;
};

export type TxRecord = {
  id: string;
  ts: number;
  staff: string;
  itemSku: string;
  type: TxType;
  qty: number;
  loc: LocationKey;
  note?: string;
};

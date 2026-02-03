export type Lang = "bm" | "en";

const dict = {
  bm: {
    title: "Imbas Item",
    subtitle: "Rekod stok dengan cepat & kemas",
    item: "Item",
    lokasi: "Lokasi",
    kuantiti: "Kuantiti",
    nota: "Nota (optional)",
    contohNota: "cth: ambil untuk pelanggan",
    keluar: "KELUAR",
    masuk: "MASUK / Restock",
    pindah: "PINDAH",
    pantas: "Pantas",
    ikutKuantiti: "ikut kuantiti",
    transfer: "PINDAH (TRANSFER)",
    pilihItem: "Pilih Item",
    teruskan: "TERUSKAN",
    carian: "Cari Item",
    tipQR: "Tip: Simpan link ini sebagai QR umum.",
    loading: "Memuatkan...",
    berjaya: "Berjaya",
    ralat: "Ralat",
    requestFail: "Request gagal",
    networkError: "Network error",
  },
  en: {
    title: "Scan Item",
    subtitle: "Record stock quickly & neatly",
    item: "Item",
    lokasi: "Location",
    kuantiti: "Quantity",
    nota: "Note (optional)",
    contohNota: "e.g. for customer",
    keluar: "OUT",
    masuk: "IN / Restock",
    pindah: "TRANSFER",
    pantas: "Quick",
    ikutKuantiti: "use quantity",
    transfer: "TRANSFER",
    pilihItem: "Select Item",
    teruskan: "CONTINUE",
    carian: "Search Item",
    tipQR: "Tip: Save this link as a general QR.",
    loading: "Loading...",
    berjaya: "Success",
    ralat: "Error",
    requestFail: "Request failed",
    networkError: "Network error",
  },
} as const;

export function t(lang: Lang, key: string) {
  const pack = (dict as any)[lang] ?? dict.bm;
  return pack[key] ?? key;
}

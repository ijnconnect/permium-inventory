export type Lang = "bm" | "en";
export function t(lang: Lang, bm: string, en: string) {
  return lang === "bm" ? bm : en;
}

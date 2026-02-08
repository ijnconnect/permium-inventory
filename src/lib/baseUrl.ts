import { headers } from "next/headers";

export async function baseUrl() {
  // Vercel provides these automatically in prod; optional for local.
  const h = await headers();

  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";

  return `${proto}://${host}`;
}

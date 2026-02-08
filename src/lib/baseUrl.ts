import { headers } from "next/headers";

export async function getBaseUrl(): Promise<string> {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (fromEnv) return fromEnv;

  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("x-forwarded-host") || h.get("host");
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

// src/lib/baseUrl.ts
import { headers } from "next/headers";

/**
 * Build absolute base URL on the SERVER (works on Vercel + localhost)
 */
export async function getBaseUrl() {
  const h = await headers(); // ✅ IMPORTANT (headers() is async in your version)
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

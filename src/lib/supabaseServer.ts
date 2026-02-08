import { createClient } from "@supabase/supabase-js";

export function supabaseServer() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("SUPABASE_URL is required.");
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

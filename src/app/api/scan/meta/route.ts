import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const sb = supabaseServer();

  const { data: items } = await sb.from("items").select("sku,name").order("sku");
  const { data: locations } = await sb.from("locations").select("code,name").order("code");

  return NextResponse.json({ items: items ?? [], locations: locations ?? [] });
}

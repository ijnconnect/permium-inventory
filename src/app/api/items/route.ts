import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const sb = supabaseServer();
    const { data, error } = await sb
      .from("items")
      .select("sku,name")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load items." }, { status: 500 });
  }
}

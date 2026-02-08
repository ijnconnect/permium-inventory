import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const sb = supabaseServer();

  const { data, error } = await sb
    .from("inventory_snapshot")
    .select("sku,name,store,office")
    .order("sku", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows =
    (data ?? []).map((r: any) => ({
      sku: r.sku,
      name: r.name,
      store: Number(r.store ?? 0),
      office: Number(r.office ?? 0),
      total: Number(r.store ?? 0) + Number(r.office ?? 0),
    })) ?? [];

  return NextResponse.json({ rows });
}

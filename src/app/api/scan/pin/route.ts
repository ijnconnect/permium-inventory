import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { pin } = await req.json().catch(() => ({}));

  if (!process.env.SCAN_PIN) {
    return NextResponse.json({ error: "SCAN_PIN not set" }, { status: 500 });
  }

  if (!pin || pin !== process.env.SCAN_PIN) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  // simple OK (client just stores pinOk state)
  return NextResponse.json({ ok: true });
}

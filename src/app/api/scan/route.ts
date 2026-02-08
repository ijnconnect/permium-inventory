import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { error: "QR mode is not enabled in this build." },
    { status: 501 }
  );
}

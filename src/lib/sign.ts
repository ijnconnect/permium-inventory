import crypto from "crypto";

export function makeSig(itemSku: string, locCode: string) {
  const secret = process.env.QR_SIGNING_SECRET!;
  if (!secret) {
    throw new Error("Missing QR_SIGNING_SECRET in environment");
  }

  const msg = `${itemSku}|${locCode}`;
  return crypto.createHmac("sha256", secret).update(msg).digest("hex");
}

export function verifySig(itemSku: string, locCode: string, sig: string) {
  const expected = makeSig(itemSku, locCode);

  // Prevent timingSafeEqual crash when lengths differ
  if (typeof sig !== "string") return false;
  if (sig.length !== expected.length) return false; // expected is 64 hex chars

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

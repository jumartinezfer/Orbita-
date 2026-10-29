import { createHmac, timingSafeEqual } from "node:crypto";

export function isValidSignature(rawBody: Buffer, signature: string | undefined, secret: string): boolean {
  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const providedBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

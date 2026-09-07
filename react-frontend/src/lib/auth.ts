import { SignJWT, jwtVerify } from "jose";

// In production, you would use process.env.JWT_SECRET
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "super_secret_chandu_gym_key_change_in_production"
);

export async function signToken(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

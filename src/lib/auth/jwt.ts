import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { AUTH_CONFIG } from "./config";

const getSecret = () => new TextEncoder().encode(AUTH_CONFIG.jwtSecret);

export interface TokenPayload extends JWTPayload {
  email: string;
  role: "admin";
}

/** Create a signed JWT for the given admin user */
export async function signToken(payload: {
  email: string;
  role: "admin";
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(AUTH_CONFIG.tokenExpiry)
    .setIssuedAt()
    .sign(getSecret());
}

/** Verify a JWT and return its payload, or null if invalid/expired */
export async function verifyToken(
  token: string
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

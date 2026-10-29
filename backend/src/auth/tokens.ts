import jwt from "jsonwebtoken";
import { env } from "../env.js";

export interface TokenPayload {
  sub: string;
}

export function signToken(userId: string): string {
  const options: jwt.SignOptions = { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId } satisfies TokenPayload, env.jwtSecret, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}

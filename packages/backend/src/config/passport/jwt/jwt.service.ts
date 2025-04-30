import jwt from "jsonwebtoken";
import { StringValue } from "ms";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "default";
const JWT_ACCESS_EXPIRES: StringValue | number = (process.env.JWT_ACCESS_EXPIRES as StringValue) || "2m";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "default";
const JWT_REFRESH_EXPIRES: StringValue | number = (process.env.JWT_REFRESH_EXPIRES as StringValue) || "1d";

export function generateAccessToken(payLoad: object): string {
  return jwt.sign(payLoad, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
}

export function generateRefreshToken(payLoad: object): string {
  return jwt.sign(payLoad, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

import jwt from "jsonwebtoken";
import { StringValue } from "ms";
import { TPayload } from "./jwt.payload";

export async function generateAccessToken(payLoad: TPayload): Promise<string> {
  return jwt.sign(payLoad, process.env.JWT_ACCESS_SECRET || "default", {
    expiresIn: process.env.JWT_ACCESS_EXPIRES as StringValue,
  });
}

export async function generateRefreshToken(payLoad: TPayload): Promise<string> {
  return jwt.sign(payLoad, process.env.JWT_REFRESH_SECRET || "default", {
    expiresIn: process.env.JWT_REFRESH_EXPIRES as StringValue,
  });
}

export async function verifyAccessToken(token: string) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET || "default");
}

export async function verifyRefreshToken(token: string) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET || "default");
}

export async function decodeToken(token: string): Promise<TPayload> {
  return jwt.decode(token) as TPayload;
}

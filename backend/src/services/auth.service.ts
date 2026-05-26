import bcrypt from "bcrypt";

import { HttpException } from "../utils/http-exception";
import { signAccessToken } from "../utils/jwt.util";
import type { JWTPayload } from "../types/auth";
import { createClientUser, findUserByEmail, hashPassword } from "../models/user.model";

export async function registerUser(input: {
  email?: unknown;
  password?: unknown;
  fullName?: unknown;
  phone?: unknown;
}) {
  const email = typeof input.email === "string" ? input.email : "";
  const password = typeof input.password === "string" ? input.password : "";
  const fullName = typeof input.fullName === "string" ? input.fullName : "";
  const phone = typeof input.phone === "string" ? input.phone : null;

  if (!email || !email.includes("@")) throw new HttpException(400, "Invalid email");
  if (!password || password.length < 6) {
    throw new HttpException(400, "Password must be at least 6 characters");
  }
  if (!fullName) throw new HttpException(400, "fullName is required");

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);
  if (existing) throw new HttpException(409, "Email already registered");

  const passwordHash = await hashPassword(password);
  const created = await createClientUser({
    email: normalizedEmail,
    passwordHash,
    fullName,
    phone
  });

  return {
    id: created.id,
    email: normalizedEmail,
    fullName,
    phone,
    roleId: 1
  };
}

export async function loginUser(input: {
  email?: unknown;
  password?: unknown;
}) {
  const email = typeof input.email === "string" ? input.email : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!email || !password) throw new HttpException(400, "Email and password are required");

  const normalizedEmail = email.trim().toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user || !user.is_active) throw new HttpException(401, "Invalid credentials");

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) throw new HttpException(401, "Invalid credentials");

  const payload: JWTPayload = { userId: user.id, roleId: user.role_id as JWTPayload["roleId"] };
  const accessToken = signAccessToken(payload);

  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      roleId: user.role_id
    }
  };
}

export async function logoutUser(_auth?: JWTPayload) {
  // With stateless JWT there is no server-side session to invalidate.
  // Phase 4 can add refresh tokens/blacklisting; for now this is a real endpoint that
  // validates auth upstream and returns success.
  return { message: "Logged out" };
}


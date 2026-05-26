import { HttpException } from "../utils/http-exception";
import { deleteUserById, findUserById, hashPassword, updateUserProfile } from "../models/user.model";
import type { JWTPayload } from "../types/auth";

export async function meGet(auth?: JWTPayload) {
  if (!auth) throw new HttpException(401, "Unauthorized");

  const user = await findUserById(auth.userId);
  if (!user || !user.is_active) throw new HttpException(401, "Unauthorized");

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    phone: user.phone,
    roleId: user.role_id
  };
}

export async function meUpdate(
  auth?: JWTPayload,
  input?: unknown
) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  const body = (input ?? {}) as Record<string, unknown>;

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : undefined;
  const phone = body.phone === null ? null : typeof body.phone === "string" ? body.phone.trim() : undefined;
  const password = typeof body.password === "string" ? body.password : undefined;

  if (fullName !== undefined && !fullName) throw new HttpException(400, "fullName cannot be empty");
  if (password !== undefined && password.length < 6) {
    throw new HttpException(400, "Password must be at least 6 characters");
  }

  const passwordHash = password ? await hashPassword(password) : undefined;

  await updateUserProfile({
    userId: auth.userId,
    fullName,
    phone,
    passwordHash
  });

  return { message: "Profile updated" };
}

export async function meDelete(auth?: JWTPayload) {
  if (!auth) throw new HttpException(401, "Unauthorized");
  await deleteUserById(auth.userId);
  return { message: "Account deleted" };
}


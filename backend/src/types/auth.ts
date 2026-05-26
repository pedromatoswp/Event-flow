export const Roles = {
  CLIENT: 1 as const,
  ADMIN: 2 as const
};

export type RoleId = (typeof Roles)[keyof typeof Roles];

export type JWTPayload = {
  userId: number;
  roleId: RoleId;
};


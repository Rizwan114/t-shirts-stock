import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface UserPayload {
  id: number;
  username: string;
  role: string;
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireRole(allowedRoles: string[]): Promise<{ user: UserPayload; error?: Response }> {
  const user = await getCurrentUser();
  if (!user) {
    return { user: { id: 0, username: "", role: "" }, error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!allowedRoles.includes(user.role)) {
    return { user, error: Response.json({ error: "Forbidden: insufficient permissions" }, { status: 403 }) };
  }
  return { user };
}

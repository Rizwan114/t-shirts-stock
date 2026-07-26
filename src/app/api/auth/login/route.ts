import { NextRequest } from "next/server";
import { getDb, queryOne, run, saveDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json({ error: "Username and password are required" }, { status: 400 });
    }

    const db = await getDb();
    const user = await queryOne<{ id: number; username: string; password: string; role: string }>(db, "SELECT * FROM users WHERE username = ?", [username]);

    if (!user) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({ id: user.id, username: user.username, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return Response.json({ message: "Login successful", user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    return Response.json({ error: "Server error: " + error }, { status: 500 });
  }
}

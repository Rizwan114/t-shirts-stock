import { NextRequest } from "next/server";
import { getDb, queryAll, queryOne, run } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const sizes = await queryAll<{ id: number; name: string; sort_order: number; is_default: number }>(
    db,
    "SELECT * FROM sizes ORDER BY sort_order ASC"
  );

  return Response.json({ sizes });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireRole(["admin", "stock_manager"]);
  if (error) return error;

  try {
    const { name } = await request.json();

    if (!name || !name.trim()) {
      return Response.json({ error: "Size name is required" }, { status: 400 });
    }

    const trimmed = name.trim().toUpperCase();

    const db = await getDb();
    const existing = await queryOne(db, "SELECT id FROM sizes WHERE name = ?", [trimmed]);
    if (existing) {
      return Response.json({ error: "Size already exists" }, { status: 409 });
    }

    const maxOrder = await queryOne<{ max_order: number }>(db, "SELECT COALESCE(MAX(sort_order), -1) + 1 as max_order FROM sizes");
    const nextOrder = (maxOrder?.max_order ?? 0);

    const result = await run(db, "INSERT INTO sizes (name, sort_order, is_default) VALUES (?, ?, 0)", [trimmed, nextOrder]);

    return Response.json({
      size: { id: result.lastInsertRowid, name: trimmed, sort_order: nextOrder, is_default: 0 },
    }, { status: 201 });
  } catch (err) {
    return Response.json({ error: "Server error: " + err }, { status: 500 });
  }
}

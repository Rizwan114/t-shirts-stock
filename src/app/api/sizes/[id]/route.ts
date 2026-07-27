import { NextRequest } from "next/server";
import { getDb, queryOne, run } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(["admin", "stock_manager"]);
  if (error) return error;

  const { id } = await params;
  const db = await getDb();

  const size = await queryOne<{ id: number; name: string; is_default: number }>(
    db,
    "SELECT * FROM sizes WHERE id = ?",
    [id]
  );

  if (!size) {
    return Response.json({ error: "Size not found" }, { status: 404 });
  }

  if (size.is_default) {
    return Response.json({ error: "Cannot delete default sizes" }, { status: 400 });
  }

  const productCount = await queryOne<{ count: number }>(
    db,
    "SELECT COUNT(*) as count FROM products WHERE size = ?",
    [size.name]
  );

  if (productCount && productCount.count > 0) {
    return Response.json({ error: `Cannot delete: ${productCount.count} products use this size` }, { status: 400 });
  }

  await run(db, "DELETE FROM sizes WHERE id = ?", [id]);
  return Response.json({ message: "Size deleted" });
}

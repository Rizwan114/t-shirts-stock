import { NextRequest } from "next/server";
import { getDb, queryOne, run, saveDb } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await getDb();
  const product = await queryOne(db, "SELECT * FROM products WHERE id = ?", [id]);

  if (!product) {
    return Response.json({ error: "Product not found" }, { status: 404 });
  }

  return Response.json({ product });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(["admin", "stock_manager"]);
  if (error) return error;

  const { id } = await params;
  const db = await getDb();
  const { name, barcode, size, color, stock, price } = await request.json();

  await run(db, "UPDATE products SET name = ?, barcode = ?, size = ?, color = ?, stock = ?, price = ? WHERE id = ?", [name, barcode, size, color, stock, price, id]);
  saveDb();

  const product = await queryOne(db, "SELECT * FROM products WHERE id = ?", [id]);
  return Response.json({ product });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(["admin", "stock_manager"]);
  if (error) return error;

  const { id } = await params;
  const db = await getDb();
  await run(db, "DELETE FROM products WHERE id = ?", [id]);
  saveDb();
  return Response.json({ message: "Deleted" });
}

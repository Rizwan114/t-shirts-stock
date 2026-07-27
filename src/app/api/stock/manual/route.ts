import { NextRequest } from "next/server";
import { getDb, queryOne, run, saveDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { user, error } = await requireRole(["admin", "stock_manager", "sales"]);
  if (error) return error;

  try {
    const { product_id, type, quantity, note } = await request.json();

    if (!product_id || !type || !quantity) {
      return Response.json({ error: "product_id, type, and quantity are required" }, { status: 400 });
    }

    if (type === "IN" && user.role === "sales") {
      return Response.json({ error: "Sales cannot perform stock IN" }, { status: 403 });
    }

    if (type === "OUT" && user.role === "stock_manager") {
      return Response.json({ error: "Stock manager cannot perform stock OUT" }, { status: 403 });
    }

    const db = await getDb();
    const product = await queryOne<{ stock: number }>(db, "SELECT * FROM products WHERE id = ?", [product_id]);
    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 });
    }

    if (type === "OUT" && product.stock < quantity) {
      return Response.json({ error: "Insufficient stock" }, { status: 400 });
    }

    const stockChange = type === "IN" ? quantity : -quantity;
    await run(db, "UPDATE products SET stock = stock + ? WHERE id = ?", [stockChange, product_id]);
    await run(db, "INSERT INTO stock_history (product_id, type, quantity, note) VALUES (?, ?, ?, ?)", [product_id, type, quantity, note || `Manual ${type} by ${user.username}`]);
    saveDb();

    return Response.json({ message: `Stock ${type === "IN" ? "added" : "removed"} successfully` });
  } catch (error) {
    return Response.json({ error: "Server error: " + error }, { status: 500 });
  }
}

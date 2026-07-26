import { NextRequest } from "next/server";
import { getDb, queryOne, run, saveDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { product_id, type, quantity, note } = await request.json();

    if (!product_id || !type || !quantity) {
      return Response.json({ error: "product_id, type, and quantity are required" }, { status: 400 });
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

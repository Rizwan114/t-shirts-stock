import { NextRequest } from "next/server";
import { getDb, queryOne, run, saveDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { barcode, type = "OUT", quantity = 1 } = await request.json();

    if (!barcode) {
      return Response.json({ error: "Barcode is required" }, { status: 400 });
    }

    if (!["IN", "OUT"].includes(type)) {
      return Response.json({ error: "Type must be IN or OUT" }, { status: 400 });
    }

    if (quantity < 1) {
      return Response.json({ error: "Quantity must be at least 1" }, { status: 400 });
    }

    const db = await getDb();
    const product = await queryOne<{ id: number; name: string; barcode: string; size: string; color: string; stock: number; price: number }>(db, "SELECT * FROM products WHERE barcode = ?", [barcode]);

    if (!product) {
      return Response.json({ error: "Product not found with this barcode" }, { status: 404 });
    }

    if (type === "OUT" && product.stock < quantity) {
      return Response.json({ error: `Insufficient stock! Available: ${product.stock}` }, { status: 400 });
    }

    const stockChange = type === "IN" ? quantity : -quantity;
    await run(db, "UPDATE products SET stock = stock + ? WHERE id = ?", [stockChange, product.id]);
    await run(db, "INSERT INTO stock_history (product_id, type, quantity, note) VALUES (?, ?, ?, ?)", [product.id, type, quantity, `Scanned by ${user.username}`]);
    saveDb();

    const updated = await queryOne<{ stock: number }>(db, "SELECT * FROM products WHERE id = ?", [product.id]);

    return Response.json({
      message: `Stock ${type === "IN" ? "increased" : "decreased"} by ${quantity}`,
      product: updated,
      remaining: updated?.stock,
      scannedBy: user.username,
      scannedAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: "Server error: " + error }, { status: 500 });
  }
}

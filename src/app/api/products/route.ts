import { NextRequest } from "next/server";
import { getDb, queryAll, queryOne, run, saveDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const url = request.nextUrl;
  const size = url.searchParams.get("size");

  let products;
  if (size && ["S", "M", "L"].includes(size)) {
    products = await queryAll(db, "SELECT * FROM products WHERE size = ? ORDER BY created_at DESC", [size]);
  } else {
    products = await queryAll(db, "SELECT * FROM products ORDER BY size, created_at DESC");
  }

  return Response.json({ products });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name, barcode, size, color, stock, price } = await request.json();

    if (!name || !barcode || !size) {
      return Response.json({ error: "Name, barcode and size are required" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await queryOne(db, "SELECT id FROM products WHERE barcode = ?", [barcode]);
    if (existing) {
      return Response.json({ error: "Barcode already exists" }, { status: 409 });
    }

    const result = await run(db, "INSERT INTO products (name, barcode, size, color, stock, price) VALUES (?, ?, ?, ?, ?, ?)", [name, barcode, size, color || "White", stock || 0, price || 0]);
    saveDb();

    const product = await queryOne(db, "SELECT * FROM products WHERE id = ?", [result.lastInsertRowid]);
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return Response.json({ error: "Server error: " + error }, { status: 500 });
  }
}

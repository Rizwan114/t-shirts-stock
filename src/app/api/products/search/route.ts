import { NextRequest } from "next/server";
import { queryAll } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = request.nextUrl;
  const q = url.searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    return Response.json({ products: [] });
  }

  const searchTerm = `%${q}%`;
  const products = await queryAll<{
    id: number;
    name: string;
    barcode: string;
    size: string;
    color: string;
    stock: number;
    price: number;
  }>(null, `
    SELECT * FROM products
    WHERE name LIKE ? OR barcode LIKE ? OR CAST(id AS TEXT) LIKE ?
    ORDER BY
      CASE
        WHEN barcode = ? THEN 0
        WHEN name = ? THEN 1
        WHEN CAST(id AS TEXT) = ? THEN 2
        ELSE 3
      END,
      name ASC
    LIMIT 20
  `, [searchTerm, searchTerm, searchTerm, q, q, q]);

  return Response.json({ products });
}

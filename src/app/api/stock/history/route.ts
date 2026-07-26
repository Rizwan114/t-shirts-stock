import { NextRequest } from "next/server";
import { getDb, queryAll } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const url = request.nextUrl;
  const limit = url.searchParams.get("limit") || "100";
  const barcode = url.searchParams.get("barcode");

  let history;
  if (barcode) {
    history = await queryAll(db, `
      SELECT sh.*, p.name as product_name, p.barcode, p.size, p.color, p.price
      FROM stock_history sh
      JOIN products p ON sh.product_id = p.id
      WHERE p.barcode = ?
      ORDER BY sh.created_at DESC
    `, [barcode]);
  } else {
    history = await queryAll(db, `
      SELECT sh.*, p.name as product_name, p.barcode, p.size, p.color, p.price
      FROM stock_history sh
      JOIN products p ON sh.product_id = p.id
      ORDER BY sh.created_at DESC
      LIMIT ?
    `, [limit]);
  }

  return Response.json({ history });
}

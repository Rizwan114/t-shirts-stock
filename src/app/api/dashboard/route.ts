import { getDb, queryAll, queryOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();

  const [totalProductsRow, totalStockRow, smallStockRow, mediumStockRow, largeStockRow, lowStockProducts, recentHistory, todayScansRow] = await Promise.all([
    queryOne<{ count: number }>(db, "SELECT COUNT(*) as count FROM products"),
    queryOne<{ total: number }>(db, "SELECT COALESCE(SUM(stock), 0) as total FROM products"),
    queryOne<{ total: number }>(db, "SELECT COALESCE(SUM(stock), 0) as total FROM products WHERE size = 'S'"),
    queryOne<{ total: number }>(db, "SELECT COALESCE(SUM(stock), 0) as total FROM products WHERE size = 'M'"),
    queryOne<{ total: number }>(db, "SELECT COALESCE(SUM(stock), 0) as total FROM products WHERE size = 'L'"),
    queryAll(db, "SELECT * FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 10"),
    queryAll(db, `
      SELECT sh.*, p.name as product_name, p.size
      FROM stock_history sh
      JOIN products p ON sh.product_id = p.id
      ORDER BY sh.created_at DESC LIMIT 10
    `),
    queryOne<{ count: number }>(db, "SELECT COUNT(*) as count FROM stock_history WHERE type = 'OUT' AND date(created_at) = date('now')"),
  ]);

  return Response.json({
    totalProducts: totalProductsRow?.count || 0,
    totalStock: totalStockRow?.total || 0,
    smallStock: smallStockRow?.total || 0,
    mediumStock: mediumStockRow?.total || 0,
    largeStock: largeStockRow?.total || 0,
    lowStockProducts,
    recentHistory,
    todayScans: todayScansRow?.count || 0,
  });
}

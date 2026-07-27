import { getDb, queryAll, queryOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();

  if (user.role === "sales") {
    const [totalProductsRow, totalStockRow, todayScansRow, todayOutRow, recentHistory, recentProducts, lowStockProducts] = await Promise.all([
      queryOne<{ count: number }>(db, "SELECT COUNT(*) as count FROM products"),
      queryOne<{ total: number }>(db, "SELECT COALESCE(SUM(stock), 0) as total FROM products"),
      queryOne<{ count: number }>(db, "SELECT COUNT(*) as count FROM stock_history WHERE type = 'OUT' AND date(created_at) = date('now')"),
      queryOne<{ total: number }>(db, "SELECT COALESCE(SUM(quantity), 0) as total FROM stock_history WHERE type = 'OUT' AND date(created_at) = date('now')"),
      queryAll(db, `
        SELECT sh.*, p.name as product_name, p.size, p.price
        FROM stock_history sh
        JOIN products p ON sh.product_id = p.id
        WHERE sh.type = 'OUT'
        ORDER BY sh.created_at DESC LIMIT 15
      `),
      queryAll<{ id: number; name: string; barcode: string; size: string; color: string; stock: number; price: number; created_at: string }>(db, `
        SELECT id, name, barcode, size, color, stock, price, created_at
        FROM products
        ORDER BY created_at DESC LIMIT 10
      `),
      queryAll<{ id: number; name: string; size: string; color: string; stock: number; barcode: string }>(db, `
        SELECT id, name, size, color, stock, barcode FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 10
      `),
    ]);

    return Response.json({
      totalProducts: totalProductsRow?.count || 0,
      totalStock: totalStockRow?.total || 0,
      todayScans: todayScansRow?.count || 0,
      todaySold: todayOutRow?.total || 0,
      recentHistory,
      recentProducts,
      lowStockProducts,
      role: "sales",
    });
  }

  const [totalProductsRow, totalStockRow, lowStockProducts, recentHistory, todayScansRow, sizeStocks] = await Promise.all([
    queryOne<{ count: number }>(db, "SELECT COUNT(*) as count FROM products"),
    queryOne<{ total: number }>(db, "SELECT COALESCE(SUM(stock), 0) as total FROM products"),
    queryAll(db, "SELECT * FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 10"),
    queryAll(db, `
      SELECT sh.*, p.name as product_name, p.size
      FROM stock_history sh
      JOIN products p ON sh.product_id = p.id
      ORDER BY sh.created_at DESC LIMIT 10
    `),
    queryOne<{ count: number }>(db, "SELECT COUNT(*) as count FROM stock_history WHERE type = 'OUT' AND date(created_at) = date('now')"),
    queryAll<{ size: string; total: number }>(db, "SELECT size, COALESCE(SUM(stock), 0) as total FROM products GROUP BY size ORDER BY size"),
  ]);

  return Response.json({
    totalProducts: totalProductsRow?.count || 0,
    totalStock: totalStockRow?.total || 0,
    sizeStocks,
    lowStockProducts,
    recentHistory,
    todayScans: todayScansRow?.count || 0,
    role: user.role,
  });
}

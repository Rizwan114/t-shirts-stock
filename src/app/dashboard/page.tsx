"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ShoppingCart,
  ArrowDown,
  ArrowUp,
  Activity,
  DollarSign,
  PackagePlus,
  ShoppingBag,
  Printer,
} from "lucide-react";
import { getSizeColor } from "@/lib/utils";

interface DashboardData {
  totalProducts: number;
  totalStock: number;
  sizeStocks?: Array<{ size: string; total: number }>;
  lowStockProducts?: Array<{
    id: number;
    name: string;
    size: string;
    color: string;
    stock: number;
    barcode: string;
  }>;
  recentHistory: Array<{
    id: number;
    product_name: string;
    size: string;
    type: string;
    quantity: number;
    price?: number;
    created_at: string;
  }>;
  recentProducts?: Array<{
    id: number;
    name: string;
    barcode: string;
    size: string;
    color: string;
    stock: number;
    price: number;
    created_at: string;
  }>;
  todayScans: number;
  todaySold?: number;
  role?: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <AuthGuard>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-muted font-medium text-sm">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const isSales = data.role === "sales";

  const cards = isSales
    ? [
        {
          label: "Total Products",
          value: data.totalProducts,
          icon: Package,
          color: "from-blue-500 to-indigo-600",
          bg: "bg-blue-500/10",
          text: "text-blue-600",
          shadow: "shadow-blue-500/20",
        },
        {
          label: "Today Sales",
          value: data.todayScans,
          icon: ShoppingCart,
          color: "from-orange-500 to-amber-500",
          bg: "bg-orange-500/10",
          text: "text-orange-600",
          shadow: "shadow-orange-500/20",
        },
        {
          label: "Items Sold Today",
          value: data.todaySold || 0,
          icon: TrendingUp,
          color: "from-emerald-500 to-teal-600",
          bg: "bg-emerald-500/10",
          text: "text-emerald-600",
          shadow: "shadow-emerald-500/20",
        },
        {
          label: "Stock Remaining",
          value: data.totalStock,
          icon: Package,
          color: "from-purple-500 to-indigo-500",
          bg: "bg-purple-500/10",
          text: "text-purple-600",
          shadow: "shadow-purple-500/20",
        },
      ]
    : [
        {
          label: "Total Products",
          value: data.totalProducts,
          icon: Package,
          color: "from-blue-500 to-indigo-600",
          bg: "bg-blue-500/10",
          text: "text-blue-600",
          shadow: "shadow-blue-500/20",
        },
        {
          label: "Total Stock",
          value: data.totalStock,
          icon: TrendingUp,
          color: "from-emerald-500 to-teal-600",
          bg: "bg-emerald-500/10",
          text: "text-emerald-600",
          shadow: "shadow-emerald-500/20",
        },
        {
          label: "Today Scans",
          value: data.todayScans,
          icon: ShoppingCart,
          color: "from-orange-500 to-amber-500",
          bg: "bg-orange-500/10",
          text: "text-orange-600",
          shadow: "shadow-orange-500/20",
        },
        {
          label: "Low Stock",
          value: data.lowStockProducts?.length || 0,
          icon: AlertTriangle,
          color: "from-red-500 to-rose-500",
          bg: "bg-red-500/10",
          text: "text-red-600",
          shadow: "shadow-red-500/20",
        },
      ];

  const sizeStocks = data.sizeStocks || [];

  const sizeGradients = [
    "from-cyan-400 to-blue-500",
    "from-violet-400 to-purple-500",
    "from-pink-400 to-rose-500",
    "from-amber-400 to-orange-500",
    "from-orange-400 to-red-500",
    "from-red-400 to-rose-600",
    "from-rose-400 to-pink-600",
    "from-fuchsia-400 to-purple-600",
    "from-indigo-400 to-blue-600",
    "from-teal-400 to-emerald-600",
  ];

  const sizeCards = isSales
    ? []
    : sizeStocks.map((s, i) => ({
        label: s.size,
        value: s.total,
        color: sizeGradients[i % sizeGradients.length],
      }));

  const printSlip = (h: { product_name: string; size: string; type: string; quantity: number; price?: number; created_at: string; id: number }) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const d = new Date(h.created_at);
    const dateStr = d.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "2-digit" });
    const timeStr = d.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stock Slip</title>
        <style>
          @media print { body { margin: 0; padding: 0; } @page { size: 2in 1in; margin: 2mm; } }
          body { font-family: 'Courier New', monospace; width: 2in; margin: 0 auto; padding: 3mm; color: #000; font-size: 8px; line-height: 1.2; }
          .center { text-align: center; }
          .line { border-top: 1px dashed #000; margin: 2mm 0; }
          .bold { font-weight: bold; }
          table { width: 100%; }
          td { padding: 0.5mm 0; font-size: 7.5px; }
          .val { text-align: right; }
          .footer { margin-top: 2mm; font-size: 6.5px; text-align: center; color: #555; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size:10px;">T-SHIRT STOCK</div>
        <div class="center" style="font-size:7px;font-weight:bold;margin-top:1mm;">STOCK OUT</div>
        <div class="line"></div>
        <table>
          <tr><td class="bold">Date</td><td class="val">${dateStr}</td></tr>
          <tr><td class="bold">Time</td><td class="val">${timeStr}</td></tr>
        </table>
        <div class="line"></div>
        <table>
          <tr><td class="bold">Item</td><td class="val">${h.product_name}</td></tr>
          <tr><td class="bold">Size</td><td class="val">${h.size}</td></tr>
        </table>
        <div class="line"></div>
        <table>
          <tr><td class="bold">Qty</td><td class="val">${h.quantity}</td></tr>
          ${h.price != null ? `<tr><td class="bold">Price</td><td class="val">Rs. ${Number(h.price).toFixed(2)}</td></tr>` : ""}
          ${h.price != null ? `<tr><td class="bold" style="font-size:9px;">Total</td><td class="val" style="font-size:9px;font-weight:bold;">Rs. ${(Number(h.price) * h.quantity).toFixed(2)}</td></tr>` : ""}
        </table>
        <div class="line"></div>
        <div class="center footer">#${h.id}</div>
        <script>window.onload = function(){ window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-[family-name:var(--font-poppins)]">
              Dashboard
            </h1>
            <p className="text-muted mt-1 text-sm">
              {isSales ? "Your sales overview" : "Overview of your T-Shirts inventory"}
            </p>
          </motion.div>

          <div className={`grid gap-3 sm:gap-4 mb-6 ${isSales ? "grid-cols-2" : "grid-cols-2 xl:grid-cols-4"}`}>
            {cards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl border border-border p-4 sm:p-5 hover:shadow-lg card-glow transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-muted text-xs sm:text-sm font-medium">{card.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground mt-0.5 font-[family-name:var(--font-poppins)]">{card.value}</p>
              </motion.div>
            ))}
          </div>

          {sizeCards.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
              {sizeCards.map((card, i) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  className="bg-card rounded-2xl border border-border p-4 sm:p-5 hover:shadow-lg card-glow transition-all duration-300 overflow-hidden relative"
                >
                  <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${card.color}`} />
                  <p className="text-muted text-xs sm:text-sm font-medium mt-1">{card.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 font-[family-name:var(--font-poppins)]">{card.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted mt-0.5">units in stock</p>
                </motion.div>
              ))}
            </div>
          )}

          {isSales && data.recentProducts && data.recentProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-card rounded-2xl border border-border p-5 card-glow mb-6"
            >
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <PackagePlus className="w-4 h-4 text-blue-500" />
                </div>
                Recently Added Products
              </h3>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted text-xs border-b border-border">
                      <th className="pb-2 font-medium">Product</th>
                      <th className="pb-2 font-medium">Barcode</th>
                      <th className="pb-2 font-medium">Size</th>
                      <th className="pb-2 font-medium">Color</th>
                      <th className="pb-2 font-medium text-right">Stock</th>
                      <th className="pb-2 font-medium text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentProducts.map((p) => (
                      <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5">
                          <p className="font-medium text-foreground">{p.name}</p>
                        </td>
                        <td className="py-2.5">
                          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{p.barcode}</span>
                        </td>
                        <td className="py-2.5">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${getSizeColor(p.size)}`}>{p.size}</span>
                        </td>
                        <td className="py-2.5 text-muted">{p.color}</td>
                        <td className="py-2.5 text-right font-semibold text-foreground">{p.stock}</td>
                        <td className="py-2.5 text-right text-muted">Rs. {p.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {data.lowStockProducts && data.lowStockProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card rounded-2xl border border-border p-5 card-glow"
              >
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  Low Stock Alerts
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {data.lowStockProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-red-500/[0.03] border border-red-500/10 rounded-xl hover:bg-red-500/[0.06] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{p.name}</p>
                          <p className="text-xs text-muted">{p.size} &middot; {p.color}</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg">{p.stock} left</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-card rounded-2xl border border-border p-5 card-glow"
            >
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-500" />
                </div>
                {isSales ? "Recent Sales" : "Recent Activity"}
              </h3>
              {data.recentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-muted text-sm">{isSales ? "No recent sales" : "No recent activity"}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {data.recentHistory.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            h.type === "IN"
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {h.type === "IN" ? (
                            <ArrowDown className="w-4 h-4" />
                          ) : (
                            <ArrowUp className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{h.product_name}</p>
                          <p className="text-xs text-muted">
                            {h.size} &middot; {h.type} {h.quantity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted">
                          {new Date(h.created_at).toLocaleDateString()}
                        </p>
                        {isSales && (
                          <button
                            onClick={() => printSlip(h)}
                            className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 hover:from-indigo-600 hover:to-purple-700 active:scale-90 transition-all duration-200 shadow-md shadow-indigo-500/20"
                            title="Print receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

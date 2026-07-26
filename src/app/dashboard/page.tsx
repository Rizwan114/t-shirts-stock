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
} from "lucide-react";

interface DashboardData {
  totalProducts: number;
  totalStock: number;
  smallStock: number;
  mediumStock: number;
  largeStock: number;
  lowStockProducts: Array<{
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
    created_at: string;
  }>;
  todayScans: number;
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

  const cards = [
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
      value: data.lowStockProducts.length,
      icon: AlertTriangle,
      color: "from-red-500 to-rose-500",
      bg: "bg-red-500/10",
      text: "text-red-600",
      shadow: "shadow-red-500/20",
    },
  ];

  const sizeCards = [
    { label: "Small (S)", value: data.smallStock, color: "from-cyan-400 to-blue-500", bg: "bg-cyan-50", ring: "ring-cyan-200" },
    { label: "Medium (M)", value: data.mediumStock, color: "from-violet-400 to-purple-500", bg: "bg-violet-50", ring: "ring-violet-200" },
    { label: "Large (L)", value: data.largeStock, color: "from-pink-400 to-rose-500", bg: "bg-pink-50", ring: "ring-pink-200" },
  ];

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
            <p className="text-muted mt-1 text-sm">Overview of your T-Shirts inventory</p>
          </motion.div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
              {data.lowStockProducts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-muted text-sm">All products are well stocked!</p>
                </div>
              ) : (
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
              )}
            </motion.div>

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
                Recent Activity
              </h3>
              {data.recentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-muted text-sm">No recent activity</p>
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
                      <p className="text-xs text-muted">
                        {new Date(h.created_at).toLocaleDateString()}
                      </p>
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

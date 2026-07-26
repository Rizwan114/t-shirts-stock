"use client";

import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ArrowDown, ArrowUp, Edit2, Trash2, X, Save, Check } from "lucide-react";

interface Product {
  id: number;
  name: string;
  barcode: string;
  size: string;
  color: string;
  stock: number;
  price: number;
  created_at: string;
}

function StockPageContent({ size, title, color }: { size: string; title: string; color: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [showStockModal, setShowStockModal] = useState<number | null>(null);
  const [stockQty, setStockQty] = useState(1);
  const [stockType, setStockType] = useState<"IN" | "OUT">("IN");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchProducts = useCallback(async () => {
    const res = await fetch(`/api/products?size=${size}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }, [size]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleStockChange = async (productId: number) => {
    const res = await fetch("/api/stock/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, type: stockType, quantity: stockQty }),
    });
    const data = await res.json();
    if (res.ok) { showMessage("success", data.message); fetchProducts(); }
    else { showMessage("error", data.error); }
    setShowStockModal(null);
    setStockQty(1);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) { showMessage("success", "Product deleted"); fetchProducts(); }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({ name: product.name, barcode: product.barcode, color: product.color, stock: product.stock, price: product.price });
  };

  const handleSaveEdit = async (id: number) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, size }),
    });
    if (res.ok) { showMessage("success", "Product updated"); setEditingId(null); fetchProducts(); }
    else { const data = await res.json(); showMessage("error", data.error); }
  };

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-[family-name:var(--font-poppins)]">{title}</h1>
            <p className="text-muted mt-1 text-sm">Manage {title.toLowerCase()} T-shirt inventory</p>
          </div>
          <div className={`px-6 py-4 rounded-2xl bg-gradient-to-r ${color} text-white shadow-lg relative overflow-hidden`}>
            <div className="absolute inset-0 animate-shimmer" />
            <p className="text-sm opacity-80 relative z-10">Total Stock</p>
            <p className="text-3xl font-bold relative z-10 font-[family-name:var(--font-poppins)]">{totalStock}</p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-red-500/10 text-red-600 border border-red-500/20"
            }`}
          >
            {message.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted text-sm">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-muted" />
          </div>
          <p className="text-muted text-lg font-medium">No {title.toLowerCase()} products found</p>
          <p className="text-muted/60 text-sm mt-1">Add some products to get started</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 relative">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card rounded-2xl border border-border p-5 card-glow transition-all duration-300 group relative overflow-hidden"
            >
              {editingId === product.id ? (
                <div className="space-y-3">
                  <input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Name" />
                  <input value={editForm.barcode || ""} onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Barcode" />
                  <input value={editForm.color || ""} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Color" />
                  <div className="flex gap-2">
                    <input type="number" value={editForm.stock || 0} onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })} className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Stock" />
                    <input type="number" value={editForm.price || 0} onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })} className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Price" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(product.id)} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-medium hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20">
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-700 text-foreground rounded-xl text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-1.5">
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                      <p className="text-xs text-muted font-mono mt-0.5">{product.barcode}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button onClick={() => handleEdit(product)} className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-muted hover:text-indigo-500 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted mb-3 flex-wrap">
                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-md text-xs font-medium">{product.size}</span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-xs">{product.color}</span>
                    <span className="ml-auto text-xs font-medium">Rs. {product.price}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div>
                      <p className="text-[10px] text-muted uppercase tracking-wider font-medium">Stock</p>
                      <p className={`text-2xl font-bold font-[family-name:var(--font-poppins)] ${product.stock <= 5 ? "text-red-500" : "text-foreground"}`}>
                        {product.stock}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowStockModal(product.id)}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Adjust Stock
                    </button>
                  </div>

                  <AnimatePresence>
                    {showStockModal === product.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-border overflow-hidden"
                      >
                        <div className="flex gap-2 mb-3">
                          <button onClick={() => setStockType("IN")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${stockType === "IN" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25" : "bg-slate-100 dark:bg-slate-800 text-muted hover:text-emerald-500"}`}>
                            <ArrowDown className="w-4 h-4" /> Stock In
                          </button>
                          <button onClick={() => setStockType("OUT")} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${stockType === "OUT" ? "bg-red-500 text-white shadow-md shadow-red-500/25" : "bg-slate-100 dark:bg-slate-800 text-muted hover:text-red-500"}`}>
                            <ArrowUp className="w-4 h-4" /> Stock Out
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input type="number" min="1" value={stockQty} onChange={(e) => setStockQty(parseInt(e.target.value) || 1)} className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-border rounded-xl text-sm text-center font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                          <button onClick={() => handleStockChange(product.id)} className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md">
                            Apply
                          </button>
                          <button onClick={() => setShowStockModal(null)} className="px-3 py-2.5 bg-slate-200 dark:bg-slate-700 text-foreground text-sm rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}

export default function LargePage() {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <StockPageContent size="L" title="Large Size (L)" color="from-pink-500 to-rose-500" />
      </div>
    </AuthGuard>
  );
}

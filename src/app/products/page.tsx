"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Search, Edit2, Trash2, X, Save, ArrowDown, ArrowUp, Filter, Check } from "lucide-react";
import { getSizeColor, getStockBadge } from "@/lib/utils";

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

interface UserData {
  role: string;
}

interface SizeOption {
  id: number;
  name: string;
  sort_order: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSize, setFilterSize] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [showStockModal, setShowStockModal] = useState<number | null>(null);
  const [stockQty, setStockQty] = useState(1);
  const [stockType, setStockType] = useState<"IN" | "OUT">("IN");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [sizes, setSizes] = useState<SizeOption[]>([]);

  const canEdit = user?.role === "admin" || user?.role === "stock_manager";

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUser(data.user || data));
    fetch("/api/sizes")
      .then((res) => res.json())
      .then((data) => setSizes(data.sizes || []));
    fetchProducts();
  }, []);

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
    if (res.ok) {
      showMessage("success", data.message);
      fetchProducts();
    } else {
      showMessage("error", data.error);
    }
    setShowStockModal(null);
    setStockQty(1);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      showMessage("success", "Product deleted");
      fetchProducts();
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({ name: product.name, barcode: product.barcode, size: product.size, color: product.color, stock: product.stock, price: product.price });
  };

  const handleSaveEdit = async (id: number) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      showMessage("success", "Product updated");
      setEditingId(null);
      fetchProducts();
    } else {
      const data = await res.json();
      showMessage("error", data.error);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    const matchSize = !filterSize || p.size === filterSize;
    return matchSearch && matchSize;
  });

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 relative overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-[family-name:var(--font-poppins)]">
                    All Products
                  </h1>
                  <p className="text-muted text-sm">
                    {products.length} total products
                    {!canEdit && " (Read-only view)"}
                  </p>
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
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  }`}
                >
                  {message.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass rounded-2xl border border-border/60 p-3 mb-6 card-glow"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or barcode..."
                    className="w-full pl-10 pr-4 py-2.5 bg-background/60 border border-border/80 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 outline-none transition-all placeholder:text-muted/60"
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                  <select
                    value={filterSize}
                    onChange={(e) => setFilterSize(e.target.value)}
                    className="pl-10 pr-8 py-2.5 bg-background/60 border border-border/80 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer min-w-[140px]"
                  >
                    <option value="">All Sizes</option>
                    {sizes.map((s) => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(search || filterSize) && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50">
                  <span className="text-xs text-muted">Active filters:</span>
                  {search && (
                    <button onClick={() => setSearch("")} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                      &quot;{search}&quot; <X className="w-3 h-3" />
                    </button>
                  )}
                  {filterSize && (
                    <button onClick={() => setFilterSize("")} className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-medium hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors">
                      {filterSize} <X className="w-3 h-3" />
                    </button>
                  )}
                  <button onClick={() => { setSearch(""); setFilterSize(""); }} className="text-xs text-muted hover:text-foreground transition-colors ml-auto">
                    Clear all
                  </button>
                </div>
              )}
            </motion.div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 rounded-full" />
                  <div className="absolute inset-0 w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-muted text-sm mt-4">Loading products...</p>
              </div>
            ) : filtered.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-24"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center">
                    <Package className="w-10 h-10 text-indigo-400 dark:text-indigo-300" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-background rounded-full border-2 border-border flex items-center justify-center">
                    <X className="w-3 h-3 text-muted" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-poppins)] mb-1">
                  {search || filterSize ? "No matching products" : "No products yet"}
                </h3>
                <p className="text-muted text-sm text-center max-w-sm mb-4">
                  {search || filterSize
                    ? "Try adjusting your search or filter criteria."
                    : "Start by adding your first product to the inventory."}
                </p>
                {(search || filterSize) && (
                  <button
                    onClick={() => { setSearch(""); setFilterSize(""); }}
                    className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-xl hover:bg-indigo-600 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </motion.div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="hidden md:block bg-card rounded-2xl border border-border/80 overflow-hidden card-glow"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border/80 bg-slate-50/80 dark:bg-slate-800/40">
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">Name</th>
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">Barcode</th>
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">Size</th>
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">Color</th>
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">Stock</th>
                          <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">Price</th>
                          {canEdit && <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filtered.map((product, index) => (
                          <tr
                            key={product.id}
                            className={`transition-colors hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 ${
                              index % 2 === 0 ? "bg-background/40" : "bg-slate-50/30 dark:bg-slate-800/20"
                            }`}
                          >
                            {editingId === product.id ? (
                              <>
                                <td className="px-3 py-2.5">
                                  <input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-3 py-1.5 bg-background/80 border border-indigo-500/30 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all" />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input value={editForm.barcode || ""} onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })} className="w-full px-3 py-1.5 bg-background/80 border border-indigo-500/30 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all" />
                                </td>
                                <td className="px-3 py-2.5">
                                  <select value={editForm.size || ""} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} className="w-full px-3 py-1.5 bg-background/80 border border-indigo-500/30 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer">
                                    {sizes.map((s) => (
                                      <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-3 py-2.5">
                                  <input value={editForm.color || ""} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} className="w-full px-3 py-1.5 bg-background/80 border border-indigo-500/30 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all" />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input type="number" value={editForm.stock || 0} onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })} className="w-full px-3 py-1.5 bg-background/80 border border-indigo-500/30 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all" />
                                </td>
                                <td className="px-3 py-2.5">
                                  <input type="number" value={editForm.price || 0} onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-1.5 bg-background/80 border border-indigo-500/30 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all" />
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex gap-1.5 justify-end">
                                    <button onClick={() => handleSaveEdit(product.id)} className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 transition-all" title="Save">
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="p-1.5 bg-slate-200 dark:bg-slate-700 text-foreground rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all" title="Cancel">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="px-5 py-3.5 text-sm font-medium text-foreground">{product.name}</td>
                                <td className="px-5 py-3.5 text-sm text-muted font-mono">{product.barcode}</td>
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-semibold ${getSizeColor(product.size)}`}>
                                    {product.size}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-sm text-muted">{product.color}</td>
                                <td className="px-5 py-3.5">
                                  <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-semibold ${getStockBadge(product.stock)}`}>
                                    {product.stock}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-sm font-medium text-foreground">Rs. {product.price}</td>
                                {canEdit && (
                                  <td className="px-5 py-3.5">
                                    <div className="flex gap-1 justify-end">
                                      <button onClick={() => setShowStockModal(product.id)} className="p-1.5 text-muted hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all" title="Adjust stock">
                                        <ArrowDown className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleEdit(product)} className="p-1.5 text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all" title="Edit">
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDelete(product.id)} className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>

                <div className="md:hidden space-y-3">
                  {filtered.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-card rounded-2xl border border-border/80 p-4 card-glow"
                    >
                      {editingId === product.id ? (
                        <div className="space-y-3">
                          <input value={editForm.name || ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" className="w-full px-3 py-2 bg-background/80 border border-indigo-500/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" />
                          <input value={editForm.barcode || ""} onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })} placeholder="Barcode" className="w-full px-3 py-2 bg-background/80 border border-indigo-500/30 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" />
                          <div className="grid grid-cols-2 gap-3">
                            <select value={editForm.size || ""} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} className="w-full px-3 py-2 bg-background/80 border border-indigo-500/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer">
                              {sizes.map((s) => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                              ))}
                            </select>
                            <input value={editForm.color || ""} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} placeholder="Color" className="w-full px-3 py-2 bg-background/80 border border-indigo-500/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <input type="number" value={editForm.stock || 0} onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })} placeholder="Stock" className="w-full px-3 py-2 bg-background/80 border border-indigo-500/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" />
                            <input type="number" value={editForm.price || 0} onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })} placeholder="Price" className="w-full px-3 py-2 bg-background/80 border border-indigo-500/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all" />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => handleSaveEdit(product.id)} className="flex-1 py-2 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5">
                              <Save className="w-4 h-4" /> Save
                            </button>
                            <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-foreground text-sm font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-foreground truncate">{product.name}</h3>
                              <p className="text-xs text-muted font-mono mt-0.5">{product.barcode}</p>
                            </div>
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold ml-2 shrink-0 ${getSizeColor(product.size)}`}>
                              {product.size}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">Color</p>
                              <p className="text-sm text-foreground">{product.color}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">Stock</p>
                              <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-semibold ${getStockBadge(product.stock)}`}>
                                {product.stock}
                              </span>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-muted font-medium mb-0.5">Price</p>
                              <p className="text-sm font-medium text-foreground">Rs. {product.price}</p>
                            </div>
                          </div>
                          {canEdit && (
                            <div className="flex gap-2 pt-2 border-t border-border/60">
                              <button onClick={() => setShowStockModal(product.id)} className="flex-1 py-1.5 text-xs font-medium text-muted hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all flex items-center justify-center gap-1">
                                <ArrowDown className="w-3.5 h-3.5" /> Stock
                              </button>
                              <button onClick={() => handleEdit(product)} className="flex-1 py-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all flex items-center justify-center gap-1">
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button onClick={() => handleDelete(product.id)} className="flex-1 py-1.5 text-xs font-medium text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all flex items-center justify-center gap-1">
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>

          <AnimatePresence>
            {showStockModal && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowStockModal(null)}>
                <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="glass rounded-3xl border border-border/60 p-6 w-full max-w-sm shadow-2xl card-glow">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-poppins)]">Adjust Stock</h3>
                    <button onClick={() => setShowStockModal(null)} className="p-1 text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 mb-5">
                    <button onClick={() => setStockType("IN")} className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      stockType === "IN"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                        : "bg-slate-100 dark:bg-slate-800 text-muted hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}>
                      <ArrowDown className="w-4 h-4" /> IN
                    </button>
                    <button onClick={() => setStockType("OUT")} className={`flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                      stockType === "OUT"
                        ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                        : "bg-slate-100 dark:bg-slate-800 text-muted hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}>
                      <ArrowUp className="w-4 h-4" /> OUT
                    </button>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={stockQty}
                    onChange={(e) => setStockQty(parseInt(e.target.value) || 1)}
                    className="w-full px-4 py-3.5 bg-background/80 border border-border/80 rounded-xl text-center text-xl font-bold focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 outline-none mb-5 transition-all"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleStockChange(showStockModal)} className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/25 transition-all">
                      Apply
                    </button>
                    <button onClick={() => setShowStockModal(null)} className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 text-foreground rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </AuthGuard>
  );
}

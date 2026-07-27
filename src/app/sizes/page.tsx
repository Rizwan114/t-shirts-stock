"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, Plus, Trash2, X, Check, Shield } from "lucide-react";

interface SizeOption {
  id: number;
  name: string;
  sort_order: number;
  is_default: number;
}

export default function SizesPage() {
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSize, setNewSize] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSizes = async () => {
    const res = await fetch("/api/sizes");
    const data = await res.json();
    setSizes(data.sizes || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSizes();
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAdd = async () => {
    if (!newSize.trim()) return;
    setAdding(true);

    const res = await fetch("/api/sizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newSize.trim() }),
    });

    const data = await res.json();
    if (res.ok) {
      showMessage("success", `Size "${data.size.name}" added`);
      setNewSize("");
      fetchSizes();
    } else {
      showMessage("error", data.error);
    }
    setAdding(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete size "${name}"?`)) return;

    const res = await fetch(`/api/sizes/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      showMessage("success", `Size "${name}" deleted`);
      fetchSizes();
    } else {
      showMessage("error", data.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  const sizeColors = [
    "from-cyan-500 to-blue-500",
    "from-violet-500 to-purple-500",
    "from-pink-500 to-rose-500",
    "from-amber-500 to-orange-500",
    "from-orange-500 to-red-500",
    "from-red-500 to-rose-600",
    "from-rose-500 to-pink-600",
    "from-fuchsia-500 to-purple-600",
    "from-indigo-500 to-blue-600",
    "from-teal-500 to-emerald-600",
    "from-emerald-500 to-green-600",
    "from-sky-500 to-cyan-600",
  ];

  return (
    <AuthGuard allowedRoles={["admin", "stock_manager"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 relative overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
                  <Ruler className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-[family-name:var(--font-poppins)]">
                    Manage Sizes
                  </h1>
                  <p className="text-muted text-sm">{sizes.length} sizes available</p>
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
              className="glass rounded-2xl border border-border/60 p-4 mb-6 card-glow"
            >
              <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">Add New Size</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., 6XL, XXS, Custom..."
                  className="flex-1 px-4 py-3 bg-background/80 border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all placeholder:text-muted/40 font-semibold"
                />
                <button
                  onClick={handleAdd}
                  disabled={!newSize.trim() || adding}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {adding ? "Adding..." : "Add"}
                </button>
              </div>
            </motion.div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-muted text-sm">Loading sizes...</p>
              </div>
            ) : sizes.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <Ruler className="w-8 h-8 text-muted" />
                </div>
                <p className="text-muted text-lg font-medium">No sizes defined</p>
                <p className="text-muted/60 text-sm mt-1">Add your first size above</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {sizes.map((size, i) => {
                  const gradient = sizeColors[i % sizeColors.length];
                  return (
                    <motion.div
                      key={size.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="bg-card rounded-2xl border border-border p-4 card-glow group relative overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient}`} />
                      <div className="flex items-center justify-between mt-1">
                        <div>
                          <p className="text-2xl font-bold text-foreground font-[family-name:var(--font-poppins)]">{size.name}</p>
                          {size.is_default ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">
                              <Shield className="w-3 h-3" /> Default
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted font-medium mt-1 block">Custom</span>
                          )}
                        </div>
                        {!size.is_default && (
                          <button
                            onClick={() => handleDelete(size.id, size.name)}
                            className="p-2 text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

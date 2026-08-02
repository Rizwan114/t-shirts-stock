"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { motion } from "framer-motion";
import { PackagePlus, ArrowLeft, Tag, Barcode, Palette, Boxes, IndianRupee, Shirt, AlertCircle, Plus, RefreshCw } from "lucide-react";

interface SizeOption {
  id: number;
  name: string;
  sort_order: number;
  is_default: number;
}

const sizeGradients = [
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

export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    size: "",
    color: "White",
    stock: "",
    price: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [customMode, setCustomMode] = useState(false);
  const [customSize, setCustomSize] = useState("");
  const [barcodeEdited, setBarcodeEdited] = useState(false);

  const generateBarcodeCode = (name: string) => {
    const cleaned = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const prefix = (cleaned.slice(0, 3) || "TSH").padEnd(3, "X");
    const num = Math.floor(10000000 + Math.random() * 90000000);
    return `${prefix}-${num}`;
  };

  useEffect(() => {
    if (barcodeEdited) return;
    setForm((prev) => ({ ...prev, barcode: generateBarcodeCode(prev.name) }));
  }, [form.name, barcodeEdited]);

  useEffect(() => {
    fetch("/api/sizes")
      .then((res) => res.json())
      .then((data) => {
        const s = data.sizes || [];
        setSizes(s);
        if (s.length > 0) {
          setForm((prev) => ({ ...prev, size: s[0].name }));
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const selectedSize = customMode ? customSize.trim().toUpperCase() : form.size;
    if (!selectedSize) {
      setError("Please select or enter a size");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        size: selectedSize,
        stock: parseInt(form.stock as string) || 0,
        price: parseFloat(form.price as string) || 0,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to add product");
      setLoading(false);
      return;
    }

    router.push("/products");
  };

  return (
    <AuthGuard allowedRoles={["admin", "stock_manager"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl -z-0" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl -z-0" />

          <div className="max-w-2xl mx-auto relative z-10">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <button
                onClick={() => router.back()}
                className="group flex items-center gap-2 px-3 py-1.5 -ml-3 rounded-lg text-muted hover:text-foreground hover:bg-card-hover transition-all duration-200 mb-6"
              >
                <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <PackagePlus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-[family-name:var(--font-poppins)]">
                    Add New Product
                  </h1>
                  <p className="text-muted mt-0.5 text-sm">Add a new T-shirt to inventory</p>
                </div>
              </div>
            </motion.div>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              onSubmit={handleSubmit}
              className="glass card-glow rounded-2xl border border-border/60 p-6 sm:p-8 space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              <div className="flex items-center gap-3 pb-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <PackagePlus className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground font-[family-name:var(--font-poppins)]">Product Details</h2>
                  <p className="text-xs text-muted">Fill in the T-shirt information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">Product Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Tag className="w-4 h-4 text-muted/60" />
                    </div>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3.5 bg-background/80 border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all duration-200 placeholder:text-muted/40"
                      placeholder="e.g., Classic Cotton T-Shirt"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">Barcode *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Barcode className="w-4 h-4 text-muted/60" />
                    </div>
                    <input
                      type="text"
                      value={form.barcode}
                      onChange={(e) => {
                        setForm({ ...form, barcode: e.target.value });
                        setBarcodeEdited(true);
                      }}
                      className="w-full pl-10 pr-20 py-3.5 bg-background/80 border border-border rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all duration-200 placeholder:text-muted/40"
                      placeholder="e.g., TSH-001"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, barcode: generateBarcodeCode(prev.name) }));
                        setBarcodeEdited(false);
                      }}
                      title="Generate a new barcode"
                      className="absolute inset-y-0 right-0 flex items-center gap-1.5 px-3.5 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-r-xl transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-xs font-semibold">Generate</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-muted/70 mt-1.5 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Barcode auto-generates — click Generate for a new one
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">Color</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Palette className="w-4 h-4 text-muted/60" />
                    </div>
                    <input
                      type="text"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-full pl-10 pr-4 py-3.5 bg-background/80 border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all duration-200 placeholder:text-muted/40"
                      placeholder="e.g., White, Black, Navy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">Stock Quantity *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Boxes className="w-4 h-4 text-muted/60" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="w-full pl-10 pr-4 py-3.5 bg-background/80 border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all duration-200 placeholder:text-muted/40"
                      placeholder="e.g., 100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">Price (Rs.) *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <IndianRupee className="w-4 h-4 text-muted/60" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full pl-10 pr-4 py-3.5 bg-background/80 border border-border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all duration-200 placeholder:text-muted/40"
                      placeholder="e.g., 500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wider">
                    <Shirt className="w-3.5 h-3.5" />
                    Size *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomMode(!customMode);
                      if (!customMode) {
                        setCustomSize("");
                      } else if (sizes.length > 0) {
                        setForm({ ...form, size: sizes[0].name });
                      }
                    }}
                    className="text-xs font-medium text-indigo-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    {customMode ? "Choose from list" : "Custom size"}
                  </button>
                </div>

                {customMode ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value)}
                      className="w-full px-4 py-3.5 bg-background/80 border-2 border-dashed border-indigo-500/30 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all duration-200 placeholder:text-muted/40 text-center font-semibold text-lg"
                      placeholder="Enter custom size (e.g., 6XL)"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {sizes.map((s, i) => {
                      const gradient = sizeGradients[i % sizeGradients.length];
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setForm({ ...form, size: s.name })}
                          className={`py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                            form.size === s.name
                              ? `bg-gradient-to-br ${gradient} text-white shadow-lg scale-[1.05]`
                              : "bg-background/80 text-muted border border-border hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-card-hover"
                          }`}
                        >
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex items-start gap-3 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                >
                  <AlertCircle className="w-4.5 h-4.5 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4.5 w-4.5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Adding Product...</span>
                  </>
                ) : (
                  <>
                    <PackagePlus className="w-4.5 h-4.5" />
                    <span>Add Product</span>
                  </>
                )}
              </button>
            </motion.form>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { ScanBarcode, CheckCircle, XCircle, Package, Printer, ArrowUp, ArrowDown } from "lucide-react";

interface Product {
  id: number;
  name: string;
  barcode: string;
  size: string;
  color: string;
  price: number;
}

interface ScanResult {
  type: "success" | "error";
  message: string;
  product?: Product;
  scannedBy?: string;
  scannedAt?: string;
  stockType?: "IN" | "OUT";
  stockQty?: number;
}

export default function ScanPage() {
  const [barcode, setBarcode] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [manualMode, setManualMode] = useState(false);
  const [stockType, setStockType] = useState<"IN" | "OUT">("OUT");
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!manualMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [manualMode, result]);

  const handleScan = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setScanning(true);
    setResult(null);

    try {
      const res = await fetch("/api/stock/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode: code.trim(), type: stockType, quantity }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResult({ type: "error", message: data.error });
      } else {
        setResult({
          type: "success",
          message: data.message,
          product: data.product,
          scannedBy: data.scannedBy,
          scannedAt: data.scannedAt,
          stockType,
          stockQty: quantity,
        });
        printSlip(data.product, data.scannedBy, stockType, quantity);
      }
    } catch {
      setResult({ type: "error", message: "Network error" });
    }

    setScanning(false);
    setBarcode("");
    setQuantity(1);
    if (!manualMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [manualMode, stockType, quantity]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && barcode) {
      handleScan(barcode);
    }
  };

  const printSlip = (product: Product, scannedBy?: string, sType: "IN" | "OUT" = "OUT", qty: number = 1) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const p = product;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "2-digit" });
    const timeStr = now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Scan Receipt</title>
        <style>
          @media print { body { margin: 0; } }
          body {
            font-family: 'Courier New', monospace;
            width: 280px;
            margin: 0 auto;
            padding: 10px;
            color: #000;
          }
          .center { text-align: center; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
          .bold { font-weight: bold; }
          .large { font-size: 16px; }
          table { width: 100%; }
          td { padding: 2px 0; font-size: 13px; }
          .val { text-align: right; }
          .footer { margin-top: 10px; font-size: 11px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="center bold large">T-SHIRT STOCK</div>
        <div class="center" style="font-size:11px;color:#666;">Inventory Management</div>
        <div class="line"></div>
        <table>
          <tr><td class="bold">Date</td><td class="val">${dateStr}</td></tr>
          <tr><td class="bold">Time</td><td class="val">${timeStr}</td></tr>
        </table>
        <div class="line"></div>
        <div class="bold" style="font-size:14px;margin-bottom:6px;">PRODUCT DETAILS</div>
        <table>
          <tr><td class="bold">Name</td><td class="val">${p.name}</td></tr>
          <tr><td class="bold">Barcode</td><td class="val">${p.barcode}</td></tr>
          <tr><td class="bold">Size</td><td class="val">${p.size}</td></tr>
          <tr><td class="bold">Color</td><td class="val">${p.color}</td></tr>
          <tr><td class="bold">Price</td><td class="val">Rs. ${(p.price || 0).toFixed(2)}</td></tr>
        </table>
        <div class="line"></div>
        <table>
          <tr><td class="bold">Type</td><td class="val">STOCK ${sType}</td></tr>
          <tr><td class="bold">Quantity</td><td class="val">${qty}</td></tr>
        </table>
        <div class="line"></div>
        <div class="center footer">
          Scanned by: ${scannedBy || "N/A"}<br>
          Thank you!
        </div>
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
        <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_1px_1px,_var(--foreground)_1px,transparent_0)] bg-[size:32px_32px]" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-[0.04] pointer-events-none rounded-full bg-gradient-to-bl from-indigo-500 via-purple-500 to-transparent blur-3xl" />

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-[family-name:var(--font-poppins)]">
                Scan Barcode
              </h1>
              <p className="text-muted mt-1.5 text-sm sm:text-base">Scan a barcode to update stock IN or OUT</p>
            </motion.div>

            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="glass card-glow rounded-3xl border border-white/60 p-6 sm:p-8 mb-6"
              >
                <div className="text-center mb-8">
                  <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-5 animate-pulse-glow relative">
                    <div className="absolute inset-0 rounded-3xl animate-shimmer" />
                    <ScanBarcode className="w-12 h-12 text-white relative z-10" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-poppins)]">
                    Ready to Scan
                  </h2>
                  <p className="text-muted text-sm mt-1">
                    Point your barcode scanner at the input field below
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setStockType("IN")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                        stockType === "IN"
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                          : "bg-white/60 dark:bg-slate-800/60 text-muted border border-border hover:border-emerald-500/30"
                      }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                      Stock IN
                    </button>
                    <button
                      onClick={() => setStockType("OUT")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                        stockType === "OUT"
                          ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                          : "bg-white/60 dark:bg-slate-800/60 text-muted border border-border hover:border-red-500/30"
                      }`}
                    >
                      <ArrowDown className="w-4 h-4" />
                      Stock OUT
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-muted whitespace-nowrap">Quantity</label>
                    <div className="flex items-center flex-1">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2.5 bg-white/60 dark:bg-slate-800/60 border border-border rounded-l-2xl text-lg font-bold hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 py-2.5 text-center bg-white/80 dark:bg-slate-800/80 border-y-2 border-border text-lg font-bold focus:outline-none focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-4 py-2.5 bg-white/60 dark:bg-slate-800/60 border border-border rounded-r-2xl text-lg font-bold hover:bg-white dark:hover:bg-slate-700 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-500" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Scan or type barcode..."
                      className="relative w-full px-6 py-5 bg-white/80 dark:bg-slate-800/80 border-2 border-border rounded-2xl text-lg font-mono focus:outline-none focus:border-indigo-500 focus:ring-0 transition-all duration-300 text-center placeholder:text-muted/60"
                      disabled={scanning}
                      autoFocus
                    />
                  </div>

                  <button
                    onClick={() => handleScan(barcode)}
                    disabled={!barcode.trim() || scanning}
                    className={`w-full py-4 text-white font-semibold rounded-2xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] text-base ${
                      stockType === "IN"
                        ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-emerald-500/25 hover:shadow-emerald-500/30"
                        : "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 shadow-indigo-500/25 hover:shadow-indigo-500/30"
                    }`}
                  >
                    {scanning ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      `Process Stock ${stockType}`
                    )}
                  </button>

                  <button
                    onClick={() => setManualMode(!manualMode)}
                    className="w-full py-2.5 text-sm text-muted hover:text-foreground transition-colors duration-200 rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                  >
                    {manualMode ? "Switch to Auto-Scan Mode" : "Switch to Manual Entry Mode"}
                  </button>
                </div>
              </motion.div>

              <AnimatePresence mode="wait">
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`glass card-glow rounded-3xl border p-6 sm:p-7 ${
                      result.type === "success"
                        ? "border-emerald-500/20"
                        : "border-red-500/20"
                    }`}
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          result.type === "success"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {result.type === "success" ? (
                          <CheckCircle className="w-7 h-7" />
                        ) : (
                          <XCircle className="w-7 h-7" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-base ${
                          result.type === "success" ? "text-emerald-600" : "text-red-600"
                        }`}>
                          {result.message}
                        </p>
                        {result.product && (
                          <div className="mt-3 space-y-2">
                            <p className="text-foreground font-semibold text-lg font-[family-name:var(--font-poppins)]">
                              {result.product.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                              <span className="flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5" />
                                Size: {result.product.size}
                              </span>
                              <span className="text-border">|</span>
                              <span>Color: {result.product.color}</span>
                            </div>
                            {result.stockType && (
                              <p className={`text-xs font-semibold mt-1.5 ${
                                result.stockType === "IN" ? "text-emerald-500" : "text-red-500"
                              }`}>
                                Stock {result.stockType} x {result.stockQty}
                              </p>
                            )}
                            {result.scannedAt && (
                              <p className="text-xs text-muted/70 mt-1.5">
                                {new Date(result.scannedAt).toLocaleString("en-PK")}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      {result.type === "success" && result.product && (
                        <button
                          onClick={() => result.product && printSlip(result.product, result.scannedBy, result.stockType, result.stockQty)}
                          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-2xl hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] flex-shrink-0"
                        >
                          <Printer className="w-4 h-4" />
                          Print
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

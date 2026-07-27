"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { ScanBarcode, CheckCircle, XCircle, Package, Printer, ArrowDown, AlertTriangle, SearchX } from "lucide-react";

interface Product {
  id: number;
  name: string;
  barcode: string;
  size: string;
  color: string;
  price: number;
  stock: number;
}

interface ScanResult {
  type: "success" | "error" | "not_found" | "out_of_stock";
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
  const [quantity, setQuantity] = useState(1);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyTimeRef = useRef<number>(0);
  const keyBufferRef = useRef<string>("");

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
        body: JSON.stringify({ barcode: code.trim(), type: "OUT", quantity }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes("not found")) {
          setResult({ type: "not_found", message: data.error });
        } else if (data.error?.includes("Insufficient")) {
          setResult({ type: "out_of_stock", message: data.error, product: data.product });
        } else {
          setResult({ type: "error", message: data.error });
        }
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      } else {
        setResult({
          type: "success",
          message: data.message,
          product: data.product,
          scannedBy: data.scannedBy,
          scannedAt: data.scannedAt,
          stockType: "OUT",
          stockQty: quantity,
        });
        if (navigator.vibrate) navigator.vibrate(100);
        printSlip(data.product, data.scannedBy, "OUT", quantity);
      }
    } catch {
      setResult({ type: "error", message: "Network error" });
      if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
    }

    setScanning(false);
    setBarcode("");
    setQuantity(1);
    if (!manualMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [manualMode, quantity]);

  const handleBarcodeChange = (value: string) => {
    setBarcode(value);
    if (scanTimerRef.current) clearTimeout(scanTimerRef.current);

    const now = Date.now();
    const gap = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    if (gap < 50 && value.length >= 6) {
      keyBufferRef.current = value;
      scanTimerRef.current = setTimeout(() => {
        if (keyBufferRef.current === value) {
          handleScan(value);
        }
      }, 200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && barcode) {
      if (scanTimerRef.current) clearTimeout(scanTimerRef.current);
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
          @media print {
            body { margin: 0; padding: 0; }
            @page { size: 2in 1in; margin: 2mm; }
          }
          body {
            font-family: 'Courier New', monospace;
            width: 2in;
            margin: 0 auto;
            padding: 3mm;
            color: #000;
            font-size: 8px;
            line-height: 1.2;
          }
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
        <div class="line"></div>
        <table>
          <tr><td class="bold">Date</td><td class="val">${dateStr}</td></tr>
          <tr><td class="bold">Time</td><td class="val">${timeStr}</td></tr>
        </table>
        <div class="line"></div>
        <table>
          <tr><td class="bold">Item</td><td class="val">${p.name}</td></tr>
          <tr><td class="bold">Barcode</td><td class="val">${p.barcode}</td></tr>
          <tr><td class="bold">Size/Color</td><td class="val">${p.size} / ${p.color}</td></tr>
        </table>
        <div class="line"></div>
        <table>
          <tr><td class="bold">Type</td><td class="val">STOCK ${sType}</td></tr>
          <tr><td class="bold">Qty</td><td class="val">${qty}</td></tr>
          <tr><td class="bold">Price</td><td class="val">Rs. ${(p.price || 0).toFixed(2)}</td></tr>
          <tr><td class="bold" style="font-size:9px;">Total</td><td class="val" style="font-size:9px;font-weight:bold;">Rs. ${((p.price || 0) * qty).toFixed(2)}</td></tr>
        </table>
        <div class="line"></div>
        <div class="center footer">
          ${scannedBy || "N/A"}
        </div>
        <script>window.onload = function(){ window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getPopupConfig = (type: ScanResult["type"]) => {
    switch (type) {
      case "not_found":
        return {
          bg: "bg-red-500",
          border: "border-red-600",
          shadow: "shadow-red-500/40",
          icon: <SearchX className="w-16 h-16 text-white" />,
          title: "Barcode Not Found",
          titleColor: "text-white",
          msgColor: "text-red-100",
        };
      case "out_of_stock":
        return {
          bg: "bg-amber-500",
          border: "border-amber-600",
          shadow: "shadow-amber-500/40",
          icon: <AlertTriangle className="w-16 h-16 text-white" />,
          title: "Out of Stock",
          titleColor: "text-white",
          msgColor: "text-amber-100",
        };
      case "error":
        return {
          bg: "bg-red-600",
          border: "border-red-700",
          shadow: "shadow-red-600/40",
          icon: <XCircle className="w-16 h-16 text-white" />,
          title: "Error",
          titleColor: "text-white",
          msgColor: "text-red-100",
        };
      default:
        return {
          bg: "bg-emerald-500",
          border: "border-emerald-600",
          shadow: "shadow-emerald-500/40",
          icon: <CheckCircle className="w-16 h-16 text-white" />,
          title: "Sale Completed",
          titleColor: "text-white",
          msgColor: "text-emerald-100",
        };
    }
  };

  const isErrorPopup = result && (result.type === "not_found" || result.type === "out_of_stock" || result.type === "error");
  const config = result ? getPopupConfig(result.type) : null;

  return (
    <AuthGuard allowedRoles={["admin", "sales"]}>
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
              <p className="text-muted mt-1.5 text-sm sm:text-base">Scan a barcode to process stock OUT (sale)</p>
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
                  <div className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <ArrowDown className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-semibold text-red-500">Stock OUT (Sale)</span>
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
                      onChange={(e) => handleBarcodeChange(e.target.value)}
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
                    className="w-full py-4 text-white font-semibold rounded-2xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] text-base bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/25 hover:shadow-red-500/30"
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
                      "Process Sale"
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

              {/* Success result card */}
              <AnimatePresence mode="wait">
                {result && result.type === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="glass card-glow rounded-3xl border border-emerald-500/20 p-6 sm:p-7"
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-emerald-500/10 text-emerald-500">
                        <CheckCircle className="w-7 h-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base text-emerald-600">{result.message}</p>
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
                              <p className="text-xs font-semibold mt-1.5 text-red-500">
                                Stock OUT x {result.stockQty}
                              </p>
                            )}
                            {result.product.price > 0 && (
                              <p className="text-sm font-bold text-foreground mt-1">
                                Total: Rs. {(result.product.price * (result.stockQty || 1)).toFixed(2)}
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
                      {result.product && (
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

          {/* Error / Not Found / Out of Stock popup overlay */}
          <AnimatePresence>
            {isErrorPopup && config && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={() => setResult(null)}
              >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.5, opacity: 0, y: 30 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className={`relative ${config.bg} ${config.border} border-2 rounded-3xl p-8 sm:p-10 shadow-2xl ${config.shadow} max-w-sm w-full text-center`}
                >
                  <div className="mb-4">{config.icon}</div>
                  <h2 className={`text-2xl font-bold ${config.titleColor} font-[family-name:var(--font-poppins)] mb-2`}>
                    {config.title}
                  </h2>
                  <p className={`${config.msgColor} text-sm mb-1`}>{result.message}</p>
                  {result.product && result.type === "out_of_stock" && (
                    <p className="text-amber-100 text-xs mt-2">
                      Available: {result.product.stock} units
                    </p>
                  )}
                  {result.product && result.type === "not_found" && (
                    <p className="text-red-200 text-xs mt-2 font-mono">
                      Barcode: {barcode || "N/A"}
                    </p>
                  )}
                  <button
                    onClick={() => setResult(null)}
                    className="mt-6 px-8 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-colors text-sm"
                  >
                    OK
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </AuthGuard>
  );
}

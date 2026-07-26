"use client";

import { useEffect, useState, useCallback } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { History, ArrowDown, ArrowUp, Search, Printer, X, PackageSearch, FileText } from "lucide-react";

interface HistoryEntry {
  id: number;
  product_id: number;
  product_name: string;
  barcode: string;
  size: string;
  color: string;
  type: string;
  quantity: number;
  note: string;
  created_at: string;
  price?: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchBarcode, setSearchBarcode] = useState("");
  const [searchResult, setSearchResult] = useState<HistoryEntry[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    fetch("/api/stock/history?limit=200")
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.history || []);
        setLoading(false);
      });
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchBarcode.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/stock/history?barcode=${encodeURIComponent(searchBarcode.trim())}`);
      const data = await res.json();
      setSearchResult(data.history || []);
    } catch {
      setSearchResult([]);
    }
    setSearching(false);
  }, [searchBarcode]);

  const clearSearch = () => {
    setSearchBarcode("");
    setSearchResult(null);
  };

  const displayHistory = searchResult !== null ? searchResult : history;

  const handlePrint = (entry: HistoryEntry) => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "2-digit" });
    const timeStr = now.toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stock Slip</title>
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
          .type-box { text-align: center; font-size: 14px; font-weight: bold; padding: 4px 0; margin: 6px 0; border: 2px solid #000; }
          .footer { margin-top: 10px; font-size: 11px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="center bold large">T-SHIRT STOCK</div>
        <div class="center" style="font-size:11px;color:#666;">Inventory Management</div>
        <div class="line"></div>
        <div class="type-box">${entry.type === "IN" ? "STOCK IN" : "STOCK OUT"}</div>
        <div class="line"></div>
        <table>
          <tr><td class="bold">Date</td><td class="val">${dateStr}</td></tr>
          <tr><td class="bold">Time</td><td class="val">${timeStr}</td></tr>
        </table>
        <div class="line"></div>
        <div class="bold" style="font-size:14px;margin-bottom:6px;">PRODUCT DETAILS</div>
        <table>
          <tr><td class="bold">Name</td><td class="val">${entry.product_name}</td></tr>
          <tr><td class="bold">Barcode</td><td class="val">${entry.barcode}</td></tr>
          <tr><td class="bold">Size</td><td class="val">${entry.size}</td></tr>
          <tr><td class="bold">Color</td><td class="val">${entry.color}</td></tr>
          ${entry.price != null ? `<tr><td class="bold">Price</td><td class="val">Rs. ${Number(entry.price).toFixed(2)}</td></tr>` : ""}
        </table>
        <div class="line"></div>
        <table>
          <tr><td class="bold">Type</td><td class="val">${entry.type}</td></tr>
          <tr><td class="bold">Quantity</td><td class="val">${entry.quantity}</td></tr>
        </table>
        ${entry.note ? `<div class="line"></div><div style="font-size:12px;"><span class="bold">Note:</span> ${entry.note}</div>` : ""}
        <div class="line"></div>
        <div class="center footer">
          Slip #${entry.id} | ${entry.type === "IN" ? "Received" : "Issued"}
        </div>
        <script>window.onload = function(){ window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getSizeColor = (size: string) => {
    switch (size) {
      case "S": return "bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20";
      case "M": return "bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20";
      case "L": return "bg-pink-500/10 text-pink-600 ring-1 ring-pink-500/20";
      default: return "bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20";
    }
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-500/5 to-purple-500/5 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 blur-3xl" />

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 relative">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <History className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-[family-name:var(--font-poppins)]">Stock History</h1>
            </div>
            <p className="text-muted ml-[52px]">
              {searchResult !== null
                ? `${displayHistory.length} result${displayHistory.length !== 1 ? "s" : ""} found`
                : `${history.length} record${history.length !== 1 ? "s" : ""} total`}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`relative mb-8 rounded-2xl p-[1px] transition-all duration-300 ${
              searchFocused
                ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-pulse-glow"
                : "bg-transparent"
            }`}
          >
            <div className="bg-card rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchBarcode}
                    onChange={(e) => setSearchBarcode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Scan or enter barcode..."
                    className="w-full pl-4 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800/80 border border-border rounded-xl text-sm font-mono focus:ring-0 outline-none transition-all placeholder:text-muted/60"
                  />
                  {searchResult !== null && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-muted hover:text-foreground hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchBarcode.trim() || searching}
                  className="px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 active:scale-[0.97] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-indigo-500/25 flex-shrink-0"
                >
                  {searching ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Search"
                  )}
                </button>
              </div>
              <AnimatePresence>
                {searchResult !== null && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      <span className="text-xs text-muted">Barcode:</span>
                      <span className="font-mono text-xs font-semibold text-foreground bg-indigo-500/10 px-2 py-0.5 rounded-md">
                        {searchBarcode}
                      </span>
                      {displayHistory.length === 0 && (
                        <span className="text-xs text-red-500 ml-1">No records found</span>
                      )}
                      <button
                        onClick={clearSearch}
                        className="ml-auto text-xs text-indigo-500 hover:text-indigo-600 font-medium transition-colors"
                      >
                        Clear search
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-purple-500/40 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              </div>
              <p className="text-sm text-muted animate-pulse">Loading history...</p>
            </div>
          ) : displayHistory.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24"
            >
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center">
                  <PackageSearch className="w-12 h-12 text-indigo-400/60" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
                  <FileText className="w-5 h-5 text-muted/40" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-poppins)] mb-1">
                {searchResult !== null ? "No matching records" : "No history yet"}
              </h3>
              <p className="text-sm text-muted max-w-xs text-center leading-relaxed">
                {searchResult !== null
                  ? `No stock entries found for barcode "${searchBarcode}". Try a different barcode.`
                  : "Stock movements will appear here once you start recording inventory changes."}
              </p>
              {searchResult !== null && (
                <button
                  onClick={clearSearch}
                  className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-500/10 rounded-xl hover:bg-indigo-500/20 transition-colors"
                >
                  Clear search
                </button>
              )}
            </motion.div>
          ) : (
            <div className="space-y-2.5">
              {displayHistory.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015, duration: 0.3 }}
                  className="group bg-card rounded-2xl border border-border p-4 card-glow hover:border-indigo-500/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${
                      entry.type === "IN"
                        ? "bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 text-emerald-600 ring-1 ring-emerald-500/10"
                        : "bg-gradient-to-br from-red-500/15 to-red-500/5 text-red-600 ring-1 ring-red-500/10"
                    }`}>
                      {entry.type === "IN" ? <ArrowDown className="w-5 h-5" strokeWidth={2.5} /> : <ArrowUp className="w-5 h-5" strokeWidth={2.5} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{entry.product_name}</p>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${getSizeColor(entry.size)}`}>{entry.size}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          entry.type === "IN" ? "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/10" : "bg-red-500/10 text-red-600 ring-1 ring-red-500/10"
                        }`}>{entry.type}</span>
                      </div>
                      <p className="text-xs text-muted mt-1 truncate">
                        <span className="font-mono">{entry.barcode}</span>
                        {entry.note && <span className="ml-1.5">&middot; {entry.note}</span>}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className={`text-xl font-bold tabular-nums ${
                        entry.type === "IN" ? "text-emerald-600" : "text-red-600"
                      }`}>
                        {entry.type === "IN" ? "+" : "-"}{entry.quantity}
                      </p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {new Date(entry.created_at).toLocaleDateString()} &middot; {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <div className="sm:hidden text-right">
                        <p className={`text-base font-bold tabular-nums ${
                          entry.type === "IN" ? "text-emerald-600" : "text-red-600"
                        }`}>
                          {entry.type === "IN" ? "+" : "-"}{entry.quantity}
                        </p>
                        <p className="text-[10px] text-muted">
                          {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePrint(entry)}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center flex-shrink-0 hover:from-indigo-600 hover:to-purple-700 active:scale-90 transition-all duration-200 shadow-md shadow-indigo-500/20"
                        title="Print slip"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

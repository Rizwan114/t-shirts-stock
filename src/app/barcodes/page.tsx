"use client";

import { useState, useEffect, useRef } from "react";
import AuthGuard from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import JsBarcode from "jsbarcode";
import {
  Barcode,
  Printer,
  RefreshCw,
  Tag,
  Plus,
  Minus,
  Ruler,
  Check,
  Sparkles,
  Save,
  PackagePlus,
  Palette,
  Boxes,
  IndianRupee,
  Shirt,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

interface SizeOption {
  id: number;
  name: string;
}

const SIZE_STEP = 0.25;
const MIN_SIZE = 0.5;
const MAX_SIZE = 4;

const SIZE_PRESETS = [
  { w: 1, h: 2, label: "1 × 2" },
  { w: 1, h: 1, label: "1 × 1" },
  { w: 2, h: 1, label: "2 × 1" },
  { w: 2, h: 2, label: "2 × 2" },
  { w: 2, h: 3, label: "2 × 3" },
];

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const round1 = (v: number) => Math.round(v * 10) / 10;

const cleanName = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();

const generateBarcodeCode = (value: string) => {
  const cleaned = cleanName(value);
  const prefix = (cleaned.slice(0, 4) || "TSH").padEnd(4, "X");
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${num}`;
};

export default function BarcodesPage() {
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [manualEdited, setManualEdited] = useState(false);
  const [barcodeImg, setBarcodeImg] = useState<{ src: string; width: number; height: number } | null>(null);
  const [sizeW, setSizeW] = useState(1);
  const [sizeH, setSizeH] = useState(2);
  const [printed, setPrinted] = useState(false);
  const printTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [printStatus, setPrintStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [sizes, setSizes] = useState<SizeOption[]>([]);
  const [size, setSize] = useState("");
  const [customSizeMode, setCustomSizeMode] = useState(false);
  const [customSize, setCustomSize] = useState("");
  const [color, setColor] = useState("White");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saveOpen, setSaveOpen] = useState(true);

  useEffect(() => {
    if (manualEdited) return;
    setBarcode(generateBarcodeCode(name));
  }, [name, manualEdited]);

  useEffect(() => {
    fetch("/api/sizes")
      .then((res) => res.json())
      .then((data) => {
        const s = data.sizes || [];
        setSizes(s);
        if (s.length > 0) setSize(s[0].name);
      });
  }, []);

  const renderBarcode = (value: string, pxW: number, pxH: number) => {
    const canvas = document.createElement("canvas");
    const targetH = Math.round(clamp(pxH * 0.28, 24, 90));
    const targetW = Math.max(Math.round(pxW * 0.94), 60);
    const maxFontByWidth = Math.floor((targetW - 10) / (Math.max(value.length, 6) * 0.6));
    const fontSize = Math.round(clamp(targetH * 0.25, 10, Math.max(maxFontByWidth, 10)));
    const maxW = targetW;
    const barWidths = [2.2, 1.8, 1.5, 1.2, 1, 0.8, 0.6, 0.5];

    for (const barW of barWidths) {
      JsBarcode(canvas, value, {
        format: "CODE128",
        lineColor: "#000000",
        background: "#ffffff",
        width: barW,
        height: targetH,
        displayValue: true,
        fontSize,
        font: "monospace",
        textMargin: Math.round(fontSize * 0.2),
        margin: 2,
      });
      if (canvas.width <= maxW) break;
    }
    return { src: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height };
  };

  useEffect(() => {
    if (!barcode.trim()) {
      setBarcodeImg(null);
      return;
    }
    const pxW = Math.round(sizeW * 96);
    const pxH = Math.round(sizeH * 96);
    setBarcodeImg(renderBarcode(barcode.trim(), pxW, pxH));
  }, [barcode, sizeW, sizeH]);

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const finalSize = customSizeMode ? customSize.trim().toUpperCase() : size;

  const autoSaveProduct = async (): Promise<"saved" | "exists" | "skipped" | "error"> => {
    if (!name.trim() || !barcode.trim() || !finalSize) return "skipped";
    try {
      const checkRes = await fetch(`/api/products/search?q=${encodeURIComponent(barcode.trim())}`);
      const checkData = await checkRes.json();
      if ((checkData.products || []).some((p: { barcode?: string }) => p.barcode === barcode.trim())) {
        return "exists";
      }
    } catch {
      // fall through and attempt the save anyway
    }
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          barcode: barcode.trim(),
          size: finalSize,
          color: color.trim() || "White",
          stock: parseInt(stock) || 0,
          price: parseFloat(price) || 0,
        }),
      });
      if (res.ok) return "saved";
      const data = await res.json();
      if (data.error && data.error.includes("already exists")) return "exists";
      return "error";
    } catch {
      return "error";
    }
  };

  const saveProduct = async () => {
    setSaveMsg(null);
    if (!name.trim()) {
      setSaveMsg({ type: "error", text: "Please enter a product name first." });
      return;
    }
    if (!barcode.trim()) {
      setSaveMsg({ type: "error", text: "Please enter a barcode first." });
      return;
    }
    if (!finalSize) {
      setSaveMsg({ type: "error", text: "Please select a size." });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          barcode: barcode.trim(),
          size: finalSize,
          color: color.trim() || "White",
          stock: parseInt(stock) || 0,
          price: parseFloat(price) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveMsg({
          type: "success",
          text: `"${data.product.name}" (${data.product.barcode}) saved to stock. Now scan it on the Scan page — the receipt will print automatically.`,
        });
      } else {
        setSaveMsg({ type: "error", text: data.error || "Failed to save product." });
      }
    } catch {
      setSaveMsg({ type: "error", text: "Network error — could not save product." });
    }
    setSaving(false);
  };

  const printLabel = async () => {
    if (!barcode.trim() || !barcodeImg) return;

    const labelName = name.trim() || "PRODUCT";
    const pxW = Math.max(Math.round(sizeW * 96), 96);
    const pxH = Math.max(Math.round(sizeH * 96), 96);
    const f = clamp(pxH / 192, 0.6, 1.1);
    const pad = Math.max(3, Math.round(4 * f));
    const brandFs = Math.max(5, Math.min(Math.round(8 * f), Math.floor((pxW - pad * 2) / 16)));
    const brandLs = Math.min(1.5, Math.max(0.3, (pxW - pad * 2 - 13 * brandFs) / 12));
    const nameFs = Math.max(10, Math.round(14 * f));
    const nameGap = Math.max(1, Math.round(2 * f));
    const barGap = Math.max(2, Math.round(3 * f));
    const imgMaxW = pxW - pad * 2;
    const imgMaxH = Math.round(pxH * 0.7);
    const nameMaxH = Math.round(nameFs * 2 * 1.2);

    const printWindow = window.open("", "_blank", "width=600,height=600");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Barcode Label</title>
        <style>
          @media print {
            @page { size: ${sizeW}in ${sizeH}in; margin: 0; }
            body { margin: 0; }
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            width: ${pxW}px;
            height: ${pxH}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
            color: #000000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .label {
            width: ${pxW}px;
            height: ${pxH}px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: ${pad}px;
            overflow: hidden;
          }
          .brand {
            font-size: ${brandFs}px;
            font-weight: bold;
            letter-spacing: ${brandLs}px;
            white-space: nowrap;
          }
          .name {
            font-size: ${nameFs}px;
            font-weight: bold;
            line-height: 1.2;
            margin-top: ${nameGap}px;
            max-height: ${nameMaxH}px;
            overflow: hidden;
            width: 100%;
          }
          .barcode {
            margin-top: ${barGap}px;
            width: 100%;
            display: flex;
            justify-content: center;
          }
          .barcode img {
            max-width: ${imgMaxW}px;
            max-height: ${imgMaxH}px;
            width: auto;
            height: auto;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="brand">T-SHIRT STOCK</div>
          <div class="name">${escapeHtml(labelName)}</div>
          <div class="barcode"><img src="${barcodeImg.src}" alt="barcode" /></div>
        </div>
        <script>window.onload = function(){ window.print(); window.close(); }; <\/script>
      </body>
      </html>
    `);
    printWindow.document.close();

    setPrinted(true);
    if (printTimeout.current) clearTimeout(printTimeout.current);
    printTimeout.current = setTimeout(() => setPrinted(false), 2500);

    setPrintStatus(null);
    const status = await autoSaveProduct();
    if (status === "saved") {
      setPrintStatus({
        type: "success",
        text: "Auto-saved to stock — this barcode can now be scanned at POS.",
      });
    } else if (status === "exists") {
      setPrintStatus({
        type: "success",
        text: "Product already registered — this barcode is ready to scan.",
      });
    } else if (status === "error") {
      setPrintStatus({
        type: "error",
        text: "Printing done, but auto-save failed. Use 'Save Product to Stock' manually.",
      });
    }
  };

  const changeSize = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number
  ) => {
    setter((prev) => round1(clamp(prev + delta, MIN_SIZE, MAX_SIZE)));
  };

  const previewMaxH = 360;
  const previewScale = previewMaxH / (sizeH * 96);
  const previewW = Math.max(160, Math.round(sizeW * 96 * previewScale));
  const previewH = Math.round(sizeH * 96 * previewScale);
  const previewImgMaxW = previewW - 14;

  return (
    <AuthGuard allowedRoles={["admin", "stock_manager"]}>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 relative overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-3 mb-1">
                <motion.div
                  whileHover={{ rotate: -6, scale: 1.05 }}
                  className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20"
                >
                  <Barcode className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-[family-name:var(--font-poppins)]">
                    Barcode Generator
                  </h1>
                  <p className="text-muted text-sm">
                    Barcode updates live as you type
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="glass card-glow rounded-3xl border border-border/60 p-6 sm:p-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
                    Product Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Tag className="w-4 h-4 text-muted/60" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Classic Cotton T-Shirt"
                      className="w-full pl-10 pr-4 py-4 bg-white/80 dark:bg-slate-800/80 border-2 border-border rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-0 transition-all duration-300 placeholder:text-muted/60"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
                    Barcode
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Barcode className="w-4 h-4 text-muted/60" />
                    </div>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => {
                        setBarcode(e.target.value.toUpperCase());
                        setManualEdited(true);
                      }}
                      placeholder="Type a name to generate"
                      className="w-full pl-10 pr-16 py-4 bg-white/80 dark:bg-slate-800/80 border-2 border-border rounded-2xl text-sm font-mono focus:outline-none focus:border-indigo-500 focus:ring-0 transition-all duration-300 placeholder:text-muted/60"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setManualEdited(false);
                        setBarcode(generateBarcodeCode(name));
                      }}
                      title="Re-sync barcode with product name"
                      className="absolute inset-y-0 right-0 flex items-center px-3.5 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-r-2xl transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted mt-1.5 ml-1">
                    {manualEdited
                      ? "Custom value — tap refresh to re-sync with name"
                      : "Auto code: name prefix + numbers"}
                  </p>
                </div>
              </div>

              <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/[0.04] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setSaveOpen(!saveOpen)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-emerald-500/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                      <PackagePlus className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm text-foreground font-[family-name:var(--font-poppins)]">
                        Register Product for Scanning
                      </p>
                      <p className="text-[11px] text-muted">
                        Auto-saves when you press Print — product becomes scannable at POS
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted transition-transform duration-300 ${
                      saveOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {saveOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-4 border-t border-emerald-500/10">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                          <div>
                            <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
                              Size *
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Shirt className="w-4 h-4 text-muted/60" />
                              </div>
                              <select
                                value={customSizeMode ? "__custom__" : size}
                                onChange={(e) => {
                                  if (e.target.value === "__custom__") {
                                    setCustomSizeMode(true);
                                    setCustomSize("");
                                  } else {
                                    setCustomSizeMode(false);
                                    setSize(e.target.value);
                                  }
                                }}
                                className="w-full pl-9 pr-3 py-2.5 bg-white/80 dark:bg-slate-800/80 border-2 border-border rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                              >
                                {sizes.map((s) => (
                                  <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                                <option value="__custom__">Custom...</option>
                              </select>
                            </div>
                            {customSizeMode && (
                              <motion.input
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                type="text"
                                value={customSize}
                                onChange={(e) => setCustomSize(e.target.value)}
                                placeholder="e.g., 6XL"
                                className="mt-2 w-full px-3 py-2.5 bg-white/80 dark:bg-slate-800/80 border-2 border-dashed border-indigo-500/40 rounded-xl text-sm font-semibold focus:outline-none focus:border-indigo-500 transition-all text-center"
                              />
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
                              Color
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Palette className="w-4 h-4 text-muted/60" />
                              </div>
                              <input
                                type="text"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                placeholder="e.g., White"
                                className="w-full pl-9 pr-3 py-2.5 bg-white/80 dark:bg-slate-800/80 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-muted/60"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
                              Price (Rs.)
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <IndianRupee className="w-4 h-4 text-muted/60" />
                              </div>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="e.g., 500"
                                className="w-full pl-9 pr-3 py-2.5 bg-white/80 dark:bg-slate-800/80 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-muted/60"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-muted mb-2 uppercase tracking-wider">
                              Stock
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Boxes className="w-4 h-4 text-muted/60" />
                              </div>
                              <input
                                type="number"
                                min="0"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                placeholder="e.g., 50"
                                className="w-full pl-9 pr-3 py-2.5 bg-white/80 dark:bg-slate-800/80 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-muted/60"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <motion.button
                            type="button"
                            onClick={saveProduct}
                            disabled={saving}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="flex-1 py-3.5 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25 hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
                          >
                            {saving ? (
                              <>
                                <svg className="animate-spin h-4.5 w-4.5" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4.5 h-4.5" />
                                Save Product to Stock
                              </>
                            )}
                          </motion.button>
                          {barcode.trim() && (
                            <p className="text-[11px] text-muted text-center sm:text-right sm:max-w-[220px]">
                              This barcode will be registered:{" "}
                              <span className="font-mono font-semibold text-foreground">{barcode.trim()}</span>
                            </p>
                          )}
                        </div>

                        <AnimatePresence>
                          {saveMsg && (
                            <motion.div
                              initial={{ opacity: 0, y: -6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -6 }}
                              className={`mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium ${
                                saveMsg.type === "success"
                                  ? "bg-emerald-100/70 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                              }`}
                            >
                              {saveMsg.type === "success" ? (
                                <Check className="w-4.5 h-4.5 mt-0.5 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="w-4.5 h-4.5 mt-0.5 flex-shrink-0" />
                              )}
                              <span>{saveMsg.text}</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-muted uppercase tracking-wider">
                    <Ruler className="w-4 h-4" />
                    Sticker Size
                  </label>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {sizeW} × {sizeH} in
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {SIZE_PRESETS.map((p) => {
                    const active = p.w === sizeW && p.h === sizeH;
                    return (
                      <motion.button
                        key={`${p.w}x${p.h}`}
                        type="button"
                        onClick={() => {
                          setSizeW(p.w);
                          setSizeH(p.h);
                        }}
                        whileTap={{ scale: 0.94 }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all duration-300 ${
                          active
                            ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-lg shadow-indigo-500/25"
                            : "bg-white/60 dark:bg-slate-800/60 border-border text-muted hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-300"
                        }`}
                      >
                        {p.label} in
                        {active && <Check className="inline w-3.5 h-3.5 ml-1 -mt-0.5" />}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(
                    [
                      { label: "Width", value: sizeW, setter: setSizeW },
                      { label: "Height", value: sizeH, setter: setSizeH },
                    ] as const
                  ).map(({ label, value, setter }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 bg-white/60 dark:bg-slate-800/60 border border-border rounded-2xl px-3 py-2.5"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.85 }}
                          onClick={() => changeSize(setter, -SIZE_STEP)}
                          disabled={value <= MIN_SIZE}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-500/20 transition-colors disabled:opacity-40"
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        <span className="w-14 text-center text-sm font-bold font-mono">
                          {value}
                        </span>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.85 }}
                          onClick={() => changeSize(setter, SIZE_STEP)}
                          disabled={value >= MAX_SIZE}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-500/20 transition-colors disabled:opacity-40"
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative flex items-center justify-center bg-slate-100/70 dark:bg-slate-800/40 rounded-2xl border border-border/50 p-6 mb-6">
                <AnimatePresence mode="wait">
                  {barcode.trim() && barcodeImg ? (
                    <motion.div
                      key={`${barcode}-${sizeW}-${sizeH}`}
                      initial={{ opacity: 0, scale: 0.9, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      style={{ width: previewW, height: previewH }}
                      className="bg-white text-black rounded-md shadow-xl border border-slate-300 flex flex-col items-center justify-center text-center overflow-hidden px-2"
                    >
                      <p className="font-bold text-[9px] tracking-widest">T-SHIRT STOCK</p>
                      <p className="font-bold text-[12px] leading-tight mt-1 max-w-full break-words">
                        {name.trim() || barcode}
                      </p>
                      <img
                        src={barcodeImg.src}
                        alt="barcode"
                        className="mt-2 h-auto"
                        style={{ width: Math.min(barcodeImg.width * previewScale, previewImgMaxW), maxWidth: previewImgMaxW }}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-8"
                    >
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      >
                        <Barcode className="w-10 h-10 text-muted/30 mx-auto mb-3" />
                      </motion.div>
                      <p className="text-sm text-muted">
                        Start typing a name to see your barcode live
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {barcode.trim() && barcodeImg && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="relative flex w-2 h-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                      <span className="relative inline-flex rounded-full w-2 h-2 bg-emerald-500" />
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted mb-3 px-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Prints at exactly {sizeW} × {sizeH} inch — set your printer paper to the same size for best results.
              </div>

              <motion.button
                onClick={printLabel}
                disabled={!barcode.trim() || !barcodeImg}
                whileHover={barcode.trim() ? { scale: 1.01 } : {}}
                whileTap={barcode.trim() ? { scale: 0.99 } : {}}
                className="w-full py-4 text-white font-semibold rounded-2xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-base bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-indigo-500/25 hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                {printed ? (
                  <>
                    <Check className="w-5 h-5" />
                    Sent to Printer
                  </>
                ) : (
                  <>
                    <Printer className="w-5 h-5" />
                    Print Sticker ({sizeW} × {sizeH} inch)
                  </>
                )}
              </motion.button>

              <AnimatePresence>
                {printStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className={`mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium ${
                      printStatus.type === "success"
                        ? "bg-emerald-100/70 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    }`}
                  >
                    {printStatus.type === "success" ? (
                      <Check className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>{printStatus.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

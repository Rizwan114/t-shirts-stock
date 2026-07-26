"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ScanBarcode,
  Package,
  History,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shirt,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/scan", label: "Scan Barcode", icon: ScanBarcode },
  { href: "/stock/small", label: "Small (S)", icon: Shirt },
  { href: "/stock/medium", label: "Medium (M)", icon: Shirt },
  { href: "/stock/large", label: "Large (L)", icon: Shirt },
  { href: "/products", label: "All Products", icon: Package },
  { href: "/products/add", label: "Add Product", icon: Package },
  { href: "/history", label: "History", icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 relative overflow-hidden">
          <div className="absolute inset-0 animate-shimmer" />
          <Shirt className="w-5 h-5 text-white relative z-10" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="overflow-hidden"
          >
            <h1 className="text-white font-bold text-lg font-[family-name:var(--font-poppins)] leading-tight">
              StockPro
            </h1>
            <p className="text-slate-500 text-[10px] font-medium tracking-wider uppercase">Inventory</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group overflow-hidden ${
                isActive
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {isActive && <div className="absolute inset-0 animate-shimmer" />}
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 relative z-10 ${isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400 transition-colors"}`} />
              {!collapsed && (
                <>
                  <span className="flex-1 relative z-10">{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 relative z-10 opacity-70" />}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/[0.06]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200 w-full group"
        >
          <LogOut className="w-[18px] h-[18px] group-hover:rotate-180 transition-transform duration-300" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-slate-900/90 backdrop-blur-sm rounded-2xl text-white shadow-xl border border-white/10"
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-full w-[260px] bg-slate-900 z-50 shadow-2xl"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <aside
        className={`hidden lg:block h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50 transition-all duration-300 flex-shrink-0 ${
          collapsed ? "w-[72px]" : "w-[260px]"
        }`}
      >
        <NavContent />
      </aside>
    </>
  );
}

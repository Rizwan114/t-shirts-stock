"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  User,
  Ruler,
} from "lucide-react";

interface SizeItem {
  id: number;
  name: string;
}

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "stock_manager", "sales"] },
  { href: "/scan", label: "Scan Barcode", icon: ScanBarcode, roles: ["admin", "sales"] },
  { href: "/sizes", label: "Manage Sizes", icon: Ruler, roles: ["admin", "stock_manager"] },
  { href: "/products", label: "All Products", icon: Package, roles: ["admin", "stock_manager", "sales"] },
  { href: "/products/add", label: "Add Product", icon: Package, roles: ["admin", "stock_manager"] },
  { href: "/history", label: "History", icon: History, roles: ["admin", "stock_manager", "sales"] },
];

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  stock_manager: "Stock Manager",
  sales: "Sales Person",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [sizes, setSizes] = useState<SizeItem[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setUserRole(data.user?.role || data.role || ""));
    fetch("/api/sizes")
      .then((res) => res.json())
      .then((data) => setSizes(data.sizes || []));
  }, []);

  const sizeNavItems = sizes.map((s) => ({
    href: `/stock/${s.name.toLowerCase()}`,
    label: s.name,
    icon: Shirt,
    roles: ["admin", "stock_manager"],
  }));

  const allItems = [...baseNavItems.slice(0, 2), ...sizeNavItems, ...baseNavItems.slice(2)];
  const navItems = allItems.filter((item) => item.roles.includes(userRole));

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

      {!collapsed && userRole && (
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] rounded-xl">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              userRole === "admin"
                ? "bg-amber-500/20 text-amber-400"
                : userRole === "stock_manager"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-emerald-500/20 text-emerald-400"
            }`}>
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{roleLabels[userRole] || userRole}</p>
            </div>
          </div>
        </div>
      )}

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

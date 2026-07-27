"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shirt,
  Eye,
  EyeOff,
  Loader2,
  User,
  Lock,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

function FloatingOrb({
  size,
  color,
  delay,
  duration,
  x,
  y,
}: {
  size: number;
  color: string;
  delay: number;
  duration: number;
  x: string;
  y: string;
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: x,
        top: y,
        background: color,
        filter: `blur(${size / 3}px)`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.6, 0.3, 0.6, 0],
        scale: [0.8, 1.2, 0.9, 1.1, 0.8],
        x: [0, 30, -20, 15, 0],
        y: [0, -40, 20, -30, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function GridLines() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-[0.04]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
    </div>
  );
}

function FloatingParticles() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 40 }).map((_, i) => {
        const size = Math.random() * 3 + 1;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background:
                i % 3 === 0
                  ? "rgba(99,102,241,0.6)"
                  : i % 3 === 1
                    ? "rgba(139,92,246,0.5)"
                    : "rgba(6,182,212,0.4)",
            }}
            initial={{ opacity: 0, y: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              y: [0, -(Math.random() * 200 + 100)],
              x: [0, (Math.random() - 0.5) * 100],
            }}
            transition={{
              duration: Math.random() * 8 + 6,
              delay: Math.random() * 10,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        );
      })}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050510] p-4 relative overflow-hidden">
      {/* Deep background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a2e] via-[#050510] to-[#0f0525]" />

      {/* Grid lines */}
      <GridLines />

      {/* Floating orbs */}
      <FloatingOrb
        size={500}
        color="radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)"
        delay={0}
        duration={20}
        x="10%"
        y="10%"
      />
      <FloatingOrb
        size={400}
        color="radial-gradient(circle, rgba(139,92,246,0.12), transparent 70%)"
        delay={2}
        duration={18}
        x="70%"
        y="60%"
      />
      <FloatingOrb
        size={350}
        color="radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)"
        delay={4}
        duration={22}
        x="50%"
        y="20%"
      />
      <FloatingOrb
        size={300}
        color="radial-gradient(circle, rgba(236,72,153,0.08), transparent 70%)"
        delay={1}
        duration={16}
        x="20%"
        y="70%"
      />

      {/* Floating particles */}
      {mounted && <FloatingParticles />}

      {/* Horizontal light streaks */}
      <motion.div
        className="absolute h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"
        style={{ width: "60%", left: "20%", top: "30%" }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: [0, 0.5, 0], scaleX: [0, 1, 0] }}
        transition={{ duration: 8, repeat: Infinity, delay: 3 }}
      />
      <motion.div
        className="absolute h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent"
        style={{ width: "40%", left: "30%", top: "65%" }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: [0, 0.4, 0], scaleX: [0, 1, 0] }}
        transition={{ duration: 10, repeat: Infinity, delay: 5 }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Outer glow ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -inset-3 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 rounded-[2.5rem] blur-2xl"
        />

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.1,
          }}
          className="relative rounded-[2rem] border border-white/[0.08] overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
          }}
        >
          {/* Card inner shimmer border */}
          <div className="absolute inset-0 rounded-[2rem] p-[1px] bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />

          {/* Top accent line */}
          <motion.div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-[1px] bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent"
            initial={{ width: 0 }}
            animate={{ width: "80%" }}
            transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
          />

          <div className="px-10 pt-12 pb-10">
            {/* Logo + Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-10"
            >
              {/* Animated logo container */}
              <div className="relative w-28 h-28 mx-auto mb-8">
                {/* Outer rotating ring */}
                <motion.div
                  className="absolute inset-[-4px] rounded-[2rem] border border-indigo-500/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="absolute inset-[-8px] rounded-[2.2rem] border border-dashed border-purple-500/10"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />

                {/* Glow behind logo */}
                <motion.div
                  className="absolute inset-0 rounded-[2rem]"
                  animate={{
                    boxShadow: [
                      "0 0 30px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1)",
                      "0 0 40px rgba(139,92,246,0.3), 0 0 80px rgba(139,92,246,0.1)",
                      "0 0 30px rgba(99,102,241,0.3), 0 0 60px rgba(99,102,241,0.1)",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Logo bg */}
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 shadow-lg shadow-indigo-500/30" />

                {/* Shimmer overlay */}
                <motion.div
                  className="absolute inset-0 rounded-[2rem]"
                  style={{
                    background:
                      "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
                    backgroundSize: "200% 100%",
                  }}
                  animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                  transition={{ duration: 3, repeat: Infinity, delay: 1, ease: "easeInOut" }}
                />

                {/* Icon */}
                <div className="relative w-full h-full rounded-[2rem] flex items-center justify-center">
                  <Shirt className="w-14 h-14 text-white drop-shadow-lg" />
                </div>
              </div>

              {/* Title */}
              <motion.h1
                className="text-[2.5rem] font-bold tracking-tight font-[family-name:var(--font-poppins)]"
                style={{
                  background: "linear-gradient(135deg, #ffffff 0%, #c7d2fe 50%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                StockPro
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="flex items-center justify-center gap-2 mt-3"
              >
                <Sparkles className="w-4 h-4 text-indigo-400/60" />
                <p className="text-slate-400 text-sm tracking-wide">
                  T-Shirts Inventory Management
                </p>
                <Sparkles className="w-4 h-4 text-indigo-400/60" />
              </motion.div>

              {/* Divider */}
              <motion.div
                className="mx-auto mt-6 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ width: 0 }}
                animate={{ width: "60%" }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700 blur-sm" />
                  <div className="relative flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden group-focus-within:border-indigo-500/30 transition-all duration-500">
                    <div className="pl-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-300">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-4 bg-transparent text-white text-sm placeholder-slate-600 focus:outline-none"
                      placeholder="Enter your username"
                      required
                    />
                    <motion.div
                      className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"
                      initial={{ width: "0%" }}
                      whileInView={{ width: "100%" }}
                      transition={{ duration: 0 }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                  </div>
                </div>
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-all duration-700 blur-sm" />
                  <div className="relative flex items-center bg-white/[0.04] border border-white/[0.08] rounded-xl overflow-hidden group-focus-within:border-indigo-500/30 transition-all duration-500">
                    <div className="pl-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors duration-300">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-4 bg-transparent text-white text-sm placeholder-slate-600 focus:outline-none"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="mr-3 p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-white/5 transition-all duration-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left" />
                  </div>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative w-full py-4 rounded-xl text-white font-semibold text-sm tracking-wide overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
                  style={{
                    background:
                      "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #4f46e5 100%)",
                    backgroundSize: "200% 200%",
                  }}
                >
                  {/* Button shimmer */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)",
                      backgroundSize: "200% 100%",
                    }}
                    animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </span>
                </motion.button>
              </motion.div>
            </form>

            {/* Footer hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mt-8 text-center"
            >
              <div className="inline-flex flex-col items-center gap-2 px-4 py-3 rounded-full bg-white/[0.03] border border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-slate-500 text-xs">
                    <span className="text-amber-400 font-medium">Admin</span>: admin / admin123
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span className="text-slate-500 text-xs">
                    <span className="text-blue-400 font-medium">Stock</span>: stock / stock123
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-500 text-xs">
                    <span className="text-emerald-400 font-medium">Sales</span>: sales / sales123
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

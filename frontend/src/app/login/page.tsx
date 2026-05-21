"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Loader2, ShieldCheck, TrendingUp, Package,
  Users, DollarSign, ArrowRight, CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const features = [
  { icon: Package, label: "Inventario", desc: "Control de stock real" },
  { icon: TrendingUp, label: "Ventas", desc: "POS y Facturaci\u00f3n" },
  { icon: Users, label: "RRHH", desc: "N\u00f3mina y Asistencia" },
  { icon: DollarSign, label: "Contabilidad", desc: "Portal Financiero" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesi\u00f3n");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (!mounted) return <div className="min-h-screen w-full bg-slate-950" />;

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-50 selection:bg-blue-500/30 font-sans">
      {/* Panel Izquierdo — Branding (40%) */}
      <div className="hidden lg:flex lg:w-[40%] relative bg-slate-900 border-r border-white/5 items-center justify-center overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/5 rounded-full blur-[120px]" />
          <div className="absolute inset-0 opacity-[0.03]" 
               style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '50px 50px' }} 
          />
        </div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative z-10 max-w-md px-12"
        >
          <motion.div variants={itemVariants} className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white uppercase tracking-widest">
                Stellar<span className="text-blue-400">ERP</span>
              </h1>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Business Suite v2.0</p>
            </div>
          </motion.div>

          <motion.h2 variants={itemVariants} className="text-4xl font-bold leading-tight text-white mb-6">
            Gestión sin<br />
            <span className="text-blue-400">interrupciones.</span>
          </motion.h2>
          
          <motion.p variants={itemVariants} className="text-slate-400 text-lg leading-relaxed mb-12 font-light">
            La plataforma integral para el control total de tu operación empresarial.
          </motion.p>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.label} className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
                <f.icon className="w-5 h-5 text-blue-400 mb-2" />
                <p className="text-white font-bold text-xs uppercase tracking-wider">{f.label}</p>
                <p className="text-slate-500 text-[10px] mt-1">{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Panel Derecho — Formulario (60%) */}
      <div className="flex-1 flex flex-col relative items-center justify-center p-6 lg:p-12 overflow-hidden">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-[420px] relative z-10"
        >
          <motion.div variants={itemVariants} className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-bold text-white tracking-tight">Bienvenido</h2>
            <p className="text-slate-500 mt-2 text-lg">Ingresa tus datos para continuar</p>
          </motion.div>

          <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Usuario</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario"
                className="h-14 bg-white/5 border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-2xl text-lg transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-14 bg-white/5 border-white/10 focus:border-blue-500/50 focus:ring-blue-500/20 rounded-2xl text-lg pr-12 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </motion.form>

          {/* Acceso Demo */}
          <motion.div variants={itemVariants} className="mt-12 pt-8 border-t border-white/5">
            <button
              type="button"
              onClick={() => { setUsername("admin"); setPassword("admin123"); setError(""); }}
              className="w-full flex items-center justify-between p-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Acceso Rápido</p>
                  <p className="text-sm font-bold text-white">Modo Demostración</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

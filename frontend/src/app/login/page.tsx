"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Eye, EyeOff, Loader2, ShieldCheck, TrendingUp, Package,
  Users, DollarSign, Database, Activity, HardDrive, Wifi,
  Clock, CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const features = [
  { icon: Package, label: "Inventario", desc: "Control de stock en tiempo real" },
  { icon: TrendingUp, label: "Ventas", desc: "POS y facturación electrónica" },
  { icon: Users, label: "RRHH", desc: "Nómina y asistencia" },
  { icon: DollarSign, label: "Contabilidad", desc: "Libros y reportes financieros" },
];

const systemStatus = [
  { icon: Database, label: "Base de datos", status: "Operacional", color: "text-emerald-500" },
  { icon: Activity, label: "API REST", status: "Operacional", color: "text-emerald-500" },
  { icon: HardDrive, label: "Almacenamiento", status: "45% usado", color: "text-amber-500" },
  { icon: Wifi, label: "Red local", status: "Conectado", color: "text-emerald-500" },
];

const appModules = [
  { name: "Inventario", color: "bg-blue-500" },
  { name: "POS Ventas", color: "bg-emerald-500" },
  { name: "Contabilidad", color: "bg-violet-500" },
  { name: "RRHH", color: "bg-rose-500" },
  { name: "Compras", color: "bg-amber-500" },
  { name: "Clientes", color: "bg-cyan-500" },
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
  const [editingDemoUser, setEditingDemoUser] = useState(false);
  const [demoUser, setDemoUser] = useState("admin");
  const [demoPass, setDemoPass] = useState("admin123");

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
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Brand Hero */}
      <div className="hidden lg:flex lg:w-[55%] relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 -right-20 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px),
                               linear-gradient(to bottom, #fff 1px, transparent 1px)`,
              backgroundSize: '48px 48px'
            }}
          />
        </div>

        <div className={cn(
          "relative z-10 max-w-xl px-12 transition-all duration-700",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-8 h-8 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Stellar<span className="text-blue-400">ERP</span>
              </h1>
              <p className="text-slate-400 text-sm">Gesti&oacute;n empresarial inteligente</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight text-white mb-4">
            Tu negocio en un<br />
            <span className="text-blue-400">solo lugar</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-12">
            Centraliza inventario, ventas, n&oacute;mina y contabilidad en una plataforma<br />
            todo-en-uno dise&ntilde;ada para empresas en crecimiento.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-start gap-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.label}</p>
                  <p className="text-slate-500 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form + System Dashboard */}
      <div className="flex-1 flex flex-col relative bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
        {/* Decorative bg elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 -right-24 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-violet-400/8 rounded-full blur-3xl animate-float-slower" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-500/3 to-indigo-500/3 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(circle at 24px 24px, currentColor 1px, transparent 1px)`,
              backgroundSize: '48px 48px'
            }}
          />
        </div>

        {/* Main content: fills entire right panel */}
        <div className={cn(
          "relative z-10 flex-1 flex flex-col lg:flex-row items-stretch transition-all duration-700",
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}>
          {/* Login Form Column */}
          <div className="flex-1 flex items-center justify-center p-6 lg:p-8 xl:p-10">
            <div className="w-full max-w-md lg:max-w-[500px]">
              {/* Mobile brand */}
              <div className="lg:hidden text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Stellar<span className="text-blue-600 dark:text-blue-400">ERP</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Gesti&oacute;n empresarial inteligente</p>
              </div>

              <div className="text-center lg:text-left mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full mb-4">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  Panel de administraci&oacute;n
                </div>
                <h2 className="text-3xl lg:text-[2.5rem] font-bold text-slate-900 dark:text-white leading-tight">
                  Bienvenido
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-base lg:text-lg">
                  Inicia sesi&oacute;n para acceder al sistema
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-shake">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-sm lg:text-base font-medium text-slate-700 dark:text-slate-300">
                    Usuario
                  </label>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    required
                    autoFocus
                    className="h-14 text-base lg:text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm lg:text-base font-medium text-slate-700 dark:text-slate-300">
                    Contrase&ntilde;a
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contrase&ntilde;a"
                      required
                      className="h-14 text-base lg:text-lg pr-14 lg:pr-16"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5 lg:w-6 lg:h-6" /> : <Eye className="w-5 h-5 lg:w-6 lg:h-6" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full h-14 text-base lg:text-lg font-semibold bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 dark:from-blue-600 dark:to-blue-500 dark:hover:from-blue-500 dark:hover:to-blue-400 text-white shadow-xl shadow-slate-900/20 dark:shadow-blue-600/20 hover:shadow-2xl hover:shadow-slate-900/30 dark:hover:shadow-blue-500/30 transition-all duration-300"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Iniciando sesi&oacute;n...
                    </>
                  ) : (
                    "Iniciar sesi&oacute;n"
                  )}
                </Button>

                <div className="pt-5 lg:pt-6 border-t border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                    Credenciales de demostraci&oacute;n
                  </p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <div className="flex items-center gap-2 font-mono text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-slate-700 dark:text-slate-300">{demoUser}</span>
                      <span className="text-slate-300 dark:text-slate-600">/</span>
                      <span className="text-slate-700 dark:text-slate-300">{demoPass}</span>
                      <button
                        type="button"
                        onClick={() => { setUsername(demoUser); setPassword(demoPass); setError(""); }}
                        className="ml-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Auto-completar"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              <div className="mt-8 lg:mt-10 pt-5 lg:pt-6 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-3 gap-4 text-center">
                <div className="group cursor-default">
                  <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">30+</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">M&oacute;dulos</p>
                </div>
                <div className="group cursor-default">
                  <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">100%</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">Offline</p>
                </div>
                <div className="group cursor-default">
                  <p className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white">24/7</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">Soporte</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Info Panel — fills remaining space */}
          <div className="hidden lg:flex w-[320px] xl:w-[380px] flex-col justify-between bg-white/40 dark:bg-white/5 border-l border-slate-200/50 dark:border-slate-800/50 p-6 xl:p-8">
            {/* System Status */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Estado del sistema
                  </h3>
                </div>
                <div className="space-y-2.5">
                  {systemStatus.map((s) => (
                    <div key={s.label} className="flex items-center justify-between bg-white dark:bg-white/5 rounded-lg px-3.5 py-2.5 border border-slate-100 dark:border-slate-800/60">
                      <div className="flex items-center gap-2.5">
                        <s.icon className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">{s.status}</span>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${s.color}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modules grid */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <GridIcon className="w-4 h-4 text-slate-500" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    M&oacute;dulos activos
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {appModules.map((m) => (
                    <div key={m.name} className="flex items-center gap-2 bg-white dark:bg-white/5 rounded-lg px-3 py-2.5 border border-slate-100 dark:border-slate-800/60">
                      <span className={`w-2 h-2 rounded-full ${m.color} shadow-sm`} />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: quick tip / session info */}
            <div className="space-y-3">
              <div className="bg-blue-50/60 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100/60 dark:border-blue-800/30">
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-0.5">
                      &Uacute;ltimo acceso
                    </p>
                    <p className="text-[11px] text-blue-500/70 dark:text-blue-400/60 leading-relaxed">
                      No se detectaron sesiones previas.<br />
                      Todos los datos se almacenan localmente.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center leading-relaxed">
                StellarERP v2.0 &mdash; Entorno local seguro<br />
                Datos almacenados en %AppData%
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes float-slower {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(20px) scale(0.95); }
        }
        .animate-float-slow {
          animation: float-slow 12s ease-in-out infinite;
        }
        .animate-float-slower {
          animation: float-slower 16s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}

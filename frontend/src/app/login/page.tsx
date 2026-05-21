"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center shadow-xl rotate-3 mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white dark:border-slate-900 rounded-sm rotate-45" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Stellar<span className="text-blue-600">ERP</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Inicia sesión para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ingresa tu usuario"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-all active:scale-[0.98]"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          <p className="text-xs text-center text-slate-400 dark:text-slate-600">
            Usuario por defecto: <span className="font-mono">admin</span> / <span className="font-mono">admin123</span>
          </p>
        </form>
      </div>
    </div>
  );
}

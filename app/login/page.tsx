"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().min(1, "Ingresa tu correo").email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

// Mismo mensaje para correo inexistente y para contraseña incorrecta: no hay
// que confirmarle a quien intenta entrar qué correos están registrados.
const INVALID_CREDENTIALS_MESSAGE = "Correo o contraseña incorrectos.";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisa los datos ingresados.");
      return;
    }

    setPending(true);
    try {
      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });

      if (!result || result.error) {
        setError(INVALID_CREDENTIALS_MESSAGE);
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">Acceso al Panel</h2>
          <p className="text-sm text-slate-400 mt-2">Ingresa tus credenciales de analista o scout</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nombre@club.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-semibold py-3 rounded-lg text-sm transition-colors shadow-lg shadow-emerald-500/10"
          >
            {pending ? "Entrando…" : "Entrar al Sistema"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

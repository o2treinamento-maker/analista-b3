"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

 async function handleLogin(e) {
  e.preventDefault();
  setLoading(true);
  setMensagem("");

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    setMensagem("Email ou senha inválidos.");
    setLoading(false);
    return;
  }

  if (!data.user.email_confirmed_at) {
    await supabase.auth.signOut();

    setMensagem(
      "Confirme seu email antes de acessar. Verifique sua caixa de entrada."
    );

    setLoading(false);
    return;
  }

  router.push("/");

  setLoading(false);
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] text-white px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),transparent_35%)]" />

      <form
        onSubmit={handleLogin}
        className="relative bg-zinc-950/90 border border-white/10 shadow-2xl p-8 rounded-3xl w-full max-w-md"
      >
        <div className="mb-6">
          <span className="inline-flex mb-4 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
            Acesse sua conta
          </span>

          <h1 className="text-3xl font-black mb-3">
            Entrar no Radar
          </h1>

          <p className="text-zinc-400 text-sm leading-relaxed">
            Faça login para continuar suas análises e usar suas consultas gratuitas disponíveis.
          </p>
        </div>

        <input
          type="email"
          placeholder="Seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-4 rounded-xl bg-zinc-900 border border-zinc-700 outline-none focus:border-green-500"
        />

        <input
          type="password"
          placeholder="Sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full mb-4 p-4 rounded-xl bg-zinc-900 border border-zinc-700 outline-none focus:border-green-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 text-black p-4 rounded-xl font-black transition disabled:opacity-60"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="mt-5 text-sm text-zinc-400 text-center">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="text-green-400 font-bold hover:underline">
            Criar conta grátis
          </Link>
        </p>

        {mensagem && (
          <p className="mt-4 text-sm text-zinc-300 text-center">
            {mensagem}
          </p>
        )}
      </form>
    </div>
  );
}
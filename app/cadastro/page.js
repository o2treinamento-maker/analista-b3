"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function CadastroPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [cadastroConcluido, setCadastroConcluido] = useState(false);

  async function handleCadastro(e) {
    e.preventDefault();

    setLoading(true);
    setMensagem("");

    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      setMensagem(error.message);
    } else {
      setCadastroConcluido(true);
    }

    setLoading(false);
  }

  if (cadastroConcluido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712] text-white px-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),transparent_35%)]" />

        <div className="relative bg-zinc-950/90 border border-green-500/20 shadow-2xl p-8 rounded-3xl w-full max-w-md text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 border border-green-500/30 text-2xl">
            ✉️
          </div>

          <span className="inline-flex mb-4 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
            Confirme seu email
          </span>

          <h1 className="text-3xl font-black mb-4">
            Falta só confirmar sua conta
          </h1>

          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Enviamos um link de confirmação para:
          </p>

          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white">
            {email}
          </div>

          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            Abra seu email, clique no link de confirmação e depois volte para fazer login.
          </p>

          <Link
            href="/login"
            className="flex w-full justify-center rounded-xl bg-green-500 px-5 py-4 font-black text-black transition hover:bg-green-400"
          >
            Ir para login
          </Link>

          <p className="mt-5 text-xs text-zinc-500">
            Não encontrou? Verifique spam ou promoções.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] text-white px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.12),transparent_35%)]" />

      <form
        onSubmit={handleCadastro}
        className="relative bg-zinc-950/90 border border-white/10 shadow-2xl p-8 rounded-3xl w-full max-w-md"
      >
        <div className="mb-6">
          <span className="inline-flex mb-4 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold text-green-400">
            Consulta grátis utilizada
          </span>

          <h1 className="text-3xl font-black mb-3">
            Continue sua análise
          </h1>

          <p className="text-zinc-400 text-sm leading-relaxed">
            Você usou sua consulta gratuita sem login. Crie uma conta grátis
            para liberar mais 3 análises de ações por dia.
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
          placeholder="Crie uma senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full mb-4 p-4 rounded-xl bg-zinc-900 border border-zinc-700 outline-none focus:border-green-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 text-black p-4 rounded-xl font-black transition disabled:opacity-60"
        >
          {loading ? "Criando conta..." : "Criar conta grátis"}
        </button>

        <p className="mt-5 text-sm text-zinc-400 text-center">
          Já tem conta?{" "}
          <Link
            href="/login"
            className="text-green-400 font-bold hover:underline"
          >
            Entrar
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
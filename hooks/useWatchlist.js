"use client";

// ═══════════════════════════════════════════════════════════════════════════
// useWatchlist
//
// Hook para gerenciar a watchlist do usuário no Supabase (tabela `watchlists`).
//
// USO:
//   const {
//     tickers,            // string[] — ex: ["PETR4", "BBAS3"]
//     loading,            // boolean — true enquanto carrega
//     adicionando,        // boolean — true enquanto adiciona
//     removendo,          // string|null — ticker que está sendo removido
//     erro,               // string — mensagem de erro (ou "")
//     adicionar,          // async fn(ticker) — adiciona à watchlist
//     remover,            // async fn(ticker) — remove da watchlist
//     estaNaCarteira,     // fn(ticker) → boolean
//     limparErro,         // fn() — limpa mensagem de erro
//     recarregar,         // async fn() — refetch manual
//   } = useWatchlist();
//
// COMPORTAMENTO:
//   - Carrega automaticamente quando o usuário loga.
//   - Se não tem usuário logado, tickers fica [].
//   - Reage a login/logout via supabase.auth.onAuthStateChange.
//   - Impede ticker duplicado (não chama o banco se já existe localmente).
//   - Valida contra TICKERS_PERMITIDOS antes de inserir.
//   - Atualiza estado local otimisticamente após sucesso da API.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { TICKERS_PERMITIDOS } from "@/lib/tickers";

export function useWatchlist() {
  const [user, setUser] = useState(null);
  const [tickers, setTickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adicionando, setAdicionando] = useState(false);
  const [removendo, setRemovendo] = useState(null);
  const [erro, setErro] = useState("");

  // Guarda referência ao timeout do erro pra evitar piscadas
  const erroTimeoutRef = useRef(null);

  // ── Setter de erro com auto-clear ───────────────────────────────────────
  const definirErro = useCallback((mensagem, autoClearMs = 3000) => {
    setErro(mensagem);
    if (erroTimeoutRef.current) clearTimeout(erroTimeoutRef.current);
    if (mensagem && autoClearMs > 0) {
      erroTimeoutRef.current = setTimeout(() => setErro(""), autoClearMs);
    }
  }, []);

  const limparErro = useCallback(() => {
    if (erroTimeoutRef.current) clearTimeout(erroTimeoutRef.current);
    setErro("");
  }, []);

  // ── Carrega lista do Supabase ────────────────────────────────────────────
  const recarregar = useCallback(async (uid = user?.id) => {
    if (!uid) {
      setTickers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("watchlists")
      .select("ticker")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Erro ao carregar watchlist:", error);
      definirErro("Erro ao carregar carteira.");
      setLoading(false);
      return;
    }

    // Remove duplicatas (defesa, caso o banco tenha alguma)
    const lista = data ? [...new Set(data.map(a => a.ticker))] : [];
    setTickers(lista);
    setLoading(false);
  }, [user?.id, definirErro]);

  // ── Auth listener: carrega a watchlist quando o user muda ───────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data?.user || null);
      if (data?.user) {
        recarregar(data.user.id);
      } else {
        setTickers([]);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        const novoUser = session?.user || null;
        setUser(novoUser);
        if (novoUser) {
          recarregar(novoUser.id);
        } else {
          setTickers([]);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
      if (erroTimeoutRef.current) clearTimeout(erroTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Verifica se ticker está na watchlist ────────────────────────────────
  const estaNaCarteira = useCallback(
    (ticker) => {
      if (!ticker) return false;
      const t = String(ticker).trim().toUpperCase();
      return tickers.includes(t);
    },
    [tickers]
  );

  // ── Adicionar ticker ─────────────────────────────────────────────────────
  const adicionar = useCallback(
    async (tickerInput) => {
      if (!user) {
        definirErro("Faça login pra usar a carteira.");
        return { ok: false, motivo: "sem_user" };
      }

      const ticker = String(tickerInput || "").trim().toUpperCase();
      if (!ticker) {
        definirErro("Informe um ticker.");
        return { ok: false, motivo: "vazio" };
      }

      if (!TICKERS_PERMITIDOS.has(ticker)) {
        definirErro(`"${ticker}" não está disponível.`);
        return { ok: false, motivo: "nao_permitido" };
      }

      // Já está na carteira: não faz nada, retorna sucesso silencioso
      if (tickers.includes(ticker)) {
        return { ok: true, motivo: "ja_existia" };
      }

      setAdicionando(true);
      const { error } = await supabase
        .from("watchlists")
        .insert({ user_id: user.id, ticker });

      setAdicionando(false);

      if (error) {
        console.error("Erro ao adicionar watchlist:", error);
        definirErro("Erro ao adicionar. Tente de novo.");
        return { ok: false, motivo: "erro_banco" };
      }

      setTickers((prev) =>
        prev.includes(ticker) ? prev : [...prev, ticker]
      );
      return { ok: true, motivo: "adicionado" };
    },
    [user, tickers, definirErro]
  );

  // ── Remover ticker ──────────────────────────────────────────────────────
  const remover = useCallback(
    async (tickerInput) => {
      if (!user) {
        definirErro("Faça login pra usar a carteira.");
        return { ok: false, motivo: "sem_user" };
      }

      const ticker = String(tickerInput || "").trim().toUpperCase();
      if (!ticker) return { ok: false, motivo: "vazio" };

      setRemovendo(ticker);
      const { error } = await supabase
        .from("watchlists")
        .delete()
        .eq("ticker", ticker)
        .eq("user_id", user.id);

      setRemovendo(null);

      if (error) {
        console.error("Erro ao remover watchlist:", error);
        definirErro("Erro ao remover. Tente de novo.");
        return { ok: false, motivo: "erro_banco" };
      }

      setTickers((prev) => prev.filter((t) => t !== ticker));
      return { ok: true, motivo: "removido" };
    },
    [user, definirErro]
  );

  return {
    tickers,
    loading,
    adicionando,
    removendo,
    erro,
    user,
    adicionar,
    remover,
    estaNaCarteira,
    limparErro,
    recarregar,
  };
}
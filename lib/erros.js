// lib/erros.js
// ═══════════════════════════════════════════════════════════════════════════
// TRADUTOR DE ERROS — converte erros técnicos em mensagens de produto
// ═══════════════════════════════════════════════════════════════════════════
// Usado nos cards (Fluxo, Quant, Fundamentalista, Dividendos) pra mostrar
// mensagens amigáveis ao invés de stack traces ou erros de API.
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Traduz um erro técnico em mensagem amigável.
 * @param {string} erroTecnico - mensagem de erro original
 * @returns {object} { titulo, mensagem, acao, icone }
 */
export function traduzirErro(erroTecnico) {
  const erro = (erroTecnico || "").toString().toLowerCase();

  // ─── BRAPI / API EXTERNA INSTÁVEL ───────────────────────────────────
  if (
    erro.includes("brapi") ||
    erro.includes("internal_error") ||
    erro.includes("autenticação") ||
    erro.includes("autenticacao") ||
    erro.includes("validar") ||
    erro.includes("falha ao buscar ibov") ||
    erro.includes("dados insuficientes após alinhar")
  ) {
    return {
      titulo: "Análise temporariamente indisponível",
      mensagem:
        "Estamos com instabilidade em uma das fontes de dados de mercado. Tente novamente em alguns minutos.",
      acao: "tentar_novamente",
      icone: "⚠️",
    };
  }

  // ─── ERRO 500 / 502 / 503 / 504 GENÉRICO ────────────────────────────
  if (
    erro.includes("500") ||
    erro.includes("502") ||
    erro.includes("503") ||
    erro.includes("504")
  ) {
    return {
      titulo: "Análise temporariamente indisponível",
      mensagem:
        "Estamos com uma instabilidade momentânea. Tente novamente em alguns instantes.",
      acao: "tentar_novamente",
      icone: "⚠️",
    };
  }

  // ─── HISTÓRICO INSUFICIENTE (ativo novo / pouco volume) ─────────────
  if (
    erro.includes("historico insuficiente") ||
    erro.includes("histórico insuficiente") ||
    erro.includes("ema(50)") ||
    erro.includes("mínimo 60") ||
    erro.includes("minimo 60") ||
    erro.includes("0 dias")
  ) {
    return {
      titulo: "Dados insuficientes para análise",
      mensagem:
        "Este ativo tem histórico curto ou baixa liquidez para uma análise técnica completa.",
      acao: "tentar_outro",
      icone: "📊",
    };
  }

  // ─── TICKER NÃO ENCONTRADO ──────────────────────────────────────────
  if (
    erro.includes("ativo não encontrado") ||
    erro.includes("ativo nao encontrado") ||
    erro.includes("ticker não encontrado") ||
    erro.includes("ticker nao encontrado") ||
    erro.includes("not found") ||
    erro.includes("404") ||
    erro.includes("ticker inválido") ||
    erro.includes("ticker invalido")
  ) {
    return {
      titulo: "Ativo não encontrado",
      mensagem:
        "Verifique se o código do ativo está correto (ex: PETR4, VALE3, ITUB4).",
      acao: "verificar",
      icone: "🔍",
    };
  }

  // ─── TIMEOUT / NETWORK ──────────────────────────────────────────────
  if (
    erro.includes("timeout") ||
    erro.includes("timed out") ||
    erro.includes("network") ||
    erro.includes("failed to fetch") ||
    erro.includes("econnreset") ||
    erro.includes("connection")
  ) {
    return {
      titulo: "Conexão lenta",
      mensagem:
        "A análise está demorando mais que o esperado. Verifique sua conexão e tente novamente.",
      acao: "tentar_novamente",
      icone: "🐢",
    };
  }

  // ─── ATIVO SEM DIVIDENDOS (caso específico do CardDividendos) ───────
  if (
    erro.includes("não possui histórico") ||
    erro.includes("nao possui historico") ||
    erro.includes("não tem dividendos") ||
    erro.includes("nao tem dividendos")
  ) {
    return {
      titulo: "Sem histórico de dividendos",
      mensagem:
        "Este ativo não distribui proventos relevantes ou ainda não pagou dividendos.",
      acao: "informativo",
      icone: "💰",
    };
  }

  // ─── PARÂMETROS INVÁLIDOS ───────────────────────────────────────────
  if (
    erro.includes("obrigatorio") ||
    erro.includes("obrigatório") ||
    erro.includes("invalid") ||
    erro.includes("inválido") ||
    erro.includes("invalido")
  ) {
    return {
      titulo: "Parâmetros inválidos",
      mensagem: "Não foi possível processar esta análise. Tente outro ativo.",
      acao: "tentar_outro",
      icone: "⚠️",
    };
  }

  // ─── FALLBACK GENÉRICO ──────────────────────────────────────────────
  return {
    titulo: "Algo deu errado",
    mensagem:
      "Não foi possível carregar esta análise no momento. Tente novamente em alguns instantes.",
    acao: "tentar_novamente",
    icone: "⚠️",
  };
}
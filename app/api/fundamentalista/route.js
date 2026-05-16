// src/app/api/fundamentalista/route.js
// V8 — V7 + INTEGRAÇÃO COM /api/dividendos
// Mestres Bazin, Barsi e Lynch agora usam métricas ricas de dividendos:
// CAGR, estabilidade, anos consecutivos, classificação ARISTOCRATA, armadilha
// Fetch em paralelo com Brapi pra não impactar latência.

import { NextResponse } from "next/server";

const BRAPI_TOKEN = process.env.BRAPI_TOKEN;
const ANO_CORTE_DESDOBRAMENTO = 2009;

// ─────────────────────────────────────────────
// HELPERS BÁSICOS
// ─────────────────────────────────────────────

function n(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function media(arr) {
  const validos = arr.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (!validos.length) return 50;
  return Math.round(validos.reduce((a, b) => a + b, 0) / validos.length);
}

function pct(v, casas = 1) {
  if (v == null || isNaN(v)) return null;
  return Number((v * 100).toFixed(casas));
}

function pctSeguro(v, casas = 1) {
  if (v == null || isNaN(v)) return null;
  const ehPercentualDireto = Math.abs(v) > 3;
  const final = ehPercentualDireto ? v : v * 100;
  return Number(final.toFixed(casas));
}

function bi(v) {
  if (v == null || isNaN(v)) return null;
  return Number((v / 1_000_000_000).toFixed(1));
}

// ─────────────────────────────────────────────
// DY MANUAL — wrapping defensivo
// ─────────────────────────────────────────────

function calcularDY12mDeCashDividends(cashDividends, precoAtual) {
  try {
    if (!Array.isArray(cashDividends) || !precoAtual || precoAtual <= 0) return null;

    const agora = new Date();
    const umAnoAtras = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000);

    const pagamentos = cashDividends
      .map((p) => ({
        data: new Date(p.paymentDate),
        valor: Number(p.rate) || 0,
      }))
      .filter(
        (p) =>
          p.valor > 0.0001 &&
          !Number.isNaN(p.data.getTime()) &&
          p.data.getFullYear() >= ANO_CORTE_DESDOBRAMENTO
      );

    const total12m = pagamentos
      .filter((p) => p.data >= umAnoAtras && p.data <= agora)
      .reduce((s, p) => s + p.valor, 0);

    if (total12m <= 0) return 0;
    return total12m / precoAtual;
  } catch (e) {
    console.log(`⚠️  Erro calculando DY: ${e.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// EXTRAÇÕES ROBUSTAS — wrapping defensivo
// ─────────────────────────────────────────────

function extrairPatrimonio(ativo) {
  try {
    const balanco = Array.isArray(ativo?.balanceSheetHistory)
      ? ativo.balanceSheetHistory[0]
      : null;
    if (!balanco) return null;
    return (
      n(balanco.shareholdersEquity) ||
      n(balanco.controllerShareholdersEquity) ||
      n(balanco.totalStockholderEquity) ||
      null
    );
  } catch (e) {
    console.log(`⚠️  Erro extraindo patrimônio: ${e.message}`);
    return null;
  }
}

function extrairDREMaisRecente(ativo) {
  try {
    const candidatos = [
      ativo?.incomeStatementHistory,
      ativo?.incomeStatementHistory?.incomeStatementHistory,
      ativo?.incomeStatementStatements,
    ];

    let dres = null;
    for (const c of candidatos) {
      if (Array.isArray(c) && c.length > 0) {
        dres = c;
        break;
      }
    }

    if (!dres) {
      console.log(`⚠️  DRE não encontrado`);
      return null;
    }

    const ordenados = [...dres]
      .filter((d) => d && d.endDate)
      .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

    return ordenados[0] || null;
  } catch (e) {
    console.log(`⚠️  Erro extraindo DRE: ${e.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// ROIC (Greenblatt/Buffett) — wrapping defensivo
// ─────────────────────────────────────────────

function calcularROIC(dre, patrimonio, totalDebt) {
  try {
    if (!dre || patrimonio == null || totalDebt == null) {
      console.log(`⚠️  ROIC: insumos faltando (dre=${!!dre}, pl=${patrimonio}, debt=${totalDebt})`);
      return null;
    }

    const ebit = n(dre.ebit) || n(dre.cleanEbit) || n(dre.operatingIncome);
    const incomeBeforeTax = n(dre.incomeBeforeTax);
    const incomeTaxExpense = n(dre.incomeTaxExpense);

    if (ebit == null || ebit <= 0) {
      console.log(`⚠️  ROIC: EBIT inválido (${ebit})`);
      return null;
    }

    let taxaEfetiva = 0.25;
    if (incomeBeforeTax && incomeBeforeTax > 0 && incomeTaxExpense != null) {
      const impostoAbsoluto = Math.abs(incomeTaxExpense);
      const taxaCalculada = impostoAbsoluto / incomeBeforeTax;
      if (taxaCalculada >= 0 && taxaCalculada <= 0.5) {
        taxaEfetiva = taxaCalculada;
      }
    }

    const nopat = ebit * (1 - taxaEfetiva);
    const capitalInvestido = patrimonio + totalDebt;

    if (capitalInvestido <= 0) {
      console.log(`⚠️  ROIC: capital investido inválido (${capitalInvestido})`);
      return null;
    }

    const roic = nopat / capitalInvestido;

    console.log(
      `🎯 ROIC: ${(roic * 100).toFixed(2)}% | NOPAT: ${bi(nopat)}bi | Cap.Inv: ${bi(capitalInvestido)}bi`
    );

    return roic;
  } catch (e) {
    console.log(`⚠️  Erro calculando ROIC: ${e.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// QUALIDADE DO LUCRO — wrapping defensivo
// ─────────────────────────────────────────────

function calcularQualidadeLucro(fcf, lucroLiquido) {
  try {
    if (fcf == null || lucroLiquido == null) return null;
    if (lucroLiquido <= 0) return null;
    return fcf / lucroLiquido;
  } catch (e) {
    console.log(`⚠️  Erro calculando Q.Lucro: ${e.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// SCORES — VALUATION
// ─────────────────────────────────────────────

function scorePL(pl) {
  if (pl == null || pl <= 0) return 35;
  if (pl <= 5) return 92;
  if (pl <= 8) return 86;
  if (pl <= 12) return 78;
  if (pl <= 18) return 66;
  if (pl <= 25) return 54;
  if (pl <= 40) return 38;
  return 22;
}

function scorePVP(pvp) {
  if (pvp == null || pvp <= 0) return 40;
  if (pvp <= 1) return 92;
  if (pvp <= 1.5) return 84;
  if (pvp <= 2.5) return 70;
  if (pvp <= 4) return 52;
  return 30;
}

function scoreDY(dy) {
  if (dy == null) return 50;
  const y = dy * 100;
  if (y >= 10) return 92;
  if (y >= 6) return 82;
  if (y >= 3) return 68;
  if (y > 0) return 55;
  return 38;
}

function scoreEvEbitda(evEbitda) {
  if (evEbitda == null || evEbitda <= 0) return 40;
  if (evEbitda <= 4) return 94;
  if (evEbitda <= 6) return 86;
  if (evEbitda <= 8) return 76;
  if (evEbitda <= 11) return 64;
  if (evEbitda <= 15) return 50;
  if (evEbitda <= 20) return 35;
  return 22;
}

// ─────────────────────────────────────────────
// SCORES — QUALIDADE
// ─────────────────────────────────────────────

function scoreROIC(roic) {
  if (roic == null) return 50;
  const r = roic * 100;
  if (r >= 20) return 95;
  if (r >= 15) return 84;
  if (r >= 10) return 72;
  if (r >= 7) return 58;
  if (r >= 4) return 46;
  if (r > 0) return 32;
  return 18;
}

function scoreROE(roe) {
  if (roe == null) return 50;
  const r = roe * 100;
  if (r >= 25) return 95;
  if (r >= 18) return 84;
  if (r >= 12) return 72;
  if (r >= 8) return 58;
  if (r > 0) return 46;
  return 24;
}

function scoreMargem(margem) {
  if (margem == null) return 50;
  const m = margem * 100;
  if (m >= 30) return 95;
  if (m >= 20) return 84;
  if (m >= 12) return 74;
  if (m >= 5) return 58;
  if (m > 0) return 46;
  return 24;
}

function scoreMargemEbitda(margem) {
  if (margem == null) return 50;
  const m = margem * 100;
  if (m >= 35) return 95;
  if (m >= 25) return 86;
  if (m >= 18) return 76;
  if (m >= 10) return 62;
  if (m >= 5) return 48;
  if (m > 0) return 34;
  return 18;
}

function scoreMargemEbit(margem) {
  if (margem == null) return 50;
  const m = margem * 100;
  if (m >= 25) return 95;
  if (m >= 18) return 84;
  if (m >= 12) return 74;
  if (m >= 7) return 60;
  if (m >= 3) return 46;
  if (m > 0) return 32;
  return 18;
}

function scoreCrescimento(v) {
  if (v == null) return 50;
  const g = v * 100;
  if (g >= 30) return 95;
  if (g >= 15) return 84;
  if (g >= 5) return 70;
  if (g >= 0) return 58;
  return 28;
}

function scoreQualidadeLucro(qLucro) {
  if (qLucro == null) return 50;
  if (qLucro >= 1.2) return 94;
  if (qLucro >= 0.9) return 84;
  if (qLucro >= 0.6) return 68;
  if (qLucro >= 0.3) return 50;
  if (qLucro >= 0) return 34;
  return 18;
}

// ─────────────────────────────────────────────
// SCORES — ROBUSTEZ
// ─────────────────────────────────────────────

function scoreDivida(v) {
  if (v == null) return 50;
  if (v <= 0.3) return 94;
  if (v <= 0.7) return 82;
  if (v <= 1.2) return 68;
  if (v <= 2) return 52;
  if (v <= 3) return 38;
  return 22;
}

function scoreDividaEbitda(v) {
  if (v == null) return 50;
  if (v < 0) return 96;
  if (v <= 1) return 90;
  if (v <= 2) return 78;
  if (v <= 3) return 62;
  if (v <= 4) return 46;
  if (v <= 5) return 32;
  return 18;
}

function scoreLiquidez(v) {
  if (v == null) return 50;
  if (v >= 2) return 92;
  if (v >= 1.5) return 82;
  if (v >= 1.1) return 68;
  if (v >= 0.8) return 52;
  return 30;
}

function scoreCaixa(fco, fcf) {
  let score = 50;
  if (fco != null) score += fco > 0 ? 15 : -20;
  if (fcf != null) {
    if (fcf > 0) score += 18;
    else if (fcf < 0) score -= 25;
  }
  return clamp(score, 10, 95);
}

function scoreMarketCap(v) {
  if (v == null) return 50;
  if (v >= 100_000_000_000) return 92;
  if (v >= 40_000_000_000) return 82;
  if (v >= 15_000_000_000) return 72;
  if (v >= 5_000_000_000) return 60;
  return 45;
}

// ─────────────────────────────────────────────
// CLASSIFICAÇÕES QUALITATIVAS
// ─────────────────────────────────────────────

function classROIC(roic) {
  if (roic == null) return { label: "—", cor: "amarelo" };
  const r = roic * 100;
  if (r >= 20) return { label: "criação extraordinária", cor: "verde" };
  if (r >= 15) return { label: "cria valor", cor: "verde" };
  if (r >= 10) return { label: "neutra", cor: "amarelo" };
  if (r >= 5) return { label: "destrói valor", cor: "laranja" };
  if (r > 0) return { label: "muito fraco", cor: "vermelho" };
  return { label: "destrói capital", cor: "vermelho" };
}

function classQualidadeLucro(qLucro) {
  if (qLucro == null) return { label: "—", cor: "amarelo" };
  if (qLucro >= 1.0) return { label: "lucro vira caixa", cor: "verde" };
  if (qLucro >= 0.7) return { label: "saudável", cor: "verde" };
  if (qLucro >= 0.4) return { label: "moderada", cor: "amarelo" };
  if (qLucro >= 0) return { label: "lucro contábil", cor: "laranja" };
  return { label: "queima caixa", cor: "vermelho" };
}

function classMargemEbitda(margem) {
  if (margem == null) return { label: "—", cor: "amarelo" };
  const m = margem * 100;
  if (m >= 25) return { label: "excelente", cor: "verde" };
  if (m >= 18) return { label: "saudável", cor: "verde" };
  if (m >= 10) return { label: "moderada", cor: "amarelo" };
  if (m > 0) return { label: "pressionada", cor: "laranja" };
  return { label: "negativa", cor: "vermelho" };
}

function classMargemEbit(margem) {
  if (margem == null) return { label: "—", cor: "amarelo" };
  const m = margem * 100;
  if (m >= 20) return { label: "excelente", cor: "verde" };
  if (m >= 12) return { label: "saudável", cor: "verde" };
  if (m >= 6) return { label: "moderada", cor: "amarelo" };
  if (m > 0) return { label: "pressionada", cor: "laranja" };
  return { label: "negativa", cor: "vermelho" };
}

function classEvEbitda(v) {
  if (v == null || v <= 0) return { label: "—", cor: "amarelo" };
  if (v <= 6) return { label: "atrativo", cor: "verde" };
  if (v <= 11) return { label: "justo", cor: "amarelo" };
  if (v <= 15) return { label: "exigente", cor: "laranja" };
  return { label: "caro", cor: "vermelho" };
}

function classDividaEbitda(v) {
  if (v == null) return { label: "—", cor: "amarelo" };
  if (v < 0) return { label: "caixa líquido", cor: "verde" };
  if (v <= 2) return { label: "saudável", cor: "verde" };
  if (v <= 3) return { label: "moderada", cor: "amarelo" };
  if (v <= 5) return { label: "elevada", cor: "laranja" };
  return { label: "muito elevada", cor: "vermelho" };
}

// ─────────────────────────────────────────────
// TEXTOS
// ─────────────────────────────────────────────

function textoPilar(score, tipo) {
  if (tipo === "valuation") {
    if (score >= 75) return "ativo aparenta negociar com valuation atrativo";
    if (score >= 55) return "precificação relativamente equilibrada";
    return "mercado exige múltiplos mais altos para o ativo";
  }
  if (tipo === "qualidade") {
    if (score >= 75) return "empresa demonstra excelência operacional e gera valor";
    if (score >= 55) return "qualidade operacional moderada";
    return "eficiência operacional mais pressionada";
  }
  if (tipo === "robustez") {
    if (score >= 75) return "estrutura financeira saudável";
    if (score >= 55) return "estrutura relativamente equilibrada";
    return "estrutura financeira mais fragilizada";
  }
  return "";
}

function gerarLeitura(scoreFinal, valuationScore, qualidadeScore, robustezScore) {
  let abertura;
  if (scoreFinal >= 75) {
    abertura = "A empresa apresenta uma estrutura fundamentalista forte.";
  } else if (scoreFinal >= 55) {
    abertura = "A empresa apresenta fundamentos relativamente equilibrados.";
  } else {
    abertura = "A empresa apresenta fundamentos mais pressionados no cenário atual.";
  }

  return (
    `${abertura} ` +
    `O valuation atual indica ${textoPilar(valuationScore, "valuation")}, ` +
    `a qualidade operacional mostra ${textoPilar(qualidadeScore, "qualidade")} ` +
    `e a robustez financeira aponta ${textoPilar(robustezScore, "robustez")}.`
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🔗 FETCH INTERNO DA ROTA DE DIVIDENDOS
// Reaproveita métricas ricas (CAGR, estabilidade, armadilha, etc.)
// Defensivo: se falhar, devolve null e mestres usam só métricas básicas
// ═══════════════════════════════════════════════════════════════════

async function buscarDividendosInternos(ticker, baseUrl) {
  try {
    // Timeout de 4s pra não travar a resposta principal
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(
      `${baseUrl}/api/dividendos?ticker=${encodeURIComponent(ticker)}`,
      { signal: controller.signal, next: { revalidate: 60 * 60 * 12 } }
    );

    clearTimeout(timeoutId);

    if (!resp.ok) {
      console.log(`⚠️  Dividendos internos retornou status ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    if (data.error) {
      console.log(`⚠️  Dividendos internos retornou erro: ${data.error}`);
      return null;
    }

    console.log(
      `🔗 Dividendos internos OK: classif=${data.classificacao?.label}, anosConsec=${data.metricas?.anosConsecutivos}, CAGR=${data.metricas?.cagrDividendos?.toFixed(3)}`
    );
    return data;
  } catch (e) {
    console.log(
      `⚠️  Erro buscando dividendos internos: ${e.message}${e.name === "AbortError" ? " (timeout)" : ""}`
    );
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🎓 OS 6 MESTRES DO INVESTIMENTO
// Avalia uma empresa através dos critérios de 6 lendas:
// Graham, Buffett, Lynch, Greenblatt, Bazin e Barsi
// ═══════════════════════════════════════════════════════════════════

// Setores perenes pro Barsi (filosofia "carteira previdenciária")
const SETORES_PERENES_BARSI = [
  "energy",
  "utilities",
  "financial services",
  "financial",
  "communication services",
  "consumer defensive",
  // Termos PT que vêm do profile.sectorDisp
  "energia",
  "saneamento",
  "bancos",
  "telecomunicações",
  "telecomunicacoes",
  "seguros",
  "utilidade pública",
  "utilidade publica",
];

function setorEhPerene(setor, industria) {
  if (!setor && !industria) return false;
  const txt = `${setor || ""} ${industria || ""}`.toLowerCase();
  return SETORES_PERENES_BARSI.some((p) => txt.includes(p));
}

// Helper: cria um critério padronizado
function crit(titulo, descricao, valorAtual, passa) {
  return { titulo, descricao, valorAtual, passa: !!passa };
}

// Helper: classifica veredito baseado em ratio
function classificarVeredito(aprovados, total) {
  if (total === 0) return "indisponivel";
  const ratio = aprovados / total;
  if (ratio >= 0.75) return "aprovado";
  if (ratio >= 0.5) return "parcial";
  return "reprovado";
}

// Helper: formata valor pra exibição no critério
function fmtVal(v, sufixo = "", casas = 1) {
  if (v == null || isNaN(v)) return "—";
  return `${Number(v).toFixed(casas)}${sufixo}`;
}

// ─────────────────────────────────────────────
// BENJAMIN GRAHAM — Pai do Value Investing
// ─────────────────────────────────────────────
function avaliarGraham(m) {
  const grahamNumber =
    m.pl != null && m.pvp != null ? m.pl * m.pvp : null;

  const criterios = [
    crit(
      "P/L abaixo de 15",
      "Múltiplo de lucro defensivo",
      fmtVal(m.pl, "x", 1),
      m.pl != null && m.pl > 0 && m.pl < 15
    ),
    crit(
      "P/VP abaixo de 1.5",
      "Preço próximo ao patrimônio",
      fmtVal(m.pvp, "x", 2),
      m.pvp != null && m.pvp > 0 && m.pvp < 1.5
    ),
    crit(
      "Graham Number: P/L × P/VP < 22.5",
      "Combinação clássica de valor",
      grahamNumber != null ? grahamNumber.toFixed(1) : "—",
      grahamNumber != null && grahamNumber > 0 && grahamNumber < 22.5
    ),
    crit(
      "Liquidez corrente acima de 2.0",
      "Solidez de curto prazo",
      fmtVal(m.liquidez, "x", 2),
      m.liquidez != null && m.liquidez > 2.0
    ),
    crit(
      "Dívida/Patrimônio abaixo de 1.0",
      "Estrutura conservadora",
      fmtVal(m.dividaPatrimonio, "x", 2),
      m.dividaPatrimonio != null && m.dividaPatrimonio < 1.0
    ),
    crit(
      "Paga dividendos",
      "Empresa madura distribui resultado",
      m.dy != null ? `${(m.dy * 100).toFixed(2)}%` : "—",
      m.dy != null && m.dy > 0
    ),
    crit(
      "Margem líquida positiva",
      "Lucro contábil consistente",
      fmtVal(m.margemLiquidaPct, "%", 1),
      m.margemLiquidaPct != null && m.margemLiquidaPct > 0
    ),
  ];

  const aprovados = criterios.filter((c) => c.passa).length;

  return {
    id: "graham",
    nome: "Benjamin Graham",
    subtitulo: "Pai do Value Investing",
    citacao: "Margem de segurança acima de tudo.",
    filosofia:
      "Acreditava em comprar empresas sólidas com desconto sobre o valor patrimonial. Defendia margem de segurança, baixa dívida e histórico de lucros consistentes — investidor defensivo por natureza.",
    corTema: "azul",
    criterios,
    aprovados,
    total: criterios.length,
    veredito: classificarVeredito(aprovados, criterios.length),
  };
}

// ─────────────────────────────────────────────
// WARREN BUFFETT — Oráculo de Omaha
// ─────────────────────────────────────────────
function avaliarBuffett(m) {
  const criterios = [
    crit(
      "ROE acima de 15%",
      "Retorno sobre patrimônio consistente",
      fmtVal(m.roePct, "%", 1),
      m.roePct != null && m.roePct > 15
    ),
    crit(
      "ROIC acima de 15%",
      "Capital cria valor real",
      fmtVal(m.roicPct, "%", 1),
      m.roicPct != null && m.roicPct > 15
    ),
    crit(
      "Margem líquida acima de 10%",
      "Empresa converte vendas em lucro",
      fmtVal(m.margemLiquidaPct, "%", 1),
      m.margemLiquidaPct != null && m.margemLiquidaPct > 10
    ),
    crit(
      "Margem EBITDA acima de 20%",
      "Operação altamente eficiente",
      fmtVal(m.margemEbitdaPct, "%", 1),
      m.margemEbitdaPct != null && m.margemEbitdaPct > 20
    ),
    crit(
      "FCF positivo",
      "Gera caixa sem depender de dívida",
      m.fcf != null ? `R$ ${m.fcf.toFixed(1)} bi` : "—",
      m.fcf != null && m.fcf > 0
    ),
    crit(
      "Dívida/Patrimônio abaixo de 0.5",
      "Estrutura financeira conservadora",
      fmtVal(m.dividaPatrimonio, "x", 2),
      m.dividaPatrimonio != null && m.dividaPatrimonio < 0.5
    ),
    crit(
      "Qualidade do Lucro acima de 0.7",
      "Lucro vira caixa real",
      m.qualidadeLucro != null ? m.qualidadeLucro.toFixed(2) : "—",
      m.qualidadeLucro != null && m.qualidadeLucro > 0.7
    ),
    crit(
      "P/L abaixo de 20",
      "Não paga caro pelo lucro",
      fmtVal(m.pl, "x", 1),
      m.pl != null && m.pl > 0 && m.pl < 20
    ),
  ];

  const aprovados = criterios.filter((c) => c.passa).length;

  return {
    id: "buffett",
    nome: "Warren Buffett",
    subtitulo: "Oráculo de Omaha",
    citacao: "O preço é o que você paga; o valor é o que você leva.",
    filosofia:
      "Procura empresas com vantagem competitiva duradoura (moat), gestão honesta, geração consistente de caixa e ROIC alto — compradas a preço razoável. Tempo é o amigo das empresas excelentes.",
    corTema: "verde",
    criterios,
    aprovados,
    total: criterios.length,
    veredito: classificarVeredito(aprovados, criterios.length),
  };
}

// ─────────────────────────────────────────────
// PETER LYNCH — Growth at Reasonable Price (GARP)
// ─────────────────────────────────────────────
function avaliarLynch(m, divs) {
  // PEG = P/L ÷ crescimento (%)
  const peg =
    m.pl != null && m.pl > 0 && m.crescLucroPct != null && m.crescLucroPct > 0
      ? m.pl / m.crescLucroPct
      : null;

  // CAGR de dividendos (vem da rota dividendos, se disponível)
  const cagrDivPct =
    divs?.metricas?.cagrDividendos != null
      ? divs.metricas.cagrDividendos * 100
      : null;

  const criterios = [
    crit(
      "PEG abaixo de 1.0",
      "Crescimento justifica o preço",
      peg != null ? peg.toFixed(2) : "—",
      peg != null && peg > 0 && peg < 1.0
    ),
    crit(
      "Crescimento entre 10% e 30%",
      "Sweet spot do crescimento sustentável",
      fmtVal(m.crescLucroPct, "%", 1),
      m.crescLucroPct != null &&
        m.crescLucroPct >= 10 &&
        m.crescLucroPct <= 30
    ),
    crit(
      "ROE acima de 12%",
      "Retorno sobre patrimônio saudável",
      fmtVal(m.roePct, "%", 1),
      m.roePct != null && m.roePct > 12
    ),
    crit(
      "Dívida/Patrimônio abaixo de 0.5",
      "Estrutura financeira controlada",
      fmtVal(m.dividaPatrimonio, "x", 2),
      m.dividaPatrimonio != null && m.dividaPatrimonio < 0.5
    ),
    crit(
      "Margem líquida acima de 5%",
      "Negócio rentável",
      fmtVal(m.margemLiquidaPct, "%", 1),
      m.margemLiquidaPct != null && m.margemLiquidaPct > 5
    ),
    crit(
      "P/L abaixo de 25",
      "Não está caro demais para crescimento",
      fmtVal(m.pl, "x", 1),
      m.pl != null && m.pl > 0 && m.pl < 25
    ),
  ];

  // 🆕 Critério bônus se temos dados de dividendos
  if (cagrDivPct != null) {
    criterios.push(
      crit(
        "Crescimento de dividendos positivo",
        "Empresa aumenta proventos ao longo do tempo",
        `${cagrDivPct.toFixed(1)}%/ano`,
        cagrDivPct > 0
      )
    );
  }

  const aprovados = criterios.filter((c) => c.passa).length;

  return {
    id: "lynch",
    nome: "Peter Lynch",
    subtitulo: "Growth at Reasonable Price",
    citacao: "Compre o que você conhece e entende.",
    filosofia:
      "Buscava empresas em crescimento (10-30% ao ano) compradas a múltiplos razoáveis. O PEG ratio (P/L ÷ crescimento) era sua métrica favorita. Defendia simplicidade: investir em negócios que você compreende.",
    corTema: "roxo",
    criterios,
    aprovados,
    total: criterios.length,
    veredito: classificarVeredito(aprovados, criterios.length),
  };
}

// ─────────────────────────────────────────────
// JOEL GREENBLATT — Magic Formula
// ─────────────────────────────────────────────
function avaliarGreenblatt(m) {
  // Earnings Yield = EBIT/EV (invertido do EV/EBIT)
  // Aproximamos com inverso de EV/EBITDA × 0.7 (proxy de EBIT/EBITDA típico)
  const earningsYield =
    m.evEbitda != null && m.evEbitda > 0 ? (1 / m.evEbitda) * 100 : null;

  const criterios = [
    crit(
      "ROIC acima de 15%",
      "Excelência na alocação de capital",
      fmtVal(m.roicPct, "%", 1),
      m.roicPct != null && m.roicPct > 15
    ),
    crit(
      "Earnings Yield acima de 8%",
      "Empresa retorna bem em relação ao preço",
      earningsYield != null ? `${earningsYield.toFixed(1)}%` : "—",
      earningsYield != null && earningsYield > 8
    ),
    crit(
      "EV/EBITDA abaixo de 10",
      "Valor empresarial justo",
      fmtVal(m.evEbitda, "x", 1),
      m.evEbitda != null && m.evEbitda > 0 && m.evEbitda < 10
    ),
    crit(
      "Margem EBIT acima de 12%",
      "Operação genuinamente lucrativa",
      fmtVal(m.margemEbitPct, "%", 1),
      m.margemEbitPct != null && m.margemEbitPct > 12
    ),
    crit(
      "Margem EBITDA acima de 15%",
      "Geração operacional robusta",
      fmtVal(m.margemEbitdaPct, "%", 1),
      m.margemEbitdaPct != null && m.margemEbitdaPct > 15
    ),
  ];

  const aprovados = criterios.filter((c) => c.passa).length;

  return {
    id: "greenblatt",
    nome: "Joel Greenblatt",
    subtitulo: "Magic Formula",
    citacao: "Empresas boas e baratas, ranqueadas por ROIC.",
    filosofia:
      "Criou a Magic Formula: rankear empresas por ROIC (qualidade) e Earnings Yield (preço). Combinação simples mas poderosa que historicamente bate o mercado. Foca em capital de retorno alto comprado por preço razoável.",
    corTema: "ciano",
    criterios,
    aprovados,
    total: criterios.length,
    veredito: classificarVeredito(aprovados, criterios.length),
  };
}

// ─────────────────────────────────────────────
// DÉCIO BAZIN — Faça Fortuna com Ações
// ─────────────────────────────────────────────
function avaliarBazin(m, divs) {
  const dyPct = m.dy != null ? m.dy * 100 : null;

  // Métricas da rota de dividendos (se disponíveis)
  const anosConsec = divs?.metricas?.anosConsecutivos ?? null;
  const armadilha = divs?.armadilhaDividendos?.risco === true;
  const temGaps = divs?.metricas?.gaps != null && divs.metricas.gaps > 0;
  const cagrDiv =
    divs?.metricas?.cagrDividendos != null
      ? divs.metricas.cagrDividendos * 100
      : null;

  const criterios = [
    crit(
      "DY acima de 6%",
      "Retorno mínimo de dividendos Bazin",
      dyPct != null ? `${dyPct.toFixed(2)}%` : "—",
      dyPct != null && dyPct > 6
    ),
    crit(
      "P/L abaixo de 15",
      "Múltiplo conservador para dividendos",
      fmtVal(m.pl, "x", 1),
      m.pl != null && m.pl > 0 && m.pl < 15
    ),
    crit(
      "Empresa lucrativa",
      "Margem líquida positiva",
      fmtVal(m.margemLiquidaPct, "%", 1),
      m.margemLiquidaPct != null && m.margemLiquidaPct > 0
    ),
    crit(
      "Geração de caixa positiva",
      "FCO positivo sustenta dividendos",
      m.fco != null ? `R$ ${m.fco.toFixed(1)} bi` : "—",
      m.fco != null && m.fco > 0
    ),
  ];

  // 🆕 Critérios extras se temos dados de dividendos
  if (divs) {
    criterios.push(
      crit(
        "Pagando dividendos há 5+ anos",
        "Consistência histórica de proventos",
        anosConsec != null ? `${anosConsec} anos consecutivos` : "—",
        anosConsec != null && anosConsec >= 5
      ),
      crit(
        "Histórico sem interrupções",
        "Pagamentos contínuos ano após ano",
        temGaps ? `${divs.metricas.gaps} ano(s) sem pagar` : "sem gaps",
        !temGaps && anosConsec != null && anosConsec >= 3
      ),
      crit(
        "Não é armadilha de dividendos",
        "Yield alto sustentado por fundamentos",
        armadilha
          ? `risco ${divs.armadilhaDividendos?.nivel || "—"}`
          : "ok",
        !armadilha
      )
    );
  }

  const aprovados = criterios.filter((c) => c.passa).length;

  return {
    id: "bazin",
    nome: "Décio Bazin",
    subtitulo: "Faça Fortuna com Ações",
    citacao: "Compre ações com DY acima de 6% ao ano.",
    filosofia:
      "Jornalista econômico brasileiro que desenvolveu método simples e direto: ações são boas se pagam DY de pelo menos 6% ao ano, com P/L baixo e lucro consistente. Famoso pelo Preço Teto Bazin (DY anual ÷ 6%).",
    corTema: "amarelo",
    criterios,
    aprovados,
    total: criterios.length,
    veredito: classificarVeredito(aprovados, criterios.length),
  };
}

// ─────────────────────────────────────────────
// LUIZ BARSI — Rei dos Dividendos (Brasil)
// ─────────────────────────────────────────────
function avaliarBarsi(m, setor, industria, divs) {
  const perene = setorEhPerene(setor, industria);
  const dyPct = m.dy != null ? m.dy * 100 : null;
  const marketCapBi = m.marketCap != null ? m.marketCap : null;

  // Métricas da rota de dividendos
  const anosConsec = divs?.metricas?.anosConsecutivos ?? null;
  const estabilidade = divs?.metricas?.estabilidade ?? null;
  const classificacaoDiv = divs?.classificacao?.label || null;
  const armadilha = divs?.armadilhaDividendos?.risco === true;
  const ehAristocrata =
    classificacaoDiv === "ARISTOCRATA" ||
    classificacaoDiv === "PAGADORA CONSISTENTE";

  const criterios = [
    crit(
      "Setor perene",
      "Energia, saneamento, bancos, telecom ou seguros",
      perene ? "✓ setor perene" : setor || "—",
      perene
    ),
    crit(
      "DY acima de 6%",
      "Pagador consistente de dividendos",
      dyPct != null ? `${dyPct.toFixed(2)}%` : "—",
      dyPct != null && dyPct > 6
    ),
    crit(
      "Empresa de grande porte",
      "Market Cap acima de R$ 10 bi",
      marketCapBi != null ? `R$ ${marketCapBi.toFixed(0)} bi` : "—",
      marketCapBi != null && marketCapBi > 10
    ),
    crit(
      "Lucratividade consistente",
      "Margem líquida positiva",
      fmtVal(m.margemLiquidaPct, "%", 1),
      m.margemLiquidaPct != null && m.margemLiquidaPct > 0
    ),
    crit(
      "Geração de caixa",
      "FCO positivo sustenta proventos",
      m.fco != null ? `R$ ${m.fco.toFixed(1)} bi` : "—",
      m.fco != null && m.fco > 0
    ),
    crit(
      "Estrutura saudável",
      "Dívida/EBITDA abaixo de 3x",
      fmtVal(m.dividaLiquidaEbitda, "x", 2),
      m.dividaLiquidaEbitda != null && m.dividaLiquidaEbitda < 3
    ),
  ];

  // 🆕 Critérios extras se temos dados de dividendos
  if (divs) {
    criterios.push(
      crit(
        "Tradição como pagadora",
        "10+ anos pagando dividendos",
        anosConsec != null ? `${anosConsec} anos consecutivos` : "—",
        anosConsec != null && anosConsec >= 10
      ),
      crit(
        "Previsibilidade dos proventos",
        "Histórico estável de pagamentos",
        estabilidade != null
          ? `índice ${(estabilidade * 100).toFixed(0)}/100`
          : "—",
        estabilidade != null && estabilidade >= 0.6
      ),
      crit(
        "Classificação ARISTOCRATA ou CONSISTENTE",
        "Perfil clássico de carteira previdenciária",
        classificacaoDiv || "—",
        ehAristocrata
      ),
      crit(
        "Não é armadilha de dividendos",
        "Yield sustentável, sem deterioração",
        armadilha
          ? `risco ${divs.armadilhaDividendos?.nivel || "—"}`
          : "ok",
        !armadilha
      )
    );
  }

  const aprovados = criterios.filter((c) => c.passa).length;

  return {
    id: "barsi",
    nome: "Luiz Barsi",
    subtitulo: "Rei dos Dividendos · BR",
    citacao: "Ações garantem o futuro.",
    filosofia:
      "Maior investidor pessoa física do Brasil. Método 'carteira previdenciária': comprar regularmente ações de empresas perenes (energia, bancos, telecom), com DY alto e estrutura sólida. Long-term holder por décadas.",
    corTema: "verde",
    criterios,
    aprovados,
    total: criterios.length,
    veredito: classificarVeredito(aprovados, criterios.length),
  };
}

// ─────────────────────────────────────────────
// AVALIA TODOS OS 6 MESTRES + GERA VEREDITO COLETIVO
// ─────────────────────────────────────────────
function avaliarMestres(metrics, setor, industria, divs) {
  try {
    const mestres = [
      avaliarGraham(metrics),
      avaliarBuffett(metrics),
      avaliarLynch(metrics, divs),
      avaliarGreenblatt(metrics),
      avaliarBazin(metrics, divs),
      avaliarBarsi(metrics, setor, industria, divs),
    ];

    // Veredito coletivo
    const aprovados = mestres.filter((m) => m.veredito === "aprovado").length;
    const parciais = mestres.filter((m) => m.veredito === "parcial").length;
    const reprovados = mestres.filter((m) => m.veredito === "reprovado").length;

    let resumoColetivo;
    if (aprovados >= 4) {
      resumoColetivo = `${aprovados} de 6 mestres aprovariam — empresa com fundamentos amplamente reconhecidos.`;
    } else if (aprovados + parciais >= 4) {
      resumoColetivo = `${aprovados} aprovados e ${parciais} parciais — fundamentos respeitáveis com algumas ressalvas.`;
    } else if (reprovados >= 4) {
      resumoColetivo = `${reprovados} de 6 mestres reprovariam — fundamentos pressionados pela maioria dos critérios clássicos.`;
    } else {
      resumoColetivo = `Opiniões divididas: ${aprovados} aprovados, ${parciais} parciais, ${reprovados} reprovados.`;
    }

    console.log(
      `🎓 MESTRES: ${aprovados}✓ ${parciais}~ ${reprovados}✗ → ${resumoColetivo}`
    );

    return {
      mestres,
      resumoColetivo,
      stats: { aprovados, parciais, reprovados, total: 6 },
    };
  } catch (e) {
    console.log(`⚠️ Erro avaliando mestres: ${e.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// HANDLER COM TRY/CATCH GRANULAR
// ─────────────────────────────────────────────

export async function GET(request) {
  let ticker = "?";

  try {
    const { searchParams } = new URL(request.url);
    ticker = searchParams.get("ticker")?.toUpperCase()?.trim();

    if (!ticker) {
      return NextResponse.json({ error: "Ticker não informado." }, { status: 400 });
    }

    const modules = encodeURIComponent(
      "summaryProfile,defaultKeyStatistics,financialData,balanceSheetHistory,incomeStatementHistory"
    );
    const url = `https://brapi.dev/api/quote/${ticker}?modules=${modules}&dividends=true&token=${BRAPI_TOKEN}`;

    // 🚀 Roda Brapi + Dividendos em PARALELO pra economizar tempo
    const baseUrl = new URL(request.url).origin;

    const [response, divsData] = await Promise.all([
      fetch(url, { next: { revalidate: 60 * 60 * 12 } }),
      buscarDividendosInternos(ticker, baseUrl),
    ]);

    if (!response.ok) {
      console.error(`❌ Brapi retornou status ${response.status} para ${ticker}`);
      return NextResponse.json(
        { error: `Brapi indisponível (status ${response.status})` },
        { status: 502 }
      );
    }

    const json = await response.json();
    const ativo = json?.results?.[0];

    if (!ativo) {
      return NextResponse.json({ error: "Ativo não encontrado." }, { status: 404 });
    }

    console.log(`\n══════ [${ticker}] V8 INICIANDO ══════`);

    const stats = ativo.defaultKeyStatistics || {};
    const fin = ativo.financialData || {};
    const profile = ativo.summaryProfile || {};

    // Preço atual
    const precoAtual =
      n(ativo.regularMarketPrice) ||
      n(fin.currentPrice) ||
      n(ativo.price) ||
      0;

    // LPA, VPA, P/L, P/VP
    const lpa =
      n(stats.trailingEps) ||
      n(stats.earningsPerShare) ||
      n(ativo.earningsPerShare);
    const vpa = n(stats.bookValue);

    let pl = null;
    if (lpa && lpa > 0 && precoAtual > 0) {
      pl = precoAtual / lpa;
    } else {
      pl = n(ativo.priceEarnings) || n(stats.trailingPE);
    }

    let pvp = null;
    if (vpa && vpa > 0 && precoAtual > 0) {
      pvp = precoAtual / vpa;
    } else {
      pvp = n(stats.priceToBook);
    }

    // DY
    const cashDividends =
      ativo?.dividendsData?.cashDividends || ativo?.cashDividends || [];
    const dy = calcularDY12mDeCashDividends(cashDividends, precoAtual);

    // Patrimônio
    const patrimonio = extrairPatrimonio(ativo);

    // DRE
    const dre = extrairDREMaisRecente(ativo);

    // Métricas básicas
    const roe = n(fin.returnOnEquity);
    const margem = n(fin.profitMargins);
    const crescLucroRaw = n(fin.earningsGrowth);
    const crescReceitaRaw = n(fin.revenueGrowth);
    const liquidez = n(fin.currentRatio);
    const fco = n(fin.operatingCashflow);
    const fcf = n(fin.freeCashflow);
    const marketCap = n(ativo.marketCap ?? stats.marketCap);
    const ebitda = n(fin.ebitda);
    const margemEbitda = n(fin.ebitdaMargins);
    const totalDebt = n(fin.totalDebt);
    const totalCash = n(fin.totalCash);

    // EBIT e Margem EBIT (try defensivo)
    let ebitAnual = null;
    let receitaAnual = null;
    let margemEbit = null;
    try {
      ebitAnual = n(dre?.ebit) || n(dre?.cleanEbit) || n(dre?.operatingIncome);
      receitaAnual = n(dre?.totalRevenue) || n(fin.totalRevenue);
      if (ebitAnual != null && receitaAnual && receitaAnual > 0) {
        margemEbit = ebitAnual / receitaAnual;
      }
    } catch (e) {
      console.log(`⚠️  Erro EBIT/Margem EBIT: ${e.message}`);
    }

    // ROIC (já tem try interno)
    const roic = calcularROIC(dre, patrimonio, totalDebt);

    // Lucro líquido pra Qualidade do Lucro
    const lucroLiquidoAnual =
      n(stats.netIncomeToCommon) || n(dre?.netIncome) || null;

    // Qualidade do Lucro (já tem try interno)
    const qualidadeLucro = calcularQualidadeLucro(fcf, lucroLiquidoAnual);

    // Dívida líquida
    const dividaLiquida =
      totalDebt != null && totalCash != null ? totalDebt - totalCash : null;

    // Dív.Líq./Patrim.
    let dividaPatrimonio = null;
    try {
      if (dividaLiquida != null && patrimonio && patrimonio > 0) {
        dividaPatrimonio = dividaLiquida / patrimonio;
      } else {
        const raw = n(fin.debtToEquity);
        if (raw != null) dividaPatrimonio = raw > 10 ? raw / 100 : raw;
      }
    } catch (e) {
      console.log(`⚠️  Erro Dív./PL: ${e.message}`);
    }

    const dividaLiquidaEbitda =
      dividaLiquida != null && ebitda != null && ebitda !== 0
        ? dividaLiquida / ebitda
        : null;

    const enterpriseValue =
      marketCap != null && dividaLiquida != null
        ? marketCap + dividaLiquida
        : null;
    const evEbitda =
      enterpriseValue != null && ebitda != null && ebitda !== 0
        ? enterpriseValue / ebitda
        : null;

    // Log final defensivo
    console.log(`📊 P/L: ${pl} | P/VP: ${pvp} | DY: ${dy}`);
    console.log(`🎯 ROIC: ${roic} | ROE: ${roe} | Q.Lucro: ${qualidadeLucro}`);
    console.log(`💰 Mg.EBITDA: ${margemEbitda} | Mg.EBIT: ${margemEbit} | Mg.Líq: ${margem}`);
    console.log(`🏛️  Dív/PL: ${dividaPatrimonio} | Dív/EBITDA: ${dividaLiquidaEbitda}`);

    // Crescimentos normalizados
    const crescLucroNorm =
      crescLucroRaw != null && Math.abs(crescLucroRaw) > 3
        ? crescLucroRaw / 100
        : crescLucroRaw;
    const crescReceitaNorm =
      crescReceitaRaw != null && Math.abs(crescReceitaRaw) > 3
        ? crescReceitaRaw / 100
        : crescReceitaRaw;

    // ═══════════════════════════════════════════
    // SCORES
    // ═══════════════════════════════════════════

    const valuationScore = media([
      scorePL(pl),
      scorePVP(pvp),
      scoreDY(dy),
      scoreEvEbitda(evEbitda),
    ]);

    const qualidadeScore = media([
      scoreROIC(roic), // peso 1
      scoreROIC(roic), // peso 2 (institucional)
      scoreROE(roe),
      scoreMargem(margem),
      scoreMargemEbitda(margemEbitda),
      scoreMargemEbit(margemEbit),
      scoreQualidadeLucro(qualidadeLucro),
      scoreCrescimento(crescLucroNorm),
      scoreCrescimento(crescReceitaNorm),
    ]);

    const robustezScore = media([
      scoreDivida(dividaPatrimonio),
      scoreDividaEbitda(dividaLiquidaEbitda),
      scoreLiquidez(liquidez),
      scoreCaixa(fco, fcf),
      scoreMarketCap(marketCap),
    ]);

    const scoreFinal = Math.round(
      valuationScore * 0.32 + qualidadeScore * 0.43 + robustezScore * 0.25
    );

    console.log(`✅ [${ticker}] Scores: V=${valuationScore} Q=${qualidadeScore} R=${robustezScore} | FINAL=${scoreFinal}`);

    // ═══════════════════════════════════════════
    // 🎓 AVALIAÇÃO DOS 6 MESTRES (consome métricas)
    // ═══════════════════════════════════════════
    const metricsParaMestres = {
      pl,
      pvp,
      dy,
      evEbitda,
      roicPct: roic != null ? roic * 100 : null,
      roePct: roe != null ? roe * 100 : null,
      margemLiquidaPct: margem != null ? margem * 100 : null,
      margemEbitdaPct: margemEbitda != null ? margemEbitda * 100 : null,
      margemEbitPct: margemEbit != null ? margemEbit * 100 : null,
      qualidadeLucro,
      crescLucroPct: crescLucroNorm != null ? crescLucroNorm * 100 : null,
      dividaPatrimonio,
      dividaLiquidaEbitda,
      liquidez,
      fco: bi(fco),
      fcf: bi(fcf),
      marketCap: bi(marketCap),
    };

    const mestresResult = avaliarMestres(
      metricsParaMestres,
      profile.sectorDisp || profile.sector,
      profile.industryDisp || profile.industry,
      divsData
    );

    return NextResponse.json({
      ticker,
      empresa: ativo.longName || ativo.shortName || ticker,
      setor: profile.sectorDisp || profile.sector || "—",
      industria: profile.industryDisp || profile.industry || "—",

      scoreFinal,

      valuation: {
        score: valuationScore,
        desc: textoPilar(valuationScore, "valuation"),
      },
      qualidade: {
        score: qualidadeScore,
        desc: textoPilar(qualidadeScore, "qualidade"),
      },
      robustez: {
        score: robustezScore,
        desc: textoPilar(robustezScore, "robustez"),
      },

      leitura: gerarLeitura(
        scoreFinal,
        valuationScore,
        qualidadeScore,
        robustezScore
      ),

      metrics: {
        pl: pl != null ? Number(pl.toFixed(2)) : null,
        pvp: pvp != null ? Number(pvp.toFixed(2)) : null,
        dy,
        evEbitda: evEbitda != null ? Number(evEbitda.toFixed(2)) : null,
        lpa: lpa != null ? Number(lpa.toFixed(2)) : null,
        vpa: vpa != null ? Number(vpa.toFixed(2)) : null,

        roic: pct(roic),
        roe: pct(roe),
        margem: pct(margem),
        margemEbitda: pct(margemEbitda),
        margemEbit: pct(margemEbit),
        qualidadeLucro:
          qualidadeLucro != null
            ? Number(qualidadeLucro.toFixed(2))
            : null,
        crescLucro: pctSeguro(crescLucroRaw),
        crescReceita: pctSeguro(crescReceitaRaw),

        dividaPatrimonio:
          dividaPatrimonio != null
            ? Number(dividaPatrimonio.toFixed(2))
            : null,
        dividaLiquidaEbitda:
          dividaLiquidaEbitda != null
            ? Number(dividaLiquidaEbitda.toFixed(2))
            : null,
        liquidez,
        fco: bi(fco),
        fcf: bi(fcf),

        ebitda: bi(ebitda),
        ebit: bi(ebitAnual),
        dividaLiquida: bi(dividaLiquida),
        marketCap: bi(marketCap),
        patrimonio: bi(patrimonio),
        lucroLiquido: bi(lucroLiquidoAnual),
      },

      classificacoes: {
        roic: classROIC(roic),
        qualidadeLucro: classQualidadeLucro(qualidadeLucro),
        evEbitda: classEvEbitda(evEbitda),
        margemEbitda: classMargemEbitda(margemEbitda),
        margemEbit: classMargemEbit(margemEbit),
        dividaLiquidaEbitda: classDividaEbitda(dividaLiquidaEbitda),
      },

      explicacoes: {
        valuation:
          "Mede se o preço atual parece barato ou caro em relação aos fundamentos da empresa.",
        qualidade:
          "Mede a capacidade da empresa gerar lucro com eficiência operacional e criar valor sobre o capital investido.",
        robustez:
          "Mede a saúde financeira e capacidade estrutural da empresa.",
        equilibrio:
          "Mostra se os fundamentos estão equilibrados ou dependem de apenas um ponto forte.",
      },

      meta: {
        fonte: "Brapi",
        urlFonte: "https://brapi.dev",
        observacao:
          "Indicadores calculados a partir de dados da Brapi. Pequenas divergências podem ocorrer comparado a outras fontes (StatusInvest, Fundamentus, etc.) devido a diferenças no número de ações em circulação utilizado e na metodologia de cálculo do lucro líquido.",
      },

      // 🎓 OS 6 MESTRES DO INVESTIMENTO
      mestres: mestresResult?.mestres || [],
      vereditoColetivo: mestresResult?.resumoColetivo || null,
      mestresStats: mestresResult?.stats || null,

      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`❌❌❌ Erro fatal rota fundamentalista [${ticker}]:`, error);
    console.error(`Stack trace:`, error.stack);
    return NextResponse.json(
      {
        error: "Erro interno ao gerar análise fundamentalista.",
        detalhe: error.message,
        ticker,
      },
      { status: 500 }
    );
  }
}
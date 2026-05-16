// src/app/api/fundamentalista/route.js
// V9.1 — V9 + CAMPO FORÇA (magnitude) + TIEBREAKER nos 6 robôs
// Cada robô agora retorna: score (binário, aprovados/total), forca (magnitude 0-100),
// forcaPrecisa (com decimais pra ranking), tiebreaker (métrica-âncora pra desempate).
// Permite ranking detalhado no screener mesmo com scores iguais.

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

// ═══════════════════════════════════════════════════════════════════
// 🤖 OS 6 ROBÔS QUANTITATIVOS
// Avalia o ativo através de filosofias quantitativas estabelecidas:
// Momentum Alpha, Quality Machine, Deep Value, Trend Matrix,
// Volatility Shield, Smart Dividend
//
// Cada robô tem critérios binários + score (aprovados/total × 100)
// Fontes acadêmicas identificáveis (papers reais)
// ═══════════════════════════════════════════════════════════════════

// Classifica nível de alinhamento por score
function classificarAlinhamentoRobo(score) {
  if (score >= 90) return "excelente";
  if (score >= 75) return "forte";
  if (score >= 60) return "moderado";
  if (score >= 40) return "fraco";
  return "fora";
}

// Converte ratio em score 0-100 (honesto, sem pesos arbitrários)
function calcularScoreRobo(aprovados, total) {
  if (total === 0) return 0;
  return Math.round((aprovados / total) * 100);
}

// ─────────────────────────────────────────────
// 💪 HELPERS DE FORÇA (MAGNITUDE)
// ─────────────────────────────────────────────

// Normaliza valor para 0-100 (quanto MAIOR melhor)
function normalizar(v, min, max) {
  if (v == null || isNaN(v)) return null;
  const clamped = Math.max(min, Math.min(max, v));
  return ((clamped - min) / (max - min)) * 100;
}

// Inverte: quanto MENOR melhor (P/L, beta, vol, dívida, etc)
function inverter(v, min, max) {
  if (v == null || isNaN(v) || v < 0) return null;
  const clamped = Math.max(min, Math.min(max, v));
  return ((max - clamped) / (max - min)) * 100;
}

// Calcula média ignorando nulls (mais justo)
function mediaJusta(valores) {
  const validos = valores.filter((v) => v != null && !isNaN(v));
  if (validos.length === 0) return 0;
  return validos.reduce((acc, v) => acc + v, 0) / validos.length;
}

// ─────────────────────────────────────────────
// 🔴 MOMENTUM ALPHA — força relativa e tendência persistente
// Fonte: Jegadeesh & Titman (1993)
// Dados: /api/quant (passado como parâmetro)
// ─────────────────────────────────────────────
function avaliarMomentumAlpha(quantData) {
  // Se quantData não veio (não tem essa rota ou falhou), retorna indisponível
  if (!quantData || quantData.error) {
    return roboIndisponivel("momentum_alpha", "Momentum Alpha");
  }

  const ret12m = quantData?.retornos?.ano;
  const ret6m = quantData?.retornos?.seisMeses;
  const ret3m = quantData?.retornos?.tresMeses;
  const sharpe = quantData?.ajustado?.sharpe;
  const alfa = quantData?.mercado?.alfa;
  const beta = quantData?.mercado?.beta;

  const criterios = [
    crit(
      "Retorno 12 meses positivo",
      "Persistência da tendência longa",
      ret12m != null ? `${(ret12m * 100).toFixed(1)}%` : "—",
      ret12m != null && ret12m > 0
    ),
    crit(
      "Retorno 6 meses positivo",
      "Tendência de médio prazo",
      ret6m != null ? `${(ret6m * 100).toFixed(1)}%` : "—",
      ret6m != null && ret6m > 0
    ),
    crit(
      "Retorno 3 meses positivo",
      "Aceleração de curto prazo",
      ret3m != null ? `${(ret3m * 100).toFixed(1)}%` : "—",
      ret3m != null && ret3m > 0
    ),
    crit(
      "Sharpe acima de 0.5",
      "Retorno saudável para o risco",
      sharpe != null ? sharpe.toFixed(2) : "—",
      sharpe != null && sharpe > 0.5
    ),
    crit(
      "Alfa positivo vs Ibovespa",
      "Supera o mercado de referência",
      alfa != null ? `${(alfa * 100).toFixed(1)}%` : "—",
      alfa != null && alfa > 0
    ),
    crit(
      "Beta acima de 0.7",
      "Captura movimentos do mercado",
      beta != null ? beta.toFixed(2) : "—",
      beta != null && beta > 0.7
    ),
  ];

  const aprovados = criterios.filter((c) => c.passa).length;
  const total = criterios.length;
  const score = calcularScoreRobo(aprovados, total);

  // 💪 FORÇA — fórmula do Vinícius: retorno médio ajustado ao risco
  // (ret3m + ret6m + ret12m) / 3 / vol → risk-adjusted return
  let forcaPrecisa = 0;
  let tiebreaker = 0;
  if (
    ret3m != null &&
    ret6m != null &&
    ret12m != null &&
    quantData?.risco?.volatilidadeAnual != null &&
    quantData.risco.volatilidadeAnual > 0
  ) {
    const retMedio = (ret3m + ret6m + ret12m) / 3;
    const vol = quantData.risco.volatilidadeAnual;
    const forcaRaw = retMedio / vol; // risk-adjusted return
    // Normaliza 0 a 1.5 → 0 a 100 (acima de 1.5 é excepcional)
    forcaPrecisa = normalizar(forcaRaw, 0, 1.5) ?? 0;
    tiebreaker = ret12m; // desempate por retorno 12m bruto
  }
  const forca = Math.round(forcaPrecisa);

  return {
    id: "momentum_alpha",
    nome: "Momentum Alpha",
    subtitulo: "Força Relativa · Tendência",
    citacao: "O que sobe com força, continua subindo.",
    filosofia:
      "Busca ativos com tendência persistente e força relativa superior ao mercado. Baseado no Momentum Factor — empresas vencedoras do passado tendem a continuar vencendo no curto/médio prazo.",
    corTema: "vermelho",
    criterios,
    aprovados,
    total,
    score,
    forca,
    forcaPrecisa: Math.round(forcaPrecisa * 100) / 100,
    tiebreaker,
    alinhamento: classificarAlinhamentoRobo(score),
    veredito: classificarVeredito(aprovados, total),
  };
}

// ─────────────────────────────────────────────
// 🔵 QUALITY MACHINE — eficiência operacional e resiliência
// Fonte: Asness, Frazzini & Pedersen (2019) — "Quality Minus Junk"
// Dados: métricas fundamentalistas
// ─────────────────────────────────────────────
function avaliarQualityMachine(m) {
  const criterios = [
    crit(
      "ROE acima de 15%",
      "Retorno sobre patrimônio elevado",
      fmtVal(m.roePct, "%", 1),
      m.roePct != null && m.roePct > 15
    ),
    crit(
      "ROIC acima de 15%",
      "Eficiência sobre capital investido",
      fmtVal(m.roicPct, "%", 1),
      m.roicPct != null && m.roicPct > 15
    ),
    crit(
      "Margem líquida acima de 10%",
      "Lucratividade saudável do negócio",
      fmtVal(m.margemLiquidaPct, "%", 1),
      m.margemLiquidaPct != null && m.margemLiquidaPct > 10
    ),
    crit(
      "Margem EBITDA acima de 20%",
      "Geração operacional robusta",
      fmtVal(m.margemEbitdaPct, "%", 1),
      m.margemEbitdaPct != null && m.margemEbitdaPct > 20
    ),
    crit(
      "Dívida/EBITDA abaixo de 2x",
      "Endividamento sob controle",
      fmtVal(m.dividaLiquidaEbitda, "x", 2),
      m.dividaLiquidaEbitda != null && m.dividaLiquidaEbitda < 2
    ),
    crit(
      "Qualidade do lucro acima de 0.7",
      "Lucro contábil se converte em caixa",
      m.qualidadeLucro != null ? m.qualidadeLucro.toFixed(2) : "—",
      m.qualidadeLucro != null && m.qualidadeLucro > 0.7
    ),
  ];

  const aprovados = criterios.filter((c) => c.passa).length;
  const total = criterios.length;
  const score = calcularScoreRobo(aprovados, total);

  // 💪 FORÇA — média das magnitudes de qualidade
  const componentes = [
    normalizar(m.roePct, 0, 40),
    normalizar(m.roicPct, 0, 30),
    normalizar(m.margemLiquidaPct, 0, 30),
    normalizar(m.margemEbitdaPct, 0, 50),
    inverter(m.dividaLiquidaEbitda, 0, 4),
    normalizar(m.qualidadeLucro, 0, 1.5),
  ];
  const forcaPrecisa = mediaJusta(componentes);
  const forca = Math.round(forcaPrecisa);
  const tiebreaker = m.roicPct ?? 0; // ROIC é o "fator-âncora" do Quality

  return {
    id: "quality_machine",
    nome: "Quality Machine",
    subtitulo: "Excelência Operacional",
    citacao: "Empresas de qualidade compoundam ao longo do tempo.",
    filosofia:
      "Busca empresas com alta rentabilidade sobre capital (ROE, ROIC), margens saudáveis e baixo endividamento. Baseado no Quality Factor — ativos de alta qualidade têm retornos superiores ajustados ao risco no longo prazo.",
    corTema: "azul",
    criterios,
    aprovados,
    total,
    score,
    forca,
    forcaPrecisa: Math.round(forcaPrecisa * 100) / 100,
    tiebreaker,
    alinhamento: classificarAlinhamentoRobo(score),
    veredito: classificarVeredito(aprovados, total),
  };
}

// ─────────────────────────────────────────────
// 🟣 DEEP VALUE — ações descontadas e esquecidas
// Fonte: Fama & French (1992) — Value Factor (HML)
// Dados: métricas fundamentalistas
// ─────────────────────────────────────────────
function avaliarDeepValue(m) {
  const dyPct = m.dy != null ? m.dy * 100 : null;

  const criterios = [
    crit(
      "P/L abaixo de 10",
      "Múltiplo de lucro descontado",
      fmtVal(m.pl, "x", 1),
      m.pl != null && m.pl > 0 && m.pl < 10
    ),
    crit(
      "P/VP abaixo de 1.5",
      "Ação abaixo do valor patrimonial relativo",
      fmtVal(m.pvp, "x", 2),
      m.pvp != null && m.pvp > 0 && m.pvp < 1.5
    ),
    crit(
      "EV/EBITDA abaixo de 8",
      "Valor da empresa atrativo vs geração",
      fmtVal(m.evEbitda, "x", 1),
      m.evEbitda != null && m.evEbitda > 0 && m.evEbitda < 8
    ),
    crit(
      "DY acima de 4%",
      "Paga bem enquanto espera reprecificação",
      dyPct != null ? `${dyPct.toFixed(2)}%` : "—",
      dyPct != null && dyPct > 4
    ),
    crit(
      "Empresa lucrativa",
      "Margem líquida positiva",
      fmtVal(m.margemLiquidaPct, "%", 1),
      m.margemLiquidaPct != null && m.margemLiquidaPct > 0
    ),
    crit(
      "Geração de caixa positiva",
      "FCO positivo confirma a tese",
      m.fco != null ? `R$ ${m.fco.toFixed(1)} bi` : "—",
      m.fco != null && m.fco > 0
    ),
  ];

  const aprovados = criterios.filter((c) => c.passa).length;
  const total = criterios.length;
  const score = calcularScoreRobo(aprovados, total);

  // 💪 FORÇA — múltiplos baixos + DY + lucratividade
  const componentes = [
    inverter(m.pl, 0, 30),
    inverter(m.pvp, 0, 5),
    inverter(m.evEbitda, 0, 20),
    normalizar(dyPct, 0, 12),
    normalizar(m.margemLiquidaPct, 0, 30),
    m.fco != null && m.fco > 0 ? 100 : 0, // FCO positivo binário aqui
  ];
  const forcaPrecisa = mediaJusta(componentes);
  const forca = Math.round(forcaPrecisa);
  // Tiebreaker: 1/PL (quanto MENOR o PL maior o desempate)
  const tiebreaker = m.pl != null && m.pl > 0 ? 1 / m.pl : 0;

  return {
    id: "deep_value",
    nome: "Deep Value",
    subtitulo: "Caça Pechinchas Esquecidas",
    citacao: "O mercado exagera pessimismos.",
    filosofia:
      "Identifica ações descontadas em múltiplos como P/L, P/VP e EV/EBITDA, com geração de caixa positiva. Baseado no Value Factor (HML) — ações com alto valor contábil/preço historicamente superam o mercado.",
    corTema: "roxo",
    criterios,
    aprovados,
    total,
    score,
    forca,
    forcaPrecisa: Math.round(forcaPrecisa * 100) / 100,
    tiebreaker: Math.round(tiebreaker * 1000) / 1000,
    alinhamento: classificarAlinhamentoRobo(score),
    veredito: classificarVeredito(aprovados, total),
  };
}

// ─────────────────────────────────────────────
// 🟢 TREND MATRIX — alinhamento técnico em múltiplos horizontes
// Fonte: Faber (2007) — "A Quantitative Approach to Tactical Asset Allocation"
// Dados: /api/fluxo-carteira
// ─────────────────────────────────────────────
function avaliarTrendMatrix(fluxoData) {
  if (!fluxoData || fluxoData.error) {
    return roboIndisponivel("trend_matrix", "Trend Matrix");
  }

  const sinalCor = fluxoData?.sinal?.cor;
  const inclinacao = fluxoData?.sinal?.inclinacaoEma50;
  const close = fluxoData?.sinal?.close;

  // Tentamos extrair EMA12/EMA50 do último candle, se disponível
  const candles = Array.isArray(fluxoData?.candles) ? fluxoData.candles : [];
  const ultimoCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const ema12 = ultimoCandle?.ema12;
  const ema50 = ultimoCandle?.ema50;

  const distSuporte = fluxoData?.zonas?.distanciaSuporte;
  const distResist = fluxoData?.zonas?.distanciaResistencia;

  const criterios = [
    crit(
      "Sinal comprador",
      "Motor de fluxo indica regime de alta",
      sinalCor === "verde"
        ? "comprador"
        : sinalCor === "vermelho"
        ? "vendedor"
        : sinalCor === "amarelo"
        ? "transição"
        : "—",
      sinalCor === "verde"
    ),
    crit(
      "EMA12 acima da EMA50",
      "Curto prazo supera estrutural",
      ema12 != null && ema50 != null
        ? `${ema12.toFixed(2)} vs ${ema50.toFixed(2)}`
        : "—",
      ema12 != null && ema50 != null && ema12 > ema50
    ),
    crit(
      "EMA50 inclinação ascendente",
      "Tendência estrutural de alta",
      inclinacao === "sobe" ? "sobe" : inclinacao === "desce" ? "desce" : "—",
      inclinacao === "sobe"
    ),
    crit(
      "Preço acima da EMA50",
      "Preço respeita a estrutura primária",
      close != null && ema50 != null
        ? `${close.toFixed(2)} vs ${ema50.toFixed(2)}`
        : "—",
      close != null && ema50 != null && close > ema50
    ),
    crit(
      "Margem do suporte > 3%",
      "Distância confortável de defesa",
      distSuporte != null ? `${distSuporte.toFixed(1)}%` : "—",
      distSuporte != null && distSuporte > 3
    ),
    crit(
      "Resistência alcançável",
      "Espaço pra continuar subindo",
      distResist != null ? `${distResist.toFixed(1)}%` : "—",
      distResist != null && distResist > 1 && distResist < 15
    ),
  ];

  const aprovados = criterios.filter((c) => c.passa).length;
  const total = criterios.length;
  const score = calcularScoreRobo(aprovados, total);

  // 💪 FORÇA — qualidade da tendência
  const gapEMA =
    ema12 != null && ema50 != null && ema50 > 0
      ? ((ema12 - ema50) / ema50) * 100
      : null;
  const distPreco =
    close != null && ema50 != null && ema50 > 0
      ? ((close - ema50) / ema50) * 100
      : null;

  const componentes = [
    normalizar(gapEMA, -5, 10),
    normalizar(distPreco, -10, 15),
    inclinacao === "sobe" ? 100 : inclinacao === "lateral" ? 50 : 0,
    normalizar(distSuporte, 0, 15),
    distResist != null ? inverter(Math.abs(distResist), 1, 20) : null,
  ];
  const forcaPrecisa = mediaJusta(componentes);
  const forca = Math.round(forcaPrecisa);
  // Tiebreaker: gap percentual entre EMA12 e EMA50 (força da tendência)
  const tiebreaker = gapEMA ?? 0;

  return {
    id: "trend_matrix",
    nome: "Trend Matrix",
    subtitulo: "Alinhamento Técnico",
    citacao: "Tendência é amiga até virar.",
    filosofia:
      "Detecta tendência através de médias móveis (EMA12, EMA50) e zonas de suporte/resistência. Quando todos os horizontes estão alinhados de alta, a probabilidade de continuação aumenta. Inspirado em Tactical Asset Allocation de Faber.",
    corTema: "verde",
    criterios,
    aprovados,
    total,
    score,
    forca,
    forcaPrecisa: Math.round(forcaPrecisa * 100) / 100,
    tiebreaker: Math.round(tiebreaker * 100) / 100,
    alinhamento: classificarAlinhamentoRobo(score),
    veredito: classificarVeredito(aprovados, total),
  };
}

// ─────────────────────────────────────────────
// 🩶 VOLATILITY SHIELD — perfil defensivo, baixo risco
// Fonte: Ang, Hodrick, Xing & Zhang (2006) — Low-Volatility Anomaly
// Dados: /api/quant
// ─────────────────────────────────────────────
function avaliarVolatilityShield(quantData) {
  if (!quantData || quantData.error) {
    return roboIndisponivel("volatility_shield", "Volatility Shield");
  }

  const beta = quantData?.mercado?.beta;
  const vol = quantData?.risco?.volatilidadeAnual;
  const ddMax = quantData?.risco?.drawdownMaximo;
  const ddAtual = quantData?.risco?.drawdownAtual;
  const sortino = quantData?.ajustado?.sortino;
  const winRate = quantData?.comportamento?.winRate;

  const criterios = [
    crit(
      "Beta abaixo de 0.8",
      "Menos sensível aos movimentos do Ibov",
      beta != null ? beta.toFixed(2) : "—",
      beta != null && beta < 0.8
    ),
    crit(
      "Volatilidade abaixo de 30%",
      "Oscilações controladas",
      vol != null ? `${(vol * 100).toFixed(1)}%` : "—",
      vol != null && vol < 0.3
    ),
    crit(
      "Drawdown máximo abaixo de 25%",
      "Histórico sem quedas extremas",
      ddMax != null ? `${(Math.abs(ddMax) * 100).toFixed(1)}%` : "—",
      ddMax != null && Math.abs(ddMax) < 0.25
    ),
    crit(
      "Drawdown atual abaixo de 15%",
      "Não está afundado no momento",
      ddAtual != null ? `${(Math.abs(ddAtual) * 100).toFixed(1)}%` : "—",
      ddAtual != null && Math.abs(ddAtual) < 0.15
    ),
    crit(
      "Sortino acima de 0.5",
      "Boa relação retorno/risco de baixa",
      sortino != null ? sortino.toFixed(2) : "—",
      sortino != null && sortino > 0.5
    ),
    crit(
      "Win rate acima de 50%",
      "Mais dias positivos que negativos",
      winRate != null ? `${(winRate * 100).toFixed(1)}%` : "—",
      winRate != null && winRate > 0.5
    ),
  ];

  const aprovados = criterios.filter((c) => c.passa).length;
  const total = criterios.length;
  const score = calcularScoreRobo(aprovados, total);

  // 💪 FORÇA — quanto menor o risco, maior a força
  const componentes = [
    inverter(beta, 0, 1.5),
    vol != null ? inverter(vol * 100, 0, 50) : null,
    ddMax != null ? inverter(Math.abs(ddMax) * 100, 0, 50) : null,
    ddAtual != null ? inverter(Math.abs(ddAtual) * 100, 0, 30) : null,
    normalizar(sortino, 0, 3),
    winRate != null ? normalizar(winRate * 100, 40, 80) : null,
  ];
  const forcaPrecisa = mediaJusta(componentes);
  const forca = Math.round(forcaPrecisa);
  // Tiebreaker: Sortino (melhor métrica de qualidade defensiva)
  const tiebreaker = sortino ?? 0;

  return {
    id: "volatility_shield",
    nome: "Volatility Shield",
    subtitulo: "Perfil Defensivo",
    citacao: "Sobreviver é mais importante que maximizar.",
    filosofia:
      "Busca ativos de baixa volatilidade e drawdown contido. Baseado na Low-Volatility Anomaly — ações menos voláteis historicamente entregam retornos ajustados ao risco superiores às mais voláteis.",
    corTema: "cinza",
    criterios,
    aprovados,
    total,
    score,
    forca,
    forcaPrecisa: Math.round(forcaPrecisa * 100) / 100,
    tiebreaker: Math.round(tiebreaker * 100) / 100,
    alinhamento: classificarAlinhamentoRobo(score),
    veredito: classificarVeredito(aprovados, total),
  };
}

// ─────────────────────────────────────────────
// 💚 SMART DIVIDEND — proventos sustentáveis
// Fonte: Arnott & Asness (2003) — "Surprise! Higher Dividends = Higher Earnings Growth"
// Dados: /api/dividendos
// ─────────────────────────────────────────────
function avaliarSmartDividend(divs) {
  if (!divs) {
    return roboIndisponivel("smart_dividend", "Smart Dividend");
  }

  const dyPct = divs?.metricas?.dy12m != null ? divs.metricas.dy12m * 100 : null;
  const anosConsec = divs?.metricas?.anosConsecutivos;
  const cagrPct =
    divs?.metricas?.cagrDividendos != null
      ? divs.metricas.cagrDividendos * 100
      : null;
  const estabilidade = divs?.metricas?.estabilidade;
  const armadilha = divs?.armadilhaDividendos?.risco === true;
  const classificacao = divs?.classificacao?.label;

  const criterios = [
    crit(
      "DY 12m acima de 4%",
      "Distribuição relevante de proventos",
      dyPct != null ? `${dyPct.toFixed(2)}%` : "—",
      dyPct != null && dyPct > 4
    ),
    crit(
      "Pagando há 5+ anos",
      "Histórico consistente de distribuição",
      anosConsec != null ? `${anosConsec} anos consecutivos` : "—",
      anosConsec != null && anosConsec >= 5
    ),
    crit(
      "CAGR de dividendos positivo",
      "Proventos crescem ao longo do tempo",
      cagrPct != null ? `${cagrPct.toFixed(1)}%/ano` : "—",
      cagrPct != null && cagrPct > 0
    ),
    crit(
      "Estabilidade acima de 0.5",
      "Pagamentos previsíveis e regulares",
      estabilidade != null ? `índice ${(estabilidade * 100).toFixed(0)}/100` : "—",
      estabilidade != null && estabilidade > 0.5
    ),
    crit(
      "Não é armadilha de dividendos",
      "Yield sustentado pelos fundamentos",
      armadilha
        ? `risco ${divs?.armadilhaDividendos?.nivel || "—"}`
        : "ok",
      !armadilha
    ),
    crit(
      "Classificação consistente",
      "Não é pagadora irregular",
      classificacao || "—",
      classificacao && classificacao !== "PAGADORA IRREGULAR" &&
        classificacao !== "BAIXA RELEVÂNCIA EM DIVIDENDOS"
    ),
  ];

  const aprovados = criterios.filter((c) => c.passa).length;
  const total = criterios.length;
  const score = calcularScoreRobo(aprovados, total);

  // 💪 FORÇA — qualidade dos proventos
  const componentes = [
    normalizar(dyPct, 0, 15),
    normalizar(anosConsec, 0, 30),
    normalizar(cagrPct, 0, 25),
    estabilidade != null ? normalizar(estabilidade * 100, 0, 100) : null,
    armadilha ? 0 : 80, // penaliza forte se armadilha
    classificacao === "ARISTOCRATA"
      ? 100
      : classificacao === "PAGADORA CONSISTENTE"
      ? 80
      : classificacao === "PAGADORA OCASIONAL"
      ? 50
      : 20,
  ];
  const forcaPrecisa = mediaJusta(componentes);
  const forca = Math.round(forcaPrecisa);
  // Tiebreaker: DY × anos consecutivos (renda × consistência)
  const tiebreaker =
    dyPct != null && anosConsec != null ? dyPct * anosConsec : 0;

  return {
    id: "smart_dividend",
    nome: "Smart Dividend",
    subtitulo: "Renda Passiva Sustentável",
    citacao: "Dividendos sustentáveis > yield extremo.",
    filosofia:
      "Identifica empresas com geração consistente e crescente de dividendos, evitando armadilhas de yield. Baseado em Arnott & Asness — dividendos altos e sustentáveis correlacionam com crescimento futuro de lucros.",
    corTema: "verde-dinheiro",
    criterios,
    aprovados,
    total,
    score,
    forca,
    forcaPrecisa: Math.round(forcaPrecisa * 100) / 100,
    tiebreaker: Math.round(tiebreaker * 100) / 100,
    alinhamento: classificarAlinhamentoRobo(score),
    veredito: classificarVeredito(aprovados, total),
  };
}

// ─────────────────────────────────────────────
// HELPER — robô indisponível (dados ausentes)
// ─────────────────────────────────────────────
function roboIndisponivel(id, nome) {
  return {
    id,
    nome,
    subtitulo: "—",
    citacao: "—",
    filosofia: "Dados indisponíveis para avaliação no momento.",
    corTema: "cinza",
    criterios: [],
    aprovados: 0,
    total: 0,
    score: 0,
    forca: 0,
    forcaPrecisa: 0,
    tiebreaker: 0,
    alinhamento: "fora",
    veredito: "indisponivel",
  };
}

// ─────────────────────────────────────────────
// 🤖 BUSCA DADOS DA ROTA /api/quant PRA ALIMENTAR OS ROBÔS
// ─────────────────────────────────────────────
async function buscarQuantInterno(ticker, baseUrl) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(
      `${baseUrl}/api/quant?ticker=${encodeURIComponent(ticker)}`,
      { signal: controller.signal, next: { revalidate: 60 * 60 * 12 } }
    );

    clearTimeout(timeoutId);

    if (!resp.ok) {
      console.log(`⚠️  Quant interno retornou status ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    if (data.error) {
      console.log(`⚠️  Quant interno retornou erro: ${data.error}`);
      return null;
    }

    console.log(
      `🔗 Quant interno OK: score=${data.scores?.final}, sharpe=${data.ajustado?.sharpe?.toFixed(2)}, beta=${data.mercado?.beta?.toFixed(2)}`
    );
    return data;
  } catch (e) {
    console.log(
      `⚠️  Erro buscando quant interno: ${e.message}${e.name === "AbortError" ? " (timeout)" : ""}`
    );
    return null;
  }
}

// ─────────────────────────────────────────────
// 🤖 BUSCA DADOS DA ROTA /api/fluxo-carteira PRA ALIMENTAR TREND MATRIX
// ─────────────────────────────────────────────
async function buscarFluxoInterno(ticker, baseUrl) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const resp = await fetch(
      `${baseUrl}/api/fluxo-carteira?ticker=${encodeURIComponent(ticker)}`,
      { signal: controller.signal, next: { revalidate: 60 * 60 * 12 } }
    );

    clearTimeout(timeoutId);

    if (!resp.ok) {
      console.log(`⚠️  Fluxo interno retornou status ${resp.status}`);
      return null;
    }

    const data = await resp.json();
    if (data.error) {
      console.log(`⚠️  Fluxo interno retornou erro: ${data.error}`);
      return null;
    }

    console.log(
      `🔗 Fluxo interno OK: sinal=${data.sinal?.cor}, inclinacao=${data.sinal?.inclinacaoEma50}`
    );
    return data;
  } catch (e) {
    console.log(
      `⚠️  Erro buscando fluxo interno: ${e.message}${e.name === "AbortError" ? " (timeout)" : ""}`
    );
    return null;
  }
}

// ─────────────────────────────────────────────
// 🤖 ORQUESTRA OS 6 ROBÔS + VEREDITO COLETIVO
// ─────────────────────────────────────────────
function avaliarRobos(metrics, quantData, fluxoData, divs) {
  try {
    const robos = [
      avaliarMomentumAlpha(quantData),
      avaliarQualityMachine(metrics),
      avaliarDeepValue(metrics),
      avaliarTrendMatrix(fluxoData),
      avaliarVolatilityShield(quantData),
      avaliarSmartDividend(divs),
    ];

    // Stats — só conta robôs que tiveram dados
    const disponiveis = robos.filter((r) => r.veredito !== "indisponivel");

    const aprovados = disponiveis.filter((r) => r.veredito === "aprovado").length;
    const parciais = disponiveis.filter((r) => r.veredito === "parcial").length;
    const reprovados = disponiveis.filter((r) => r.veredito === "reprovado").length;
    const indisponiveis = robos.length - disponiveis.length;

    // Score médio dos disponíveis
    const scoreMedio =
      disponiveis.length > 0
        ? Math.round(
            disponiveis.reduce((acc, r) => acc + r.score, 0) /
              disponiveis.length
          )
        : 0;

    // 💪 Força média dos disponíveis
    const forcaMedia =
      disponiveis.length > 0
        ? Math.round(
            disponiveis.reduce((acc, r) => acc + r.forca, 0) /
              disponiveis.length
          )
        : 0;

    // Perfil dominante — quais robôs aprovaram?
    const aprovaram = disponiveis
      .filter((r) => r.veredito === "aprovado")
      .map((r) => r.nome);

    // Texto coletivo
    let resumoColetivo;
    if (disponiveis.length === 0) {
      resumoColetivo = "Dados quantitativos indisponíveis no momento.";
    } else if (aprovados === 0) {
      resumoColetivo = `Nenhum dos ${disponiveis.length} robôs quantitativos analisados aprovou o ativo nas suas filosofias. Score médio: ${scoreMedio}/100.`;
    } else if (aprovados === disponiveis.length) {
      resumoColetivo = `Todos os ${disponiveis.length} robôs aprovaram — perfil quantitativo excepcional. Score médio: ${scoreMedio}/100.`;
    } else {
      const listaAprovaram = aprovaram.join(", ");
      resumoColetivo = `${aprovados} de ${disponiveis.length} robôs aprovaram: ${listaAprovaram}. Score médio: ${scoreMedio}/100.`;
    }

    console.log(
      `🤖 ROBÔS: ${aprovados}✓ ${parciais}~ ${reprovados}✗ ${indisponiveis}? → score médio ${scoreMedio} · força média ${forcaMedia}`
    );

    return {
      robos,
      resumoColetivo,
      stats: {
        aprovados,
        parciais,
        reprovados,
        indisponiveis,
        total: robos.length,
        disponiveis: disponiveis.length,
        scoreMedio,
        forcaMedia,
      },
    };
  } catch (e) {
    console.error(`❌ Erro avaliando robôs:`, e);
    return null;
  }
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

    // 🚀 Roda Brapi + Dividendos + Quant + Fluxo em PARALELO
    // (Dividendos alimenta Mestres + Smart Dividend robo)
    // (Quant alimenta Momentum Alpha + Volatility Shield)
    // (Fluxo alimenta Trend Matrix)
    const baseUrl = new URL(request.url).origin;

    const [response, divsData, quantData, fluxoData] = await Promise.all([
      fetch(url, { next: { revalidate: 60 * 60 * 12 } }),
      buscarDividendosInternos(ticker, baseUrl),
      buscarQuantInterno(ticker, baseUrl),
      buscarFluxoInterno(ticker, baseUrl),
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

    console.log(`\n══════ [${ticker}] V9.1 INICIANDO ══════`);

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

    // 🤖 Avalia os 6 robôs quantitativos
    const robosResult = avaliarRobos(
      metricsParaMestres,
      quantData,
      fluxoData,
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

      // 🤖 OS 6 ROBÔS QUANTITATIVOS
      robos: robosResult?.robos || [],
      vereditoColetivoRobos: robosResult?.resumoColetivo || null,
      robosStats: robosResult?.stats || null,

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
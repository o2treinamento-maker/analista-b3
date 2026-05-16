// src/app/api/fundamentalista/route.js
// V6.1 — VERSÃO DEFENSIVA
// Cada bloco crítico em try/catch isolado. Se ROIC falhar, retorna null e segue.

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

    const response = await fetch(url, {
      next: { revalidate: 60 * 60 * 12 },
    });

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

    console.log(`\n══════ [${ticker}] V6.1 INICIANDO ══════`);

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
// PARTE 1/2
// src/app/api/fundamentalista/route.js

import { NextResponse } from "next/server";

const BRAPI_TOKEN = process.env.BRAPI_TOKEN;

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function n(v) {
  return typeof v === "number" && Number.isFinite(v)
    ? v
    : null;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function media(arr) {
  const validos = arr.filter(
    (v) =>
      typeof v === "number" &&
      Number.isFinite(v)
  );

  if (!validos.length) return 50;

  return Math.round(
    validos.reduce((a, b) => a + b, 0) /
      validos.length
  );
}

function pct(v, casas = 1) {
  if (v == null || isNaN(v)) return null;
  return Number((v * 100).toFixed(casas));
}

function bi(v) {
  if (v == null || isNaN(v)) return null;
  return Number((v / 1_000_000_000).toFixed(1));
}

// ─────────────────────────────────────────────
// SCORES VALUATION
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

// ─────────────────────────────────────────────
// SCORES QUALIDADE
// ─────────────────────────────────────────────

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

function scoreCrescimento(v) {
  if (v == null) return 50;

  const g = v * 100;

  if (g >= 30) return 95;
  if (g >= 15) return 84;
  if (g >= 5) return 70;
  if (g >= 0) return 58;

  return 28;
}

// ─────────────────────────────────────────────
// SCORES ROBUSTEZ
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

  if (fco != null) {
    score += fco > 0 ? 15 : -15;
  }

  if (fcf != null) {
    score += fcf > 0 ? 18 : -12;
  }

  return clamp(score, 15, 95);
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
// TEXTOS
// ─────────────────────────────────────────────

function textoPilar(score, tipo) {
  if (tipo === "valuation") {
    if (score >= 75)
      return "ativo aparenta negociar com valuation atrativo";

    if (score >= 55)
      return "precificação relativamente equilibrada";

    return "mercado exige múltiplos mais altos para o ativo";
  }

  if (tipo === "qualidade") {
    if (score >= 75)
      return "empresa demonstra boa eficiência operacional";

    if (score >= 55)
      return "qualidade operacional moderada";

    return "eficiência operacional mais pressionada";
  }

  if (tipo === "robustez") {
    if (score >= 75)
      return "estrutura financeira saudável";

    if (score >= 55)
      return "estrutura relativamente equilibrada";

    return "estrutura financeira mais fragilizada";
  }

  return "";
}

function gerarLeitura(
  scoreFinal,
  valuationScore,
  qualidadeScore,
  robustezScore
) {
  let abertura;

  if (scoreFinal >= 75) {
    abertura =
      "A empresa apresenta uma estrutura fundamentalista forte.";
  } else if (scoreFinal >= 55) {
    abertura =
      "A empresa apresenta fundamentos relativamente equilibrados.";
  } else {
    abertura =
      "A empresa apresenta fundamentos mais pressionados no cenário atual.";
  }

  return (
    `${abertura} ` +
    `O valuation atual indica ${textoPilar(
      valuationScore,
      "valuation"
    )}, ` +
    `a qualidade operacional mostra ${textoPilar(
      qualidadeScore,
      "qualidade"
    )} ` +
    `e a robustez financeira aponta ${textoPilar(
      robustezScore,
      "robustez"
    )}.`
  );
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(
      request.url
    );

    const ticker = searchParams
      .get("ticker")
      ?.toUpperCase()
      ?.trim();

    if (!ticker) {
      return NextResponse.json(
        { error: "Ticker não informado." },
        { status: 400 }
      );
    }

    const modules = encodeURIComponent(
      "summaryProfile,defaultKeyStatistics,financialData"
    );

    const url = `https://brapi.dev/api/quote/${ticker}?modules=${modules}&token=${BRAPI_TOKEN}`;

    const response = await fetch(url, {
      next: {
        revalidate: 60 * 60 * 12,
      },
    });

    const json = await response.json();

    const ativo = json?.results?.[0];

    if (!ativo) {
      return NextResponse.json(
        { error: "Ativo não encontrado." },
        { status: 404 }
      );
    }

    const stats =
      ativo.defaultKeyStatistics || {};

    const fin =
      ativo.financialData || {};

    const profile =
      ativo.summaryProfile || {};

    // MÉTRICAS

    const pl = n(
      stats.trailingPE ??
        ativo.priceEarnings
    );

    const pvp = n(stats.priceToBook);

    const dy = n(
      stats.dividendYield ??
        stats.yield
    );

    const roe = n(fin.returnOnEquity);

    const margem = n(fin.profitMargins);

    const crescLucro = n(
      fin.earningsGrowth ??
        stats.earningsQuarterlyGrowth
    );

    const crescReceita = n(
      fin.revenueGrowth
    );

    const dividaPatrimonio = n(
      fin.debtToEquity
    );

    const liquidez = n(
      fin.currentRatio
    );

    const fco = n(
      fin.operatingCashflow
    );

    const fcf = n(fin.freeCashflow);

    const marketCap = n(
      ativo.marketCap ??
        stats.marketCap
    );

    // SCORES

    const valuationScore = media([
      scorePL(pl),
      scorePVP(pvp),
      scoreDY(dy),
    ]);

    const qualidadeScore = media([
      scoreROE(roe),
      scoreMargem(margem),
      scoreCrescimento(crescLucro),
      scoreCrescimento(crescReceita),
    ]);

    const robustezScore = media([
      scoreDivida(dividaPatrimonio),
      scoreLiquidez(liquidez),
      scoreCaixa(fco, fcf),
      scoreMarketCap(marketCap),
    ]);

    const scoreFinal = Math.round(
      valuationScore * 0.32 +
        qualidadeScore * 0.43 +
        robustezScore * 0.25
    );

// PARTE 2/2

    return NextResponse.json({
      ticker,

      empresa:
        ativo.longName ||
        ativo.shortName ||
        ticker,

      setor:
        profile.sectorDisp ||
        profile.sector ||
        "—",

      industria:
        profile.industryDisp ||
        profile.industry ||
        "—",

      scoreFinal,

      valuation: {
        score: valuationScore,

        desc: textoPilar(
          valuationScore,
          "valuation"
        ),
      },

      qualidade: {
        score: qualidadeScore,

        desc: textoPilar(
          qualidadeScore,
          "qualidade"
        ),
      },

      robustez: {
        score: robustezScore,

        desc: textoPilar(
          robustezScore,
          "robustez"
        ),
      },

      leitura: gerarLeitura(
        scoreFinal,
        valuationScore,
        qualidadeScore,
        robustezScore
      ),

      metrics: {
        // VALUATION
        pl,
        pvp,
        dy,

        // QUALIDADE
        roe: pct(roe),
        margem: pct(margem),
        crescLucro: pct(crescLucro),
        crescReceita: pct(
          crescReceita
        ),

        // ROBUSTEZ
        dividaPatrimonio,
        liquidez,
        fco: bi(fco),
        fcf: bi(fcf),
      },

      explicacoes: {
        valuation:
          "Mede se o preço atual parece barato ou caro em relação aos fundamentos da empresa.",

        qualidade:
          "Mede a capacidade da empresa gerar lucro com eficiência operacional.",

        robustez:
          "Mede a saúde financeira e capacidade estrutural da empresa.",

        equilibrio:
          "Mostra se os fundamentos estão equilibrados ou dependem de apenas um ponto forte.",
      },

      updatedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Erro interno ao gerar análise fundamentalista.",

        detalhe: error.message,
      },
      { status: 500 }
    );
  }
}
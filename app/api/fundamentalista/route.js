import { NextResponse } from "next/server";

const BRAPI_TOKEN = process.env.BRAPI_TOKEN;

function n(v) {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function pct(v) {
  if (v === null || v === undefined) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function bi(v) {
  if (!v && v !== 0) return "—";
  return `R$ ${(v / 1_000_000_000).toFixed(1)} bi`;
}

function scorePL(pl) {
  if (!pl || pl <= 0) return 25;
  if (pl <= 6) return 95;
  if (pl <= 10) return 85;
  if (pl <= 15) return 70;
  if (pl <= 25) return 50;
  if (pl <= 40) return 30;
  return 15;
}

function scorePVP(pvp) {
  if (!pvp || pvp <= 0) return 50;
  if (pvp <= 1) return 90;
  if (pvp <= 1.5) return 75;
  if (pvp <= 2.5) return 55;
  if (pvp <= 4) return 35;
  return 20;
}

function scoreROE(roe) {
  if (roe === null) return 50;
  const r = roe * 100;
  if (r >= 25) return 95;
  if (r >= 18) return 85;
  if (r >= 12) return 70;
  if (r >= 8) return 55;
  if (r > 0) return 40;
  return 20;
}

function scoreMargem(margem) {
  if (margem === null) return 50;
  const m = margem * 100;
  if (m >= 25) return 95;
  if (m >= 15) return 80;
  if (m >= 8) return 65;
  if (m > 0) return 45;
  return 20;
}

function scoreCrescimento(v) {
  if (v === null) return 50;
  const g = v * 100;
  if (g >= 30) return 95;
  if (g >= 15) return 85;
  if (g >= 5) return 70;
  if (g >= 0) return 55;
  return 25;
}

function scoreDivida(debtToEquity) {
  if (debtToEquity === null) return 50;
  if (debtToEquity <= 0.5) return 90;
  if (debtToEquity <= 1.0) return 75;
  if (debtToEquity <= 2.0) return 55;
  if (debtToEquity <= 3.0) return 35;
  return 20;
}

function scoreLiquidezFinanceira(currentRatio) {
  if (currentRatio === null) return 50;
  if (currentRatio >= 2) return 90;
  if (currentRatio >= 1.3) return 75;
  if (currentRatio >= 1) return 60;
  if (currentRatio >= 0.7) return 40;
  return 25;
}

function scoreCaixa(operatingCashflow) {
  if (operatingCashflow === null) return 50;
  if (operatingCashflow > 0) return 75;
  return 25;
}

function media(arr) {
  const validos = arr.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (!validos.length) return 50;
  return Math.round(validos.reduce((a, b) => a + b, 0) / validos.length);
}

function classificar(score, coberturaFundamental) {
  if (coberturaFundamental < 0.4) {
    return {
      cor: "neutro",
      label: "COBERTURA LIMITADA",
      resumo: "Dados fundamentalistas insuficientes para uma leitura estrutural confiável.",
    };
  }

  if (score >= 80) {
    return {
      cor: "verde",
      label: "FUNDAMENTO FORTE",
      resumo: "Fundamentos sólidos, boa eficiência operacional e estrutura financeira relevante.",
    };
  }

  if (score >= 55) {
    return {
      cor: "amarelo",
      label: "FUNDAMENTO MODERADO",
      resumo: "Fundamentos razoáveis, mas com pontos de atenção em valuation, qualidade ou robustez.",
    };
  }

  return {
    cor: "vermelho",
    label: "FUNDAMENTO FRÁGIL",
    resumo: "Fundamentos mais frágeis ou insuficientes para sustentar uma leitura estrutural forte.",
  };
}

function formatarTrimestre(data) {
  if (!data) return "—";

  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return String(data);

  const mes = d.getUTCMonth() + 1;
  const ano = String(d.getUTCFullYear()).slice(2);
  const tri = mes <= 3 ? "1T" : mes <= 6 ? "2T" : mes <= 9 ? "3T" : "4T";

  return `${tri}${ano}`;
}

function gerarLeitura({ scoreFinal, coberturaFundamental }) {
  if (coberturaFundamental < 0.4) {
    return "Este ativo não possui dados fundamentalistas públicos suficientes na fonte utilizada para gerar uma leitura quantitativa confiável.";
  }

  if (scoreFinal >= 80) {
    return "O ativo apresenta leitura fundamentalista forte, com destaque para qualidade operacional, valuation competitivo e estrutura financeira relevante.";
  }

  if (scoreFinal >= 55) {
    return "O ativo apresenta leitura fundamentalista intermediária, com pontos positivos importantes, mas ainda exige atenção em alguns pilares quantitativos.";
  }

  return "O ativo apresenta leitura fundamentalista mais frágil, com menor equilíbrio entre valuation, qualidade operacional e robustez financeira.";
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get("ticker")?.toUpperCase()?.trim();

    if (!ticker) {
      return NextResponse.json({ error: "Ticker não informado." }, { status: 400 });
    }

    if (!BRAPI_TOKEN) {
      return NextResponse.json({ error: "BRAPI_TOKEN não configurado." }, { status: 500 });
    }

    const modules = encodeURIComponent("summaryProfile,defaultKeyStatistics,financialData");

    const urlCompleta = `https://brapi.dev/api/quote/${ticker}?range=1y&interval=1d&modules=${modules}&token=${BRAPI_TOKEN}`;
    const urlFallback = `https://brapi.dev/api/quote/${ticker}?range=1y&interval=1d&token=${BRAPI_TOKEN}`;

    let response = await fetch(urlCompleta, {
      next: { revalidate: 60 * 60 * 12 },
    });

    let rawText = await response.text();

    if (!response.ok) {
      console.error("Erro BRAPI com modules:", response.status, rawText);

      response = await fetch(urlFallback, {
        next: { revalidate: 60 * 60 * 12 },
      });

      rawText = await response.text();
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Erro ao buscar dados na BRAPI.",
          status: response.status,
          detalhe: rawText,
        },
        { status: response.status }
      );
    }

    const data = JSON.parse(rawText);
    const ativo = data?.results?.[0];

    if (!ativo) {
      return NextResponse.json({ error: "Ativo não encontrado." }, { status: 404 });
    }

    const stats = ativo.defaultKeyStatistics || {};
    const fin = ativo.financialData || {};
    const profile = ativo.summaryProfile || {};

    const precoAtual = n(ativo.regularMarketPrice);
    const pl = n(stats.trailingPE ?? ativo.priceEarnings);
    const lpa = n(stats.trailingEps ?? ativo.earningsPerShare);
    const pvp = n(stats.priceToBook);
    const roe = n(fin.returnOnEquity);
    const margemLiquida = n(fin.profitMargins ?? stats.profitMargins);
    const margemOperacional = n(fin.operatingMargins);
    const margemEbitda = n(fin.ebitdaMargins);
    const crescimentoLucro = n(fin.earningsGrowth ?? stats.earningsQuarterlyGrowth);
    const crescimentoReceita = n(fin.revenueGrowth);
    const debtToEquity = n(fin.debtToEquity);
    const currentRatio = n(fin.currentRatio);
    const quickRatio = n(fin.quickRatio);
    const operatingCashflow = n(fin.operatingCashflow);
    const freeCashflow = n(fin.freeCashflow);
    const marketCap = n(ativo.marketCap ?? stats.marketCap);
    const volume = n(ativo.regularMarketVolume);
    const beta = n(stats.beta);
    const dividendYield = n(stats.dividendYield ?? stats.yield);
    const max52 = n(ativo.fiftyTwoWeekHigh);
    const min52 = n(ativo.fiftyTwoWeekLow);
    const mostRecentQuarter = stats.mostRecentQuarter || null;

    const metricasDisponiveis = [
      pl,
      pvp,
      roe,
      margemLiquida,
      margemOperacional,
      margemEbitda,
      crescimentoLucro,
      crescimentoReceita,
      debtToEquity,
      currentRatio,
      quickRatio,
      operatingCashflow,
      freeCashflow,
      dividendYield,
    ];

    const qtdMetricasValidas = metricasDisponiveis.filter(
      (v) => v !== null && v !== undefined
    ).length;

    const coberturaFundamental = Number(
      (qtdMetricasValidas / metricasDisponiveis.length).toFixed(2)
    );

    const coberturaLimitada = coberturaFundamental < 0.4;

    const valuationScore = coberturaLimitada
      ? 0
      : media([scorePL(pl), scorePVP(pvp)]);

    const qualidadeScore = coberturaLimitada
      ? 0
      : media([
          scoreROE(roe),
          scoreMargem(margemLiquida),
          scoreMargem(margemOperacional),
          scoreCrescimento(crescimentoLucro),
          scoreCrescimento(crescimentoReceita),
        ]);

    const robustezScore = coberturaLimitada
      ? 0
      : media([
          scoreDivida(debtToEquity),
          scoreLiquidezFinanceira(currentRatio),
          scoreCaixa(operatingCashflow),
          marketCap && marketCap >= 20_000_000_000 ? 80 : 55,
        ]);

    const scoreFinal = coberturaLimitada
      ? 0
      : Math.round(
          valuationScore * 0.35 +
            qualidadeScore * 0.4 +
            robustezScore * 0.25
        );

    const classificacao = classificar(scoreFinal, coberturaFundamental);

    return NextResponse.json({
      ticker,
      nome: ativo.longName || ativo.shortName || ticker,
      setor: profile.sectorDisp || profile.sector || "—",
      industria: profile.industryDisp || profile.industry || "—",

      precoAtual,
      variacaoDia: ativo.regularMarketChangePercent ?? null,
      marketCap,
      marketCapFormatado: bi(marketCap),
      volume,

      coberturaFundamental,
      coberturaLimitada,
      qtdMetricasValidas,
      qtdMetricasTotais: metricasDisponiveis.length,

      prazoDados: {
        mostRecentQuarter,
        trimestreFormatado: formatarTrimestre(mostRecentQuarter),
        explicacao: mostRecentQuarter
          ? "Indicadores baseados nos últimos dados públicos consolidados disponíveis na BRAPI. Métricas trailing geralmente representam últimos 12 meses acumulados."
          : "A BRAPI não informou a data do último trimestre para este ativo. Alguns indicadores podem estar indisponíveis ou incompletos.",
      },

      scores: {
        valuation: valuationScore,
        qualidade: qualidadeScore,
        robustez: robustezScore,
        final: scoreFinal,
      },

      classificacao,

      pilares: {
        valuation: {
          label: "Valuation",
          score: valuationScore,
          leitura: coberturaLimitada
            ? "dados insuficientes"
            : valuationScore >= 75
            ? "descontado"
            : valuationScore >= 55
            ? "equilibrado"
            : "exigente",
          metricas: [
            { label: "P/L TTM", valor: pl ? `${pl.toFixed(1)}x` : "—", sub: "preço sobre lucro acumulado" },
            { label: "P/VP", valor: pvp ? `${pvp.toFixed(2)}x` : "—", sub: "preço sobre valor patrimonial" },
            { label: "Dividend Yield", valor: pct(dividendYield), sub: "rendimento em dividendos" },
          ],
        },

        qualidade: {
          label: "Qualidade operacional",
          score: qualidadeScore,
          leitura: coberturaLimitada
            ? "dados insuficientes"
            : qualidadeScore >= 75
            ? "alta eficiência"
            : qualidadeScore >= 55
            ? "eficiência moderada"
            : "baixa eficiência",
          metricas: [
            { label: "ROE", valor: pct(roe), sub: "retorno sobre patrimônio" },
            { label: "Margem líquida", valor: pct(margemLiquida), sub: "lucro líquido sobre receita" },
            { label: "Cresc. lucro", valor: pct(crescimentoLucro), sub: "crescimento recente do lucro" },
            { label: "Cresc. receita", valor: pct(crescimentoReceita), sub: "crescimento recente da receita" },
          ],
        },

        robustez: {
          label: "Robustez financeira",
          score: robustezScore,
          leitura: coberturaLimitada
            ? "dados insuficientes"
            : robustezScore >= 75
            ? "estrutura sólida"
            : robustezScore >= 55
            ? "estrutura moderada"
            : "estrutura pressionada",
          metricas: [
            { label: "Dívida / patrimônio", valor: debtToEquity ? `${debtToEquity.toFixed(2)}x` : "—", sub: "nível de alavancagem" },
            { label: "Liquidez corrente", valor: currentRatio ? `${currentRatio.toFixed(2)}x` : "—", sub: "capacidade de curto prazo" },
            { label: "Fluxo operacional", valor: operatingCashflow ? bi(operatingCashflow) : "—", sub: "geração operacional de caixa" },
            { label: "Caixa livre", valor: freeCashflow ? bi(freeCashflow) : "—", sub: "free cash flow estimado" },
          ],
        },
      },

      metricas: {
        pl,
        lpa,
        pvp,
        roe,
        margemLiquida,
        margemOperacional,
        margemEbitda,
        crescimentoLucro,
        crescimentoReceita,
        debtToEquity,
        currentRatio,
        quickRatio,
        operatingCashflow,
        freeCashflow,
        beta,
        dividendYield,
        max52,
        min52,
      },

      leitura: gerarLeitura({
        scoreFinal,
        coberturaFundamental,
      }),

      disclaimer:
        "Indicador de caráter informativo baseado em métricas quantitativas e fundamentalistas públicas. Não constitui recomendação de compra ou venda de valores mobiliários.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Erro interno ao processar leitura fundamentalista.",
        detalhe: error.message,
      },
      { status: 500 }
    );
  }
}
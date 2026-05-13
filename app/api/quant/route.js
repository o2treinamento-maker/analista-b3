// src/app/api/quant/route.js
// ═══════════════════════════════════════════════════════════════════════════
// ANÁLISE QUANTITATIVA — Beta, Alfa, Sharpe, Sortino, Drawdown, VaR e mais
// Padrão: 1 ano de histórico, retornos logarítmicos, anualização √252
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";

const BRAPI_TOKEN = process.env.BRAPI_TOKEN;

const DIAS_UTEIS_ANO = 252;
const DIAS_UTEIS_6M = 126;

const TAXA_BENCHMARK = 0.124;
const TAXA_ATUAL = 0.15;

const IBOV_SYMBOL = "^BVSP";

let ibovCache = { dados: null, expiraEm: 0 };
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

// ═══════════════════════════════════════════════════════════════════════════
// MATEMÁTICA FINANCEIRA
// ═══════════════════════════════════════════════════════════════════════════

function calcularRetornos(precos) {
  const retornos = [];

  for (let i = 1; i < precos.length; i++) {
    retornos.push(Math.log(precos[i] / precos[i - 1]));
  }

  return retornos;
}

function media(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function desvioPadrao(arr) {
  if (arr.length < 2) return 0;

  const m = media(arr);

  const variancia =
    arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);

  return Math.sqrt(variancia);
}

function desvioPadraoDownside(retornos, alvo = 0) {
  const negativos = retornos.filter((r) => r < alvo).map((r) => r - alvo);

  if (!negativos.length) return 0;

  const soma = negativos.reduce((s, x) => s + x ** 2, 0);

  return Math.sqrt(soma / retornos.length);
}

function covariancia(a, b) {
  if (a.length !== b.length || a.length < 2) return 0;

  const mA = media(a);
  const mB = media(b);

  let soma = 0;

  for (let i = 0; i < a.length; i++) {
    soma += (a[i] - mA) * (b[i] - mB);
  }

  return soma / (a.length - 1);
}

function correlacao(a, b) {
  const dpA = desvioPadrao(a);
  const dpB = desvioPadrao(b);

  if (dpA === 0 || dpB === 0) return 0;

  return covariancia(a, b) / (dpA * dpB);
}

function skewness(arr) {
  if (arr.length < 3) return 0;

  const m = media(arr);
  const dp = desvioPadrao(arr);

  if (dp === 0) return 0;

  const n = arr.length;

  const soma = arr.reduce((s, x) => {
    return s + ((x - m) / dp) ** 3;
  }, 0);

  return (n / ((n - 1) * (n - 2))) * soma;
}

function kurtosis(arr) {
  if (arr.length < 4) return 0;

  const m = media(arr);
  const dp = desvioPadrao(arr);

  if (dp === 0) return 0;

  const n = arr.length;

  const soma = arr.reduce((s, x) => {
    return s + ((x - m) / dp) ** 4;
  }, 0);

  const termo1 =
    (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));

  const termo2 =
    (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));

  return termo1 * soma - termo2;
}

function calcularDrawdown(precos) {
  let pico = precos[0];
  let maxDD = 0;
  let inicioDD = 0;
  let duracaoMax = 0;
  let duracaoAtual = 0;

  for (let i = 0; i < precos.length; i++) {
    if (precos[i] > pico) {
      pico = precos[i];
      inicioDD = i;
      duracaoAtual = 0;
    } else {
      duracaoAtual = i - inicioDD;

      const dd = (precos[i] - pico) / pico;

      if (dd < maxDD) {
        maxDD = dd;
        duracaoMax = duracaoAtual;
      }
    }
  }

  let picoRecente = precos[0];

  for (let i = 0; i < precos.length; i++) {
    if (precos[i] > picoRecente) {
      picoRecente = precos[i];
    }
  }

  const ddAtual =
    (precos[precos.length - 1] - picoRecente) / picoRecente;

  return {
    maximo: maxDD,
    atual: ddAtual,
    duracaoMaxDias: duracaoMax,
    picoMaximo: pico,
  };
}

function calcularVaR(retornos, confianca = 0.95) {
  if (retornos.length < 20) return 0;

  const ordenados = [...retornos].sort((a, b) => a - b);
  const indice = Math.floor((1 - confianca) * ordenados.length);

  return ordenados[indice];
}

function calcularWinRate(retornos) {
  if (!retornos.length) return 0;

  const positivos = retornos.filter((r) => r > 0).length;

  return positivos / retornos.length;
}

function calcularProfitFactor(retornos) {
  const ganhos = retornos
    .filter((r) => r > 0)
    .reduce((s, x) => s + x, 0);

  const perdas = Math.abs(
    retornos.filter((r) => r < 0).reduce((s, x) => s + x, 0)
  );

  if (perdas === 0) return ganhos > 0 ? 999 : 0;

  return ganhos / perdas;
}

function calcularZScore(precos) {
  const m = media(precos);
  const dp = desvioPadrao(precos);

  if (dp === 0) return 0;

  return (precos[precos.length - 1] - m) / dp;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function calcularSharpePeriodo(retornos, nDias) {
  if (retornos.length < nDias) return null;

  const retornosPeriodo = retornos.slice(-nDias);

  const volDiaria = desvioPadrao(retornosPeriodo);
  const volAnual = volDiaria * Math.sqrt(DIAS_UTEIS_ANO);

  if (volAnual === 0) return null;

  const retornoMedioAnual =
    media(retornosPeriodo) * DIAS_UTEIS_ANO;

  const excessoRetorno =
    retornoMedioAnual - TAXA_BENCHMARK;

  return excessoRetorno / volAnual;
}

// ═══════════════════════════════════════════════════════════════════════════
// EFICIÊNCIA QYNTOR
// ═══════════════════════════════════════════════════════════════════════════

const _CALIBRACAO_BASELINE = 0.30;
const _CALIBRACAO_DESVIO = 1.00;
const _CALIBRACAO_SUAVIZACAO = 1.5;

function calcularEficienciaQyntor(sharpe12, sharpe6) {
  if (sharpe12 == null || sharpe6 == null) return null;
  if (!isFinite(sharpe12) || !isFinite(sharpe6)) return null;

  const indicadorBruto = (sharpe12 + sharpe6) / 2;

  const zNormalizado =
    (indicadorBruto - _CALIBRACAO_BASELINE) / _CALIBRACAO_DESVIO;

  const score = Math.round(
    Math.tanh(zNormalizado / _CALIBRACAO_SUAVIZACAO) * 100
  );

  let nivel;
  let texto;
  let cor;
  let leitura;
  let seloRiscoRetorno;
  let seloConsistencia;

  if (score >= 70) {
    nivel = "EXCELENTE";
    texto = "Retorno ajustado ao risco muito acima da média do mercado";
    leitura =
      "O ativo combina forte desempenho recente com boa eficiência risco-retorno nas janelas analisadas.";
    cor = "verde";
    seloRiscoRetorno = "FORTE";
    seloConsistencia = "ALTA";
  } else if (score >= 30) {
    nivel = "BOM";
    texto = "Eficiência risco-retorno acima da média";
    leitura =
      "O ativo apresenta relação positiva entre retorno e risco, com desempenho superior ao padrão médio observado.";
    cor = "verde";
    seloRiscoRetorno = "POSITIVO";
    seloConsistencia = "BOA";
  } else if (score >= -10) {
    nivel = "NEUTRO";
    texto = "Eficiência próxima ao padrão do mercado";
    leitura =
      "O ativo apresenta desempenho ajustado ao risco próximo da média, sem grande vantagem quantitativa.";
    cor = "amarelo";
    seloRiscoRetorno = "NEUTRO";
    seloConsistencia = "MÉDIA";
  } else if (score >= -50) {
    nivel = "FRACO";
    texto = "Eficiência risco-retorno abaixo da média";
    leitura =
      "O retorno recente não compensou totalmente o risco assumido nas janelas avaliadas.";
    cor = "laranja";
    seloRiscoRetorno = "FRACO";
    seloConsistencia = "BAIXA";
  } else {
    nivel = "CRÍTICO";
    texto = "Risco elevado frente ao retorno gerado";
    leitura =
      "O ativo apresentou baixa eficiência quantitativa, com retorno insuficiente para o risco observado.";
    cor = "vermelho";
    seloRiscoRetorno = "NEGATIVO";
    seloConsistencia = "BAIXA";
  }

  return {
    score,
    nivel,
    texto,
    leitura,
    cor,

    detalhes: {
      metodologia:
        "Combina desempenho recente e retorno ajustado ao risco em múltiplas janelas.",
      janela: "6M + 12M",
      escala: "-100 a +100",
      riscoRetorno: seloRiscoRetorno,
      consistencia: seloConsistencia,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// BUSCA DE DADOS
// ═══════════════════════════════════════════════════════════════════════════

async function parseJsonSeguro(resp, origem) {
  const text = await resp.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `${origem} retornou resposta não-JSON: ${text.slice(0, 160)}`
    );
  }
}

async function buscarHistorico(ticker) {
  if (!BRAPI_TOKEN) {
    throw new Error("BRAPI_TOKEN não configurado");
  }

  const url =
    `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}` +
    `?range=1y&interval=1d&token=${BRAPI_TOKEN}`;

  const resp = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Brapi ${resp.status}: ${body.slice(0, 200)}`);
  }

  const json = await parseJsonSeguro(resp, "Brapi ativo");

  if (json.error || !json.results?.[0]) {
    throw new Error(json.message || `${ticker} não encontrado`);
  }

  const result = json.results[0];

  const candles = (result.historicalDataPrice || []).filter(
    (c) => c.close != null && c.close > 0
  );

  if (candles.length < 60) {
    throw new Error(
      `histórico insuficiente para análise quant (${candles.length} dias, mínimo 60)`
    );
  }

  return {
    nome: result.longName || result.shortName || ticker,
    precoAtual: result.regularMarketPrice,
    candles,
  };
}

async function buscarIbov() {
  if (ibovCache.dados && Date.now() < ibovCache.expiraEm) {
    return ibovCache.dados;
  }

  const url =
    `https://brapi.dev/api/quote/${encodeURIComponent(IBOV_SYMBOL)}` +
    `?range=1y&interval=1d&token=${BRAPI_TOKEN}`;

  const resp = await fetch(url, {
    next: { revalidate: 43200 },
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Falha ao buscar IBOV ${resp.status}: ${body.slice(0, 160)}`);
  }

  const json = await parseJsonSeguro(resp, "Brapi IBOV");

  if (!json.results?.[0]?.historicalDataPrice) {
    throw new Error("IBOV: histórico indisponível");
  }

  const candles = json.results[0].historicalDataPrice.filter(
    (c) => c.close != null && c.close > 0
  );

  ibovCache = {
    dados: candles,
    expiraEm: Date.now() + CACHE_TTL_MS,
  };

  return candles;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICAÇÕES
// ═══════════════════════════════════════════════════════════════════════════

function classificarVolatilidade(volAnual) {
  if (volAnual < 0.18) {
    return {
      label: "baixa",
      cor: "verde",
      desc: "oscilações historicamente controladas",
    };
  }

  if (volAnual < 0.30) {
    return {
      label: "moderada",
      cor: "amarelo",
      desc: "nível de oscilação dentro do padrão do mercado",
    };
  }

  if (volAnual < 0.45) {
    return {
      label: "alta",
      cor: "laranja",
      desc: "oscilações relevantes e movimentos mais intensos",
    };
  }

  return {
    label: "muito alta",
    cor: "vermelho",
    desc: "fortes oscilações e risco elevado no curto prazo",
  };
}

function classificarBeta(beta) {
  if (beta < 0.7) {
    return {
      label: "baixa sensibilidade",
      cor: "verde",
      desc: "tende a reagir menos aos movimentos do Ibovespa",
    };
  }

  if (beta < 1.2) {
    return {
      label: "sensibilidade neutra",
      cor: "amarelo",
      desc: "tende a acompanhar os movimentos do Ibovespa",
    };
  }

  if (beta < 1.5) {
    return {
      label: "alta sensibilidade",
      cor: "laranja",
      desc: "tende a amplificar os movimentos do Ibovespa",
    };
  }

  return {
    label: "sensibilidade muito alta",
    cor: "vermelho",
    desc: "reage de forma bem mais intensa aos movimentos do Ibovespa",
  };
}

function classificarSharpe(sharpe) {
  if (sharpe < 0) {
    return {
      label: "ruim",
      cor: "vermelho",
      desc: "retorno inferior à taxa livre de risco",
    };
  }

  if (sharpe < 0.5) {
    return {
      label: "fraco",
      cor: "laranja",
      desc: "retorno baixo para o risco assumido",
    };
  }

  if (sharpe < 1.0) {
    return {
      label: "razoável",
      cor: "amarelo",
      desc: "retorno aceitável para o risco assumido",
    };
  }

  if (sharpe < 2.0) {
    return {
      label: "bom",
      cor: "verde",
      desc: "boa eficiência entre retorno e risco",
    };
  }

  return {
    label: "excelente",
    cor: "verde",
    desc: "eficiência excepcional entre retorno e risco",
  };
}

function classificarAlfa(alfa) {
  if (alfa > 0.05) {
    return {
      label: "supera mercado",
      cor: "verde",
    };
  }

  if (alfa > 0) {
    return {
      label: "acompanha mercado",
      cor: "amarelo",
    };
  }

  if (alfa > -0.05) {
    return {
      label: "abaixo do mercado",
      cor: "laranja",
    };
  }

  return {
    label: "muito abaixo",
    cor: "vermelho",
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORE CONSOLIDADO 0-100
// ═══════════════════════════════════════════════════════════════════════════

function calcularScores({
  sharpe,
  alfa,
  drawdownMax,
  volAnual,
  retorno1y,
  beta,
}) {
  const scoreRetorno = clamp(
    50 + sharpe * 25 + Math.min(retorno1y, 0.5) * 50,
    0,
    100
  );

  const ddPenalty = Math.abs(drawdownMax) * 200;
  const volPenalty = Math.max(0, (volAnual - 0.25) * 100);

  const scoreRisco = clamp(
    100 - ddPenalty - volPenalty,
    0,
    100
  );

  const scoreAlfa = clamp(
    50 + alfa * 500,
    0,
    100
  );

  const betaPenalty = Math.abs(beta - 1.0) * 30;

  const scoreMercado = clamp(
    scoreAlfa - betaPenalty * 0.3,
    0,
    100
  );

  const scoreFinal = Math.round(
    scoreRetorno * 0.3 +
      scoreRisco * 0.3 +
      scoreMercado * 0.4
  );

  return {
    final: scoreFinal,
    retorno: Math.round(scoreRetorno),
    risco: Math.round(scoreRisco),
    mercado: Math.round(scoreMercado),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LEITURA TEXTUAL AUTOMÁTICA
// ═══════════════════════════════════════════════════════════════════════════

function gerarLeitura({
  classBeta,
  classVol,
  classSharpe,
  classAlfa,
  retorno1y,
  drawdownMax,
  beta,
  volAnual,
  sharpe,
  retornoIbovAcumulado,
}) {
  const retornoPct = (retorno1y * 100).toFixed(1);
  const ibovPct = (retornoIbovAcumulado * 100).toFixed(1);
  const volPct = (volAnual * 100).toFixed(1);
  const ddPct = Math.abs(drawdownMax * 100).toFixed(1);

  let fraseRetorno;

  if (retorno1y > retornoIbovAcumulado + 0.05) {
    fraseRetorno =
      `O ativo entregou retorno de ${retornoPct}% no período, ` +
      `acima do Ibovespa, que fez ${ibovPct}%.`;
  } else if (retorno1y < retornoIbovAcumulado - 0.05) {
    fraseRetorno =
      `O ativo entregou retorno de ${retornoPct}% no período, ` +
      `abaixo do Ibovespa, que fez ${ibovPct}%.`;
  } else {
    fraseRetorno =
      `O ativo apresentou desempenho próximo ao Ibovespa, ` +
      `com retorno de ${retornoPct}% contra ${ibovPct}% do índice.`;
  }

  const fraseVol =
    `A volatilidade anualizada foi de ${volPct}%, ` +
    `classificada como ${classVol.label}.`;

  const fraseBeta =
    `O beta de ${beta.toFixed(2)} indica ${classBeta.label}, ` +
    `${classBeta.desc}.`;

  let fraseSharpe;

  if (sharpe >= 2) {
    fraseSharpe =
      `A eficiência risco-retorno foi excepcional, ` +
      `com Sharpe de ${sharpe.toFixed(2)}.`;
  } else if (sharpe >= 1) {
    fraseSharpe =
      `A eficiência risco-retorno foi forte, ` +
      `com Sharpe de ${sharpe.toFixed(2)}.`;
  } else if (sharpe >= 0.5) {
    fraseSharpe =
      `A relação entre retorno e risco foi razoável, ` +
      `com Sharpe de ${sharpe.toFixed(2)}.`;
  } else if (sharpe >= 0) {
    fraseSharpe =
      `O retorno ajustado ao risco foi limitado, ` +
      `com Sharpe de ${sharpe.toFixed(2)}.`;
  } else {
    fraseSharpe =
      `O retorno não compensou a taxa livre de risco no período, ` +
      `com Sharpe de ${sharpe.toFixed(2)}.`;
  }

  let fraseDrawdown = "";

  if (drawdownMax < -0.25) {
    fraseDrawdown =
      ` A maior queda no período foi de ${ddPct}%, ` +
      `indicando risco elevado em movimentos de correção.`;
  } else if (drawdownMax < -0.10) {
    fraseDrawdown =
      ` A maior queda observada no período foi de ${ddPct}%.`;
  }

  let fraseAlfa;

  if (classAlfa.label === "supera mercado") {
    fraseAlfa =
      "No modelo CAPM, o ativo gerou alfa positivo relevante frente ao Ibovespa.";
  } else if (classAlfa.label === "acompanha mercado") {
    fraseAlfa =
      "No modelo CAPM, o ativo ficou próximo do retorno esperado para o risco assumido.";
  } else {
    fraseAlfa =
      "No modelo CAPM, o ativo ficou abaixo do retorno esperado para o risco assumido.";
  }

  return (
    `${fraseRetorno} ` +
    `${fraseVol} ` +
    `${fraseBeta} ` +
    `${fraseSharpe}${fraseDrawdown} ` +
    `${fraseAlfa}`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker")?.toUpperCase();

  if (!ticker) {
    return NextResponse.json(
      { error: "ticker obrigatório" },
      { status: 400 }
    );
  }

  if (!/^[A-Z0-9]{2,8}$/.test(ticker)) {
    return NextResponse.json(
      { error: "ticker inválido" },
      { status: 400 }
    );
  }

  try {
    const [ativoData, ibovCandles] = await Promise.all([
      buscarHistorico(ticker),
      buscarIbov(),
    ]);

    const { nome, precoAtual, candles } = ativoData;

    function timestampParaDia(ts) {
      const ms = ts < 1e12 ? ts * 1000 : ts;
      return new Date(ms).toISOString().slice(0, 10);
    }

    const ibovMap = new Map(
      ibovCandles.map((c) => [
        timestampParaDia(c.date),
        c.close,
      ])
    );

    const datasComuns = candles.filter((c) =>
      ibovMap.has(timestampParaDia(c.date))
    );

    if (datasComuns.length < 60) {
      throw new Error(
        `dados insuficientes após alinhar com IBOV ` +
          `(ativo: ${candles.length}, IBOV: ${ibovCandles.length}, comuns: ${datasComuns.length})`
      );
    }

    const precosAtivo = datasComuns.map((c) => c.close);

    const precosIbov = datasComuns.map((c) =>
      ibovMap.get(timestampParaDia(c.date))
    );

    const retornosAtivo = calcularRetornos(precosAtivo);
    const retornosIbov = calcularRetornos(precosIbov);

    const retornoPeriodo = (nDias) => {
      if (precosAtivo.length < nDias) return null;

      const inicio =
        precosAtivo[precosAtivo.length - nDias];

      const fim =
        precosAtivo[precosAtivo.length - 1];

      return (fim - inicio) / inicio;
    };

    const retorno1y = retornoPeriodo(precosAtivo.length);
    const retorno6m = retornoPeriodo(DIAS_UTEIS_6M);
    const retorno3m = retornoPeriodo(63);
    const retorno1m = retornoPeriodo(21);

    const retornoIbovAcumulado =
      precosIbov.length > 1
        ? (precosIbov[precosIbov.length - 1] -
            precosIbov[0]) /
          precosIbov[0]
        : 0;

    const volDiaria = desvioPadrao(retornosAtivo);

    const volAnual =
      volDiaria * Math.sqrt(DIAS_UTEIS_ANO);

    const volDownsideDiaria =
      desvioPadraoDownside(retornosAtivo);

    const volDownsideAnual =
      volDownsideDiaria * Math.sqrt(DIAS_UTEIS_ANO);

    const drawdown = calcularDrawdown(precosAtivo);

    const varDiario =
      calcularVaR(retornosAtivo, 0.95);

    const retornoMedioAnual =
      media(retornosAtivo) * DIAS_UTEIS_ANO;

    const excessoRetorno =
      retornoMedioAnual - TAXA_BENCHMARK;

    const sharpe =
      volAnual > 0
        ? excessoRetorno / volAnual
        : 0;

    const sortino =
      volDownsideAnual > 0
        ? excessoRetorno / volDownsideAnual
        : 0;

    const calmar =
      Math.abs(drawdown.maximo) > 0
        ? retornoMedioAnual /
          Math.abs(drawdown.maximo)
        : 0;

    const _sharpe6m =
      calcularSharpePeriodo(
        retornosAtivo,
        DIAS_UTEIS_6M
      );

    const eficiencia =
      calcularEficienciaQyntor(
        sharpe,
        _sharpe6m
      );

    const covAtivoIbov =
      covariancia(retornosAtivo, retornosIbov);

    const varIbov =
      desvioPadrao(retornosIbov) ** 2;

    const beta =
      varIbov > 0
        ? covAtivoIbov / varIbov
        : 1;

    const retornoMedioIbovAnual =
      media(retornosIbov) * DIAS_UTEIS_ANO;

    const alfa =
      retornoMedioAnual -
      (TAXA_BENCHMARK +
        beta *
          (retornoMedioIbovAnual -
            TAXA_BENCHMARK));

    const corr =
      correlacao(retornosAtivo, retornosIbov);

    const r2 = corr ** 2;

    const diffRetornos = retornosAtivo.map(
      (r, i) => r - retornosIbov[i]
    );

    const trackingError =
      desvioPadrao(diffRetornos) *
      Math.sqrt(DIAS_UTEIS_ANO);

    const informationRatio =
      trackingError > 0 ? alfa / trackingError : 0;

    const winRate =
      calcularWinRate(retornosAtivo);

    const profitFactor =
      calcularProfitFactor(retornosAtivo);

    const zScore =
      calcularZScore(precosAtivo);

    const skew =
      skewness(retornosAtivo);

    const kurt =
      kurtosis(retornosAtivo);

    const classBeta =
      classificarBeta(beta);

    const classVol =
      classificarVolatilidade(volAnual);

    const classSharpe =
      classificarSharpe(sharpe);

    const classAlfa =
      classificarAlfa(alfa);

    const scores = calcularScores({
      sharpe,
      alfa,
      drawdownMax: drawdown.maximo,
      volAnual,
      retorno1y,
      beta,
    });

    const leitura = gerarLeitura({
      classBeta,
      classVol,
      classSharpe,
      classAlfa,
      retorno1y,
      drawdownMax: drawdown.maximo,
      beta,
      volAnual,
      sharpe,
      retornoIbovAcumulado,
    });

    return NextResponse.json({
      ticker,
      nome,
      precoAtual,
      periodoDias: datasComuns.length,

      taxaLivreRisco: TAXA_BENCHMARK,
      taxaAtual: TAXA_ATUAL,

      retornos: {
        ano: retorno1y,
        seisMeses: retorno6m,
        tresMeses: retorno3m,
        umMes: retorno1m,
        medioAnualizado: retornoMedioAnual,
      },

      risco: {
        volatilidadeAnual: volAnual,
        volatilidadeDownsideAnual: volDownsideAnual,
        drawdownMaximo: drawdown.maximo,
        drawdownAtual: drawdown.atual,
        drawdownDuracaoDias:
          drawdown.duracaoMaxDias,
        var95: varDiario,
      },

      ajustado: {
        sharpe,
        sortino,
        calmar,
      },

      mercado: {
        beta,
        alfa,
        r2,
        correlacao: corr,
        trackingError,
        informationRatio,
        retornoIbov:
          retornoMedioIbovAnual,
        retornoIbovAcumulado,
      },

      comportamento: {
        winRate,
        profitFactor,
        zScore,
        skewness: skew,
        kurtosis: kurt,
      },

      classificacoes: {
        beta: classBeta,
        volatilidade: classVol,
        sharpe: classSharpe,
        alfa: classAlfa,
      },

      scores,

      eficiencia,

      leitura,

      atualizadoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/quant] erro:", err.message);

    return NextResponse.json(
      {
        error:
          err.message ||
          "erro ao calcular análise quant",
      },
      { status: 500 }
    );
  }
}
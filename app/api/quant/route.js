// src/app/api/quant/route.js
// ═══════════════════════════════════════════════════════════════════════════
// ANÁLISE QUANTITATIVA — Beta, Alfa, Sharpe, Sortino, Drawdown, VaR e mais
// Padrão Bloomberg/Yahoo Finance: 1 ano de histórico, anualização √252
// ═══════════════════════════════════════════════════════════════════════════
// TAXA LIVRE DE RISCO (atualizar 1x por trimestre):
//   - TAXA_BENCHMARK: média 5y da SELIC (12.4%) — usada nos cálculos
//   - TAXA_ATUAL:     SELIC vigente (15%) — informativa
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";

const BRAPI_TOKEN = process.env.BRAPI_TOKEN;
const DIAS_UTEIS_ANO = 252;

const TAXA_BENCHMARK = 0.124; // 12.4% — média histórica 5 anos (2021-2025)
const TAXA_ATUAL = 0.15;       // 15% — SELIC vigente em Maio/2026

const IBOV_SYMBOL = "^BVSP";

// ─── CACHE EM MEMÓRIA DO IBOV (economiza requests) ─────────────────────────
let ibovCache = { dados: null, expiraEm: 0 };
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

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
  const variancia = arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variancia);
}

function desvioPadraoDownside(retornos, alvo = 0) {
  const negativos = retornos.filter(r => r < alvo).map(r => r - alvo);
  if (!negativos.length) return 0;
  const soma = negativos.reduce((s, x) => s + x ** 2, 0);
  return Math.sqrt(soma / retornos.length);
}

function covariancia(a, b) {
  if (a.length !== b.length || a.length < 2) return 0;
  const mA = media(a), mB = media(b);
  let soma = 0;
  for (let i = 0; i < a.length; i++) {
    soma += (a[i] - mA) * (b[i] - mB);
  }
  return soma / (a.length - 1);
}

function correlacao(a, b) {
  const dpA = desvioPadrao(a), dpB = desvioPadrao(b);
  if (dpA === 0 || dpB === 0) return 0;
  return covariancia(a, b) / (dpA * dpB);
}

function skewness(arr) {
  if (arr.length < 3) return 0;
  const m = media(arr), dp = desvioPadrao(arr);
  if (dp === 0) return 0;
  const n = arr.length;
  const soma = arr.reduce((s, x) => s + ((x - m) / dp) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * soma;
}

function kurtosis(arr) {
  if (arr.length < 4) return 0;
  const m = media(arr), dp = desvioPadrao(arr);
  if (dp === 0) return 0;
  const n = arr.length;
  const soma = arr.reduce((s, x) => s + ((x - m) / dp) ** 4, 0);
  const termo1 = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
  const termo2 = (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  return termo1 * soma - termo2;
}

function calcularDrawdown(precos) {
  let pico = precos[0];
  let maxDD = 0;
  let inicioDD = 0;
  let fimDD = 0;
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
        fimDD = i;
        duracaoMax = duracaoAtual;
      }
    }
  }

  let picoRecente = precos[0];
  for (let i = 0; i < precos.length; i++) {
    if (precos[i] > picoRecente) picoRecente = precos[i];
  }
  const ddAtual = (precos[precos.length - 1] - picoRecente) / picoRecente;

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
  const positivos = retornos.filter(r => r > 0).length;
  return positivos / retornos.length;
}

function calcularProfitFactor(retornos) {
  const ganhos = retornos.filter(r => r > 0).reduce((s, x) => s + x, 0);
  const perdas = Math.abs(retornos.filter(r => r < 0).reduce((s, x) => s + x, 0));
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

// ═══════════════════════════════════════════════════════════════════════════
// BUSCA DE DADOS
// ═══════════════════════════════════════════════════════════════════════════

async function buscarHistorico(ticker) {
  if (!BRAPI_TOKEN) throw new Error("BRAPI_TOKEN não configurado");

  const url = `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?range=1y&interval=1d&token=${BRAPI_TOKEN}`;
  const resp = await fetch(url, { next: { revalidate: 3600 } });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Brapi ${resp.status}: ${body.slice(0, 200)}`);
  }

  const json = await resp.json();
  if (json.error || !json.results?.[0]) {
    throw new Error(json.message || `${ticker} não encontrado`);
  }

  const result = json.results[0];
  const candles = (result.historicalDataPrice || [])
    .filter(c => c.close != null && c.close > 0);

  if (candles.length < 60) {
    throw new Error(`histórico insuficiente para análise quant (${candles.length} dias, mínimo 60)`);
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

  const url = `https://brapi.dev/api/quote/${encodeURIComponent(IBOV_SYMBOL)}?range=1y&interval=1d&token=${BRAPI_TOKEN}`;
  const resp = await fetch(url, { next: { revalidate: 43200 } });

  if (!resp.ok) {
    throw new Error(`Falha ao buscar IBOV: ${resp.status}`);
  }
  const json = await resp.json();
  if (!json.results?.[0]?.historicalDataPrice) {
    throw new Error("IBOV: histórico indisponível");
  }

  const candles = json.results[0].historicalDataPrice
    .filter(c => c.close != null && c.close > 0);

  ibovCache = { dados: candles, expiraEm: Date.now() + CACHE_TTL_MS };
  return candles;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICAÇÕES
// ═══════════════════════════════════════════════════════════════════════════

function classificarVolatilidade(volAnual) {
  if (volAnual < 0.20) return { label: "baixa", cor: "verde" };
  if (volAnual < 0.35) return { label: "moderada", cor: "amarelo" };
  if (volAnual < 0.50) return { label: "alta", cor: "laranja" };
  return { label: "muito alta", cor: "vermelho" };
}

function classificarBeta(beta) {
  if (beta < 0.7) return { label: "defensivo", cor: "verde", desc: "menos volátil que o mercado" };
  if (beta < 1.1) return { label: "neutro", cor: "amarelo", desc: "anda junto com o mercado" };
  if (beta < 1.5) return { label: "agressivo", cor: "laranja", desc: "mais volátil que o mercado" };
  return { label: "muito agressivo", cor: "vermelho", desc: "amplifica os movimentos do mercado" };
}

function classificarSharpe(sharpe) {
  if (sharpe < 0) return { label: "ruim", cor: "vermelho", desc: "retorno abaixo da renda fixa" };
  if (sharpe < 0.5) return { label: "fraco", cor: "laranja", desc: "retorno modesto pelo risco" };
  if (sharpe < 1.0) return { label: "razoável", cor: "amarelo", desc: "compensa o risco assumido" };
  if (sharpe < 2.0) return { label: "bom", cor: "verde", desc: "retorno saudável vs risco" };
  return { label: "excelente", cor: "verde", desc: "retorno excepcional vs risco" };
}

function classificarAlfa(alfa) {
  if (alfa > 0.05) return { label: "supera mercado", cor: "verde" };
  if (alfa > 0) return { label: "acompanha mercado", cor: "amarelo" };
  if (alfa > -0.05) return { label: "abaixo do mercado", cor: "laranja" };
  return { label: "muito abaixo", cor: "vermelho" };
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORE CONSOLIDADO 0-100
// ═══════════════════════════════════════════════════════════════════════════

function calcularScores({ sharpe, alfa, drawdownMax, volAnual, retorno1y, beta }) {
  const scoreRetorno = clamp(
    50 + sharpe * 25 + Math.min(retorno1y, 0.5) * 50,
    0, 100
  );

  const ddPenalty = Math.abs(drawdownMax) * 200;
  const volPenalty = Math.max(0, (volAnual - 0.25) * 100);
  const scoreRisco = clamp(100 - ddPenalty - volPenalty, 0, 100);

  const scoreAlfa = clamp(50 + alfa * 500, 0, 100);
  const betaPenalty = Math.abs(beta - 1.0) * 30;
  const scoreMercado = clamp(scoreAlfa - betaPenalty * 0.3, 0, 100);

  const scoreFinal = Math.round(
    scoreRetorno * 0.30 + scoreRisco * 0.30 + scoreMercado * 0.40
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

function gerarLeitura({ classBeta, classVol, classSharpe, classAlfa, retorno1y, drawdownMax }) {
  const partes = [];

  partes.push(`Perfil ${classBeta.label}: ${classBeta.desc}.`);

  if (retorno1y > 0.20) {
    partes.push(`Retorno de ${(retorno1y * 100).toFixed(1)}% no último ano,`);
  } else if (retorno1y > 0) {
    partes.push(`Retorno modesto de ${(retorno1y * 100).toFixed(1)}% no último ano,`);
  } else {
    partes.push(`Queda de ${Math.abs(retorno1y * 100).toFixed(1)}% no último ano,`);
  }

  partes.push(`com volatilidade ${classVol.label} (${classSharpe.desc}).`);

  if (drawdownMax < -0.20) {
    partes.push(`Apresentou queda relevante de ${(drawdownMax * 100).toFixed(1)}% no período — exige tolerância a risco.`);
  } else if (drawdownMax < -0.10) {
    partes.push(`Maior queda no período foi de ${(drawdownMax * 100).toFixed(1)}%.`);
  }

  partes.push(`${classAlfa.label === "supera mercado" ? "Vem superando o Ibovespa." : classAlfa.label === "muito abaixo" ? "Ficou bem atrás do Ibovespa." : "Acompanhou o desempenho do Ibovespa."}`);

  return partes.join(" ");
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker")?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: "ticker obrigatório" }, { status: 400 });
  }

  if (!/^[A-Z0-9]{2,8}$/.test(ticker)) {
    return NextResponse.json({ error: "ticker inválido" }, { status: 400 });
  }

  try {
    const [ativoData, ibovCandles] = await Promise.all([
      buscarHistorico(ticker),
      buscarIbov(),
    ]);

    const { nome, precoAtual, candles } = ativoData;

    // ─── ALINHAMENTO TEMPORAL ──────────────────────────────────────────────
    function timestampParaDia(ts) {
      const ms = ts < 1e12 ? ts * 1000 : ts;
      return new Date(ms).toISOString().slice(0, 10);
    }

    const ibovMap = new Map(
      ibovCandles.map(c => [timestampParaDia(c.date), c.close])
    );

    const datasComuns = candles.filter(c =>
      ibovMap.has(timestampParaDia(c.date))
    );

    console.log(`[quant] ${ticker}: ${candles.length} candles ativo, ${ibovCandles.length} candles IBOV, ${datasComuns.length} alinhados`);

    if (datasComuns.length < 60) {
      throw new Error(
        `dados insuficientes após alinhar com IBOV (ativo: ${candles.length}, IBOV: ${ibovCandles.length}, comuns: ${datasComuns.length})`
      );
    }

    const precosAtivo = datasComuns.map(c => c.close);
    const precosIbov = datasComuns.map(c => ibovMap.get(timestampParaDia(c.date)));

    // ─── RETORNOS ──────────────────────────────────────────────────────────
    const retornosAtivo = calcularRetornos(precosAtivo);
    const retornosIbov = calcularRetornos(precosIbov);

    const retornoPeriodo = (n) => {
      if (precosAtivo.length < n) return null;
      const inicio = precosAtivo[precosAtivo.length - n];
      const fim = precosAtivo[precosAtivo.length - 1];
      return (fim - inicio) / inicio;
    };

    const retorno1y = retornoPeriodo(precosAtivo.length);
    const retorno6m = retornoPeriodo(126);
    const retorno3m = retornoPeriodo(63);
    const retorno1m = retornoPeriodo(21);

    // ─── RETORNO ACUMULADO DO IBOV (pra UI da barra comparativa) ──────────
    // Calcula igual ao ativo: do primeiro até o último preço
    const retornoIbovAcumulado = precosIbov.length > 1
      ? (precosIbov[precosIbov.length - 1] - precosIbov[0]) / precosIbov[0]
      : 0;

    console.log(`[quant] ${ticker}: retorno ativo = ${(retorno1y * 100).toFixed(2)}%, retorno IBOV acumulado = ${(retornoIbovAcumulado * 100).toFixed(2)}%`);

    // ─── RISCO ─────────────────────────────────────────────────────────────
    const volDiaria = desvioPadrao(retornosAtivo);
    const volAnual = volDiaria * Math.sqrt(DIAS_UTEIS_ANO);
    const volDownsideDiaria = desvioPadraoDownside(retornosAtivo);
    const volDownsideAnual = volDownsideDiaria * Math.sqrt(DIAS_UTEIS_ANO);

    const drawdown = calcularDrawdown(precosAtivo);
    const varDiario = calcularVaR(retornosAtivo, 0.95);

    // ─── RETORNO AJUSTADO AO RISCO (usa TAXA_BENCHMARK = 12.4%) ───────────
    const retornoMedioAnual = media(retornosAtivo) * DIAS_UTEIS_ANO;
    const excessoRetorno = retornoMedioAnual - TAXA_BENCHMARK;
    const sharpe = volAnual > 0 ? excessoRetorno / volAnual : 0;
    const sortino = volDownsideAnual > 0 ? excessoRetorno / volDownsideAnual : 0;
    const calmar = Math.abs(drawdown.maximo) > 0 ? retornoMedioAnual / Math.abs(drawdown.maximo) : 0;

    // ─── BETA / ALFA (CAPM com TAXA_BENCHMARK) ────────────────────────────
    const covAtivoIbov = covariancia(retornosAtivo, retornosIbov);
    const varIbov = desvioPadrao(retornosIbov) ** 2;
    const beta = varIbov > 0 ? covAtivoIbov / varIbov : 1;

    const retornoMedioIbovAnual = media(retornosIbov) * DIAS_UTEIS_ANO;
    const alfa = retornoMedioAnual - (TAXA_BENCHMARK + beta * (retornoMedioIbovAnual - TAXA_BENCHMARK));

    const corr = correlacao(retornosAtivo, retornosIbov);
    const r2 = corr ** 2;

    const diffRetornos = retornosAtivo.map((r, i) => r - retornosIbov[i]);
    const trackingError = desvioPadrao(diffRetornos) * Math.sqrt(DIAS_UTEIS_ANO);
    const informationRatio = trackingError > 0 ? alfa / trackingError : 0;

    // ─── COMPORTAMENTAIS ──────────────────────────────────────────────────
    const winRate = calcularWinRate(retornosAtivo);
    const profitFactor = calcularProfitFactor(retornosAtivo);
    const zScore = calcularZScore(precosAtivo);
    const skew = skewness(retornosAtivo);
    const kurt = kurtosis(retornosAtivo);

    // ─── CLASSIFICAÇÕES ───────────────────────────────────────────────────
    const classBeta = classificarBeta(beta);
    const classVol = classificarVolatilidade(volAnual);
    const classSharpe = classificarSharpe(sharpe);
    const classAlfa = classificarAlfa(alfa);

    const scores = calcularScores({
      sharpe, alfa, drawdownMax: drawdown.maximo, volAnual, retorno1y, beta,
    });

    const leitura = gerarLeitura({
      classBeta, classVol, classSharpe, classAlfa, retorno1y, drawdownMax: drawdown.maximo,
    });

    return NextResponse.json({
      ticker,
      nome,
      precoAtual,
      periodoDias: datasComuns.length,

      // Taxas de referência
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
        drawdownDuracaoDias: drawdown.duracaoMaxDias,
        var95: varDiario,
      },

      ajustado: {
        sharpe,
        sortino,
        calmar,
      },

      // ─── MERCADO (vs IBOV) ────────────────────────────────────────────
      // retornoIbov: log anualizado (usado em cálculos de alfa/sharpe)
      // retornoIbovAcumulado: acumulado ponta-a-ponta (usado na UI da barra)
      mercado: {
        beta,
        alfa,
        r2,
        correlacao: corr,
        trackingError,
        informationRatio,
        retornoIbov: retornoMedioIbovAnual,
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
      leitura,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/quant] erro:", err.message);
    return NextResponse.json(
      { error: err.message || "erro ao calcular análise quant" },
      { status: 500 }
    );
  }
}
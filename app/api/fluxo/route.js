// src/app/api/fluxo/route.js
// Endpoint que retorna o sinal de fluxo (verde/amarelo/vermelho) de um ticker
// baseado em EMA(12), EMA(50) e StopATR(4.5, 20, 1)

import { NextResponse } from "next/server";

const BRAPI_TOKEN = process.env.BRAPI_TOKEN;

// ─── INDICADORES TECNICOS ──────────────────────────────────────────────────────

/**
 * Calcula EMA (Exponential Moving Average) sobre array de precos.
 * Retorna array do mesmo tamanho com null nos primeiros (period-1) valores.
 */
function calcularEMA(precos, period) {
  const k = 2 / (period + 1);
  const ema = new Array(precos.length).fill(null);
  if (precos.length < period) return ema;

  // Primeira EMA = SMA dos primeiros `period` valores
  let soma = 0;
  for (let i = 0; i < period; i++) soma += precos[i];
  ema[period - 1] = soma / period;

  // Demais valores
  for (let i = period; i < precos.length; i++) {
    ema[i] = precos[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

/**
 * Calcula ATR (Average True Range) - usado pelo StopATR.
 * True Range = max(high - low, |high - prevClose|, |low - prevClose|)
 */
function calcularATR(highs, lows, closes, period) {
  const tr = new Array(highs.length).fill(null);
  for (let i = 1; i < highs.length; i++) {
    const a = highs[i] - lows[i];
    const b = Math.abs(highs[i] - closes[i - 1]);
    const c = Math.abs(lows[i] - closes[i - 1]);
    tr[i] = Math.max(a, b, c);
  }
  // ATR = SMA do TR (versao classica usada no StopATR da Nelogica)
  const atr = new Array(highs.length).fill(null);
  for (let i = period; i < tr.length; i++) {
    let soma = 0;
    for (let j = i - period + 1; j <= i; j++) soma += tr[j];
    atr[i] = soma / period;
  }
  return atr;
}

/**
 * StopATR(mult, period, direction) - replicacao da funcao NTSL da Nelogica.
 * direction = 1 (long stop) -> calcula stop de protecao por baixo
 * Formula classica: trailing stop baseado em (close - mult * ATR)
 * que so anda pra cima (nunca volta).
 */
function calcularStopATR(highs, lows, closes, mult, period, direction = 1) {
  const atr = calcularATR(highs, lows, closes, period);
  const stop = new Array(closes.length).fill(null);

  for (let i = 0; i < closes.length; i++) {
    if (atr[i] === null) continue;
    const novoStop = direction === 1
      ? closes[i] - mult * atr[i]
      : closes[i] + mult * atr[i];

    if (i === 0 || stop[i - 1] === null) {
      stop[i] = novoStop;
    } else {
      // Trailing: para direction=1 (long), o stop so sobe; nunca desce
      stop[i] = direction === 1
        ? Math.max(stop[i - 1], novoStop)
        : Math.min(stop[i - 1], novoStop);
    }
  }
  return stop;
}

// ─── REGRA DE FLUXO (traducao do NTSL do usuario) ──────────────────────────────

/**
 * Aplica a regra do NTSL:
 *   Verde:    EMA(12) > EMA(50) E Close > StopATR
 *   Vermelho: EMA(12) < EMA(50) E Close < StopATR
 *   Neutro:   demais casos (transicao / divergencia)
 */
function determinarCor(close, ema12, ema50, stop) {
  if (ema12 === null || ema50 === null || stop === null) return "neutro";
  if (ema12 > ema50 && close > stop) return "verde";
  if (ema12 < ema50 && close < stop) return "vermelho";
  return "neutro";
}

// ─── BUSCA DE DADOS NA BRAPI ───────────────────────────────────────────────────

async function buscarHistorico(ticker) {
  if (!BRAPI_TOKEN) {
    throw new Error("BRAPI_TOKEN nao configurado no .env.local");
  }
  const url = `https://brapi.dev/api/quote/${ticker}?range=1y&interval=1d&token=${BRAPI_TOKEN}`;
  const resp = await fetch(url, { next: { revalidate: 3600 } });

if (!resp.ok) {
  const errBody = await resp.text();
  console.error("===== BRAPI ERROR =====");
  console.error("URL chamada:", url.replace(BRAPI_TOKEN, "TOKEN_OCULTO"));
  console.error("Status:", resp.status);
  console.error("Body da resposta:", errBody);
  console.error("=======================");
  throw new Error(`brapi retornou ${resp.status}: ${errBody}`);
}

  const json = await resp.json();
  if (json.error || !json.results?.[0]) {
    throw new Error(json.message || "ticker nao encontrado");
  }

  const result = json.results[0];
  const candles = result.historicalDataPrice || [];

  if (candles.length < 60) {
    throw new Error("historico insuficiente para calcular EMA(50)");
  }

  return {
    nome: result.longName || result.shortName || ticker,
    precoAtual: result.regularMarketPrice,
    candles: candles.map(c => ({
      date: c.date * 1000, // converte unix segundos para ms
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    })).filter(c => c.close != null),
  };
}

// ─── HANDLER GET ───────────────────────────────────────────────────────────────

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker")?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: "ticker obrigatorio" }, { status: 400 });
  }

  try {
    const { nome, precoAtual, candles } = await buscarHistorico(ticker);

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);

    // Calcula indicadores sobre TODA a serie (12 meses) para EMAs estabilizadas
    const ema12 = calcularEMA(closes, 12);
    const ema50 = calcularEMA(closes, 50);
    const stopATR = calcularStopATR(highs, lows, closes, 4.5, 20, 1);

    // Determina a cor de CADA candle
    const cores = candles.map((c, i) =>
      determinarCor(c.close, ema12[i], ema50[i], stopATR[i])
    );

    // Mostra apenas os ultimos 6 meses (~126 candles) no grafico
    const indiceInicio = Math.max(0, candles.length - 126);
    const candlesVisiveis = candles.slice(indiceInicio).map((c, idx) => {
      const i = indiceInicio + idx;
      return {
        date: c.date,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
        ema12: ema12[i],
        ema50: ema50[i],
        stopATR: stopATR[i],
        cor: cores[i],
      };
    });

    // Estado atual = ultimo candle
    const ultimo = candles.length - 1;
    const corAtual = cores[ultimo];
    const ema12Atual = ema12[ultimo];
    const ema50Atual = ema50[ultimo];
    const stopAtual = stopATR[ultimo];
    const closeAtual = closes[ultimo];

    // Calcula inclinacao das EMAs (compara com 5 candles atras)
    const inclinacaoEma12 = ema12[ultimo] > ema12[ultimo - 5] ? "sobe" : "desce";
    const inclinacaoEma50 = ema50[ultimo] > ema50[ultimo - 5] ? "sobe" : "desce";

    // Distancia do close ate a EMA50 em %
    const distanciaEma50 = ((closeAtual - ema50Atual) / ema50Atual) * 100;

    return NextResponse.json({
      ticker,
      nome,
      precoAtual,
      sinal: {
        cor: corAtual, // "verde" | "amarelo" | "vermelho" | "neutro"
        ema12: ema12Atual,
        ema50: ema50Atual,
        stopATR: stopAtual,
        close: closeAtual,
        inclinacaoEma12,
        inclinacaoEma50,
        distanciaEma50,
        emaCurtaAcimaLonga: ema12Atual > ema50Atual,
        precoAcimaStop: closeAtual > stopAtual,
      },
      candles: candlesVisiveis,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/fluxo] erro:", err.message);
    return NextResponse.json(
      { error: err.message || "erro ao calcular fluxo" },
      { status: 500 }
    );
  }
}
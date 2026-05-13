// src/app/api/fluxo-carteira/route.js
// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINT EXCLUSIVO PARA A /CARTEIRA — 12 meses de dados + zonas inteligentes
// Mesmo algoritmo do /api/fluxo (EMA12 + EMA50 + StopATR) mas:
//   - Retorna 12m de candles (em vez de 6m)
//   - Calcula zonas automáticas (suporte, resistência)
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";

const BRAPI_TOKEN = process.env.BRAPI_TOKEN;

// ─── INDICADORES TÉCNICOS ──────────────────────────────────────────────────────

function calcularEMA(precos, period) {
  const k = 2 / (period + 1);
  const ema = new Array(precos.length).fill(null);
  if (precos.length < period) return ema;

  let soma = 0;
  for (let i = 0; i < period; i++) soma += precos[i];
  ema[period - 1] = soma / period;

  for (let i = period; i < precos.length; i++) {
    ema[i] = precos[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

function calcularATR(highs, lows, closes, period) {
  const tr = new Array(highs.length).fill(null);
  for (let i = 1; i < highs.length; i++) {
    const a = highs[i] - lows[i];
    const b = Math.abs(highs[i] - closes[i - 1]);
    const c = Math.abs(lows[i] - closes[i - 1]);
    tr[i] = Math.max(a, b, c);
  }
  const atr = new Array(highs.length).fill(null);
  for (let i = period; i < tr.length; i++) {
    let soma = 0;
    for (let j = i - period + 1; j <= i; j++) soma += tr[j];
    atr[i] = soma / period;
  }
  return atr;
}

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
      stop[i] = direction === 1
        ? Math.max(stop[i - 1], novoStop)
        : Math.min(stop[i - 1], novoStop);
    }
  }
  return stop;
}

function determinarCor(close, ema12, ema50, stop) {
  if (ema12 === null || ema50 === null || stop === null) return "neutro";
  if (ema12 > ema50 && close > stop) return "verde";
  if (ema12 < ema50 && close < stop) return "vermelho";
  return "neutro";
}

// ─── ZONAS INTELIGENTES (NOVO) ────────────────────────────────────────────────

/**
 * Calcula zonas dinâmicas de suporte e resistência baseadas nos últimos N dias.
 * Suporte = menor MÍNIMA dos últimos N dias
 * Resistência = maior MÁXIMA dos últimos N dias
 * 
 * @param {Array} highs - array de máximas
 * @param {Array} lows - array de mínimas
 * @param {number} janela - quantos dias considerar (default 30)
 */
function calcularZonas(highs, lows, janela = 30) {
  if (highs.length < janela) return { suporte: null, resistencia: null };

  const highsRecentes = highs.slice(-janela);
  const lowsRecentes = lows.slice(-janela);

  const resistencia = Math.max(...highsRecentes);
  const suporte = Math.min(...lowsRecentes);

  return { suporte, resistencia };
}

// ─── BUSCA DE DADOS ───────────────────────────────────────────────────────────

async function buscarHistorico(ticker) {
  if (!BRAPI_TOKEN) {
    throw new Error("BRAPI_TOKEN nao configurado no .env.local");
  }
  const url = `https://brapi.dev/api/quote/${ticker}?range=1y&interval=1d&token=${BRAPI_TOKEN}`;
  const resp = await fetch(url, { next: { revalidate: 3600 } });

  if (!resp.ok) {
    const errBody = await resp.text();
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
      date: c.date * 1000,
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

    // Indicadores sobre TODA a série (12m) para EMAs estabilizadas
    const ema12 = calcularEMA(closes, 12);
    const ema50 = calcularEMA(closes, 50);
    const stopATR = calcularStopATR(highs, lows, closes, 4.5, 20, 1);

    const cores = candles.map((c, i) =>
      determinarCor(c.close, ema12[i], ema50[i], stopATR[i])
    );

    // 🌟 MUDANÇA PRINCIPAL: Retorna 12m completos (em vez de 6m)
    // Frontend filtra conforme o usuário escolher (6m / 8m / 1y)
    const candlesCompletos = candles.map((c, i) => ({
      date: c.date,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      ema12: ema12[i],
      ema50: ema50[i],
      stopATR: stopATR[i],
      cor: cores[i],
    }));

    // Estado atual = último candle
    const ultimo = candles.length - 1;
    const corAtual = cores[ultimo];
    const ema12Atual = ema12[ultimo];
    const ema50Atual = ema50[ultimo];
    const stopAtual = stopATR[ultimo];
    const closeAtual = closes[ultimo];

    const inclinacaoEma12 = ema12[ultimo] > ema12[ultimo - 5] ? "sobe" : "desce";
    const inclinacaoEma50 = ema50[ultimo] > ema50[ultimo - 5] ? "sobe" : "desce";
    const distanciaEma50 = ((closeAtual - ema50Atual) / ema50Atual) * 100;

    // 🌟 NOVO: Zonas inteligentes (calculadas dos últimos 30 dias)
    const zonas = calcularZonas(highs, lows, 30);

    // Distância do preço atual até cada zona (em %)
    const distSuporte = zonas.suporte
      ? ((closeAtual - zonas.suporte) / zonas.suporte) * 100
      : null;
    const distResistencia = zonas.resistencia
      ? ((closeAtual - zonas.resistencia) / zonas.resistencia) * 100
      : null;
    const distInvalidacao = stopAtual
      ? ((closeAtual - stopAtual) / stopAtual) * 100
      : null;

    return NextResponse.json({
      ticker,
      nome,
      precoAtual,
      sinal: {
        cor: corAtual,
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
      zonas: {
        suporte: zonas.suporte,
        resistencia: zonas.resistencia,
        invalidacao: stopAtual,
        distanciaSuporte: distSuporte,
        distanciaResistencia: distResistencia,
        distanciaInvalidacao: distInvalidacao,
      },
      candles: candlesCompletos,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/fluxo-carteira] erro:", err.message);
    return NextResponse.json(
      { error: err.message || "erro ao calcular fluxo" },
      { status: 500 }
    );
  }
}
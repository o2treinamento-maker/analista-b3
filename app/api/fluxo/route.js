// src/app/api/fluxo/route.js
// VERSÃO DEBUG: logs detalhados pra investigar o que a Brapi devolve

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

// ─── BUSCA DE DADOS (COM LOGS DE DEBUG) ───────────────────────────────────────

async function buscarHistorico(ticker) {
  if (!BRAPI_TOKEN) {
    throw new Error("BRAPI_TOKEN nao configurado no .env.local");
  }

  const url = `https://brapi.dev/api/quote/${ticker}?range=1y&interval=1d`;

  console.log("\n\n========= 🔍 DEBUG BRAPI =========");
  console.log("⏰ Hora:", new Date().toLocaleTimeString("pt-BR"));
  console.log("Ticker:", ticker);
  console.log("URL:", url);
  console.log("Token primeiros 5:", BRAPI_TOKEN?.slice(0, 5));
  console.log("Token últimos 3:", BRAPI_TOKEN?.slice(-3));
  console.log("Token tamanho:", BRAPI_TOKEN?.length);

  const resp = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${BRAPI_TOKEN}`,
    },
    next: { revalidate: 3600 },
  });

  console.log("📡 Status HTTP:", resp.status);

  if (!resp.ok) {
    const errBody = await resp.text();
    console.error("❌ ERRO na resposta:");
    console.error(errBody);
    console.log("===================================\n\n");
    throw new Error(`brapi retornou ${resp.status}: ${errBody}`);
  }

  const json = await resp.json();

  if (json.error || !json.results?.[0]) {
    console.error("❌ JSON com error:", JSON.stringify(json).slice(0, 500));
    console.log("===================================\n\n");
    throw new Error(json.message || "ticker nao encontrado");
  }

  const result = json.results[0];
  const candles = result.historicalDataPrice || [];

  // 🔍 LOGS DETALHADOS
  console.log("\n📊 DADOS RETORNADOS:");
  console.log("  Symbol:", result.symbol);
  console.log("  longName:", result.longName);
  console.log("  regularMarketPrice:", result.regularMarketPrice);
  console.log("  ⚙️  usedRange:", result.usedRange);
  console.log("  ⚙️  usedInterval:", result.usedInterval);
  console.log("  📅 validRanges:", result.validRanges);
  console.log("  📈 historicalDataPrice.length:", candles.length);

  if (candles.length > 0) {
    console.log("  📅 Primeiro candle:", new Date(candles[0].date * 1000).toLocaleDateString("pt-BR"));
    console.log("  📅 Último candle:", new Date(candles[candles.length - 1].date * 1000).toLocaleDateString("pt-BR"));
    console.log("  💰 Primeiro close:", candles[0].close);
    console.log("  💰 Último close:", candles[candles.length - 1].close);
  } else {
    console.warn("  ⚠️  ARRAY VAZIO! historicalDataPrice retornou []");
  }

  console.log("===================================\n\n");

  if (candles.length < 60) {
    throw new Error(`historico insuficiente para calcular EMA(50) — recebido: ${candles.length} candles, necessário: 60`);
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

// ─── HANDLER GET ──────────────────────────────────────────────────────────────

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

    const ema12 = calcularEMA(closes, 12);
    const ema50 = calcularEMA(closes, 50);
    const stopATR = calcularStopATR(highs, lows, closes, 4.5, 20, 1);

    const cores = candles.map((c, i) =>
      determinarCor(c.close, ema12[i], ema50[i], stopATR[i])
    );

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

    const ultimo = candles.length - 1;
    const corAtual = cores[ultimo];
    const ema12Atual = ema12[ultimo];
    const ema50Atual = ema50[ultimo];
    const stopAtual = stopATR[ultimo];
    const closeAtual = closes[ultimo];

    const inclinacaoEma12 = ema12[ultimo] > ema12[ultimo - 5] ? "sobe" : "desce";
    const inclinacaoEma50 = ema50[ultimo] > ema50[ultimo - 5] ? "sobe" : "desce";
    const distanciaEma50 = ((closeAtual - ema50Atual) / ema50Atual) * 100;

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
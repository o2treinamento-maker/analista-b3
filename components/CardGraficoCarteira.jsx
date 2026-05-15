// src/components/CardGraficoCarteira.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CARD GRÁFICO INTELIGENTE — versão premium institucional
// Exclusivo da /carteira
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect, useMemo } from "react";

const TYPO = {
  headerTitle: { fontSize: 12, fontWeight: 800, letterSpacing: "0.12em" },
  metricLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" },
  metricValue: { fontSize: 14, fontWeight: 800 },
  metricSub: { fontSize: 11, fontWeight: 400, lineHeight: 1.5 },
  disclaimer: { fontSize: 10, fontWeight: 400, lineHeight: 1.6 },
};

const RADIUS = 14;
const PADDING = 18;

const MAX_DESVIO_QUOTE = 0.3;

const CORES = {
  verde: "#34d399",
  amarelo: "#fbbf24",
  laranja: "#fb923c",
  vermelho: "#f87171",
  azul: "#38bdf8",
  neutro: "#94a3b8",

  candleUp: "#34d399",
  candleDown: "#f87171",
  suporte: "#34d399",
  resistencia: "#f87171",
};

const SINAL_CONFIG = {
  verde: {
    cor: CORES.verde,
    label: "FLUXO COMPRADOR",
    regime: "TENDÊNCIA PRIMÁRIA DE ALTA",
    microcopy: "pressão compradora dominante",
    bg: "rgba(52,211,153,.07)",
    border: "rgba(52,211,153,.28)",
    glow: "rgba(52,211,153,.35)",
  },
  vermelho: {
    cor: CORES.vermelho,
    label: "FLUXO VENDEDOR",
    regime: "TENDÊNCIA PRIMÁRIA DE BAIXA",
    microcopy: "pressão vendedora dominante",
    bg: "rgba(248,113,113,.07)",
    border: "rgba(248,113,113,.28)",
    glow: "rgba(248,113,113,.35)",
  },
  amarelo: {
    cor: CORES.amarelo,
    label: "FLUXO EM TRANSIÇÃO",
    regime: "MERCADO EM TRANSIÇÃO",
    microcopy: "direção ainda indefinida",
    bg: "rgba(251,191,36,.07)",
    border: "rgba(251,191,36,.28)",
    glow: "rgba(251,191,36,.35)",
  },
  neutro: {
    cor: CORES.neutro,
    label: "FLUXO NEUTRO",
    regime: "SEM REGIME CLARO",
    microcopy: "sem predominância direcional",
    bg: "rgba(148,163,184,.07)",
    border: "rgba(148,163,184,.22)",
    glow: "rgba(148,163,184,.25)",
  },
};

const PERIODOS = {
  "6m": { dias: 126, label: "6M" },
  "8m": { dias: 168, label: "8M" },
  "1y": { dias: 252, label: "1A" },
};

function mesmoDia(tsA, tsB) {
  const a = new Date(tsA);
  const b = new Date(tsB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function mesclarCotacaoAoVivo(candles, quote, tickerEsperado) {
  if (!candles || candles.length === 0 || !quote) return candles;

  if (quote.symbol && tickerEsperado && quote.symbol !== tickerEsperado) {
    return candles;
  }

  const preco = quote.regularMarketPrice;
  if (preco == null || preco <= 0) return candles;

  const ultimo = candles[candles.length - 1];

  const desvio = Math.abs(preco - ultimo.close) / ultimo.close;
  if (desvio > MAX_DESVIO_QUOTE) {
    console.warn(
      `[Gráfico] Cotação descartada: ${preco} destoa ${(desvio * 100).toFixed(1)}% de ${ultimo.close}`
    );
    return candles;
  }

  const open = quote.regularMarketOpen;
  const high = quote.regularMarketDayHigh;
  const low = quote.regularMarketDayLow;
  const hoje = Date.now();

  if (mesmoDia(ultimo.date, hoje)) {
    const atualizado = {
      ...ultimo,
      close: preco,
      high:
        high != null
          ? Math.max(ultimo.high, high, preco)
          : Math.max(ultimo.high, preco),
      low:
        low != null
          ? Math.min(ultimo.low, low, preco)
          : Math.min(ultimo.low, preco),
      open: open != null ? open : ultimo.open,
    };

    if (ultimo.ema12 != null) {
      const k = 2 / (12 + 1);
      const emaAnterior =
        candles.length >= 2
          ? candles[candles.length - 2].ema12 ?? ultimo.ema12
          : ultimo.ema12;
      atualizado.ema12 = preco * k + emaAnterior * (1 - k);
    }

    return [...candles.slice(0, -1), atualizado];
  }

  const novoCandle = {
    date: hoje,
    open: open != null ? open : ultimo.close,
    high: high != null ? high : preco,
    low: low != null ? low : preco,
    close: preco,
    volume: quote.regularMarketVolume ?? 0,
  };

  if (ultimo.ema12 != null) {
    const k = 2 / (12 + 1);
    novoCandle.ema12 = preco * k + ultimo.ema12 * (1 - k);
  }

  if (ultimo.ema50 != null) {
    const k = 2 / (50 + 1);
    novoCandle.ema50 = preco * k + ultimo.ema50 * (1 - k);
  }

  return [...candles, novoCandle];
}

// ═══════════════════════════════════════════════════════════════════════════
// CÁLCULOS DA LEITURA RÁPIDA
// ═══════════════════════════════════════════════════════════════════════════

// Variação % entre candle de N dias atrás e o atual
function calcularVariacaoNDias(candles, n) {
  if (!candles || candles.length < n + 1) return null;
  const atual = candles[candles.length - 1].close;
  const antigo = candles[candles.length - 1 - n].close;
  if (!antigo) return null;
  return ((atual - antigo) / antigo) * 100;
}

// Detecta MUDANÇA DE REGIME nos últimos N candles
// (continua usando cruzamento de EMAs internamente, mas a UI nunca expõe isso)
function detectarMudancaRegime(candles, lookback = 10) {
  if (!candles || candles.length < lookback + 1) return null;

  for (let i = candles.length - 1; i >= candles.length - lookback; i--) {
    const atual = candles[i];
    const anterior = candles[i - 1];

    if (
      atual?.ema12 == null ||
      atual?.ema50 == null ||
      anterior?.ema12 == null ||
      anterior?.ema50 == null
    ) {
      continue;
    }

    const diffAtual = atual.ema12 - atual.ema50;
    const diffAnterior = anterior.ema12 - anterior.ema50;

    // Mudança para regime comprador
    if (diffAnterior < 0 && diffAtual >= 0) {
      return {
        tipo: "alta",
        diasAtras: candles.length - 1 - i,
      };
    }

    // Mudança para regime vendedor
    if (diffAnterior > 0 && diffAtual <= 0) {
      return {
        tipo: "baixa",
        diasAtras: candles.length - 1 - i,
      };
    }
  }

  return null;
}

// Helper: descreve quando algo aconteceu em linguagem natural
function descreverDias(diasAtras) {
  if (diasAtras === 0) return "hoje";
  if (diasAtras === 1) return "ontem";
  if (diasAtras <= 7) return `há ${diasAtras} dias`;
  if (diasAtras <= 14) return "na última semana";
  if (diasAtras <= 30) return "nas últimas semanas";
  return "recentemente";
}

// Gera a frase de leitura em linguagem de FLUXO (sem expor setup técnico)
function gerarFraseLeitura({ candles, sinal, zonas, distSuporte, distResist }) {
  if (!candles || candles.length === 0) return "Sem dados suficientes.";

  // Prioridade 1: Mudança de regime recente (últimos 7 dias)
  const mudanca = detectarMudancaRegime(candles, 7);
  if (mudanca) {
    const quando = descreverDias(mudanca.diasAtras);

    if (mudanca.tipo === "alta") {
      return `Regime virou comprador ${quando} — o fluxo passou a favorecer compradores no curto prazo.`;
    } else {
      return `Regime virou vendedor ${quando} — o fluxo passou a favorecer vendedores no curto prazo.`;
    }
  }

  // Prioridade 2: Próximo de resistência (< 3%)
  if (distResist != null && distResist > 0 && distResist < 3) {
    return `Preço operando próximo da resistência — apenas ${distResist.toFixed(1)}% de distância, zona de decisão.`;
  }

  // Prioridade 3: Próximo de suporte (< 3% abaixo)
  if (distSuporte != null && distSuporte > -3 && distSuporte < 0) {
    return `Preço operando próximo do suporte — ${Math.abs(distSuporte).toFixed(1)}% abaixo do preço atual, zona de defesa.`;
  }

  // Prioridade 4: Distância confortável das zonas (entre suporte e resistência, no meio)
  if (
    distResist != null &&
    distSuporte != null &&
    distResist > 3 &&
    distSuporte < -3
  ) {
    if (sinal.cor === "verde") {
      return `Fluxo comprador consolidado — preço transita acima das zonas de defesa, com espaço até a resistência.`;
    }
    if (sinal.cor === "vermelho") {
      return `Fluxo vendedor consolidado — preço sob pressão, distante do suporte e da resistência.`;
    }
    if (sinal.cor === "amarelo") {
      return `Fluxo em transição — preço sem direção clara entre suporte e resistência.`;
    }
  }

  // Prioridade 5: Fallback por regime
  if (sinal.cor === "verde") {
    return "Fluxo comprador dominando — pressão compradora se mantém no curto prazo.";
  }
  if (sinal.cor === "vermelho") {
    return "Fluxo vendedor dominando — pressão vendedora se mantém no curto prazo.";
  }
  if (sinal.cor === "amarelo") {
    return "Fluxo em transição — sem direção clara no curto prazo.";
  }
  return "Sem regime direcional claro no momento.";
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES INTERNOS
// ═══════════════════════════════════════════════════════════════════════════

function StatLinha({ label, valor, sub, cor }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "96px 1fr",
        gap: 10,
        alignItems: "baseline",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,.055)",
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,.38)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 13,
            fontWeight: 900,
            color: cor || "rgba(255,255,255,.86)",
            lineHeight: 1.2,
          }}
        >
          {valor}
        </div>

        {sub && (
          <div
            style={{
              ...TYPO.metricSub,
              fontSize: 10,
              color: "rgba(255,255,255,.42)",
              marginTop: 3,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// Chip de variação (HOJE / 5D / 30D)
function ChipVariacao({ label, valor }) {
  const cor =
    valor == null
      ? "rgba(255,255,255,.4)"
      : valor > 0
      ? CORES.verde
      : valor < 0
      ? CORES.vermelho
      : "rgba(255,255,255,.5)";

  const bg =
    valor == null
      ? "rgba(255,255,255,.025)"
      : valor > 0
      ? "rgba(52,211,153,.06)"
      : valor < 0
      ? "rgba(248,113,113,.06)"
      : "rgba(255,255,255,.03)";

  const borda =
    valor == null
      ? "rgba(255,255,255,.06)"
      : valor > 0
      ? "rgba(52,211,153,.18)"
      : valor < 0
      ? "rgba(248,113,113,.18)"
      : "rgba(255,255,255,.06)";

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "8px 10px",
        background: bg,
        border: `1px solid ${borda}`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,.38)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 13,
          fontWeight: 900,
          color: cor,
          lineHeight: 1,
        }}
      >
        {valor == null
          ? "—"
          : (valor >= 0 ? "+" : "") + valor.toFixed(2).replace(".", ",") + "%"}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function CardGraficoCarteira({ ticker }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [periodo, setPeriodo] = useState("8m");
  const [quoteAoVivo, setQuoteAoVivo] = useState(null);

  useEffect(() => {
    if (!ticker) return;

    setCarregando(true);
    setErro(null);
    setDados(null);
    setQuoteAoVivo(null);

    fetch(`/api/fluxo-carteira?ticker=${encodeURIComponent(ticker)}`)
      .then(async (r) => {
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(text.slice(0, 220));
        }
      })
      .then((d) => {
        if (d.error) setErro(d.error);
        else setDados(d);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [ticker]);

  useEffect(() => {
    if (!ticker) return;

    let cancelado = false;

    async function buscarQuote() {
      try {
        const token = process.env.NEXT_PUBLIC_BRAPI_TOKEN || "";
        const url = `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?token=${token}`;
        const r = await fetch(url);
        const j = await r.json();
        const ativo = j?.results?.[0];

        if (ativo && !cancelado && ativo.symbol === ticker) {
          setQuoteAoVivo(ativo);
        }
      } catch (err) {
        console.error("Brapi quote (gráfico):", err);
      }
    }

    buscarQuote();
    const interval = setInterval(buscarQuote, 60000);

    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [ticker]);

  const candlesComLive = useMemo(() => {
    if (!dados?.candles) return [];
    return mesclarCotacaoAoVivo(dados.candles, quoteAoVivo, ticker);
  }, [dados, quoteAoVivo, ticker]);

  const candlesFiltrados = useMemo(() => {
    if (!candlesComLive.length) return [];

    const diasDesejados = PERIODOS[periodo].dias;
    const inicio = Math.max(0, candlesComLive.length - diasDesejados);

    return candlesComLive.slice(inicio);
  }, [candlesComLive, periodo]);

  // ─── Leitura rápida: variações 5d e 30d ──────────────────────────────────
  const leituraRapida = useMemo(() => {
    if (!candlesComLive.length || !dados) return null;

    return {
      variacao5d: calcularVariacaoNDias(candlesComLive, 5),
      variacao30d: calcularVariacaoNDias(candlesComLive, 30),
    };
  }, [candlesComLive, dados]);

  if (carregando) {
    return (
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(8,15,30,.92), rgba(3,7,18,.96))",
          border: "1px solid rgba(255,255,255,.07)",
          borderRadius: RADIUS,
          padding: PADDING,
          minHeight: 380,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,.035), 0 0 36px rgba(0,0,0,.35)",
        }}
      >
        <style>{`
          @keyframes spinCarteira {
            to { transform: rotate(360deg); }
          }
        `}</style>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "1.5px solid transparent",
              borderTopColor: CORES.azul,
              borderRightColor: "rgba(56,189,248,.35)",
              animation: "spinCarteira 1s linear infinite",
            }}
          />

          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.42)",
            }}
          >
            CALCULANDO MOTOR DE FLUXO...
          </span>
        </div>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div
        style={{
          background: "rgba(20,4,4,.52)",
          border: "1px solid rgba(248,113,113,.18)",
          borderRadius: RADIUS,
          padding: PADDING,
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.headerTitle,
            color: CORES.vermelho,
          }}
        >
          ANÁLISE INDISPONÍVEL
        </span>

        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,.55)",
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          {erro || "Não foi possível carregar os dados."}
        </p>
      </div>
    );
  }

  const { sinal, zonas, ticker: tk } = dados;
  const cfg = SINAL_CONFIG[sinal.cor] || SINAL_CONFIG.neutro;

  const W = 800;
  const H = 340;
  const PAD_TOP = 20;
  const PAD_BOTTOM = 30;
  const PAD_LEFT = 8;
  const PAD_RIGHT = 72;

  const chartH = H - PAD_TOP - PAD_BOTTOM;
  const chartW = W - PAD_LEFT - PAD_RIGHT;

  const allValues = [];

  candlesFiltrados.forEach((c) => {
    allValues.push(c.high, c.low);
    if (c.ema12 != null) allValues.push(c.ema12);
    if (c.ema50 != null) allValues.push(c.ema50);
  });

  if (zonas.suporte != null) allValues.push(zonas.suporte);
  if (zonas.resistencia != null) allValues.push(zonas.resistencia);
  if (sinal.stopATR != null) allValues.push(sinal.stopATR);

  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const padding = range * 0.06;
  const yMin = minVal - padding;
  const yMax = maxVal + padding;

  const yToPx = (v) =>
    PAD_TOP + chartH - ((v - yMin) / (yMax - yMin)) * chartH;

  const xToPx = (i) =>
    PAD_LEFT + (i / Math.max(1, candlesFiltrados.length - 1)) * chartW;

  const candleW = Math.max(1.5, (chartW / candlesFiltrados.length) * 0.7);

  function corSegmentoEma50(i) {
    const JANELA = 5;

    if (i < JANELA) return CORES.neutro;

    const atual = candlesFiltrados[i].ema50;
    const passada = candlesFiltrados[i - JANELA].ema50;

    if (atual == null || passada == null) return CORES.neutro;

    const variacaoPct = ((atual - passada) / passada) * 100;

    if (variacaoPct > 0.3) return CORES.verde;
    if (variacaoPct < -0.3) return CORES.vermelho;

    return CORES.amarelo;
  }

  const fmtMoeda = (v) =>
    v?.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }) || "—";

  const fmtPct = (v) =>
    v == null ? "—" : (v >= 0 ? "+" : "") + v.toFixed(2) + "%";

  const fmtData = (ts) => {
    const d = new Date(ts);
    return d
      .toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      })
      .toUpperCase();
  };

  const labelsEixoX = [];

  for (let i = 0; i < 4; i++) {
    const idx = Math.floor((candlesFiltrados.length - 1) * (i / 3));

    labelsEixoX.push({
      x: xToPx(idx),
      label: fmtData(candlesFiltrados[idx].date),
      align: i === 0 ? "start" : i === 3 ? "end" : "middle",
    });
  }

  const ultimoCloseHistorico =
    dados.candles[dados.candles.length - 1]?.close ?? sinal.close;

  const quoteValida =
    quoteAoVivo &&
    quoteAoVivo.symbol === ticker &&
    quoteAoVivo.regularMarketPrice != null &&
    Math.abs(quoteAoVivo.regularMarketPrice - ultimoCloseHistorico) /
      ultimoCloseHistorico <=
      MAX_DESVIO_QUOTE;

  const precoAtual = quoteValida
    ? quoteAoVivo.regularMarketPrice
    : sinal.close;

  const variacao = quoteValida
    ? quoteAoVivo.regularMarketChangePercent
    : candlesFiltrados.length >= 2
    ? ((precoAtual - candlesFiltrados[candlesFiltrados.length - 2].close) /
        candlesFiltrados[candlesFiltrados.length - 2].close) *
      100
    : 0;

  // ─── Frase de leitura rápida (linguagem de FLUXO) ────────────────────────
  const fraseLeitura = gerarFraseLeitura({
    candles: candlesComLive,
    sinal,
    zonas,
    distSuporte: zonas.distanciaSuporte,
    distResist: zonas.distanciaResistencia,
  });

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(8,15,30,.92), rgba(3,7,18,.97))",
        border: `1px solid ${cfg.border}`,
        borderRadius: RADIUS,
        padding: PADDING,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.035), 0 0 44px ${cfg.glow}12`,
      }}
    >
      <style>{`
        @keyframes pulseSinalCarteira {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .6; transform: scale(.82); }
        }

        @media (max-width: 900px) {
          .carteira-header {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .carteira-header-center {
            justify-content: flex-start !important;
          }

          .carteira-operacional {
            grid-template-columns: 1fr !important;
          }

          .carteira-variacoes {
            flex-direction: column !important;
          }
        }
      `}</style>

      {/* HEADER */}
      <div
        className="carteira-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            flexWrap: "wrap",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 15 }}>📡</span>

          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.headerTitle,
              color: cfg.cor,
              textTransform: "uppercase",
            }}
          >
            Motor de Fluxo · Qyntor Signal
          </span>

          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,.38)",
              padding: "3px 8px",
              borderRadius: 999,
              background: "rgba(255,255,255,.035)",
              border: "1px solid rgba(255,255,255,.06)",
            }}
          >
            REAL TIME ENGINE
          </span>
        </div>

        <div
          className="carteira-header-center"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flex: 1,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "5px 11px",
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: 999,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: cfg.cor,
                boxShadow: `0 0 12px ${cfg.cor}`,
                animation: "pulseSinalCarteira 2s ease infinite",
              }}
            />

            <span
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 9,
                fontWeight: 800,
                color: cfg.cor,
                letterSpacing: "0.08em",
              }}
            >
              {cfg.label}
            </span>
          </div>

          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.5)",
              textTransform: "uppercase",
            }}
          >
            {tk || ticker}
          </span>

          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 24,
              fontWeight: 950,
              color: "rgba(255,255,255,.96)",
              letterSpacing: "-0.03em",
              textShadow: `0 0 18px ${cfg.glow}`,
              lineHeight: 1,
            }}
          >
            {fmtMoeda(precoAtual)}
          </span>

          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 12,
              fontWeight: 900,
              color: variacao >= 0 ? CORES.verde : CORES.vermelho,
            }}
          >
            {fmtPct(variacao)}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 3,
            background: "rgba(255,255,255,.035)",
            borderRadius: 9,
            border: "1px solid rgba(255,255,255,.06)",
            flexShrink: 0,
          }}
        >
          {Object.entries(PERIODOS).map(([key, p]) => {
            const ativo = periodo === key;

            return (
              <button
                key={key}
                onClick={() => setPeriodo(key)}
                style={{
                  padding: "6px 13px",
                  border: "none",
                  borderRadius: 7,
                  background: ativo ? `${cfg.cor}20` : "transparent",
                  color: ativo ? cfg.cor : "rgba(255,255,255,.42)",
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 11,
                  fontWeight: ativo ? 900 : 700,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  boxShadow: ativo
                    ? `inset 0 0 0 1px ${cfg.cor}35`
                    : "none",
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* GRÁFICO */}
      <div
        style={{
          background:
            "radial-gradient(circle at top, rgba(56,189,248,.055), transparent 58%), rgba(2,6,23,.62)",
          borderRadius: 12,
          padding: 12,
          marginBottom: 14,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,.055)",
          boxShadow: "inset 0 0 80px rgba(0,0,0,.36)",
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
          }}
        >
          {[0.25, 0.5, 0.75].map((p) => (
            <line
              key={p}
              x1={PAD_LEFT}
              y1={PAD_TOP + chartH * p}
              x2={W - PAD_RIGHT}
              y2={PAD_TOP + chartH * p}
              stroke="rgba(255,255,255,.045)"
              strokeWidth="1"
            />
          ))}

          {zonas.resistencia != null && (
            <>
              <line
                x1={PAD_LEFT}
                y1={yToPx(zonas.resistencia)}
                x2={W - PAD_RIGHT}
                y2={yToPx(zonas.resistencia)}
                stroke={CORES.resistencia}
                strokeOpacity=".32"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={W - PAD_RIGHT - 4}
                y={yToPx(zonas.resistencia) - 5}
                fontFamily="'IBM Plex Mono',monospace"
                fontSize="9"
                fill={CORES.resistencia}
                fillOpacity=".72"
                textAnchor="end"
              >
                RESISTÊNCIA · {zonas.resistencia.toFixed(2)}
              </text>
            </>
          )}

          {zonas.suporte != null && (
            <>
              <line
                x1={PAD_LEFT}
                y1={yToPx(zonas.suporte)}
                x2={W - PAD_RIGHT}
                y2={yToPx(zonas.suporte)}
                stroke={CORES.suporte}
                strokeOpacity=".32"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={W - PAD_RIGHT - 4}
                y={yToPx(zonas.suporte) + 13}
                fontFamily="'IBM Plex Mono',monospace"
                fontSize="9"
                fill={CORES.suporte}
                fillOpacity=".72"
                textAnchor="end"
              >
                SUPORTE · {zonas.suporte.toFixed(2)}
              </text>
            </>
          )}

          {candlesFiltrados.map((c, i) => {
            const x = xToPx(i);
            const yOpen = yToPx(c.open);
            const yClose = yToPx(c.close);
            const yHigh = yToPx(c.high);
            const yLow = yToPx(c.low);
            const isUp = c.close >= c.open;
            const cor = isUp ? CORES.candleUp : CORES.candleDown;
            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(1, Math.abs(yClose - yOpen));

            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={cor}
                  strokeWidth="1"
                  opacity=".86"
                />
                <rect
                  x={x - candleW / 2}
                  y={bodyTop}
                  width={candleW}
                  height={bodyHeight}
                  fill={cor}
                  stroke={cor}
                  strokeWidth=".5"
                  opacity=".92"
                />
              </g>
            );
          })}

          <polyline
            points={candlesFiltrados
              .map((c, i) =>
                c.ema12 != null ? `${xToPx(i)},${yToPx(c.ema12)}` : null
              )
              .filter(Boolean)
              .join(" ")}
            fill="none"
            stroke="rgba(255,255,255,.48)"
            strokeWidth="1.2"
            strokeDasharray="3,3"
            strokeLinecap="round"
          />

          {candlesFiltrados.slice(1).map((c, idx) => {
            const i = idx + 1;

            if (c.ema50 == null || candlesFiltrados[i - 1].ema50 == null) {
              return null;
            }

            const cor = corSegmentoEma50(i);

            return (
              <g key={`ema50-seg-${i}`}>
                <line
                  x1={xToPx(i - 1)}
                  y1={yToPx(candlesFiltrados[i - 1].ema50)}
                  x2={xToPx(i)}
                  y2={yToPx(c.ema50)}
                  stroke={cor}
                  strokeWidth="7"
                  opacity=".08"
                  strokeLinecap="round"
                />

                <line
                  x1={xToPx(i - 1)}
                  y1={yToPx(candlesFiltrados[i - 1].ema50)}
                  x2={xToPx(i)}
                  y2={yToPx(c.ema50)}
                  stroke={cor}
                  strokeWidth="2.3"
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {candlesFiltrados.length > 0 &&
            (() => {
              const ultimo = candlesFiltrados[candlesFiltrados.length - 1];
              const isUp = ultimo.close >= ultimo.open;
              const corLabel = isUp ? CORES.candleUp : CORES.candleDown;
              const yPrecoAtual = yToPx(ultimo.close);
              const xLabelStart = W - PAD_RIGHT + 12;

              return (
                <>
                  <line
                    x1={xToPx(candlesFiltrados.length - 1)}
                    y1={yPrecoAtual}
                    x2={xLabelStart}
                    y2={yPrecoAtual}
                    stroke={corLabel}
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity=".65"
                  />

                  <rect
                    x={xLabelStart}
                    y={yPrecoAtual - 9}
                    width="48"
                    height="18"
                    rx="4"
                    fill={corLabel}
                    opacity=".94"
                  />

                  <text
                    x={xLabelStart + 24}
                    y={yPrecoAtual + 4}
                    fontFamily="'IBM Plex Mono',monospace"
                    fontSize="10"
                    fontWeight="800"
                    fill="#020617"
                    textAnchor="middle"
                  >
                    {ultimo.close.toFixed(2)}
                  </text>
                </>
              );
            })()}

          {labelsEixoX.map((l, idx) => (
            <text
              key={idx}
              x={l.x}
              y={H - 8}
              fontFamily="'IBM Plex Mono',monospace"
              fontSize="9"
              fill="rgba(255,255,255,.32)"
              textAnchor={l.align}
            >
              {l.label}
            </text>
          ))}
        </svg>
      </div>

      {/* LEGENDA EMA */}
      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 14,
          padding: "9px 12px",
          background: "rgba(2,6,23,.5)",
          borderRadius: 9,
          border: "1px solid rgba(255,255,255,.055)",
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 10,
          color: "rgba(255,255,255,.5)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span
            style={{
              width: 18,
              height: 0,
              borderTop: "1.2px dashed rgba(255,255,255,.58)",
            }}
          />
          EMA12 · tendência curta
        </span>

        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ display: "inline-flex", gap: 1 }}>
            <span style={{ width: 6, height: 3, background: CORES.verde }} />
            <span style={{ width: 5, height: 3, background: CORES.amarelo }} />
            <span style={{ width: 6, height: 3, background: CORES.vermelho }} />
          </span>
          EMA50 · direção estrutural
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* LEITURA RÁPIDA — linguagem de fluxo + variações                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(8,15,30,.82), rgba(3,8,20,.92))",
          border: `1px solid ${cfg.border}`,
          borderRadius: 12,
          padding: "13px 14px",
          marginBottom: 14,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,.03), 0 0 24px ${cfg.glow}06`,
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricLabel,
            color: cfg.cor,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 10,
          }}
        >
          <span style={{ fontSize: 11 }}>⚡</span>
          Leitura rápida do fluxo
        </div>

        <div
          style={{
            fontSize: 13,
            lineHeight: 1.55,
            color: "rgba(255,255,255,.82)",
            marginBottom: 12,
            fontWeight: 500,
          }}
        >
          {fraseLeitura}
        </div>

        <div
          className="carteira-variacoes"
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <ChipVariacao label="HOJE" valor={variacao} />
          <ChipVariacao label="5 DIAS" valor={leituraRapida?.variacao5d} />
          <ChipVariacao label="30 DIAS" valor={leituraRapida?.variacao30d} />
        </div>
      </div>

      {/* PAINEL OPERACIONAL + LEITURA DO REGIME */}
      <div
        className="carteira-operacional"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(8,15,30,.78), rgba(3,8,20,.9))",
            border: "1px solid rgba(255,255,255,.055)",
            borderRadius: 12,
            padding: "12px 14px",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,.03), 0 0 24px rgba(0,0,0,.22)",
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.38)",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Painel operacional
          </div>

          <StatLinha
            label="Suporte"
            valor={fmtMoeda(zonas.suporte)}
            sub={`${fmtPct(zonas.distanciaSuporte)} do preço`}
            cor={CORES.suporte}
          />

          <StatLinha
            label="Resistência"
            valor={fmtMoeda(zonas.resistencia)}
            sub={`${fmtPct(zonas.distanciaResistencia)} do preço`}
            cor={CORES.resistencia}
          />

          <StatLinha
            label="Direção"
            valor={
              sinal.inclinacaoEma50 === "sobe" ? "COMPRADORA" : "VENDEDORA"
            }
            sub={
              sinal.inclinacaoEma50 === "sobe"
                ? "fluxo ascendente"
                : "fluxo descendente"
            }
            cor={
              sinal.inclinacaoEma50 === "sobe" ? CORES.verde : CORES.vermelho
            }
          />
        </div>

        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(8,15,30,.78), rgba(3,8,20,.9))",
            border: `1px solid ${cfg.border}`,
            borderRadius: 12,
            padding: "12px 14px",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,.03), 0 0 24px rgba(0,0,0,.22)",
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: cfg.cor,
              textTransform: "uppercase",
              marginBottom: 10,
            }}
          >
            Leitura do regime
          </div>

          <div
            style={{
              fontSize: 13,
              lineHeight: 1.75,
              color: "rgba(255,255,255,.72)",
            }}
          >
            O modelo identifica o regime atual como{" "}
            <strong style={{ color: cfg.cor }}>
              {cfg.label.toLowerCase()}
            </strong>
            . A leitura combina tendência curta, direção estrutural e zonas
            recentes de preço para avaliar a dominância do fluxo.
          </div>

          <div
            style={{
              marginTop: 12,
              padding: "10px 11px",
              borderRadius: 9,
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              color: "rgba(255,255,255,.62)",
              fontSize: 12,
              lineHeight: 1.6,
            }}
          >
            {cfg.microcopy}. Use suporte e resistência como zonas operacionais
            de referência, não como pontos exatos.
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          padding: "9px 12px",
          background: "rgba(251,191,36,.04)",
          border: "1px solid rgba(251,191,36,.12)",
          borderRadius: 8,
          display: "flex",
          alignItems: "flex-start",
          gap: 7,
        }}
      >
        <span
          style={{
            color: "rgba(251,191,36,.82)",
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          ⚠
        </span>

        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.disclaimer,
            color: "rgba(255,255,255,.48)",
          }}
        >
          Modelo quantitativo proprietário baseado em tendência, estrutura de
          fluxo e volatilidade adaptativa. Indicador informativo · não constitui
          recomendação de compra ou venda.
        </span>
      </div>
    </div>
  );
}
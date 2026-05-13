// src/components/CardGraficoCarteira.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CARD GRÁFICO INTELIGENTE V4 — exclusivo da /carteira
// ═══════════════════════════════════════════════════════════════════════════
// V4 — EMA12 discreta:
//   ✓ EMA12 agora é TRACEJADA BRANCA (estilo CardFluxo original)
//   ✓ Não compete mais com a EMA50 colorida
//   ✓ Legenda atualizada
//
// Mantido do V3:
//   ✓ EMA50 com cor DINÂMICA por segmento (verde/amarelo/vermelho)
//   ✓ Label do preço atual COMPACTO e AFASTADO
//   ✓ Candlesticks reais
//   ✓ Zonas dos últimos 30 dias (suporte/resistência/invalidação)
//   ✓ Períodos selecionáveis: 6m / 8m (default) / 1y
//   ✓ Sinal vigente discreto
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect, useMemo } from "react";

const TYPO = {
  headerTitle:    { fontSize: 12, fontWeight: 700, letterSpacing: "0.1em" },
  metricLabel:    { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" },
  metricValue:    { fontSize: 14, fontWeight: 700 },
  metricSub:      { fontSize: 11, fontWeight: 400 },
  disclaimer:     { fontSize: 10, fontWeight: 400, lineHeight: 1.6 },
};

const CORES = {
  candleUp:    "#26a69a",  // verde TradingView clássico
  candleDown:  "#ef5350",  // vermelho TradingView clássico
  ema12:       "#42a5f5",  // azul claro
  ema50:       "#ffa726",  // laranja
  suporte:     "#26a69a",
  resistencia: "#ef5350",
  invalidacao: "#fbbf24",  // amarelo
};

const SINAL_CONFIG = {
  verde: {
    cor: "#26a69a",
    label: "FLUXO COMPRADOR",
    microcopy: "tendência de alta confirmada",
    bg: "rgba(38,166,154,0.06)",
    border: "rgba(38,166,154,0.25)",
  },
  vermelho: {
    cor: "#ef5350",
    label: "FLUXO VENDEDOR",
    microcopy: "tendência de baixa confirmada",
    bg: "rgba(239,83,80,0.06)",
    border: "rgba(239,83,80,0.25)",
  },
  amarelo: {
    cor: "#fbbf24",
    label: "FLUXO EM TRANSIÇÃO",
    microcopy: "indefinido, mudança de direção",
    bg: "rgba(251,191,36,0.06)",
    border: "rgba(251,191,36,0.25)",
  },
  neutro: {
    cor: "#94a3b8",
    label: "FLUXO EM TRANSIÇÃO",
    microcopy: "indefinido, mudança de direção",
    bg: "rgba(148,163,184,0.06)",
    border: "rgba(148,163,184,0.20)",
  },
};

const PERIODOS = {
  "6m":  { dias: 126, label: "6M" },
  "8m":  { dias: 168, label: "8M" },
  "1y":  { dias: 252, label: "1A" },
};

export default function CardGraficoCarteira({ ticker }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [periodo, setPeriodo] = useState("8m");

  useEffect(() => {
    if (!ticker) return;
    setCarregando(true);
    setErro(null);
    setDados(null);

    fetch(`/api/fluxo-carteira?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setErro(d.error);
        else setDados(d);
      })
      .catch(e => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [ticker]);

  const candlesFiltrados = useMemo(() => {
    if (!dados?.candles) return [];
    const diasDesejados = PERIODOS[periodo].dias;
    const inicio = Math.max(0, dados.candles.length - diasDesejados);
    return dados.candles.slice(inicio);
  }, [dados, periodo]);

  // ─── LOADING ───────────────────────────────────────────────────────────
  if (carregando) {
    return (
      <div style={{
        background: "rgba(4,8,20,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 14,
        padding: 20,
        minHeight: 380,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            border: "1.5px solid transparent",
            borderTopColor: CORES.candleUp,
            animation: "spin 1s linear infinite",
          }} />
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricLabel,
            color: "rgba(255,255,255,0.4)",
          }}>CALCULANDO SINAL...</span>
        </div>
      </div>
    );
  }

  // ─── ERRO ──────────────────────────────────────────────────────────────
  if (erro || !dados) {
    return (
      <div style={{
        background: "rgba(20,4,4,0.5)",
        border: "1px solid rgba(248,113,113,0.15)",
        borderRadius: 14,
        padding: 20,
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.headerTitle,
          color: CORES.candleDown,
        }}>ANÁLISE INDISPONÍVEL</span>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 8, marginBottom: 0 }}>
          {erro || "não foi possível carregar"}
        </p>
      </div>
    );
  }

  const { sinal, zonas, ticker: tk } = dados;
  const cfg = SINAL_CONFIG[sinal.cor] || SINAL_CONFIG.neutro;

  // ═══════════════════════════════════════════════════════════════════════
  // DIMENSÕES DO GRÁFICO
  // ═══════════════════════════════════════════════════════════════════════
  const W = 800, H = 340, PAD_TOP = 20, PAD_BOTTOM = 30, PAD_LEFT = 8, PAD_RIGHT = 72;
  const chartH = H - PAD_TOP - PAD_BOTTOM;
  const chartW = W - PAD_LEFT - PAD_RIGHT;

  // Range de valores
  const allValues = [];
  candlesFiltrados.forEach(c => {
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

  const yToPx = v => PAD_TOP + chartH - ((v - yMin) / (yMax - yMin)) * chartH;
  const xToPx = i => PAD_LEFT + (i / Math.max(1, candlesFiltrados.length - 1)) * chartW;

  // Largura de cada candle
  const candleW = Math.max(1.5, (chartW / candlesFiltrados.length) * 0.7);

  // ─── COR DINÂMICA DA EMA50 (por segmento) ─────────────────────────────
  // Compara o valor da EMA50 com 5 candles atrás:
  //   variação > +0.3% → VERDE (subindo)
  //   variação < -0.3% → VERMELHO (descendo)
  //   entre os dois    → AMARELO (lateral)
  function corSegmentoEma50(i) {
    const JANELA = 5;
    if (i < JANELA) return "#94a3b8"; // cinza pros primeiros candles
    const atual = candlesFiltrados[i].ema50;
    const passada = candlesFiltrados[i - JANELA].ema50;
    if (atual == null || passada == null) return "#94a3b8";
    const variacaoPct = ((atual - passada) / passada) * 100;
    if (variacaoPct > 0.3) return "#34d399";  // verde
    if (variacaoPct < -0.3) return "#f87171"; // vermelho
    return "#fbbf24";                          // amarelo (lateral)
  }

  // ─── FORMATAÇÃO ──────────────────────────────────────────────────────
  const fmtMoeda = v => v?.toLocaleString("pt-BR", {
    style: "currency", currency: "BRL"
  }) || "—";
  const fmtPct = v => v == null ? "—" : (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
  const fmtData = ts => {
    const d = new Date(ts);
    return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).toUpperCase();
  };

  // Labels do eixo X (4 espalhados)
  const numLabelsX = 4;
  const labelsEixoX = [];
  for (let i = 0; i < numLabelsX; i++) {
    const idx = Math.floor((candlesFiltrados.length - 1) * (i / (numLabelsX - 1)));
    labelsEixoX.push({
      x: xToPx(idx),
      label: fmtData(candlesFiltrados[idx].date),
      align: i === 0 ? "start" : i === numLabelsX - 1 ? "end" : "middle",
    });
  }

  // Preço atual e variação
  const precoAtual = sinal.close;
  const precoAnterior = candlesFiltrados.length >= 2
    ? candlesFiltrados[candlesFiltrados.length - 2].close
    : precoAtual;
  const variacao = ((precoAtual - precoAnterior) / precoAnterior) * 100;

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      background: "rgba(4,8,20,0.85)",
      border: `1px solid ${cfg.border}`,
      borderRadius: 14,
      padding: 16,
    }}>
      <style>{`
        @keyframes pulseSinal {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
      `}</style>

      {/* ═════════════ HEADER ═════════════ */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 12,
        flexWrap: "wrap",
      }}>
        {/* Esquerda: título + sinal */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 15 }}>📡</span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.headerTitle,
            color: cfg.cor,
            textTransform: "uppercase",
          }}>
            Fluxo Inteligente
          </span>

          {/* Sinal vigente discreto */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "3px 10px",
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: 999,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: cfg.cor,
              animation: "pulseSinal 2s ease infinite",
            }} />
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 9, fontWeight: 700,
              color: cfg.cor, letterSpacing: "0.08em",
            }}>{cfg.label}</span>
          </div>
        </div>

        {/* Direita: botões de período */}
        <div style={{
          display: "flex", gap: 4, padding: 3,
          background: "rgba(255,255,255,0.04)",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {Object.entries(PERIODOS).map(([key, p]) => {
            const ativo = periodo === key;
            return (
              <button
                key={key}
                onClick={() => setPeriodo(key)}
                style={{
                  padding: "5px 12px", border: "none", borderRadius: 6,
                  background: ativo ? cfg.cor + "20" : "transparent",
                  color: ativo ? cfg.cor : "rgba(255,255,255,0.4)",
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 11,
                  fontWeight: ativo ? 800 : 600,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: ativo ? `inset 0 0 0 1px ${cfg.cor}35` : "none",
                }}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* PREÇO + variação (logo abaixo do header) */}
      <div style={{
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        marginBottom: 12,
        paddingLeft: 25,
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 24,
          fontWeight: 800,
          color: "rgba(255,255,255,0.95)",
          letterSpacing: "-0.02em",
        }}>
          {fmtMoeda(precoAtual)}
        </span>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 13,
          fontWeight: 700,
          color: variacao >= 0 ? CORES.candleUp : CORES.candleDown,
        }}>
          {fmtPct(variacao)}
        </span>
        <span style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.4)",
        }}>
          {cfg.microcopy}
        </span>
      </div>

      {/* ═════════════ GRÁFICO SVG ═════════════ */}
      <div style={{
        background: "rgba(2,6,23,0.6)",
        borderRadius: 10,
        padding: 12,
        marginBottom: 14,
        overflow: "hidden",
      }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>

          {/* GRADE DE FUNDO */}
          {[0.25, 0.5, 0.75].map(p => (
            <line
              key={p}
              x1={PAD_LEFT}
              y1={PAD_TOP + chartH * p}
              x2={W - PAD_RIGHT}
              y2={PAD_TOP + chartH * p}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="1"
            />
          ))}

          {/* ═══ ZONAS (linhas tracejadas sutis) ═══ */}

          {/* Resistência */}
          {zonas.resistencia != null && (
            <>
              <line
                x1={PAD_LEFT}
                y1={yToPx(zonas.resistencia)}
                x2={W - PAD_RIGHT}
                y2={yToPx(zonas.resistencia)}
                stroke={CORES.resistencia}
                strokeOpacity="0.30"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={W - PAD_RIGHT - 4}
                y={yToPx(zonas.resistencia) - 4}
                fontFamily="'IBM Plex Mono',monospace"
                fontSize="9"
                fill={CORES.resistencia}
                fillOpacity="0.7"
                textAnchor="end"
              >RESISTÊNCIA · {zonas.resistencia.toFixed(2)}</text>
            </>
          )}

          {/* Suporte */}
          {zonas.suporte != null && (
            <>
              <line
                x1={PAD_LEFT}
                y1={yToPx(zonas.suporte)}
                x2={W - PAD_RIGHT}
                y2={yToPx(zonas.suporte)}
                stroke={CORES.suporte}
                strokeOpacity="0.30"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <text
                x={W - PAD_RIGHT - 4}
                y={yToPx(zonas.suporte) + 12}
                fontFamily="'IBM Plex Mono',monospace"
                fontSize="9"
                fill={CORES.suporte}
                fillOpacity="0.7"
                textAnchor="end"
              >SUPORTE · {zonas.suporte.toFixed(2)}</text>
            </>
          )}

          {/* Invalidação */}
          {sinal.stopATR != null && (
            <>
              <line
                x1={PAD_LEFT}
                y1={yToPx(sinal.stopATR)}
                x2={W - PAD_RIGHT}
                y2={yToPx(sinal.stopATR)}
                stroke={CORES.invalidacao}
                strokeOpacity="0.50"
                strokeWidth="1.5"
                strokeDasharray="6,3"
              />
              <text
                x={PAD_LEFT + 4}
                y={yToPx(sinal.stopATR) - 4}
                fontFamily="'IBM Plex Mono',monospace"
                fontSize="9"
                fill={CORES.invalidacao}
                fillOpacity="0.9"
                fontWeight="700"
              >⚠ INVALIDAÇÃO · {sinal.stopATR.toFixed(2)}</text>
            </>
          )}

          {/* ═══ CANDLES (estilo TradingView) ═══ */}
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
                {/* Wick (mecha alta-baixa) */}
                <line
                  x1={x}
                  y1={yHigh}
                  x2={x}
                  y2={yLow}
                  stroke={cor}
                  strokeWidth="1"
                />
                {/* Corpo do candle */}
                <rect
                  x={x - candleW / 2}
                  y={bodyTop}
                  width={candleW}
                  height={bodyHeight}
                  fill={cor}
                  stroke={cor}
                  strokeWidth="0.5"
                />
              </g>
            );
          })}

          {/* ═══ EMA12 (tracejada branca discreta — referência rápida) ═══ */}
          <polyline
            points={candlesFiltrados
              .map((c, i) => c.ema12 != null ? `${xToPx(i)},${yToPx(c.ema12)}` : null)
              .filter(Boolean)
              .join(" ")}
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
            strokeDasharray="3,3"
            strokeLinecap="round"
          />

          {/* ═══ EMA50 (linha colorida dinamicamente: verde/amarelo/vermelho) ═══ */}
          {/* Cada segmento entre 2 pontos tem cor própria conforme inclinação */}
          {candlesFiltrados.slice(1).map((c, idx) => {
            const i = idx + 1;
            if (c.ema50 == null || candlesFiltrados[i - 1].ema50 == null) return null;
            return (
              <line
                key={`ema50-seg-${i}`}
                x1={xToPx(i - 1)}
                y1={yToPx(candlesFiltrados[i - 1].ema50)}
                x2={xToPx(i)}
                y2={yToPx(c.ema50)}
                stroke={corSegmentoEma50(i)}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            );
          })}

          {/* ═══ LABEL DO PREÇO ATUAL (à direita, compacto e afastado) ═══ */}
          {candlesFiltrados.length > 0 && (() => {
            const ultimo = candlesFiltrados[candlesFiltrados.length - 1];
            const isUp = ultimo.close >= ultimo.open;
            const corLabel = isUp ? CORES.candleUp : CORES.candleDown;
            const yPrecoAtual = yToPx(ultimo.close);
            // Afasta 12px do último candle (em vez de grudar)
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
                  opacity="0.6"
                />
                <rect
                  x={xLabelStart}
                  y={yPrecoAtual - 8}
                  width="46"
                  height="16"
                  rx="3"
                  fill={corLabel}
                />
                <text
                  x={xLabelStart + 23}
                  y={yPrecoAtual + 3.5}
                  fontFamily="'IBM Plex Mono',monospace"
                  fontSize="10"
                  fontWeight="700"
                  fill="#000"
                  textAnchor="middle"
                >
                  {ultimo.close.toFixed(2)}
                </text>
              </>
            );
          })()}

          {/* ═══ LABELS DO EIXO X ═══ */}
          {labelsEixoX.map((l, idx) => (
            <text
              key={idx}
              x={l.x}
              y={H - 8}
              fontFamily="'IBM Plex Mono',monospace"
              fontSize="9"
              fill="rgba(255,255,255,0.30)"
              textAnchor={l.align}
            >
              {l.label}
            </text>
          ))}
        </svg>
      </div>

      {/* ═════════════ LEGENDA DAS LINHAS ═════════════ */}
      <div style={{
        display: "flex",
        gap: 16,
        flexWrap: "wrap",
        marginBottom: 14,
        padding: "8px 12px",
        background: "rgba(2,6,23,0.5)",
        borderRadius: 8,
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: 10,
        color: "rgba(255,255,255,0.5)",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 16, height: 0,
            borderTop: "1.2px dashed rgba(255,255,255,0.55)",
          }} />
          EMA 12
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Multi-cor pra indicar que muda dinamicamente */}
          <span style={{ display: "inline-flex", gap: 1 }}>
            <span style={{ width: 6, height: 2.5, background: "#34d399" }} />
            <span style={{ width: 4, height: 2.5, background: "#fbbf24" }} />
            <span style={{ width: 6, height: 2.5, background: "#f87171" }} />
          </span>
          EMA 50 (cor = direção)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, opacity: 0.7 }}>
          <span style={{
            width: 16, height: 0,
            borderTop: `1.5px dashed ${CORES.invalidacao}`,
          }} />
          Invalidação
        </span>
      </div>

      {/* ═════════════ PAINEL DE STATS ═════════════ */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 8,
      }}>
        <StatBox
          label="Suporte"
          valor={fmtMoeda(zonas.suporte)}
          sub={fmtPct(zonas.distanciaSuporte) + " do preço"}
          cor={CORES.suporte}
          icone="↓"
        />
        <StatBox
          label="Resistência"
          valor={fmtMoeda(zonas.resistencia)}
          sub={fmtPct(zonas.distanciaResistencia) + " do preço"}
          cor={CORES.resistencia}
          icone="↑"
        />
        <StatBox
          label="Invalidação"
          valor={fmtMoeda(zonas.invalidacao)}
          sub={fmtPct(zonas.distanciaInvalidacao) + " do preço"}
          cor={CORES.invalidacao}
          icone="⚠"
        />
        <StatBox
          label="Direção"
          valor={sinal.inclinacaoEma50 === "sobe" ? "Compradora" : "Vendedora"}
          sub={sinal.inclinacaoEma50 === "sobe" ? "fluxo ascendente ↗" : "fluxo descendente ↘"}
          cor={sinal.inclinacaoEma50 === "sobe" ? CORES.candleUp : CORES.candleDown}
          icone="◉"
        />
      </div>

      {/* ═════════════ DISCLAIMER ═════════════ */}
      <div style={{
        marginTop: 12,
        padding: "8px 12px",
        background: "rgba(251,191,36,0.04)",
        border: "1px solid rgba(251,191,36,0.12)",
        borderRadius: 6,
        display: "flex",
        alignItems: "flex-start",
        gap: 6,
      }}>
        <span style={{ color: "rgba(251,191,36,0.8)", fontSize: 11, flexShrink: 0 }}>⚠</span>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.disclaimer,
          color: "rgba(255,255,255,0.45)",
        }}>
          Zonas dos últimos 30 dias. Algoritmo proprietário (EMA12 + EMA50 + StopATR).
          Indicador informativo · não constitui recomendação CVM.
        </span>
      </div>
    </div>
  );
}

function StatBox({ label, valor, sub, cor, icone }) {
  return (
    <div style={{
      background: "rgba(2,6,23,0.7)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 8,
      padding: "10px 12px",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginBottom: 5,
        fontFamily: "'IBM Plex Mono',monospace",
        ...TYPO.metricLabel,
        color: "rgba(255,255,255,0.4)",
        textTransform: "uppercase",
      }}>
        <span style={{ fontSize: 10, color: cor }}>{icone}</span>
        <span>{label}</span>
      </div>
      <div style={{
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: 14,
        fontWeight: 800,
        color: cor || "rgba(255,255,255,0.85)",
        lineHeight: 1.2,
      }}>{valor}</div>
      {sub && (
        <div style={{
          ...TYPO.metricSub,
          fontSize: 10,
          color: "rgba(255,255,255,0.45)",
          marginTop: 3,
        }}>{sub}</div>
      )}
    </div>
  );
}
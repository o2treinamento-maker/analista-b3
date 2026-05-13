// src/components/CardFluxo.jsx
// Card visual da Análise Quantitativa de Fluxo
// Sistema de design unificado com CardFundamentalista
// Badge fundido com microcopy (sem parágrafo redundante)
//
// 🔧 v2: Bloco de erro substituído por <ErroCard /> (UX profissional)

"use client";

import { useState, useEffect, useCallback } from "react";
import ErroCard from "@/components/ErroCard";

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════
const TYPO = {
  headerTitle:    { fontSize: 12, fontWeight: 700, letterSpacing: "0.1em" },
  headerSubtitle: { fontSize: 13, fontWeight: 400, lineHeight: 1.55 },
  badgeLabel:     { fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" },
  bodyText:       { fontSize: 14, fontWeight: 400, lineHeight: 1.65 },
  metricLabel:    { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" },
  metricValue:    { fontSize: 14, fontWeight: 700 },
  metricSub:      { fontSize: 11, fontWeight: 400 },
  disclaimer:     { fontSize: 10, fontWeight: 400, lineHeight: 1.6 },
};
const RADIUS = 14;
const PADDING = 20;

const LEGENDA_ITEMS = [
  {
    cor: "#34d399", tipo: "linha", label: "fluxo comprador",
    titulo: "🟢 Fluxo Comprador",
    descricao: "Quando a linha está verde, os compradores estão no controle do papel. Historicamente, isso indica maior probabilidade de alta no preço.",
  },
  {
    cor: "#fbbf24", tipo: "linha", label: "lateral",
    titulo: "🟡 Mercado Lateral",
    descricao: "Linha amarela mostra equilíbrio entre compradores e vendedores. Sem direção clara — momento de cautela, baixa previsibilidade.",
  },
  {
    cor: "#f87171", tipo: "linha", label: "fluxo vendedor",
    titulo: "🔴 Fluxo Vendedor",
    descricao: "Linha vermelha indica vendedores no controle do papel. Historicamente, isso aponta para maior probabilidade de queda no preço.",
  },
  {
    cor: "rgba(255,255,255,0.5)", tipo: "tracejada", label: "pressão de curto prazo",
    titulo: "┄ Pressão de Curto Prazo",
    descricao: "Linha tracejada representa o movimento mais recente do papel. Útil para antecipar mudanças antes que a tendência principal confirme.",
  },
];

export default function CardFluxo({ ticker }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [legendaAberta, setLegendaAberta] = useState(false);

  // 🔧 Função de fetch extraída pra ser reutilizada (no useEffect e no retry)
  const buscarDados = useCallback(() => {
    if (!ticker) return;
    setCarregando(true);
    setErro(null);
    setDados(null);

    fetch(`/api/fluxo?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setErro(d.error);
        else setDados(d);
      })
      .catch(e => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [ticker]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  if (carregando) {
    return (
      <div style={{
        background: "rgba(4,8,20,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: RADIUS,
        padding: PADDING,
        minHeight: "320px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            border: "1.5px solid transparent",
            borderTopColor: "#34d399",
            animation: "spin 1s linear infinite",
          }} />
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricLabel,
            color: "rgba(255,255,255,0.4)",
          }}>PROCESSANDO LEITURA QUANTITATIVA...</span>
        </div>
      </div>
    );
  }

  // 🔧 NOVO: usa o ErroCard reutilizável em vez do bloco hardcoded
  if (erro || !dados) {
    return (
      <ErroCard
        tituloAnalise="ANÁLISE QUANTITATIVA DE FLUXO"
        erro={erro}
        onTentarNovamente={buscarDados}
      />
    );
  }

  const { sinal, candles, ticker: tk } = dados;

  // ─── CONFIG DE CORES POR SINAL + MICROCOPY ──────────────────────────────
  const cfg = {
  verde: {
    cor: "#34d399",
    bg: "rgba(4,16,8,0.7)",
    border: "rgba(52,211,153,0.25)",
    borderMobile: "rgba(52,211,153,0.18)",
    label: "FLUXO COMPRADOR",
    microcopy: "compradores no controle do papel",
  },
  vermelho: {
    cor: "#f87171",
    bg: "rgba(20,4,4,0.7)",
    border: "rgba(248,113,113,0.25)",
    borderMobile: "rgba(248,113,113,0.18)",
    label: "FLUXO VENDEDOR",
    microcopy: "vendedores no controle do papel",
  },
  amarelo: {
    cor: "#fbbf24",
    bg: "rgba(20,16,4,0.7)",
    border: "rgba(251,191,36,0.2)",
    borderMobile: "rgba(251,191,36,0.15)",
    label: "FLUXO EM TRANSIÇÃO",
    microcopy: "compradores e vendedores empatados",
  },
  neutro: {
    cor: "#94a3b8",
    bg: "rgba(8,12,28,0.7)",
    border: "rgba(255,255,255,0.08)",
    borderMobile: "rgba(255,255,255,0.06)",
    label: "FLUXO EM TRANSIÇÃO",
    microcopy: "indefinido, possível mudança de dieção",
  },
}[sinal.cor];

  const W = 600, H = 260, PAD_TOP = 16, PAD_BOTTOM = 24, PAD_LEFT = 8, PAD_RIGHT = 50;
  const chartH = H - PAD_TOP - PAD_BOTTOM;
  const chartW = W - PAD_LEFT - PAD_RIGHT;

  const allValues = [];
  candles.forEach(c => {
    allValues.push(c.high, c.low);
    if (c.ema12 != null) allValues.push(c.ema12);
    if (c.ema50 != null) allValues.push(c.ema50);
  });
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const padding = range * 0.05;
  const yMin = minVal - padding;
  const yMax = maxVal + padding;

  const yToPx = v => PAD_TOP + chartH - ((v - yMin) / (yMax - yMin)) * chartH;
  const xToPx = i => PAD_LEFT + (i / (candles.length - 1)) * chartW;

  function corSegmentoEma(i) {
    const JANELA = 5;
    if (i < JANELA || candles[i].ema50 == null || candles[i - JANELA].ema50 == null) return "#888";
    const atual = candles[i].ema50;
    const passada = candles[i - JANELA].ema50;
    const variacaoPct = ((atual - passada) / passada) * 100;
    if (variacaoPct > 0.3) return "#34d399";
    if (variacaoPct < -0.3) return "#f87171";
    return "#fbbf24";
  }

  const pontosNotaveis = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1], cur = candles[i];
    if (prev.ema12 == null || prev.ema50 == null) continue;
    const crossUp = prev.ema12 <= prev.ema50 && cur.ema12 > cur.ema50;
    const crossDown = prev.ema12 >= prev.ema50 && cur.ema12 < cur.ema50;
    if (crossUp) pontosNotaveis.push({ i, tipo: "viragem_alta", x: xToPx(i), y: yToPx(cur.ema12) });
    if (crossDown) pontosNotaveis.push({ i, tipo: "viragem_baixa", x: xToPx(i), y: yToPx(cur.ema12) });
  }

  const fmtMoeda = v => v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "—";
  const fmtPct = v => (v >= 0 ? "+" : "") + v.toFixed(1) + "%";

  const fmtData = ts => {
    const d = new Date(ts);
    return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).toUpperCase();
  };
  const labelsEixoX = [
    { x: xToPx(0), label: fmtData(candles[0].date) },
    { x: xToPx(Math.floor(candles.length / 2)), label: fmtData(candles[Math.floor(candles.length / 2)].date) },
    { x: xToPx(candles.length - 1), label: fmtData(candles[candles.length - 1].date) },
  ];

  function descreverPressaoCurto() {
    const compradora = sinal.emaCurtaAcimaLonga;
    const subindo = sinal.inclinacaoEma12 === "sobe";
    if (compradora && subindo) return { sub: "ganhando força", seta: "↗" };
    if (compradora && !subindo) return { sub: "em desaceleração", seta: "↘" };
    if (!compradora && subindo) return { sub: "tentando reagir", seta: "↗" };
    return { sub: "se intensificando", seta: "↘" };
  }
  function descreverDirecaoInst() {
    const compradora = sinal.inclinacaoEma50 === "sobe";
    return compradora ? { sub: "fluxo ascendente", seta: "↗" } : { sub: "fluxo descendente", seta: "↘" };
  }
  const pressaoCurto = descreverPressaoCurto();
  const direcaoInst = descreverDirecaoInst();

  function Swatch({ cor, tipo }) {
    if (tipo === "tracejada") {
      return <div style={{ width: 14, height: 0, borderTop: "1.5px dashed " + cor, flexShrink: 0 }} />;
    }
    return <div style={{ width: 14, height: 3, borderRadius: 2, background: cor, flexShrink: 0 }} />;
  }

  return (
    <div className="card-fluxo-root" style={{
      background: cfg.bg,
      border: "1px solid " + cfg.border,
      borderRadius: RADIUS,
      padding: PADDING,
    }}>
      <style>{`
        .legenda-fluxo-item {
          position: relative;
          cursor: help;
          padding: 6px 4px;
          border-radius: 4px;
          transition: background 0.15s;
        }
        .legenda-fluxo-item:hover { background: rgba(255,255,255,0.04); }
        .legenda-fluxo-item .tooltip-fluxo {
          position: absolute;
          bottom: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(8, 14, 28, 0.98);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          padding: 10px 12px;
          width: 240px;
          font-family: 'Inter', sans-serif;
          font-size: 11px;
          line-height: 1.5;
          color: rgba(255,255,255,0.75);
          letter-spacing: 0.01em;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s, transform 0.2s;
          z-index: 50;
          box-shadow: 0 12px 32px rgba(0,0,0,0.6);
          text-align: left;
          white-space: normal;
        }
        .legenda-fluxo-item .tooltip-fluxo::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: rgba(8, 14, 28, 0.98);
        }
        .legenda-fluxo-item:hover .tooltip-fluxo {
          opacity: 1;
          transform: translateX(-50%) translateY(-2px);
        }
        .tooltip-fluxo strong {
          color: #fff;
          font-weight: 600;
          display: block;
          margin-bottom: 3px;
          letter-spacing: 0;
        }

        .legenda-desktop { display: flex; }
        .legenda-mobile  { display: none; }
        .header-chart-desktop { display: flex; }
        .header-chart-mobile  { display: none; }
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .footer-metodologia-full { display: block; }
        .footer-metodologia-mobile { display: none; }
        .header-decoracao { display: block; }

        /* Badge fundido: separador entre label e microcopy */
        .fluxo-badge-divider {
          width: 1px;
          height: 12px;
          background: ${cfg.cor}40;
        }

        @media (max-width: 640px) {
          .card-fluxo-root { border-color: ${cfg.borderMobile} !important; }
          .header-decoracao { display: none; }
          .legenda-desktop { display: none; }
          .legenda-mobile  { display: block; }
          .header-chart-desktop { display: none; }
          .header-chart-mobile  { display: flex; }
          .stats-grid { grid-template-columns: 1fr !important; }
          .footer-metodologia-full { display: none; }
          .footer-metodologia-mobile { display: block; }

          /* Badge mobile — empilhado vertical */
          .fluxo-badge {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
            padding: 10px 14px !important;
            box-shadow: 0 4px 12px ${cfg.cor}25 !important;
          }
          .fluxo-badge-divider {
            display: none !important;
          }
          .fluxo-badge-label-line {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .fluxo-badge-microcopy {
            font-size: 12px !important;
            padding-left: 16px !important;
          }
        }
      `}</style>

      {/* ═════════════ HEADER ═════════════ */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, lineHeight: 1 }}>📡</span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.headerTitle,
            color: cfg.cor,
            textTransform: "uppercase",
          }}>Análise Quantitativa de Fluxo</span>
          <div className="header-decoracao" style={{
            flex: 1,
            height: 1,
            background: "rgba(255,255,255,0.06)"
          }} />
        </div>
      </div>

      {/* ═════════════ BADGE FUNDIDO (label + microcopy) ═════════════ */}
      <div className="fluxo-badge" style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 14px",
        background: cfg.cor + "20",
        border: "1px solid " + cfg.cor + "50",
        borderRadius: 8,
        marginBottom: 16,
        boxShadow: `0 0 16px ${cfg.cor}15`,
      }}>
        {/* Linha 1: Bolinha + LABEL */}
        <div className="fluxo-badge-label-line" style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%", background: cfg.cor,
            animation: "pulse-dot 2s ease infinite",
            flexShrink: 0,
          }} />
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.badgeLabel,
            color: cfg.cor,
          }}>{cfg.label}</span>
        </div>

        {/* Separador vertical (só no desktop) */}
        <div className="fluxo-badge-divider" />

        {/* Microcopy de 1 linha */}
        <span className="fluxo-badge-microcopy" style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          fontWeight: 400,
          color: "rgba(255,255,255,0.7)",
          letterSpacing: "-0.005em",
          lineHeight: 1.3,
        }}>{cfg.microcopy}</span>
      </div>

      {/* ═════════════ LEGENDA DESKTOP ═════════════ */}
      <div className="legenda-desktop" style={{
        gap: 12,
        padding: "10px 12px",
        background: "rgba(4,8,20,0.6)",
        borderRadius: 8,
        ...TYPO.metricSub,
        color: "rgba(255,255,255,0.55)",
        marginBottom: 10,
        flexWrap: "wrap",
        alignItems: "center",
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,0.3)",
        }}>COMO LER →</span>

        {LEGENDA_ITEMS.map(item => (
          <div key={item.label} className="legenda-fluxo-item"
               style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Swatch cor={item.cor} tipo={item.tipo} />
            <span>{item.label}</span>
            <div className="tooltip-fluxo">
              <strong style={{ color: item.cor === "rgba(255,255,255,0.5)" ? "#fff" : item.cor }}>
                {item.titulo}
              </strong>
              {item.descricao}
            </div>
          </div>
        ))}

        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,0.25)",
          marginLeft: "auto",
        }}>passe o mouse</span>
      </div>

      {/* ═════════════ LEGENDA MOBILE — accordion ═════════════ */}
      <div className="legenda-mobile" style={{ marginBottom: 10 }}>
        <button
          onClick={() => setLegendaAberta(prev => !prev)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            background: "rgba(4,8,20,0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            cursor: "pointer",
            transition: "all 0.15s",
            color: "rgba(255,255,255,0.55)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,0.5)",
            }}>COMO LER</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {LEGENDA_ITEMS.map(item => (
                <Swatch key={item.label} cor={item.cor} tipo={item.tipo} />
              ))}
            </span>
          </span>

          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.4)",
            transition: "transform 0.2s",
            transform: legendaAberta ? "rotate(180deg)" : "rotate(0deg)",
          }}>▼</span>
        </button>

        {legendaAberta && (
          <div style={{
            marginTop: 8,
            padding: "12px 14px",
            background: "rgba(4,8,20,0.6)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            animation: "fadeUp 0.2s ease",
          }}>
            {LEGENDA_ITEMS.map((item, idx) => (
              <div key={item.label} style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                paddingBottom: idx < LEGENDA_ITEMS.length - 1 ? 12 : 0,
                borderBottom: idx < LEGENDA_ITEMS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  flexShrink: 0,
                  paddingTop: 3,
                }}>
                  <Swatch cor={item.cor} tipo={item.tipo} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    ...TYPO.badgeLabel,
                    color: item.cor === "rgba(255,255,255,0.5)" ? "#fff" : item.cor,
                    marginBottom: 4,
                  }}>{item.titulo}</div>
                  <div style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.6)",
                    lineHeight: 1.5,
                  }}>{item.descricao}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═════════════ GRÁFICO SVG ═════════════ */}
      <div style={{
        background: "rgba(4,8,20,0.85)",
        borderRadius: 10,
        padding: 12,
        marginBottom: 14,
        overflow: "hidden",
      }}>
        <div className="header-chart-desktop" style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.08em",
        }}>
          <span>{tk} · LEITURA QUANTITATIVA · 6 MESES</span>
          <span>ALGORITMO DE FLUXO + ZONA DE INVALIDAÇÃO</span>
        </div>

        <div className="header-chart-mobile" style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.08em",
        }}>
          <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>{tk}</span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>6M · ALGORITMO PROPRIETÁRIO</span>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          {[0.25, 0.5, 0.75].map(p => (
            <line key={p} x1={PAD_LEFT} y1={PAD_TOP + chartH * p} x2={W - PAD_RIGHT} y2={PAD_TOP + chartH * p}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {candles.map((c, i) => {
            const x = xToPx(i);
            const candleW = Math.max(2, chartW / candles.length * 0.7);
            const yOpen = yToPx(c.open);
            const yClose = yToPx(c.close);
            const yHigh = yToPx(c.high);
            const yLow = yToPx(c.low);
            const isUp = c.close >= c.open;
            const cor = isUp ? "#34d399" : "#f87171";
            return (
              <g key={i} opacity="0.7">
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={cor} strokeWidth="1" />
                <rect x={x - candleW / 2} y={Math.min(yOpen, yClose)}
                  width={candleW} height={Math.max(1, Math.abs(yClose - yOpen))} fill={cor} />
              </g>
            );
          })}

          <polyline
            points={candles.map((c, i) => c.ema12 != null ? `${xToPx(i)},${yToPx(c.ema12)}` : null).filter(Boolean).join(" ")}
            fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeDasharray="3,3"
          />

          {candles.slice(1).map((c, idx) => {
            const i = idx + 1;
            if (c.ema50 == null || candles[i - 1].ema50 == null) return null;
            return (
              <line key={i}
                x1={xToPx(i - 1)} y1={yToPx(candles[i - 1].ema50)}
                x2={xToPx(i)} y2={yToPx(c.ema50)}
                stroke={corSegmentoEma(i)} strokeWidth="2.5" strokeLinecap="round" />
            );
          })}

          {pontosNotaveis.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="5" fill={p.tipo === "viragem_alta" ? "#34d399" : "#f87171"} opacity="0.3" />
              <circle cx={p.x} cy={p.y} r="3" fill={p.tipo === "viragem_alta" ? "#34d399" : "#f87171"} />
            </g>
          ))}

          <line x1={xToPx(candles.length - 1)} y1={yToPx(candles[candles.length - 1].close)}
            x2={W - PAD_RIGHT + 4} y2={yToPx(candles[candles.length - 1].close)}
            stroke={cfg.cor} strokeWidth="1" strokeDasharray="2,2" />
          <rect x={W - PAD_RIGHT + 4} y={yToPx(candles[candles.length - 1].close) - 9}
            width="46" height="18" rx="3" fill={cfg.cor} />
          <text x={W - PAD_RIGHT + 27} y={yToPx(candles[candles.length - 1].close) + 4}
            fontFamily="'IBM Plex Mono',monospace" fontSize="10" fontWeight="600"
            fill="#000" textAnchor="middle">
            {sinal.close.toFixed(2)}
          </text>

          {labelsEixoX.map((l, idx) => (
            <text key={idx} x={l.x} y={H - 6}
              fontFamily="'IBM Plex Mono',monospace" fontSize="9"
              fill="rgba(255,255,255,0.25)" textAnchor={idx === 0 ? "start" : idx === labelsEixoX.length - 1 ? "end" : "middle"}>
              {l.label}
            </text>
          ))}
        </svg>
      </div>

      {/* ═════════════ GRID DE STATS ═════════════ */}
      <div className="stats-grid" style={{
        gap: 1,
        background: "rgba(255,255,255,0.05)",
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 12,
      }}>
        <Stat
          label="Pressão de curto prazo"
          valor={sinal.emaCurtaAcimaLonga ? "Compradora" : "Vendedora"}
          sub={pressaoCurto.sub}
          subSeta={pressaoCurto.seta}
          cor={sinal.emaCurtaAcimaLonga ? "#34d399" : "#f87171"}
        />
        <Stat
          label="Direção institucional"
          valor={sinal.inclinacaoEma50 === "sobe" ? "Compradora" : "Vendedora"}
          sub={direcaoInst.sub}
          subSeta={direcaoInst.seta}
          cor={sinal.inclinacaoEma50 === "sobe" ? "#34d399" : "#f87171"}
        />
        <Stat
          label="Preço atual"
          valor={fmtMoeda(sinal.close)}
          sub={fmtPct(sinal.distanciaEma50) + " do fluxo médio"}
        />
        <Stat
          label="Zona de invalidação"
          valor={fmtMoeda(sinal.stopATR)}
          sub={sinal.precoAcimaStop ? "fluxo respeitado ✓" : "fluxo rompido ✗"}
          cor={sinal.precoAcimaStop ? "#34d399" : "#f87171"}
        />
      </div>

      {/* ═════════════ FOOTER ═════════════ */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: 12,
      }}>
        <div className="footer-metodologia-full" style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.disclaimer,
          color: "rgba(255,255,255,0.4)",
          marginBottom: 8,
        }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>METODOLOGIA PROPRIETÁRIA · </span>
          Análise quantitativa baseada em algoritmo de leitura de fluxo institucional, calibrado por 20 anos de mercado para janelas operacionais de médio prazo.
        </div>

        <div className="footer-metodologia-mobile" style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.disclaimer,
          color: "rgba(255,255,255,0.4)",
          marginBottom: 8,
        }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>METODOLOGIA · </span>
          Algoritmo proprietário de leitura de fluxo institucional.
        </div>

        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 6,
          padding: "10px 12px",
          borderRadius: 8,
          background: "rgba(251,191,36,0.04)",
          border: "1px solid rgba(251,191,36,0.12)",
        }}>
          <span style={{ color: "rgba(251,191,36,0.8)", fontSize: 13, flexShrink: 0 }}>⚠</span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.disclaimer,
            color: "rgba(255,255,255,0.5)",
          }}>
            Indicador de caráter informativo · não constitui recomendação de compra ou venda nem análise de valores mobiliários nos termos da CVM.
          </span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, valor, sub, subSeta, cor }) {
  return (
    <div style={{ background: "rgba(4,8,20,0.85)", padding: "12px 14px" }}>
      <div style={{
        fontFamily: "'IBM Plex Mono',monospace",
        ...TYPO.metricLabel,
        color: "rgba(255,255,255,0.35)",
        marginBottom: 4,
        textTransform: "uppercase",
      }}>{label}</div>
      <div style={{
        fontFamily: "'IBM Plex Mono',monospace",
        ...TYPO.metricValue,
        color: cor || "rgba(255,255,255,0.85)",
      }}>
        {valor}
      </div>
      {sub && (
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricSub,
          color: "rgba(255,255,255,0.45)",
          marginTop: 2,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          <span>{sub}</span>
          {subSeta && (
            <span style={{ color: cor || "rgba(255,255,255,0.5)", fontWeight: 700 }}>
              {subSeta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
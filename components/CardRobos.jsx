// src/components/CardRobos.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CARD ROBÔS QUANTITATIVOS — "O que as máquinas dizem"
// 6 robôs caricatura, cada um com filosofia quantitativa identificável
// na literatura acadêmica.
//
// Consome /api/fundamentalista (V9) que já calcula robôs internamente.
// Cor temática ROXA pra diferenciar do dourado dos mestres.
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

const TYPO = {
  cardTitle: { fontSize: 12, fontWeight: 800, letterSpacing: "0.12em" },
  metricLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" },
};

const RADIUS = 14;
const PADDING = 18;

const CORES = {
  verde: "#34d399",
  amarelo: "#fbbf24",
  laranja: "#fb923c",
  vermelho: "#f87171",
  azul: "#60a5fa",
  roxo: "#a855f7",
  ciano: "#38bdf8",
  cinza: "rgba(148,163,184,1)",
};

// Map cor temática do robô → cor real
const CORTEMA_MAP = {
  vermelho: "#f87171",
  azul: "#60a5fa",
  roxo: "#a855f7",
  verde: "#34d399",
  cinza: "#94a3b8",
  "verde-dinheiro": "#22c55e",
};

// Veredito → estilo
const VEREDITO_STYLE = {
  aprovado: {
    cor: CORES.verde,
    bg: "rgba(52,211,153,0.12)",
    border: "rgba(52,211,153,0.3)",
    label: "APROVADO",
  },
  parcial: {
    cor: CORES.amarelo,
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.3)",
    label: "PARCIAL",
  },
  reprovado: {
    cor: CORES.vermelho,
    bg: "rgba(248,113,113,0.12)",
    border: "rgba(248,113,113,0.3)",
    label: "REPROVADO",
  },
  indisponivel: {
    cor: CORES.cinza,
    bg: "rgba(148,163,184,0.1)",
    border: "rgba(148,163,184,0.25)",
    label: "INDISPONÍVEL",
  },
};

// Alinhamento (5 níveis baseados em score)
const ALINHAMENTO_LABEL = {
  excelente: "EXCELENTE ALINHAMENTO",
  forte: "FORTE ALINHAMENTO",
  moderado: "ALINHAMENTO MODERADO",
  fraco: "ALINHAMENTO FRACO",
  fora: "FORA DO PERFIL",
};

// ─────────────────────────────────────────────────────────────────────────────
// 📚 FONTES ACADÊMICAS DOS ROBÔS
// ─────────────────────────────────────────────────────────────────────────────

const FONTES_ROBOS = {
  momentum_alpha: {
    papers: [
      {
        titulo: "Returns to Buying Winners and Selling Losers",
        autores: "Jegadeesh & Titman",
        ano: 1993,
      },
    ],
    descricao: "Fundamento acadêmico do Momentum Factor",
  },
  quality_machine: {
    papers: [
      {
        titulo: "Quality Minus Junk",
        autores: "Asness, Frazzini & Pedersen",
        ano: 2019,
      },
    ],
    descricao: "Quality Factor — empresas de alta qualidade superam",
  },
  deep_value: {
    papers: [
      {
        titulo: "The Cross-Section of Expected Stock Returns",
        autores: "Fama & French",
        ano: 1992,
      },
    ],
    descricao: "Value Factor (HML) — descontadas batem o mercado",
  },
  trend_matrix: {
    papers: [
      {
        titulo: "A Quantitative Approach to Tactical Asset Allocation",
        autores: "Faber",
        ano: 2007,
      },
    ],
    descricao: "Alinhamento de tendências em múltiplos horizontes",
  },
  volatility_shield: {
    papers: [
      {
        titulo: "The Cross-Section of Volatility and Expected Returns",
        autores: "Ang, Hodrick, Xing & Zhang",
        ano: 2006,
      },
    ],
    descricao: "Low-Volatility Anomaly — menos vol, mais retorno ajustado",
  },
  smart_dividend: {
    papers: [
      {
        titulo: "Surprise! Higher Dividends = Higher Earnings Growth",
        autores: "Arnott & Asness",
        ano: 2003,
      },
    ],
    descricao: "Dividendos sustentáveis predizem crescimento futuro",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AVATARES SVG DOS 6 ROBÔS (do mock aprovado)
// ─────────────────────────────────────────────────────────────────────────────

function AvatarMomentumAlpha({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="48" fill="rgba(248,113,113,0.08)" />
      {/* Corpo aerodinâmico */}
      <path
        d="M -20 -20 Q -25 -10 -22 10 Q -15 30 0 32 Q 15 30 22 10 Q 25 -10 20 -20 Q 10 -28 0 -28 Q -10 -28 -20 -20 Z"
        fill="#e85a4a"
        stroke="#a23a30"
        strokeWidth="1.2"
      />
      {/* Linhas de velocidade no peito */}
      <line x1="-12" y1="5" x2="12" y2="5" stroke="#fff" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
      <line x1="-10" y1="10" x2="10" y2="10" stroke="#fff" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
      <line x1="-8" y1="15" x2="8" y2="15" stroke="#fff" strokeWidth="1" opacity="0.3" strokeLinecap="round" />
      {/* Olhos retangulares amarelos */}
      <rect x="-13" y="-12" width="8" height="3" rx="1" fill="#fff200" />
      <rect x="5" y="-12" width="8" height="3" rx="1" fill="#fff200" />
      {/* Antenas-jet */}
      <line x1="-15" y1="-25" x2="-22" y2="-35" stroke="#a23a30" strokeWidth="2" strokeLinecap="round" />
      <circle cx="-23" cy="-37" r="3" fill="#ff7a00" />
      <line x1="15" y1="-25" x2="22" y2="-35" stroke="#a23a30" strokeWidth="2" strokeLinecap="round" />
      <circle cx="23" cy="-37" r="3" fill="#ff7a00" />
      {/* Boca firme */}
      <line x1="-4" y1="20" x2="4" y2="20" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      {/* Trilhas de velocidade */}
      <line x1="-32" y1="-5" x2="-26" y2="-5" stroke="#ff7a00" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <line x1="-30" y1="0" x2="-26" y2="0" stroke="#ff7a00" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function AvatarQualityMachine({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="48" fill="rgba(96,165,250,0.08)" />
      <rect x="-22" y="-22" width="44" height="50" rx="6" fill="#4a7ec8" stroke="#1e3a5f" strokeWidth="1.2" />
      {/* Joia dourada central */}
      <polygon points="0,-5 -4,-1 0,5 4,-1" fill="#ffd700" stroke="#b8860b" strokeWidth="0.8" />
      {/* Olhos quadrados perfeitos */}
      <rect x="-13" y="-15" width="7" height="7" rx="1" fill="#fff" stroke="#1e3a5f" strokeWidth="0.6" />
      <rect x="6" y="-15" width="7" height="7" rx="1" fill="#fff" stroke="#1e3a5f" strokeWidth="0.6" />
      <circle cx="-9.5" cy="-11.5" r="2" fill="#1e3a5f" />
      <circle cx="9.5" cy="-11.5" r="2" fill="#1e3a5f" />
      {/* Gravata borboleta dourada */}
      <polygon points="-8,17 -8,23 0,20 8,23 8,17 0,20" fill="#ffd700" stroke="#b8860b" strokeWidth="0.8" />
      {/* Antena */}
      <line x1="0" y1="-22" x2="0" y2="-30" stroke="#1e3a5f" strokeWidth="2" />
      <circle cx="0" cy="-32" r="3" fill="#ffd700" stroke="#b8860b" strokeWidth="0.8" />
      {/* Boca discreta */}
      <line x1="-3" y1="13" x2="3" y2="13" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AvatarDeepValue({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="48" fill="rgba(168,85,247,0.08)" />
      <path
        d="M -22 -10 Q -22 -22 0 -22 Q 22 -22 22 -10 L 22 26 Q 22 28 20 28 L -20 28 Q -22 28 -22 26 Z"
        fill="#8b5cf6"
        stroke="#5b21b6"
        strokeWidth="1.2"
      />
      {/* Lupa GIGANTE */}
      <circle cx="13" cy="-8" r="11" fill="rgba(255,255,255,0.2)" stroke="#fff" strokeWidth="2" />
      <circle cx="13" cy="-8" r="11" fill="none" stroke="#ffd700" strokeWidth="1.5" />
      <line x1="21" y1="0" x2="28" y2="7" stroke="#ffd700" strokeWidth="3" strokeLinecap="round" />
      <circle cx="13" cy="-8" r="3" fill="#fff" />
      <circle cx="13" cy="-8" r="1.5" fill="#5b21b6" />
      {/* Olho esquerdo normal */}
      <circle cx="-11" cy="-10" r="4" fill="#fff" stroke="#5b21b6" strokeWidth="0.8" />
      <circle cx="-11" cy="-10" r="1.8" fill="#5b21b6" />
      {/* Boca pensativa */}
      <path d="M -4 12 Q 0 14 4 12" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Antena */}
      <line x1="0" y1="-22" x2="0" y2="-28" stroke="#5b21b6" strokeWidth="2" />
      <circle cx="0" cy="-30" r="2.5" fill="#a855f7" />
    </svg>
  );
}

function AvatarTrendMatrix({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="48" fill="rgba(52,211,153,0.08)" />
      <polygon
        points="-22,-22 22,-22 26,0 22,26 -22,26 -26,0"
        fill="#34d399"
        stroke="#0d6b48"
        strokeWidth="1.2"
      />
      {/* Display de gráfico */}
      <rect x="-15" y="2" width="30" height="18" rx="2" fill="#0d3829" stroke="#0a1f17" strokeWidth="0.8" />
      {/* Linha do gráfico (alta) */}
      <polyline
        points="-13,17 -8,14 -3,15 3,10 8,8 13,5"
        fill="none"
        stroke="#34d399"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="-13" cy="17" r="1.2" fill="#34d399" />
      <circle cx="13" cy="5" r="1.5" fill="#a7f3d0" />
      {/* Olhos pixelados (matriz) */}
      <g fill="#fff">
        <rect x="-14" y="-15" width="2" height="2" />
        <rect x="-11" y="-15" width="2" height="2" />
        <rect x="-14" y="-12" width="2" height="2" />
        <rect x="-11" y="-12" width="2" height="2" />
      </g>
      <g fill="#fff">
        <rect x="9" y="-15" width="2" height="2" />
        <rect x="12" y="-15" width="2" height="2" />
        <rect x="9" y="-12" width="2" height="2" />
        <rect x="12" y="-12" width="2" height="2" />
      </g>
      {/* Antena reta */}
      <line x1="0" y1="-22" x2="0" y2="-32" stroke="#0d6b48" strokeWidth="2" />
      <rect x="-3" y="-35" width="6" height="3" rx="1" fill="#34d399" />
    </svg>
  );
}

function AvatarVolatilityShield({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="48" fill="rgba(148,163,184,0.08)" />
      {/* Corpo robusto tanque */}
      <rect x="-25" y="-18" width="50" height="44" rx="4" fill="#64748b" stroke="#1e293b" strokeWidth="1.5" />
      <line x1="-25" y1="-5" x2="25" y2="-5" stroke="#1e293b" strokeWidth="0.8" />
      <line x1="-25" y1="10" x2="25" y2="10" stroke="#1e293b" strokeWidth="0.8" />
      {/* Escudo central */}
      <path
        d="M 0 -2 L -12 4 L -12 14 Q -12 20 0 24 Q 12 20 12 14 L 12 4 Z"
        fill="#94a3b8"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      {/* Cruz no escudo */}
      <line x1="0" y1="6" x2="0" y2="20" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="-6" y1="13" x2="6" y2="13" stroke="#1e293b" strokeWidth="1.8" strokeLinecap="round" />
      {/* Olhos amarelos firmes */}
      <rect x="-15" y="-14" width="8" height="4" rx="0.5" fill="#fde047" />
      <rect x="7" y="-14" width="8" height="4" rx="0.5" fill="#fde047" />
      {/* Antena curta robusta */}
      <rect x="-3" y="-22" width="6" height="6" fill="#1e293b" />
      <circle cx="0" cy="-25" r="2" fill="#cbd5e1" />
    </svg>
  );
}

function AvatarSmartDividend({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="48" fill="rgba(34,197,94,0.08)" />
      {/* Chapéu coco */}
      <ellipse cx="0" cy="-25" rx="22" ry="3" fill="#1f2937" />
      <path d="M -14 -25 Q -14 -36 0 -36 Q 14 -36 14 -25 Z" fill="#1f2937" />
      <rect x="-14" y="-29" width="28" height="3" fill="#16a34a" />
      {/* Corpo */}
      <rect x="-22" y="-22" width="44" height="48" rx="6" fill="#22c55e" stroke="#15803d" strokeWidth="1.2" />
      {/* Gravata */}
      <polygon points="0,5 -4,8 -3,18 0,22 3,18 4,8" fill="#1f2937" />
      {/* Cifrão central */}
      <text x="0" y="20" textAnchor="middle" fontFamily="Georgia, serif" fontSize="13" fontWeight="900" fill="#fde047" stroke="#854d0e" strokeWidth="0.4">$</text>
      {/* Olhos com cifrão */}
      <circle cx="-11" cy="-12" r="5" fill="#fff" stroke="#15803d" strokeWidth="0.8" />
      <text x="-11" y="-9" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7" fontWeight="900" fill="#15803d">$</text>
      <circle cx="11" cy="-12" r="5" fill="#fff" stroke="#15803d" strokeWidth="0.8" />
      <text x="11" y="-9" textAnchor="middle" fontFamily="Georgia, serif" fontSize="7" fontWeight="900" fill="#15803d">$</text>
      {/* Sorriso */}
      <path d="M -5 4 Q 0 7 5 4" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const AVATARES = {
  momentum_alpha: AvatarMomentumAlpha,
  quality_machine: AvatarQualityMachine,
  deep_value: AvatarDeepValue,
  trend_matrix: AvatarTrendMatrix,
  volatility_shield: AvatarVolatilityShield,
  smart_dividend: AvatarSmartDividend,
};

// ─────────────────────────────────────────────────────────────────────────────
// SCORE BARRA VISUAL (0-100)
// ─────────────────────────────────────────────────────────────────────────────

function ScoreBarra({ score, cor }) {
  const corBarra =
    score >= 75 ? CORES.verde : score >= 50 ? CORES.amarelo : CORES.vermelho;

  return (
    <div style={{ width: "100%", marginTop: 6 }}>
      <div
        style={{
          width: "100%",
          height: 4,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: corBarra,
            borderRadius: 999,
            transition: "width 600ms ease",
            boxShadow: `0 0 8px ${corBarra}88`,
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD INDIVIDUAL DE CADA ROBÔ
// ─────────────────────────────────────────────────────────────────────────────

function CardRobo({ robo, onAbrirDetalhes }) {
  const Avatar = AVATARES[robo.id];
  const corTema = CORTEMA_MAP[robo.corTema] || CORES.cinza;
  const vereditoStyle = VEREDITO_STYLE[robo.veredito] || VEREDITO_STYLE.indisponivel;
  const fonte = FONTES_ROBOS[robo.id];
  const [tooltipAberto, setTooltipAberto] = useState(false);

  const indisponivel = robo.veredito === "indisponivel";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${vereditoStyle.border}`,
        borderRadius: 12,
        padding: "16px 16px 14px 16px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), 0 0 32px ${vereditoStyle.border}10`,
        transition: "border-color 200ms ease",
        opacity: indisponivel ? 0.55 : 1,
      }}
    >
      {/* 📚 BADGE DE FONTE — canto superior direito */}
      {fonte && !indisponivel && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 5,
          }}
          onMouseEnter={() => setTooltipAberto(true)}
          onMouseLeave={() => setTooltipAberto(false)}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              cursor: "help",
              transition: "all 150ms ease",
              boxShadow: tooltipAberto
                ? "0 0 12px rgba(168,85,247,0.35)"
                : "none",
            }}
          >
            📚
          </div>

          {tooltipAberto && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                minWidth: 240,
                maxWidth: 280,
                background: "rgba(10,15,25,0.98)",
                border: "1px solid rgba(168,85,247,0.3)",
                borderRadius: 8,
                padding: "10px 12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                zIndex: 100,
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  color: "rgba(168,85,247,0.9)",
                  marginBottom: 6,
                }}
              >
                📖 PAPER ACADÊMICO
              </div>
              {fonte.papers.map((paper, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <div
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: 11,
                      fontStyle: "italic",
                      color: "rgba(255,255,255,0.85)",
                      lineHeight: 1.45,
                    }}
                  >
                    "{paper.titulo}"
                  </div>
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 10,
                      color: "rgba(255,255,255,0.55)",
                      marginTop: 2,
                    }}
                  >
                    {paper.autores} ({paper.ano})
                  </div>
                </div>
              ))}
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.5)",
                  marginTop: 6,
                  lineHeight: 1.4,
                }}
              >
                {fonte.descricao}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AVATAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 6,
        }}
      >
        {Avatar && <Avatar size={90} />}
      </div>

      {/* NOME */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: "0.05em",
          color: "rgba(255,255,255,0.92)",
          textAlign: "center",
          marginBottom: 4,
        }}
      >
        {robo.nome?.toUpperCase()}
      </div>

      {/* SUBTÍTULO */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: corTema,
          opacity: 0.75,
          textAlign: "center",
          marginBottom: 10,
          minHeight: 14,
        }}
      >
        {robo.subtitulo?.toUpperCase()}
      </div>

      {/* CITAÇÃO */}
      <div
        style={{
          fontFamily: "Georgia, serif",
          fontSize: 11,
          fontStyle: "italic",
          color: "rgba(255,255,255,0.55)",
          textAlign: "center",
          marginBottom: 12,
          lineHeight: 1.35,
          minHeight: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 6px",
        }}
      >
        "{robo.citacao}"
      </div>

      {/* SCORE + FORÇA — DUAS DIMENSÕES */}
      {!indisponivel && (
        <>
          {/* Linha do Score */}
          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 3,
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 8,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.1em",
                }}
              >
                SCORE
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 14,
                  fontWeight: 900,
                  color: corTema,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  textShadow: `0 0 10px ${corTema}40`,
                }}
              >
                {robo.score}
                <span style={{ fontSize: 9, opacity: 0.55 }}>/100</span>
              </div>
            </div>
            <ScoreBarra score={robo.score} cor={corTema} />
          </div>

          {/* Linha da Força */}
          <div style={{ marginBottom: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 3,
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 8,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.1em",
                }}
              >
                💪 FORÇA
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 14,
                  fontWeight: 900,
                  color: corTema,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  opacity: 0.9,
                }}
              >
                {robo.forca ?? 0}
                <span style={{ fontSize: 9, opacity: 0.55 }}>/100</span>
              </div>
            </div>
            <ScoreBarra score={robo.forca ?? 0} cor={corTema} />
          </div>

          {/* Classificação de alinhamento */}
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.1em",
              textAlign: "center",
              marginTop: 6,
              marginBottom: 2,
            }}
          >
            {ALINHAMENTO_LABEL[robo.alinhamento] || "—"}
          </div>
        </>
      )}

      {/* CRITÉRIOS COUNT */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,0.55)",
          textAlign: "center",
          marginTop: 8,
          marginBottom: 10,
        }}
      >
        {indisponivel ? "—" : `${robo.aprovados} / ${robo.total} critérios ✓`}
      </div>

      {/* BADGE DE VEREDITO */}
      <div
        style={{
          background: vereditoStyle.bg,
          border: `1px solid ${vereditoStyle.border}`,
          borderRadius: 999,
          padding: "5px 12px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.1em",
          color: vereditoStyle.cor,
          textAlign: "center",
          marginBottom: 12,
        }}
      >
        {vereditoStyle.label}
      </div>

      {/* DIVISOR */}
      <div
        style={{
          height: 1,
          background: "rgba(255,255,255,0.06)",
          marginBottom: 10,
          marginTop: "auto",
        }}
      />

      {/* BOTÃO VER CRITÉRIOS */}
      <button
        onClick={() => onAbrirDetalhes(robo)}
        disabled={indisponivel}
        style={{
          background: indisponivel
            ? "rgba(148,163,184,0.04)"
            : "rgba(168,85,247,0.06)",
          border: `1px solid ${
            indisponivel ? "rgba(148,163,184,0.15)" : "rgba(168,85,247,0.18)"
          }`,
          borderRadius: 6,
          padding: "7px 10px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: indisponivel
            ? "rgba(148,163,184,0.5)"
            : "rgba(168,85,247,0.85)",
          cursor: indisponivel ? "not-allowed" : "pointer",
          width: "100%",
          transition: "background 150ms ease",
        }}
        onMouseEnter={(e) => {
          if (indisponivel) return;
          e.currentTarget.style.background = "rgba(168,85,247,0.1)";
          e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)";
        }}
        onMouseLeave={(e) => {
          if (indisponivel) return;
          e.currentTarget.style.background = "rgba(168,85,247,0.06)";
          e.currentTarget.style.borderColor = "rgba(168,85,247,0.18)";
        }}
      >
        {indisponivel
          ? "DADOS INDISPONÍVEIS"
          : `📋 VER ${robo.total} CRITÉRIOS`}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE CRITÉRIOS DETALHADOS
// ─────────────────────────────────────────────────────────────────────────────

function ModalCriterios({ robo, ticker, onFechar }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onFechar]);

  if (!robo) return null;

  const Avatar = AVATARES[robo.id];
  const corTema = CORTEMA_MAP[robo.corTema] || CORES.cinza;
  const vereditoStyle = VEREDITO_STYLE[robo.veredito] || VEREDITO_STYLE.indisponivel;
  const fonte = FONTES_ROBOS[robo.id];

  return (
    <>
      <style>{`
        @keyframes fadeInRobo { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpRobo {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        onClick={onFechar}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 9998,
          animation: "fadeInRobo 200ms ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background:
              "linear-gradient(180deg, rgba(8,15,30,0.98), rgba(3,7,18,0.99))",
            border: `1px solid ${vereditoStyle.border}`,
            borderRadius: 16,
            maxWidth: 640,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
            animation: "slideUpRobo 300ms ease",
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ flexShrink: 0 }}>
              {Avatar && <Avatar size={64} />}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 15,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  color: "rgba(255,255,255,0.95)",
                  marginBottom: 4,
                }}
              >
                {robo.nome?.toUpperCase()}
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: corTema,
                  opacity: 0.85,
                }}
              >
                AVALIANDO {ticker?.toUpperCase()}
              </div>
            </div>

            <button
              onClick={onFechar}
              aria-label="Fechar"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Score grande */}
          {/* Score + Força grandes */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            {/* SCORE */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.12em",
                }}
              >
                SCORE
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 36,
                  fontWeight: 900,
                  color: corTema,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  textShadow: `0 0 18px ${corTema}45`,
                }}
              >
                {robo.score}
                <span style={{ fontSize: 15, opacity: 0.5 }}>/100</span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {robo.aprovados} de {robo.total} critérios
              </div>
            </div>

            {/* Divisor vertical */}
            <div
              style={{
                width: 1,
                height: 60,
                background: "rgba(255,255,255,0.08)",
              }}
            />

            {/* FORÇA */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.12em",
                }}
              >
                💪 FORÇA
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 36,
                  fontWeight: 900,
                  color: corTema,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  opacity: 0.9,
                }}
              >
                {robo.forca ?? 0}
                <span style={{ fontSize: 15, opacity: 0.5 }}>/100</span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                magnitude
              </div>
            </div>

            {/* Alinhamento à direita */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  color: corTema,
                  marginBottom: 4,
                }}
              >
                {ALINHAMENTO_LABEL[robo.alinhamento] || "—"}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.5,
                }}
              >
                Score = aprovação dos critérios.
                <br />
                Força = magnitude do alinhamento.
              </div>
            </div>
          </div>

          {/* FILOSOFIA */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: corTema,
                opacity: 0.85,
                marginBottom: 10,
              }}
            >
              🤖 FILOSOFIA QUANTITATIVA
            </div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 13,
                fontStyle: "italic",
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.6,
              }}
            >
              {robo.filosofia}
            </div>
          </div>

          {/* FONTE ACADÊMICA */}
          {fonte && (
            <div
              style={{
                padding: "14px 24px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(168,85,247,0.04)",
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  color: "rgba(168,85,247,0.9)",
                  marginBottom: 8,
                }}
              >
                📚 BASE ACADÊMICA
              </div>
              {fonte.papers.map((paper, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <div
                    style={{
                      fontFamily: "Georgia, serif",
                      fontSize: 12,
                      fontStyle: "italic",
                      color: "rgba(255,255,255,0.8)",
                    }}
                  >
                    "{paper.titulo}"
                  </div>
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.55)",
                      marginTop: 2,
                    }}
                  >
                    {paper.autores} ({paper.ano})
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CRITÉRIOS */}
          <div style={{ padding: "20px 24px" }}>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: CORES.verde,
                opacity: 0.85,
                marginBottom: 14,
              }}
            >
              ✓ CRITÉRIOS APLICADOS ({robo.criterios?.length || 0} NO TOTAL)
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {robo.criterios?.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: c.passa
                      ? "rgba(52,211,153,0.04)"
                      : "rgba(248,113,113,0.04)",
                    border: `1px solid ${
                      c.passa ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"
                    }`,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: c.passa
                        ? "rgba(52,211,153,0.18)"
                        : "rgba(248,113,113,0.18)",
                      border: `1px solid ${
                        c.passa ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)"
                      }`,
                      color: c.passa ? CORES.verde : CORES.vermelho,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {c.passa ? "✓" : "×"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.88)",
                        marginBottom: 3,
                      }}
                    >
                      {c.titulo}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: c.passa
                          ? "rgba(255,255,255,0.5)"
                          : "rgba(248,113,113,0.7)",
                        lineHeight: 1.5,
                      }}
                    >
                      {c.descricao}
                      {c.valorAtual && (
                        <>
                          {" · "}
                          <span style={{ fontWeight: 600 }}>
                            atual: {c.valorAtual}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RODAPÉ DO MODAL */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.2)",
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.45)",
              }}
            >
              VEREDITO
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                fontWeight: 800,
                color: vereditoStyle.cor,
                letterSpacing: "0.1em",
              }}
            >
              {vereditoStyle.label} · SCORE {robo.score}/100
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 📚 MODAL DE FONTES ACADÊMICAS (todos os 6 papers)
// ─────────────────────────────────────────────────────────────────────────────

function ModalFontes({ onFechar }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onFechar]);

  const robosList = [
    { id: "momentum_alpha", nome: "Momentum Alpha" },
    { id: "quality_machine", nome: "Quality Machine" },
    { id: "deep_value", nome: "Deep Value" },
    { id: "trend_matrix", nome: "Trend Matrix" },
    { id: "volatility_shield", nome: "Volatility Shield" },
    { id: "smart_dividend", nome: "Smart Dividend" },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeInFontesRobo { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpFontesRobo {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        onClick={onFechar}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          zIndex: 9998,
          animation: "fadeInFontesRobo 200ms ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background:
              "linear-gradient(180deg, rgba(8,15,30,0.98), rgba(3,7,18,0.99))",
            border: "1px solid rgba(168,85,247,0.25)",
            borderRadius: 16,
            maxWidth: 580,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
            animation: "slideUpFontesRobo 300ms ease",
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "rgba(168,85,247,0.12)",
                border: "1px solid rgba(168,85,247,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
              }}
            >
              📚
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  color: "rgba(255,255,255,0.95)",
                  marginBottom: 3,
                }}
              >
                FONTES ACADÊMICAS
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "rgba(168,85,247,0.85)",
                }}
              >
                PAPERS QUE FUNDAMENTAM OS ROBÔS
              </div>
            </div>

            <button
              onClick={onFechar}
              aria-label="Fechar"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.7)",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Intro */}
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.7)",
                margin: 0,
              }}
            >
              Cada robô quantitativo é baseado em{" "}
              <strong style={{ color: "rgba(168,85,247,0.95)" }}>
                pesquisa acadêmica revisada por pares
              </strong>
              . Os fatores foram testados em décadas de dados de mercado por
              instituições como AQR, Dimensional e o próprio Eugene Fama (Nobel
              de Economia 2013).
            </p>
          </div>

          {/* Lista */}
          <div style={{ padding: "16px 24px 20px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {robosList.map((r) => {
                const fonte = FONTES_ROBOS[r.id];
                return (
                  <div
                    key={r.id}
                    style={{
                      padding: "12px 14px",
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 12,
                        fontWeight: 800,
                        letterSpacing: "0.05em",
                        color: "rgba(255,255,255,0.9)",
                        marginBottom: 8,
                      }}
                    >
                      {r.nome.toUpperCase()}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {fonte.papers.map((paper, i) => (
                        <div
                          key={i}
                          style={{
                            fontFamily: "Georgia, serif",
                            fontSize: 12,
                            fontStyle: "italic",
                            color: "rgba(255,255,255,0.75)",
                            lineHeight: 1.5,
                          }}
                        >
                          • "{paper.titulo}"
                          <div
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              fontStyle: "normal",
                              fontSize: 11,
                              color: "rgba(255,255,255,0.5)",
                              marginTop: 2,
                              marginLeft: 12,
                            }}
                          >
                            {paper.autores} ({paper.ano})
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.5)",
                        marginTop: 8,
                        lineHeight: 1.4,
                      }}
                    >
                      {fonte.descricao}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rodapé */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.2)",
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "rgba(168,85,247,0.85)",
                marginBottom: 4,
              }}
            >
              💡 NOSSA ABORDAGEM
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.55,
              }}
            >
              Cada robô é uma implementação prática de um fator quantitativo
              consagrado. Critérios binários — sem pesos arbitrários.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON DE LOADING
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonRobos() {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(8,15,30,0.92), rgba(3,7,18,0.96))",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: RADIUS,
        padding: PADDING,
      }}
    >
      <style>{`
        @keyframes spinRobos { to { transform: rotate(360deg); } }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          padding: "60px 0",
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "1.5px solid transparent",
            borderTopColor: CORES.roxo,
            borderRightColor: "rgba(168,85,247,0.35)",
            animation: "spinRobos 1s linear infinite",
          }}
        />
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            ...TYPO.metricLabel,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          PROCESSANDO ROBÔS QUANTITATIVOS...
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD DE ERRO
// ─────────────────────────────────────────────────────────────────────────────

function ErroCard({ mensagem }) {
  return (
    <div
      style={{
        background: "rgba(20,4,4,0.52)",
        border: "1px solid rgba(248,113,113,0.18)",
        borderRadius: RADIUS,
        padding: PADDING,
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          ...TYPO.cardTitle,
          color: CORES.vermelho,
        }}
      >
        ROBÔS INDISPONÍVEIS
      </span>
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.55)",
          marginTop: 8,
          marginBottom: 0,
        }}
      >
        {mensagem || "Não foi possível carregar a avaliação quantitativa."}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function CardRobos({ ticker }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [modalAtivo, setModalAtivo] = useState(null);
  const [modalFontesAberto, setModalFontesAberto] = useState(false);

  const fetchDados = useCallback(async () => {
    if (!ticker) return;

    setCarregando(true);
    setErro(null);
    setDados(null);

    try {
      const resp = await fetch(
        `/api/fundamentalista?ticker=${encodeURIComponent(ticker)}`
      );
      const text = await resp.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(text.slice(0, 200));
      }

      if (json.error) {
        setErro(json.error);
      } else {
        setDados(json);
      }
    } catch (e) {
      console.error("[CardRobos] Erro:", e);
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const abrirDetalhes = useCallback((robo) => {
    setModalAtivo(robo);
  }, []);

  const fecharModal = useCallback(() => {
    setModalAtivo(null);
  }, []);

  if (carregando) return <SkeletonRobos />;
  if (erro) return <ErroCard mensagem={erro} />;
  if (!dados) return <ErroCard mensagem="Sem dados disponíveis." />;

  const robos = dados.robos || [];
  if (robos.length === 0) {
    return (
      <ErroCard mensagem="Análise quantitativa não disponível para este ativo." />
    );
  }

  const stats = dados.robosStats || {
    aprovados: 0,
    parciais: 0,
    reprovados: 0,
    indisponiveis: 0,
    total: 6,
    scoreMedio: 0,
    forcaMedia: 0,
  };
  const resumoColetivo = dados.vereditoColetivoRobos;

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(8,15,30,0.92), rgba(3,7,18,0.97))",
        border: "1px solid rgba(168,85,247,0.18)",
        borderRadius: RADIUS,
        padding: PADDING,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.035), 0 0 44px rgba(168,85,247,0.04)",
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .robos-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 560px) {
          .robos-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 6,
                flexWrap: "wrap",
              }}
            >
              <span style={{ fontSize: 16 }}>🤖</span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  ...TYPO.cardTitle,
                  color: "rgba(168,85,247,0.9)",
                  textTransform: "uppercase",
                }}
              >
                Os 6 Robôs Quantitativos · {ticker}
              </span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.42)",
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.05em",
              }}
            >
              ANÁLISE POR FATORES QUANTITATIVOS ACADÊMICOS
            </div>
          </div>

          {/* Selo "BASEADO EM PAPERS" */}
          <button
            onClick={() => setModalFontesAberto(true)}
            style={{
              background: "rgba(168,85,247,0.08)",
              border: "1px solid rgba(168,85,247,0.25)",
              borderRadius: 999,
              padding: "6px 13px 6px 11px",
              display: "flex",
              alignItems: "center",
              gap: 7,
              cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.08em",
              color: "rgba(168,85,247,0.95)",
              flexShrink: 0,
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(168,85,247,0.14)";
              e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)";
              e.currentTarget.style.boxShadow =
                "0 0 16px rgba(168,85,247,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(168,85,247,0.08)";
              e.currentTarget.style.borderColor = "rgba(168,85,247,0.25)";
              e.currentTarget.style.boxShadow = "none";
            }}
            title="Ver papers acadêmicos que fundamentam os robôs"
          >
            <span style={{ fontSize: 12 }}>📚</span>
            <span>BASEADO EM PAPERS</span>
            <span style={{ fontSize: 9, opacity: 0.7 }}>▸</span>
          </button>
        </div>
      </div>

      {/* GRID 3X2 */}
      <div
        className="robos-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {robos.map((robo) => (
          <CardRobo
            key={robo.id}
            robo={robo}
            onAbrirDetalhes={abrirDetalhes}
          />
        ))}
      </div>

      {/* VEREDITO COLETIVO + SCORE MÉDIO */}
      <div
        style={{
          background: "rgba(168,85,247,0.04)",
          border: "1px solid rgba(168,85,247,0.18)",
          borderRadius: 10,
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 13 }}>🧬</span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: "rgba(168,85,247,0.85)",
            }}
          >
            VEREDITO QUANTITATIVO
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.08em",
              marginLeft: "auto",
            }}
          >
            {stats.aprovados}✓ · {stats.parciais}~ · {stats.reprovados}✗
            {stats.indisponiveis > 0 && ` · ${stats.indisponiveis}?`}
            {stats.scoreMedio > 0 && ` · score ${stats.scoreMedio}`}
            {stats.forcaMedia > 0 && ` · força ${stats.forcaMedia}`}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.55,
          }}
        >
          {resumoColetivo}
        </div>
      </div>

      {/* DISCLAIMER */}
      <div
        style={{
          marginTop: 12,
          padding: "9px 12px",
          background: "rgba(168,85,247,0.04)",
          border: "1px solid rgba(168,85,247,0.12)",
          borderRadius: 8,
          display: "flex",
          alignItems: "flex-start",
          gap: 7,
        }}
      >
        <span style={{ color: "rgba(168,85,247,0.82)", fontSize: 12, flexShrink: 0 }}>
          ⚠
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 400,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.48)",
          }}
        >
          Robôs aplicam fatores quantitativos consagrados na literatura
          acadêmica. Resultados refletem performance dos critérios — não
          constituem recomendação de compra ou venda.
        </span>
      </div>

      {/* MODAIS */}
      {modalAtivo && (
        <ModalCriterios
          robo={modalAtivo}
          ticker={ticker}
          onFechar={fecharModal}
        />
      )}

      {modalFontesAberto && (
        <ModalFontes onFechar={() => setModalFontesAberto(false)} />
      )}
    </div>
  );
}
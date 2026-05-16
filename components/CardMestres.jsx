// src/components/CardMestres.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CARD MESTRES — "O que os 6 mestres diriam"
// Avatares SVG ilustrados, grid 3x2, modal com critérios detalhados
//
// Consome /api/fundamentalista (que já calcula os mestres via V8)
// Defensivo: mostra skeleton durante load, ErroCard se falhar
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────────────────────────────────────────

const TYPO = {
  cardTitle: { fontSize: 12, fontWeight: 800, letterSpacing: "0.12em" },
  metricLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" },
  body: { fontSize: 13, fontWeight: 400, lineHeight: 1.55 },
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

// Map cor temática do mestre → cor real
const CORTEMA_MAP = {
  azul: CORES.azul,
  verde: CORES.verde,
  roxo: CORES.roxo,
  ciano: CORES.ciano,
  amarelo: CORES.amarelo,
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
    label: "APROVADO PARCIAL",
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

// ─────────────────────────────────────────────────────────────────────────────
// 📚 FONTES DOS CRITÉRIOS — livros publicados pelos próprios mestres
// ─────────────────────────────────────────────────────────────────────────────

const FONTES_MESTRES = {
  graham: {
    livros: [
      { titulo: "The Intelligent Investor", ano: 1949 },
      { titulo: "Security Analysis", ano: 1934 },
    ],
    descricao: "Obras fundacionais do value investing",
  },
  buffett: {
    livros: [
      { titulo: "Cartas anuais aos acionistas", ano: "1965-presente" },
    ],
    descricao: "Cartas da Berkshire Hathaway aos acionistas",
  },
  lynch: {
    livros: [
      { titulo: "One Up on Wall Street", ano: 1989 },
      { titulo: "Beating the Street", ano: 1993 },
    ],
    descricao: "Filosofia GARP do gestor do Magellan Fund",
  },
  greenblatt: {
    livros: [
      { titulo: "The Little Book That Beats the Market", ano: 2005 },
    ],
    descricao: "Magic Formula: ROIC + Earnings Yield",
  },
  bazin: {
    livros: [
      { titulo: "Faça Fortuna com Ações", ano: 1991 },
    ],
    descricao: "Método brasileiro de dividendos consistentes",
  },
  barsi: {
    livros: [
      { titulo: "Aposentadoria nas Ações", ano: 2020 },
      { titulo: "Palestras e entrevistas públicas", ano: "—" },
    ],
    descricao: "Carteira previdenciária com ativos perenes",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AVATARES SVG DOS 6 MESTRES
// ─────────────────────────────────────────────────────────────────────────────

function AvatarGraham({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="48" fill="rgba(96,165,250,0.08)" />
      <ellipse cx="0" cy="-2" rx="30" ry="36" fill="#e0b890" />
      {/* Cabelo grisalho anos 50 */}
      <path
        d="M -28 -22 Q -30 -38 -16 -42 Q 0 -46 16 -42 Q 30 -38 28 -22 Q 24 -28 14 -30 Q 0 -32 -14 -30 Q -24 -28 -28 -22 Z"
        fill="#9a9a9a"
      />
      <path d="M -16 -40 Q -8 -44 0 -42" stroke="#8a8a8a" strokeWidth="1" fill="none" />
      <path d="M -22 -28 L -10 -36" stroke="#7a7a7a" strokeWidth="1" strokeLinecap="round" />
      {/* Sobrancelhas */}
      <path d="M -18 -10 Q -12 -13 -6 -10" stroke="#6a6a6a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 6 -10 Q 12 -13 18 -10" stroke="#6a6a6a" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Óculos redondos pequenos */}
      <circle cx="-10" cy="-2" r="7" fill="none" stroke="#2a2a2a" strokeWidth="1.8" />
      <circle cx="10" cy="-2" r="7" fill="none" stroke="#2a2a2a" strokeWidth="1.8" />
      <line x1="-3" y1="-2" x2="3" y2="-2" stroke="#2a2a2a" strokeWidth="1.5" />
      <line x1="-17" y1="-2" x2="-22" y2="-3" stroke="#2a2a2a" strokeWidth="1.5" />
      <line x1="17" y1="-2" x2="22" y2="-3" stroke="#2a2a2a" strokeWidth="1.5" />
      <circle cx="-10" cy="-2" r="1.8" fill="#1a1a1a" />
      <circle cx="10" cy="-2" r="1.8" fill="#1a1a1a" />
      {/* Bigode contido */}
      <path d="M -10 12 Q -5 14 0 12 Q 5 14 10 12" stroke="#6a6a6a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Nariz */}
      <path d="M 0 0 Q -2 6 0 10" stroke="#b89870" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Boca séria */}
      <line x1="-5" y1="20" x2="5" y2="20" stroke="#3a3a3a" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="-9" y="32" width="18" height="10" fill="#e0b890" />
      {/* Terno 3 peças */}
      <path d="M -32 42 L -32 60 L 32 60 L 32 42 Q 12 46 0 50 Q -12 46 -32 42 Z" fill="#1c2a3a" />
      <path d="M -10 42 L -12 60 L 12 60 L 10 42 Q 5 45 0 46 Q -5 45 -10 42 Z" fill="#0f1622" />
      <path d="M -4 42 L -5 60 L 5 60 L 4 42 Z" fill="#e8e8e8" />
      <path d="M -2 43 L 2 43 L 3 60 L -3 60 Z" fill="#2a3a4a" />
    </svg>
  );
}

function AvatarBuffett({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="48" fill="rgba(52,211,153,0.08)" />
      <ellipse cx="0" cy="-2" rx="32" ry="36" fill="#e8c4a0" />
      <path
        d="M -30 -18 Q -32 -38 -10 -42 Q 10 -45 28 -38 Q 32 -22 30 -18 Q 28 -28 14 -30 Q -6 -32 -22 -28 Z"
        fill="#d8d8d8"
      />
      <ellipse cx="0" cy="-32" rx="14" ry="6" fill="#e8c4a0" />
      <path d="M -14 -34 Q 0 -38 14 -34" stroke="#d8d8d8" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="-12" cy="-10" rx="6" ry="2" fill="#a0a0a0" />
      <ellipse cx="12" cy="-10" rx="6" ry="2" fill="#a0a0a0" />
      {/* Óculos enormes */}
      <circle cx="-12" cy="-2" r="9" fill="none" stroke="#1a1a1a" strokeWidth="2" />
      <circle cx="12" cy="-2" r="9" fill="none" stroke="#1a1a1a" strokeWidth="2" />
      <line x1="-3" y1="-2" x2="3" y2="-2" stroke="#1a1a1a" strokeWidth="2" />
      <line x1="-21" y1="-2" x2="-25" y2="-4" stroke="#1a1a1a" strokeWidth="2" />
      <line x1="21" y1="-2" x2="25" y2="-4" stroke="#1a1a1a" strokeWidth="2" />
      <circle cx="-12" cy="-2" r="2" fill="#1a1a1a" />
      <circle cx="12" cy="-2" r="2" fill="#1a1a1a" />
      <path d="M 0 0 Q -2 6 0 10 Q 2 8 2 6" stroke="#c8a070" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M -8 16 Q 0 20 8 16" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="-22" cy="10" rx="6" ry="3" fill="rgba(255,150,150,0.25)" />
      <ellipse cx="22" cy="10" rx="6" ry="3" fill="rgba(255,150,150,0.25)" />
      <rect x="-9" y="32" width="18" height="10" fill="#e8c4a0" />
      <path d="M -32 42 L -32 60 L 32 60 L 32 42 Q 12 46 0 50 Q -12 46 -32 42 Z" fill="#2c3e50" />
      <path d="M -8 42 L -10 60 L 10 60 L 8 42 Q 4 46 0 46 Q -4 46 -8 42 Z" fill="#f5f5f5" />
      <path d="M -3 44 L 3 44 L 4 60 L -4 60 Z" fill="#c0392b" />
    </svg>
  );
}

function AvatarLynch({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="48" fill="rgba(168,85,247,0.08)" />
      <ellipse cx="0" cy="-2" rx="31" ry="35" fill="#e8c4a0" />
      {/* Cabelo branco volumoso */}
      <path
        d="M -30 -22 Q -34 -40 -16 -44 Q 0 -48 18 -44 Q 34 -38 30 -22 Q 28 -32 16 -34 Q 0 -36 -16 -34 Q -28 -32 -30 -22 Z"
        fill="#f0f0f0"
      />
      <path d="M -20 -30 Q -10 -36 0 -38" stroke="#d0d0d0" strokeWidth="1.5" fill="none" />
      <path d="M 0 -38 Q 10 -36 20 -30" stroke="#d0d0d0" strokeWidth="1.5" fill="none" />
      <ellipse cx="-12" cy="-10" rx="6" ry="2" fill="#b0b0b0" />
      <ellipse cx="12" cy="-10" rx="6" ry="2" fill="#b0b0b0" />
      {/* Olhos sorridentes */}
      <path d="M -16 -3 Q -12 -6 -8 -3" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 8 -3 Q 12 -6 16 -3" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 0 0 Q -2 6 0 10 Q 2 8 2 6" stroke="#c8a070" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Sorriso entusiasta */}
      <path d="M -10 14 Q 0 22 10 14" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M -8 17 Q 0 20 8 17" fill="#e08080" />
      <ellipse cx="-22" cy="10" rx="6" ry="3" fill="rgba(255,150,150,0.3)" />
      <ellipse cx="22" cy="10" rx="6" ry="3" fill="rgba(255,150,150,0.3)" />
      <rect x="-9" y="30" width="18" height="10" fill="#e8c4a0" />
      <path d="M -32 40 L -32 60 L 32 60 L 32 40 Q 12 44 0 48 Q -12 44 -32 40 Z" fill="#1e3a5f" />
      <path d="M -8 40 L -10 60 L 10 60 L 8 40 Q 4 44 0 44 Q -4 44 -8 40 Z" fill="#f5f5f5" />
      <path d="M -3 42 L 3 42 L 4 60 L -4 60 Z" fill="#7d3c00" />
      <line x1="-3.5" y1="46" x2="3.5" y2="46" stroke="#ffd700" strokeWidth="0.6" />
      <line x1="-3.5" y1="50" x2="3.5" y2="50" stroke="#ffd700" strokeWidth="0.6" />
      <line x1="-3.5" y1="54" x2="3.5" y2="54" stroke="#ffd700" strokeWidth="0.6" />
    </svg>
  );
}

function AvatarGreenblatt({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="48" fill="rgba(56,189,248,0.08)" />
      <ellipse cx="0" cy="-2" rx="29" ry="35" fill="#e0b890" />
      {/* Cabelo escuro com grisalho lateral */}
      <path
        d="M -28 -22 Q -30 -38 -10 -42 Q 10 -44 28 -38 Q 30 -22 28 -18 Q 26 -28 14 -30 Q 0 -32 -14 -30 Q -24 -28 -28 -22 Z"
        fill="#3a3530"
      />
      <ellipse cx="-24" cy="-12" rx="3" ry="8" fill="#9a9a9a" opacity="0.7" />
      <ellipse cx="24" cy="-12" rx="3" ry="8" fill="#9a9a9a" opacity="0.7" />
      <rect x="-18" y="-12" width="11" height="2" rx="1" fill="#2a2a2a" />
      <rect x="7" y="-12" width="11" height="2" rx="1" fill="#2a2a2a" />
      {/* Óculos retangulares modernos */}
      <rect x="-22" y="-7" width="18" height="11" rx="2" fill="none" stroke="#1a1a1a" strokeWidth="1.8" />
      <rect x="4" y="-7" width="18" height="11" rx="2" fill="none" stroke="#1a1a1a" strokeWidth="1.8" />
      <line x1="-4" y1="-2" x2="4" y2="-2" stroke="#1a1a1a" strokeWidth="1.5" />
      <circle cx="-13" cy="-1" r="1.8" fill="#1a1a1a" />
      <circle cx="13" cy="-1" r="1.8" fill="#1a1a1a" />
      <path d="M 0 2 L -2 10 L 2 10" stroke="#b89870" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <line x1="-6" y1="18" x2="6" y2="18" stroke="#2a2a2a" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="-9" y="32" width="18" height="10" fill="#e0b890" />
      <path d="M -32 42 L -32 60 L 32 60 L 32 42 Q 12 46 0 50 Q -12 46 -32 42 Z" fill="#4a5266" />
      <path d="M -8 42 L -10 60 L 10 60 L 8 42 Q 4 46 0 46 Q -4 46 -8 42 Z" fill="#e8e8e8" />
      <path d="M -3 44 L 3 44 L 4 60 L -4 60 Z" fill="#1e40af" />
    </svg>
  );
}

function AvatarBazin({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="48" fill="rgba(251,191,36,0.1)" />
      <ellipse cx="0" cy="-2" rx="30" ry="36" fill="#dab494" />
      {/* Cabelo escuro */}
      <path
        d="M -28 -20 Q -30 -38 -10 -42 Q 12 -44 28 -38 Q 30 -22 28 -18 Q 24 -30 12 -30 Q 0 -32 -12 -30 Q -22 -28 -28 -20 Z"
        fill="#4a3a30"
      />
      {/* Sobrancelhas pesadas */}
      <ellipse cx="-13" cy="-10" rx="7" ry="2.5" fill="#2a2018" />
      <ellipse cx="13" cy="-10" rx="7" ry="2.5" fill="#2a2018" />
      {/* Óculos clássicos anos 80 */}
      <rect x="-22" y="-7" width="16" height="11" rx="1" fill="none" stroke="#2a1a1a" strokeWidth="1.8" />
      <rect x="6" y="-7" width="16" height="11" rx="1" fill="none" stroke="#2a1a1a" strokeWidth="1.8" />
      <line x1="-6" y1="-2" x2="6" y2="-2" stroke="#2a1a1a" strokeWidth="1.5" />
      <circle cx="-14" cy="-1" r="1.8" fill="#1a1a1a" />
      <circle cx="14" cy="-1" r="1.8" fill="#1a1a1a" />
      <path d="M 0 2 Q -2 8 0 12" stroke="#b89870" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Bigode brasileiro (marca registrada) */}
      <path
        d="M -12 16 Q -8 19 -4 17 Q 0 16 4 17 Q 8 19 12 16 L 10 14 Q 6 16 2 15 Q -2 15 -6 16 Q -10 16 -12 14 Z"
        fill="#3a2a20"
      />
      <path d="M -5 22 Q 0 24 5 22" stroke="#2a1a1a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="-9" y="32" width="18" height="10" fill="#dab494" />
      <path d="M -28 42 L -28 60 L 28 60 L 28 42 Q 10 46 0 48 Q -10 46 -28 42 Z" fill="#5a6a7a" />
      <path d="M -10 42 L -12 60 L 12 60 L 10 42 Q 5 46 0 46 Q -5 46 -10 42 Z" fill="#f5f5f5" />
    </svg>
  );
}

function AvatarBarsi({ size = 90 }) {
  return (
    <svg width={size} height={size} viewBox="-50 -50 100 100">
      <circle cx="0" cy="0" r="48" fill="rgba(52,211,153,0.1)" />
      <ellipse cx="0" cy="-2" rx="30" ry="36" fill="#e0b890" />
      {/* Cabelos brancos penteados pra trás */}
      <path
        d="M -28 -22 Q -32 -36 -16 -40 Q 0 -42 16 -40 Q 32 -36 28 -22 Q 26 -32 14 -32 Q 0 -34 -14 -32 Q -26 -32 -28 -22 Z"
        fill="#f8f8f8"
      />
      <path d="M -20 -34 Q -20 -28 -22 -22" stroke="#d0d0d0" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M -10 -38 Q -10 -30 -12 -22" stroke="#d0d0d0" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M 0 -40 L 0 -22" stroke="#d0d0d0" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M 10 -38 Q 10 -30 12 -22" stroke="#d0d0d0" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M 20 -34 Q 20 -28 22 -22" stroke="#d0d0d0" strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <ellipse cx="-12" cy="-10" rx="6" ry="2" fill="#a8a8a8" />
      <ellipse cx="12" cy="-10" rx="6" ry="2" fill="#a8a8a8" />
      <circle cx="-10" cy="-2" r="2" fill="#1a1a1a" />
      <circle cx="10" cy="-2" r="2" fill="#1a1a1a" />
      <path d="M 0 0 Q -2 6 0 10" stroke="#b89870" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d="M -8 16 Q 0 19 8 16" stroke="#1a1a1a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="-22" cy="8" rx="6" ry="3" fill="rgba(255,150,150,0.2)" />
      <ellipse cx="22" cy="8" rx="6" ry="3" fill="rgba(255,150,150,0.2)" />
      <rect x="-9" y="32" width="18" height="10" fill="#e0b890" />
      {/* Camisa polo simples */}
      <path d="M -28 42 L -28 60 L 28 60 L 28 42 Q 14 44 0 46 Q -14 44 -28 42 Z" fill="#3a5a7a" />
      <path d="M -10 42 L -12 50 L -6 48 L -3 46 L 0 47 L 3 46 L 6 48 L 12 50 L 10 42 Z" fill="#2a4a6a" />
      <circle cx="0" cy="49" r="0.8" fill="#1a3a5a" />
      <circle cx="0" cy="53" r="0.8" fill="#1a3a5a" />
      {/* Óculos pendurados no pescoço */}
      <ellipse cx="-6" cy="56" rx="3" ry="2" fill="none" stroke="#1a1a1a" strokeWidth="1" />
      <ellipse cx="6" cy="56" rx="3" ry="2" fill="none" stroke="#1a1a1a" strokeWidth="1" />
      <line x1="-3" y1="56" x2="3" y2="56" stroke="#1a1a1a" strokeWidth="0.8" />
      <path d="M -9 55 Q -14 50 -16 46" stroke="#5a3a20" strokeWidth="0.8" fill="none" />
      <path d="M 9 55 Q 14 50 16 46" stroke="#5a3a20" strokeWidth="0.8" fill="none" />
    </svg>
  );
}

// Mapa ID → Avatar
const AVATARES = {
  graham: AvatarGraham,
  buffett: AvatarBuffett,
  lynch: AvatarLynch,
  greenblatt: AvatarGreenblatt,
  bazin: AvatarBazin,
  barsi: AvatarBarsi,
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES INTERNOS
// ─────────────────────────────────────────────────────────────────────────────

function Estrelas({ aprovados, total }) {
  // Mapeia ratio para escala de 5 estrelas
  const ratio = total > 0 ? aprovados / total : 0;
  const numEstrelas = Math.round(ratio * 5);

  return (
    <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            color: i <= numEstrelas ? CORES.verde : "rgba(255,255,255,0.18)",
            fontSize: 14,
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD INDIVIDUAL DE CADA MESTRE
// ─────────────────────────────────────────────────────────────────────────────

function CardMestre({ mestre, onAbrirDetalhes }) {
  const Avatar = AVATARES[mestre.id];
  const corTema = CORTEMA_MAP[mestre.corTema] || CORES.cinza;
  const vereditoStyle = VEREDITO_STYLE[mestre.veredito] || VEREDITO_STYLE.indisponivel;
  const fonte = FONTES_MESTRES[mestre.id];
  const [tooltipAberto, setTooltipAberto] = useState(false);

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
      }}
    >
      {/* 📚 BADGE DE FONTE — canto superior direito */}
      {fonte && (
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
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              cursor: "help",
              transition: "all 150ms ease",
              boxShadow: tooltipAberto
                ? "0 0 12px rgba(251,191,36,0.35)"
                : "none",
            }}
          >
            📚
          </div>

          {/* TOOLTIP */}
          {tooltipAberto && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                minWidth: 220,
                maxWidth: 260,
                background: "rgba(10,15,25,0.98)",
                border: "1px solid rgba(251,191,36,0.3)",
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
                  color: "rgba(251,191,36,0.9)",
                  marginBottom: 6,
                }}
              >
                📖 BASEADO EM
              </div>
              {fonte.livros.map((livro, i) => (
                <div
                  key={i}
                  style={{
                    fontFamily: "Georgia, serif",
                    fontSize: 11,
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: 1.45,
                    marginBottom: 3,
                  }}
                >
                  "{livro.titulo}"
                  {livro.ano !== "—" && (
                    <span
                      style={{
                        color: "rgba(255,255,255,0.45)",
                        fontStyle: "normal",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: 10,
                        marginLeft: 4,
                      }}
                    >
                      ({livro.ano})
                    </span>
                  )}
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
        {mestre.nome?.toUpperCase()}
      </div>

      {/* SUBTÍTULO (filosofia curta) */}
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
        {mestre.subtitulo?.toUpperCase()}
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
        "{mestre.citacao}"
      </div>

      {/* ESTRELAS */}
      <Estrelas aprovados={mestre.aprovados} total={mestre.total} />

      {/* PROPORÇÃO DE CRITÉRIOS */}
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          fontWeight: 700,
          color: "rgba(255,255,255,0.55)",
          textAlign: "center",
          marginTop: 6,
          marginBottom: 10,
        }}
      >
        {mestre.aprovados} / {mestre.total} critérios ✓
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
        onClick={() => onAbrirDetalhes(mestre)}
        style={{
          background: "rgba(96,165,250,0.06)",
          border: "1px solid rgba(96,165,250,0.18)",
          borderRadius: 6,
          padding: "7px 10px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "rgba(96,165,250,0.85)",
          cursor: "pointer",
          width: "100%",
          transition: "background 150ms ease, border-color 150ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(96,165,250,0.1)";
          e.currentTarget.style.borderColor = "rgba(96,165,250,0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(96,165,250,0.06)";
          e.currentTarget.style.borderColor = "rgba(96,165,250,0.18)";
        }}
      >
        📋 VER {mestre.total} CRITÉRIOS
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DE CRITÉRIOS DETALHADOS
// ─────────────────────────────────────────────────────────────────────────────

function ModalCriterios({ mestre, ticker, onFechar }) {
  // ESC fecha
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onFechar]);

  if (!mestre) return null;

  const Avatar = AVATARES[mestre.id];
  const corTema = CORTEMA_MAP[mestre.corTema] || CORES.cinza;
  const vereditoStyle = VEREDITO_STYLE[mestre.veredito] || VEREDITO_STYLE.indisponivel;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onFechar}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          zIndex: 9998,
          animation: "fadeIn 200ms ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        {/* Conteúdo do modal — para click propagation */}
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
            boxShadow: `0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)`,
            animation: "slideUp 300ms ease",
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
                {mestre.nome?.toUpperCase()}
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
                CRITÉRIOS PARA {ticker?.toUpperCase()}
              </div>
            </div>

            {/* Botão fechar */}
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

          {/* FILOSOFIA */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: CORES.amarelo,
                opacity: 0.85,
                marginBottom: 10,
              }}
            >
              🎓 FILOSOFIA
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
              {mestre.filosofia}
            </div>
          </div>

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
              ✓ CRITÉRIOS APLICADOS ({mestre.criterios?.length || 0} NO TOTAL)
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {mestre.criterios?.map((c, i) => (
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
                  {/* Ícone ✓ ou × */}
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

                  {/* Conteúdo */}
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
                      {c.descricao} {c.valorAtual && (
                        <>
                          {" · "}
                          <span style={{ fontWeight: 600 }}>atual: {c.valorAtual}</span>
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
              {vereditoStyle.label} · {mestre.aprovados} de {mestre.total} CRITÉRIOS ATENDIDOS
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 📚 MODAL DE FONTES — lista todos os livros que embasam os critérios
// ─────────────────────────────────────────────────────────────────────────────

function ModalFontes({ onFechar }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onFechar]);

  const mestresList = [
    { id: "graham", nome: "Benjamin Graham" },
    { id: "buffett", nome: "Warren Buffett" },
    { id: "lynch", nome: "Peter Lynch" },
    { id: "greenblatt", nome: "Joel Greenblatt" },
    { id: "bazin", nome: "Décio Bazin" },
    { id: "barsi", nome: "Luiz Barsi" },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeInFontes { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpFontes {
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
          animation: "fadeInFontes 200ms ease",
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
            border: "1px solid rgba(251,191,36,0.25)",
            borderRadius: 16,
            maxWidth: 560,
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 25px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
            animation: "slideUpFontes 300ms ease",
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
                background: "rgba(251,191,36,0.12)",
                border: "1px solid rgba(251,191,36,0.3)",
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
                FONTES DOS CRITÉRIOS
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "rgba(251,191,36,0.85)",
                }}
              >
                BASEADO EM LIVROS PUBLICADOS
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
              Os critérios desta avaliação são extraídos de{" "}
              <strong style={{ color: "rgba(251,191,36,0.95)" }}>
                obras publicadas pelos próprios investidores
              </strong>
              . Sem pesos arbitrários ou números chutados — apenas regras
              identificáveis em suas filosofias originais.
            </p>
          </div>

          {/* Lista de mestres + livros */}
          <div style={{ padding: "16px 24px 20px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {mestresList.map((m) => {
                const fonte = FONTES_MESTRES[m.id];
                return (
                  <div
                    key={m.id}
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
                      {m.nome.toUpperCase()}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {fonte.livros.map((livro, i) => (
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
                          • "{livro.titulo}"
                          {livro.ano !== "—" && (
                            <span
                              style={{
                                color: "rgba(255,255,255,0.45)",
                                fontStyle: "normal",
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: 11,
                                marginLeft: 5,
                              }}
                            >
                              ({livro.ano})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.5)",
                        marginTop: 6,
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

          {/* Rodapé com filosofia */}
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
                color: "rgba(52,211,153,0.85)",
                marginBottom: 4,
              }}
            >
              💡 NOSSA FILOSOFIA
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.55,
              }}
            >
              Critérios binários (passa / não passa) são mais honestos que
              scores numéricos com pesos arbitrários. Cada regra aqui pode ser
              verificada nas fontes originais.
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

function SkeletonMestres() {
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
        @keyframes spinMestres { to { transform: rotate(360deg); } }
        @keyframes pulseMestres {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
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
            borderTopColor: CORES.amarelo,
            borderRightColor: "rgba(251,191,36,0.35)",
            animation: "spinMestres 1s linear infinite",
          }}
        />
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            ...TYPO.metricLabel,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          CONSULTANDO OS MESTRES...
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
        MESTRES INDISPONÍVEIS
      </span>
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.55)",
          marginTop: 8,
          marginBottom: 0,
        }}
      >
        {mensagem || "Não foi possível carregar a avaliação dos mestres."}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function CardMestres({ ticker }) {
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
      console.error("[CardMestres] Erro:", e);
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const abrirDetalhes = useCallback((mestre) => {
    setModalAtivo(mestre);
  }, []);

  const fecharModal = useCallback(() => {
    setModalAtivo(null);
  }, []);

  // ═════ ESTADOS ═════
  if (carregando) return <SkeletonMestres />;
  if (erro) return <ErroCard mensagem={erro} />;
  if (!dados) return <ErroCard mensagem="Sem dados disponíveis." />;

  const mestres = dados.mestres || [];
  if (mestres.length === 0) {
    return <ErroCard mensagem="Avaliação dos mestres não disponível para este ativo." />;
  }

  const stats = dados.mestresStats || { aprovados: 0, parciais: 0, reprovados: 0, total: 6 };
  const resumoColetivo = dados.vereditoColetivo;

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(8,15,30,0.92), rgba(3,7,18,0.97))",
        border: "1px solid rgba(251,191,36,0.18)",
        borderRadius: RADIUS,
        padding: PADDING,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.035), 0 0 44px rgba(251,191,36,0.04)",
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .mestres-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 560px) {
          .mestres-grid {
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
          {/* TÍTULO + SUBTÍTULO (esquerda) */}
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
              <span style={{ fontSize: 16 }}>🎓</span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  ...TYPO.cardTitle,
                  color: "rgba(251,191,36,0.9)",
                  textTransform: "uppercase",
                }}
              >
                O que os mestres diriam sobre {ticker}
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
              ANÁLISE ATRAVÉS DOS CRITÉRIOS DE 6 LENDAS DO INVESTIMENTO
            </div>
          </div>

          {/* 📚 SELO "BASEADO EM LIVROS" (direita) */}
          <button
            onClick={() => setModalFontesAberto(true)}
            style={{
              background: "rgba(251,191,36,0.08)",
              border: "1px solid rgba(251,191,36,0.25)",
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
              color: "rgba(251,191,36,0.95)",
              flexShrink: 0,
              transition: "all 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(251,191,36,0.14)";
              e.currentTarget.style.borderColor = "rgba(251,191,36,0.4)";
              e.currentTarget.style.boxShadow =
                "0 0 16px rgba(251,191,36,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(251,191,36,0.08)";
              e.currentTarget.style.borderColor = "rgba(251,191,36,0.25)";
              e.currentTarget.style.boxShadow = "none";
            }}
            title="Ver os livros que embasam os critérios"
          >
            <span style={{ fontSize: 12 }}>📚</span>
            <span>BASEADO EM LIVROS</span>
            <span
              style={{
                fontSize: 9,
                opacity: 0.7,
              }}
            >
              ▸
            </span>
          </button>
        </div>
      </div>

      {/* GRID 3X2 DOS MESTRES */}
      <div
        className="mestres-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14,
          marginBottom: 16,
        }}
      >
        {mestres.map((mestre) => (
          <CardMestre
            key={mestre.id}
            mestre={mestre}
            onAbrirDetalhes={abrirDetalhes}
          />
        ))}
      </div>

      {/* VEREDITO COLETIVO */}
      <div
        style={{
          background: "rgba(52,211,153,0.04)",
          border: "1px solid rgba(52,211,153,0.18)",
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
          }}
        >
          <span style={{ fontSize: 13 }}>💡</span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.1em",
              color: "rgba(52,211,153,0.85)",
            }}
          >
            VEREDITO COLETIVO
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
          background: "rgba(251,191,36,0.04)",
          border: "1px solid rgba(251,191,36,0.12)",
          borderRadius: 8,
          display: "flex",
          alignItems: "flex-start",
          gap: 7,
        }}
      >
        <span style={{ color: "rgba(251,191,36,0.82)", fontSize: 12, flexShrink: 0 }}>⚠</span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            fontWeight: 400,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.48)",
          }}
        >
          Avaliação automatizada baseada em critérios públicos divulgados pelos investidores citados. Interpretação aproximada para fins educacionais — não constitui recomendação de compra ou venda.
        </span>
      </div>

      {/* MODAL DE CRITÉRIOS (por mestre) */}
      {modalAtivo && (
        <ModalCriterios
          mestre={modalAtivo}
          ticker={ticker}
          onFechar={fecharModal}
        />
      )}

      {/* MODAL DE FONTES (livros) */}
      {modalFontesAberto && (
        <ModalFontes onFechar={() => setModalFontesAberto(false)} />
      )}
    </div>
  );
}
// src/components/CardFundamentalista.jsx
// V6 — ROIC em destaque + Qualidade do Lucro
//
// Pilar Qualidade reorganizado:
// 1. ROIC (destaque institucional, criação de valor)
// 2. ROE (complementar)
// 3. Margem EBITDA (destaque, eficiência operacional)
// 4. Margem EBIT (destaque, pós-depreciação)
// 5. Margem Líquida (pós-tudo)
// 6. Qualidade do Lucro (destaque, FCF/Lucro)
// 7. Cresc. Lucro
// 8. Cresc. Receita

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ErroCard from "@/components/ErroCard";

const CORES = {
  verde: "#34d399",
  amarelo: "#fbbf24",
  laranja: "#fb923c",
  vermelho: "#f87171",
  azul: "#38bdf8",
  roxo: "#a78bfa",
};

const TYPO = {
  headerTitle: { fontSize: 12, fontWeight: 800, letterSpacing: "0.12em" },
  headerSubtitle: { fontSize: 13, fontWeight: 400, lineHeight: 1.6 },
  badgeLabel: { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em" },
  bodyText: { fontSize: 14, fontWeight: 400, lineHeight: 1.7 },
  metricLabel: { fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" },
  metricValue: { fontSize: 14, fontWeight: 700 },
  metricSub: { fontSize: 11, fontWeight: 400, lineHeight: 1.45 },
  heroNumber: { fontSize: 44, fontWeight: 900, letterSpacing: "-0.05em" },
  disclaimer: { fontSize: 10, fontWeight: 400, lineHeight: 1.6 },
};

const RADIUS = 14;
const PADDING = 20;

function corNota(score) {
  if (score >= 75) return CORES.verde;
  if (score >= 55) return CORES.amarelo;
  if (score >= 35) return CORES.laranja;
  return CORES.vermelho;
}

function corPorLabel(corLabel) {
  return CORES[corLabel] || CORES.amarelo;
}

function notaLetra(score) {
  if (score >= 85) return "A+";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 45) return "C";
  return "D";
}

function textoEstrutural(score) {
  if (score >= 75)
    return {
      selo: "ESTRUTURA FORTE",
      desc: "Empresa com fundamentos sólidos e equilibrados.",
    };
  if (score >= 55)
    return {
      selo: "ESTRUTURA BOA",
      desc: "Boa estrutura geral, com pontos positivos relevantes.",
    };
  if (score >= 35)
    return {
      selo: "ESTRUTURA MODERADA",
      desc: "Mistura pontos fortes e fragilidades.",
    };
  return {
    selo: "ESTRUTURA FRÁGIL",
    desc: "Fundamentos mais pressionados no cenário atual.",
  };
}

function fmt(v, casas = 1) {
  if (v == null || isNaN(v)) return "—";
  return Number(v).toFixed(casas);
}

function fmtPct(v, casas = 1) {
  if (v == null || isNaN(v)) return "—";
  return `${Number(v).toFixed(casas)}%`;
}

function fmtDY(v) {
  if (v == null || isNaN(v)) return "—";
  return `${(Number(v) * 100).toFixed(1)}%`;
}

const mediaQueries = `
  @media (max-width: 600px) {
    .fund-top-grid { grid-template-columns: 1fr !important; }
    .fund-hero-row { flex-direction: column !important; align-items: flex-start !important; }
    .fund-hero-right { text-align: left !important; width: 100% !important; }
    .fund-score-num { font-size: 38px !important; }
    .fund-donuts-grid { grid-template-columns: 1fr !important; }
    .fund-pilares-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 900px) and (min-width: 601px) {
    .fund-pilares-grid { grid-template-columns: 1fr 1fr !important; }
  }
`;

// InfoTip
function InfoTip({ texto }) {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const handler = () => setAberto(false);
    const timer = setTimeout(() => {
      document.addEventListener("click", handler);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto || !iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const larguraTooltip = 280;
    const margem = 12;
    let left = rect.left + rect.width / 2 - larguraTooltip / 2;
    if (left < margem) left = margem;
    if (left + larguraTooltip > window.innerWidth - margem) {
      left = window.innerWidth - larguraTooltip - margem;
    }
    setPos({ top: rect.bottom + 8, left });
  }, [aberto]);

  return (
    <>
      <span style={{ position: "relative", display: "inline-flex" }}>
        <span
          ref={iconRef}
          onClick={(e) => {
            e.stopPropagation();
            setAberto((p) => !p);
          }}
          onMouseEnter={() => setAberto(true)}
          onMouseLeave={() => setAberto(false)}
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            cursor: "help",
            color: "rgba(255,255,255,.55)",
            border: "1px solid rgba(255,255,255,.18)",
            marginLeft: 5,
            userSelect: "none",
            background: aberto ? "rgba(255,255,255,.06)" : "transparent",
            flexShrink: 0,
          }}
        >
          i
        </span>
      </span>

      {aberto && (
        <span
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            width: 280,
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(2,6,23,.98)",
            border: "1px solid rgba(255,255,255,.14)",
            color: "rgba(255,255,255,.78)",
            fontSize: 11,
            lineHeight: 1.5,
            zIndex: 9999,
            boxShadow: "0 18px 40px rgba(0,0,0,.45)",
            pointerEvents: "none",
            whiteSpace: "normal",
            textAlign: "left",
          }}
        >
          {texto}
        </span>
      )}
    </>
  );
}

function MetricMini({ label, valor, sub, cor, tooltip, destaque, badge }) {
  return (
    <div
      style={{
        background: destaque ? `${cor}08` : "rgba(255,255,255,.025)",
        border: `1px solid ${destaque ? `${cor}30` : "rgba(255,255,255,.06)"}`,
        borderRadius: 10,
        padding: "10px 12px",
        position: "relative",
      }}
    >
      {badge && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            fontSize: 8,
            fontWeight: 800,
            color: cor || "rgba(255,255,255,.55)",
            background: `${cor}15`,
            border: `1px solid ${cor}30`,
            padding: "2px 6px",
            borderRadius: 4,
            letterSpacing: "0.08em",
            fontFamily: "'IBM Plex Mono',monospace",
          }}
        >
          {badge}
        </span>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,.38)",
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        <span>{label}</span>
        {tooltip && <InfoTip texto={tooltip} />}
      </div>

      <div
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 14,
          fontWeight: 900,
          color: cor || "rgba(255,255,255,.92)",
          marginBottom: 4,
          textShadow: destaque ? `0 0 14px ${cor}40` : "none",
        }}
      >
        {valor}
      </div>

      <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.46)" }}>
        {sub}
      </div>
    </div>
  );
}

function Donut({ score, label, sub, cor, tooltip }) {
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div
      style={{
        background: "rgba(255,255,255,.025)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 14,
        padding: 14,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 78,
          height: 78,
          borderRadius: "50%",
          margin: "0 auto 10px",
          background: `conic-gradient(${cor} ${pct * 3.6}deg, rgba(255,255,255,.06) 0deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 18px ${cor}30`,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#050816",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 14,
              fontWeight: 900,
              color: cor,
              lineHeight: 1,
            }}
          >
            {score}
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 8,
              color: "rgba(255,255,255,.35)",
              marginTop: 2,
            }}
          >
            /100
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          color: "rgba(255,255,255,.9)",
          marginBottom: 3,
        }}
      >
        <span>{label}</span>
        {tooltip && <InfoTip texto={tooltip} />}
      </div>

      <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.45)" }}>
        {sub}
      </div>
    </div>
  );
}

function BarraValuation({ score }) {
  const cor = corNota(score);

  return (
    <div
      style={{
        background: "rgba(255,255,255,.02)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricLabel,
            color: "rgba(255,255,255,.45)",
          }}
        >
          MAIS DESCONTADO
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricLabel,
            color: "rgba(255,255,255,.45)",
          }}
        >
          MAIS CARO
        </span>
      </div>

      <div
        style={{
          position: "relative",
          height: 10,
          borderRadius: 999,
          background: "linear-gradient(90deg, #34d399, #fbbf24, #f87171)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${100 - score}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            border: `3px solid ${cor}`,
            boxShadow: `0 0 16px ${cor}`,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          ...TYPO.metricSub,
          color: "rgba(255,255,255,.5)",
        }}
      >
        Quanto maior a nota de valuation, mais descontado o ativo parece em
        relação aos fundamentos. Quanto menor, mais caro/exigente ele parece.
      </div>
    </div>
  );
}

function RadarEquilibrio({ valuation, qualidade, robustez, cor }) {
  const cx = 110;
  const cy = 110;
  const R = 80;

  const eixos = [
    { label: "VALUATION", score: valuation, ang: -90 },
    { label: "QUALIDADE", score: qualidade, ang: 30 },
    { label: "ROBUSTEZ", score: robustez, ang: 150 },
  ];

  const toRad = (g) => (g * Math.PI) / 180;
  const pontoNoRaio = (ang, raio) => {
    const x = cx + raio * Math.cos(toRad(ang));
    const y = cy + raio * Math.sin(toRad(ang));
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  };

  const refPts = eixos.map((e) => pontoNoRaio(e.ang, R)).join(" ");
  const aneis = [0.25, 0.5, 0.75].map((p) =>
    eixos.map((e) => pontoNoRaio(e.ang, R * p)).join(" ")
  );
  const scorePts = eixos
    .map((e) => {
      const s = Math.max(0, Math.min(100, e.score));
      return pontoNoRaio(e.ang, (s / 100) * R);
    })
    .join(" ");

  return (
    <svg
      width="220"
      height="220"
      viewBox="0 0 220 220"
      style={{ maxWidth: "100%", height: "auto" }}
    >
      {aneis.map((pts, i) => (
        <polygon
          key={`anel-${i}`}
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,.06)"
          strokeWidth="1"
        />
      ))}

      <polygon
        points={refPts}
        fill="rgba(255,255,255,.02)"
        stroke="rgba(255,255,255,.12)"
        strokeWidth="1"
      />

      {eixos.map((e, i) => {
        const x = cx + R * Math.cos(toRad(e.ang));
        const y = cy + R * Math.sin(toRad(e.ang));
        return (
          <line
            key={`eixo-${i}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,.06)"
            strokeWidth="1"
          />
        );
      })}

      <polygon
        points={scorePts}
        fill={`${cor}25`}
        stroke={cor}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {eixos.map((e, i) => {
        const s = Math.max(0, Math.min(100, e.score));
        const raio = (s / 100) * R;
        const x = cx + raio * Math.cos(toRad(e.ang));
        const y = cy + raio * Math.sin(toRad(e.ang));
        return (
          <circle
            key={`pt-${i}`}
            cx={x}
            cy={y}
            r="3.5"
            fill={cor}
            stroke="#050816"
            strokeWidth="1.5"
          />
        );
      })}

      {eixos.map((e, i) => {
        const x = cx + (R + 18) * Math.cos(toRad(e.ang));
        const y = cy + (R + 18) * Math.sin(toRad(e.ang));
        return (
          <text
            key={`lbl-${i}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="'IBM Plex Mono', monospace"
            fontSize="9"
            fontWeight="700"
            fill="rgba(255,255,255,.55)"
            letterSpacing="0.08em"
          >
            {e.label}
          </text>
        );
      })}
    </svg>
  );
}

function CardPilar({ icone, titulo, descCurta, descLonga, score, cor, metricas }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.02)",
        border: `1px solid ${cor}20`,
        borderRadius: RADIUS,
        padding: PADDING,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: `${cor}12`,
                border: `1px solid ${cor}30`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: cor,
                fontSize: 14,
                flexShrink: 0,
              }}
            >
              {icone}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "rgba(255,255,255,.92)",
              }}
            >
              {titulo}
            </div>
          </div>

          <div
            style={{
              ...TYPO.metricSub,
              color: "rgba(255,255,255,.6)",
              marginBottom: 6,
            }}
          >
            {descCurta}
          </div>

          <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.42)" }}>
            {descLonga}
          </div>
        </div>

        <div
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 18,
            fontWeight: 900,
            color: cor,
            flexShrink: 0,
          }}
        >
          {score}
        </div>
      </div>

      <div
        style={{
          height: 8,
          borderRadius: 999,
          overflow: "hidden",
          background: "rgba(255,255,255,.06)",
          marginBottom: 14,
        }}
      >
        <div style={{ width: `${score}%`, height: "100%", background: cor }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {metricas.map((m, i) => (
          <MetricMini
            key={i}
            label={m.label}
            valor={m.valor}
            sub={m.sub}
            cor={m.cor}
            tooltip={m.tooltip}
            destaque={m.destaque}
            badge={m.badge}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function CardFundamentalista({ ticker }) {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState(null);

  const buscarDados = useCallback(() => {
    if (!ticker) return;

    setData(null);
    setErro(null);

    fetch(`/api/fundamentalista?ticker=${ticker}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErro(d.error);
        else setData(d);
      })
      .catch((e) => setErro(e.message));
  }, [ticker]);

  useEffect(() => {
    buscarDados();
  }, [buscarDados]);

  if (erro) {
    return (
      <ErroCard
        tituloAnalise="MOTOR FUNDAMENTALISTA"
        erro={erro}
        onTentarNovamente={buscarDados}
      />
    );
  }

  if (!data) {
    return (
      <div
        style={{
          minHeight: 260,
          borderRadius: RADIUS,
          background: "rgba(3,7,18,.88)",
          border: "1px solid rgba(255,255,255,.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,.45)",
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
        }}
      >
        ANALISANDO FUNDAMENTOS...
      </div>
    );
  }

  const {
    scoreFinal,
    valuation,
    qualidade,
    robustez,
    leitura,
    metrics,
    classificacoes = {},
    meta = {},
  } = data;

  const corPrincipal = corNota(scoreFinal);
  const estrutural = textoEstrutural(scoreFinal);

  const corROIC = corPorLabel(classificacoes.roic?.cor);
  const corQLucro = corPorLabel(classificacoes.qualidadeLucro?.cor);
  const corEvEbitda = corPorLabel(classificacoes.evEbitda?.cor);
  const corMargemEbitda = corPorLabel(classificacoes.margemEbitda?.cor);
  const corMargemEbit = corPorLabel(classificacoes.margemEbit?.cor);
  const corDivEbitda = corPorLabel(classificacoes.dividaLiquidaEbitda?.cor);

  return (
    <>
      <style>{mediaQueries}</style>

      <div
        style={{
          background: "rgba(3,7,18,.88)",
          border: `1px solid ${corPrincipal}28`,
          borderRadius: RADIUS,
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: PADDING,
            borderBottom: "1px solid rgba(255,255,255,.06)",
            background: `linear-gradient(180deg, ${corPrincipal}10, transparent)`,
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}
          >
            <span style={{ fontSize: 15, lineHeight: 1 }}>🧠</span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.headerTitle,
                color: corPrincipal,
                textTransform: "uppercase",
              }}
            >
              Leitura Fundamentalista · Motor estrutural
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
          </div>

          <div
            style={{
              ...TYPO.headerSubtitle,
              color: "rgba(255,255,255,.52)",
              paddingLeft: 23,
            }}
          >
            Uma leitura simples da saúde da empresa: preço, qualidade do negócio
            e estrutura financeira.
          </div>
        </div>

        <div style={{ padding: PADDING }}>
          {/* HERO + BARRA VALUATION */}
          <div
            className="fund-top-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr .9fr",
              gap: 14,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,.02)",
                border: "1px solid rgba(255,255,255,.06)",
                borderRadius: RADIUS,
                padding: PADDING,
              }}
            >
              <div
                className="fund-hero-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 18,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  marginBottom: 14,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      fontFamily: "'IBM Plex Mono',monospace",
                      ...TYPO.metricLabel,
                      color: "rgba(255,255,255,.38)",
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    <span>Nota fundamentalista</span>
                    <InfoTip texto="Score de 0 a 100 que combina os 3 pilares (Valuation, Qualidade e Robustez). Escala de notas: A+ (85+), A (75-84), B (60-74), C (45-59) e D (abaixo de 45). Quanto maior, mais sólida parece a estrutura fundamentalista da empresa." />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      className="fund-score-num"
                      style={{
                        fontFamily: "'IBM Plex Mono',monospace",
                        ...TYPO.heroNumber,
                        color: corPrincipal,
                        lineHeight: 1,
                      }}
                    >
                      {scoreFinal}
                    </span>

                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontSize: 16,
                        color: "rgba(255,255,255,.38)",
                        fontWeight: 800,
                      }}
                    >
                      /100
                    </span>

                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontSize: 18,
                        color: corPrincipal,
                        fontWeight: 900,
                        padding: "4px 12px",
                        borderRadius: 999,
                        background: `${corPrincipal}14`,
                        border: `1px solid ${corPrincipal}35`,
                      }}
                    >
                      {notaLetra(scoreFinal)}
                    </span>
                  </div>

                  <div
                    style={{
                      ...TYPO.metricSub,
                      color: "rgba(255,255,255,.46)",
                      marginTop: 9,
                    }}
                  >
                    Mede se a empresa parece saudável nos fundamentos.
                  </div>
                </div>

                <div className="fund-hero-right" style={{ textAlign: "right" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 12px",
                      borderRadius: 999,
                      background: `${corPrincipal}12`,
                      border: `1px solid ${corPrincipal}30`,
                      color: corPrincipal,
                      fontFamily: "'IBM Plex Mono',monospace",
                      ...TYPO.badgeLabel,
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: corPrincipal,
                        boxShadow: `0 0 14px ${corPrincipal}`,
                      }}
                    />
                    {estrutural.selo}
                  </div>

                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      ...TYPO.disclaimer,
                      color: "rgba(255,255,255,.4)",
                    }}
                  >
                    BASE DOS DADOS
                    <br />
                    <strong style={{ color: "rgba(255,255,255,.84)" }}>BRAPI</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  overflow: "hidden",
                  background: "rgba(255,255,255,.06)",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: `${scoreFinal}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${corPrincipal}, #38bdf8)`,
                    boxShadow: `0 0 18px ${corPrincipal}`,
                  }}
                />
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,.035)",
                  border: "1px solid rgba(255,255,255,.075)",
                  borderRadius: 11,
                  padding: "12px 14px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.metricLabel,
                    color: "rgba(255,255,255,.42)",
                    marginBottom: 8,
                    textTransform: "uppercase",
                  }}
                >
                  Leitura rápida
                </div>

                <div style={{ ...TYPO.bodyText, color: "rgba(255,255,255,.8)" }}>
                  {leitura}
                </div>
              </div>
            </div>

            <BarraValuation score={valuation.score} />
          </div>

          {/* DONUTS */}
          <div
            style={{
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: RADIUS,
              padding: PADDING,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.metricLabel,
                color: "rgba(255,255,255,.38)",
                marginBottom: 14,
                textTransform: "uppercase",
              }}
            >
              <span>De onde vem a nota?</span>
              <InfoTip texto="A nota fundamentalista é calculada combinando 3 pilares: Valuation (32%), Qualidade (43%) e Robustez (25%). Cada pilar avalia métricas específicas e gera um score próprio de 0 a 100." />
            </div>

            <div
              className="fund-donuts-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 10,
              }}
            >
              <Donut
                score={valuation.score}
                label="Valuation"
                sub="preço atrativo?"
                cor={corNota(valuation.score)}
                tooltip="Mede se o preço atual da ação está atrativo em relação aos fundamentos. Avalia P/L, P/VP, Dividend Yield e EV/EBITDA."
              />
              <Donut
                score={qualidade.score}
                label="Qualidade"
                sub="cria valor?"
                cor={corNota(qualidade.score)}
                tooltip="Mede a qualidade operacional e a capacidade da empresa CRIAR VALOR sobre o capital investido. Avalia ROIC, ROE, margens (EBITDA/EBIT/Líquida), qualidade do lucro (quanto vira caixa) e crescimentos."
              />
              <Donut
                score={robustez.score}
                label="Robustez"
                sub="estrutura saudável?"
                cor={corNota(robustez.score)}
                tooltip="Mede a saúde financeira e estrutural da empresa. Avalia endividamento, alavancagem (Dívida Líq./EBITDA), liquidez de curto prazo, geração de caixa e tamanho da empresa."
              />
            </div>
          </div>

          {/* 4 PILARES */}
          <div
            className="fund-pilares-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
            }}
          >
            {/* PILAR 1: VALUATION */}
            <CardPilar
              icone="⟁"
              titulo="Valuation"
              descCurta="Quanto maior a nota, mais descontado parece."
              descLonga={valuation.desc}
              score={valuation.score}
              cor={corNota(valuation.score)}
              metricas={[
                {
                  label: "P/L",
                  valor: `${fmt(metrics.pl)}x`,
                  sub: "preço sobre lucro",
                  tooltip:
                    "Preço sobre Lucro. Mostra quantos anos de lucro atual seriam necessários pra 'pagar' o valor da ação. P/L 10 significa 10 anos. Quanto menor, mais barato parece o ativo. Valor calculado pela Brapi com base no LPA TTM.",
                },
                {
                  label: "P/VP",
                  valor: `${fmt(metrics.pvp)}x`,
                  sub: "preço sobre patrimônio",
                  tooltip:
                    "Preço sobre Valor Patrimonial. Compara o preço da ação com o patrimônio líquido por ação (VPA). P/VP de 1 significa que o mercado avalia a empresa pelo seu patrimônio contábil. Acima de 1 = mercado paga prêmio sobre o patrimônio.",
                },
                {
                  label: "Dividend Yield",
                  valor: fmtDY(metrics.dy),
                  sub:
                    metrics.dy != null && metrics.dy > 0
                      ? "retorno em dividendos"
                      : "sem proventos recentes",
                  tooltip:
                    "Mede o retorno em proventos pagos nos últimos 12 meses em relação ao preço atual. Calculado somando todos os pagamentos (dividendos + JCP) reais do histórico Brapi e dividindo pelo preço atual.",
                },
                {
                  label: "EV / EBITDA",
                  valor: metrics.evEbitda != null ? `${fmt(metrics.evEbitda)}x` : "—",
                  sub: classificacoes.evEbitda?.label || "valuation institucional",
                  cor: corEvEbitda,
                  destaque: true,
                  tooltip:
                    "Enterprise Value / EBITDA. Múltiplo institucional que ignora a estrutura de capital (dívida). É como o P/L, mas considera o EBITDA (geração operacional) em vez do lucro líquido. Abaixo de 6x é atrativo; entre 6-11x é justo; acima de 15x é exigente.",
                },
              ]}
            />

            {/* PILAR 2: QUALIDADE (8 métricas, narrativa: criação de valor → margens → caixa → crescimento) */}
            <CardPilar
              icone="⚙"
              titulo="Qualidade operacional"
              descCurta="Quanto maior, mais valor é criado."
              descLonga={qualidade.desc}
              score={qualidade.score}
              cor={corNota(qualidade.score)}
              metricas={[
                {
                  label: "ROIC",
                  valor: fmtPct(metrics.roic),
                  sub: classificacoes.roic?.label || "retorno sobre capital",
                  cor: corROIC,
                  destaque: true,
                  badge: "ELITE",
                  tooltip:
                    "Return on Invested Capital. A métrica de qualidade mais respeitada pelos grandes investidores (Buffett, Greenblatt, Damodaran). Mede o retorno sobre TODO o capital investido (acionistas + credores), descontando impostos. Acima do custo de capital (~10-12% no Brasil) = a empresa cria valor. Acima de 15% é excelente; abaixo de 8% destrói valor.",
                },
                {
                  label: "ROE",
                  valor: fmtPct(metrics.roe),
                  sub: "retorno sobre patrimônio",
                  tooltip:
                    "Return on Equity. Mede o retorno só pra acionistas. Útil como complemento ao ROIC. ROE pode ser inflado por alavancagem alta (dívida), por isso o ROIC é métrica mais robusta.",
                },
                {
                  label: "Margem EBITDA",
                  valor: fmtPct(metrics.margemEbitda),
                  sub: classificacoes.margemEbitda?.label || "eficiência operacional",
                  cor: corMargemEbitda,
                  destaque: true,
                  tooltip:
                    "Mede quanto sobra da receita ANTES de juros, impostos, depreciação e amortização. Mostra a eficiência operacional 'bruta' do negócio. Acima de 25% é excelente; 18-25% saudável; abaixo de 10% pressionada.",
                },
                {
                  label: "Margem EBIT",
                  valor: fmtPct(metrics.margemEbit),
                  sub: classificacoes.margemEbit?.label || "operacional pós-depreciação",
                  cor: corMargemEbit,
                  destaque: true,
                  tooltip:
                    "Mede quanto sobra da receita depois de TODOS os custos operacionais — incluindo depreciação e amortização (desgaste dos ativos). É o EBITDA 'mais conservador'. Em empresas intensivas em capital (Suzano, Vale), a diferença EBITDA - EBIT é grande.",
                },
                {
                  label: "Margem líquida",
                  valor: fmtPct(metrics.margem),
                  sub: "lucro líquido sobre receita",
                  tooltip:
                    "Quanto sobra de lucro depois de pagar todos os custos, despesas, juros e impostos. Margem de 15% = R$15 de lucro pra cada R$100 de receita. É a métrica final da eficiência do negócio.",
                },
                {
                  label: "Qualidade do lucro",
                  valor:
                    metrics.qualidadeLucro != null
                      ? fmt(metrics.qualidadeLucro, 2)
                      : "—",
                  sub:
                    classificacoes.qualidadeLucro?.label || "lucro vira caixa?",
                  cor: corQLucro,
                  destaque: true,
                  badge: "ELITE",
                  tooltip:
                    "Mauboussin / Morgan Stanley. Mede quanto do lucro vira caixa de verdade (FCF / Lucro Líquido). Acima de 1.0 = lucro de qualidade superior (vira caixa). 0.7-1.0 = saudável. Abaixo de 0.5 = sinal de alerta: o lucro contábil é maior que o caixa real, pode indicar acumulo de estoque, capex elevado ou contabilidade agressiva.",
                },
                {
                  label: "Cresc. lucro",
                  valor: fmtPct(metrics.crescLucro),
                  sub: "crescimento recente",
                  tooltip:
                    "Variação do lucro líquido em comparação com o mesmo período do ano anterior. Positivo = empresa lucrando mais. Negativo = queda nos resultados.",
                },
                {
                  label: "Cresc. receita",
                  valor: fmtPct(metrics.crescReceita),
                  sub: "evolução da receita",
                  tooltip:
                    "Variação das vendas/receita em comparação com o mesmo período do ano anterior. Mostra se o negócio está crescendo ou encolhendo em volume.",
                },
              ]}
            />

            {/* PILAR 3: ROBUSTEZ */}
            <CardPilar
              icone="🏛"
              titulo="Robustez financeira"
              descCurta="Quanto maior, mais saudável a estrutura."
              descLonga={robustez.desc}
              score={robustez.score}
              cor={corNota(robustez.score)}
              metricas={[
                {
                  label: "Dív. líq. / patrim.",
                  valor: `${fmt(metrics.dividaPatrimonio)}x`,
                  sub: "nível de alavancagem",
                  tooltip:
                    "Compara a dívida líquida (dívida total menos caixa) com o patrimônio líquido. 0.5x significa dívida equivale a metade do patrimônio. Quanto maior, mais alavancada (e mais arriscada).",
                },
                {
                  label: "Dív. líq. / EBITDA",
                  valor:
                    metrics.dividaLiquidaEbitda != null
                      ? `${fmt(metrics.dividaLiquidaEbitda)}x`
                      : "—",
                  sub:
                    classificacoes.dividaLiquidaEbitda?.label || "anos pra pagar dívida",
                  cor: corDivEbitda,
                  destaque: true,
                  tooltip:
                    "Mostra em quantos anos a empresa quitaria a dívida líquida usando a geração operacional anual (EBITDA). Abaixo de 2x é saudável; 2-3x moderado; acima de 5x indica alavancagem alta. Métrica mais usada por analistas pra avaliar risco de crédito.",
                },
                {
                  label: "Liquidez corrente",
                  valor: `${fmt(metrics.liquidez)}x`,
                  sub: "capacidade de curto prazo",
                  tooltip:
                    "Mede se a empresa tem dinheiro suficiente pra pagar contas de curto prazo (até 12 meses). Acima de 1 = tem mais ativos que dívidas no curto prazo. Abaixo de 1 = possíveis apertos de caixa.",
                },
                {
                  label: "Fluxo operacional",
                  valor: `R$ ${fmt(metrics.fco)} bi`,
                  sub: "geração operacional",
                  tooltip:
                    "Quanto a empresa gerou de caixa pela operação principal, antes de investimentos e financiamentos. Indica se o negócio em si gera dinheiro de verdade.",
                },
                {
                  label: "Free Cash Flow",
                  valor: `R$ ${fmt(metrics.fcf)} bi`,
                  sub: "geração livre de caixa",
                  tooltip:
                    "Caixa que sobra depois de cobrir todos os investimentos necessários para manter o negócio. É o dinheiro disponível pra pagar dividendos, recomprar ações ou crescer. Negativo = empresa está investindo mais do que gera.",
                },
              ]}
            />

            {/* PILAR EQUILIBRIO */}
            <div
              style={{
                background: "rgba(255,255,255,.02)",
                border: `1px solid ${corPrincipal}20`,
                borderRadius: RADIUS,
                padding: PADDING,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: `${corPrincipal}12`,
                        border: `1px solid ${corPrincipal}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: corPrincipal,
                        flexShrink: 0,
                      }}
                    >
                      🎯
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "rgba(255,255,255,.92)",
                      }}
                    >
                      Equilíbrio
                    </div>
                  </div>

                  <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.6)" }}>
                    Síntese visual dos três pilares.
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 18,
                    fontWeight: 900,
                    color: corPrincipal,
                    flexShrink: 0,
                  }}
                >
                  {scoreFinal}
                </div>
              </div>

              <div
                style={{
                  height: 220,
                  borderRadius: 14,
                  background:
                    "radial-gradient(circle at center, rgba(255,255,255,.04), transparent 70%)",
                  border: "1px solid rgba(255,255,255,.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <RadarEquilibrio
                  valuation={valuation.score}
                  qualidade={qualidade.score}
                  robustez={robustez.score}
                  cor={corPrincipal}
                />
              </div>

              <div
                style={{
                  paddingTop: 12,
                  borderTop: "1px solid rgba(255,255,255,.06)",
                }}
              >
                <div
                  style={{
                    color: corPrincipal,
                    fontWeight: 700,
                    marginBottom: 12,
                    ...TYPO.bodyText,
                  }}
                >
                  {estrutural.desc}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <MetricMini
                    label="Ponto forte"
                    valor={
                      robustez.score > valuation.score
                        ? "Robustez"
                        : valuation.score > qualidade.score
                        ? "Valuation"
                        : "Qualidade"
                    }
                    sub="maior destaque"
                    cor={CORES.verde}
                    tooltip="Pilar com a maior nota entre Valuation, Qualidade e Robustez."
                  />

                  <MetricMini
                    label="Ponto fraco"
                    valor={
                      robustez.score < valuation.score
                        ? "Robustez"
                        : valuation.score < qualidade.score
                        ? "Valuation"
                        : "Qualidade"
                    }
                    sub="maior pressão"
                    cor={CORES.vermelho}
                    tooltip="Pilar com a menor nota entre Valuation, Qualidade e Robustez."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RODAPÉ — NOTA DE FONTE */}
          {meta.observacao && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "rgba(96,165,250,0.04)",
                border: "1px solid rgba(96,165,250,0.12)",
                borderRadius: 10,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(96,165,250,0.85)",
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                ⓘ FONTE
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,.5)",
                  lineHeight: 1.5,
                  fontFamily: "'IBM Plex Mono',monospace",
                }}
              >
                {meta.observacao}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
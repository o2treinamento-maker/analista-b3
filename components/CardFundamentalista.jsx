// src/components/CardFundamentalista.jsx

"use client";

import { useEffect, useRef, useState } from "react";

const CORES = {
  verde: "#34d399",
  amarelo: "#fbbf24",
  laranja: "#fb923c",
  vermelho: "#f87171",
  azul: "#38bdf8",
  roxo: "#a78bfa",
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPO PADRONIZADO COM CARDQUANT
// ═══════════════════════════════════════════════════════════════════════════
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

function notaLetra(score) {
  if (score >= 85) return "A+";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 45) return "C";
  return "D";
}

function textoEstrutural(score) {
  if (score >= 75)
    return { selo: "ESTRUTURA FORTE", desc: "Empresa com fundamentos sólidos e equilibrados." };
  if (score >= 55)
    return { selo: "ESTRUTURA BOA", desc: "Boa estrutura geral, com pontos positivos relevantes." };
  if (score >= 35)
    return { selo: "ESTRUTURA MODERADA", desc: "Mistura pontos fortes e fragilidades." };
  return { selo: "ESTRUTURA FRÁGIL", desc: "Fundamentos mais pressionados no cenário atual." };
}

function fmt(v, casas = 1) {
  if (v == null || isNaN(v)) return "—";
  return Number(v).toFixed(casas);
}

function fmtPct(v, casas = 1) {
  if (v == null || isNaN(v)) return "—";
  return `${Number(v).toFixed(casas)}%`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MEDIA QUERIES — torna tudo responsivo
// ═══════════════════════════════════════════════════════════════════════════
const mediaQueries = `
  @media (max-width: 600px) {
    .fund-top-grid {
      grid-template-columns: 1fr !important;
    }
    .fund-hero-row {
      flex-direction: column !important;
      align-items: flex-start !important;
    }
    .fund-hero-right {
      text-align: left !important;
      width: 100% !important;
    }
    .fund-score-num {
      font-size: 38px !important;
    }
    .fund-donuts-grid {
      grid-template-columns: 1fr !important;
    }
    .fund-pilares-grid {
      grid-template-columns: 1fr !important;
    }
  }
  @media (max-width: 900px) and (min-width: 601px) {
    .fund-pilares-grid {
      grid-template-columns: 1fr 1fr !important;
    }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// InfoTip — bolinha (i) com tooltip ao hover/click
// ═══════════════════════════════════════════════════════════════════════════
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
    const larguraTooltip = 260;
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
            width: 260,
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

function MetricMini({ label, valor, sub, cor, tooltip }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.025)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 10,
        padding: "10px 12px",
      }}
    >
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
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
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
    <svg width="220" height="220" viewBox="0 0 220 220" style={{ maxWidth: "100%", height: "auto" }}>
      {aneis.map((pts, i) => (
        <polygon key={`anel-${i}`} points={pts} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1" />
      ))}

      <polygon points={refPts} fill="rgba(255,255,255,.02)" stroke="rgba(255,255,255,.12)" strokeWidth="1" />

      {eixos.map((e, i) => {
        const x = cx + R * Math.cos(toRad(e.ang));
        const y = cy + R * Math.sin(toRad(e.ang));
        return <line key={`eixo-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,.06)" strokeWidth="1" />;
      })}

      <polygon points={scorePts} fill={`${cor}25`} stroke={cor} strokeWidth="2" strokeLinejoin="round" />

      {eixos.map((e, i) => {
        const s = Math.max(0, Math.min(100, e.score));
        const raio = (s / 100) * R;
        const x = cx + raio * Math.cos(toRad(e.ang));
        const y = cy + raio * Math.sin(toRad(e.ang));
        return <circle key={`pt-${i}`} cx={x} cy={y} r="3.5" fill={cor} stroke="#050816" strokeWidth="1.5" />;
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

// ═══════════════════════════════════════════════════════════════════════════
// CARD DE UM PILAR (Valuation / Qualidade / Robustez)
// ═══════════════════════════════════════════════════════════════════════════
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
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

          <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.6)", marginBottom: 6 }}>
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
          <MetricMini key={i} label={m.label} valor={m.valor} sub={m.sub} cor={m.cor} tooltip={m.tooltip} />
        ))}
      </div>
    </div>
  );
}

export default function CardFundamentalista({ ticker }) {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!ticker) return;

    fetch(`/api/fundamentalista?ticker=${ticker}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErro(d.error);
        else setData(d);
      })
      .catch((e) => setErro(e.message));
  }, [ticker]);

  if (erro) {
    return (
      <div
        style={{
          background: "rgba(20,4,4,.4)",
          border: "1px solid rgba(248,113,113,.2)",
          borderRadius: RADIUS,
          padding: PADDING,
          color: CORES.vermelho,
          ...TYPO.bodyText,
        }}
      >
        {erro}
      </div>
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

  const { scoreFinal, valuation, qualidade, robustez, leitura, metrics } = data;
  const corPrincipal = corNota(scoreFinal);
  const estrutural = textoEstrutural(scoreFinal);

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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
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
            Uma leitura simples da saúde da empresa: preço, qualidade do negócio e estrutura financeira.
          </div>
        </div>

        <div style={{ padding: PADDING }}>
          {/* GRID NOTA + BARRA VALUATION */}
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

                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
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

                  <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.46)", marginTop: 9 }}>
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

          {/* DONUTS DE ONDE VEM A NOTA */}
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
              <InfoTip texto="A nota fundamentalista é calculada combinando 3 pilares: Valuation (35%), Qualidade (35%) e Robustez (30%). Cada pilar avalia métricas específicas e gera um score próprio de 0 a 100." />
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
                tooltip="Mede se o preço atual da ação está atrativo em relação aos fundamentos. Avalia P/L, P/VP e Dividend Yield comparativamente. Notas altas indicam ativo mais descontado; notas baixas indicam ativo mais caro/exigente."
              />
              <Donut
                score={qualidade.score}
                label="Qualidade"
                sub="bons resultados?"
                cor={corNota(qualidade.score)}
                tooltip="Mede a qualidade operacional da empresa. Avalia ROE, margem líquida, crescimento do lucro e da receita. Notas altas indicam empresa eficiente e em crescimento; notas baixas indicam dificuldades operacionais."
              />
              <Donut
                score={robustez.score}
                label="Robustez"
                sub="estrutura saudável?"
                cor={corNota(robustez.score)}
                tooltip="Mede a saúde financeira e estrutural da empresa. Avalia endividamento, liquidez de curto prazo e geração de caixa. Notas altas indicam empresa financeiramente sólida; notas baixas indicam fragilidade estrutural."
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
                  tooltip: "Preço sobre Lucro. Mostra quantos anos de lucro atual seriam necessários pra 'pagar' o valor da ação. P/L 10 significa que a empresa demora 10 anos pra gerar lucro equivalente ao preço dela. Quanto menor, mais barato parece o ativo.",
                },
                {
                  label: "P/VP",
                  valor: `${fmt(metrics.pvp)}x`,
                  sub: "preço sobre patrimônio",
                  tooltip: "Preço sobre Valor Patrimonial. Compara o preço da ação com o patrimônio líquido da empresa. P/VP de 1 significa que o mercado avalia a empresa pelo seu patrimônio contábil. Acima de 1 indica que o mercado paga prêmio sobre o patrimônio.",
                },
                {
                  label: "Dividend Yield",
                  valor: metrics.dy != null ? fmtPct(metrics.dy) : "—",
                  sub: metrics.dy != null ? "retorno em dividendos" : "dado indisponível",
                  tooltip: "Mede o retorno em proventos pagos nos últimos 12 meses em relação ao preço atual da ação. Por exemplo, 5% significa que o ativo pagou R$5 em proventos para cada R$100 investidos.",
                },
              ]}
            />

            <CardPilar
              icone="⚙"
              titulo="Qualidade operacional"
              descCurta="Quanto maior, melhor a geração de lucro."
              descLonga={qualidade.desc}
              score={qualidade.score}
              cor={corNota(qualidade.score)}
              metricas={[
                {
                  label: "ROE",
                  valor: fmtPct(metrics.roe),
                  sub: "retorno sobre patrimônio",
                  tooltip: "Return on Equity. Mede o quanto a empresa gera de lucro a cada R$100 investidos pelos sócios. ROE de 20% significa que a empresa gera R$20 de lucro pra cada R$100 do patrimônio. Quanto maior, mais eficiente a empresa.",
                },
                {
                  label: "Margem líquida",
                  valor: fmtPct(metrics.margem),
                  sub: "lucro líquido sobre receita",
                  tooltip: "Mostra quanto sobra de lucro depois de pagar todos os custos, despesas e impostos. Margem de 15% significa que de cada R$100 de receita, sobram R$15 de lucro. Margens maiores indicam empresas mais lucrativas.",
                },
                {
                  label: "Cresc. lucro",
                  valor: fmtPct(metrics.crescLucro),
                  sub: "crescimento recente",
                  tooltip: "Variação do lucro líquido em comparação com o mesmo período do ano anterior. Positivo indica que a empresa está lucrando mais. Negativo indica queda nos resultados.",
                },
                {
                  label: "Cresc. receita",
                  valor: fmtPct(metrics.crescReceita),
                  sub: "evolução da receita",
                  tooltip: "Variação das vendas/receita em comparação com o mesmo período do ano anterior. Mostra se o negócio está crescendo ou encolhendo em volume de operação.",
                },
              ]}
            />

            <CardPilar
              icone="🏛"
              titulo="Robustez financeira"
              descCurta="Quanto maior, mais saudável a estrutura."
              descLonga={robustez.desc}
              score={robustez.score}
              cor={corNota(robustez.score)}
              metricas={[
                {
                  label: "Dívida / patrimônio",
                  valor: `${fmt(metrics.dividaPatrimonio)}x`,
                  sub: "nível de alavancagem",
                  tooltip: "Compara o quanto a empresa deve com o quanto ela tem de patrimônio. Resultado de 0.5x significa que a dívida equivale a metade do patrimônio. Quanto maior, mais alavancada (e mais arriscada) é a empresa.",
                },
                {
                  label: "Liquidez corrente",
                  valor: `${fmt(metrics.liquidez)}x`,
                  sub: "capacidade de curto prazo",
                  tooltip: "Mede se a empresa tem dinheiro suficiente pra pagar suas contas de curto prazo (até 12 meses). Acima de 1 indica que tem mais ativos do que dívidas no curto prazo. Abaixo de 1 pode indicar apertos de caixa.",
                },
                {
                  label: "Fluxo operacional",
                  valor: `R$ ${fmt(metrics.fco)} bi`,
                  sub: "geração operacional",
                  tooltip: "Quanto a empresa gerou de caixa pela operação principal (vender produtos/serviços), antes de investimentos e financiamentos. Indica se o negócio em si gera dinheiro de verdade.",
                },
                {
                  label: "Free Cash Flow",
                  valor: `R$ ${fmt(metrics.fcf)} bi`,
                  sub: "geração livre de caixa",
                  tooltip: "Caixa que sobra depois de cobrir todos os investimentos necessários para manter o negócio funcionando. Esse é o dinheiro que a empresa pode usar pra pagar dividendos, recomprar ações ou crescer.",
                },
              ]}
            />

            {/* PILAR EQUILIBRIO COM RADAR */}
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
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
                  background: "radial-gradient(circle at center, rgba(255,255,255,.04), transparent 70%)",
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
                    tooltip="Pilar com a maior nota entre Valuation, Qualidade e Robustez. É o ponto mais positivo da empresa nos fundamentos."
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
                    tooltip="Pilar com a menor nota entre Valuation, Qualidade e Robustez. É o ponto que mais pressiona a avaliação fundamentalista da empresa."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
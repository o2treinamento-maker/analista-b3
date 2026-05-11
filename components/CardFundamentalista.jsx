"use client";

import { useEffect, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS — compartilhados com CardFluxo
// ═══════════════════════════════════════════════════════════════════════════
const TYPO = {
  headerTitle:    { fontSize: 12, fontWeight: 700, letterSpacing: "0.1em" },
  headerSubtitle: { fontSize: 13, fontWeight: 400, lineHeight: 1.55 },
  badgeLabel:     { fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" },
  bodyText:       { fontSize: 14, fontWeight: 400, lineHeight: 1.65 },
  metricLabel:    { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" },
  metricValue:    { fontSize: 14, fontWeight: 700 },
  metricSub:      { fontSize: 11, fontWeight: 400 },
  heroNumber:     { fontSize: 48, fontWeight: 900, letterSpacing: "-0.04em" },
  disclaimer:     { fontSize: 10, fontWeight: 400, lineHeight: 1.6 },
};
const RADIUS = 14;
const PADDING = 20;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function corScore(score) {
  if (score >= 80) return "#34d399";
  if (score >= 55) return "#fbbf24";
  return "#f87171";
}
function glowScore(score) {
  if (score >= 80) return "rgba(52,211,153,.45)";
  if (score >= 55) return "rgba(251,191,36,.40)";
  return "rgba(248,113,113,.40)";
}
function notaScore(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}
function tituloLeigo(label) {
  if (label === "Valuation") return "Valuation";
  if (label === "Qualidade operacional") return "Qualidade operacional";
  if (label === "Robustez financeira") return "Robustez financeira";
  return label;
}
function subtituloLeigo(label) {
  if (label === "Valuation") return "Quanto maior a nota, mais descontado parece.";
  if (label === "Qualidade operacional") return "Quanto maior, melhor a geração de lucro.";
  if (label === "Robustez financeira") return "Quanto maior, mais saudável a estrutura.";
  return "";
}
function iconePilar(label) {
  if (label === "Valuation") return "📐";
  if (label === "Qualidade operacional") return "⚙️";
  if (label === "Robustez financeira") return "🏛️";
  return "📊";
}

// ─── TOOLTIP TOUCH-FRIENDLY ───────────────────────────────────────────────────
function InfoTip({ texto }) {
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    const handler = () => setAberto(false);
    const timer = setTimeout(() => document.addEventListener("click", handler), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
    };
  }, [aberto]);

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <span
        onClick={(e) => { e.stopPropagation(); setAberto((prev) => !prev); }}
        onMouseEnter={() => setAberto(true)}
        onMouseLeave={() => setAberto(false)}
        style={{
          width: 16, height: 16, borderRadius: "50%",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, cursor: "help",
          color: "rgba(255,255,255,.55)",
          border: "1px solid rgba(255,255,255,.18)",
          marginLeft: 6, userSelect: "none",
          background: aberto ? "rgba(255,255,255,.06)" : "transparent",
          transition: "background .15s",
        }}
      >i</span>
      {aberto && (
        <span style={{
          position: "absolute", left: 22, top: -8, width: 245,
          padding: "10px 12px", borderRadius: 10,
          background: "rgba(2,6,23,.98)",
          border: "1px solid rgba(255,255,255,.14)",
          color: "rgba(255,255,255,.78)",
          fontSize: 11, lineHeight: 1.5, zIndex: 30,
          boxShadow: "0 18px 40px rgba(0,0,0,.45)",
          pointerEvents: "none",
        }}>{texto}</span>
      )}
    </span>
  );
}

// ─── MINI DONUT SVG ───────────────────────────────────────────────────────────
function MiniDonut({ valor, label, ajuda, icone }) {
  const v = Math.max(0, Math.min(100, valor || 0));
  const cor = corScore(v);
  const r = 28;
  const C = 2 * Math.PI * r;
  const offset = C - (v / 100) * C;

  return (
    <div style={{
      flex: "1 1 0", minWidth: 140,
      background: "rgba(255,255,255,.025)",
      border: "1px solid rgba(255,255,255,.06)",
      borderRadius: 14, padding: "16px 12px",
      display: "flex", flexDirection: "column",
      alignItems: "center", gap: 10, textAlign: "center",
    }}>
      <div style={{ position: "relative", width: 72, height: 72 }}>
        <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={cor} strokeWidth="6"
            strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 6px ${cor})` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 18, fontWeight: 800, color: cor, lineHeight: 1 }}>{v}</span>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, color: "rgba(255,255,255,.3)", marginTop: 2, letterSpacing: ".06em" }}>/100</span>
        </div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, ...TYPO.metricValue, fontSize: 12, color: "rgba(255,255,255,.78)", marginBottom: 3 }}>
          <span style={{ fontSize: 13 }}>{icone}</span>
          <span>{label}</span>
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", lineHeight: 1.4 }}>{ajuda}</div>
      </div>
    </div>
  );
}

// ─── 🎯 NOVO: CARD DE EQUILÍBRIO (RADAR + ANÁLISE) ────────────────────────────
function CardEquilibrio({ valuation, qualidade, robustez }) {
  // Define o triângulo do radar — cada vértice é um pilar
  // Coordenadas (centro 100,100, raio máx 70)
  const CX = 100, CY = 100, RMAX = 65;
  const vertices = [
    { angulo: -90, label: "Qualidade", icone: "⚙️", score: qualidade },   // topo
    { angulo: 30,  label: "Robustez",  icone: "🏛️", score: robustez },   // direita-baixo
    { angulo: 150, label: "Valuation", icone: "📐", score: valuation },   // esquerda-baixo
  ];

  // Calcula posição XY de cada vértice baseado no score
  const pontos = vertices.map(v => {
    const rad = (v.angulo * Math.PI) / 180;
    const r = (Math.max(0, Math.min(100, v.score)) / 100) * RMAX;
    return {
      ...v,
      x: CX + Math.cos(rad) * r,
      y: CY + Math.sin(rad) * r,
      // Posição fixa do label (sempre no raio máximo + offset)
      labelX: CX + Math.cos(rad) * (RMAX + 18),
      labelY: CY + Math.sin(rad) * (RMAX + 18),
    };
  });

  // Path do triângulo de score atual
  const pathScore = pontos.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  // Grid concêntrico (25, 50, 75, 100)
  const gridLevels = [0.25, 0.5, 0.75, 1].map(nivel => {
    const pts = vertices.map(v => {
      const rad = (v.angulo * Math.PI) / 180;
      const r = nivel * RMAX;
      return `${CX + Math.cos(rad) * r},${CY + Math.sin(rad) * r}`;
    }).join(" ");
    return pts;
  });

  // Análise consolidada
  const scores = [
    { label: "Valuation",  score: valuation },
    { label: "Qualidade",  score: qualidade },
    { label: "Robustez",   score: robustez  },
  ];
  const mediaScore = Math.round((valuation + qualidade + robustez) / 3);
  const corMedia = corScore(mediaScore);
  const ordenados = [...scores].sort((a, b) => b.score - a.score);
  const maisForte = ordenados[0];
  const maisFraco = ordenados[ordenados.length - 1];
  const diff = maisForte.score - maisFraco.score;

  // Diagnóstico
  let diagnostico;
  if (diff <= 15) {
    diagnostico = { texto: "Empresa equilibrada nos três pilares.", cor: "#34d399" };
  } else if (diff <= 30) {
    diagnostico = { texto: "Boa em alguns aspectos, atenção em outros.", cor: "#fbbf24" };
  } else {
    diagnostico = { texto: "Desequilíbrio acentuado entre os pilares.", cor: "#f87171" };
  }

  return (
    <div style={{
      background: "rgba(2,6,23,.88)",
      border: `1px solid ${corMedia}25`,
      borderRadius: RADIUS,
      padding: PADDING,
      display: "flex",
      flexDirection: "column",
    }}>
      {/* HEADER do card */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "flex-start",
        marginBottom: 14,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "rgba(255,255,255,.9)",
            ...TYPO.metricValue,
            marginBottom: 4,
          }}>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28, height: 28,
              borderRadius: 8,
              background: `${corMedia}12`,
              border: `1px solid ${corMedia}25`,
              fontSize: 14,
              flexShrink: 0,
            }}>🎯</span>
            <span>Equilíbrio</span>
            <InfoTip texto="Compara os três pilares e identifica pontos fortes, fracos e a média geral. Empresas equilibradas tendem a ser mais previsíveis. Quanto maior o desequilíbrio entre os pilares, maior o risco assimétrico." />
          </div>
          <div style={{
            marginTop: 4,
            color: "rgba(255,255,255,.58)",
            ...TYPO.metricSub,
            paddingLeft: 36,
          }}>Síntese visual dos três pilares.</div>
        </div>

        <div style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 26,
          lineHeight: 1,
          fontWeight: 900,
          color: corMedia,
          textShadow: `0 0 16px ${glowScore(mediaScore)}`,
          flexShrink: 0,
        }}>{mediaScore}</div>
      </div>

      {/* RADAR SVG */}
      <div style={{
        display: "flex",
        justifyContent: "center",
        padding: "8px 0 16px",
      }}>
        <svg viewBox="-10 -10 220 220" style={{ width: "100%", maxWidth: 240, height: "auto" }}>
          {/* Grid concêntrico (triângulos sobrepostos) */}
          {gridLevels.map((pts, idx) => (
            <polygon
              key={idx}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          ))}

          {/* Linhas dos eixos (do centro até os vértices) */}
          {vertices.map((v, idx) => {
            const rad = (v.angulo * Math.PI) / 180;
            const x = CX + Math.cos(rad) * RMAX;
            const y = CY + Math.sin(rad) * RMAX;
            return (
              <line
                key={idx}
                x1={CX} y1={CY} x2={x} y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="1"
              />
            );
          })}

          {/* Polígono do score atual com glow */}
          <defs>
            <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={corMedia} stopOpacity="0.35" />
              <stop offset="100%" stopColor={corMedia} stopOpacity="0.1" />
            </radialGradient>
          </defs>

          <path
            d={pathScore}
            fill="url(#radarGrad)"
            stroke={corMedia}
            strokeWidth="2"
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 8px ${corMedia})`,
            }}
          />

          {/* Pontos nos vértices */}
          {pontos.map((p, idx) => {
            const cor = corScore(p.score);
            return (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r="6" fill={cor} opacity="0.2" />
                <circle cx={p.x} cy={p.y} r="3.5" fill={cor}
                  style={{ filter: `drop-shadow(0 0 4px ${cor})` }} />

                {/* Label do pilar */}
                <text
                  x={p.labelX} y={p.labelY}
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize="10"
                  fontWeight="700"
                  fill="rgba(255,255,255,0.6)"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >{p.icone}</text>
                <text
                  x={p.labelX} y={p.labelY + 12}
                  fontFamily="'IBM Plex Mono', monospace"
                  fontSize="9"
                  fontWeight="700"
                  fill={cor}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >{p.score}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* DIAGNÓSTICO + PONTOS FORTES/FRACOS */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingTop: 12,
        borderTop: "1px solid rgba(255,255,255,.06)",
      }}>
        {/* Diagnóstico geral */}
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricSub,
          color: diagnostico.cor,
          fontWeight: 700,
          letterSpacing: "0.02em",
          marginBottom: 4,
        }}>
          {diagnostico.texto}
        </div>

        {/* Ponto mais forte */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricLabel,
            color: "#34d399",
            minWidth: 70,
          }}>💪 FORTE</span>
          <span style={{
            ...TYPO.metricSub,
            color: "rgba(255,255,255,.7)",
            flex: 1,
          }}>{maisForte.label}</span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricValue,
            fontSize: 13,
            color: corScore(maisForte.score),
          }}>{maisForte.score}</span>
        </div>

        {/* Ponto mais fraco */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricLabel,
            color: "#f87171",
            minWidth: 70,
          }}>⚠️ ATENÇÃO</span>
          <span style={{
            ...TYPO.metricSub,
            color: "rgba(255,255,255,.7)",
            flex: 1,
          }}>{maisFraco.label}</span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricValue,
            fontSize: 13,
            color: corScore(maisFraco.score),
          }}>{maisFraco.score}</span>
        </div>

        {/* Média */}
        <div style={{
          marginTop: 4,
          paddingTop: 8,
          borderTop: "1px solid rgba(255,255,255,.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricLabel,
            color: "rgba(255,255,255,.45)",
          }}>SCORE MÉDIO</span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricValue,
            color: corMedia,
          }}>{mediaScore}/100</span>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function CardFundamentalista({ ticker }) {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setData(null);
    setErro(null);
    fetch(`/api/fundamentalista?ticker=${encodeURIComponent(ticker)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setErro(d.error);
        else setData(d);
      })
      .catch((e) => setErro(e.message));
  }, [ticker]);

  if (erro) {
    return (
      <div style={{
        marginTop: 24, padding: PADDING, borderRadius: RADIUS,
        background: "rgba(20,4,4,.65)",
        border: "1px solid rgba(248,113,113,.25)",
        color: "#f87171", ...TYPO.bodyText,
      }}>
        Erro ao carregar leitura fundamentalista: {erro}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        marginTop: 24, minHeight: 260, borderRadius: RADIUS,
        background: "rgba(3,7,18,.82)",
        border: "1px solid rgba(255,255,255,.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "rgba(255,255,255,.4)",
        fontFamily: "'IBM Plex Mono',monospace",
        ...TYPO.metricLabel,
      }}>
        PROCESSANDO LEITURA FUNDAMENTALISTA...
      </div>
    );
  }

  if (data.coberturaLimitada) {
    return (
      <div style={{
        marginTop: 24, padding: PADDING, borderRadius: RADIUS,
        background: "rgba(3,7,18,.86)",
        border: "1px solid rgba(148,163,184,.18)",
      }}>
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.headerTitle,
          textTransform: "uppercase",
          color: "#93c5fd",
          marginBottom: 14,
        }}>Cobertura fundamental limitada</div>
        <div style={{ ...TYPO.bodyText, color: "rgba(255,255,255,.68)", maxWidth: 760 }}>
          Este ativo não possui dados fundamentalistas públicos suficientes na
          fonte utilizada para gerar uma leitura quantitativa confiável.
        </div>
        <div style={{ marginTop: 14, fontFamily: "'IBM Plex Mono',monospace", ...TYPO.disclaimer, color: "rgba(255,255,255,.35)" }}>
          Métricas disponíveis: {data.qtdMetricasValidas}/{data.qtdMetricasTotais}
        </div>
      </div>
    );
  }

  const score = data.scores?.final || 0;
  const valuation = data.scores?.valuation || 50;
  const qualidade = data.scores?.qualidade || 50;
  const robustez = data.scores?.robustez || 50;

  const cor = corScore(score);
  const base = data.prazoDados?.trimestreFormatado || "—";
  const pilares = Object.values(data.pilares || {});

  return (
    <>
      <style jsx global>{`
        @keyframes pulseFund {
          0% { opacity: .55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
          100% { opacity: .55; transform: scale(1); }
        }
        @keyframes shineFund {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @media (max-width: 600px) {
          .fund-hero-row { flex-direction: column !important; align-items: flex-start !important; }
          .fund-hero-right { text-align: left !important; width: 100%; }
          .fund-score-line { flex-wrap: wrap !important; }
          .fund-score-num { font-size: 40px !important; }
        }
      `}</style>

      <div style={{
        marginTop: 24,
        background: "rgba(3,7,18,.86)",
        border: `1px solid ${cor}35`,
        borderRadius: RADIUS,
        overflow: "hidden",
        boxShadow: `0 0 44px ${glowScore(score)}22`,
      }}>
        {/* HEADER */}
        <div style={{
          padding: PADDING,
          borderBottom: "1px solid rgba(255,255,255,.06)",
          background: `linear-gradient(180deg, ${cor}10, transparent)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>🧠</span>
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.headerTitle,
              color: cor,
              textTransform: "uppercase",
            }}>Leitura fundamentalista · motor estrutural</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
          </div>
          <div style={{
            ...TYPO.headerSubtitle,
            color: "rgba(255,255,255,.5)",
            maxWidth: 980,
            paddingLeft: 23,
          }}>
            Uma leitura simples da saúde da empresa: preço, qualidade do negócio
            e estrutura financeira.
          </div>
        </div>

        <div style={{ padding: PADDING }}>

          {/* HERO — score + leitura rápida */}
          <div style={{
            background: "rgba(2,6,23,.92)",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: RADIUS,
            padding: PADDING,
            marginBottom: 16,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
          }}>
            <div className="fund-hero-row" style={{
              display: "flex", justifyContent: "space-between", gap: 24,
              alignItems: "flex-start", flexWrap: "wrap", marginBottom: 18,
            }}>
              <div>
                <div style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.metricLabel,
                  color: "rgba(255,255,255,.35)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}>Nota fundamentalista</div>

                <div className="fund-score-line" style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span className="fund-score-num" style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.heroNumber,
                    color: cor,
                    textShadow: `0 0 24px ${glowScore(score)}`,
                    lineHeight: 1,
                  }}>{score}</span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 16, color: "rgba(255,255,255,.38)", fontWeight: 700,
                  }}>/100</span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 18, color: cor, fontWeight: 900,
                    padding: "4px 12px", borderRadius: 999,
                    background: `${cor}14`, border: `1px solid ${cor}35`,
                  }}>{notaScore(score)}</span>
                </div>

                <div style={{
                  marginTop: 8, ...TYPO.metricSub, fontSize: 12,
                  color: "rgba(255,255,255,.48)", lineHeight: 1.5,
                }}>Mede se a empresa parece saudável nos fundamentos.</div>
              </div>

              <div className="fund-hero-right" style={{ textAlign: "right" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "6px 12px", borderRadius: 8,
                  background: `${cor}20`, border: `1px solid ${cor}50`,
                  color: cor, fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.badgeLabel, textTransform: "uppercase", marginBottom: 10,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: cor, boxShadow: `0 0 14px ${cor}`,
                    animation: "pulseFund 2s ease infinite",
                  }} />
                  {data.classificacao?.label}
                </div>
                <div style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.disclaimer,
                  color: "rgba(255,255,255,.38)",
                }}>
                  BASE DOS DADOS<br />
                  <strong style={{ color: "rgba(255,255,255,.85)" }}>{base}</strong>
                </div>
              </div>
            </div>

            <div style={{
              height: 10, borderRadius: 999,
              background: "rgba(255,255,255,.07)",
              overflow: "hidden", marginBottom: 16,
            }}>
              <div style={{
                position: "relative",
                width: `${Math.max(0, Math.min(100, score))}%`,
                height: "100%", borderRadius: 999,
                background: `linear-gradient(90deg, ${cor}, #38bdf8)`,
                boxShadow: `0 0 18px ${cor}`,
                overflow: "hidden",
                transition: "width 1s cubic-bezier(.4,0,.2,1)",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent)",
                  animation: "shineFund 3s linear infinite",
                }} />
              </div>
            </div>

            <div style={{
              padding: "14px 16px", borderRadius: 10,
              background: "rgba(255,255,255,.035)",
              border: "1px solid rgba(255,255,255,.07)",
            }}>
              <div style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.metricLabel,
                textTransform: "uppercase",
                color: "rgba(255,255,255,.38)",
                marginBottom: 8,
              }}>Leitura rápida</div>
              <div style={{ ...TYPO.bodyText, color: "rgba(255,255,255,.78)" }}>
                {data.leitura}
              </div>
            </div>
          </div>

          {/* BARRA "MAIS DESCONTADO ↔ MAIS CARO" */}
          <div style={{
            background: "rgba(2,6,23,.88)",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: RADIUS,
            padding: PADDING,
            marginBottom: 16,
          }}>
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.38)",
              textTransform: "uppercase",
              marginBottom: 12,
            }}>
              <span>Mais descontado</span>
              <span>Preço vs fundamento</span>
              <span>Mais caro</span>
            </div>
            <div style={{
              position: "relative", height: 9, borderRadius: 999,
              background: "linear-gradient(90deg, rgba(52,211,153,.8), rgba(251,191,36,.85), rgba(248,113,113,.85))",
            }}>
              <div style={{
                position: "absolute",
                left: `${100 - Math.max(0, Math.min(100, valuation))}%`,
                top: "50%", transform: "translate(-50%, -50%)",
                width: 20, height: 20, borderRadius: "50%",
                background: "#fff",
                border: `4px solid ${corScore(valuation)}`,
                boxShadow: `0 0 22px ${corScore(valuation)}`,
                transition: "left 1s cubic-bezier(.4,0,.2,1)",
              }} />
            </div>
            <div style={{ marginTop: 14, ...TYPO.metricSub, color: "rgba(255,255,255,.46)" }}>
              Quanto maior a nota de valuation, mais descontado o ativo parece
              em relação aos fundamentos. Quanto menor, mais caro/exigente ele parece.
            </div>
          </div>

          {/* "DE ONDE VEM A NOTA?" — donuts SVG */}
          <div style={{
            background: "rgba(2,6,23,.88)",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: RADIUS,
            padding: PADDING,
            marginBottom: 16,
          }}>
            <div style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.35)",
              textTransform: "uppercase",
              marginBottom: 14,
            }}>De onde vem a nota?</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <MiniDonut valor={valuation} label="Valuation" ajuda="preço atrativo?" icone="📐" />
              <MiniDonut valor={qualidade} label="Qualidade" ajuda="bons resultados?" icone="⚙️" />
              <MiniDonut valor={robustez} label="Robustez" ajuda="estrutura saudável?" icone="🏛️" />
            </div>
          </div>

          {/* PILARES DETALHADOS + CARD DE EQUILÍBRIO */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
            gap: 16,
          }}>
            {pilares.map((pilar) => {
              const pCor = corScore(pilar.score);
              const icone = iconePilar(pilar.label);
              const tooltip =
                pilar.label === "Valuation"
                  ? "Mede se o ativo parece caro ou barato em relação ao lucro, patrimônio e dividendos. Nota alta indica que o ativo parece mais descontado."
                  : pilar.label === "Qualidade operacional"
                  ? "Mede eficiência, rentabilidade, margens e crescimento operacional da empresa. Nota alta indica uma operação mais eficiente."
                  : "Mede dívida, caixa, liquidez financeira e capacidade de sustentação da empresa. Nota alta indica uma estrutura mais saudável.";

              return (
                <div key={pilar.label} style={{
                  background: "rgba(2,6,23,.88)",
                  border: `1px solid ${pCor}20`,
                  borderRadius: RADIUS,
                  padding: PADDING,
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    gap: 16, alignItems: "flex-start", marginBottom: 14,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        display: "flex", alignItems: "center", gap: 8,
                        color: "rgba(255,255,255,.9)",
                        ...TYPO.metricValue,
                        marginBottom: 4,
                      }}>
                        <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          width: 28, height: 28, borderRadius: 8,
                          background: `${pCor}12`, border: `1px solid ${pCor}25`,
                          fontSize: 14, flexShrink: 0,
                        }}>{icone}</span>
                        <span>{tituloLeigo(pilar.label)}</span>
                        <InfoTip texto={tooltip} />
                      </div>
                      <div style={{
                        marginTop: 4, color: "rgba(255,255,255,.58)",
                        ...TYPO.metricSub, paddingLeft: 36,
                      }}>{subtituloLeigo(pilar.label)}</div>
                      <div style={{
                        marginTop: 5, color: "rgba(255,255,255,.38)",
                        ...TYPO.metricSub, paddingLeft: 36, lineHeight: 1.5,
                      }}>{pilar.leitura}</div>
                    </div>

                    <div style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 26, lineHeight: 1, fontWeight: 900,
                      color: pCor,
                      textShadow: `0 0 16px ${glowScore(pilar.score)}`,
                      flexShrink: 0,
                    }}>{pilar.score}</div>
                  </div>

                  <div style={{
                    height: 7, background: "rgba(255,255,255,.07)",
                    borderRadius: 999, overflow: "hidden", marginBottom: 16,
                  }}>
                    <div style={{
                      width: `${Math.max(0, Math.min(100, pilar.score))}%`,
                      height: "100%", background: pCor, borderRadius: 999,
                      boxShadow: `0 0 12px ${pCor}`,
                      transition: "width 1s cubic-bezier(.4,0,.2,1)",
                    }} />
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    {(pilar.metricas || []).map((m) => {
                      const indisponivel = !m.valor || m.valor === "—";
                      return (
                        <div key={m.label} style={{
                          paddingTop: 10,
                          borderTop: "1px solid rgba(255,255,255,.055)",
                        }}>
                          <div style={{
                            display: "flex", justifyContent: "space-between",
                            gap: 12, marginBottom: 3,
                          }}>
                            <span style={{
                              fontFamily: "'IBM Plex Mono',monospace",
                              ...TYPO.metricLabel,
                              color: "rgba(255,255,255,.42)",
                              textTransform: "uppercase",
                            }}>{m.label}</span>
                            <span style={{
                              fontFamily: "'IBM Plex Mono',monospace",
                              fontSize: 13,
                              color: indisponivel ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.88)",
                              fontWeight: 800,
                            }}>{m.valor || "—"}</span>
                          </div>
                          <div style={{
                            ...TYPO.metricSub,
                            color: "rgba(255,255,255,.32)", lineHeight: 1.4,
                          }}>
                            {indisponivel ? "dado indisponível na BRAPI" : m.sub}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* 🎯 NOVO 4º CARD — Equilíbrio (preenche o espaço vazio) */}
            <CardEquilibrio
              valuation={valuation}
              qualidade={qualidade}
              robustez={robustez}
            />
          </div>

          {/* DISCLAIMER */}
          <div style={{
            marginTop: 16, padding: "10px 12px", borderRadius: 8,
            background: "rgba(251,191,36,0.04)",
            border: "1px solid rgba(251,191,36,0.12)",
            display: "flex", gap: 6, alignItems: "flex-start",
          }}>
            <span style={{ color: "rgba(251,191,36,.8)", fontSize: 13, flexShrink: 0 }}>⚠</span>
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.disclaimer,
              color: "rgba(255,255,255,.5)",
            }}>
              {data.prazoDados?.explicacao} {data.disclaimer}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
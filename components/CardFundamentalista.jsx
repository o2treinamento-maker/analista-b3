// src/components/CardFundamentalista.jsx

"use client";

import { useEffect, useState } from "react";

const CORES = {
  verde: "#34d399",
  amarelo: "#fbbf24",
  laranja: "#fb923c",
  vermelho: "#f87171",
  azul: "#38bdf8",
  roxo: "#a78bfa",
};

const TYPO = {
  metricLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: "0.12em",
  },
  metricSub: {
    fontSize: 12,
    lineHeight: 1.6,
  },
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

function MetricMini({ label, valor, sub, cor }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.025)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,.38)",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 18,
          fontWeight: 900,
          color: cor || "rgba(255,255,255,.92)",
          marginBottom: 5,
        }}
      >
        {valor}
      </div>

      <div
        style={{
          ...TYPO.metricSub,
          color: "rgba(255,255,255,.46)",
        }}
      >
        {sub}
      </div>
    </div>
  );
}

function Donut({ score, label, sub, cor }) {
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div
      style={{
        background: "rgba(255,255,255,.025)",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: 14,
        padding: 18,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: "50%",
          margin: "0 auto 14px",
          background: `conic-gradient(${cor} ${pct * 3.6}deg, rgba(255,255,255,.06) 0deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 18px ${cor}30`,
        }}
      >
        <div
          style={{
            width: 66,
            height: 66,
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
              fontSize: 16,
              fontWeight: 900,
              color: cor,
            }}
          >
            {score}
          </div>

          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 9,
              color: "rgba(255,255,255,.35)",
            }}
          >
            /100
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "rgba(255,255,255,.9)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>

      <div
        style={{
          ...TYPO.metricSub,
          color: "rgba(255,255,255,.45)",
        }}
      >
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
        padding: 18,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 14,
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
          height: 12,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, #34d399, #fbbf24, #f87171)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${100 - score}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            border: `4px solid ${cor}`,
            boxShadow: `0 0 18px ${cor}`,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 14,
          color: "rgba(255,255,255,.5)",
          lineHeight: 1.6,
          fontSize: 13,
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
    <svg width="220" height="220" viewBox="0 0 220 220">
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
  } = data;

  const corPrincipal = corNota(scoreFinal);

  const estrutural = textoEstrutural(scoreFinal);

  return (
    <div
      style={{
        background: "rgba(3,7,18,.88)",
        border: `1px solid ${corPrincipal}28`,
        borderRadius: RADIUS,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: PADDING,
          borderBottom: "1px solid rgba(255,255,255,.06)",
          background: `linear-gradient(180deg, ${corPrincipal}10, transparent)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 15 }}>🧠</span>

          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: corPrincipal,
              textTransform: "uppercase",
            }}
          >
            Leitura Fundamentalista · Motor estrutural
          </span>

          <div
            style={{
              flex: 1,
              height: 1,
              background: "rgba(255,255,255,.06)",
            }}
          />
        </div>

        <div
          style={{
            ...TYPO.metricSub,
            color: "rgba(255,255,255,.5)",
            paddingLeft: 24,
          }}
        >
          Uma leitura simples da saúde da empresa: preço, qualidade do negócio
          e estrutura financeira.
        </div>
      </div>

      <div style={{ padding: PADDING }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr .9fr",
            gap: 16,
            marginBottom: 16,
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
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 20,
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.metricLabel,
                    color: "rgba(255,255,255,.38)",
                    marginBottom: 8,
                    textTransform: "uppercase",
                  }}
                >
                  Nota fundamentalista
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 64,
                      fontWeight: 900,
                      color: corPrincipal,
                      lineHeight: 1,
                    }}
                  >
                    {scoreFinal}
                  </div>

                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 20,
                      color: "rgba(255,255,255,.35)",
                      fontWeight: 800,
                    }}
                  >
                    /100
                  </div>

                  <div
                    style={{
                      padding: "6px 14px",
                      borderRadius: 999,
                      border: `1px solid ${corPrincipal}35`,
                      background: `${corPrincipal}12`,
                      color: corPrincipal,
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontWeight: 900,
                    }}
                  >
                    {notaLetra(scoreFinal)}
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    color: "rgba(255,255,255,.5)",
                    lineHeight: 1.6,
                  }}
                >
                  Mede se a empresa parece saudável nos fundamentos.
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    borderRadius: 999,
                    background: `${corPrincipal}12`,
                    border: `1px solid ${corPrincipal}30`,
                    color: corPrincipal,
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.metricLabel,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: corPrincipal,
                    }}
                  />
                  {estrutural.selo}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    color: "rgba(255,255,255,.35)",
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 11,
                  }}
                >
                  BASE DOS DADOS
                  <br />
                  <strong
                    style={{
                      color: "rgba(255,255,255,.82)",
                    }}
                  >
                    BRAPI
                  </strong>
                </div>
              </div>
            </div>

            <div
              style={{
                height: 14,
                borderRadius: 999,
                overflow: "hidden",
                background: "rgba(255,255,255,.06)",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: `${scoreFinal}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${corPrincipal}, #38bdf8)`,
                }}
              />
            </div>

            <div
              style={{
                background: "rgba(255,255,255,.025)",
                border: "1px solid rgba(255,255,255,.06)",
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.metricLabel,
                  color: "rgba(255,255,255,.38)",
                  marginBottom: 10,
                  textTransform: "uppercase",
                }}
              >
                Leitura rápida
              </div>

              <div
                style={{
                  fontSize: 16,
                  lineHeight: 1.9,
                  color: "rgba(255,255,255,.82)",
                }}
              >
                {leitura}
              </div>
            </div>
          </div>

          <BarraValuation score={valuation.score} />
        </div>

        <div
          style={{
            background: "rgba(255,255,255,.02)",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: RADIUS,
            padding: PADDING,
            marginBottom: 18,
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.38)",
              marginBottom: 16,
              textTransform: "uppercase",
            }}
          >
            De onde vem a nota?
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
            }}
          >
            <Donut
              score={valuation.score}
              label="Valuation"
              sub="preço atrativo?"
              cor={corNota(valuation.score)}
            />

            <Donut
              score={qualidade.score}
              label="Qualidade"
              sub="bons resultados?"
              cor={corNota(qualidade.score)}
            />

            <Donut
              score={robustez.score}
              label="Robustez"
              sub="estrutura saudável?"
              cor={corNota(robustez.score)}
            />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
          }}
        >
          {/* VALUATION */}

          <div
            style={{
              background: "rgba(255,255,255,.02)",
              border: `1px solid ${corNota(valuation.score)}20`,
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
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: `${corNota(valuation.score)}12`,
                      border: `1px solid ${corNota(valuation.score)}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: corNota(valuation.score),
                      fontSize: 16,
                    }}
                  >
                    ⟁
                  </div>

                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "rgba(255,255,255,.92)",
                    }}
                  >
                    Valuation
                  </div>
                </div>

                <div
                  style={{
                    ...TYPO.metricSub,
                    color: "rgba(255,255,255,.6)",
                    marginBottom: 8,
                  }}
                >
                  Quanto maior a nota, mais descontado parece.
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,.42)",
                    lineHeight: 1.6,
                  }}
                >
                  {valuation.desc}
                </div>
              </div>

              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 22,
                  fontWeight: 900,
                  color: corNota(valuation.score),
                }}
              >
                {valuation.score}
              </div>
            </div>

            <div
              style={{
                height: 10,
                borderRadius: 999,
                overflow: "hidden",
                background: "rgba(255,255,255,.06)",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: `${valuation.score}%`,
                  height: "100%",
                  background: corNota(valuation.score),
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <MetricMini
                label="P/L"
                valor={`${fmt(metrics.pl)}x`}
                sub="preço sobre lucro"
              />

              <MetricMini
                label="P/VP"
                valor={`${fmt(metrics.pvp)}x`}
                sub="preço sobre patrimônio"
              />

              <MetricMini
                label="Dividend Yield"
                valor={
                  metrics.dy != null
                    ? fmtPct(metrics.dy)
                    : "—"
                }
                sub={
                  metrics.dy != null
                    ? "retorno em dividendos"
                    : "dado indisponível"
                }
              />
            </div>
          </div>

          {/* QUALIDADE */}

          <div
            style={{
              background: "rgba(255,255,255,.02)",
              border: `1px solid ${corNota(qualidade.score)}20`,
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
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: `${corNota(qualidade.score)}12`,
                      border: `1px solid ${corNota(qualidade.score)}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: corNota(qualidade.score),
                      fontSize: 16,
                    }}
                  >
                    ⚙
                  </div>

                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "rgba(255,255,255,.92)",
                    }}
                  >
                    Qualidade operacional
                  </div>
                </div>

                <div
                  style={{
                    ...TYPO.metricSub,
                    color: "rgba(255,255,255,.6)",
                    marginBottom: 8,
                  }}
                >
                  Quanto maior, melhor a geração de lucro.
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,.42)",
                    lineHeight: 1.6,
                  }}
                >
                  {qualidade.desc}
                </div>
              </div>

              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 22,
                  fontWeight: 900,
                  color: corNota(qualidade.score),
                }}
              >
                {qualidade.score}
              </div>
            </div>

            <div
              style={{
                height: 10,
                borderRadius: 999,
                overflow: "hidden",
                background: "rgba(255,255,255,.06)",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: `${qualidade.score}%`,
                  height: "100%",
                  background: corNota(qualidade.score),
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <MetricMini
                label="ROE"
                valor={fmtPct(metrics.roe)}
                sub="retorno sobre patrimônio"
              />

              <MetricMini
                label="Margem líquida"
                valor={fmtPct(metrics.margem)}
                sub="lucro líquido sobre receita"
              />

              <MetricMini
                label="Cresc. lucro"
                valor={fmtPct(metrics.crescLucro)}
                sub="crescimento recente"
              />

              <MetricMini
                label="Cresc. receita"
                valor={fmtPct(metrics.crescReceita)}
                sub="evolução da receita"
              />
            </div>
          </div>

          {/* ROBUSTEZ */}

          <div
            style={{
              background: "rgba(255,255,255,.02)",
              border: `1px solid ${corNota(robustez.score)}20`,
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
                marginBottom: 14,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: `${corNota(robustez.score)}12`,
                      border: `1px solid ${corNota(robustez.score)}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: corNota(robustez.score),
                      fontSize: 16,
                    }}
                  >
                    🏛
                  </div>

                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "rgba(255,255,255,.92)",
                    }}
                  >
                    Robustez financeira
                  </div>
                </div>

                <div
                  style={{
                    ...TYPO.metricSub,
                    color: "rgba(255,255,255,.6)",
                    marginBottom: 8,
                  }}
                >
                  Quanto maior, mais saudável a estrutura.
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,.42)",
                    lineHeight: 1.6,
                  }}
                >
                  {robustez.desc}
                </div>
              </div>

              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 22,
                  fontWeight: 900,
                  color: corNota(robustez.score),
                }}
              >
                {robustez.score}
              </div>
            </div>

            <div
              style={{
                height: 10,
                borderRadius: 999,
                overflow: "hidden",
                background: "rgba(255,255,255,.06)",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: `${robustez.score}%`,
                  height: "100%",
                  background: corNota(robustez.score),
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <MetricMini
                label="Dívida / patrimônio"
                valor={`${fmt(metrics.dividaPatrimonio)}x`}
                sub="nível de alavancagem"
              />

              <MetricMini
                label="Liquidez corrente"
                valor={`${fmt(metrics.liquidez)}x`}
                sub="capacidade de curto prazo"
              />

              <MetricMini
                label="Fluxo operacional"
                valor={`R$ ${fmt(metrics.fco)} bi`}
                sub="geração operacional"
              />

              <MetricMini
                label="Free Cash Flow"
                valor={`R$ ${fmt(metrics.fcf)} bi`}
                sub="geração livre de caixa"
              />
            </div>
          </div>

          {/* EQUILIBRIO */}

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
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      background: `${corPrincipal}12`,
                      border: `1px solid ${corPrincipal}30`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: corPrincipal,
                    }}
                  >
                    🎯
                  </div>

                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "rgba(255,255,255,.92)",
                    }}
                  >
                    Equilíbrio
                  </div>
                </div>

                <div
                  style={{
                    ...TYPO.metricSub,
                    color: "rgba(255,255,255,.6)",
                  }}
                >
                  Síntese visual dos três pilares.
                </div>
              </div>

              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 22,
                  fontWeight: 900,
                  color: corPrincipal,
                }}
              >
                {scoreFinal}
              </div>
            </div>

            <div
              style={{
                height: 240,
                borderRadius: 14,
                background:
                  "radial-gradient(circle at center, rgba(255,255,255,.04), transparent 70%)",
                border: "1px solid rgba(255,255,255,.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
                position: "relative",
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
                paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,.06)",
              }}
            >
              <div
                style={{
                  color: corPrincipal,
                  fontWeight: 700,
                  marginBottom: 14,
                  lineHeight: 1.7,
                }}
              >
                {estrutural.desc}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <MetricMini
                  label="Ponto forte"
                  valor={
                    robustez.score >
                    valuation.score
                      ? "Robustez"
                      : valuation.score >
                        qualidade.score
                      ? "Valuation"
                      : "Qualidade"
                  }
                  sub="maior destaque"
                  cor={CORES.verde}
                />

                <MetricMini
                  label="Ponto fraco"
                  valor={
                    robustez.score <
                    valuation.score
                      ? "Robustez"
                      : valuation.score <
                        qualidade.score
                      ? "Valuation"
                      : "Qualidade"
                  }
                  sub="maior pressão"
                  cor={CORES.vermelho}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
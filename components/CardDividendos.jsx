// src/components/CardDividendos.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CARD DIVIDENDOS v2.1 — fixes dos bugs SUZB3
// ═══════════════════════════════════════════════════════════════════════════
// FIXES v2.1:
//   ✓ Header: mostra "DESDE 2018" + "13 anos" (em vez de "2+ anos" enganoso)
//   ✓ Badge "histórico irregular" se temGaps
//   ✓ Gráfico: barras zeradas em anos sem pagamento (não pula anos)
//   ✓ Anos sem pagamento ficam com label visual diferente
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect, useRef } from "react";

const TYPO = {
  headerTitle:    { fontSize: 12, fontWeight: 700, letterSpacing: "0.1em" },
  headerSubtitle: { fontSize: 13, fontWeight: 400, lineHeight: 1.55 },
  badgeLabel:     { fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" },
  bodyText:       { fontSize: 14, fontWeight: 400, lineHeight: 1.65 },
  metricLabel:    { fontSize: 10, fontWeight: 600, letterSpacing: "0.1em" },
  metricValue:    { fontSize: 14, fontWeight: 700 },
  metricSub:      { fontSize: 11, fontWeight: 400 },
  heroNumber:     { fontSize: 44, fontWeight: 900, letterSpacing: "-0.04em" },
  disclaimer:     { fontSize: 10, fontWeight: 400, lineHeight: 1.6 },
};
const RADIUS = 14;
const PADDING = 20;

const CORES = {
  verde:    "#34d399",
  amarelo:  "#fbbf24",
  laranja:  "#fb923c",
  vermelho: "#f87171",
  azul:     "#60a5fa",
  roxo:     "#a78bfa",
  dourado:  "#fbbf24",
};

const GLOWS = {
  verde:    "rgba(52,211,153,.45)",
  amarelo:  "rgba(251,191,36,.40)",
  laranja:  "rgba(251,146,60,.40)",
  vermelho: "rgba(248,113,113,.40)",
};

function corScore(score) {
  if (score >= 75) return CORES.verde;
  if (score >= 50) return CORES.amarelo;
  if (score >= 30) return CORES.laranja;
  return CORES.vermelho;
}
function glowScore(score) {
  if (score >= 75) return GLOWS.verde;
  if (score >= 50) return GLOWS.amarelo;
  if (score >= 30) return GLOWS.laranja;
  return GLOWS.vermelho;
}
function notaScore(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 45) return "C";
  return "D";
}

const fmtPct = (v, casas = 1) => {
  if (v == null || isNaN(v)) return "—";
  return `${(v * 100).toFixed(casas)}%`;
};
const fmtPctSinal = (v, casas = 2) => {
  if (v == null || isNaN(v)) return "—";
  const sinal = v >= 0 ? "+" : "";
  return `${sinal}${(v * 100).toFixed(casas)}`;
};
const fmtMoeda = (v) => {
  if (v == null || isNaN(v)) return "—";
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
};
const fmtData = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
};
const diasAte = (iso) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

// ─── TOOLTIP (position fixed) ─────────────────────────────────────────────────
function InfoTip({ texto }) {
  const [aberto, setAberto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const handler = () => setAberto(false);
    const timer = setTimeout(() => document.addEventListener("click", handler), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handler);
    };
  }, [aberto]);

  useEffect(() => {
    if (!aberto || !iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const larguraTooltip = 240;
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
          onClick={(e) => { e.stopPropagation(); setAberto(p => !p); }}
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
      </span>
      {aberto && (
        <span style={{
          position: "fixed",
          top: pos.top, left: pos.left,
          width: 240, padding: "10px 12px", borderRadius: 10,
          background: "rgba(2,6,23,.98)",
          border: "1px solid rgba(255,255,255,.14)",
          color: "rgba(255,255,255,.78)",
          fontSize: 11, lineHeight: 1.5,
          zIndex: 9999,
          boxShadow: "0 18px 40px rgba(0,0,0,.45)",
          pointerEvents: "none",
          whiteSpace: "normal", textAlign: "left",
        }}>{texto}</span>
      )}
    </>
  );
}

// ─── MÉTRICA ──────────────────────────────────────────────────────────────────
function Metrica({ label, valor, sub, cor, tooltip, destaque }) {
  return (
    <div style={{
      background: destaque ? `${cor}08` : "rgba(255,255,255,.02)",
      border: `1px solid ${destaque ? `${cor}25` : "rgba(255,255,255,.06)"}`,
      borderRadius: 10,
      padding: "12px 14px",
    }}>
      <div style={{
        display: "flex", alignItems: "center",
        fontFamily: "'IBM Plex Mono',monospace",
        ...TYPO.metricLabel,
        color: "rgba(255,255,255,.4)",
        marginBottom: 6,
      }}>
        <span>{label}</span>
        {tooltip && <InfoTip texto={tooltip} />}
      </div>
      <div style={{
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: 18, fontWeight: 800,
        color: cor || "rgba(255,255,255,.9)",
        textShadow: destaque ? `0 0 14px ${cor}40` : "none",
        lineHeight: 1,
      }}>{valor}</div>
      {sub && (
        <div style={{
          ...TYPO.metricSub,
          color: "rgba(255,255,255,.45)",
          marginTop: 4,
        }}>{sub}</div>
      )}
    </div>
  );
}

function Estrelas({ qtd }) {
  return (
    <span style={{ letterSpacing: "1px", fontSize: 13 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{
          color: i <= qtd ? CORES.dourado : "rgba(255,255,255,.15)",
        }}>★</span>
      ))}
    </span>
  );
}

// ─── DECOMPOSIÇÃO DO SCORE ────────────────────────────────────────────────────
function DecomposicaoScore({ scores }) {
  const itens = [
    {
      label: "YIELD", valor: scores.yield, peso: 30,
      cor: corScore(scores.yield),
      icone: "💰", desc: "Magnitude do dividendo",
      tooltip: "Mede se o DY 12m é alto pra padrões brasileiros. Bandas: >12% excepcional, 8-12% muito alto, 5-8% alto, 3-5% moderado, <3% baixo.",
    },
    {
      label: "CRESCIMENTO", valor: scores.crescimento, peso: 35,
      cor: corScore(scores.crescimento),
      icone: "📈", desc: "Tendência do dividendo",
      tooltip: "Mede o CAGR de 5 anos. CAGR > 15% é acelerado, 5-15% saudável, 0-5% estável. Negativo penaliza. Limitado a 30% pra evitar exuberância. Histórico com lacunas: -10 pts.",
    },
    {
      label: "CONSISTÊNCIA", valor: scores.consistencia, peso: 35,
      cor: corScore(scores.consistencia),
      icone: "🎯", desc: "Previsibilidade",
      tooltip: "Estabilidade direcional (resíduos da tendência) + anos pagando consecutivos. Empresa que cresce CONSISTENTEMENTE tem score alto, não baixo.",
    },
  ];

  return (
    <div style={{
      background: "rgba(2,6,23,.88)",
      border: "1px solid rgba(255,255,255,.07)",
      borderRadius: RADIUS, padding: PADDING, marginBottom: 16,
    }}>
      <div style={{
        fontFamily: "'IBM Plex Mono',monospace",
        ...TYPO.metricLabel,
        color: "rgba(255,255,255,.35)",
        textTransform: "uppercase",
        marginBottom: 14,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span>🧩 Composição do score</span>
        {scores.bonusPatamar > 0 && (
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 9, fontWeight: 700,
            color: CORES.verde,
            padding: "3px 8px",
            background: `${CORES.verde}15`,
            border: `1px solid ${CORES.verde}30`,
            borderRadius: 4,
          }}>+{scores.bonusPatamar} BÔNUS PATAMAR</span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {itens.map(item => (
          <div key={item.label}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13 }}>{item.icone}</span>
                <span style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.metricLabel,
                  color: "rgba(255,255,255,.7)",
                }}>{item.label}</span>
                <InfoTip texto={item.tooltip} />
                <span style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 9,
                  color: "rgba(255,255,255,.35)",
                  padding: "2px 6px",
                  background: "rgba(255,255,255,.04)",
                  borderRadius: 3,
                }}>peso {item.peso}%</span>
              </div>
              <span style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 16, fontWeight: 800,
                color: item.cor,
              }}>{item.valor}</span>
            </div>

            <div style={{
              height: 6, borderRadius: 999,
              background: "rgba(255,255,255,.04)",
              overflow: "hidden",
            }}>
              <div style={{
                width: `${Math.max(0, Math.min(100, item.valor))}%`,
                height: "100%", borderRadius: 999,
                background: item.cor,
                boxShadow: `0 0 8px ${item.cor}80`,
                transition: "width 1s cubic-bezier(.4,0,.2,1)",
              }} />
            </div>

            <div style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 10,
              color: "rgba(255,255,255,.4)",
              marginTop: 3,
            }}>{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GRÁFICO DE BARRAS v2.1 — mostra gaps ────────────────────────────────────
function GraficoBarras({ historico }) {
  if (!historico?.length) return null;

  const anoCorrente = new Date().getFullYear();
  const dados = historico.slice(-6);
  const maxValor = Math.max(...dados.map(d => d.total), 0.01);

  const W = 600;
  const H = 240;
  const padLeft = 50;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 50;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;
  const barGap = 16;
  const barW = (chartW - barGap * (dados.length - 1)) / dados.length;

  return (
    <div style={{
      background: "rgba(2,6,23,.88)",
      border: "1px solid rgba(255,255,255,.07)",
      borderRadius: RADIUS, padding: PADDING, marginBottom: 16,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 14,
      }}>
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,.35)",
          textTransform: "uppercase",
        }}>📊 Histórico de pagamentos</div>
        <div style={{
          display: "flex", gap: 12, fontSize: 9,
          fontFamily: "'IBM Plex Mono',monospace",
          color: "rgba(255,255,255,.4)",
        }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, background: CORES.verde, borderRadius: 2 }} />
            DIVIDENDO
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, background: CORES.azul, borderRadius: 2 }} />
            JCP
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, background: CORES.roxo, borderRadius: 2 }} />
            REND.
          </span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {[0.25, 0.5, 0.75, 1].map(p => (
          <line key={p}
            x1={padLeft} y1={padTop + chartH - chartH * p}
            x2={W - padRight} y2={padTop + chartH - chartH * p}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1"
          />
        ))}

        {[0.25, 0.5, 0.75, 1].map(p => (
          <text key={p}
            x={padLeft - 6} y={padTop + chartH - chartH * p + 3}
            fontFamily="'IBM Plex Mono',monospace" fontSize="9"
            fill="rgba(255,255,255,0.25)" textAnchor="end"
          >
            R$ {(maxValor * p).toFixed(2)}
          </text>
        ))}

        {/* Linha base do eixo X */}
        <line
          x1={padLeft} y1={padTop + chartH}
          x2={W - padRight} y2={padTop + chartH}
          stroke="rgba(255,255,255,0.12)" strokeWidth="1"
        />

        {dados.map((d, i) => {
          const x = padLeft + i * (barW + barGap);
          const ehGap = d.gap || d.total === 0; // 🌟 FIX 2: ano sem pagamento
          const totalH = ehGap ? 0 : (d.total / maxValor) * chartH;
          const dividendoH = (d.dividendo / maxValor) * chartH;
          const jcpH = (d.jcp / maxValor) * chartH;
          const rendimentoH = (d.rendimento / maxValor) * chartH;
          const parcial = d.ano === anoCorrente;

          return (
            <g key={d.ano}>
              {/* 🌟 FIX 2: Visual especial pra anos sem pagamento */}
              {ehGap && (
                <>
                  {/* Marcador "sem pagamento" — linha tracejada na base */}
                  <line
                    x1={x} y1={padTop + chartH - 4}
                    x2={x + barW} y2={padTop + chartH - 4}
                    stroke="rgba(248,113,113,0.4)" strokeWidth="2"
                    strokeDasharray="3,3"
                  />
                  <text
                    x={x + barW / 2}
                    y={padTop + chartH - 12}
                    fontFamily="'IBM Plex Mono',monospace" fontSize="9"
                    fontWeight="700"
                    fill="rgba(248,113,113,0.7)"
                    textAnchor="middle"
                  >
                    —
                  </text>
                  <text
                    x={x + barW / 2}
                    y={padTop + chartH + 14}
                    fontFamily="'IBM Plex Mono',monospace" fontSize="8"
                    fill="rgba(248,113,113,0.5)"
                    textAnchor="middle"
                  >
                    sem pag.
                  </text>
                </>
              )}

              {/* Barras normais */}
              {!ehGap && dividendoH > 0 && (
                <rect x={x} y={padTop + chartH - dividendoH}
                  width={barW} height={dividendoH}
                  fill={CORES.verde} opacity={parcial ? 0.6 : 1} rx={2}
                />
              )}
              {!ehGap && jcpH > 0 && (
                <rect x={x} y={padTop + chartH - dividendoH - jcpH}
                  width={barW} height={jcpH}
                  fill={CORES.azul} opacity={parcial ? 0.6 : 1}
                />
              )}
              {!ehGap && rendimentoH > 0 && (
                <rect x={x} y={padTop + chartH - dividendoH - jcpH - rendimentoH}
                  width={barW} height={rendimentoH}
                  fill={CORES.roxo} opacity={parcial ? 0.6 : 1}
                />
              )}

              {/* Valor no topo (só se tem barra) */}
              {!ehGap && (
                <text x={x + barW / 2} y={padTop + chartH - totalH - 6}
                  fontFamily="'IBM Plex Mono',monospace" fontSize="11"
                  fontWeight="700"
                  fill={parcial ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)"}
                  textAnchor="middle"
                >
                  R$ {d.total.toFixed(2)}
                </text>
              )}

              {/* Ano */}
              <text x={x + barW / 2} y={H - 22}
                fontFamily="'IBM Plex Mono',monospace" fontSize="11"
                fontWeight="600"
                fill={ehGap ? "rgba(248,113,113,0.5)" : parcial ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.55)"}
                textAnchor="middle"
              >{d.ano}</text>

              {/* Label "parcial" */}
              {parcial && !ehGap && (
                <text x={x + barW / 2} y={H - 8}
                  fontFamily="'IBM Plex Mono',monospace" fontSize="8"
                  fill="rgba(251,191,36,0.6)"
                  textAnchor="middle"
                >parcial</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── PRÓXIMO PAGAMENTO ────────────────────────────────────────────────────────
function ProximoPagamento({ pagamento }) {
  const dias = diasAte(pagamento.data);
  const corDestaque = dias <= 7 ? CORES.verde : dias <= 30 ? CORES.amarelo : "rgba(255,255,255,.5)";
  const tipoLabel = pagamento.tipo === "JCP" ? "JCP" : pagamento.tipo === "RENDIMENTO" ? "REND." : "DIVIDENDO";

  return (
    <div style={{
      background: `linear-gradient(135deg, ${corDestaque}10, transparent)`,
      border: `1px solid ${corDestaque}30`,
      borderRadius: 10,
      padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 10, fontWeight: 700, color: corDestaque,
          letterSpacing: "0.08em",
          padding: "3px 8px",
          background: `${corDestaque}15`,
          border: `1px solid ${corDestaque}30`,
          borderRadius: 4,
        }}>{tipoLabel}</span>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 11, fontWeight: 700, color: corDestaque,
        }}>
          {dias <= 0 ? "HOJE" : dias === 1 ? "AMANHÃ" : `EM ${dias} DIAS`}
        </span>
      </div>

      <div>
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 22, fontWeight: 800,
          color: "rgba(255,255,255,.9)", lineHeight: 1,
        }}>{fmtMoeda(pagamento.valor)}<span style={{ fontSize: 12, color: "rgba(255,255,255,.4)", fontWeight: 500, marginLeft: 6 }}>/ ação</span></div>
      </div>

      <div style={{
        display: "flex", flexDirection: "column", gap: 4,
        paddingTop: 8,
        borderTop: "1px solid rgba(255,255,255,.05)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 9, color: "rgba(255,255,255,.4)",
            letterSpacing: "0.06em",
          }}>PAGAMENTO</span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 11, color: "rgba(255,255,255,.8)", fontWeight: 600,
          }}>{fmtData(pagamento.data)}</span>
        </div>
        {pagamento.dataCom && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 9, color: "rgba(255,255,255,.4)",
              letterSpacing: "0.06em",
            }}>DATA-COM</span>
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 11,
              color: pagamento.dataComJaPassou ? CORES.vermelho : CORES.verde,
              fontWeight: 600,
            }}>
              {fmtData(pagamento.dataCom)}
              {pagamento.dataComJaPassou ? " ✗" : " ✓"}
            </span>
          </div>
        )}
      </div>

      {pagamento.dataComJaPassou !== null && (
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 10,
          color: pagamento.dataComJaPassou ? "rgba(248,113,113,.7)" : "rgba(52,211,153,.7)",
          lineHeight: 1.4, paddingTop: 4,
        }}>
          {pagamento.dataComJaPassou
            ? "✗ Comprando hoje, NÃO recebe este pagamento"
            : "✓ Compre antes da data-com pra receber"}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function CardDividendos({ ticker }) {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState(null);
  const [aberto, setAberto] = useState(true);

  useEffect(() => {
    if (!ticker) return;
    setData(null); setErro(null);
    fetch(`/api/dividendos?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setErro(d.error);
        else setData(d);
      })
      .catch(e => setErro(e.message));
  }, [ticker]);

  if (erro) {
    return (
      <div style={{
        background: "rgba(20,4,4,.4)",
        border: "1px solid rgba(248,113,113,.15)",
        borderRadius: RADIUS, padding: PADDING,
        color: "#f87171", ...TYPO.bodyText,
      }}>
        Análise de dividendos indisponível: {erro}
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        minHeight: 260, borderRadius: RADIUS,
        background: "rgba(3,7,18,.82)",
        border: "1px solid rgba(255,255,255,.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "rgba(255,255,255,.4)",
        fontFamily: "'IBM Plex Mono',monospace",
        ...TYPO.metricLabel,
      }}>
        CALCULANDO ANÁLISE DE DIVIDENDOS...
      </div>
    );
  }

  if (!data.temDividendos) {
    return (
      <div style={{
        background: "rgba(3,7,18,.86)",
        border: "1px solid rgba(148,163,184,.18)",
        borderRadius: RADIUS, padding: PADDING,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 15 }}>💰</span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.headerTitle,
            color: "#93c5fd",
            textTransform: "uppercase",
          }}>Dividendos · histórico não disponível</span>
        </div>
        <div style={{ ...TYPO.bodyText, color: "rgba(255,255,255,.65)" }}>
          {data.leitura}
        </div>
      </div>
    );
  }

  const { scores, metricas, classificacoes, frequencia, historicoAnual, proximos, leitura, versaoAlgoritmo } = data;
  const cor = corScore(scores.final);
  const corPagadora = CORES[classificacoes.pagadora.cor] || CORES.amarelo;

  // 🌟 FIX 1: header inteligente
  const headerLabel = (() => {
    const { anoInicio, anosConsecutivos: consec, temGaps, qtdGaps } = metricas;
    if (!anoInicio) return "histórico curto";
    if (temGaps) {
      return `desde ${anoInicio} · ${consec} consec. · ${qtdGaps} ${qtdGaps === 1 ? "ano" : "anos"} sem pagamento`;
    }
    return `${consec}+ anos consecutivos · desde ${anoInicio}`;
  })();

  return (
    <>
      <style jsx global>{`
        @keyframes pulseDiv {
          0% { opacity: .55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
          100% { opacity: .55; transform: scale(1); }
        }
        @keyframes shineDiv {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @media (max-width: 600px) {
          .div-hero-row { flex-direction: column !important; align-items: flex-start !important; }
          .div-hero-right { text-align: left !important; width: 100%; }
          .div-score-num { font-size: 38px !important; }
          .div-metricas-grid { grid-template-columns: 1fr 1fr !important; }
          .div-proximos-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{
        background: "rgba(3,7,18,.86)",
        border: `1px solid ${cor}35`,
        borderRadius: RADIUS,
        overflow: "hidden",
        boxShadow: `0 0 44px ${glowScore(scores.final)}22`,
      }}>
        {/* HEADER */}
        <div style={{
          padding: PADDING,
          borderBottom: "1px solid rgba(255,255,255,.06)",
          background: `linear-gradient(180deg, ${cor}10, transparent)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>💰</span>
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.headerTitle,
              color: cor,
              textTransform: "uppercase",
            }}>Perfil de Dividendos · {headerLabel}</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
            {versaoAlgoritmo && (
              <span style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 9, color: "rgba(255,255,255,.3)",
              }}>{versaoAlgoritmo}</span>
            )}
          </div>
          <div style={{
            ...TYPO.headerSubtitle,
            color: "rgba(255,255,255,.5)",
            paddingLeft: 23,
          }}>
            Histórico de proventos, crescimento e estabilidade da remuneração ao acionista.
          </div>
        </div>

        <div style={{ padding: PADDING }}>

          {/* HERO */}
          <div style={{
            background: "rgba(2,6,23,.92)",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: RADIUS,
            padding: PADDING, marginBottom: 16,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
          }}>
            <div className="div-hero-row" style={{
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
                }}>Nota de Dividendos</div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                  <span className="div-score-num" style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.heroNumber,
                    color: cor,
                    textShadow: `0 0 24px ${glowScore(scores.final)}`,
                    lineHeight: 1,
                  }}>{scores.final}</span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 16, color: "rgba(255,255,255,.38)", fontWeight: 700,
                  }}>/100</span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 18, color: cor, fontWeight: 900,
                    padding: "4px 12px", borderRadius: 999,
                    background: `${cor}14`, border: `1px solid ${cor}35`,
                  }}>{notaScore(scores.final)}</span>
                </div>
              </div>

              <div className="div-hero-right" style={{ textAlign: "right" }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "6px 12px", borderRadius: 8,
                  background: `${corPagadora}20`, border: `1px solid ${corPagadora}50`,
                  color: corPagadora, fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.badgeLabel, textTransform: "uppercase",
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: corPagadora, boxShadow: `0 0 14px ${corPagadora}`,
                    animation: "pulseDiv 2s ease infinite",
                  }} />
                  {classificacoes.pagadora.label}
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
                width: `${Math.max(0, Math.min(100, scores.final))}%`,
                height: "100%", borderRadius: 999,
                background: `linear-gradient(90deg, ${cor}, #38bdf8)`,
                boxShadow: `0 0 18px ${cor}`,
                overflow: "hidden",
                transition: "width 1s cubic-bezier(.4,0,.2,1)",
              }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent)",
                  animation: "shineDiv 3s linear infinite",
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
              }}>Leitura de dividendos</div>
              <div style={{ ...TYPO.bodyText, color: "rgba(255,255,255,.78)" }}>
                {leitura}
              </div>
            </div>
          </div>

          <DecomposicaoScore scores={scores} />

          <div className="div-metricas-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10, marginBottom: 16,
          }}>
            <Metrica
              label="DY 12 MESES"
              valor={fmtPct(metricas.dy12m, 2)}
              sub={classificacoes.yield.label}
              cor={CORES[classificacoes.yield.cor]}
              destaque
              tooltip="Dividend Yield dos últimos 12 meses: soma dos pagamentos / preço atual. Bandas absolutas: >10% muito alto, 6-10% alto, 4-6% moderado, <4% baixo."
            />
            <Metrica
              label="CAGR 5 ANOS"
              valor={fmtPctSinal(metricas.cagr5y, 1) + "%"}
              sub={metricas.temGaps ? "histórico irregular" : classificacoes.crescimento.label}
              cor={metricas.temGaps ? CORES.laranja : CORES[classificacoes.crescimento.cor]}
              destaque
              tooltip="Taxa de crescimento anual composta dos dividendos. Calibrado pra valorizar 'Dividend Growth'. Limitado a 30% pra evitar viés de exuberância. Histórico com lacunas: CAGR pode estar distorcido."
            />
            <Metrica
              label="ESTABILIDADE"
              valor={<Estrelas qtd={classificacoes.estabilidade.estrelas} />}
              sub={classificacoes.estabilidade.label}
              cor={CORES[classificacoes.estabilidade.cor]}
              tooltip="Estabilidade DIRECIONAL: mede consistência com a tendência. Empresa que cresce 50% ao ano consistentemente tem ESTABILIDADE ALTA. Penaliza apenas oscilação aleatória."
            />
            <Metrica
              label="FREQUÊNCIA"
              valor={frequencia.label}
              sub={`${frequencia.media.toFixed(1)}x/ano`}
              cor="rgba(255,255,255,.85)"
              tooltip="Periodicidade média de pagamentos. FIIs geralmente mensais. Ações brasileiras costumam pagar trimestral ou semestralmente."
            />
            <Metrica
              label="ANOS PAGANDO"
              valor={metricas.anosConsecutivos}
              sub={metricas.temGaps ? `${metricas.anosTotaisPagos} no total` : "consecutivos"}
              cor={metricas.anosConsecutivos >= 10 ? CORES.verde : metricas.anosConsecutivos >= 5 ? CORES.amarelo : CORES.laranja}
              tooltip={metricas.temGaps
                ? `Empresa pagou em ${metricas.anosTotaisPagos} anos no total, mas com ${metricas.qtdGaps} ${metricas.qtdGaps === 1 ? "ano" : "anos"} sem pagamento. Consecutivos: ${metricas.anosConsecutivos}.`
                : "Quantos anos consecutivos a empresa pagou dividendos. 10+ anos é sinal de empresa madura e comprometida com remuneração ao acionista."
              }
            />
          </div>

          {historicoAnual.length > 0 && (
            <GraficoBarras historico={historicoAnual} />
          )}

          {proximos.filter(p => p.valor >= 0.01).length > 0 && (
          <div style={{
              background: "rgba(2,6,23,.88)",
              border: "1px solid rgba(52,211,153,.15)",
              borderRadius: RADIUS, padding: PADDING, marginBottom: 16,
            }}>
              <div style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.metricLabel,
                color: CORES.verde,
                textTransform: "uppercase",
                marginBottom: 14,
              }}>🗓️ Próximos pagamentos anunciados</div>

              <div className="div-proximos-grid" style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.min(proximos.length, 3)}, 1fr)`,
                gap: 10,
              }}>
                {proximos.filter(p => p.valor >= 0.01).map((p, i) => (
                 <ProximoPagamento key={i} pagamento={p} />
                ))}
              </div>
            </div>
          )}

          <div style={{
            padding: "10px 12px", borderRadius: 8,
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
              Histórico de proventos pagos não garante pagamentos futuros. Análise de caráter informativo, calculada com dados públicos. Pagamentos pré-2009 ignorados para evitar distorções por desdobramentos.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
// src/components/CardQuant.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CARD QUANT — Beta, Alfa, Sharpe, Drawdown, VaR e cia
// Design system unificado com CardFluxo + CardFundamentalista
// ═══════════════════════════════════════════════════════════════════════════
// CORREÇÕES NESTA VERSÃO:
//   ✓ BarraComparativa usa retornos.ano (acumulado) + mercado.retornoIbovAcumulado
//   ✓ BarraComparativa robusta a valores null/undefined/NaN
//   ✓ Volatilidade exibida sem sinal "+" (é sempre positiva)
//   ✓ InfoTip usa position: fixed pra ESCAPAR do overflow:hidden do card pai
//   ✓ Tooltip detecta borda da tela e nunca corta (left/right adjust)
//   ✓ z-index 9999 garante visibilidade total
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
};

const GLOWS = {
  verde:    "rgba(52,211,153,.45)",
  amarelo:  "rgba(251,191,36,.40)",
  laranja:  "rgba(251,146,60,.40)",
  vermelho: "rgba(248,113,113,.40)",
  azul:     "rgba(96,165,250,.40)",
  roxo:     "rgba(167,139,250,.40)",
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
  if (score >= 85) return "A+";
  if (score >= 75) return "A";
  if (score >= 60) return "B";
  if (score >= 45) return "C";
  return "D";
}

const fmtPct = (v, casas = 1) => {
  if (v == null || isNaN(v)) return "—";
  const sinal = v >= 0 ? "+" : "";
  return `${sinal}${(v * 100).toFixed(casas)}%`;
};

const fmtPctSemSinal = (v, casas = 1) => {
  if (v == null || isNaN(v)) return "—";
  return `${(v * 100).toFixed(casas)}%`;
};

const fmtNum = (v, casas = 2) => {
  if (v == null || isNaN(v)) return "—";
  return v.toFixed(casas);
};

// ─── TOOLTIP COM POSITION: FIXED (escapa de overflow:hidden) ──────────────────
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

  // Calcula posição na tela (FIXED, relativo à janela) quando abre
  useEffect(() => {
    if (!aberto || !iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const larguraTooltip = 240;
    const margem = 12;

    // Centraliza embaixo do ícone
    let left = rect.left + rect.width / 2 - larguraTooltip / 2;

    // Ajusta se sair pela esquerda
    if (left < margem) left = margem;

    // Ajusta se sair pela direita
    if (left + larguraTooltip > window.innerWidth - margem) {
      left = window.innerWidth - larguraTooltip - margem;
    }

    setPos({
      top: rect.bottom + 8,
      left,
    });
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
          top: pos.top,
          left: pos.left,
          width: 240,
          padding: "10px 12px",
          borderRadius: 10,
          background: "rgba(2,6,23,.98)",
          border: "1px solid rgba(255,255,255,.14)",
          color: "rgba(255,255,255,.78)",
          fontSize: 11, lineHeight: 1.5,
          zIndex: 9999,
          boxShadow: "0 18px 40px rgba(0,0,0,.45)",
          pointerEvents: "none",
          whiteSpace: "normal",
          textAlign: "left",
        }}>{texto}</span>
      )}
    </>
  );
}

// ─── BARRA COMPARATIVA ATIVO vs IBOV (robusta) ────────────────────────────────
function BarraComparativa({ label, ativo, ibov, formatador = fmtPct, corAtivo = CORES.azul }) {
  const ativoNum = (ativo == null || isNaN(ativo)) ? 0 : ativo;
  const ibovNum = (ibov == null || isNaN(ibov)) ? 0 : ibov;

  const maxAbs = Math.max(Math.abs(ativoNum), Math.abs(ibovNum), 0.01);
  const wAtivo = (Math.abs(ativoNum) / maxAbs) * 100;
  const wIbov = (Math.abs(ibovNum) / maxAbs) * 100;
  const corAtivoFinal = ativoNum >= 0 ? corAtivo : CORES.vermelho;
  const corIbovFinal = ibovNum >= 0 ? "rgba(255,255,255,0.4)" : CORES.vermelho;

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontFamily: "'IBM Plex Mono',monospace",
        ...TYPO.metricLabel,
        color: "rgba(255,255,255,.4)",
        marginBottom: 8,
      }}>
        <span>{label}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.7)",
          minWidth: 50,
        }}>ATIVO</span>
        <div style={{
          flex: 1, height: 8, borderRadius: 4,
          background: "rgba(255,255,255,.04)",
          overflow: "hidden", position: "relative",
        }}>
          <div style={{
            height: "100%", width: `${wAtivo}%`,
            background: corAtivoFinal,
            boxShadow: `0 0 8px ${corAtivoFinal}`,
            transition: "width 1s cubic-bezier(.4,0,.2,1)",
            borderRadius: 4,
          }} />
        </div>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 12, fontWeight: 700, color: corAtivoFinal,
          minWidth: 60, textAlign: "right",
        }}>{formatador(ativoNum)}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.4)",
          minWidth: 50,
        }}>IBOV</span>
        <div style={{
          flex: 1, height: 8, borderRadius: 4,
          background: "rgba(255,255,255,.04)",
          overflow: "hidden", position: "relative",
        }}>
          <div style={{
            height: "100%", width: `${wIbov}%`,
            background: corIbovFinal,
            transition: "width 1s cubic-bezier(.4,0,.2,1)",
            borderRadius: 4,
          }} />
        </div>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.6)",
          minWidth: 60, textAlign: "right",
        }}>{formatador(ibovNum)}</span>
      </div>
    </div>
  );
}

// ─── MÉTRICA COMPACTA ─────────────────────────────────────────────────────────
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
        marginBottom: sub ? 4 : 0,
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

// ─── DRAWDOWN VIEW ────────────────────────────────────────────────────────────
function DrawdownView({ atual, maximo }) {
  const max = Math.abs(maximo);
  const pctAtual = max > 0 ? (Math.abs(atual) / max) * 100 : 0;

  return (
    <div style={{
      background: "rgba(20,4,4,.4)",
      border: "1px solid rgba(248,113,113,.15)",
      borderRadius: 10,
      padding: "14px 16px",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        marginBottom: 10,
      }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(248,113,113,.7)",
        }}>📉 QUEDA DO PICO</span>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,.4)",
        }}>1 ANO</span>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 11, color: "rgba(255,255,255,.5)",
            marginBottom: 4,
          }}>Atual</div>
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 22, fontWeight: 800,
            color: atual < -0.05 ? CORES.vermelho : atual < 0 ? CORES.amarelo : CORES.verde,
          }}>{fmtPct(atual)}</div>
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 11, color: "rgba(255,255,255,.5)",
            marginBottom: 4,
          }}>Pior do período</div>
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 22, fontWeight: 800,
            color: CORES.vermelho,
          }}>{fmtPct(maximo)}</div>
        </div>
      </div>

      <div style={{
        position: "relative", height: 8, borderRadius: 4,
        background: "linear-gradient(90deg, rgba(52,211,153,.3), rgba(251,191,36,.3), rgba(248,113,113,.4))",
        overflow: "visible",
      }}>
        <div style={{
          position: "absolute",
          left: `${Math.min(pctAtual, 100)}%`,
          top: "50%", transform: "translate(-50%, -50%)",
          width: 14, height: 14, borderRadius: "50%",
          background: "#fff",
          border: `3px solid ${CORES.vermelho}`,
          boxShadow: `0 0 12px ${CORES.vermelho}`,
        }} />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        marginTop: 6,
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: 9, color: "rgba(255,255,255,.3)",
      }}>
        <span>topo</span>
        <span>pior queda</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function CardQuant({ ticker }) {
  const [data, setData] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setData(null); setErro(null);
    fetch(`/api/quant?ticker=${encodeURIComponent(ticker)}`)
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
        Análise quantitativa indisponível: {erro}
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
        CALCULANDO MÉTRICAS QUANT...
      </div>
    );
  }

  const { scores, retornos, risco, ajustado, mercado, comportamento, classificacoes, leitura } = data;
  const cor = corScore(scores.final);

  return (
    <>
      <style jsx global>{`
        @keyframes pulseQuant {
          0% { opacity: .55; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
          100% { opacity: .55; transform: scale(1); }
        }
        @keyframes shineQuant {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @media (max-width: 600px) {
          .quant-hero-row { flex-direction: column !important; align-items: flex-start !important; }
          .quant-hero-right { text-align: left !important; width: 100%; }
          .quant-score-num { font-size: 38px !important; }
          .quant-metrics-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={{
        background: "rgba(3,7,18,.86)",
        border: `1px solid ${cor}35`,
        borderRadius: RADIUS,
        overflow: "hidden",
        boxShadow: `0 0 44px ${glowScore(scores.final)}22`,
      }}>
        <div style={{
          padding: PADDING,
          borderBottom: "1px solid rgba(255,255,255,.06)",
          background: `linear-gradient(180deg, ${cor}10, transparent)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>🧮</span>
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.headerTitle,
              color: cor,
              textTransform: "uppercase",
            }}>Perfil Quantitativo · 1 ano</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.07)" }} />
          </div>
          <div style={{
            ...TYPO.headerSubtitle,
            color: "rgba(255,255,255,.5)",
            paddingLeft: 23,
          }}>
            Como esse ativo se comporta em relação ao mercado, risco e retorno.
          </div>
        </div>

        <div style={{ padding: PADDING }}>

          <div style={{
            background: "rgba(2,6,23,.92)",
            border: "1px solid rgba(255,255,255,.07)",
            borderRadius: RADIUS,
            padding: PADDING,
            marginBottom: 16,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,.04)",
          }}>
            <div className="quant-hero-row" style={{
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
                }}>Nota quantitativa</div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                  <span className="quant-score-num" style={{
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

              <div className="quant-hero-right" style={{ textAlign: "right" }}>
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
                    animation: "pulseQuant 2s ease infinite",
                  }} />
                  PERFIL {classificacoes.beta.label.toUpperCase()}
                </div>
                <div style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.disclaimer,
                  color: "rgba(255,255,255,.38)",
                }}>
                  BENCHMARK<br />
                  <strong style={{ color: "rgba(255,255,255,.85)" }}>IBOVESPA · 1 ANO</strong>
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
                  animation: "shineQuant 3s linear infinite",
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
              }}>Leitura quant</div>
              <div style={{ ...TYPO.bodyText, color: "rgba(255,255,255,.78)" }}>
                {leitura}
              </div>
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 10,
            marginBottom: 16,
          }} className="quant-metrics-grid">
            <Metrica
              label="β BETA"
              valor={fmtNum(mercado.beta)}
              sub={classificacoes.beta.desc}
              cor={CORES[classificacoes.beta.cor]}
              destaque
              tooltip="Beta mede a sensibilidade do ativo ao IBOV. Beta=1 significa que anda junto. Beta>1 amplifica os movimentos (mais volátil que o índice). Beta<1 suaviza (defensivo)."
            />
            <Metrica
              label="α ALFA ANUAL"
              valor={fmtPct(mercado.alfa)}
              sub={classificacoes.alfa.label}
              cor={CORES[classificacoes.alfa.cor]}
              destaque
              tooltip="Alfa de Jensen mede o EXCESSO de retorno acima do que era esperado pelo seu Beta. Usa retornos anualizados — por isso pode diferir da subtração simples Ativo - IBOV vista na barra. Alfa acima de 5% já é raro; acima de 15% indica geração de valor excepcional."
            />
            <Metrica
              label="SHARPE"
              valor={fmtNum(ajustado.sharpe)}
              sub={classificacoes.sharpe.label}
              cor={CORES[classificacoes.sharpe.cor]}
              destaque
              tooltip="Sharpe Ratio mede retorno por unidade de risco. Acima de 1 é bom, acima de 2 é excelente. Usa média histórica da SELIC (12.4%) como taxa livre de risco pra estabilidade do score."
            />
          </div>

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
            }}>📊 Retornos por janela</div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}>
              {[
                { label: "1 MÊS", v: retornos.umMes },
                { label: "3 MESES", v: retornos.tresMeses },
                { label: "6 MESES", v: retornos.seisMeses },
                { label: "1 ANO", v: retornos.ano },
              ].map(item => {
                const corR = item.v == null ? "rgba(255,255,255,.5)" : item.v >= 0 ? CORES.verde : CORES.vermelho;
                return (
                  <div key={item.label} style={{
                    padding: "12px 10px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,.02)",
                    border: "1px solid rgba(255,255,255,.05)",
                    textAlign: "center",
                  }}>
                    <div style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 9, color: "rgba(255,255,255,.35)",
                      letterSpacing: "0.08em", marginBottom: 6,
                    }}>{item.label}</div>
                    <div style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 14, fontWeight: 700, color: corR,
                    }}>{fmtPct(item.v)}</div>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid rgba(255,255,255,.05)",
            }}>
              <BarraComparativa
                label="RETORNO 1 ANO · ATIVO vs IBOV"
                ativo={retornos.ano}
                ibov={mercado.retornoIbovAcumulado}
                corAtivo={cor}
              />
            </div>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 12,
            marginBottom: 16,
          }}>
            <div style={{
              background: "rgba(2,6,23,.88)",
              border: "1px solid rgba(255,255,255,.07)",
              borderRadius: RADIUS,
              padding: PADDING,
            }}>
              <div style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.metricLabel,
                color: "rgba(255,255,255,.35)",
                textTransform: "uppercase",
                marginBottom: 14,
              }}>⚡ Volatilidade & Risco</div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.6)", display: "flex", alignItems: "center" }}>
                    Volatilidade anual
                    <InfoTip texto="Variação típica anual do preço (desvio padrão dos retornos × √252). Mede o quão 'agitado' é o ativo." />
                  </span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 14, fontWeight: 800,
                    color: CORES[classificacoes.volatilidade.cor],
                  }}>{fmtPctSemSinal(risco.volatilidadeAnual, 1)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.6)", display: "flex", alignItems: "center" }}>
                    VaR diário (95%)
                    <InfoTip texto="Perda máxima esperada em 95% dos dias. Em 1 a cada 20 dias, a perda pode ser pior que esse número." />
                  </span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 14, fontWeight: 800,
                    color: CORES.vermelho,
                  }}>{fmtPct(risco.var95, 2)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.6)", display: "flex", alignItems: "center" }}>
                    Sortino Ratio
                    <InfoTip texto="Similar ao Sharpe, mas penaliza apenas a volatilidade NEGATIVA. Muitos preferem ao Sharpe porque oscilações pra cima não são 'risco'." />
                  </span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 14, fontWeight: 800,
                    color: ajustado.sortino > 1 ? CORES.verde : ajustado.sortino > 0 ? CORES.amarelo : CORES.vermelho,
                  }}>{fmtNum(ajustado.sortino)}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.6)", display: "flex", alignItems: "center" }}>
                    Calmar Ratio
                    <InfoTip texto="Retorno anualizado dividido pelo maior drawdown. Mede recuperação após quedas. Acima de 1 é excelente." />
                  </span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 14, fontWeight: 800,
                    color: ajustado.calmar > 1 ? CORES.verde : ajustado.calmar > 0 ? CORES.amarelo : CORES.vermelho,
                  }}>{fmtNum(ajustado.calmar)}</span>
                </div>
              </div>
            </div>

            <DrawdownView atual={risco.drawdownAtual} maximo={risco.drawdownMaximo} />
          </div>

          <div style={{
            background: "rgba(2,6,23,.88)",
            border: "1px solid rgba(96,165,250,.15)",
            borderRadius: RADIUS,
            padding: PADDING,
            marginBottom: 16,
          }}>
            <div style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: CORES.azul,
              textTransform: "uppercase",
              marginBottom: 14,
            }}>🌐 Relação com o IBOV</div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}>
              <Metrica
                label="CORRELAÇÃO"
                valor={fmtNum(mercado.correlacao)}
                sub={Math.abs(mercado.correlacao) > 0.7 ? "alta" : Math.abs(mercado.correlacao) > 0.4 ? "moderada" : "baixa"}
                tooltip="Quão sincronizado o ativo se move com o IBOV. 1 = idêntico, 0 = independente, -1 = oposto."
              />
              <Metrica
                label="R² (R-SQUARED)"
                valor={fmtPctSemSinal(mercado.r2, 0)}
                sub="% explicado pelo mercado"
                tooltip="Percentual da variação do ativo que é explicada pelo IBOV. Alto = movimento muito atrelado ao mercado."
              />
              <Metrica
                label="TRACKING ERROR"
                valor={fmtPctSemSinal(mercado.trackingError, 1)}
                sub="divergência anual"
                tooltip="Volatilidade da diferença entre o ativo e o IBOV. Alto = ativo se descola muito do índice."
              />
              <Metrica
                label="INFORMATION RATIO"
                valor={fmtNum(mercado.informationRatio)}
                sub={mercado.informationRatio > 0.5 ? "bom" : mercado.informationRatio > 0 ? "ok" : "fraco"}
                tooltip="Alfa dividido pelo tracking error. Mede qualidade do excesso de retorno vs índice."
              />
            </div>
          </div>

          <div style={{
            background: "rgba(2,6,23,.88)",
            border: "1px solid rgba(167,139,250,.15)",
            borderRadius: RADIUS,
            padding: PADDING,
            marginBottom: 16,
          }}>
            <div style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: CORES.roxo,
              textTransform: "uppercase",
              marginBottom: 14,
            }}>🎲 Perfil Comportamental</div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}>
              <Metrica
                label="WIN RATE"
                valor={fmtPctSemSinal(comportamento.winRate, 1)}
                sub="dias positivos"
                tooltip="Fração de dias com retorno positivo. Acima de 52% indica viés de alta consistente."
              />
              <Metrica
                label="PROFIT FACTOR"
                valor={fmtNum(comportamento.profitFactor)}
                sub={comportamento.profitFactor > 1.5 ? "ganhos > perdas" : comportamento.profitFactor > 1 ? "equilibrado" : "perdas > ganhos"}
                tooltip="Soma dos ganhos dividida pela soma das perdas. Acima de 1 = ganha mais do que perde."
              />
              <Metrica
                label="Z-SCORE PREÇO"
                valor={fmtNum(comportamento.zScore)}
                sub={comportamento.zScore > 1.5 ? "muito acima da média" : comportamento.zScore > 0 ? "acima da média" : comportamento.zScore > -1.5 ? "abaixo da média" : "muito abaixo"}
                tooltip="Quão fora da média anual o preço atual está. Acima de +2 ou abaixo de -2 indica preço extremo."
              />
              <Metrica
                label="SKEWNESS"
                valor={fmtNum(comportamento.skewness)}
                sub={comportamento.skewness > 0.3 ? "cauda direita" : comportamento.skewness < -0.3 ? "cauda esquerda" : "simétrico"}
                tooltip="Assimetria dos retornos. Positivo = mais explosões pra cima. Negativo = quedas mais bruscas que altas."
              />
            </div>
          </div>

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
              Métricas calculadas com base em 1 ano de histórico (252 pregões). Benchmark: Ibovespa. Taxa livre: média histórica da SELIC (12.4%). Indicadores quantitativos de caráter informativo, não constituem recomendação de investimento.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
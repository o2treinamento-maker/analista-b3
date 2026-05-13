// src/components/CardDividendos.jsx

"use client";

import { useEffect, useMemo, useState } from "react";

const TYPO = {
  headerTitle: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.1em",
  },
  disclaimer: {
    fontSize: 10,
    fontWeight: 400,
    lineHeight: 1.6,
  },
};

const RADIUS = 14;
const PADDING = 18;

const CORES = {
  verde: "#34d399",
  amarelo: "#fbbf24",
  laranja: "#fb923c",
  vermelho: "#f87171",
  azul: "#60a5fa",
  roxo: "#a78bfa",
};

// ---------- Helpers de cor / score ----------

function corScore(score) {
  const s = Number(score) || 0;
  if (s >= 80) return CORES.verde;
  if (s >= 60) return CORES.amarelo;
  if (s >= 40) return CORES.laranja;
  return CORES.vermelho;
}

function glowScore(score) {
  const s = Number(score) || 0;
  if (s >= 80) return "rgba(52,211,153,.35)";
  if (s >= 60) return "rgba(251,191,36,.30)";
  if (s >= 40) return "rgba(251,146,60,.28)";
  return "rgba(248,113,113,.30)";
}

function notaScore(score) {
  const s = Number(score) || 0;
  if (s >= 90) return "A+";
  if (s >= 80) return "A";
  if (s >= 70) return "B";
  if (s >= 55) return "C";
  return "D";
}

// ---------- Formatadores ----------

const fmtPct = (v) => {
  if (v == null || isNaN(v)) return "—";
  return `${(v * 100).toFixed(1)}%`;
};

const fmtPctSinal = (v) => {
  if (v == null || isNaN(v)) return "—";
  const sinal = v >= 0 ? "+" : "";
  return `${sinal}${(v * 100).toFixed(1)}%`;
};

const fmtMoeda = (v) => {
  if (v == null || isNaN(v)) return "—";
  return `R$ ${Number(v).toFixed(2).replace(".", ",")}`;
};

const fmtData = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
};

// ---------- Subcomponentes ----------

function Metrica({ label, valor, sub, cor, destaque }) {
  return (
    <div
      style={{
        background: destaque ? `${cor}08` : "rgba(255,255,255,.02)",
        border: `1px solid ${destaque ? `${cor}30` : "rgba(255,255,255,.06)"}`,
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,.4)",
          marginBottom: 7,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 20,
          fontWeight: 800,
          color: cor || "rgba(255,255,255,.9)",
          textShadow: destaque ? `0 0 14px ${cor}40` : "none",
          lineHeight: 1,
        }}
      >
        {valor}
      </div>

      {sub && (
        <div
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,.45)",
            marginTop: 5,
            lineHeight: 1.5,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function BarraScore({ label, valor, cor, desc }) {
  const v = Math.max(0, Math.min(100, Number(valor) || 0));

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.72)",
            }}
          >
            {label}
          </div>

          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,.38)",
              marginTop: 2,
            }}
          >
            {desc}
          </div>
        </div>

        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 15,
            fontWeight: 800,
            color: cor,
          }}
        >
          {v}
        </span>
      </div>

      <div
        style={{
          height: 7,
          borderRadius: 999,
          background: "rgba(255,255,255,.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${v}%`,
            height: "100%",
            borderRadius: 999,
            background: cor,
            boxShadow: `0 0 12px ${cor}`,
            transition: "width 1s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
    </div>
  );
}

// ---------- Estados visuais (loading / erro) ----------

function EstadoLoading() {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(8,15,30,.92), rgba(3,7,18,.97))",
        border: "1px solid rgba(255,255,255,.06)",
        borderRadius: RADIUS,
        padding: PADDING,
        minHeight: 320,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          color: "rgba(255,255,255,.4)",
          fontSize: 12,
        }}
      >
        CARREGANDO DIVIDENDOS...
      </span>
    </div>
  );
}

function EstadoErro({ mensagem }) {
  return (
    <div
      style={{
        background: "rgba(20,4,4,.55)",
        border: "1px solid rgba(248,113,113,.18)",
        borderRadius: RADIUS,
        padding: PADDING,
      }}
    >
      <div
        style={{
          color: CORES.vermelho,
          fontFamily: "'IBM Plex Mono',monospace",
          fontWeight: 800,
        }}
      >
        ERRO AO CARREGAR
      </div>
      <div
        style={{
          marginTop: 8,
          color: "rgba(255,255,255,.55)",
          fontSize: 13,
        }}
      >
        {mensagem}
      </div>
    </div>
  );
}

// ---------- Normalização defensiva dos dados ----------

function normalizarDados(raw) {
  if (!raw || typeof raw !== "object") return null;

  return {
    ehFII: Boolean(raw.ehFII),

    scoreDividendos: {
      final: raw.scoreDividendos?.final ?? 0,
      yield: raw.scoreDividendos?.yield ?? 0,
      crescimento: raw.scoreDividendos?.crescimento ?? 0,
      previsibilidade: raw.scoreDividendos?.previsibilidade ?? 0,
      sustentabilidade: raw.scoreDividendos?.sustentabilidade ?? 0,
    },

    metricas: {
      dy12m: raw.metricas?.dy12m ?? null,
      cagrDividendos: raw.metricas?.cagrDividendos ?? null,
      anosConsecutivos: raw.metricas?.anosConsecutivos ?? 0,
      anosPagando: raw.metricas?.anosPagando ?? 0,
      frequencia: raw.metricas?.frequencia ?? "—",
      payoutQualitativo: raw.metricas?.payoutQualitativo ?? "—",
    },

    classificacao: {
      label: raw.classificacao?.label ?? "—",
    },

    perfilRenda: {
      label: raw.perfilRenda?.label ?? "—",
      desc: raw.perfilRenda?.desc ?? "",
    },

    classificacoes: {
      yield: { label: raw.classificacoes?.yield?.label ?? "—" },
      crescimento: { label: raw.classificacoes?.crescimento?.label ?? "—" },
    },

    armadilhaDividendos: {
      risco: Boolean(raw.armadilhaDividendos?.risco),
      motivo: raw.armadilhaDividendos?.motivo ?? "",
    },

    leitura: {
      principal: raw.leitura?.principal ?? "Sem leitura disponível.",
    },

    composicao12m: {
      pctDividendo: raw.composicao12m?.pctDividendo ?? 0,
      pctJcp: raw.composicao12m?.pctJcp ?? 0,
      pctRendimento: raw.composicao12m?.pctRendimento ?? 0,
    },

    historico: Array.isArray(raw.historico) ? raw.historico : [],
    proximosPagamentos: Array.isArray(raw.proximosPagamentos)
      ? raw.proximosPagamentos
      : [],
  };
}

// ---------- Componente principal ----------

export default function CardDividendos({ ticker }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!ticker) return;

    let cancelado = false;

    setLoading(true);
    setErro(null);

    fetch(`/api/dividendos?ticker=${ticker}`)
      .then(async (r) => {
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch {
          throw new Error(text.slice(0, 180));
        }
      })
      .then((json) => {
        if (cancelado) return;
        if (json?.error) {
          setErro(json.error);
        } else {
          setDados(normalizarDados(json));
        }
      })
      .catch((e) => {
        if (!cancelado) setErro(e.message);
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [ticker]);

  // Derivados (sempre antes dos early returns para manter ordem de hooks consistente)
  const historicoUlt6 = useMemo(() => {
    if (!dados?.historico?.length) return [];
    return dados.historico.slice(-6);
  }, [dados]);

  const maxHistorico = useMemo(() => {
    if (!historicoUlt6.length) return 0.01;
    return Math.max(...historicoUlt6.map((h) => Number(h.total) || 0), 0.01);
  }, [historicoUlt6]);

  if (loading) return <EstadoLoading />;
  if (erro) return <EstadoErro mensagem={erro} />;
  if (!dados) return <EstadoErro mensagem="Dados indisponíveis." />;

  const score = dados.scoreDividendos.final;
  const corPrincipal = corScore(score);
  const glow = glowScore(score);

  const { armadilhaDividendos: armadilha, classificacao: classe, perfilRenda: perfil } =
    dados;

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(8,15,30,.92), rgba(3,7,18,.97))",
        border: `1px solid ${corPrincipal}25`,
        borderRadius: RADIUS,
        padding: PADDING,
        boxShadow: `0 0 40px ${glow}`,
        overflow: "hidden",
      }}
    >
      <style>{`
        @media (max-width: 980px) {
          .dividendos-topo { grid-template-columns: 1fr !important; }
          .dividendos-grid { grid-template-columns: 1fr !important; }
          .dividendos-scores { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* TOPO */}
      <div
        className="dividendos-topo"
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr .9fr",
          gap: 16,
          marginBottom: 18,
          alignItems: "stretch",
        }}
      >
        {/* ESQUERDA */}
        <div
          style={{
            background: "rgba(255,255,255,.02)",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>💰</span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.headerTitle,
                    color: corPrincipal,
                    textTransform: "uppercase",
                  }}
                >
                  Motor de Dividendos
                </span>
              </div>

              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 34,
                  fontWeight: 900,
                  color: "rgba(255,255,255,.96)",
                  lineHeight: 1,
                  letterSpacing: "-0.05em",
                  textShadow: `0 0 18px ${glow}`,
                }}
              >
                {notaScore(score)}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.metricLabel,
                  color: "rgba(255,255,255,.35)",
                  marginBottom: 4,
                }}
              >
                SCORE FINAL
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 28,
                  fontWeight: 900,
                  color: corPrincipal,
                }}
              >
                {score}
              </div>
            </div>
          </div>

          <div
            style={{
              color: "rgba(255,255,255,.72)",
              fontSize: 13,
              lineHeight: 1.75,
            }}
          >
            {dados.leitura.principal}
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 14,
            }}
          >
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                background: `${corPrincipal}10`,
                border: `1px solid ${corPrincipal}25`,
                color: corPrincipal,
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {classe.label}
            </div>

            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(96,165,250,.08)",
                border: "1px solid rgba(96,165,250,.22)",
                color: CORES.azul,
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 10,
                fontWeight: 800,
              }}
            >
              {perfil.label}
            </div>

            {dados.ehFII && (
              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(167,139,250,.08)",
                  border: "1px solid rgba(167,139,250,.22)",
                  color: CORES.roxo,
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                FUNDO IMOBILIÁRIO
              </div>
            )}

            {armadilha.risco && (
              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(248,113,113,.08)",
                  border: "1px solid rgba(248,113,113,.22)",
                  color: CORES.vermelho,
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 10,
                  fontWeight: 800,
                }}
              >
                RISCO DE ARMADILHA
              </div>
            )}
          </div>
        </div>

        {/* DIREITA */}
        <div
          style={{
            background: "rgba(255,255,255,.02)",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <Metrica
              label="Dividend Yield"
              valor={fmtPct(dados.metricas.dy12m)}
              sub={dados.classificacoes.yield.label}
              cor={corPrincipal}
              destaque
            />
            <Metrica
              label="CAGR"
              valor={fmtPctSinal(dados.metricas.cagrDividendos)}
              sub={dados.classificacoes.crescimento.label}
              cor={corPrincipal}
              destaque
            />
            <Metrica
              label="Previsibilidade"
              valor={`${dados.scoreDividendos.previsibilidade}`}
              sub={`${dados.metricas.anosConsecutivos} anos consecutivos`}
              cor={corScore(dados.scoreDividendos.previsibilidade)}
            />
            <Metrica
              label="Sustentabilidade"
              valor={`${dados.scoreDividendos.sustentabilidade}`}
              sub={dados.metricas.payoutQualitativo}
              cor={corScore(dados.scoreDividendos.sustentabilidade)}
            />
          </div>
        </div>
      </div>

      {/* SCORES */}
      <div
        className="dividendos-scores"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 18,
        }}
      >
        {/* ESQUERDA - barras */}
        <div
          style={{
            background: "rgba(255,255,255,.02)",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.38)",
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            Pilar quantitativo
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <BarraScore
              label="Yield"
              valor={dados.scoreDividendos.yield}
              cor={corScore(dados.scoreDividendos.yield)}
              desc="nível atual de geração de renda"
            />
            <BarraScore
              label="Crescimento"
              valor={dados.scoreDividendos.crescimento}
              cor={corScore(dados.scoreDividendos.crescimento)}
              desc="evolução histórica dos dividendos"
            />
            <BarraScore
              label="Previsibilidade"
              valor={dados.scoreDividendos.previsibilidade}
              cor={corScore(dados.scoreDividendos.previsibilidade)}
              desc="consistência ao longo do tempo"
            />
            <BarraScore
              label="Sustentabilidade"
              valor={dados.scoreDividendos.sustentabilidade}
              cor={corScore(dados.scoreDividendos.sustentabilidade)}
              desc="qualidade estrutural dos pagamentos"
            />
          </div>
        </div>

        {/* DIREITA - leitura */}
        <div
          style={{
            background: "rgba(255,255,255,.02)",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.38)",
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            Leitura estratégica
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,.025)",
                border: "1px solid rgba(255,255,255,.05)",
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 10,
                  color: "rgba(255,255,255,.35)",
                  marginBottom: 7,
                  textTransform: "uppercase",
                }}
              >
                Perfil
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,.82)",
                  fontWeight: 700,
                  marginBottom: 5,
                }}
              >
                {perfil.label}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,.45)",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {perfil.desc}
              </div>
            </div>

            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: armadilha.risco
                  ? "rgba(248,113,113,.05)"
                  : "rgba(52,211,153,.05)",
                border: armadilha.risco
                  ? "1px solid rgba(248,113,113,.15)"
                  : "1px solid rgba(52,211,153,.15)",
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 10,
                  color: "rgba(255,255,255,.35)",
                  marginBottom: 7,
                  textTransform: "uppercase",
                }}
              >
                Sustentabilidade
              </div>
              <div
                style={{
                  color: armadilha.risco ? CORES.vermelho : CORES.verde,
                  fontWeight: 700,
                  marginBottom: 5,
                }}
              >
                {armadilha.risco ? "RISCO ELEVADO" : "ESTRUTURA SAUDÁVEL"}
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,.45)",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                {armadilha.risco
                  ? armadilha.motivo
                  : "Histórico relativamente previsível de distribuição de proventos."}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <Metrica
                label="Anos Pagando"
                valor={dados.metricas.anosPagando}
                sub="histórico total"
              />
              <Metrica
                label="Frequência"
                valor={dados.metricas.frequencia}
                sub="padrão médio"
              />
            </div>
          </div>
        </div>
      </div>

      {/* HISTÓRICO */}
      <div
        style={{
          background: "rgba(2,6,23,.88)",
          border: "1px solid rgba(255,255,255,.06)",
          borderRadius: RADIUS,
          padding: PADDING,
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 14,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.38)",
              textTransform: "uppercase",
            }}
          >
            📊 Histórico anual de dividendos
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 10,
              color: "rgba(255,255,255,.35)",
            }}
          >
            últimos 6 anos
          </div>
        </div>

        {historicoUlt6.length === 0 ? (
          <div
            style={{
              color: "rgba(255,255,255,.42)",
              fontSize: 12,
              padding: "20px 0",
              textAlign: "center",
            }}
          >
            Sem histórico de dividendos disponível.
          </div>
        ) : (
          <div
            style={{
              height: 190,
              display: "flex",
              alignItems: "flex-end",
              gap: 10,
              overflow: "hidden",
            }}
          >
            {historicoUlt6.map((item, i) => {
              const total = Number(item.total) || 0;
              const h = (total / maxHistorico) * 150;
              const cor = total === 0 ? "rgba(255,255,255,.12)" : corPrincipal;

              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 10,
                      color: "rgba(255,255,255,.38)",
                      marginBottom: 6,
                    }}
                  >
                    {fmtMoeda(total)}
                  </div>

                  <div
                    style={{
                      width: "100%",
                      maxWidth: 46,
                      height: h,
                      minHeight: total > 0 ? 6 : 2,
                      borderRadius: "10px 10px 4px 4px",
                      background: cor,
                      boxShadow: total > 0 ? `0 0 18px ${glow}` : "none",
                      opacity: item.gap ? 0.35 : 1,
                      transition: "all .5s ease",
                    }}
                  />

                  <div
                    style={{
                      marginTop: 8,
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 10,
                      color: "rgba(255,255,255,.45)",
                    }}
                  >
                    {item.ano}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PRÓXIMOS + COMPOSIÇÃO */}
      <div
        className="dividendos-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 18,
        }}
      >
        {/* PRÓXIMOS */}
        <div
          style={{
            background: "rgba(255,255,255,.02)",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.38)",
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            Próximos pagamentos
          </div>

          {dados.proximosPagamentos.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,.42)", fontSize: 12 }}>
              Nenhum pagamento futuro identificado.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dados.proximosPagamentos.map((p, i) => (
                <div
                  key={i}
                  style={{
                    padding: "11px 12px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,.025)",
                    border: "1px solid rgba(255,255,255,.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontSize: 11,
                        color: corPrincipal,
                        fontWeight: 800,
                        marginBottom: 4,
                      }}
                    >
                      {p.tipo ?? "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,.45)",
                      }}
                    >
                      pagamento {fmtData(p.data)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 16,
                      fontWeight: 800,
                      color: "rgba(255,255,255,.88)",
                    }}
                  >
                    {fmtMoeda(p.valor)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* COMPOSIÇÃO */}
        <div
          style={{
            background: "rgba(255,255,255,.02)",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.38)",
              marginBottom: 14,
              textTransform: "uppercase",
            }}
          >
            Composição dos proventos
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <BarraScore
              label="Dividendos"
              valor={Math.round(dados.composicao12m.pctDividendo * 100)}
              cor={CORES.verde}
              desc="participação no total distribuído"
            />
            <BarraScore
              label="JCP"
              valor={Math.round(dados.composicao12m.pctJcp * 100)}
              cor={CORES.azul}
              desc="juros sobre capital próprio"
            />
            <BarraScore
              label="Rendimentos"
              valor={Math.round(dados.composicao12m.pctRendimento * 100)}
              cor={CORES.roxo}
              desc="rendimentos imobiliários"
            />
          </div>
        </div>
      </div>

      {/* DISCLAIMER */}
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          background: "rgba(251,191,36,.04)",
          border: "1px solid rgba(251,191,36,.10)",
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <span style={{ color: "rgba(251,191,36,.82)", fontSize: 12 }}>⚠</span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.disclaimer,
            color: "rgba(255,255,255,.48)",
          }}
        >
          Modelo quantitativo proprietário baseado em histórico de dividendos,
          previsibilidade, sustentabilidade e consistência temporal dos
          pagamentos. Não constitui recomendação de compra ou venda.
        </span>
      </div>
    </div>
  );
}
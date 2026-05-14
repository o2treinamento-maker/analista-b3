// src/components/CardDividendos.jsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// TYPO PADRONIZADO COM CARDQUANT/CARDFUNDAMENTALISTA
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
const PADDING = 18;

const CORES = {
  verde: "#34d399",
  amarelo: "#fbbf24",
  laranja: "#fb923c",
  vermelho: "#f87171",
  azul: "#60a5fa",
  roxo: "#a78bfa",
};

// ═══════════════════════════════════════════════════════════════════════════
// MEDIA QUERIES — responsividade
// ═══════════════════════════════════════════════════════════════════════════
const mediaQueries = `
  @media (max-width: 980px) {
    .div-topo { grid-template-columns: 1fr !important; }
    .div-scores { grid-template-columns: 1fr !important; }
    .div-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 600px) {
    .div-topo-direita-grid { grid-template-columns: 1fr 1fr !important; }
    .div-hero-row { flex-direction: column !important; align-items: flex-start !important; }
    .div-hero-right { text-align: left !important; width: 100% !important; }
    .div-score-num { font-size: 36px !important; }
    .div-historico { height: 160px !important; }
    .div-historico-valor { font-size: 9px !important; }
    .div-bar-max { max-width: 32px !important; }
  }
`;

// ═══════════════════════════════════════════════════════════════════════════
// Helpers de cor / score
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// Formatadores
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// Subcomponentes
// ═══════════════════════════════════════════════════════════════════════════

function Metrica({ label, valor, sub, cor, destaque, tooltip }) {
  return (
    <div
      style={{
        background: destaque ? `${cor}08` : "rgba(255,255,255,.02)",
        border: `1px solid ${destaque ? `${cor}30` : "rgba(255,255,255,.06)"}`,
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
          color: "rgba(255,255,255,.4)",
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
          color: cor || "rgba(255,255,255,.9)",
          textShadow: destaque ? `0 0 14px ${cor}40` : "none",
          lineHeight: 1,
        }}
      >
        {valor}
      </div>

      {sub && (
        <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.45)", marginTop: 5 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function BarraScore({ label, valor, cor, desc, tooltip }) {
  const v = Math.max(0, Math.min(100, Number(valor) || 0));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: "rgba(255,255,255,.72)",
            }}
          >
            <span>{label}</span>
            {tooltip && <InfoTip texto={tooltip} />}
          </div>

          <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.38)", marginTop: 2 }}>
            {desc}
          </div>
        </div>

        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 13,
            fontWeight: 800,
            color: cor,
            flexShrink: 0,
          }}
        >
          {v}
        </span>
      </div>

      <div
        style={{
          height: 6,
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
            boxShadow: `0 0 10px ${cor}`,
            transition: "width 1s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </div>
    </div>
  );
}

function EstadoLoading() {
  return (
    <div
      style={{
        background: "rgba(3,7,18,.88)",
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
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,.4)",
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
          ...TYPO.headerTitle,
        }}
      >
        ERRO AO CARREGAR
      </div>
      <div style={{ marginTop: 8, color: "rgba(255,255,255,.55)", ...TYPO.bodyText }}>
        {mensagem}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Normalização defensiva
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// EscalaNotas — mini barra horizontal mostrando D, C, B, A, A+
// ═══════════════════════════════════════════════════════════════════════════

function EscalaNotas({ score, corAtual }) {
  const notas = [
    { letra: "D", min: 0, max: 54 },
    { letra: "C", min: 55, max: 69 },
    { letra: "B", min: 70, max: 79 },
    { letra: "A", min: 80, max: 89 },
    { letra: "A+", min: 90, max: 100 },
  ];

  // Identifica qual letra está ativa baseado no score
  const ativaIndex = notas.findIndex((n) => score >= n.min && score <= n.max);

  // Calcula a posição da bolinha proporcional à FATIA da letra na barra
  // (não ao score em si, pra ficar alinhado visualmente com a letra)
  const totalLetras = notas.length;
  let posicaoBolinha = 0;

  if (ativaIndex >= 0) {
    const notaAtiva = notas[ativaIndex];
    const larguraFaixa = notaAtiva.max - notaAtiva.min;
    const progressoNaFaixa =
      larguraFaixa > 0 ? (score - notaAtiva.min) / larguraFaixa : 0.5;

    // Cada letra ocupa 1/N da barra. A bolinha fica no meio da fatia da letra,
    // ajustada pela posição relativa do score dentro da faixa.
    const inicioFatia = (ativaIndex / totalLetras) * 100;
    const tamanhoFatia = (1 / totalLetras) * 100;
    posicaoBolinha = inicioFatia + tamanhoFatia * progressoNaFaixa;
  }

  return (
    <div style={{ marginTop: 10, maxWidth: 220 }}>
      {/* Linha das letras — espaçadas igualmente */}
      <div
        style={{
          display: "flex",
          marginBottom: 5,
        }}
      >
        {notas.map((n, i) => {
          const isAtiva = i === ativaIndex;
          return (
            <span
              key={n.letra}
              style={{
                flex: 1,
                textAlign: "center",
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: isAtiva ? 11 : 9,
                fontWeight: isAtiva ? 900 : 700,
                color: isAtiva ? corAtual : "rgba(255,255,255,.25)",
                letterSpacing: "0.04em",
                transition: "all .3s ease",
                textShadow: isAtiva ? `0 0 8px ${corAtual}` : "none",
              }}
            >
              {n.letra}
            </span>
          );
        })}
      </div>

      {/* Barra de progresso com indicador */}
      <div
        style={{
          position: "relative",
          height: 3,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, #f87171 0%, #fb923c 25%, #fbbf24 50%, #34d399 75%, #34d399 100%)",
          opacity: 0.45,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${Math.max(0, Math.min(100, posicaoBolinha))}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: corAtual,
            border: "2px solid rgba(3,7,18,1)",
            boxShadow: `0 0 8px ${corAtual}`,
          }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

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
        if (json?.error) setErro(json.error);
        else setDados(normalizarDados(json));
      })
      .catch((e) => {
        if (!cancelado) setErro(e.message);
      })
      .finally(() => {
        if (!cancelado) setLoading(false);
      });

    return () => { cancelado = true; };
  }, [ticker]);

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

  const { armadilhaDividendos: armadilha, classificacao: classe, perfilRenda: perfil } = dados;

  return (
    <>
      <style>{mediaQueries}</style>

      <div
        style={{
          background: "rgba(3,7,18,.88)",
          border: `1px solid ${corPrincipal}25`,
          borderRadius: RADIUS,
          padding: PADDING,
          boxShadow: `0 0 40px ${glow}`,
          overflow: "hidden",
        }}
      >
        {/* ═══════════════════ TOPO ═══════════════════ */}
        <div
          className="div-topo"
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr .9fr",
            gap: 14,
            marginBottom: 14,
            alignItems: "stretch",
          }}
        >
          {/* ESQUERDA: nota + leitura */}
          <div
            style={{
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              className="div-hero-row"
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 15, lineHeight: 1 }}>💰</span>
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
                  <InfoTip texto="Score de 0 a 100 que avalia a qualidade do ativo como pagador de dividendos. Escala: A+ (90+), A (80-89), B (70-79), C (55-69), D (abaixo de 55). Combina yield, crescimento, previsibilidade e sustentabilidade dos pagamentos." />
                </div>

                <div
                  className="div-score-num"
                  style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.heroNumber,
                    color: "rgba(255,255,255,.96)",
                    lineHeight: 1,
                    textShadow: `0 0 18px ${glow}`,
                  }}
                >
                  {notaScore(score)}
                </div>

                <EscalaNotas score={score} corAtual={corPrincipal} />
              </div>

              <div className="div-hero-right" style={{ textAlign: "right" }}>
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
                    fontSize: 24,
                    fontWeight: 900,
                    color: corPrincipal,
                  }}
                >
                  {score}
                </div>
              </div>
            </div>

            <div style={{ ...TYPO.bodyText, color: "rgba(255,255,255,.72)" }}>
              {dados.leitura.principal}
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "5px 9px",
                  borderRadius: 999,
                  background: `${corPrincipal}10`,
                  border: `1px solid ${corPrincipal}25`,
                  color: corPrincipal,
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                }}
              >
                <span>{classe.label}</span>
                <InfoTip texto="Classifica o histórico de pagamentos da empresa. Pode ser: Aristocrata (consistente há +15 anos), Pagadora Consistente, Dividend Growth (cresce os pagamentos), Pagadora Cíclica, Pagadora Irregular ou Baixa Relevância em Dividendos." />
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "5px 9px",
                  borderRadius: 999,
                  background: "rgba(96,165,250,.08)",
                  border: "1px solid rgba(96,165,250,.22)",
                  color: CORES.azul,
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                }}
              >
                <span>{perfil.label}</span>
                <InfoTip texto="Perfil do ativo quanto à geração de renda. Renda Forte = foco em renda recorrente. Dividend Growth = cresce dividendos ao longo do tempo. Reinvestimento/Growth = reinveste lucros em vez de distribuir. Renda Moderada = equilíbrio." />
              </div>

              {dados.ehFII && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "5px 9px",
                    borderRadius: 999,
                    background: "rgba(167,139,250,.08)",
                    border: "1px solid rgba(167,139,250,.22)",
                    color: CORES.roxo,
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                  }}
                >
                  <span>FUNDO IMOBILIÁRIO</span>
                  <InfoTip texto="Fundos Imobiliários (FIIs) pagam rendimentos mensais isentos de Imposto de Renda pra pessoa física. Tem regras tributárias e operacionais diferentes das ações tradicionais." />
                </div>
              )}

              {armadilha.risco && (
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "5px 9px",
                    borderRadius: 999,
                    background: "rgba(248,113,113,.08)",
                    border: "1px solid rgba(248,113,113,.22)",
                    color: CORES.vermelho,
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                  }}
                >
                  <span>RISCO DE ARMADILHA</span>
                  <InfoTip texto="Yield muito alto pode ser uma 'armadilha de dividendos': geralmente o preço da ação caiu muito e o yield aparece artificialmente alto, mas a empresa pode estar com problemas e não conseguir manter os pagamentos no futuro." />
                </div>
              )}
            </div>
          </div>

          {/* DIREITA: 4 métricas-chave */}
          <div
            style={{
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              className="div-topo-direita-grid"
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
            >
              <Metrica
                label="Dividend Yield"
                valor={fmtPct(dados.metricas.dy12m)}
                sub={dados.classificacoes.yield.label}
                cor={corPrincipal}
                destaque
                tooltip="Mede o retorno em proventos pagos nos últimos 12 meses em relação ao preço atual da ação. Por exemplo, 5% significa que o ativo pagou R$5 em proventos para cada R$100 investidos."
              />
              <Metrica
                label="CAGR"
                valor={fmtPctSinal(dados.metricas.cagrDividendos)}
                sub={dados.classificacoes.crescimento.label}
                cor={corPrincipal}
                destaque
                tooltip="Taxa anual média de crescimento dos dividendos nos últimos anos. Mostra se a empresa vem distribuindo cada vez mais (positivo) ou cada vez menos (negativo) ao longo do tempo."
              />
              <Metrica
                label="Previsibilidade"
                valor={`${dados.scoreDividendos.previsibilidade}`}
                sub={`${dados.metricas.anosConsecutivos} anos consecutivos`}
                cor={corScore(dados.scoreDividendos.previsibilidade)}
                tooltip="Score de 0 a 100 que mede a consistência dos pagamentos. Avalia há quantos anos consecutivos a empresa paga dividendos e a regularidade dos valores ao longo do tempo."
              />
              <Metrica
                label="Sustentabilidade"
                valor={`${dados.scoreDividendos.sustentabilidade}`}
                sub={dados.metricas.payoutQualitativo}
                cor={corScore(dados.scoreDividendos.sustentabilidade)}
                tooltip="Score de 0 a 100 que mede se a empresa consegue manter o nível atual de dividendos. Considera histórico, tendência e indicadores de risco de armadilha de dividendos."
              />
            </div>
          </div>
        </div>

        {/* ═══════════════════ SCORES + LEITURA ═══════════════════ */}
        <div
          className="div-scores"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: 12,
              padding: 14,
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
              <span>Pilar quantitativo</span>
              <InfoTip texto="Os 4 pilares que compõem o score final. Cada um avalia um aspecto da qualidade dos dividendos da empresa. A combinação dos 4 gera a nota final." />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <BarraScore
                label="Yield"
                valor={dados.scoreDividendos.yield}
                cor={corScore(dados.scoreDividendos.yield)}
                desc="nível atual de geração de renda"
                tooltip="Avalia o nível atual de geração de renda em dividendos. Quanto maior o yield em relação ao preço da ação, melhor a nota nesse pilar."
              />
              <BarraScore
                label="Crescimento"
                valor={dados.scoreDividendos.crescimento}
                cor={corScore(dados.scoreDividendos.crescimento)}
                desc="evolução histórica dos dividendos"
                tooltip="Avalia a evolução histórica dos dividendos. Quanto mais a empresa vem aumentando os pagamentos ao longo dos anos, melhor a nota nesse pilar."
              />
              <BarraScore
                label="Previsibilidade"
                valor={dados.scoreDividendos.previsibilidade}
                cor={corScore(dados.scoreDividendos.previsibilidade)}
                desc="consistência ao longo do tempo"
                tooltip="Avalia o quanto os dividendos são consistentes e previsíveis. Empresas que pagam regularmente todo ano, sem grandes oscilações, ganham notas mais altas."
              />
              <BarraScore
                label="Sustentabilidade"
                valor={dados.scoreDividendos.sustentabilidade}
                cor={corScore(dados.scoreDividendos.sustentabilidade)}
                desc="qualidade estrutural dos pagamentos"
                tooltip="Avalia se a empresa consegue manter o atual nível de dividendos. Considera o histórico, a tendência e indicadores de risco de armadilha."
              />
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: 12,
              padding: 14,
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
              <span>Leitura estratégica</span>
              <InfoTip texto="Análise qualitativa do perfil do ativo como pagador de dividendos, incluindo características estruturais e riscos identificados." />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,.025)",
                  border: "1px solid rgba(255,255,255,.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.metricLabel,
                    color: "rgba(255,255,255,.35)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  <span>Perfil</span>
                  <InfoTip texto="Classificação do ativo quanto ao seu perfil como pagador. Indica se é mais voltado pra geração de renda recorrente, crescimento dos dividendos ou equilíbrio entre os dois." />
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,.82)",
                    fontWeight: 700,
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  {perfil.label}
                </div>
                <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.5)" }}>
                  {perfil.desc}
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
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
                    display: "flex",
                    alignItems: "center",
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.metricLabel,
                    color: "rgba(255,255,255,.35)",
                    marginBottom: 6,
                    textTransform: "uppercase",
                  }}
                >
                  <span>Sustentabilidade</span>
                  <InfoTip texto="Análise se a estrutura atual de pagamentos é saudável ou se há sinais de armadilha de dividendos (yield artificialmente alto por queda no preço da ação, sem capacidade real de manter os pagamentos)." />
                </div>
                <div
                  style={{
                    color: armadilha.risco ? CORES.vermelho : CORES.verde,
                    fontWeight: 700,
                    fontSize: 13,
                    marginBottom: 4,
                  }}
                >
                  {armadilha.risco ? "RISCO ELEVADO" : "ESTRUTURA SAUDÁVEL"}
                </div>
                <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.5)" }}>
                  {armadilha.risco
                    ? armadilha.motivo
                    : "Histórico relativamente previsível de distribuição de proventos."}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Metrica
                  label="Anos Pagando"
                  valor={dados.metricas.anosPagando}
                  sub="histórico total"
                  tooltip="Quantidade total de anos em que a empresa distribuiu proventos (dividendos, JCP ou rendimentos)."
                />
                <Metrica
                  label="Frequência"
                  valor={dados.metricas.frequencia}
                  sub="padrão médio"
                  tooltip="Padrão médio de pagamentos por ano: mensal (típico em FIIs), trimestral, semestral ou anual."
                />
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════ HISTÓRICO ═══════════════════ */}
        <div
          style={{
            background: "rgba(2,6,23,.88)",
            border: "1px solid rgba(255,255,255,.06)",
            borderRadius: RADIUS,
            padding: PADDING,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.metricLabel,
                color: "rgba(255,255,255,.38)",
                textTransform: "uppercase",
              }}
            >
              <span>📊 Histórico anual de dividendos</span>
              <InfoTip texto="Total pago em proventos por ano nos últimos 6 anos. Barras mais altas indicam anos com mais dividendos pagos. Barras transparentes indicam anos em que a empresa não pagou nada." />
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 9,
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
                ...TYPO.metricSub,
                padding: "20px 0",
                textAlign: "center",
              }}
            >
              Sem histórico de dividendos disponível.
            </div>
          ) : (
            <div
              className="div-historico"
              style={{
                height: 180,
                display: "flex",
                alignItems: "flex-end",
                gap: 8,
                overflow: "hidden",
              }}
            >
              {historicoUlt6.map((item, i) => {
                const total = Number(item.total) || 0;
                const h = (total / maxHistorico) * 140;
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
                      minWidth: 0,
                    }}
                  >
                    <div
                      className="div-historico-valor"
                      style={{
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontSize: 10,
                        color: "rgba(255,255,255,.38)",
                        marginBottom: 5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {fmtMoeda(total)}
                    </div>

                    <div
                      className="div-bar-max"
                      style={{
                        width: "100%",
                        maxWidth: 42,
                        height: h,
                        minHeight: total > 0 ? 5 : 2,
                        borderRadius: "8px 8px 3px 3px",
                        background: cor,
                        boxShadow: total > 0 ? `0 0 16px ${glow}` : "none",
                        opacity: item.gap ? 0.35 : 1,
                        transition: "all .5s ease",
                      }}
                    />

                    <div
                      style={{
                        marginTop: 7,
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontSize: 9,
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

        {/* ═══════════════════ PRÓXIMOS + COMPOSIÇÃO ═══════════════════ */}
        <div
          className="div-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 14,
          }}
        >
          {/* PRÓXIMOS */}
          <div
            style={{
              background: "rgba(255,255,255,.02)",
              border: "1px solid rgba(255,255,255,.06)",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.metricLabel,
                color: "rgba(255,255,255,.38)",
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              <span>Próximos pagamentos</span>
              <InfoTip texto="Pagamentos já anunciados e aprovados pela empresa que ainda vão acontecer. A data mostrada é a do pagamento (quando o dinheiro cai na sua conta). Pra receber, você precisa estar com a ação antes da data 'com'." />
            </div>

            {dados.proximosPagamentos.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,.42)", ...TYPO.metricSub }}>
                Nenhum pagamento futuro identificado.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dados.proximosPagamentos.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "9px 11px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,.025)",
                      border: "1px solid rgba(255,255,255,.05)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontFamily: "'IBM Plex Mono',monospace",
                          fontSize: 10,
                          color: corPrincipal,
                          fontWeight: 800,
                          marginBottom: 3,
                          letterSpacing: "0.06em",
                        }}
                      >
                        {p.tipo ?? "—"}
                      </div>
                      <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.45)" }}>
                        pagamento {fmtData(p.data)}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontSize: 13,
                        fontWeight: 800,
                        color: "rgba(255,255,255,.88)",
                        flexShrink: 0,
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
              padding: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.metricLabel,
                color: "rgba(255,255,255,.38)",
                marginBottom: 12,
                textTransform: "uppercase",
              }}
            >
              <span>Composição dos proventos</span>
              <InfoTip texto="Como os pagamentos dos últimos 12 meses foram divididos entre os 3 tipos: Dividendos puros, JCP (juros sobre capital próprio) e Rendimentos (típicos de FIIs). Cada tipo tem regras tributárias diferentes." />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <BarraScore
                label="Dividendos"
                valor={Math.round(dados.composicao12m.pctDividendo * 100)}
                cor={CORES.verde}
                desc="participação no total distribuído"
                tooltip="Pagamentos clássicos de empresas brasileiras. São isentos de Imposto de Renda pra pessoa física, então o valor que aparece é o que de fato cai na sua conta."
              />
              <BarraScore
                label="JCP"
                valor={Math.round(dados.composicao12m.pctJcp * 100)}
                cor={CORES.azul}
                desc="juros sobre capital próprio"
                tooltip="Juros sobre Capital Próprio. Forma alternativa de remunerar acionistas, com tributação de 15% retida na fonte (é descontada antes do dinheiro chegar). A empresa costuma preferir esse formato porque o valor pago é dedutível dos impostos dela."
              />
              <BarraScore
                label="Rendimentos"
                valor={Math.round(dados.composicao12m.pctRendimento * 100)}
                cor={CORES.roxo}
                desc="rendimentos imobiliários"
                tooltip="Tipo de provento pago por Fundos Imobiliários (FIIs). São pagamentos mensais e isentos de Imposto de Renda pra pessoa física, desde que respeitadas as regras de quantidade de cotistas do fundo."
              />
            </div>
          </div>
        </div>

        {/* ═══════════════════ DISCLAIMER ═══════════════════ */}
        <div
          style={{
            padding: "9px 11px",
            borderRadius: 9,
            background: "rgba(251,191,36,.04)",
            border: "1px solid rgba(251,191,36,.10)",
            display: "flex",
            alignItems: "flex-start",
            gap: 7,
          }}
        >
          <span style={{ color: "rgba(251,191,36,.82)", fontSize: 12, flexShrink: 0 }}>⚠</span>
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
    </>
  );
}
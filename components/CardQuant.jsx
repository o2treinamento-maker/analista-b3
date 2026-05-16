// src/components/CardQuant.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CARD QUANT — Análise quantitativa premium
// Beta, Alfa, Sharpe, Drawdown, VaR, Eficiência Quantor e métricas de mercado
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ErroCard from "@/components/ErroCard";

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

const CORES = {
  verde: "#34d399",
  amarelo: "#fbbf24",
  laranja: "#fb923c",
  vermelho: "#f87171",
  azul: "#60a5fa",
  roxo: "#a78bfa",
};

const GLOWS = {
  verde: "rgba(52,211,153,.45)",
  amarelo: "rgba(251,191,36,.40)",
  laranja: "rgba(251,146,60,.40)",
  vermelho: "rgba(248,113,113,.40)",
  azul: "rgba(96,165,250,.40)",
  roxo: "rgba(167,139,250,.40)",
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

function textoScore(score) {
  if (score >= 85) return "perfil quantitativo excelente";
  if (score >= 75) return "perfil quantitativo forte";
  if (score >= 60) return "perfil quantitativo equilibrado";
  if (score >= 45) return "perfil quantitativo moderado";
  return "perfil quantitativo fraco";
}

// Texto curto pra pílula de destaque ao lado da nota (reflete a cor da nota)
function textoPilulaPerfil(score) {
  if (score >= 75) return "PERFIL QUANTITATIVO FORTE";
  if (score >= 60) return "PERFIL EQUILIBRADO";
  if (score >= 45) return "PERFIL MODERADO";
  return "DESEMPENHO INSUFICIENTE";
}

function textoSensibilidade(label) {
  if (!label) return "—";

  return label
    .replace("baixa sensibilidade", "baixa")
    .replace("sensibilidade neutra", "neutra")
    .replace("alta sensibilidade", "alta")
    .replace("sensibilidade muito alta", "muito alta")
    .toUpperCase();
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

function corRetorno(v) {
  if (v == null || isNaN(v)) return "rgba(255,255,255,.5)";
  return v >= 0 ? CORES.verde : CORES.vermelho;
}

// ─── TOOLTIP ──────────────────────────────────────────────────────────────

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
          onClick={(e) => {
            e.stopPropagation();
            setAberto((p) => !p);
          }}
          onMouseEnter={() => setAberto(true)}
          onMouseLeave={() => setAberto(false)}
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            cursor: "help",
            color: "rgba(255,255,255,.55)",
            border: "1px solid rgba(255,255,255,.18)",
            marginLeft: 6,
            userSelect: "none",
            background: aberto ? "rgba(255,255,255,.06)" : "transparent",
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

// ─── GAUGE EFICIÊNCIA QUANTOR ──────────────────────────────────────────────

function GaugeEficiencia({ score, nivel, texto, leitura, cor, detalhes }) {
  const corBullet = CORES[cor] || CORES.verde;
  const glowBullet = GLOWS[cor] || GLOWS.verde;

  const posicaoBullet = Math.max(
    0,
    Math.min(100, ((score + 100) / 200) * 100)
  );

  const corNumero =
    score >= 30
      ? CORES.verde
      : score >= -10
      ? CORES.amarelo
      : score >= -50
      ? CORES.laranja
      : CORES.vermelho;

  const sinalNumero = score > 0 ? "+" : "";

  const miniBoxStyle = {
    padding: "10px 10px",
    borderRadius: 9,
    background: "rgba(255,255,255,.025)",
    border: "1px solid rgba(255,255,255,.065)",
  };

  const miniLabelStyle = {
    display: "flex",
    alignItems: "center",
    fontFamily: "'IBM Plex Mono',monospace",
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: "0.08em",
    color: "rgba(255,255,255,.38)",
    marginBottom: 5,
  };

  const miniValueStyle = {
    display: "block",
    fontFamily: "'IBM Plex Mono',monospace",
    fontSize: 11,
    fontWeight: 900,
    color: corBullet,
  };

  return (
    <div
      style={{
        background: "rgba(2,6,23,.92)",
        border: `1px solid ${corBullet}25`,
        borderRadius: RADIUS,
        padding: PADDING,
        boxShadow: `0 0 32px ${glowBullet}15, inset 0 1px 0 rgba(255,255,255,.04)`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metricLabel,
              color: corBullet,
              textTransform: "uppercase",
            }}
          >
            <span>Eficiência Quantor</span>
            <InfoTip texto="Score proprietário de -100 a +100 que combina desempenho recente (6 e 12 meses) com retorno ajustado ao risco. Valores positivos indicam que o ativo entregou mais retorno por unidade de risco que a média. Negativos indicam o contrário." />
          </div>

          <div
            style={{
              ...TYPO.metricSub,
              color: "rgba(255,255,255,.45)",
              marginTop: 5,
            }}
          >
            {detalhes?.metodologia ||
              "Combina desempenho recente e retorno ajustado ao risco."}
          </div>
        </div>

        <div
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 42,
            fontWeight: 900,
            color: corNumero,
            textShadow: `0 0 24px ${glowBullet}`,
            lineHeight: 1,
            letterSpacing: "-0.05em",
          }}
        >
          {sinalNumero}
          {score}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          height: 10,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, rgba(248,113,113,.62), rgba(251,191,36,.58), rgba(52,211,153,.62))",
          overflow: "visible",
          marginBottom: 8,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${posicaoBullet}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            border: `3px solid ${corBullet}`,
            boxShadow: `0 0 16px ${corBullet}, 0 0 0 2px rgba(3,7,18,.95)`,
            zIndex: 2,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "-3px",
            bottom: "-3px",
            width: 1,
            background: "rgba(255,255,255,.2)",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 9,
          color: "rgba(255,255,255,.32)",
          letterSpacing: "0.06em",
          marginBottom: 14,
        }}
      >
        <span>-100</span>
        <span>0</span>
        <span>+100</span>
      </div>

      <div
        style={{
          padding: "11px 12px",
          borderRadius: 10,
          background: `${corBullet}08`,
          border: `1px solid ${corBullet}20`,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: leitura ? 8 : 0,
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 11,
              fontWeight: 900,
              color: corBullet,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "4px 9px",
              borderRadius: 6,
              background: `${corBullet}15`,
            }}
          >
            {nivel}
          </span>

          <span
            style={{
              ...TYPO.metricSub,
              fontSize: 12,
              color: "rgba(255,255,255,.75)",
              flex: 1,
              minWidth: 0,
            }}
          >
            {texto}
          </span>
        </div>

        {leitura && (
          <div
            style={{
              ...TYPO.metricSub,
              color: "rgba(255,255,255,.55)",
              lineHeight: 1.55,
            }}
          >
            {leitura}
          </div>
        )}
      </div>

      <div
        className="quant-eficiencia-mini-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        <div style={miniBoxStyle}>
          <span style={miniLabelStyle}>
            <span>RISCO-RETORNO</span>
            <InfoTip texto="Avaliação geral da relação entre retorno entregue e risco assumido. Neutro = na média do mercado. Eficiente = retorno alto pra pouco risco. Ineficiente = pouco retorno pro risco assumido." />
          </span>
          <strong style={miniValueStyle}>
            {detalhes?.riscoRetorno || "—"}
          </strong>
        </div>

        <div style={miniBoxStyle}>
          <span style={miniLabelStyle}>
            <span>JANELAS</span>
            <InfoTip texto="Períodos de tempo usados pra calcular a Eficiência Quantor. Combina performance de médio (6 meses) e longo prazo (12 meses) pra equilibrar movimentos recentes com comportamento estrutural." />
          </span>
          <strong style={miniValueStyle}>
            {detalhes?.janela || "6M + 12M"}
          </strong>
        </div>

        <div style={miniBoxStyle}>
          <span style={miniLabelStyle}>
            <span>ESCALA</span>
            <InfoTip texto="Faixa de valores possíveis pro score da Eficiência Quantor. Vai de -100 (muito ineficiente) a +100 (extremamente eficiente), com 0 sendo neutro/na média do mercado." />
          </span>
          <strong style={miniValueStyle}>
            {detalhes?.escala || "-100/+100"}
          </strong>
        </div>
      </div>
    </div>
  );
}

// ─── BARRA COMPARATIVA ────────────────────────────────────────────────────

function BarraComparativa({
  label,
  ativo,
  ibov,
  formatador = fmtPct,
  corAtivo = CORES.azul,
}) {
  const ativoNum = ativo == null || isNaN(ativo) ? 0 : ativo;
  const ibovNum = ibov == null || isNaN(ibov) ? 0 : ibov;

  const maxAbs = Math.max(Math.abs(ativoNum), Math.abs(ibovNum), 0.01);
  const wAtivo = (Math.abs(ativoNum) / maxAbs) * 100;
  const wIbov = (Math.abs(ibovNum) / maxAbs) * 100;

  const corAtivoFinal = ativoNum >= 0 ? corAtivo : CORES.vermelho;
  const corIbovFinal =
    ibovNum >= 0 ? "rgba(255,255,255,.45)" : CORES.vermelho;

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,.42)",
          marginBottom: 10,
          textTransform: "uppercase",
        }}
      >
        <span>{label}</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 7,
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 10,
            fontWeight: 800,
            color: "rgba(255,255,255,.72)",
            minWidth: 52,
          }}
        >
          ATIVO
        </span>

        <div
          style={{
            flex: 1,
            height: 8,
            borderRadius: 999,
            background: "rgba(255,255,255,.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${wAtivo}%`,
              background: corAtivoFinal,
              boxShadow: `0 0 10px ${corAtivoFinal}`,
              borderRadius: 999,
            }}
          />
        </div>

        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 12,
            fontWeight: 800,
            color: corAtivoFinal,
            minWidth: 64,
            textAlign: "right",
          }}
        >
          {formatador(ativoNum)}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 10,
            fontWeight: 800,
            color: "rgba(255,255,255,.42)",
            minWidth: 52,
          }}
        >
          IBOV
        </span>

        <div
          style={{
            flex: 1,
            height: 8,
            borderRadius: 999,
            background: "rgba(255,255,255,.05)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${wIbov}%`,
              background: corIbovFinal,
              borderRadius: 999,
            }}
          />
        </div>

        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 12,
            fontWeight: 800,
            color: "rgba(255,255,255,.62)",
            minWidth: 64,
            textAlign: "right",
          }}
        >
          {formatador(ibovNum)}
        </span>
      </div>
    </div>
  );
}

// ─── MÉTRICA COMPACTA ─────────────────────────────────────────────────────

function Metrica({ label, valor, sub, cor, tooltip, destaque }) {
  return (
    <div
      style={{
        background: destaque ? `${cor}08` : "rgba(255,255,255,.025)",
        border: `1px solid ${
          destaque ? `${cor}28` : "rgba(255,255,255,.065)"
        }`,
        borderRadius: 11,
        padding: "12px 14px",
        minHeight: 92,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
          color: "rgba(255,255,255,.42)",
          marginBottom: 8,
          textTransform: "uppercase",
        }}
      >
        <span>{label}</span>
        {tooltip && <InfoTip texto={tooltip} />}
      </div>

      <div
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 19,
          fontWeight: 900,
          color: cor || "rgba(255,255,255,.9)",
          textShadow: destaque ? `0 0 14px ${cor}40` : "none",
          marginBottom: sub ? 5 : 0,
          lineHeight: 1,
        }}
      >
        {valor}
      </div>

      {sub && (
        <div
          style={{
            ...TYPO.metricSub,
            color: "rgba(255,255,255,.48)",
            marginTop: 5,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function DrawdownView({ atual, maximo }) {
  const max = Math.abs(maximo);
  const pctAtual = max > 0 ? (Math.abs(atual) / max) * 100 : 0;

  return (
    <div
      style={{
        background: "rgba(20,4,4,.42)",
        border: "1px solid rgba(248,113,113,.16)",
        borderRadius: 11,
        padding: PADDING,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricLabel,
            color: "rgba(248,113,113,.75)",
            textTransform: "uppercase",
          }}
        >
          <span>Queda do topo</span>
          <InfoTip texto="Drawdown é a queda do preço atual em relação ao maior valor atingido no período. 'Atual' mostra o quanto o ativo está abaixo do topo agora. 'Pior queda' mostra a maior baixa que aconteceu no período (1 ano)." />
        </span>

        <span
          style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metricLabel,
            color: "rgba(255,255,255,.38)",
          }}
        >
          1 ANO
        </span>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.48)", marginBottom: 5 }}>
            Atual
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 22,
              fontWeight: 900,
              color: atual < -0.05 ? CORES.vermelho : atual < 0 ? CORES.amarelo : CORES.verde,
            }}
          >
            {fmtPct(atual)}
          </div>
        </div>

        <div style={{ flex: 1, textAlign: "right" }}>
          <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.48)", marginBottom: 5 }}>
            Pior queda
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 22,
              fontWeight: 900,
              color: CORES.vermelho,
            }}
          >
            {fmtPct(maximo)}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          height: 8,
          borderRadius: 999,
          background:
            "linear-gradient(90deg, rgba(52,211,153,.34), rgba(251,191,36,.34), rgba(248,113,113,.45))",
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${Math.min(pctAtual, 100)}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: "#fff",
            border: `3px solid ${CORES.vermelho}`,
            boxShadow: `0 0 12px ${CORES.vermelho}`,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 7,
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 9,
          color: "rgba(255,255,255,.32)",
        }}
      >
        <span>topo</span>
        <span>pior ponto</span>
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

  // Função extraída pra ser reutilizada pelo botão "Tentar Novamente"
  const buscarDados = useCallback(() => {
    if (!ticker) return;

    setData(null);
    setErro(null);

    fetch(`/api/quant?ticker=${encodeURIComponent(ticker)}`)
      .then(async (r) => {
        const text = await r.text();

        try {
          return JSON.parse(text);
        } catch {
          throw new Error(text.slice(0, 220));
        }
      })
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
        tituloAnalise="ANÁLISE QUANTITATIVA"
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
          background: "rgba(3,7,18,.82)",
          border: "1px solid rgba(255,255,255,.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,.45)",
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.metricLabel,
        }}
      >
        CALCULANDO MÉTRICAS QUANTITATIVAS...
      </div>
    );
  }

  const {
    scores,
    retornos,
    risco,
    ajustado,
    mercado,
    comportamento,
    classificacoes,
    leitura,
    eficiencia,
  } = data;

  const cor = corScore(scores.final);
  const betaCor = CORES[classificacoes.beta.cor] || CORES.amarelo;
  const volCor = CORES[classificacoes.volatilidade.cor] || CORES.amarelo;
  const sharpeCor = CORES[classificacoes.sharpe.cor] || CORES.amarelo;
  const alfaCor = CORES[classificacoes.alfa.cor] || CORES.amarelo;

  return (
    <>
      <style jsx global>{`
        @media (max-width: 600px) {
          .quant-top-grid {
            grid-template-columns: 1fr !important;
          }
          .quant-hero-row {
            flex-direction: column !important;
            align-items: flex-start !important;
          }
          .quant-hero-right {
            text-align: left !important;
            width: 100% !important;
          }
          .quant-score-num {
            font-size: 38px !important;
          }
          .quant-metrics-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .quant-retornos-grid {
            grid-template-columns: 1fr 1fr !important;
          }
          .quant-eficiencia-mini-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        style={{
          background: "rgba(3,7,18,.88)",
          border: `1px solid ${cor}35`,
          borderRadius: RADIUS,
          overflow: "hidden",
          boxShadow: `0 0 44px ${glowScore(scores.final)}22`,
        }}
      >
        <div
          style={{
            padding: PADDING,
            borderBottom: "1px solid rgba(255,255,255,.065)",
            background: `linear-gradient(180deg, ${cor}10, transparent)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>🧮</span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.headerTitle,
                color: cor,
                textTransform: "uppercase",
              }}
            >
              Análise Quantitativa · 1 ano
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
            Leitura baseada em retorno, risco, sensibilidade ao Ibovespa e eficiência ajustada ao risco.
          </div>
        </div>

        <div style={{ padding: PADDING }}>
          <div
            className="quant-top-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.15fr .85fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                background: "rgba(2,6,23,.92)",
                border: "1px solid rgba(255,255,255,.075)",
                borderRadius: RADIUS,
                padding: PADDING,
              }}
            >
              <div
                className="quant-hero-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 24,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                  marginBottom: 18,
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
                      textTransform: "uppercase",
                      marginBottom: 8,
                    }}
                  >
                    <span>Nota quantitativa</span>
                    <InfoTip texto="Score de 0 a 100 que combina retorno, risco, eficiência e comportamento do ativo nos últimos 12 meses. Escala: A+ (85+), A (75-84), B (60-74), C (45-59) e D (abaixo de 45). Quanto maior, melhor o desempenho ajustado ao risco." />
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                    <span
                      className="quant-score-num"
                      style={{
                        fontFamily: "'IBM Plex Mono',monospace",
                        ...TYPO.heroNumber,
                        color: cor,
                        textShadow: `0 0 24px ${glowScore(scores.final)}`,
                        lineHeight: 1,
                      }}
                    >
                      {scores.final}
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
                        color: cor,
                        fontWeight: 900,
                        padding: "4px 12px",
                        borderRadius: 999,
                        background: `${cor}14`,
                        border: `1px solid ${cor}35`,
                      }}
                    >
                      {notaScore(scores.final)}
                    </span>
                  </div>

                  <div style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.46)", marginTop: 9 }}>
                    {textoScore(scores.final)}
                  </div>
                </div>

                <div className="quant-hero-right" style={{ textAlign: "right" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "7px 12px",
                      borderRadius: 999,
                      background: `${cor}16`,
                      border: `1px solid ${cor}35`,
                      color: cor,
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
                        background: cor,
                        boxShadow: `0 0 14px ${cor}`,
                      }}
                    />
                    <span>{textoPilulaPerfil(scores.final)}</span>
                    <InfoTip texto="Resumo visual da nota quantitativa do ativo. Quanto melhor o perfil, mais sólido foi o desempenho ajustado ao risco no período analisado." />
                  </div>

                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      ...TYPO.disclaimer,
                      color: "rgba(255,255,255,.4)",
                    }}
                  >
                    BENCHMARK
                    <br />
                    <strong style={{ color: "rgba(255,255,255,.84)" }}>
                      IBOVESPA · 1 ANO
                    </strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  background: "rgba(255,255,255,.07)",
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, scores.final))}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: `linear-gradient(90deg, ${cor}, #38bdf8)`,
                    boxShadow: `0 0 18px ${cor}`,
                  }}
                />
              </div>

              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 11,
                  background: "rgba(255,255,255,.035)",
                  border: "1px solid rgba(255,255,255,.075)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.metricLabel,
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,.42)",
                    marginBottom: 8,
                  }}
                >
                  Diagnóstico quantitativo
                </div>

                <div style={{ ...TYPO.bodyText, color: "rgba(255,255,255,.8)" }}>
                  {leitura}
                </div>
              </div>
            </div>

            {eficiencia && (
              <GaugeEficiencia
                score={eficiencia.score}
                nivel={eficiencia.nivel}
                texto={eficiencia.texto}
                leitura={eficiencia.leitura}
                cor={eficiencia.cor}
                detalhes={eficiencia.detalhes}
              />
            )}
          </div>

          <div
            className="quant-metrics-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <Metrica
              label="β Beta"
              valor={fmtNum(mercado.beta)}
              sub={classificacoes.beta.desc}
              cor={betaCor}
              destaque
              tooltip="Beta mede a sensibilidade do ativo aos movimentos do Ibovespa. Beta próximo de 1 indica comportamento alinhado ao índice. Beta acima de 1 indica maior reação aos movimentos do mercado. Beta abaixo de 1 indica menor sensibilidade. Não é uma medida direta de volatilidade."
            />

            <Metrica
              label="α Alfa anual"
              valor={fmtPct(mercado.alfa)}
              sub={classificacoes.alfa.label}
              cor={alfaCor}
              destaque
              tooltip="Alfa mede o excesso de retorno em relação ao retorno esperado pelo risco assumido no modelo CAPM. Alfa positivo indica que o ativo entregou mais do que o esperado para seu beta. Alfa negativo indica desempenho abaixo do esperado."
            />

            <Metrica
              label="Sharpe"
              valor={fmtNum(ajustado.sharpe)}
              sub={classificacoes.sharpe.label}
              cor={sharpeCor}
              destaque
              tooltip="Sharpe mede quanto retorno excedente o ativo entregou por unidade de volatilidade. Quanto maior, melhor foi a eficiência entre retorno e risco. Valores acima de 1 costumam indicar boa eficiência."
            />
          </div>

          <div
            style={{
              background: "rgba(2,6,23,.88)",
              border: "1px solid rgba(255,255,255,.075)",
              borderRadius: RADIUS,
              padding: PADDING,
              marginBottom: 16,
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
                marginBottom: 14,
              }}
            >
              <span>Retornos por janela</span>
              <InfoTip texto="Mostra o quanto o ativo valorizou ou desvalorizou em diferentes períodos. Verde = ganho, vermelho = perda. Ajuda a entender se o desempenho recente é consistente ou pontual." />
            </div>

            <div
              className="quant-retornos-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
              }}
            >
              {[
                { label: "1 MÊS", v: retornos.umMes },
                { label: "3 MESES", v: retornos.tresMeses },
                { label: "6 MESES", v: retornos.seisMeses },
                { label: "1 ANO", v: retornos.ano },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "12px 10px",
                    borderRadius: 9,
                    background: "rgba(255,255,255,.025)",
                    border: "1px solid rgba(255,255,255,.06)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 9,
                      color: "rgba(255,255,255,.38)",
                      letterSpacing: "0.08em",
                      marginBottom: 6,
                    }}
                  >
                    {item.label}
                  </div>

                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 14,
                      fontWeight: 800,
                      color: corRetorno(item.v),
                    }}
                  >
                    {fmtPct(item.v)}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 18,
                paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,.06)",
              }}
            >
              <BarraComparativa
                label="Retorno 1 ano · Ativo vs Ibovespa"
                ativo={retornos.ano}
                ibov={mercado.retornoIbovAcumulado}
                corAtivo={cor}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                background: "rgba(2,6,23,.88)",
                border: "1px solid rgba(255,255,255,.075)",
                borderRadius: RADIUS,
                padding: PADDING,
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.metricLabel,
                  color: volCor,
                  textTransform: "uppercase",
                  marginBottom: 14,
                }}
              >
                Volatilidade e risco
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
                  <span style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.62)", display: "flex", alignItems: "center" }}>
                    Volatilidade anual
                    <InfoTip texto="Volatilidade anualizada mede a intensidade histórica das oscilações do ativo. É calculada a partir do desvio padrão dos retornos diários anualizado por raiz de 252 pregões." />
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, fontWeight: 900, color: volCor }}>
                    {fmtPctSemSinal(risco.volatilidadeAnual, 1)}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
                  <span style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.62)", display: "flex", alignItems: "center" }}>
                    VaR diário 95%
                    <InfoTip texto="VaR diário de 95% estima a perda diária que não deveria ser ultrapassada em 95% dos pregões, com base no histórico observado. Em eventos extremos, a perda pode ser maior." />
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, fontWeight: 900, color: CORES.vermelho }}>
                    {fmtPct(risco.var95, 2)}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
                  <span style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.62)", display: "flex", alignItems: "center" }}>
                    Sortino Ratio
                    <InfoTip texto="Sortino é parecido com o Sharpe, mas considera apenas a volatilidade negativa. Ele ajuda a avaliar se o retorno compensou especificamente os movimentos de queda." />
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 14,
                      fontWeight: 900,
                      color:
                        ajustado.sortino > 1
                          ? CORES.verde
                          : ajustado.sortino > 0
                          ? CORES.amarelo
                          : CORES.vermelho,
                    }}
                  >
                    {fmtNum(ajustado.sortino)}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14 }}>
                  <span style={{ ...TYPO.metricSub, color: "rgba(255,255,255,.62)", display: "flex", alignItems: "center" }}>
                    Calmar Ratio
                    <InfoTip texto="Calmar compara o retorno anualizado com o maior drawdown do período. Ajuda a medir se o retorno compensou a profundidade das quedas sofridas." />
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 14,
                      fontWeight: 900,
                      color:
                        ajustado.calmar > 1
                          ? CORES.verde
                          : ajustado.calmar > 0
                          ? CORES.amarelo
                          : CORES.vermelho,
                    }}
                  >
                    {fmtNum(ajustado.calmar)}
                  </span>
                </div>
              </div>
            </div>

            <DrawdownView atual={risco.drawdownAtual} maximo={risco.drawdownMaximo} />
          </div>

          <div
            style={{
              background: "rgba(2,6,23,.88)",
              border: "1px solid rgba(96,165,250,.16)",
              borderRadius: RADIUS,
              padding: PADDING,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.metricLabel,
                color: CORES.azul,
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Relação com o Ibovespa
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              <Metrica
                label="Correlação"
                valor={fmtNum(mercado.correlacao)}
                sub={
                  Math.abs(mercado.correlacao) > 0.7
                    ? "alta sincronização"
                    : Math.abs(mercado.correlacao) > 0.4
                    ? "sincronização moderada"
                    : "baixa sincronização"
                }
                tooltip="Correlação mede o quanto o ativo se move junto com o Ibovespa. Valor próximo de 1 indica movimentos muito sincronizados. Próximo de 0 indica baixa relação."
              />

              <Metrica
                label="R²"
                valor={fmtPctSemSinal(mercado.r2, 0)}
                sub="variação explicada pelo mercado"
                tooltip="R² indica quanto da variação do ativo pode ser explicada pelos movimentos do Ibovespa. Quanto maior, mais o ativo depende do comportamento do índice."
              />

              <Metrica
                label="Tracking Error"
                valor={fmtPctSemSinal(mercado.trackingError, 1)}
                sub="desvio anual vs índice"
                tooltip="Tracking Error mede o quanto o ativo se descola do Ibovespa ao longo do tempo. Quanto maior, mais diferente tende a ser o comportamento do ativo em relação ao índice."
              />

              <Metrica
                label="Information Ratio"
                valor={fmtNum(mercado.informationRatio)}
                sub={
                  mercado.informationRatio > 0.5
                    ? "excesso de retorno eficiente"
                    : mercado.informationRatio > 0
                    ? "excesso de retorno moderado"
                    : "sem eficiência contra o índice"
                }
                tooltip="Information Ratio compara o alfa gerado com o risco de se descolar do índice. Ajuda a avaliar se o excesso de retorno compensou a divergência em relação ao Ibovespa."
              />
            </div>
          </div>

          <div
            style={{
              background: "rgba(2,6,23,.88)",
              border: "1px solid rgba(167,139,250,.16)",
              borderRadius: RADIUS,
              padding: PADDING,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.metricLabel,
                color: CORES.roxo,
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Distribuição dos retornos
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: 10,
              }}
            >
              <Metrica
                label="Win Rate"
                valor={fmtPctSemSinal(comportamento.winRate, 1)}
                sub="pregões positivos"
                tooltip="Win Rate mostra a proporção de pregões em que o ativo fechou com retorno positivo. Isoladamente não mede qualidade, mas ajuda a entender a frequência de dias positivos."
              />

              <Metrica
                label="Profit Factor"
                valor={fmtNum(comportamento.profitFactor)}
                sub={
                  comportamento.profitFactor > 1.5
                    ? "ganhos superam perdas"
                    : comportamento.profitFactor > 1
                    ? "ganhos levemente maiores"
                    : "perdas superam ganhos"
                }
                tooltip="Profit Factor compara a soma dos ganhos com a soma das perdas. Acima de 1 indica que, no histórico analisado, os ganhos acumulados superaram as perdas acumuladas."
              />

              <Metrica
                label="Z-Score preço"
                valor={fmtNum(comportamento.zScore)}
                sub={
                  comportamento.zScore > 1.5
                    ? "preço bem acima da média"
                    : comportamento.zScore > 0
                    ? "preço acima da média"
                    : comportamento.zScore > -1.5
                    ? "preço abaixo da média"
                    : "preço bem abaixo da média"
                }
                tooltip="Z-Score mostra quantos desvios-padrão o preço atual está distante da média do período. Valores extremos podem indicar movimento esticado ou forte deslocamento de preço."
              />

              <Metrica
                label="Skewness"
                valor={fmtNum(comportamento.skewness)}
                sub={
                  comportamento.skewness > 0.3
                    ? "assimetria positiva"
                    : comportamento.skewness < -0.3
                    ? "assimetria negativa"
                    : "distribuição equilibrada"
                }
                tooltip="Skewness mede a assimetria dos retornos. Positivo indica maior presença de movimentos fortes para cima. Negativo indica maior presença de quedas mais bruscas."
              />
            </div>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: 9,
              background: "rgba(251,191,36,.045)",
              border: "1px solid rgba(251,191,36,.13)",
              display: "flex",
              gap: 7,
              alignItems: "flex-start",
            }}
          >
            <span style={{ color: "rgba(251,191,36,.82)", fontSize: 13, flexShrink: 0 }}>
              ⚠
            </span>

            <span
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.disclaimer,
                color: "rgba(255,255,255,.52)",
              }}
            >
              Métricas calculadas com base em 1 ano de histórico. Benchmark: Ibovespa.
              Taxa livre de risco: referência histórica da Selic. Indicadores quantitativos
              têm caráter informativo e não constituem recomendação de compra ou venda.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
// src/components/CartaoIdentidade.jsx
// ═══════════════════════════════════════════════════════════════════════════
// CARTÃO DE IDENTIDADE V2 — "Raio-X da empresa" em 6 quadradinhos coloridos
//
// Função: dar em 5 segundos uma síntese visual completa do ativo,
// pra leigos que não querem ler análise técnica.
//
// 6 DIMENSÕES: Fluxo · Quant · Fundamentos · Dividendos · Mestres · Robôs
//
// Faz 4 fetches em paralelo: /api/fluxo-carteira, /api/quant,
// /api/fundamentalista (que já inclui Mestres E Robôs), /api/dividendos.
//
// Cada quadradinho é clicável — emite evento via prop onAbrirDimensao
// pra o page.js poder rolar/abrir o card correspondente.
// ═══════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTES VISUAIS
// ─────────────────────────────────────────────────────────────────────────────

const CORES = {
  verde: "#34d399",
  amarelo: "#fbbf24",
  laranja: "#fb923c",
  vermelho: "#f87171",
  cinza: "rgba(148,163,184,0.7)",
  fundo: {
    verde: "rgba(52,211,153,0.08)",
    amarelo: "rgba(251,191,36,0.08)",
    vermelho: "rgba(248,113,113,0.08)",
    cinza: "rgba(148,163,184,0.05)",
  },
  borda: {
    verde: "rgba(52,211,153,0.25)",
    amarelo: "rgba(251,191,36,0.25)",
    vermelho: "rgba(248,113,113,0.25)",
    cinza: "rgba(148,163,184,0.18)",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS — converter dados crus de cada API em "semáforo + label curto"
// ─────────────────────────────────────────────────────────────────────────────

function avaliarFluxo(fluxoData) {
  if (!fluxoData || fluxoData.error) return { cor: "cinza", label: "—" };

  const sinalCor = fluxoData?.sinal?.cor;
  if (sinalCor === "verde") return { cor: "verde", label: "Comprador" };
  if (sinalCor === "vermelho") return { cor: "vermelho", label: "Vendedor" };
  if (sinalCor === "amarelo") return { cor: "amarelo", label: "Transição" };
  return { cor: "cinza", label: "Neutro" };
}

function avaliarQuant(quantData) {
  if (!quantData || quantData.error) return { cor: "cinza", label: "—" };

  const score =
    quantData?.scores?.final ??
    quantData?.scoreFinal ??
    quantData?.score ??
    null;

  if (score == null) return { cor: "cinza", label: "—" };

  if (score >= 75) return { cor: "verde", label: "Excelente" };
  if (score >= 55) return { cor: "amarelo", label: "Bom" };
  if (score >= 35) return { cor: "laranja", label: "Fraco" };
  return { cor: "vermelho", label: "Crítico" };
}

function avaliarFundamentos(fundData) {
  if (!fundData || fundData.error) return { cor: "cinza", label: "—" };

  const score = fundData?.scoreFinal;
  if (score == null) return { cor: "cinza", label: "—" };

  if (score >= 75) return { cor: "verde", label: "Sólidos" };
  if (score >= 55) return { cor: "amarelo", label: "Equilibrados" };
  if (score >= 35) return { cor: "laranja", label: "Pressionados" };
  return { cor: "vermelho", label: "Frágeis" };
}

function avaliarDividendos(divData) {
  if (!divData || divData.error) return { cor: "cinza", label: "—" };

  const dy12m = divData?.metricas?.dy12m;
  const armadilha = divData?.armadilhaDividendos?.risco === true;

  if (armadilha) return { cor: "vermelho", label: "Armadilha" };

  if (dy12m == null) return { cor: "cinza", label: "—" };

  const dyPct = dy12m * 100;
  if (dyPct >= 8) return { cor: "verde", label: `${dyPct.toFixed(1)}%` };
  if (dyPct >= 5) return { cor: "verde", label: `${dyPct.toFixed(1)}%` };
  if (dyPct >= 3) return { cor: "amarelo", label: `${dyPct.toFixed(1)}%` };
  if (dyPct > 0) return { cor: "laranja", label: `${dyPct.toFixed(1)}%` };
  return { cor: "cinza", label: "0%" };
}

function avaliarMestres(fundData) {
  if (!fundData || fundData.error) return { cor: "cinza", label: "—" };

  const stats = fundData?.mestresStats;
  if (!stats || !stats.total) return { cor: "cinza", label: "—" };

  const aprovados = stats.aprovados || 0;
  const parciais = stats.parciais || 0;
  const total = stats.total || 6;

  const favoraveis = aprovados + parciais * 0.5;
  const ratio = favoraveis / total;

  // Label humanizado: "1 aprova" vs "X aprovam"
  const label = aprovados === 1 ? "1 aprova" : `${aprovados} aprovam`;

  if (ratio >= 0.66) return { cor: "verde", label };
  if (ratio >= 0.4) return { cor: "amarelo", label };
  return { cor: "vermelho", label };
}

function avaliarRobos(fundData) {
  // Robôs vêm dentro de /api/fundamentalista (V9+)
  if (!fundData || fundData.error) return { cor: "cinza", label: "—" };

  const stats = fundData?.robosStats;
  if (!stats || !stats.disponiveis) return { cor: "cinza", label: "—" };

  const aprovados = stats.aprovados || 0;
  const parciais = stats.parciais || 0;
  const disponiveis = stats.disponiveis || 6;

  const favoraveis = aprovados + parciais * 0.5;
  const ratio = favoraveis / disponiveis;

  // Label humanizado: "1 aprova" vs "X aprovam"
  const label = aprovados === 1 ? "1 aprova" : `${aprovados} aprovam`;

  if (ratio >= 0.66) return { cor: "verde", label };
  if (ratio >= 0.4) return { cor: "amarelo", label };
  return { cor: "vermelho", label };
}

// ─────────────────────────────────────────────────────────────────────────────
// QUADRADINHO INDIVIDUAL
// ─────────────────────────────────────────────────────────────────────────────

function Quadradinho({ titulo, emoji, cor, label, sublabel, locked, onClick }) {
  const corPrincipal = CORES[cor] || CORES.cinza;
  const corFundo = CORES.fundo[cor] || CORES.fundo.cinza;
  const corBorda = CORES.borda[cor] || CORES.borda.cinza;

  return (
    <button
      onClick={onClick}
      disabled={locked}
      style={{
        width: "100%",
        background: locked ? "rgba(148,163,184,0.04)" : corFundo,
        border: `1px solid ${locked ? "rgba(148,163,184,0.12)" : corBorda}`,
        borderRadius: 12,
        padding: "14px 8px 12px 8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
        cursor: locked ? "not-allowed" : "pointer",
        transition: "all 180ms ease",
        minHeight: 100,
        position: "relative",
        opacity: locked ? 0.55 : 1,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => {
        if (locked) return;
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = `0 6px 18px ${corPrincipal}12`;
        e.currentTarget.style.borderColor = corPrincipal + "55";
      }}
      onMouseLeave={(e) => {
        if (locked) return;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.borderColor = corBorda;
      }}
    >
      {locked && (
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            fontSize: 11,
            opacity: 0.6,
          }}
        >
          🔒
        </div>
      )}

      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: locked ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.7)",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
          width: "100%",
        }}
      >
        <span style={{ fontSize: 12, flexShrink: 0 }}>{emoji}</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{titulo}</span>
      </div>

      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: corPrincipal,
          boxShadow: locked ? "none" : `0 0 16px ${corPrincipal}66`,
          opacity: cor === "cinza" ? 0.45 : 1,
        }}
      />

      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          fontWeight: 800,
          color: locked ? "rgba(255,255,255,0.35)" : corPrincipal,
          textAlign: "center",
          lineHeight: 1.2,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </div>

      {sublabel && (
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.35)",
            textAlign: "center",
            marginTop: -3,
          }}
        >
          {sublabel}
        </div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON DE LOADING
// ─────────────────────────────────────────────────────────────────────────────

function SkeletonQuadradinho() {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 12,
        padding: "14px 10px",
        minHeight: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 6,
      }}
    >
      <div
        style={{
          width: "60%",
          height: 8,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 4,
          animation: "pulseSkeleton 1.4s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          animation: "pulseSkeleton 1.4s ease-in-out infinite",
        }}
      />
      <div
        style={{
          width: "70%",
          height: 8,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 4,
          animation: "pulseSkeleton 1.4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

export default function CartaoIdentidade({
  ticker,
  logado = false,
  onAbrirDimensao = () => {},
}) {
  const [dados, setDados] = useState({
    fluxo: null,
    quant: null,
    fundamentalista: null,
    dividendos: null,
  });
  const [carregando, setCarregando] = useState(true);
  const [sobreEmpresa, setSobreEmpresa] = useState({
    nome: "",
    setor: "—",
    marketCap: null,
  });

  const fetchTudo = useCallback(async () => {
    if (!ticker) return;

    setCarregando(true);

    const fetchSeguro = async (url) => {
      try {
        const r = await fetch(url);
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch {
          return { error: "parse" };
        }
      } catch (e) {
        return { error: e.message };
      }
    };

    const [fluxo, quant, fundamentalista, dividendos] = await Promise.all([
      fetchSeguro(`/api/fluxo-carteira?ticker=${encodeURIComponent(ticker)}`),
      fetchSeguro(`/api/quant?ticker=${encodeURIComponent(ticker)}`),
      fetchSeguro(`/api/fundamentalista?ticker=${encodeURIComponent(ticker)}`),
      fetchSeguro(`/api/dividendos?ticker=${encodeURIComponent(ticker)}`),
    ]);

    setDados({ fluxo, quant, fundamentalista, dividendos });

    if (fundamentalista && !fundamentalista.error) {
      setSobreEmpresa({
        nome: fundamentalista.empresa || "",
        setor: fundamentalista.setor || fundamentalista.industria || "—",
        marketCap: fundamentalista?.metrics?.marketCap || null,
      });
    }

    setCarregando(false);
  }, [ticker]);

  useEffect(() => {
    fetchTudo();
  }, [fetchTudo]);

  // ─── Avalia cada dimensão (6 dimensões agora) ───────────────────────────
  const dimensoes = [
    {
      id: "fluxo",
      titulo: "Fluxo",
      emoji: "📡",
      ...avaliarFluxo(dados.fluxo),
      locked: false,
    },
    {
      id: "quant",
      titulo: "Quant",
      emoji: "📊",
      ...avaliarQuant(dados.quant),
      locked: !logado,
    },
    {
      id: "fundamentalista",
      titulo: "Fundamentos",
      emoji: "💎",
      ...avaliarFundamentos(dados.fundamentalista),
      locked: false,
    },
    {
      id: "dividendos",
      titulo: "Dividendos",
      emoji: "💰",
      ...avaliarDividendos(dados.dividendos),
      locked: !logado,
    },
    {
      id: "mestres",
      titulo: "Mestres",
      emoji: "🎓",
      ...avaliarMestres(dados.fundamentalista),
      locked: !logado,
    },
    {
      id: "robos",
      titulo: "Robôs",
      emoji: "🤖",
      ...avaliarRobos(dados.fundamentalista),
      locked: !logado,
    },
  ];

  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(8,15,30,0.92), rgba(3,7,18,0.97))",
        border: "1px solid rgba(96,165,250,0.18)",
        borderRadius: 14,
        padding: 18,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.035), 0 0 36px rgba(96,165,250,0.04)",
        maxWidth: 880,
        margin: "0 auto",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        @keyframes pulseSkeleton {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        @keyframes fadeInQuadradinho {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .cartao-grid-wrapper {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .cartao-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          width: 100%;
        }

        .cartao-grid > * {
          min-width: 0;
          width: 100%;
          overflow: hidden;
        }

        .cartao-grid > * > button {
          width: 100% !important;
          max-width: 100%;
          overflow: hidden;
        }

        @media (max-width: 720px) {
          .cartao-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (max-width: 420px) {
          .cartao-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        .cartao-quad {
          animation: fadeInQuadradinho 380ms ease forwards;
          opacity: 0;
        }
        .cartao-quad:nth-child(1) { animation-delay: 0ms; }
        .cartao-quad:nth-child(2) { animation-delay: 70ms; }
        .cartao-quad:nth-child(3) { animation-delay: 140ms; }
        .cartao-quad:nth-child(4) { animation-delay: 210ms; }
        .cartao-quad:nth-child(5) { animation-delay: 280ms; }
        .cartao-quad:nth-child(6) { animation-delay: 350ms; }
      `}</style>

      {/* HEADER */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 16 }}>🪪</span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              color: "rgba(96,165,250,0.9)",
              textTransform: "uppercase",
            }}
          >
            Raio-X da Empresa
          </span>
        </div>

        {sobreEmpresa.nome && (
          <div
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.55,
              marginBottom: 4,
            }}
          >
            <strong style={{ color: "rgba(255,255,255,0.85)" }}>
              {sobreEmpresa.nome}
            </strong>
            {sobreEmpresa.setor !== "—" && (
              <>
                {" "}— setor de{" "}
                <span style={{ color: "rgba(255,255,255,0.7)" }}>
                  {sobreEmpresa.setor}
                </span>
              </>
            )}
            {sobreEmpresa.marketCap != null && (
              <>
                {" · "}
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  Market Cap R$ {sobreEmpresa.marketCap.toFixed(1)} bi
                </span>
              </>
            )}
          </div>
        )}

        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10,
            color: "rgba(255,255,255,0.38)",
            letterSpacing: "0.06em",
          }}
        >
          {carregando
            ? "ANALISANDO 6 DIMENSÕES..."
            : "TOQUE EM QUALQUER DIMENSÃO PRA APROFUNDAR"}
        </div>
      </div>

      {/* GRID DE QUADRADINHOS */}
      <div className="cartao-grid-wrapper">
        <div className="cartao-grid">
          {carregando
            ? [0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="cartao-quad">
                  <SkeletonQuadradinho />
                </div>
              ))
            : dimensoes.map((dim) => (
                <div key={dim.id} className="cartao-quad">
                  <Quadradinho
                    titulo={dim.titulo}
                    emoji={dim.emoji}
                    cor={dim.cor}
                    label={dim.label}
                    locked={dim.locked}
                    onClick={() => {
                      if (dim.locked) return;
                      onAbrirDimensao(dim.id);
                    }}
                  />
                </div>
              ))}
        </div>
      </div>

      {/* DICA EDUCACIONAL */}
      {!carregando && !logado && (
        <div
          style={{
            marginTop: 12,
            padding: "9px 12px",
            background: "rgba(96,165,250,0.04)",
            border: "1px solid rgba(96,165,250,0.14)",
            borderRadius: 8,
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 12, flexShrink: 0 }}>🔒</span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.5,
              letterSpacing: "0.02em",
            }}
          >
            Dimensões bloqueadas estão disponíveis na{" "}
            <strong style={{ color: "rgba(96,165,250,0.9)" }}>
              conta grátis
            </strong>
            . Cadastre-se em 30s pra desbloquear Quant, Dividendos, Mestres e Robôs.
          </span>
        </div>
      )}
    </div>
  );
}
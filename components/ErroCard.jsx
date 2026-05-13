// components/ErroCard.jsx
"use client";

import { traduzirErro } from "@/lib/erros";

const RADIUS = 14;
const PADDING = 20;

export default function ErroCard({ tituloAnalise, erro, onTentarNovamente }) {
  const { titulo, mensagem, acao, icone } = traduzirErro(erro);

  return (
    <div style={{
      background: "rgba(20, 16, 4, 0.4)",
      border: "1px solid rgba(251,191,36,0.18)",
      borderRadius: RADIUS,
      padding: PADDING,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.1em",
          color: "rgba(251,191,36,0.7)",
          textTransform: "uppercase",
        }}>
          {tituloAnalise || "ANÁLISE INDISPONÍVEL"}
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(251,191,36,0.1)" }} />
      </div>

      {/* Conteúdo central */}
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 40, marginBottom: 14, opacity: 0.85 }}>{icone}</div>

        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 16,
          fontWeight: 600,
          color: "rgba(255,255,255,0.92)",
          marginBottom: 10,
        }}>
          {titulo}
        </div>

        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 13,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.55,
          maxWidth: 400,
          margin: "0 auto 22px",
        }}>
          {mensagem}
        </div>

        {acao === "tentar_novamente" && onTentarNovamente && (
          <button
            onClick={onTentarNovamente}
            style={{
              padding: "10px 22px",
              background: "rgba(52,211,153,0.08)",
              border: "1px solid rgba(52,211,153,0.3)",
              borderRadius: 8,
              color: "#34d399",
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              cursor: "pointer",
              transition: "all 0.15s",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(52,211,153,0.15)";
              e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(52,211,153,0.08)";
              e.currentTarget.style.borderColor = "rgba(52,211,153,0.3)";
            }}
          >
            <span style={{ fontSize: 13 }}>↻</span>
            TENTAR NOVAMENTE
          </button>
        )}

        {acao === "tentar_outro" && (
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.05em",
          }}>
            TENTE OUTRO ATIVO NO CAMPO DE BUSCA
          </div>
        )}

        {acao === "verificar" && (
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.05em",
          }}>
            EXEMPLOS VÁLIDOS: PETR4 · VALE3 · ITUB4
          </div>
        )}
      </div>
    </div>
  );
}
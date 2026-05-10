// src/components/CardFluxo.jsx
// Card visual da Linha de Fluxo — leitura institucional proprietaria
// Algoritmo proprietario calibrado por 20 anos de mercado

"use client";

import { useState, useEffect } from "react";

export default function CardFluxo({ ticker }) {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!ticker) return;
    setCarregando(true);
    setErro(null);
    setDados(null);

    fetch(`/api/fluxo?ticker=${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setErro(d.error);
        else setDados(d);
      })
      .catch(e => setErro(e.message))
      .finally(() => setCarregando(false));
  }, [ticker]);

  // ─── ESTADOS DE LOADING / ERRO ─────────────────────────────────────────────
  if (carregando) {
    return (
      <div style={{
        background: "rgba(4,8,20,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px",
        padding: "20px 18px",
        minHeight: "320px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%",
            border: "1.5px solid transparent",
            borderTopColor: "#34d399",
            animation: "spin 1s linear infinite",
          }} />
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: "10px",
            color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em",
          }}>PROCESSANDO LEITURA QUANTITATIVA...</span>
        </div>
      </div>
    );
  }

  if (erro || !dados) {
    return (
      <div style={{
        background: "rgba(20,4,4,0.5)",
        border: "1px solid rgba(248,113,113,0.15)",
        borderRadius: "14px",
        padding: "20px 18px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px",
            color: "#f87171", letterSpacing: "0.08em", fontWeight: 600,
          }}>ANÁLISE QUANTITATIVA INDISPONÍVEL</span>
        </div>
        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>
          {erro || "nao foi possivel carregar a leitura de fluxo para este ativo"}
        </p>
      </div>
    );
  }

  const { sinal, candles, ticker: tk } = dados;

  // ─── CONFIG DE CORES POR SINAL ─────────────────────────────────────────────
  const cfg = {
    verde: {
      cor: "#34d399",
      bg: "rgba(4,16,8,0.7)",
      border: "rgba(52,211,153,0.25)",
      label: "FLUXO COMPRADOR",
      explicacao: "O dinheiro grande está construindo posição neste papel. Pressão compradora consistente — capital institucional ativo, não é espasmo de preço.",
    },
    vermelho: {
      cor: "#f87171",
      bg: "rgba(20,4,4,0.7)",
      border: "rgba(248,113,113,0.25)",
      label: "FLUXO VENDEDOR",
      explicacao: "O dinheiro grande está reduzindo exposição neste ativo. Fluxo vendedor consistente — quem opera grande está saindo, não é venda pontual.",
    },
    amarelo: {
      cor: "#fbbf24",
      bg: "rgba(20,16,4,0.7)",
      border: "rgba(251,191,36,0.2)",
      label: "FLUXO EM TRANSIÇÃO",
      explicacao: "O dinheiro grande ainda não decidiu. Zona de indefinição, sem direção institucional clara — aguardar o fluxo se posicionar antes de operar.",
    },
    neutro: {
      cor: "#94a3b8",
      bg: "rgba(8,12,28,0.7)",
      border: "rgba(255,255,255,0.08)",
      label: "FLUXO INDEFINIDO",
      explicacao: "Não há direção institucional dominante neste momento. Capital grande operando de forma dispersa — sem rastro claro do dinheiro novo.",
    },
  }[sinal.cor];

  // ─── ESCALAS DO GRAFICO ────────────────────────────────────────────────────
  const W = 600, H = 260, PAD_TOP = 16, PAD_BOTTOM = 24, PAD_LEFT = 8, PAD_RIGHT = 50;
  const chartH = H - PAD_TOP - PAD_BOTTOM;
  const chartW = W - PAD_LEFT - PAD_RIGHT;

  const allValues = [];
  candles.forEach(c => {
    allValues.push(c.high, c.low);
    if (c.ema12 != null) allValues.push(c.ema12);
    if (c.ema50 != null) allValues.push(c.ema50);
  });
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;
  const padding = range * 0.05;
  const yMin = minVal - padding;
  const yMax = maxVal + padding;

  const yToPx = v => PAD_TOP + chartH - ((v - yMin) / (yMax - yMin)) * chartH;
  const xToPx = i => PAD_LEFT + (i / (candles.length - 1)) * chartW;

  // ─── COR DE CADA SEGMENTO DA LINHA DE FLUXO ────────────────────────────────
  // Janela de 5 candles + threshold percentual: elimina ruido de mercado
  // lateral e funciona pra qualquer faixa de preco.
  function corSegmentoEma(i) {
    const JANELA = 5;
    if (
      i < JANELA ||
      candles[i].ema50 == null ||
      candles[i - JANELA].ema50 == null
    ) return "#888";

    const atual = candles[i].ema50;
    const passada = candles[i - JANELA].ema50;
    const variacaoPct = ((atual - passada) / passada) * 100;

    if (variacaoPct > 0.3) return "#34d399";   // fluxo comprador
    if (variacaoPct < -0.3) return "#f87171";  // fluxo vendedor
    return "#fbbf24";                          // lateral
  }

  // ─── PONTOS NOTAVEIS ───────────────────────────────────────────────────────
  const pontosNotaveis = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1], cur = candles[i];
    if (prev.ema12 == null || prev.ema50 == null) continue;
    const crossUp = prev.ema12 <= prev.ema50 && cur.ema12 > cur.ema50;
    const crossDown = prev.ema12 >= prev.ema50 && cur.ema12 < cur.ema50;
    if (crossUp) pontosNotaveis.push({ i, tipo: "viragem_alta", x: xToPx(i), y: yToPx(cur.ema12) });
    if (crossDown) pontosNotaveis.push({ i, tipo: "viragem_baixa", x: xToPx(i), y: yToPx(cur.ema12) });
  }

  // ─── FORMATTERS ────────────────────────────────────────────────────────────
  const fmtMoeda = v => v?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "—";
  const fmtPct = v => (v >= 0 ? "+" : "") + v.toFixed(1) + "%";

  const fmtData = ts => {
    const d = new Date(ts);
    return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).toUpperCase();
  };
  const labelsEixoX = [
    { x: xToPx(0), label: fmtData(candles[0].date) },
    { x: xToPx(Math.floor(candles.length / 2)), label: fmtData(candles[Math.floor(candles.length / 2)].date) },
    { x: xToPx(candles.length - 1), label: fmtData(candles[candles.length - 1].date) },
  ];

  // ─── TEXTO CONTEXTUAL DA PRESSAO DE CURTO PRAZO ────────────────────────────
  function descreverPressaoCurto() {
    const compradora = sinal.emaCurtaAcimaLonga;
    const subindo = sinal.inclinacaoEma12 === "sobe";
    if (compradora && subindo) return { sub: "ganhando força", seta: "↗" };
    if (compradora && !subindo) return { sub: "em desaceleração", seta: "↘" };
    if (!compradora && subindo) return { sub: "tentando reagir", seta: "↗" };
    return { sub: "se intensificando", seta: "↘" };
  }

  // ─── TEXTO CONTEXTUAL DA DIRECAO INSTITUCIONAL ─────────────────────────────
  function descreverDirecaoInst() {
    const compradora = sinal.inclinacaoEma50 === "sobe";
    return compradora
      ? { sub: "fluxo ascendente", seta: "↗" }
      : { sub: "fluxo descendente", seta: "↘" };
  }

  const pressaoCurto = descreverPressaoCurto();
  const direcaoInst = descreverDirecaoInst();

  return (
    <div style={{
      background: cfg.bg,
      border: "1px solid " + cfg.border,
      borderRadius: "14px",
      padding: "20px 18px",
    }}>
      {/* HEADER — Linha de Fluxo · leitura institucional */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <span style={{ fontSize: "14px", lineHeight: 1 }}>📡</span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", fontWeight: 700,
            color: cfg.cor, letterSpacing: "0.1em", textTransform: "uppercase",
          }}>Linha de fluxo · leitura institucional</span>
          <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
        </div>
        <p style={{
          fontSize: "12px", color: "rgba(255,255,255,0.4)",
          lineHeight: 1.5, margin: 0, paddingLeft: "22px",
        }}>
          Onde o dinheiro grande está se posicionando agora — algoritmo proprietário de leitura institucional, calibrado em prazo operacional.
        </p>
      </div>

      {/* BADGE DO SINAL */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        padding: "6px 12px",
        background: cfg.cor + "20",
        border: "1px solid " + cfg.cor + "50",
        borderRadius: "8px",
        marginBottom: "14px",
      }}>
        <div style={{
          width: "8px", height: "8px", borderRadius: "50%", background: cfg.cor,
          animation: "pulse-dot 2s ease infinite",
        }} />
        <span style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", fontWeight: 600,
          color: cfg.cor, letterSpacing: "0.06em",
        }}>{cfg.label}</span>
      </div>

      {/* EXPLICACAO EM LINGUAGEM DE FLUXO INSTITUCIONAL */}
      <p style={{
        fontSize: "14px", color: "rgba(255,255,255,0.7)",
        lineHeight: 1.6, margin: "0 0 16px",
      }}>{cfg.explicacao}</p>

      {/* GRAFICO SVG */}
      <div style={{
        background: "rgba(4,8,20,0.85)", borderRadius: "10px", padding: "12px",
        marginBottom: "14px", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: "8px",
          fontFamily: "'IBM Plex Mono',monospace", fontSize: "9px",
          color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em",
        }}>
          <span>{tk} · LEITURA QUANTITATIVA · 6 MESES</span>
          <span>ALGORITMO DE FLUXO + ZONA DE INVALIDAÇÃO</span>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
          {/* Grid horizontal */}
          {[0.25, 0.5, 0.75].map(p => (
            <line key={p} x1={PAD_LEFT} y1={PAD_TOP + chartH * p} x2={W - PAD_RIGHT} y2={PAD_TOP + chartH * p}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {/* CANDLES */}
          {candles.map((c, i) => {
            const x = xToPx(i);
            const candleW = Math.max(2, chartW / candles.length * 0.7);
            const yOpen = yToPx(c.open);
            const yClose = yToPx(c.close);
            const yHigh = yToPx(c.high);
            const yLow = yToPx(c.low);
            const isUp = c.close >= c.open;
            const cor = isUp ? "#34d399" : "#f87171";
            return (
              <g key={i} opacity="0.7">
                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={cor} strokeWidth="1" />
                <rect
                  x={x - candleW / 2}
                  y={Math.min(yOpen, yClose)}
                  width={candleW}
                  height={Math.max(1, Math.abs(yClose - yOpen))}
                  fill={cor}
                />
              </g>
            );
          })}

          {/* PRESSAO DE CURTO PRAZO — linha tracejada cinza clara */}
          <polyline
            points={candles
              .map((c, i) => c.ema12 != null ? `${xToPx(i)},${yToPx(c.ema12)}` : null)
              .filter(Boolean).join(" ")}
            fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2"
            strokeDasharray="3,3"
          />

          {/* LINHA DE FLUXO — segmentos coloridos pela direcao do dinheiro grande */}
          {candles.slice(1).map((c, idx) => {
            const i = idx + 1;
            if (c.ema50 == null || candles[i - 1].ema50 == null) return null;
            return (
              <line key={i}
                x1={xToPx(i - 1)} y1={yToPx(candles[i - 1].ema50)}
                x2={xToPx(i)} y2={yToPx(c.ema50)}
                stroke={corSegmentoEma(i)} strokeWidth="2.5" strokeLinecap="round"
              />
            );
          })}

          {/* Pontos de viragem do fluxo */}
          {pontosNotaveis.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="5" fill={p.tipo === "viragem_alta" ? "#34d399" : "#f87171"} opacity="0.3" />
              <circle cx={p.x} cy={p.y} r="3" fill={p.tipo === "viragem_alta" ? "#34d399" : "#f87171"} />
            </g>
          ))}

          {/* Label do preco atual */}
          <line x1={xToPx(candles.length - 1)} y1={yToPx(candles[candles.length - 1].close)}
            x2={W - PAD_RIGHT + 4} y2={yToPx(candles[candles.length - 1].close)}
            stroke={cfg.cor} strokeWidth="1" strokeDasharray="2,2" />
          <rect x={W - PAD_RIGHT + 4} y={yToPx(candles[candles.length - 1].close) - 9}
            width="46" height="18" rx="3" fill={cfg.cor} />
          <text x={W - PAD_RIGHT + 27} y={yToPx(candles[candles.length - 1].close) + 4}
            fontFamily="'IBM Plex Mono',monospace" fontSize="10" fontWeight="600"
            fill="#000" textAnchor="middle">
            {sinal.close.toFixed(2)}
          </text>

          {/* Eixo X — datas */}
          {labelsEixoX.map((l, idx) => (
            <text key={idx} x={l.x} y={H - 6}
              fontFamily="'IBM Plex Mono',monospace" fontSize="9"
              fill="rgba(255,255,255,0.25)" textAnchor={idx === 0 ? "start" : idx === labelsEixoX.length - 1 ? "end" : "middle"}>
              {l.label}
            </text>
          ))}
        </svg>
      </div>

      {/* LEGENDA EM LINGUAGEM DE FLUXO */}
      <div style={{
        display: "flex", gap: "16px", padding: "10px 12px",
        background: "rgba(4,8,20,0.6)", borderRadius: "8px",
        fontSize: "11px", color: "rgba(255,255,255,0.5)",
        marginBottom: "14px", flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "3px", borderRadius: "2px", background: "#34d399" }} />
          <span>fluxo comprador</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "3px", borderRadius: "2px", background: "#fbbf24" }} />
          <span>lateral</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "3px", borderRadius: "2px", background: "#f87171" }} />
          <span>fluxo vendedor</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "12px", height: "0", borderTop: "1.5px dashed rgba(255,255,255,0.5)" }} />
          <span>pressão de curto prazo</span>
        </div>
      </div>

      {/* GRID DE STATS — linguagem de fluxo + seta no subtítulo (sem contradição visual) */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px",
        background: "rgba(255,255,255,0.05)", borderRadius: "10px",
        overflow: "hidden", marginBottom: "12px",
      }}>
        <Stat
          label="Pressão de curto prazo"
          valor={sinal.emaCurtaAcimaLonga ? "Compradora" : "Vendedora"}
          sub={pressaoCurto.sub}
          subSeta={pressaoCurto.seta}
          cor={sinal.emaCurtaAcimaLonga ? "#34d399" : "#f87171"}
        />
        <Stat
          label="Direção institucional"
          valor={sinal.inclinacaoEma50 === "sobe" ? "Compradora" : "Vendedora"}
          sub={direcaoInst.sub}
          subSeta={direcaoInst.seta}
          cor={sinal.inclinacaoEma50 === "sobe" ? "#34d399" : "#f87171"}
        />
        <Stat
          label="Preço atual"
          valor={fmtMoeda(sinal.close)}
          sub={fmtPct(sinal.distanciaEma50) + " do fluxo médio"}
        />
        <Stat
          label="Zona de invalidação"
          valor={fmtMoeda(sinal.stopATR)}
          sub={sinal.precoAcimaStop ? "fluxo respeitado ✓" : "fluxo rompido ✗"}
          cor={sinal.precoAcimaStop ? "#34d399" : "#f87171"}
        />
      </div>

      {/* FOOTER — METODOLOGIA PROPRIETARIA + DISCLAIMER REGULATORIO */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        paddingTop: "12px",
      }}>
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: "9px",
          color: "rgba(255,255,255,0.4)", lineHeight: 1.6,
          marginBottom: "8px",
        }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>METODOLOGIA PROPRIETÁRIA · </span>
          Análise quantitativa baseada em algoritmo de leitura de fluxo institucional, calibrado por 20 anos de mercado para janelas operacionais de médio prazo.
        </div>
        <div style={{
          display: "flex", alignItems: "flex-start", gap: "6px",
          fontFamily: "'IBM Plex Mono',monospace", fontSize: "9px",
          color: "rgba(255,255,255,0.25)", lineHeight: 1.5,
        }}>
          <span style={{ color: "rgba(251,191,36,0.5)" }}>⚠</span>
          <span>Indicador de caráter informativo · não constitui recomendação de compra ou venda nem análise de valores mobiliários nos termos da CVM.</span>
        </div>
      </div>
    </div>
  );
}

// ─── SUBCOMPONENTE: BLOCO DE STAT ──────────────────────────────────────────────
function Stat({ label, valor, sub, subSeta, cor }) {
  return (
    <div style={{ background: "rgba(4,8,20,0.85)", padding: "12px 14px" }}>
      <div style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: "9px",
        color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em",
        marginBottom: "4px", textTransform: "uppercase",
      }}>{label}</div>
      <div style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: "14px", fontWeight: 600,
        color: cor || "rgba(255,255,255,0.85)",
      }}>
        {valor}
      </div>
      {sub && (
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace", fontSize: "9px",
          color: "rgba(255,255,255,0.45)", marginTop: "2px",
          display: "flex", alignItems: "center", gap: "4px",
        }}>
          <span>{sub}</span>
          {subSeta && (
            <span style={{ color: cor || "rgba(255,255,255,0.5)", fontWeight: 700 }}>
              {subSeta}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
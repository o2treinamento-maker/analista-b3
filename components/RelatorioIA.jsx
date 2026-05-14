"use client";

import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CardFluxo from "@/components/CardFluxo";
import CardFundamentalista from "@/components/CardFundamentalista";
import CardQuant from "@/components/CardQuant";
import CardDividendos from "@/components/CardDividendos";

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS DE PARSING
// ═══════════════════════════════════════════════════════════════════════════

function stripMd(texto) {
  if (!texto) return "";
  return texto
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function tickerParaTradingView(ticker) {
  const nyse = ["KO","JNJ","JPM","BAC","WMT","XOM","CVX","PG","HD","V","MA","UNH","MRK"];
  const nasdaq = ["AAPL","MSFT","NVDA","GOOGL","GOOG","AMZN","META","TSLA","NFLX","AVGO","AMD","INTC","QCOM","ADBE","PYPL"];
  if (nyse.includes(ticker)) return "NYSE:" + ticker;
  if (nasdaq.includes(ticker)) return "NASDAQ:" + ticker;
  if (ticker.endsWith("11")) return "BMFBOVESPA:" + ticker;
  if (/\d$/.test(ticker)) return "BMFBOVESPA:" + ticker;
  return ticker;
}

function identificarTipo(titulo) {
  const t = titulo.toLowerCase().replace(/[\u{1F300}-\u{1FFFF}]/gu, "").replace(/[⚖️⚠️📡📰🔮🎯📊📌📐🧠]/g, "").trim();
  if (t.includes("sentimento")) return "sentimento";
  if (t.includes("leitura do mercado")) return "leitura";
  if (t.includes("momento atual")) return "momento";
  if (t.includes("valuation")) return "valuation";
  if (t.includes("perspectivas")) return "perspectivas";
  if (t.includes("for") && (t.includes("risco") || t.includes("vs"))) return "forcas_riscos";
  if (t.includes("driver") || t.includes("principal")) return "driver";
  if (t.includes("invalid") || t.includes("que pode")) return "invalida";
  if (t.includes("consenso")) return "consenso";
  if (t.includes("recomenda") || t.includes("analista")) return "analistas";
  if (t.includes("distribui")) return "distribuicao";
  if (t.includes("proje") || t.includes("faixa")) return "projecoes";
  if (t.includes("s") && t.includes("ntese")) return "sintese";
  return "generico";
}

export function parsearSecoes(texto) {
  if (!texto) return [];
  const linhas = texto.split("\n");
  const secoes = [];
  let secaoAtual = null;
  for (const linha of linhas) {
    if (linha.startsWith("## ")) {
      if (secaoAtual) secoes.push(secaoAtual);
      const titulo = linha.replace(/^## /, "").trim();
      secaoAtual = { tipo: identificarTipo(titulo), titulo, corpo: "" };
    } else if (linha.startsWith("# ") && secoes.length === 0 && !secaoAtual) {
      secoes.push({ tipo: "cabecalho", titulo: linha.replace(/^# /, "").trim(), corpo: "" });
    } else if (linha.trim() === "---") {
      // ignora
    } else {
      if (secaoAtual) secaoAtual.corpo += linha + "\n";
      else if (secoes.length > 0 && secoes[0].tipo === "cabecalho") secoes[0].corpo += linha + "\n";
    }
  }
  if (secaoAtual) secoes.push(secaoAtual);
  return secoes;
}

function mdComponents() {
  return {
    p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-3 text-[14px]">{children}</p>,
    strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
    ul: ({ children }) => <ul className="list-none space-y-2 mb-3">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal space-y-2 mb-3 pl-5 text-gray-400">{children}</ol>,
    li: ({ children }) => <li className="flex items-start gap-2 text-gray-400 text-[14px] leading-relaxed"><span className="text-gray-600 mt-1 flex-shrink-0">•</span><span>{children}</span></li>,
    blockquote: ({ children }) => <blockquote className="border-l-2 border-green-500/40 pl-4 my-3 text-gray-400 text-[13px] leading-relaxed">{children}</blockquote>,
    table: ({ children }) => <div className="w-full my-3 overflow-hidden rounded-xl border border-white/10"><table className="w-full border-collapse text-sm">{children}</table></div>,
    thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-white/5">{children}</tr>,
    th: ({ children }) => <th className="px-4 py-3 text-left text-[#79dd7d] font-bold text-xs uppercase tracking-wider">{children}</th>,
    td: ({ children }) => {
      const text = typeof children === "string" ? children : Array.isArray(children) ? children.join("") : String(children || "");
      const isComprar = /comprar|buy/i.test(text);
      const isManter = /manter|hold/i.test(text);
      const isVender = /vender|sell/i.test(text);
      const isPos = text.startsWith("+") && text.includes("%");
      const isNeg = text.startsWith("-") && text.includes("%");
      const colorClass = isComprar || isPos ? "text-[#79dd7d] font-bold" : isManter ? "text-yellow-400 font-bold" : isVender || isNeg ? "text-red-400 font-bold" : "text-white/70";
      const pillClass = isComprar ? "bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold"
        : isManter ? "bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold"
        : isVender ? "bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full text-xs font-bold"
        : null;
      return <td className={"px-4 py-3 " + colorClass}>{pillClass ? <span className={pillClass}>{children}</span> : children}</td>;
    },
    hr: () => null,
    h3: ({ children }) => <h3 className="text-white/80 font-bold text-sm mt-4 mb-2">{children}</h3>,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTRATORES
// ═══════════════════════════════════════════════════════════════════════════

function extrairBullets(corpo) {
  return corpo.split("\n").filter(l => {
    const trim = l.trim();
    if (/^[-*]{2,}$/.test(trim)) return false;
    if (trim.startsWith("|")) return false;
    return trim.startsWith("•") || trim.startsWith("→") || (trim.startsWith("-") && trim.length > 2) || (trim.startsWith("*") && trim.length > 2 && !trim.startsWith("**"));
  }).map(l => stripMd(l.replace(/^[•→\-\*]\s*/, "").trim())).filter(b => b.length > 3);
}

function extrairSentimento(corpo) {
  if (/🟢|positivo/i.test(corpo)) return { emoji: "🟢", label: "Positivo", cor: "verde" };
  if (/🔴|negativo/i.test(corpo)) return { emoji: "🔴", label: "Negativo", cor: "vermelho" };
  return { emoji: "🟡", label: "Neutro", cor: "amarelo" };
}

function extrairTabelaAnalistas(corpo) {
  const linhas = corpo.split("\n").filter(l => l.includes("|") && !l.includes("---"));
  if (linhas.length < 2) return null;
  const [header, ...rows] = linhas;
  const cols = header.split("|").map(c => c.trim()).filter(Boolean);
  return rows.map(row => {
    const cells = row.split("|").map(c => c.trim()).filter(Boolean);
    const obj = {};
    cols.forEach((col, i) => { obj[col] = cells[i] || "—"; });
    return obj;
  }).filter(r => Object.values(r).some(v => v && v !== "—"));
}

function extrairMetricasConsenso(corpo) {
  const linhas = corpo.split("\n").filter(l => l.includes("|") && !l.includes("---"));
  if (linhas.length < 2) return [];
  return linhas.slice(1).map(l => {
    const parts = l.split("|").map(c => c.trim()).filter(Boolean);
    return { key: stripMd(parts[0] || ""), val: stripMd(parts[1] || "") };
  }).filter(r => r.key && r.val);
}

function extrairDistribuicao(corpo) {
  return {
    comprar: parseInt(corpo.match(/Comprar[^|]*\|\s*(\d+)/i)?.[1] || "0"),
    manter: parseInt(corpo.match(/Manter[^|]*\|\s*(\d+)/i)?.[1] || "0"),
    vender: parseInt(corpo.match(/Vender[^|]*\|\s*(\d+)/i)?.[1] || "0"),
  };
}

function extrairProjecoes(corpo) {
  const linhas = corpo.split("\n").filter(l => l.includes("|") && !l.includes("---"));
  const resultado = { bear: null, base: null, bull: null };
  for (const linha of linhas) {
    const cells = linha.split("|").map(c => c.trim()).filter(Boolean);
    if (!cells.length) continue;
    const tipo = cells[0].toLowerCase();
    const preco = stripMd(cells[1] || "—"), upside = stripMd(cells[2] || "—");
    if (/caute|bear/i.test(tipo)) resultado.bear = { preco, upside };
    else if (/refer|base/i.test(tipo)) resultado.base = { preco, upside };
    else if (/otim|bull/i.test(tipo)) resultado.bull = { preco, upside };
  }
  return resultado;
}

function extrairMomentoItems(corpo) {
  const bullets = extrairBullets(corpo);
  const paragrafos = corpo.split("\n").map(l => l.trim())
    .filter(l => l.length > 10 && !l.startsWith("#") && !l.startsWith("|") && !l.startsWith(">") && !/^[-*]{2,}$/.test(l))
    .map(l => stripMd(l)).filter(l => l.length > 10);
  const items = bullets.length > 0 ? bullets : paragrafos;
  return items.map(item => {
    const fonteMatch = item.match(/^(BTG|XP|Itaú|Itau|Citi|Morgan|Goldman|Bradesco|Safra|Santander|Genial|Suno|ANBIMA|B3|Petrobras|Vale|Embraer|Anbima)/i);
    const fonte = fonteMatch ? fonteMatch[1] : null;
    const dataMatch = item.match(/\((\d{2}\/\d{2}\/\d{4}|\d{1,2}\s+de\s+\w+\s+de\s+\d{4})\)/i);
    const data = dataMatch ? dataMatch[1] : null;
    return { texto: item, fonte, data };
  });
}

function extrairMetricasValuation(corpo) {
  const bullets = extrairBullets(corpo);
  const paragrafos = corpo.split("\n").map(l => l.trim())
    .filter(l => l.length > 10 && !l.startsWith("#") && !l.startsWith("|") && !l.startsWith(">") && !/^[-*]{2,}$/.test(l))
    .map(l => stripMd(l)).filter(l => l.length > 10);
  const textos = bullets.length > 0 ? bullets : paragrafos;

  const PADROES = [
    { regex: /P\/L(?:\s+forward)?(?:\s+de)?[:\s~]*([0-9][0-9,\.]+x?)/i, label: "P/L" },
    { regex: /EV\/EBITDA(?:\s+\w+E?)?(?:\s+de)?[:\s~]*([0-9][0-9,\.]+x?)/i, label: "EV/EBITDA" },
    { regex: /dividend\s*yield(?:\s+de)?[:\s~]*([0-9][0-9,\.]+%?)/i, label: "Dividend Yield" },
    { regex: /DY(?:\s+de)?[:\s~]*([0-9][0-9,\.]+%?)/i, label: "DY" },
    { regex: /upside(?:\s+de)?[:\s~]*([\+]?[0-9][0-9,\.]+%?)/i, label: "Upside" },
    { regex: /pre[çc]o[- ]alvo(?:\s+m[eé]dio)?(?:\s+de)?[:\s]*R\$\s*([0-9][0-9,\.]+)/i, label: "Preço-alvo" },
    { regex: /TIR(?:\s+real)?(?:\s+de)?[:\s~]*([0-9][0-9,\.\-]+%?)/i, label: "TIR" },
    { regex: /ROE(?:\s+de)?[:\s~]*([0-9][0-9,\.]+%?)/i, label: "ROE" },
    { regex: /FCFE?(?:\s+yield)?(?:\s+de)?[:\s~]*([0-9][0-9,\.\-]+%?)/i, label: "FCF Yield" },
  ];

  const metricas = [];
  const vistos = new Set();
  for (const texto of textos) {
    for (const p of PADROES) {
      if (vistos.has(p.label)) continue;
      const m = texto.match(p.regex);
      if (m && m[1] && !(/^20[0-9]{2}$/.test(m[1]))) {
        metricas.push({ label: p.label, valor: m[1].trim() });
        vistos.add(p.label);
      }
    }
  }
  return { metricas: metricas.slice(0, 4), textos };
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKENS GLOBAIS PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

const PREMIUM_CARD_STYLE = {
  background: "linear-gradient(135deg, rgba(5,8,22,0.96), rgba(9,14,32,0.98))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "22px",
  backdropFilter: "blur(20px)",
  boxShadow: "0 20px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
  padding: "28px",
};

const TYPO = {
  display:   { fontSize: "20px", fontWeight: 700, lineHeight: 1.4,  letterSpacing: "-0.015em" },
  bodyLarge: { fontSize: "15px", fontWeight: 500, lineHeight: 1.7,  letterSpacing: "-0.005em" },
  body:      { fontSize: "14px", fontWeight: 450, lineHeight: 1.7 },
  metric:    { fontSize: "13px", fontWeight: 500, lineHeight: 1.6 },
  label:     { fontSize: "10px", fontWeight: 700, lineHeight: 1.5,  letterSpacing: "0.16em", textTransform: "uppercase" },
};

// ═══════════════════════════════════════════════════════════════════════════
// SHARED — SectionLabel premium, CardSkeleton, CardAccordion, DivisorPercepcao
// ═══════════════════════════════════════════════════════════════════════════

function SectionLabel({ text, color, icon }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
      {icon && (
        <div
          style={{
            width: "26px",
            height: "26px",
            borderRadius: "8px",
            background: `${color || "rgba(255,255,255,0.5)"}12`,
            border: `1px solid ${color || "rgba(255,255,255,0.15)"}25`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            lineHeight: 1,
          }}
        >
          {icon}
        </div>
      )}
      <span
        style={{
          fontFamily: "'IBM Plex Mono',monospace",
          ...TYPO.label,
          color: color || "rgba(255,255,255,0.55)",
        }}
      >
        {text}
      </span>
      <div
        style={{
          flex: 1,
          height: "1px",
          background: `linear-gradient(90deg, ${color || "rgba(255,255,255,0.12)"}25, transparent)`,
        }}
      />
    </div>
  );
}

function CardSkeleton({ tipo }) {
  const alturas = { sentimento: "h-16", leitura: "h-20", momento: "h-32", valuation: "h-28", perspectivas: "h-32", forcas_riscos: "h-36", driver: "h-16", invalida: "h-24", consenso: "h-40", analistas: "h-48", distribuicao: "h-32", projecoes: "h-28", sintese: "h-24", default: "h-20" };
  const h = alturas[tipo] || alturas.default;
  return (
    <div className={"bg-[#080e1f] border border-white/5 rounded-2xl " + h + " overflow-hidden relative"}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent" style={{ backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite linear" }} />
    </div>
  );
}

function CardAccordion({ id, titulo, subtitulo, aberto, onToggle, children }) {
  return (
    <div style={{ marginTop: "18px" }}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        style={{
          width: "100%",
          background: "rgba(4,8,20,0.92)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: aberto ? "14px 14px 0 0" : "14px",
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          color: "#fff",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.label,
            color: "#34d399",
          }}>
            {titulo}
          </div>
          {subtitulo && (
            <div style={{
              marginTop: "4px",
              ...TYPO.metric,
              color: "rgba(255,255,255,0.45)",
            }}>
              {subtitulo}
            </div>
          )}
        </div>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: aberto ? "1px solid rgba(52,211,153,0.25)" : "1px solid rgba(255,255,255,0.08)",
            background: aberto ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: "20px",
              lineHeight: 1,
              color: aberto ? "#34d399" : "rgba(255,255,255,0.55)",
              marginTop: aberto ? "-2px" : "0",
            }}
          >
            {aberto ? "−" : "+"}
          </span>
        </div>
      </button>
      {aberto && (
        <div style={{
          border: "1px solid rgba(255,255,255,0.10)",
          borderTop: "none",
          borderRadius: "0 0 14px 14px",
          overflow: "hidden",
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function DivisorPercepcao() {
  return (
    <div style={{ margin: "32px 0 24px", position: "relative" }}>
      <div style={{
        position: "absolute",
        top: "50%",
        left: 0,
        right: 0,
        height: "1px",
        background: "linear-gradient(90deg, transparent 0%, rgba(96,165,250,0.15) 20%, rgba(96,165,250,0.15) 80%, transparent 100%)",
        zIndex: 0,
      }} />
      <div style={{
        position: "relative",
        zIndex: 1,
        maxWidth: "640px",
        margin: "0 auto",
        background: "linear-gradient(180deg, rgba(8,14,28,0.95) 0%, rgba(4,8,20,0.98) 100%)",
        border: "1px solid rgba(96,165,250,0.2)",
        borderRadius: "14px",
        padding: "20px 24px",
        boxShadow: "0 0 40px rgba(96,165,250,0.06), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: "rgba(96,165,250,0.1)",
            border: "1px solid rgba(96,165,250,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
            flexShrink: 0,
          }}>🌐</div>
          <div>
            <div style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.label,
              letterSpacing: "0.12em",
              color: "#60a5fa",
              lineHeight: 1.2,
            }}>Percepção do mercado</div>
            <div style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.label,
              letterSpacing: "0.08em",
              color: "rgba(255,255,255,0.3)",
              marginTop: "3px",
            }}>↓ ANÁLISES AGREGADAS DE FONTES PÚBLICAS</div>
          </div>
        </div>
        <p style={{
          ...TYPO.metric,
          color: "rgba(255,255,255,0.55)",
          margin: 0,
          paddingLeft: "42px",
        }}>
          A partir daqui, leituras consolidadas a partir de <strong style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>relatórios de analistas, notícias e percepção pública do mercado</strong>, estruturadas em uma visão quantitativa unificada.
        </p>
        <div style={{
          marginTop: "12px",
          paddingTop: "10px",
          paddingLeft: "42px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
        }}>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.label,
            letterSpacing: "0.08em",
            color: "rgba(96,165,250,0.7)",
            background: "rgba(96,165,250,0.06)",
            border: "1px solid rgba(96,165,250,0.15)",
            padding: "3px 8px",
            borderRadius: "4px",
          }}>FONTE: WEB</span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.label,
            letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "3px 8px",
            borderRadius: "4px",
          }}>ANÁLISE QUANT</span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.label,
            letterSpacing: "0.04em",
            color: "rgba(255,255,255,0.3)",
            textTransform: "none",
            fontWeight: 500,
            marginLeft: "auto",
          }}>conteúdo de terceiros</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD CABEÇALHO — MANTIDO COM PREÇO + VARIAÇÃO (próprio dessa Home),
// elevado a estilo premium
// ═══════════════════════════════════════════════════════════════════════════

function CardCabecalho({ secao }) {
  const tipo = stripMd((secao.corpo.match(/\*\*Tipo de ativo:\*\*\s*(.+)/)?.[1] || "").trim());
  const linhaPreco = stripMd((secao.corpo.match(/\*\*Pre.o atual:\*\*\s*(.+)/)?.[1] || "").trim());

  const precoMatch = linhaPreco.match(/(R\$\s*[\d.,]+|US\$\s*[\d.,]+|[\d.,]+)/);
  const preco = precoMatch ? precoMatch[1].trim() : "";

  const variacaoMatch = linhaPreco.match(/([+\-−]?\s*[\d.,]+\s*%)/);
  const variacaoStr = variacaoMatch ? variacaoMatch[1].replace(/\s/g, "") : "";

  const isNeg = /^[-−]/.test(variacaoStr);
  const isPos = /^\+/.test(variacaoStr) || (variacaoStr && !isNeg && parseFloat(variacaoStr.replace(",", ".")) > 0);
  const variacaoCor = isPos ? "#34d399" : isNeg ? "#f87171" : "rgba(255,255,255,0.5)";
  const variacaoBg = isPos ? "rgba(52,211,153,0.12)" : isNeg ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.04)";
  const variacaoBord = isPos ? "rgba(52,211,153,0.25)" : isNeg ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.08)";
  const variacaoSeta = isPos ? "↗" : isNeg ? "↘" : "→";

  let variacaoFormatada = "";
  if (variacaoStr) {
    const num = parseFloat(variacaoStr.replace(/[+\-−%]/g, "").replace(",", "."));
    if (!isNaN(num)) {
      const formatado = Math.abs(num).toFixed(2).replace(".", ",");
      const sinal = isPos ? "+" : isNeg ? "−" : "";
      variacaoFormatada = `${sinal}${formatado}%`;
    } else {
      variacaoFormatada = variacaoStr;
    }
  }

  let dataLimpa = linhaPreco;
  if (preco) dataLimpa = dataLimpa.replace(preco, "");
  if (variacaoStr) dataLimpa = dataLimpa.replace(variacaoStr, "");
  dataLimpa = dataLimpa.replace(/[·•|]+/g, " ").replace(/\s+/g, " ").trim();
  const dataMatch = dataLimpa.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/);
  const data = dataMatch ? dataMatch[1].trim() : "";

  const tickerMatch = secao.titulo.match(/^([A-Z0-9]+)/);
  const ticker = tickerMatch?.[1] || "";
  const nomeEmpresa = secao.titulo.replace(ticker, "").replace(/^\s*[—–-]\s*/, "").trim();

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(circle at top left, rgba(52,211,153,0.16), transparent 32%), radial-gradient(circle at top right, rgba(96,165,250,0.12), transparent 30%), linear-gradient(135deg, rgba(5,8,22,0.98), rgba(9,14,32,0.98))",
        border: "1px solid rgba(52,211,153,0.18)",
        borderRadius: "22px",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Glow ambiente */}
      <div style={{
        position: "absolute",
        top: "-100px",
        right: "-100px",
        width: "260px",
        height: "260px",
        borderRadius: "50%",
        background: "rgba(52,211,153,0.10)",
        filter: "blur(50px)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "relative",
        zIndex: 2,
        padding: "28px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
      }}>
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          {/* Badge QYNTOR */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "5px 11px",
            borderRadius: "999px",
            background: "rgba(52,211,153,0.08)",
            border: "1px solid rgba(52,211,153,0.18)",
            marginBottom: "14px",
          }}>
            <div style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#34d399",
              boxShadow: "0 0 10px rgba(52,211,153,0.8)",
            }} />
            <span style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: "#34d399",
            }}>QYNTOR</span>
          </div>

          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: "12px",
            marginBottom: "10px",
            flexWrap: "wrap",
          }}>
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: "36px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}>{ticker}</span>
            {nomeEmpresa && (
              <span style={{
                ...TYPO.body,
                color: "rgba(255,255,255,0.45)",
                fontWeight: 500,
              }}>{nomeEmpresa}</span>
            )}
          </div>
          {tipo && (
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.label,
              letterSpacing: "0.12em",
              color: "rgba(52,211,153,0.85)",
              background: "rgba(52,211,153,0.08)",
              padding: "4px 11px",
              borderRadius: "6px",
              border: "1px solid rgba(52,211,153,0.18)",
              display: "inline-block",
            }}>{tipo.toUpperCase()}</span>
          )}
        </div>

        {preco && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
            flexShrink: 0,
          }}>
            <div style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: "30px",
              fontWeight: 800,
              color: "#fff",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}>{preco}</div>

            {variacaoFormatada && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: variacaoBg,
                border: "1px solid " + variacaoBord,
                borderRadius: "10px",
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: "13px",
                fontWeight: 700,
                color: variacaoCor,
                letterSpacing: "-0.01em",
                boxShadow: isPos
                  ? "0 0 16px rgba(52,211,153,0.15)"
                  : isNeg
                  ? "0 0 16px rgba(248,113,113,0.15)"
                  : "none",
              }}>
                <span style={{ fontSize: "12px", fontWeight: 800 }}>{variacaoSeta}</span>
                <span>{variacaoFormatada}</span>
              </div>
            )}

            {data && (
              <div style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.label,
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "none",
                color: "rgba(255,255,255,0.35)",
                marginTop: "2px",
              }}>{data}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMAIS CARDS — REDESIGN PREMIUM
// ═══════════════════════════════════════════════════════════════════════════

function CardSentimento({ secao }) {
  const { emoji, label, cor } = extrairSentimento(secao.corpo);
  const frase = stripMd(secao.corpo.split("\n").find(l => l.trim() && !l.includes(emoji) && !l.includes("##") && !l.startsWith("#") && l.trim().length > 10)?.trim() || "");

  const cfg = {
    verde:    { color: "#34d399", glow: "rgba(52,211,153,0.45)", border: "rgba(52,211,153,0.18)" },
    amarelo:  { color: "#fbbf24", glow: "rgba(251,191,36,0.40)", border: "rgba(251,191,36,0.18)" },
    vermelho: { color: "#f87171", glow: "rgba(248,113,113,0.45)", border: "rgba(248,113,113,0.18)" },
  }[cor];

  return (
    <div
      style={{
        ...PREMIUM_CARD_STYLE,
        position: "relative",
        overflow: "hidden",
        borderColor: cfg.border,
      }}
    >
      <div style={{
        position: "absolute",
        top: "-80px",
        left: "-80px",
        width: "240px",
        height: "240px",
        borderRadius: "50%",
        background: cfg.glow,
        filter: "blur(60px)",
        opacity: 0.5,
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: "88px", height: "88px", flexShrink: 0 }}>
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${cfg.glow}, transparent 70%)`,
            filter: "blur(8px)",
            animation: "sentimentoPulse 3s ease-in-out infinite",
          }} />
          <div style={{
            position: "absolute",
            inset: "10px",
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, ${cfg.color}, ${cfg.color}80)`,
            border: `1px solid ${cfg.color}50`,
            boxShadow: `0 0 40px ${cfg.glow}, inset 0 2px 8px rgba(255,255,255,0.2)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "30px",
          }}>{emoji}</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.label,
            color: "rgba(255,255,255,0.35)",
            marginBottom: "10px",
          }}>Sentimento de Mercado</div>

          <div style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.display,
            fontWeight: 800,
            color: cfg.color,
            marginBottom: "10px",
            textShadow: `0 0 30px ${cfg.glow}`,
          }}>{label.toUpperCase()}</div>

          {frase && (
            <p style={{
              ...TYPO.body,
              color: "rgba(255,255,255,0.82)",
              margin: 0,
              maxWidth: "640px",
            }}>{frase}</p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes sentimentoPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

function CardLeitura({ secao }) {
  const frase = stripMd(secao.corpo.split("\n").filter(l => l.trim() && !l.startsWith(">") && !l.startsWith("#")).find(l => l.replace(/^[\s]+/, "").trim().length > 20)?.replace(/^[\s]+/, "").trim() || secao.corpo.slice(0, 180).trim());

  return (
    <div style={{
      ...PREMIUM_CARD_STYLE,
      position: "relative",
      overflow: "hidden",
      borderColor: "rgba(96,165,250,0.18)",
    }}>
      <div style={{
        position: "absolute",
        top: "-100px",
        right: "-80px",
        width: "320px",
        height: "320px",
        borderRadius: "50%",
        background: "rgba(96,165,250,0.08)",
        filter: "blur(80px)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <SectionLabel text="Tese Central" color="#60a5fa" icon="◆" />

        <div style={{ position: "relative", paddingLeft: "32px", paddingRight: "12px" }}>
          <div style={{
            position: "absolute",
            left: "-4px",
            top: "-8px",
            fontFamily: "Georgia, serif",
            fontSize: "56px",
            fontWeight: 700,
            color: "rgba(96,165,250,0.22)",
            lineHeight: 1,
            pointerEvents: "none",
          }}>"</div>

          <div style={{
            position: "absolute",
            left: "0",
            top: "12px",
            bottom: "12px",
            width: "3px",
            borderRadius: "100px",
            background: "linear-gradient(180deg, #60a5fa, rgba(96,165,250,0.1))",
            boxShadow: "0 0 18px rgba(96,165,250,0.6)",
          }} />

          <p style={{
            fontSize: "17px",
            fontWeight: 500,
            lineHeight: 1.7,
            letterSpacing: "-0.005em",
            color: "rgba(255,255,255,0.85)",
            margin: 0,
            maxWidth: "920px",
          }}>{frase}</p>
        </div>
      </div>
    </div>
  );
}

function CardMomento({ secao }) {
  const items = extrairMomentoItems(secao.corpo);

  return (
    <div style={{ ...PREMIUM_CARD_STYLE }}>
      <SectionLabel text="Momento Atual do Ativo" color="#34d399" icon="📰" />

      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute",
          left: "9px",
          top: "10px",
          bottom: "10px",
          width: "1px",
          background: "linear-gradient(180deg, rgba(52,211,153,0.4), rgba(52,211,153,0.05))",
          boxShadow: "0 0 12px rgba(52,211,153,0.3)",
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {items.map((item, i) => (
            <div
              key={i}
              className="momento-item-premium"
              style={{
                position: "relative",
                padding: "16px 16px 16px 36px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.05)",
                transition: "all 0.25s ease",
              }}
            >
              <div style={{
                position: "absolute",
                left: "2px",
                top: "22px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "rgba(5,8,22,1)",
                border: "2px solid #34d399",
                boxShadow: "0 0 12px rgba(52,211,153,0.7)",
              }} />

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: item.fonte || item.data ? "8px" : "0" }}>
                {item.fonte && (
                  <span style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.label,
                    color: "#34d399",
                    padding: "4px 9px",
                    borderRadius: "6px",
                    background: "rgba(52,211,153,0.08)",
                    border: "1px solid rgba(52,211,153,0.2)",
                  }}>{item.fonte.toUpperCase()}</span>
                )}
                {item.data && (
                  <span style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.label,
                    letterSpacing: "0.05em",
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "none",
                  }}>{item.data}</span>
                )}
              </div>

              <p style={{ ...TYPO.body, color: "rgba(255,255,255,0.82)", margin: 0 }}>{item.texto}</p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .momento-item-premium:hover {
          background: rgba(52,211,153,0.04) !important;
          border-color: rgba(52,211,153,0.18) !important;
          transform: translateX(2px);
        }
      `}</style>
    </div>
  );
}

function CardValuation({ secao }) {
  const { textos } = extrairMetricasValuation(secao.corpo);
  return (
    <div style={{ ...PREMIUM_CARD_STYLE, borderColor: "rgba(96,165,250,0.15)" }}>
      <SectionLabel text="Leitura de Valuation" color="#60a5fa" icon="⚖" />

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {textos.map((t, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "14px 16px",
              borderRadius: "12px",
              background: "rgba(96,165,250,0.03)",
              border: "1px solid rgba(96,165,250,0.08)",
            }}
          >
            <span style={{
              color: "#60a5fa",
              fontSize: "10px",
              marginTop: "5px",
              flexShrink: 0,
              lineHeight: 1,
            }}>◆</span>
            <span style={{ ...TYPO.body, color: "rgba(255,255,255,0.82)" }}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardPerspectivas({ secao }) {
  const bullets = extrairBullets(secao.corpo);
  const paragrafos = secao.corpo.split("\n").map(l => l.trim())
    .filter(l => l.length > 10 && !l.startsWith("#") && !l.startsWith("|") && !l.startsWith(">") && !/^[-*]{2,}$/.test(l))
    .map(l => stripMd(l)).filter(l => l.length > 10);
  const items = bullets.length > 0 ? bullets : paragrafos;

  const getHorizonte = (texto) => {
    if (/2027|2028|2029|2030|longo prazo|médio prazo/i.test(texto))
      return { label: "MÉDIO / LONGO PRAZO", color: "#fbbf24", glow: "rgba(251,191,36,0.5)" };
    if (/2026|curto prazo|próximo/i.test(texto))
      return { label: "CURTO PRAZO", color: "#34d399", glow: "rgba(52,211,153,0.5)" };
    return { label: "HORIZONTE GERAL", color: "#a78bfa", glow: "rgba(167,139,250,0.5)" };
  };

  return (
    <div style={{ ...PREMIUM_CARD_STYLE, borderColor: "rgba(167,139,250,0.18)" }}>
      <SectionLabel text="Roadmap Futuro" color="#a78bfa" icon="🔮" />

      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute",
          left: "9px",
          top: "8px",
          bottom: "8px",
          width: "1px",
          background: "linear-gradient(180deg, rgba(167,139,250,0.5), rgba(167,139,250,0.05))",
          boxShadow: "0 0 14px rgba(167,139,250,0.3)",
        }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {items.map((item, i) => {
            const h = getHorizonte(item);
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  padding: "14px 16px 14px 36px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div style={{
                  position: "absolute",
                  left: "2px",
                  top: "20px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "rgba(5,8,22,1)",
                  border: `2px solid ${h.color}`,
                  boxShadow: `0 0 14px ${h.glow}`,
                }} />

                <span style={{
                  display: "inline-block",
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.label,
                  color: h.color,
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: `${h.color}10`,
                  border: `1px solid ${h.color}25`,
                  marginBottom: "8px",
                }}>{h.label}</span>

                <p style={{ ...TYPO.body, color: "rgba(255,255,255,0.82)", margin: 0 }}>{item}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CardForcasRiscos({ secao }) {
  const partes = secao.corpo.split(/(?=###?\s*(🔴|PONT|RISCO|ATEN))/i);
  const forcas = extrairBullets(partes[0] || "");
  const riscos = extrairBullets(partes.slice(1).join("") || "");

  return (
    <>
      <style>{`
        @media (max-width: 760px) {
          .matriz-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="matriz-grid forcas-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div
          style={{
            ...PREMIUM_CARD_STYLE,
            position: "relative",
            overflow: "hidden",
            borderColor: "rgba(52,211,153,0.22)",
            background: "linear-gradient(135deg, rgba(5,18,12,0.96), rgba(7,22,16,0.98))",
          }}
        >
          <div style={{
            position: "absolute",
            top: "-90px",
            right: "-90px",
            width: "240px",
            height: "240px",
            borderRadius: "50%",
            background: "rgba(52,211,153,0.12)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 2 }}>
            <SectionLabel text="Forças Estruturais" color="#34d399" icon="↑" />

            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
              {forcas.length > 0 ? forcas.map((f, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(52,211,153,0.04)",
                    border: "1px solid rgba(52,211,153,0.1)",
                  }}
                >
                  <div style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    background: "rgba(52,211,153,0.12)",
                    border: "1px solid rgba(52,211,153,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#34d399",
                  }}>+</div>
                  <span style={{ ...TYPO.metric, color: "rgba(52,211,153,0.9)" }}>{f}</span>
                </li>
              )) : (
                <li style={{ ...TYPO.metric, color: "rgba(52,211,153,0.3)", padding: "8px 0" }}>
                  Dados insuficientes.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div
          style={{
            ...PREMIUM_CARD_STYLE,
            position: "relative",
            overflow: "hidden",
            borderColor: "rgba(248,113,113,0.22)",
            background: "linear-gradient(135deg, rgba(22,5,8,0.96), rgba(28,7,10,0.98))",
          }}
        >
          <div style={{
            position: "absolute",
            top: "-90px",
            right: "-90px",
            width: "240px",
            height: "240px",
            borderRadius: "50%",
            background: "rgba(248,113,113,0.12)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 2 }}>
            <SectionLabel text="Pontos de Atenção" color="#f87171" icon="↓" />

            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
              {riscos.length > 0 ? riscos.map((r, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(248,113,113,0.04)",
                    border: "1px solid rgba(248,113,113,0.1)",
                  }}
                >
                  <div style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "6px",
                    background: "rgba(248,113,113,0.12)",
                    border: "1px solid rgba(248,113,113,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "1px",
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#f87171",
                  }}>−</div>
                  <span style={{ ...TYPO.metric, color: "rgba(248,113,113,0.88)" }}>{r}</span>
                </li>
              )) : (
                <li style={{ ...TYPO.metric, color: "rgba(248,113,113,0.3)", padding: "8px 0" }}>
                  Dados insuficientes.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function CardDriver({ secao }) {
  const texto = stripMd(secao.corpo.replace(/^#+.+$/m, "").trim());

  return (
    <div
      style={{
        ...PREMIUM_CARD_STYLE,
        position: "relative",
        overflow: "hidden",
        borderColor: "rgba(96,165,250,0.22)",
      }}
    >
      <div style={{
        position: "absolute",
        top: "-80px",
        left: "-80px",
        width: "260px",
        height: "260px",
        borderRadius: "50%",
        background: "rgba(96,165,250,0.10)",
        filter: "blur(70px)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <SectionLabel text="Driver Central da Tese" color="#60a5fa" icon="🎯" />

        <div style={{ position: "relative", paddingLeft: "24px" }}>
          <div style={{
            position: "absolute",
            left: 0,
            top: "8px",
            bottom: "8px",
            width: "3px",
            borderRadius: "100px",
            background: "linear-gradient(180deg, #60a5fa, rgba(96,165,250,0.1))",
            boxShadow: "0 0 16px rgba(96,165,250,0.6)",
          }} />

          <p style={{
            ...TYPO.bodyLarge,
            color: "rgba(255,255,255,0.85)",
            margin: 0,
            maxWidth: "880px",
          }}>{texto}</p>
        </div>
      </div>
    </div>
  );
}

function CardInvalida({ secao }) {
  const bullets = extrairBullets(secao.corpo);
  const texto = stripMd(secao.corpo.replace(/^[•\-\*].+$/gm, "").replace(/^#+.+$/m, "").trim());

  return (
    <div
      style={{
        ...PREMIUM_CARD_STYLE,
        position: "relative",
        overflow: "hidden",
        borderColor: "rgba(248,113,113,0.20)",
        background: "linear-gradient(135deg, rgba(18,5,8,0.96), rgba(22,7,10,0.98))",
      }}
    >
      <div style={{
        position: "absolute",
        top: "-90px",
        right: "-90px",
        width: "260px",
        height: "260px",
        borderRadius: "50%",
        background: "rgba(248,113,113,0.08)",
        filter: "blur(70px)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <SectionLabel text="Alerta · O que invalida a tese" color="#f87171" icon="⚠" />

        {bullets.length > 0 ? (
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
            {bullets.map((b, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "13px 16px",
                  borderRadius: "10px",
                  background: "rgba(248,113,113,0.04)",
                  border: "1px solid rgba(248,113,113,0.12)",
                }}
              >
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  background: "rgba(248,113,113,0.12)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "1px",
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#f87171",
                }}>×</div>
                <span style={{ ...TYPO.metric, color: "rgba(248,113,113,0.85)" }}>{b}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ ...TYPO.body, color: "rgba(255,255,255,0.5)", margin: 0 }}>{texto}</p>
        )}
      </div>
    </div>
  );
}

function CardConsenso({ secao }) {
  const metricas = extrairMetricasConsenso(secao.corpo);

  return (
    <div style={{ ...PREMIUM_CARD_STYLE, borderColor: "rgba(52,211,153,0.18)" }}>
      <SectionLabel text="Painel Executivo · Consenso" color="#34d399" icon="📊" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
        {metricas.map((m, i) => {
          const isComprar = /comprar|buy/i.test(m.val);
          const isVender = /vender|sell/i.test(m.val);
          const isManter = /manter|hold/i.test(m.val);
          const isPos = /\+\d/.test(m.val);
          const isNeg = /^-\d/.test(m.val);

          const corValor = isComprar || isPos ? "#34d399"
            : isVender || isNeg ? "#f87171"
            : isManter ? "#fbbf24"
            : "rgba(255,255,255,0.9)";

          const corGlow = isComprar || isPos ? "rgba(52,211,153,0.35)"
            : isVender || isNeg ? "rgba(248,113,113,0.35)"
            : isManter ? "rgba(251,191,36,0.3)"
            : "transparent";

          return (
            <div
              key={i}
              style={{
                padding: "16px 18px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.label,
                color: "rgba(255,255,255,0.35)",
                marginBottom: "10px",
              }}>{m.key}</div>
              <div style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.display,
                fontWeight: 800,
                color: corValor,
                textShadow: corGlow !== "transparent" ? `0 0 18px ${corGlow}` : "none",
              }}>{m.val}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CardAnalistas({ secao }) {
  const tabela = extrairTabelaAnalistas(secao.corpo);

  if (!tabela) return (
    <div style={{ ...PREMIUM_CARD_STYLE }}>
      <SectionLabel text="Recomendações por Analista" color="rgba(255,255,255,0.7)" icon="📋" />
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents()}>{secao.corpo}</ReactMarkdown>
    </div>
  );

  const cols = Object.keys(tabela[0] || {});

  return (
    <div style={{ ...PREMIUM_CARD_STYLE, padding: "28px 28px 20px 28px" }}>
      <SectionLabel text="Recomendações por Analista" color="rgba(255,255,255,0.7)" icon="📋" />

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", margin: "0 -8px" }}>
        <style>{`
          .analistas-row-premium { transition: background 0.18s ease; }
          .analistas-row-premium:hover { background: rgba(255,255,255,0.025); }
        `}</style>

        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "520px" }}>
          <thead>
            <tr>
              {cols.map(col => (
                <th
                  key={col}
                  style={{
                    textAlign: "left",
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.label,
                    color: "rgba(255,255,255,0.35)",
                    padding: "10px 14px 14px 14px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabela.map((row, i) => (
              <tr
                key={i}
                className="analistas-row-premium"
                style={{ borderBottom: i < tabela.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
              >
                {cols.map(col => {
                  const val = row[col] || "—";
                  const isRec = !/corretora|casa/i.test(col) && /comprar|buy|manter|hold|vender|sell/i.test(val);
                  const isUp = val.startsWith("+") && val.includes("%");
                  const isDown = val.startsWith("-") && val.includes("%");

                  // Coluna TEXTO (nome de corretora, leitura) -> Inter
                  // Coluna NÚMERO (preço, upside, data) -> Mono
                  const isTextColumn = /corretora|casa|leitura|descri/i.test(col);

                  const recStyle = isRec
                    ? (/comprar|buy/i.test(val)
                        ? { background: "rgba(52,211,153,0.10)", color: "#34d399", border: "1px solid rgba(52,211,153,0.25)" }
                        : /manter|hold/i.test(val)
                        ? { background: "rgba(251,191,36,0.10)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.25)" }
                        : { background: "rgba(248,113,113,0.10)", color: "#f87171", border: "1px solid rgba(248,113,113,0.25)" })
                    : null;

                  return (
                    <td
                      key={col}
                      style={{
                        padding: "14px",
                        fontFamily: isTextColumn
                          ? "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                          : "'IBM Plex Mono',monospace",
                        fontSize: isTextColumn ? "14px" : "13px",
                        fontWeight: isUp || isDown ? 700 : 500,
                        lineHeight: 1.6,
                        color: isUp ? "#34d399" : isDown ? "#f87171" : "rgba(255,255,255,0.85)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {recStyle ? (
                        <span
                          style={{
                            ...recStyle,
                            padding: "5px 12px",
                            borderRadius: "999px",
                            fontFamily: "'IBM Plex Mono',monospace",
                            fontSize: "10px",
                            fontWeight: 800,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                          }}
                        >
                          {val}
                        </span>
                      ) : val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardDistribuicao({ secao }) {
  const { comprar, manter, vender } = extrairDistribuicao(secao.corpo);
  const total = comprar + manter + vender || 1;
  const pct = v => Math.round((v / total) * 100);
  const dominant = comprar >= manter && comprar >= vender ? "comprar" : vender >= manter ? "vender" : "manter";
  const domColor = dominant === "comprar" ? "#34d399" : dominant === "vender" ? "#f87171" : "#fbbf24";

  return (
    <div style={{ ...PREMIUM_CARD_STYLE, borderColor: `${domColor}25` }}>
      <SectionLabel text="Distribuição das Recomendações" color={domColor} icon="📊" />

      <div style={{
        height: "12px",
        borderRadius: "100px",
        overflow: "hidden",
        background: "rgba(255,255,255,0.04)",
        display: "flex",
        gap: "3px",
        marginBottom: "20px",
        padding: "2px",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        {comprar > 0 && (
          <div style={{
            background: "linear-gradient(90deg, #34d399, #10b981)",
            borderRadius: "100px",
            width: pct(comprar) + "%",
            boxShadow: "0 0 12px rgba(52,211,153,0.5)",
          }} />
        )}
        {manter > 0 && (
          <div style={{
            background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
            borderRadius: "100px",
            width: pct(manter) + "%",
            boxShadow: "0 0 12px rgba(251,191,36,0.5)",
          }} />
        )}
        {vender > 0 && (
          <div style={{
            background: "linear-gradient(90deg, #f87171, #ef4444)",
            borderRadius: "100px",
            width: pct(vender) + "%",
            boxShadow: "0 0 12px rgba(248,113,113,0.5)",
          }} />
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
        {[
          { label: "COMPRAR", v: comprar, color: "#34d399", bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.2)" },
          { label: "MANTER",  v: manter,  color: "#fbbf24", bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.2)" },
          { label: "VENDER",  v: vender,  color: "#f87171", bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.2)" },
        ].filter(c => c.v > 0).map(c => (
          <div
            key={c.label}
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: c.bg,
              border: `1px solid ${c.border}`,
            }}
          >
            <div style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.label,
              letterSpacing: "0.18em",
              color: c.color,
              marginBottom: "8px",
            }}>{c.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.display,
                fontWeight: 800,
                color: c.color,
                textShadow: `0 0 18px ${c.color}40`,
              }}>{c.v}</span>
              <span style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.metric,
                fontWeight: 700,
                color: `${c.color}99`,
              }}>{pct(c.v)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardProjecoes({ secao }) {
  const { bear, base, bull } = extrairProjecoes(secao.corpo);

  return (
    <>
      <style>{`
        @media (max-width: 760px) {
          .projecoes-grid-premium { grid-template-columns: 1fr !important; }
        }
        .projecao-card-premium { transition: all 0.25s ease; }
        .projecao-card-premium:hover { transform: translateY(-3px); }
      `}</style>

      <div style={{ ...PREMIUM_CARD_STYLE }}>
        <SectionLabel text="Cenários Institucionais" color="rgba(255,255,255,0.7)" icon="📐" />

        <div
          className="projecoes-grid-premium projecoes-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}
        >
          {[
            { label: "BEAR", subtitle: "Cenário Cautela",   data: bear, color: "#f87171", glow: "rgba(248,113,113,0.35)", bg: "linear-gradient(135deg, rgba(22,5,8,0.96), rgba(28,7,10,0.98))" },
            { label: "BASE", subtitle: "Referência",        data: base, color: "#fbbf24", glow: "rgba(251,191,36,0.30)", bg: "linear-gradient(135deg, rgba(22,16,5,0.96), rgba(28,20,7,0.98))" },
            { label: "BULL", subtitle: "Cenário Otimista",  data: bull, color: "#34d399", glow: "rgba(52,211,153,0.35)", bg: "linear-gradient(135deg, rgba(5,18,12,0.96), rgba(7,22,16,0.98))" },
          ].map(({ label, subtitle, data, color, glow, bg }) => (
            <div
              key={label}
              className="projecao-card-premium"
              style={{
                position: "relative",
                overflow: "hidden",
                background: bg,
                border: `1px solid ${color}25`,
                borderRadius: "16px",
                padding: "20px 18px",
                textAlign: "center",
              }}
            >
              <div style={{
                position: "absolute",
                top: "-50px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                background: glow,
                filter: "blur(50px)",
                opacity: 0.5,
                pointerEvents: "none",
              }} />

              <div style={{ position: "relative", zIndex: 2 }}>
                <div style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.label,
                  letterSpacing: "0.22em",
                  color,
                  marginBottom: "4px",
                }}>{label}</div>
                <div style={{
                  ...TYPO.metric,
                  color: "rgba(255,255,255,0.4)",
                  marginBottom: "16px",
                  letterSpacing: "0.04em",
                }}>{subtitle}</div>

                <div style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.display,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.95)",
                  marginBottom: "8px",
                }}>{data?.preco || "—"}</div>

                <div style={{
                  display: "inline-block",
                  padding: "5px 12px",
                  borderRadius: "999px",
                  background: `${color}12`,
                  border: `1px solid ${color}30`,
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.metric,
                  color,
                  fontWeight: 800,
                }}>{data?.upside || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function CardSintese({ secao, semaforo }) {
  const texto = stripMd(secao.corpo.replace(/^#+.+$/m, "").replace(/^>\s*⚠️.+$/gm, "").trim());
  const aviso = stripMd(secao.corpo.match(/>\s*⚠️.+/)?.[0]?.replace(/^>\s*/, "").trim() || "");

  const cfg = semaforo === "verde"
    ? { color: "#34d399", glow: "rgba(52,211,153,0.30)", soft: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.25)", label: "CONCLUSÃO POSITIVA" }
    : semaforo === "vermelho"
    ? { color: "#f87171", glow: "rgba(248,113,113,0.30)", soft: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.25)", label: "CONCLUSÃO CAUTELOSA" }
    : { color: "#fbbf24", glow: "rgba(251,191,36,0.30)", soft: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.25)", label: "CONCLUSÃO NEUTRA" };

  return (
    <div
      style={{
        ...PREMIUM_CARD_STYLE,
        position: "relative",
        overflow: "hidden",
        borderColor: cfg.border,
        padding: "36px 32px",
      }}
    >
      <div style={{
        position: "absolute",
        top: "-160px",
        right: "-160px",
        width: "440px",
        height: "440px",
        borderRadius: "50%",
        background: cfg.glow,
        filter: "blur(100px)",
        opacity: 0.45,
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "-160px",
        left: "-160px",
        width: "380px",
        height: "380px",
        borderRadius: "50%",
        background: cfg.glow,
        filter: "blur(100px)",
        opacity: 0.25,
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "26px" }}>
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: cfg.color,
            boxShadow: `0 0 18px ${cfg.glow}`,
          }} />
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.label,
            letterSpacing: "0.22em",
            color: cfg.color,
          }}>Síntese Final · {cfg.label}</span>
          <div style={{
            flex: 1,
            height: "1px",
            background: `linear-gradient(90deg, ${cfg.color}40, transparent)`,
          }} />
        </div>

        <div style={{ position: "relative", paddingLeft: "28px", marginBottom: aviso ? "28px" : 0 }}>
          <div style={{
            position: "absolute",
            left: 0,
            top: "4px",
            bottom: "4px",
            width: "4px",
            borderRadius: "100px",
            background: `linear-gradient(180deg, ${cfg.color}, ${cfg.color}30)`,
            boxShadow: `0 0 24px ${cfg.glow}`,
          }} />

          <p style={{
            ...TYPO.display,
            color: "rgba(255,255,255,0.94)",
            margin: 0,
            fontWeight: 500,
            maxWidth: "920px",
          }}>{texto}</p>
        </div>

        {aviso && (
          <div style={{
            padding: "14px 16px",
            borderRadius: "12px",
            background: cfg.soft,
            border: `1px solid ${cfg.border}`,
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.metric,
            fontWeight: 400,
            color: "rgba(255,255,255,0.55)",
            letterSpacing: "0.02em",
          }}>{aviso}</div>
        )}

        <div style={{
          marginTop: "28px",
          paddingTop: "20px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.label,
            letterSpacing: "0.2em",
            color: "rgba(255,255,255,0.3)",
          }}>Qyntor · Relatório Institucional IA</span>
          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            ...TYPO.label,
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.3)",
            textTransform: "none",
          }}>Consolidado por IA · Não constitui recomendação</span>
        </div>
      </div>
    </div>
  );
}

function CardGenerico({ secao }) {
  return (
    <div style={{ ...PREMIUM_CARD_STYLE }}>
      <SectionLabel text={secao.titulo} color="rgba(255,255,255,0.6)" />
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents()}>{secao.corpo}</ReactMarkdown>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// RENDERIZAR SECAO (roteador de cards)
// ═══════════════════════════════════════════════════════════════════════════

function RenderizarSecao({ secao, semaforo, visivel }) {
  const style = { opacity: visivel ? 1 : 0, transform: visivel ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.4s ease, transform 0.4s ease" };
  let conteudo;
  switch (secao.tipo) {
    case "cabecalho": conteudo = <CardCabecalho secao={secao} />; break;
    case "sentimento": conteudo = <CardSentimento secao={secao} />; break;
    case "leitura": conteudo = <CardLeitura secao={secao} />; break;
    case "momento": conteudo = <CardMomento secao={secao} />; break;
    case "valuation": conteudo = <CardValuation secao={secao} />; break;
    case "perspectivas": conteudo = <CardPerspectivas secao={secao} />; break;
    case "forcas_riscos": conteudo = <CardForcasRiscos secao={secao} />; break;
    case "driver": conteudo = <CardDriver secao={secao} />; break;
    case "invalida": conteudo = <CardInvalida secao={secao} />; break;
    case "consenso": conteudo = <CardConsenso secao={secao} />; break;
    case "analistas": conteudo = <CardAnalistas secao={secao} />; break;
    case "distribuicao": conteudo = <CardDistribuicao secao={secao} />; break;
    case "projecoes": conteudo = <CardProjecoes secao={secao} />; break;
    case "sintese": conteudo = <CardSintese secao={secao} semaforo={semaforo} />; break;
    default: conteudo = <CardGenerico secao={secao} />; break;
  }
  return <div style={style}>{conteudo}</div>;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE RAIZ — RelatorioIA
// ═══════════════════════════════════════════════════════════════════════════
//
// PROPS:
//   secoes          — array parseado pelo parsearSecoes(buffer)
//   secoesVisiveis  — array de índices visíveis (para animação progressiva)
//   semaforo        — "verde" | "amarelo" | "vermelho" (vem do backend)
//   tickerAtual     — string com o ticker que está sendo analisado
//   cardsAbertos    — objeto { fluxo, quant, fundamentalista, dividendos }
//   onToggleCard    — função que recebe o id do card a abrir/fechar
//
// ═══════════════════════════════════════════════════════════════════════════

export default function RelatorioIA({
  secoes,
  secoesVisiveis,
  semaforo,
  tickerAtual,
  cardsAbertos,
  onToggleCard,
}) {
  if (!secoes || !secoes.length) return null;

  return (
    <>
      {secoes.map((secao, i) => (
        <React.Fragment key={i}>
          <RenderizarSecao
            secao={secao}
            semaforo={semaforo}
            visivel={secoesVisiveis.includes(i)}
          />

          {secao.tipo === "cabecalho" && tickerAtual && (
            <>
              <CardAccordion
                id="fluxo"
                titulo="Análise Quantitativa de Fluxo"
                subtitulo="Tendência, pressão compradora e leitura técnica"
                aberto={cardsAbertos?.fluxo}
                onToggle={onToggleCard}
              >
                <CardFluxo ticker={tickerAtual} />
              </CardAccordion>

              <CardAccordion
                id="quant"
                titulo="Análise Quant"
                subtitulo="Score próprio, leitura matemática e critérios quantitativos"
                aberto={cardsAbertos?.quant}
                onToggle={onToggleCard}
              >
                <CardQuant ticker={tickerAtual} />
              </CardAccordion>

              <CardAccordion
                id="fundamentalista"
                titulo="Análise Fundamentalista"
                subtitulo="Indicadores, qualidade da empresa e valuation"
                aberto={cardsAbertos?.fundamentalista}
                onToggle={onToggleCard}
              >
                <CardFundamentalista ticker={tickerAtual} />
              </CardAccordion>

              <CardAccordion
                id="dividendos"
                titulo="Análise de Dividendos"
                subtitulo="Histórico, yield e consistência de pagamento"
                aberto={cardsAbertos?.dividendos}
                onToggle={onToggleCard}
              >
                <CardDividendos ticker={tickerAtual} />
              </CardAccordion>

              <DivisorPercepcao />
            </>
          )}
        </React.Fragment>
      ))}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS NOMEADOS (caso queira reusar partes em outro lugar)
// ═══════════════════════════════════════════════════════════════════════════

export {
  RenderizarSecao,
  CardAccordion,
  CardSkeleton,
  DivisorPercepcao,
  CardCabecalho,
  CardSentimento,
  CardLeitura,
  CardMomento,
  CardValuation,
  CardPerspectivas,
  CardForcasRiscos,
  CardDriver,
  CardInvalida,
  CardConsenso,
  CardAnalistas,
  CardDistribuicao,
  CardProjecoes,
  CardSintese,
  CardGenerico,
  tickerParaTradingView,
  stripMd,
};
"use client";

// ═══════════════════════════════════════════════════════════════════════════
// RelatorioCarteira — Componente autossuficiente para a aba "Relatório IA"
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const MENSAGENS_LOADING = [
  "Buscando recomendacoes recentes na web...",
  "Lendo relatorios do InfoMoney e Money Times...",
  "Consultando cobertura do BTG Pactual...",
  "Verificando analises da XP Investimentos...",
  "Checando recomendacoes do Itau BBA...",
  "Analisando dados do Bradesco BBI e Safra...",
  "Pesquisando consenso de mercado...",
  "Verificando sentimento dos analistas...",
  "Coletando precos-alvo das casas de analise...",
  "Lendo noticias recentes do ativo...",
  "Verificando resultados trimestrais...",
  "Analisando cenario macroeconomico...",
  "Avaliando valuation atual do papel...",
  "Consolidando as teses dos analistas...",
  "Calculando upside e preco-alvo medio...",
  "Montando a tese unificada de mercado...",
  "Redigindo o relatorio final...",
  "Quase la, finalizando a analise...",
];

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

function parsearSecoes(texto) {
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
// CARD DE LOADING (aparece quando ainda não tem nenhuma seção)
// ═══════════════════════════════════════════════════════════════════════════

function CardLoadingIA({ ticker, faseAtual }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % MENSAGENS_LOADING.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const pct = faseAtual === "gerando"
    ? 100
    : Math.min(Math.round(((msgIndex + 1) / MENSAGENS_LOADING.length) * 88) + 5, 90);

  const steps = [
    {
      id: "coleta",
      label: faseAtual === "cache_hit" ? "Cache hit — dados disponíveis" : "Coleta de dados e recomendacoes",
      active: faseAtual === "coletando" || faseAtual === "cache_hit",
      done: faseAtual === "gerando",
      icon: faseAtual === "cache_hit" ? "⚡" : "01",
    },
    { id: "gerar", label: "Sintese e geracao do relatorio", active: faseAtual === "gerando", done: false, icon: "02" },
    { id: "blocos", label: "Blocos aparecem em tempo real", active: false, done: false, icon: "03" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div style={{ background: "rgba(6,10,24,0.9)", borderRadius: "20px", padding: "2.5rem 2rem", border: "1px solid rgba(52,211,153,0.1)", backdropFilter: "blur(20px)", boxShadow: "0 0 60px rgba(52,211,153,0.04), 0 40px 80px rgba(0,0,0,0.4)" }}>
        <div className="flex flex-col items-center gap-6">
          <div style={{ position: "relative", width: "56px", height: "56px" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(52,211,153,0.1)" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid transparent", borderTopColor: "#34d399", animation: "spin 1.2s linear infinite" }} />
            <div style={{ position: "absolute", inset: "6px", borderRadius: "50%", border: "1px solid transparent", borderBottomColor: "rgba(52,211,153,0.3)", animation: "spin 0.9s linear infinite reverse" }} />
            <div style={{ position: "absolute", inset: "14px", borderRadius: "50%", background: "rgba(52,211,153,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", animation: "pulse-dot 1.5s ease infinite" }} />
            </div>
          </div>

          <div className="text-center">
            <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: "18px", color: "rgba(255,255,255,0.9)", letterSpacing: "-0.02em" }}>
              Analisando <span style={{ color: "#34d399", fontFamily: "'IBM Plex Mono',monospace", fontSize: "17px" }}>{ticker}</span>
            </p>
            {faseAtual === "cache_hit" && <p className="text-green-400 text-sm mt-1">Dados em cache — relatorio em instantes</p>}
            {faseAtual === "coletando" && <p className="text-gray-400 text-sm mt-1">Pesquisando analistas e dados de mercado — pode levar ate 45 segundos</p>}
            {faseAtual === "gerando" && <p className="text-green-400 text-sm mt-1">Dados coletados — gerando o relatorio agora</p>}
          </div>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "4px" }}>
            {steps.map(step => (
              <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "8px", background: step.done ? "rgba(52,211,153,0.04)" : step.active ? "rgba(52,211,153,0.06)" : "rgba(255,255,255,0.01)", border: step.done || step.active ? "1px solid rgba(52,211,153,0.15)" : "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "10px", fontWeight: 600, color: step.done ? "#34d399" : step.active ? "rgba(52,211,153,0.7)" : "rgba(255,255,255,0.15)", minWidth: "22px" }}>{step.done ? "✓" : step.icon}</span>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: "12px", flex: 1, color: step.done || step.active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }}>{step.label}</span>
                {step.active && <div style={{ width: "12px", height: "12px", borderRadius: "50%", flexShrink: 0, border: "1.5px solid transparent", borderTopColor: "#34d399", animation: "spin 1s linear infinite" }} />}
              </div>
            ))}
          </div>

          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "10px", letterSpacing: "0.06em", color: "rgba(255,255,255,0.2)" }}>
                {faseAtual === "gerando" ? "GERANDO RELATORIO" : "COLETANDO DADOS"}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", fontWeight: 600, color: faseAtual === "gerando" ? "#34d399" : "rgba(52,211,153,0.5)" }}>{pct}%</span>
            </div>
            <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.04)", borderRadius: "100px", overflow: "hidden", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: "100px", width: pct + "%", background: "linear-gradient(90deg, rgba(52,211,153,0.4), #34d399)", boxShadow: "0 0 10px rgba(52,211,153,0.5)", transition: "width 2.2s cubic-bezier(0.4,0,0.2,1)" }} />
            </div>
          </div>

          {faseAtual === "coletando" && (
            <div style={{ width: "100%", background: "rgba(4,7,18,0.8)", border: "1px solid rgba(52,211,153,0.1)", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", minHeight: "40px" }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", color: "rgba(52,211,153,0.4)" }}>$</span>
              <p key={msgIndex} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", color: "rgba(52,211,153,0.65)", margin: 0 }}>{MENSAGENS_LOADING[msgIndex]}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BANNER DISCRETO
// ═══════════════════════════════════════════════════════════════════════════

function BannerGerando() {
  return (
    <div style={{
      background: "rgba(4,16,8,0.4)",
      border: "1px solid rgba(52,211,153,0.2)",
      borderRadius: "12px",
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
    }}>
      <div style={{
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        border: "2px solid rgba(52,211,153,0.3)",
        borderTopColor: "#34d399",
        animation: "spin 1s linear infinite",
        flexShrink: 0,
      }} />
      <p style={{
        fontFamily: "'IBM Plex Mono',monospace",
        fontSize: "12px",
        fontWeight: 600,
        color: "rgba(52,211,153,0.85)",
        margin: 0,
        letterSpacing: "0.02em",
      }}>
        Gerando próximas seções...
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SHARED — SectionLabel PREMIUM
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

// Token visual global premium — base de todos os cards
const PREMIUM_CARD_STYLE = {
  background: "linear-gradient(135deg, rgba(5,8,22,0.96), rgba(9,14,32,0.98))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "22px",
  backdropFilter: "blur(20px)",
  boxShadow: "0 20px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
  padding: "28px",
};

// Escala tipográfica unificada — 5 tamanhos controlados
const TYPO = {
  display:   { fontSize: "20px", fontWeight: 700, lineHeight: 1.4,  letterSpacing: "-0.015em" },
  bodyLarge: { fontSize: "15px", fontWeight: 500, lineHeight: 1.7,  letterSpacing: "-0.005em" },
  body:      { fontSize: "14px", fontWeight: 450, lineHeight: 1.7 },
  metric:    { fontSize: "13px", fontWeight: 500, lineHeight: 1.6 },
  label:     { fontSize: "10px", fontWeight: 700, lineHeight: 1.5,  letterSpacing: "0.16em", textTransform: "uppercase" },
};

// ═══════════════════════════════════════════════════════════════════════════
// WRAPPER COM ANIMAÇÃO DE FADE-IN
// ═══════════════════════════════════════════════════════════════════════════

function SecaoAnimada({ visivel, children }) {
  return (
    <div style={{
      opacity: visivel ? 1 : 0,
      transform: visivel ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.4s ease, transform 0.4s ease",
    }}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD CABEÇALHO PREMIUM (versão nova do ChatGPT — mantida)
// ═══════════════════════════════════════════════════════════════════════════

function CardCabecalho({ secao }) {
  function limparMarkdown(texto) {
    if (!texto) return "";
    return String(texto)
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/_([^_]+)_/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .trim();
  }

  function MiniInfoPremium({ label, value, color, sub }) {
    return (
      <div
        style={{
          padding: "14px",
          borderRadius: "18px",
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(14px)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            ...TYPO.label,
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.30)",
            marginBottom: "8px",
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            ...TYPO.bodyLarge,
            fontWeight: 800,
            color,
            letterSpacing: "-0.02em",
          }}
        >
          {value}
        </div>

        {sub && (
          <div
            style={{
              marginTop: "6px",
              fontFamily: "'IBM Plex Mono', monospace",
              ...TYPO.label,
              fontWeight: 500,
              textTransform: "none",
              letterSpacing: "0.04em",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            {sub}
          </div>
        )}
      </div>
    );
  }

  const tipo = limparMarkdown(
    (secao?.corpo?.match(/\*\*Tipo de ativo:\*\*\s*(.+)/)?.[1] || "").trim()
  );

  const linhaPreco = limparMarkdown(
    (secao?.corpo?.match(/\*\*Pre.o atual:\*\*\s*(.+)/)?.[1] || "").trim()
  );

  let dataLimpa = linhaPreco
    .replace(/(R\$\s*[\d.,]+|US\$\s*[\d.,]+|[\d.,]+)/g, "")
    .replace(/([+\-−]?\s*[\d.,]+\s*%)/g, "")
    .replace(/[·•|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const dataMatch = dataLimpa.match(
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/
  );

  const data = dataMatch ? dataMatch[1].trim() : "";

  const tickerMatch = secao?.titulo?.match(/^([A-Z0-9]+)/);
  const ticker = tickerMatch?.[1] || "";

  const nomeEmpresa = (secao?.titulo || "")
    .replace(ticker, "")
    .replace(/^\s*[—–-]\s*/, "")
    .trim();

  return (
    <>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "28px",
          background:
            "radial-gradient(circle at top left, rgba(52,211,153,0.16), transparent 32%), radial-gradient(circle at top right, rgba(96,165,250,0.14), transparent 30%), linear-gradient(135deg, rgba(5,8,22,0.98), rgba(9,14,32,0.98))",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(20px)",
          boxShadow:
            "0 40px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "260px",
            height: "260px",
            borderRadius: "50%",
            background: "rgba(52,211,153,0.10)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            bottom: "-140px",
            left: "-120px",
            width: "260px",
            height: "260px",
            borderRadius: "50%",
            background: "rgba(96,165,250,0.08)",
            filter: "blur(50px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, transparent, rgba(255,255,255,0.04), transparent)",
            animation: "premiumSweep 8s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        <div
          className="relatorio-premium-grid"
          style={{
            position: "relative",
            zIndex: 2,
            padding: "30px 28px",
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr",
            gap: "22px",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 12px",
                borderRadius: "999px",
                background: "rgba(52,211,153,0.08)",
                border: "1px solid rgba(52,211,153,0.18)",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#34d399",
                  boxShadow: "0 0 14px rgba(52,211,153,0.9)",
                }}
              />

              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: "#34d399",
                }}
              >
                QYNTOR
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: "14px",
                flexWrap: "wrap",
                marginBottom: "10px",
              }}
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "36px",
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                {ticker || "ATIVO"}
              </span>

              {nomeEmpresa && (
                <span
                  style={{
                    ...TYPO.body,
                    color: "rgba(255,255,255,0.45)",
                    fontWeight: 500,
                  }}
                >
                  {nomeEmpresa}
                </span>
              )}
            </div>

            {tipo && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 12px",
                  borderRadius: "999px",
                  background: "rgba(96,165,250,0.08)",
                  border: "1px solid rgba(96,165,250,0.18)",
                  marginBottom: "18px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#60a5fa",
                  }}
                />

                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.12em",
                    color: "#60a5fa",
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  {tipo}
                </span>
              </div>
            )}

            <p
              style={{
                maxWidth: "620px",
                margin: 0,
                ...TYPO.body,
                color: "rgba(255,255,255,0.58)",
              }}
            >
              Leitura institucional consolidada por IA com consenso de
              analistas, valuation, drivers, riscos, notícias recentes e
              sentimento atual de mercado.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <MiniInfoPremium label="Motor" value="IA + Web" color="#34d399" />
            <MiniInfoPremium label="Base" value="Analistas" color="#60a5fa" />
            <MiniInfoPremium label="Leitura" value="Institucional" color="#a78bfa" />
            <MiniInfoPremium
              label="Status"
              value="Atualizado"
              color="#fbbf24"
              sub={data || "tempo real"}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes premiumSweep {
          0% {
            transform: translateX(-120%);
            opacity: 0;
          }

          30% {
            opacity: 1;
          }

          60% {
            transform: translateX(120%);
            opacity: 0;
          }

          100% {
            transform: translateX(120%);
            opacity: 0;
          }
        }

        @media (max-width: 980px) {
          .relatorio-premium-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DEMAIS CARDS (RESTAURADOS — estavam faltando!)
// ═══════════════════════════════════════════════════════════════════════════

function CardSentimento({ secao }) {
  const { emoji, cor, label } = extrairSentimento(secao.corpo);
  const frase = stripMd(secao.corpo.split("\n").find(l => l.trim() && !l.includes(emoji) && !l.includes("##") && !l.startsWith("#") && l.trim().length > 10)?.trim() || "");

  const cfg = {
    verde:    { color: "#34d399", glow: "rgba(52,211,153,0.45)", soft: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.18)" },
    amarelo:  { color: "#fbbf24", glow: "rgba(251,191,36,0.40)", soft: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.18)" },
    vermelho: { color: "#f87171", glow: "rgba(248,113,113,0.45)", soft: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.18)" },
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
      {/* Glow ambiente */}
      <div
        style={{
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
        }}
      />

      <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
        {/* ESFERA GLOW ANIMADA */}
        <div style={{ position: "relative", width: "88px", height: "88px", flexShrink: 0 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${cfg.glow}, transparent 70%)`,
              filter: "blur(8px)",
              animation: "sentimentoPulse 3s ease-in-out infinite",
            }}
          />
          <div
            style={{
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
            }}
          >
            {emoji}
          </div>
        </div>

        {/* CONTEÚDO */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.label,
              color: "rgba(255,255,255,0.35)",
              marginBottom: "10px",
            }}
          >
            Sentimento de Mercado
          </div>

          <div
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.display,
              fontWeight: 800,
              color: cfg.color,
              marginBottom: "10px",
              textShadow: `0 0 30px ${cfg.glow}`,
            }}
          >
            {label.toUpperCase()}
          </div>

          {frase && (
            <p
              style={{
                ...TYPO.body,
                color: "rgba(255,255,255,0.7)",
                margin: 0,
                maxWidth: "640px",
              }}
            >
              {frase}
            </p>
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
    <div
      style={{
        ...PREMIUM_CARD_STYLE,
        position: "relative",
        overflow: "hidden",
        borderColor: "rgba(96,165,250,0.18)",
      }}
    >
      {/* Glow ambiente */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-80px",
          width: "320px",
          height: "320px",
          borderRadius: "50%",
          background: "rgba(96,165,250,0.08)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        <SectionLabel text="Tese Central" color="#60a5fa" icon="◆" />

        <div style={{ position: "relative", paddingLeft: "32px", paddingRight: "12px" }}>
          {/* Aspas decorativas */}
          <div
            style={{
              position: "absolute",
              left: "-4px",
              top: "-8px",
              fontFamily: "Georgia, serif",
              fontSize: "56px",
              fontWeight: 700,
              color: "rgba(96,165,250,0.22)",
              lineHeight: 1,
              pointerEvents: "none",
            }}
          >
            "
          </div>

          {/* Barra glow lateral */}
          <div
            style={{
              position: "absolute",
              left: "0",
              top: "12px",
              bottom: "12px",
              width: "3px",
              borderRadius: "100px",
              background: "linear-gradient(180deg, #60a5fa, rgba(96,165,250,0.1))",
              boxShadow: "0 0 18px rgba(96,165,250,0.6)",
            }}
          />

          <p
            style={{
              fontSize: "17px",
              fontWeight: 500,
              lineHeight: 1.7,
              letterSpacing: "-0.005em",
              color: "rgba(255,255,255,0.85)",
              margin: 0,
              maxWidth: "920px",
            }}
          >
            {frase}
          </p>
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
        {/* Linha vertical glow da timeline */}
        <div
          style={{
            position: "absolute",
            left: "9px",
            top: "10px",
            bottom: "10px",
            width: "1px",
            background: "linear-gradient(180deg, rgba(52,211,153,0.4), rgba(52,211,153,0.05))",
            boxShadow: "0 0 12px rgba(52,211,153,0.3)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {items.map((item, i) => (
            <div
              key={i}
              className="momento-item-premium"
              style={{
                position: "relative",
                paddingLeft: "36px",
                padding: "16px 16px 16px 36px",
                borderRadius: "14px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.05)",
                transition: "all 0.25s ease",
              }}
            >
              {/* Ponto da timeline */}
              <div
                style={{
                  position: "absolute",
                  left: "2px",
                  top: "22px",
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  background: "rgba(5,8,22,1)",
                  border: "2px solid #34d399",
                  boxShadow: "0 0 12px rgba(52,211,153,0.7)",
                }}
              />

              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: item.fonte || item.data ? "8px" : "0" }}>
                {item.fonte && (
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      ...TYPO.label,
                      color: "#34d399",
                      padding: "4px 9px",
                      borderRadius: "6px",
                      background: "rgba(52,211,153,0.08)",
                      border: "1px solid rgba(52,211,153,0.2)",
                    }}
                  >
                    {item.fonte.toUpperCase()}
                  </span>
                )}
                {item.data && (
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      ...TYPO.label,
                      letterSpacing: "0.05em",
                      color: "rgba(255,255,255,0.35)",
                      textTransform: "none",
                    }}
                  >
                    {item.data}
                  </span>
                )}
              </div>

              <p style={{ ...TYPO.body, color: "rgba(255,255,255,0.82)", margin: 0 }}>
                {item.texto}
              </p>
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
            <span
              style={{
                color: "#60a5fa",
                fontSize: "10px",
                marginTop: "5px",
                flexShrink: 0,
                lineHeight: 1,
              }}
            >
              ◆
            </span>
            <span style={{ ...TYPO.body, color: "rgba(255,255,255,0.82)" }}>
              {t}
            </span>
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
        {/* Linha vertical glow */}
        <div
          style={{
            position: "absolute",
            left: "9px",
            top: "8px",
            bottom: "8px",
            width: "1px",
            background: "linear-gradient(180deg, rgba(167,139,250,0.5), rgba(167,139,250,0.05))",
            boxShadow: "0 0 14px rgba(167,139,250,0.3)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {items.map((item, i) => {
            const h = getHorizonte(item);
            return (
              <div
                key={i}
                style={{
                  position: "relative",
                  paddingLeft: "36px",
                  padding: "14px 16px 14px 36px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {/* Ponto animado da timeline */}
                <div
                  style={{
                    position: "absolute",
                    left: "2px",
                    top: "20px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "rgba(5,8,22,1)",
                    border: `2px solid ${h.color}`,
                    boxShadow: `0 0 14px ${h.glow}`,
                  }}
                />

                <span
                  style={{
                    display: "inline-block",
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.label,
                    color: h.color,
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: `${h.color}10`,
                    border: `1px solid ${h.color}25`,
                    marginBottom: "8px",
                  }}
                >
                  {h.label}
                </span>

                <p style={{ ...TYPO.body, color: "rgba(255,255,255,0.82)", margin: 0 }}>
                  {item}
                </p>
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

      <div className="matriz-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* FORÇAS */}
        <div
          style={{
            ...PREMIUM_CARD_STYLE,
            position: "relative",
            overflow: "hidden",
            borderColor: "rgba(52,211,153,0.22)",
            background:
              "linear-gradient(135deg, rgba(5,18,12,0.96), rgba(7,22,16,0.98))",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-90px",
              right: "-90px",
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              background: "rgba(52,211,153,0.12)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />

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
                  <div
                    style={{
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
                    }}
                  >
                    +
                  </div>
                  <span style={{ ...TYPO.metric, color: "rgba(52,211,153,0.9)" }}>
                    {f}
                  </span>
                </li>
              )) : (
                <li style={{ fontSize: "12px", color: "rgba(52,211,153,0.3)", padding: "8px 0" }}>
                  Dados insuficientes.
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* RISCOS */}
        <div
          style={{
            ...PREMIUM_CARD_STYLE,
            position: "relative",
            overflow: "hidden",
            borderColor: "rgba(248,113,113,0.22)",
            background:
              "linear-gradient(135deg, rgba(22,5,8,0.96), rgba(28,7,10,0.98))",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-90px",
              right: "-90px",
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              background: "rgba(248,113,113,0.12)",
              filter: "blur(60px)",
              pointerEvents: "none",
            }}
          />

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
                  <div
                    style={{
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
                    }}
                  >
                    −
                  </div>
                  <span style={{ ...TYPO.metric, color: "rgba(248,113,113,0.88)" }}>
                    {r}
                  </span>
                </li>
              )) : (
                <li style={{ fontSize: "12px", color: "rgba(248,113,113,0.3)", padding: "8px 0" }}>
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
      <div
        style={{
          position: "absolute",
          top: "-80px",
          left: "-80px",
          width: "260px",
          height: "260px",
          borderRadius: "50%",
          background: "rgba(96,165,250,0.10)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        <SectionLabel text="Driver Central da Tese" color="#60a5fa" icon="🎯" />

        <div style={{ position: "relative", paddingLeft: "24px" }}>
          {/* Borda lateral premium */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "8px",
              bottom: "8px",
              width: "3px",
              borderRadius: "100px",
              background: "linear-gradient(180deg, #60a5fa, rgba(96,165,250,0.1))",
              boxShadow: "0 0 16px rgba(96,165,250,0.6)",
            }}
          />

          <p
            style={{
              ...TYPO.bodyLarge,
              color: "rgba(255,255,255,0.85)",
              margin: 0,
              maxWidth: "880px",
            }}
          >
            {texto}
          </p>
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
      <div
        style={{
          position: "absolute",
          top: "-90px",
          right: "-90px",
          width: "260px",
          height: "260px",
          borderRadius: "50%",
          background: "rgba(248,113,113,0.08)",
          filter: "blur(70px)",
          pointerEvents: "none",
        }}
      />

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
                <div
                  style={{
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
                  }}
                >
                  ×
                </div>
                <span style={{ ...TYPO.metric, color: "rgba(248,113,113,0.85)" }}>
                  {b}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ ...TYPO.body, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            {texto}
          </p>
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
              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.label,
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: "10px",
                }}
              >
                {m.key}
              </div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.display,
                  fontWeight: 800,
                  color: corValor,
                  textShadow: corGlow !== "transparent" ? `0 0 18px ${corGlow}` : "none",
                }}
              >
                {m.val}
              </div>
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

                  // Coluna de TEXTO (nome de corretora, leitura, descrição) usa Inter
                  // Coluna de NÚMERO (preço-alvo, upside, data) usa Mono
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
                        fontWeight: isUp || isDown ? 700 : isTextColumn ? 500 : 500,
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

      {/* Barra empilhada premium */}
      <div
        style={{
          height: "12px",
          borderRadius: "100px",
          overflow: "hidden",
          background: "rgba(255,255,255,0.04)",
          display: "flex",
          gap: "3px",
          marginBottom: "20px",
          padding: "2px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {comprar > 0 && (
          <div
            style={{
              background: "linear-gradient(90deg, #34d399, #10b981)",
              borderRadius: "100px",
              width: pct(comprar) + "%",
              boxShadow: "0 0 12px rgba(52,211,153,0.5)",
            }}
          />
        )}
        {manter > 0 && (
          <div
            style={{
              background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
              borderRadius: "100px",
              width: pct(manter) + "%",
              boxShadow: "0 0 12px rgba(251,191,36,0.5)",
            }}
          />
        )}
        {vender > 0 && (
          <div
            style={{
              background: "linear-gradient(90deg, #f87171, #ef4444)",
              borderRadius: "100px",
              width: pct(vender) + "%",
              boxShadow: "0 0 12px rgba(248,113,113,0.5)",
            }}
          />
        )}
      </div>

      {/* Cards de cada categoria */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
        {[
          { label: "COMPRAR", v: comprar, color: "#34d399", bg: "rgba(52,211,153,0.06)", border: "rgba(52,211,153,0.2)" },
          { label: "MANTER", v: manter, color: "#fbbf24", bg: "rgba(251,191,36,0.06)", border: "rgba(251,191,36,0.2)" },
          { label: "VENDER", v: vender, color: "#f87171", bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.2)" },
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
            <div
              style={{
                fontFamily: "'IBM Plex Mono',monospace",
                ...TYPO.label,
                letterSpacing: "0.18em",
                color: c.color,
                marginBottom: "8px",
              }}
            >
              {c.label}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.display,
                  fontWeight: 800,
                  color: c.color,
                  textShadow: `0 0 18px ${c.color}40`,
                }}
              >
                {c.v}
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono',monospace",
                  ...TYPO.metric,
                  fontWeight: 700,
                  color: `${c.color}99`,
                }}
              >
                {pct(c.v)}%
              </span>
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
        .projecao-card-premium:hover {
          transform: translateY(-3px);
        }
      `}</style>

      <div style={{ ...PREMIUM_CARD_STYLE }}>
        <SectionLabel text="Cenários Institucionais" color="rgba(255,255,255,0.7)" icon="📐" />

        <div
          className="projecoes-grid-premium"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}
        >
          {[
            { label: "BEAR", subtitle: "Cenário Cautela", data: bear, color: "#f87171", glow: "rgba(248,113,113,0.35)", bg: "linear-gradient(135deg, rgba(22,5,8,0.96), rgba(28,7,10,0.98))" },
            { label: "BASE", subtitle: "Referência",     data: base, color: "#fbbf24", glow: "rgba(251,191,36,0.30)", bg: "linear-gradient(135deg, rgba(22,16,5,0.96), rgba(28,20,7,0.98))" },
            { label: "BULL", subtitle: "Cenário Otimista", data: bull, color: "#34d399", glow: "rgba(52,211,153,0.35)", bg: "linear-gradient(135deg, rgba(5,18,12,0.96), rgba(7,22,16,0.98))" },
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
              {/* Glow ambiente */}
              <div
                style={{
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
                }}
              />

              <div style={{ position: "relative", zIndex: 2 }}>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.label,
                    letterSpacing: "0.22em",
                    color,
                    marginBottom: "4px",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    ...TYPO.metric,
                    color: "rgba(255,255,255,0.4)",
                    marginBottom: "16px",
                    letterSpacing: "0.04em",
                  }}
                >
                  {subtitle}
                </div>

                <div
                  style={{
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.display,
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.95)",
                    marginBottom: "8px",
                  }}
                >
                  {data?.preco || "—"}
                </div>

                <div
                  style={{
                    display: "inline-block",
                    padding: "5px 12px",
                    borderRadius: "999px",
                    background: `${color}12`,
                    border: `1px solid ${color}30`,
                    fontFamily: "'IBM Plex Mono',monospace",
                    ...TYPO.metric,
                    color,
                    fontWeight: 800,
                  }}
                >
                  {data?.upside || "—"}
                </div>
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
      {/* Glow ambiente massivo */}
      <div
        style={{
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
        }}
      />
      <div
        style={{
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
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Header executivo */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "26px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: cfg.color,
              boxShadow: `0 0 18px ${cfg.glow}`,
            }}
          />
          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.label,
              letterSpacing: "0.22em",
              color: cfg.color,
            }}
          >
            Síntese Final · {cfg.label}
          </span>
          <div
            style={{
              flex: 1,
              height: "1px",
              background: `linear-gradient(90deg, ${cfg.color}40, transparent)`,
            }}
          />
        </div>

        {/* Texto principal premium */}
        <div style={{ position: "relative", paddingLeft: "28px", marginBottom: aviso ? "28px" : 0 }}>
          {/* Barra glow lateral grossa */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "4px",
              bottom: "4px",
              width: "4px",
              borderRadius: "100px",
              background: `linear-gradient(180deg, ${cfg.color}, ${cfg.color}30)`,
              boxShadow: `0 0 24px ${cfg.glow}`,
            }}
          />

          <p
            style={{
              ...TYPO.display,
              color: "rgba(255,255,255,0.94)",
              margin: 0,
              fontWeight: 500,
              maxWidth: "920px",
            }}
          >
            {texto}
          </p>
        </div>

        {/* Aviso institucional */}
        {aviso && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: cfg.soft,
              border: `1px solid ${cfg.border}`,
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.metric,
              fontWeight: 400,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: "0.02em",
            }}
          >
            {aviso}
          </div>
        )}

        {/* Assinatura institucional */}
        <div
          style={{
            marginTop: "28px",
            paddingTop: "20px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.label,
              letterSpacing: "0.2em",
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Qyntor · Relatório Institucional IA
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono',monospace",
              ...TYPO.label,
              letterSpacing: "0.1em",
              color: "rgba(255,255,255,0.3)",
              textTransform: "none",
            }}
          >
            Consolidado por IA · Não constitui recomendação
          </span>
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
// ROTEADOR DE CARDS
// ═══════════════════════════════════════════════════════════════════════════

function RenderizarSecao({ secao, semaforo }) {
  switch (secao.tipo) {
    case "cabecalho": return <CardCabecalho secao={secao} />;
    case "sentimento": return <CardSentimento secao={secao} />;
    case "leitura": return <CardLeitura secao={secao} />;
    case "momento": return <CardMomento secao={secao} />;
    case "valuation": return <CardValuation secao={secao} />;
    case "perspectivas": return <CardPerspectivas secao={secao} />;
    case "forcas_riscos": return <CardForcasRiscos secao={secao} />;
    case "driver": return <CardDriver secao={secao} />;
    case "invalida": return <CardInvalida secao={secao} />;
    case "consenso": return <CardConsenso secao={secao} />;
    case "analistas": return <CardAnalistas secao={secao} />;
    case "distribuicao": return <CardDistribuicao secao={secao} />;
    case "projecoes": return <CardProjecoes secao={secao} />;
    case "sintese": return <CardSintese secao={secao} semaforo={semaforo} />;
    default: return <CardGenerico secao={secao} />;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — RelatorioCarteira
// ═══════════════════════════════════════════════════════════════════════════

export default function RelatorioCarteira({ ticker }) {
  const [loading, setLoading] = useState(false);
  const [buffer, setBuffer] = useState("");
  const [faseAtual, setFaseAtual] = useState(null);
  const [semaforo, setSemaforo] = useState("amarelo");
  const [secoesVisiveis, setSecoesVisiveis] = useState([]);
  const [erro, setErro] = useState("");

  const abortRef = useRef(null);
  const secoes = parsearSecoes(buffer);

  // Reset quando muda o ticker
  useEffect(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
    setBuffer("");
    setFaseAtual(null);
    setSemaforo("amarelo");
    setSecoesVisiveis([]);
    setErro("");
  }, [ticker]);

  // RENDER PROGRESSIVO
  useEffect(() => {
    if (secoes.length === 0) return;
    secoes.forEach((_, i) => {
      if (!secoesVisiveis.includes(i)) {
        const delay = Math.max(0, i - secoesVisiveis.length) * 150;
        setTimeout(() => {
          setSecoesVisiveis(prev => prev.includes(i) ? prev : [...prev, i]);
        }, delay);
      }
    });
  }, [secoes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  async function gerarRelatorio() {
    if (!ticker || loading) return;

    setLoading(true);
    setBuffer("");
    setFaseAtual("coletando");
    setSemaforo("amarelo");
    setSecoesVisiveis([]);
    setErro("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Erro " + res.status);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acumulado = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        acumulado += chunk;

        const linhas = acumulado.split("\n\n");
        acumulado = linhas.pop() || "";

        for (const linha of linhas) {
          if (!linha.startsWith("data: ")) continue;
          const payload = linha.slice(6).trim();
          if (!payload) continue;

          if (payload === "[DONE]") {
            setFaseAtual(null);
            continue;
          }

          try {
            const ev = JSON.parse(payload);
            if (ev.text) setBuffer(prev => prev + ev.text);
            if (ev.fase) setFaseAtual(ev.fase);
            if (ev.semaforo) setSemaforo(ev.semaforo);
            if (ev.error) setErro(ev.error);
          } catch (e) {
            // ignora payload nao-JSON
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Erro ao gerar relatorio:", err);
        setErro("Nao foi possivel gerar o relatorio. Tente novamente.");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  // ── ESTADO 1: Sem ticker ──────────────────────────────────────────────────
  if (!ticker) {
    return (
      <div style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "12px",
        padding: "32px 24px",
        textAlign: "center",
        color: "rgba(255,255,255,0.45)",
      }}>
        Selecione um ticker na watchlist para gerar o relatório.
      </div>
    );
  }

  // ── ESTADO 2: Loading inicial ─────────────────────────────────────────────
  if (loading && secoes.length === 0) {
    return <CardLoadingIA ticker={ticker} faseAtual={faseAtual} />;
  }

  // ── ESTADO 3: Botao inicial ──────────────────────────────────────────────
  if (!loading && secoes.length === 0) {
    return (
      <div style={{
        border: "1px solid rgba(96,165,250,0.18)",
        background: "linear-gradient(135deg, rgba(96,165,250,0.06), rgba(96,165,250,0.02))",
        borderRadius: "14px",
        padding: "32px 24px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "28px", marginBottom: "12px" }}>📊</div>
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: "#60a5fa",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}>
          Relatorio de IA
        </div>
        <div style={{
          fontSize: "14px",
          color: "rgba(255,255,255,0.65)",
          marginBottom: "20px",
          lineHeight: 1.6,
          maxWidth: "440px",
          margin: "0 auto 20px",
        }}>
          Gera uma análise consolidada de <strong style={{ color: "#fff" }}>{ticker}</strong> a partir
          de recomendações de analistas, notícias recentes e percepção do mercado.
        </div>

        {erro && (
          <div style={{
            marginBottom: "16px",
            padding: "10px 14px",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: "8px",
            color: "#f87171",
            fontSize: "12px",
            fontFamily: "'IBM Plex Mono',monospace",
            maxWidth: "440px",
            margin: "0 auto 16px",
          }}>
            {erro}
          </div>
        )}

        <button
          type="button"
          onClick={gerarRelatorio}
          style={{
            padding: "10px 22px",
            borderRadius: "10px",
            border: "1px solid rgba(96,165,250,0.4)",
            background: "linear-gradient(135deg, rgba(96,165,250,0.15), rgba(96,165,250,0.05))",
            color: "#60a5fa",
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          ⚡ Gerar BUSCA NA WEB
        </button>

        <div style={{
          marginTop: "16px",
          fontSize: "10px",
          color: "rgba(255,255,255,0.3)",
          fontFamily: "'IBM Plex Mono',monospace",
          letterSpacing: "0.06em",
        }}>
          PODE LEVAR ATÉ 45 SEGUNDOS · BUSCA DIRETA NA WEB
        </div>
      </div>
    );
  }

  // ── ESTADO 4: Cards aparecendo progressivamente ──
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {loading && <BannerGerando />}

      {secoes.map((secao, i) => (
        <SecaoAnimada key={i} visivel={secoesVisiveis.includes(i)}>
          <RenderizarSecao secao={secao} semaforo={semaforo} />
        </SecaoAnimada>
      ))}
    </div>
  );
}
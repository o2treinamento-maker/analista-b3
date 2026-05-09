"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── LOADING MESSAGES ────────────────────────────────────────────────────────
const MENSAGENS_LOADING = [
  "🔍 Buscando recomendações recentes na web...",
  "📰 Lendo relatórios do InfoMoney e Money Times...",
  "📊 Consultando cobertura do BTG Pactual...",
  "📈 Verificando análises da XP Investimentos...",
  "🏦 Checando recomendações do Itaú BBA...",
  "📋 Analisando dados do Bradesco BBI e Safra...",
  "🔎 Pesquisando consenso de mercado...",
  "📡 Verificando sentimento dos analistas...",
  "💹 Coletando preços-alvo das casas de análise...",
  "🗞️ Lendo notícias recentes do ativo...",
  "📉 Verificando resultados trimestrais...",
  "🌐 Analisando cenário macroeconômico...",
  "⚖️ Avaliando valuation atual do papel...",
  "💡 Consolidando as teses dos analistas...",
  "📐 Calculando upside e preço-alvo médio...",
  "🧠 Montando a tese unificada de mercado...",
  "✍️ Redigindo o relatório final...",
  "⏳ Quase lá, finalizando a análise...",
];

const EXEMPLOS = ["PETR4", "BBAS3", "VALE3", "CMIG3"];
let exemploIdx = 0;

// ─── TICKER TAPE ─────────────────────────────────────────────────────────────
const COTACOES_TAPE = [
  { ticker: "IBOV",  preco: "127.305",   variacao: "+1,02%", positivo: true  },
  { ticker: "PETR4", preco: "R$49,08",   variacao: "+1,2%",  positivo: true  },
  { ticker: "VALE3", preco: "R$58,32",   variacao: "-0,8%",  positivo: false },
  { ticker: "ITUB4", preco: "R$35,90",   variacao: "+0,5%",  positivo: true  },
  { ticker: "WEGE3", preco: "R$52,14",   variacao: "+2,1%",  positivo: true  },
  { ticker: "BBAS3", preco: "R$28,45",   variacao: "-0,3%",  positivo: false },
  { ticker: "NVDA",  preco: "US$875,40", variacao: "+3,2%",  positivo: true  },
  { ticker: "AAPL",  preco: "US$189,50", variacao: "+0,8%",  positivo: true  },
  { ticker: "EMBR3", preco: "R$48,72",   variacao: "+1,8%",  positivo: true  },
  { ticker: "RENT3", preco: "R$19,34",   variacao: "-1,1%",  positivo: false },
  { ticker: "TSLA",  preco: "US$175,20", variacao: "+2,4%",  positivo: true  },
  { ticker: "ABEV3", preco: "R$12,88",   variacao: "+0,3%",  positivo: true  },
  { ticker: "SUZB3", preco: "R$43,90",   variacao: "-0,6%",  positivo: false },
  { ticker: "META",  preco: "US$512,30", variacao: "+1,5%",  positivo: true  },
];

function TickerTape() {
  const [cotacoes, setCotacoes] = useState(COTACOES_TAPE);
  useEffect(() => {
    const interval = setInterval(() => {
      setCotacoes(prev => prev.map(c => {
        const delta = (Math.random() - 0.5) * 0.3;
        const varNum = parseFloat(c.variacao.replace("%","").replace("+","").replace(",",".")) + delta;
        const positivo = varNum >= 0;
        return { ...c, variacao: (positivo ? "+" : "") + varNum.toFixed(2).replace(".",",") + "%", positivo };
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  const items = [...cotacoes, ...cotacoes, ...cotacoes];
  return (
    <div style={{
      height: "36px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(4,7,18,0.95)",
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      whiteSpace: "nowrap",
      fontSize: "11px",
      letterSpacing: "0.02em",
      position: "relative",
    }}>
      {/* fade edges */}
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:"80px",background:"linear-gradient(90deg,rgba(4,7,18,1),transparent)",zIndex:2,pointerEvents:"none"}} />
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:"80px",background:"linear-gradient(270deg,rgba(4,7,18,1),transparent)",zIndex:2,pointerEvents:"none"}} />
      <div className="ticker-animation" style={{ display:"flex", gap:"0", paddingLeft:"2rem", width:"max-content" }}>
        {items.map((c, i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:"6px",padding:"0 20px",borderRight:"1px solid rgba(255,255,255,0.05)"}}>
            <span style={{color:"rgba(255,255,255,0.5)",fontWeight:500,fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px"}}>{c.ticker}</span>
            <span style={{color:"rgba(255,255,255,0.25)",fontSize:"10px"}}>{c.preco}</span>
            <span style={{
              color: c.positivo ? "#34d399" : "#f87171",
              fontWeight: 600,
              fontSize: "10px",
              fontFamily: "'IBM Plex Mono',monospace",
            }}>
              {c.positivo ? "+" : ""}{c.variacao}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CATEGORIAS ───────────────────────────────────────────────────────────────
const CATEGORIAS = [
  {
    id: "ibovespa", label: "📈 Ibovespa",
    descricao: "Ações do Ibovespa",
    subtitulo: "As principais ações da bolsa brasileira, que compõem o principal índice da B3",
    ativos: [
      { ticker:"ABEV3",  nome:"Ambev" },          { ticker:"ASAI3",  nome:"Assaí" },
      { ticker:"AZUL4",  nome:"Azul" },            { ticker:"B3SA3",  nome:"B3" },
      { ticker:"BBAS3",  nome:"Banco do Brasil" }, { ticker:"BBDC3",  nome:"Bradesco ON" },
      { ticker:"BBDC4",  nome:"Bradesco PN" },     { ticker:"BBSE3",  nome:"BB Seguridade" },
      { ticker:"BEEF3",  nome:"Minerva" },         { ticker:"BPAC11", nome:"BTG Pactual" },
      { ticker:"BRAP4",  nome:"Bradespar" },       { ticker:"BRFS3",  nome:"BRF" },
      { ticker:"BRKM5",  nome:"Braskem" },         { ticker:"CMIG4",  nome:"Cemig" },
      { ticker:"CMIN3",  nome:"CSN Mineração" },   { ticker:"COGN3",  nome:"Cogna" },
      { ticker:"CPFE3",  nome:"CPFL Energia" },    { ticker:"CPLE6",  nome:"Copel" },
      { ticker:"CSAN3",  nome:"Cosan" },           { ticker:"CSNA3",  nome:"CSN" },
      { ticker:"CYRE3",  nome:"Cyrela" },          { ticker:"DXCO3",  nome:"Dexco" },
      { ticker:"EGIE3",  nome:"Engie Brasil" },    { ticker:"ELET3",  nome:"Eletrobras ON" },
      { ticker:"ELET6",  nome:"Eletrobras PNB" },  { ticker:"EMBR3",  nome:"Embraer" },
      { ticker:"ENEV3",  nome:"Eneva" },           { ticker:"ENGI11", nome:"Energisa" },
      { ticker:"EQTL3",  nome:"Equatorial" },      { ticker:"EZTC3",  nome:"EZTEC" },
      { ticker:"FLRY3",  nome:"Fleury" },          { ticker:"GGBR4",  nome:"Gerdau" },
      { ticker:"GOAU4",  nome:"Metalúrgica Gerdau"},{ ticker:"HAPV3", nome:"Hapvida" },
      { ticker:"HYPE3",  nome:"Hypera" },          { ticker:"IGTI11", nome:"Iguatemi" },
      { ticker:"IRBR3",  nome:"IRB Brasil" },      { ticker:"ITSA4",  nome:"Itaúsa" },
      { ticker:"ITUB4",  nome:"Itaú Unibanco" },   { ticker:"JBSS3",  nome:"JBS" },
      { ticker:"KLBN11", nome:"Klabin" },          { ticker:"LREN3",  nome:"Lojas Renner" },
      { ticker:"MGLU3",  nome:"Magazine Luiza" },  { ticker:"MRFG3",  nome:"Marfrig" },
      { ticker:"MRVE3",  nome:"MRV" },             { ticker:"MULT3",  nome:"Multiplan" },
      { ticker:"NTCO3",  nome:"Grupo Natura" },    { ticker:"PCAR3",  nome:"GPA" },
      { ticker:"PETR3",  nome:"Petrobras ON" },    { ticker:"PETR4",  nome:"Petrobras PN" },
      { ticker:"PETZ3",  nome:"Petz" },            { ticker:"PRIO3",  nome:"PRIO" },
      { ticker:"PSSA3",  nome:"Porto Seguro" },    { ticker:"RADL3",  nome:"Raia Drogasil" },
      { ticker:"RAIL3",  nome:"Rumo" },            { ticker:"RAIZ4",  nome:"Raízen" },
      { ticker:"RDOR3",  nome:"Rede D'Or" },       { ticker:"RENT3",  nome:"Localiza" },
      { ticker:"RRRP3",  nome:"3R Petroleum" },    { ticker:"SANB11", nome:"Santander" },
      { ticker:"SBSP3",  nome:"Sabesp" },          { ticker:"SLCE3",  nome:"SLC Agrícola" },
      { ticker:"SMTO3",  nome:"São Martinho" },    { ticker:"STBP3",  nome:"Santos Brasil" },
      { ticker:"SUZB3",  nome:"Suzano" },          { ticker:"TAEE11", nome:"Taesa" },
      { ticker:"TIMS3",  nome:"TIM" },             { ticker:"TOTS3",  nome:"TOTVS" },
      { ticker:"UGPA3",  nome:"Ultrapar" },        { ticker:"USIM5",  nome:"Usiminas" },
      { ticker:"VALE3",  nome:"Vale" },            { ticker:"VBBR3",  nome:"Vibra Energia" },
      { ticker:"VIVT3",  nome:"Telefônica Brasil"},{ ticker:"WEGE3",  nome:"WEG" },
      { ticker:"YDUQ3",  nome:"Yduqs" },
    ],
  },
  {
    id: "dividendos", label: "💰 Dividendos",
    descricao: "Ações do índice de dividendos (IDIV)",
    subtitulo: "Ações do índice IDIV — empresas com histórico relevante de distribuição de proventos",
    ativos: [
      { ticker:"ABEV3",  nome:"Ambev" },           { ticker:"BBAS3",  nome:"Banco do Brasil" },
      { ticker:"BBDC3",  nome:"Bradesco ON" },      { ticker:"BBDC4",  nome:"Bradesco PN" },
      { ticker:"BBSE3",  nome:"BB Seguridade" },    { ticker:"BPAC11", nome:"BTG Pactual" },
      { ticker:"CMIG4",  nome:"Cemig" },            { ticker:"CPFE3",  nome:"CPFL Energia" },
      { ticker:"CPLE6",  nome:"Copel" },            { ticker:"CSAN3",  nome:"Cosan" },
      { ticker:"EGIE3",  nome:"Engie Brasil" },     { ticker:"ELET3",  nome:"Eletrobras ON" },
      { ticker:"ELET6",  nome:"Eletrobras PNB" },   { ticker:"ENEV3",  nome:"Eneva" },
      { ticker:"EQTL3",  nome:"Equatorial" },       { ticker:"ITSA4",  nome:"Itaúsa" },
      { ticker:"ITUB4",  nome:"Itaú Unibanco" },    { ticker:"JBSS3",  nome:"JBS" },
      { ticker:"KLBN11", nome:"Klabin" },           { ticker:"PETR3",  nome:"Petrobras ON" },
      { ticker:"PETR4",  nome:"Petrobras PN" },     { ticker:"PRIO3",  nome:"PRIO" },
      { ticker:"PSSA3",  nome:"Porto Seguro" },     { ticker:"SANB11", nome:"Santander" },
      { ticker:"SBSP3",  nome:"Sabesp" },           { ticker:"SUZB3",  nome:"Suzano" },
      { ticker:"TAEE11", nome:"Taesa" },            { ticker:"TIMS3",  nome:"TIM" },
      { ticker:"TOTS3",  nome:"TOTVS" },            { ticker:"UGPA3",  nome:"Ultrapar" },
      { ticker:"VALE3",  nome:"Vale" },             { ticker:"VIVT3",  nome:"Telefônica Brasil" },
    ],
  },
  {
    id: "smallcaps", label: "🔬 Small Caps",
    descricao: "Ações do índice Small Caps (SMLL)",
    subtitulo: "Ações menores da bolsa brasileira com maior potencial de crescimento",
    ativos: [
      { ticker:"AERI3",  nome:"Aeris" },           { ticker:"AGRO3",  nome:"BrasilAgro" },
      { ticker:"ALPA4",  nome:"Alpargatas" },       { ticker:"AMAR3",  nome:"Marisa" },
      { ticker:"AMBP3",  nome:"Ambipar" },          { ticker:"ANIM3",  nome:"Ânima" },
      { ticker:"ARML3",  nome:"Armac" },            { ticker:"BHIA3",  nome:"Casas Bahia" },
      { ticker:"BLAU3",  nome:"Blau Farmacêutica"},{ ticker:"CBAV3",  nome:"CBA" },
      { ticker:"CMIN3",  nome:"CSN Mineração" },    { ticker:"CURY3",  nome:"Cury" },
      { ticker:"DIRR3",  nome:"Direcional" },       { ticker:"DXCO3",  nome:"Dexco" },
      { ticker:"EVEN3",  nome:"Even" },             { ticker:"EZTC3",  nome:"EZTEC" },
      { ticker:"FRAS3",  nome:"Fras-le" },          { ticker:"GFSA3",  nome:"Gafisa" },
      { ticker:"GRND3",  nome:"Grendene" },         { ticker:"HBOR3",  nome:"Helbor" },
      { ticker:"INTB3",  nome:"Intelbras" },        { ticker:"JHSF3",  nome:"JHSF" },
      { ticker:"JSLG3",  nome:"JSL" },              { ticker:"KEPL3",  nome:"Kepler Weber" },
      { ticker:"LAVV3",  nome:"Lavvi" },            { ticker:"LEVE3",  nome:"Mahle Metal Leve" },
      { ticker:"LOGG3",  nome:"LOG CP" },           { ticker:"MATD3",  nome:"Mater Dei" },
      { ticker:"MDIA3",  nome:"M. Dias Branco" },   { ticker:"MOVI3",  nome:"Movida" },
      { ticker:"MULT3",  nome:"Multiplan" },        { ticker:"MYPK3",  nome:"Iochpe-Maxion" },
      { ticker:"ONCO3",  nome:"Oncoclínicas" },     { ticker:"ORVR3",  nome:"Orizon" },
      { ticker:"POMO4",  nome:"Marcopolo" },        { ticker:"RECV3",  nome:"PetroRecôncavo" },
      { ticker:"SLCE3",  nome:"SLC Agrícola" },     { ticker:"SMFT3",  nome:"Smart Fit" },
      { ticker:"SMTO3",  nome:"São Martinho" },     { ticker:"STBP3",  nome:"Santos Brasil" },
      { ticker:"TEND3",  nome:"Tenda" },            { ticker:"TUPY3",  nome:"Tupy" },
      { ticker:"VAMO3",  nome:"Vamos" },            { ticker:"VULC3",  nome:"Vulcabras" },
      { ticker:"WEGE3",  nome:"WEG" },              { ticker:"YDUQ3",  nome:"Yduqs" },
    ],
  },
];

const TICKERS_PERMITIDOS = new Set(
  CATEGORIAS.flatMap(c => c.ativos.map(a => a.ticker.toUpperCase()))
);

// ─── CATEGORIAS EXPLORER ──────────────────────────────────────────────────────
function CategoriasExplorer({ onSelecionar, categoriaAtiva, setCategoriaAtiva, filtro, setFiltro }) {
  const categoriaAtivaData = CATEGORIAS.find(c => c.id === categoriaAtiva);
  const ativosFiltrados = categoriaAtivaData?.ativos.filter(a =>
    filtro === "" ||
    a.ticker.includes(filtro.toUpperCase()) ||
    a.nome.toLowerCase().includes(filtro.toLowerCase())
  ) || [];

  const S = {
    wrap: { textAlign:"left" },
    tabRow: {
      display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"1.5rem",
      padding:"4px", background:"rgba(255,255,255,0.02)",
      border:"1px solid rgba(255,255,255,0.05)", borderRadius:"12px",
      width:"fit-content",
    },
    tab: (active) => ({
      padding:"6px 14px",
      borderRadius:"8px",
      border:"none",
      background: active ? "rgba(52,211,153,0.12)" : "transparent",
      color: active ? "#34d399" : "rgba(255,255,255,0.3)",
      fontFamily:"'IBM Plex Mono',monospace",
      fontSize:"11px",
      fontWeight: active ? 600 : 400,
      letterSpacing:"0.04em",
      cursor:"pointer",
      transition:"all 0.15s",
      outline:"none",
      boxShadow: active ? "inset 0 0 0 1px rgba(52,211,153,0.2)" : "none",
    }),
    meta: {
      display:"flex", alignItems:"center", gap:"10px",
      marginBottom:"1rem", paddingBottom:"0.75rem",
      borderBottom:"1px solid rgba(255,255,255,0.04)",
    },
    metaLabel: {
      fontFamily:"'IBM Plex Mono',monospace", fontSize:"10px",
      color:"rgba(255,255,255,0.25)", letterSpacing:"0.08em",
    },
    metaCount: {
      fontFamily:"'IBM Plex Mono',monospace", fontSize:"10px",
      color:"rgba(52,211,153,0.6)", letterSpacing:"0.06em",
      background:"rgba(52,211,153,0.06)", border:"1px solid rgba(52,211,153,0.15)",
      padding:"2px 8px", borderRadius:"4px",
    },
    grid: {
      display:"flex", flexWrap:"wrap", gap:"6px",
    },
    card: {
      display:"flex", flexDirection:"column", alignItems:"flex-start",
      background:"rgba(255,255,255,0.02)",
      border:"1px solid rgba(255,255,255,0.06)",
      borderRadius:"8px", padding:"8px 12px",
      cursor:"pointer", transition:"all 0.15s",
      minWidth:"80px",
    },
  };

  return (
    <div style={S.wrap}>
      {/* Category tabs */}
      <div style={S.tabRow}>
        {CATEGORIAS.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setCategoriaAtiva(cat.id); setFiltro(""); }}
            style={S.tab(categoriaAtiva === cat.id)}
            onMouseEnter={e => { if (categoriaAtiva !== cat.id) { e.currentTarget.style.color="rgba(255,255,255,0.6)"; e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}}
            onMouseLeave={e => { if (categoriaAtiva !== cat.id) { e.currentTarget.style.color="rgba(255,255,255,0.3)"; e.currentTarget.style.background="transparent"; }}}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Meta info */}
      <div style={S.meta}>
        <span style={S.metaLabel}>{categoriaAtivaData?.descricao?.toUpperCase()}</span>
        <span style={S.metaCount}>{ativosFiltrados.length} ATIVOS</span>
        <span style={{...S.metaLabel, marginLeft:"auto"}}>{categoriaAtivaData?.subtitulo}</span>
      </div>

      {/* Asset grid */}
      <div style={S.grid}>
        {ativosFiltrados.map(item => (
          <button
            key={item.ticker}
            onClick={() => onSelecionar(item.ticker)}
            style={S.card}
            onMouseEnter={e => {
              e.currentTarget.style.background="rgba(52,211,153,0.07)";
              e.currentTarget.style.borderColor="rgba(52,211,153,0.2)";
              e.currentTarget.style.transform="translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background="rgba(255,255,255,0.02)";
              e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";
              e.currentTarget.style.transform="translateY(0)";
            }}
          >
            <span style={{
              fontFamily:"'IBM Plex Mono',monospace", fontSize:"11px",
              fontWeight:600, color:"rgba(52,211,153,0.8)",
              lineHeight:1.2, marginBottom:"2px",
            }}>{item.ticker}</span>
            <span style={{
              fontSize:"10px", color:"rgba(255,255,255,0.25)",
              lineHeight:1.3, fontWeight:400,
            }}>{item.nome}</span>
          </button>
        ))}
        {ativosFiltrados.length === 0 && (
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(255,255,255,0.2)",padding:"1rem 0"}}>
            — nenhum resultado para "{filtro}"
          </span>
        )}
      </div>
    </div>
  );
}

// ─── HELPERS DE TEXTO ─────────────────────────────────────────────────────────

/** Remove markdown bold/italic e outros marcadores */
function stripMd(texto) {
  if (!texto) return "";
  return texto
    .replace(/\*\*([^*]+)\*\*/g, "$1")  // **bold**
    .replace(/\*([^*]+)\*/g, "$1")       // *italic*
    .replace(/__([^_]+)__/g, "$1")       // __bold__
    .replace(/_([^_]+)_/g, "$1")         // _italic_
    .replace(/`([^`]+)`/g, "$1")         // `code`
    .trim();
}

// ─── TRADINGVIEW: converte ticker para símbolo ────────────────────────────────
function tickerParaTradingView(ticker) {
  // Americanas
  const nyse  = ["KO","JNJ","JPM","BAC","WMT","XOM","CVX","PG","HD","V","MA","UNH","MRK"];
  const nasdaq = ["AAPL","MSFT","NVDA","GOOGL","GOOG","AMZN","META","TSLA","NFLX","AVGO","AMD","INTC","QCOM","ADBE","PYPL"];
  if (nyse.includes(ticker))    return `NYSE:${ticker}`;
  if (nasdaq.includes(ticker))  return `NASDAQ:${ticker}`;
  // FIIs e ETFs B3 (terminam em 11)
  if (ticker.endsWith("11"))    return `BMFBOVESPA:${ticker}`;
  // Ações B3 (terminam em 3, 4, 5, 6)
  if (/\d$/.test(ticker))       return `BMFBOVESPA:${ticker}`;
  return ticker;
}

// ─── CARD GRÁFICO TRADINGVIEW ─────────────────────────────────────────────────
function CardGrafico({ ticker }) {
  // containerId fixo baseado só no ticker — evita recriar widget a cada render
  const containerId = `tv_widget_${ticker.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const symbol = tickerParaTradingView(ticker);

  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el) return;

    // Só injeta se ainda não foi carregado para este ticker
    if (el.hasChildNodes()) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "America/Sao_Paulo",
      theme: "dark",
      style: "1",
      locale: "br",
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
      backgroundColor: "rgba(8, 14, 31, 1)",
      gridColor: "rgba(255, 255, 255, 0.04)",
    });

    el.appendChild(script);

    // Cleanup só ao trocar de ticker
    return () => { if (el) el.innerHTML = ""; };
  }, [ticker]); // ← só depende do ticker, não do containerId

  return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl overflow-hidden">
      {/* Header do card */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
          📈 Gráfico — {ticker}
        </div>
        <a
          href={`https://www.tradingview.com/chart/?symbol=${symbol}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-gray-700 hover:text-gray-400 transition"
        >
          Abrir no TradingView ↗
        </a>
      </div>
      {/* Widget TradingView */}
      <div className="tradingview-widget-container" style={{ height: "400px" }}>
        <div
          id={containerId}
          className="tradingview-widget-container__widget"
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}

// ─── SECTION PARSER ───────────────────────────────────────────────────────────
function identificarTipo(titulo) {
  const t = titulo
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[⚖️⚠️📡📰🔮🎯📊📌📐🧠]/g, "")
    .trim();

  if (t.includes("sentimento"))                           return "sentimento";
  if (t.includes("leitura do mercado"))                   return "leitura";
  if (t.includes("momento atual"))                        return "momento";
  if (t.includes("valuation"))                            return "valuation";
  if (t.includes("perspectivas"))                         return "perspectivas";
  if (t.includes("for") && (t.includes("risco") || t.includes("vs"))) return "forcas_riscos";
  if (t.includes("driver") || t.includes("principal"))   return "driver";
  if (t.includes("invalid") || t.includes("que pode"))   return "invalida";
  if (t.includes("consenso"))                             return "consenso";
  if (t.includes("recomenda") || t.includes("analista"))  return "analistas";
  if (t.includes("distribui"))                            return "distribuicao";
  if (t.includes("proje") || t.includes("faixa"))         return "projecoes";
  if (t.includes("s") && t.includes("ntese"))             return "sintese";
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
      // ignora separadores
    } else {
      if (secaoAtual) {
        secaoAtual.corpo += linha + "\n";
      } else if (secoes.length > 0 && secoes[0].tipo === "cabecalho") {
        secoes[0].corpo += linha + "\n";
      }
    }
  }
  if (secaoAtual) secoes.push(secaoAtual);
  return secoes;
}

// ─── MARKDOWN SIMPLES ────────────────────────────────────────────────────────
function mdComponents() {
  return {
    p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-3 text-[14px]">{children}</p>,
    strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
    ul: ({ children }) => <ul className="list-none space-y-2 mb-3">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal space-y-2 mb-3 pl-5 text-gray-400">{children}</ol>,
    li: ({ children }) => (
      <li className="flex items-start gap-2 text-gray-400 text-[14px] leading-relaxed">
        <span className="text-gray-600 mt-1 flex-shrink-0">•</span>
        <span>{children}</span>
      </li>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-green-500/40 pl-4 my-3 text-gray-400 text-[13px] leading-relaxed">{children}</blockquote>
    ),
    table: ({ children }) => (
      <div className="w-full my-3 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
    tbody: ({ children }) => <tbody>{children}</tbody>,
    tr: ({ children }) => <tr className="border-b border-white/5">{children}</tr>,
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-[#79dd7d] font-bold text-xs uppercase tracking-wider">{children}</th>
    ),
    td: ({ children }) => {
      const text = typeof children === "string" ? children
        : Array.isArray(children) ? children.join("") : String(children || "");
      const isComprar = /comprar|buy/i.test(text);
      const isManter  = /manter|hold/i.test(text);
      const isVender  = /vender|sell/i.test(text);
      const isPos = text.startsWith("+") && text.includes("%");
      const isNeg = text.startsWith("-") && text.includes("%");
      const colorClass = isComprar || isPos ? "text-[#79dd7d] font-bold"
        : isManter ? "text-yellow-400 font-bold"
        : isVender || isNeg ? "text-red-400 font-bold"
        : "text-white/70";
      const pillClass = isComprar ? "bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold"
        : isManter ? "bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold"
        : isVender ? "bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full text-xs font-bold"
        : null;
      return (
        <td className={"px-4 py-3 " + colorClass}>
          {pillClass ? <span className={pillClass}>{children}</span> : children}
        </td>
      );
    },
    hr: () => null,
    h3: ({ children }) => <h3 className="text-white/80 font-bold text-sm mt-4 mb-2">{children}</h3>,
  };
}

// ─── EXTRATORES ───────────────────────────────────────────────────────────────
function extrairBullets(corpo) {
  return corpo.split("\n")
    .filter(l => {
      const trim = l.trim();
      if (/^[-*]{2,}$/.test(trim)) return false;
      if (trim.startsWith("|")) return false;
      return trim.startsWith("•") || trim.startsWith("→") ||
             (trim.startsWith("-") && trim.length > 2) ||
             (trim.startsWith("*") && trim.length > 2 && !trim.startsWith("**"));
    })
    .map(l => stripMd(l.replace(/^[•→\-\*]\s*/, "").trim()))
    .filter(b => b.length > 3);
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
  const comprar = corpo.match(/Comprar[^|]*\|\s*(\d+)/i)?.[1];
  const manter  = corpo.match(/Manter[^|]*\|\s*(\d+)/i)?.[1];
  const vender  = corpo.match(/Vender[^|]*\|\s*(\d+)/i)?.[1];
  return {
    comprar: parseInt(comprar || "0"),
    manter:  parseInt(manter  || "0"),
    vender:  parseInt(vender  || "0"),
  };
}

function extrairProjecoes(corpo) {
  const linhas = corpo.split("\n").filter(l => l.includes("|") && !l.includes("---"));
  const resultado = { bear: null, base: null, bull: null };
  for (const linha of linhas) {
    const cells = linha.split("|").map(c => c.trim()).filter(Boolean);
    if (!cells.length) continue;
    const tipo   = cells[0].toLowerCase();
    const preco  = stripMd(cells[1] || "—");
    const upside = stripMd(cells[2] || "—");
    if (/caute|bear|🐻/i.test(tipo))   resultado.bear = { preco, upside };
    else if (/refer|base|⚖/i.test(tipo)) resultado.base = { preco, upside };
    else if (/otim|bull|🚀/i.test(tipo)) resultado.bull = { preco, upside };
  }
  return resultado;
}

// ─── CARDS ────────────────────────────────────────────────────────────────────

function CardCabecalho({ secao }) {
  const tipo  = stripMd((secao.corpo.match(/\*\*Tipo de ativo:\*\*\s*(.+)/)?.[1] || "").trim());
  const preco = stripMd((secao.corpo.match(/\*\*Preço atual:\*\*\s*(.+)/)?.[1] || "").replace(/·.+/, "").trim());
  const data  = (secao.corpo.match(/·\s*(.+)/)?.[1] || "").trim();

  return (
    <div style={{
      background:"rgba(4,8,20,0.95)",
      border:"1px solid rgba(52,211,153,0.2)",
      borderRadius:"16px", padding:"20px",
      display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"1rem",
      boxShadow:"0 0 30px rgba(52,211,153,0.04)",
    }}>
      <div>
        <h1 style={{fontSize:"22px",fontWeight:800,color:"#fff",letterSpacing:"-0.025em",margin:0,marginBottom:"4px"}}>{secao.titulo}</h1>
        {tipo && <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.5)",letterSpacing:"0.08em",margin:0}}>{tipo.toUpperCase()}</p>}
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"20px",fontWeight:700,color:"#34d399"}}>{preco || "—"}</div>
        {data && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.2)",marginTop:"3px"}}>{data}</div>}
      </div>
    </div>
  );
}

function CardSentimento({ secao }) {
  const { emoji, label, cor } = extrairSentimento(secao.corpo);
  const frase = stripMd(
    secao.corpo.split("\n")
      .find(l => l.trim() && !l.includes(emoji) && !l.includes("##") && !l.startsWith("#") && l.trim().length > 10)
      ?.trim() || ""
  );
  const paleta = {
    verde:    { bg: "bg-green-950/60",  border: "border-green-500/40",  label: "text-green-400",  text: "text-green-200/90" },
    amarelo:  { bg: "bg-amber-950/50",  border: "border-amber-500/40",  label: "text-amber-400",  text: "text-amber-200/90" },
    vermelho: { bg: "bg-red-950/50",    border: "border-red-500/40",    label: "text-red-400",    text: "text-red-200/90" },
  }[cor];
  return (
    <div className={paleta.bg + " border " + paleta.border + " rounded-2xl px-5 py-4 flex items-center gap-4"}>
      <span className="text-3xl leading-none flex-shrink-0">{emoji}</span>
      <div>
        <div className={"text-[11px] font-bold uppercase tracking-widest mb-2 " + paleta.label}>Sentimento de mercado — {label}</div>
        {frase && <p className={"text-[14px] leading-relaxed " + paleta.text}>{frase}</p>}
      </div>
    </div>
  );
}

function CardLeitura({ secao }) {
  const frase = stripMd(
    secao.corpo.split("\n")
      .filter(l => l.trim() && !l.startsWith(">") && !l.startsWith("#"))
      .find(l => l.replace(/^[👉\s]+/, "").trim().length > 20)
      ?.replace(/^[👉\s]+/, "").trim() || secao.corpo.slice(0, 180).trim()
  );
  return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl p-5">
      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Leitura do mercado</div>
      <p className="text-white font-semibold text-[15px] leading-relaxed border-l-2 border-green-500 pl-4">{frase}</p>
    </div>
  );
}

function CardContexto({ secao, icon, label }) {
  const bullets = extrairBullets(secao.corpo);
  const paragrafos = secao.corpo
    .split("\n")
    .map(l => l.trim())
    .filter(l =>
      l.length > 10 &&
      !l.startsWith("#") &&
      !l.startsWith("|") &&
      !l.startsWith(">") &&
      !/^[-*]{2,}$/.test(l) &&
      !/^\*\*[^*]+\*\*:/.test(l) &&
      !/^\*\*[^*]+\*\*$/.test(l)
    )
    .map(l => stripMd(l))
    .filter(l => l.length > 10);
  const sentencas = paragrafos.flatMap(p =>
    p.split(/(?<=[.!?])\s+/).filter(s => s.length > 10)
  );
  return (
    <div className="bg-[#0a1020] border border-white/10 rounded-2xl p-5">
      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">{icon} {label}</div>
      {bullets.length > 0 ? (
        <ul className="space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-300 text-[13px] leading-relaxed border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="text-green-600 mt-1 flex-shrink-0 text-xs">→</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : sentencas.length > 0 ? (
        <ul className="space-y-2">
          {sentencas.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-300 text-[13px] leading-relaxed border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="text-green-600 mt-1 flex-shrink-0 text-xs">→</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm italic">Sem informações disponíveis nas fontes consultadas.</p>
      )}
    </div>
  );
}

function CardForcasRiscos({ secao }) {
  const corpo = secao.corpo;
  const splitPattern = /(?=###?\s*(🔴|PONT|RISCO|ATEN))/i;
  const partes = corpo.split(splitPattern);
  const forcas = extrairBullets(partes[0] || "");
  const riscos = extrairBullets(partes.slice(1).join("") || "");
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div style={{background:"rgba(4,16,8,0.8)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:"16px",padding:"16px"}}>
        <div className="text-[11px] font-bold uppercase tracking-widest text-green-400 mb-3">Forcas estruturais</div>
        <ul className="space-y-2">
          {forcas.length > 0 ? forcas.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-green-200/80 text-[13px] leading-relaxed border-b border-green-500/10 pb-2 last:border-0 last:pb-0">
              <span className="text-green-500 mt-1 flex-shrink-0 text-xs font-bold">+</span><span>{f}</span>
            </li>
          )) : <li className="text-green-800 text-sm">Dados insuficientes.</li>}
        </ul>
      </div>
      <div style={{background:"rgba(20,4,4,0.8)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:"16px",padding:"16px"}}>
        <div className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-3">Pontos de atencao</div>
        <ul className="space-y-2">
          {riscos.length > 0 ? riscos.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-red-200/80 text-[13px] leading-relaxed border-b border-red-500/10 pb-2 last:border-0 last:pb-0">
              <span className="text-red-500 mt-1 flex-shrink-0 text-xs font-bold">−</span><span>{r}</span>
            </li>
          )) : <li className="text-red-900 text-sm">Dados insuficientes.</li>}
        </ul>
      </div>
    </div>
  );
}

function CardDriver({ secao }) {
  const texto = stripMd(secao.corpo.replace(/^#+.+$/m, "").trim());
  return (
    <div className="bg-[#080e1f] border-l-2 border-blue-500 border-t border-r border-b border-white/10 rounded-r-2xl p-5">
      <div className="text-[11px] font-bold uppercase tracking-widest text-blue-400 mb-3">Driver principal</div>
      <p className="text-gray-200 text-[14px] leading-relaxed">{texto}</p>
    </div>
  );
}

function CardInvalida({ secao }) {
  const bullets = extrairBullets(secao.corpo);
  const texto = stripMd(secao.corpo.replace(/^[•\-\*].+$/gm, "").replace(/^#+.+$/m, "").trim());
  return (
    <div style={{background:"rgba(20,4,4,0.7)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:"16px",padding:"20px"}}>
      <div className="text-[11px] font-bold uppercase tracking-widest text-red-400 mb-3">O que pode invalidar a tese</div>
      {bullets.length > 0 ? (
        <ul className="space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-red-200/70 text-[13px] leading-relaxed border-b border-red-500/10 pb-2 last:border-0 last:pb-0">
              <span className="text-red-500 mt-1 flex-shrink-0 font-bold">×</span><span>{b}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 text-sm">{texto}</p>
      )}
    </div>
  );
}

function CardConsenso({ secao }) {
  const metricas = extrairMetricasConsenso(secao.corpo);
  const leituraSimples = stripMd(
    secao.corpo.match(/>\s*💡[^\n]*([\s\S]*?)(?=\n\n|\n---|\n##|$)/)?.[0]
      ?.replace(/^>\s*/gm, "").replace(/💡\s*\*\*[^*]+\*\*:?\s*/, "").trim() || ""
  );
  return (
    <div className="bg-[#070d1c] border border-white/15 rounded-2xl p-5">
      <div className="text-[11px] font-bold uppercase tracking-widest text-green-400 mb-4">Consenso dos analistas</div>
      <div className="space-y-0">
        {metricas.map((m, i) => (
          <div key={i} className="flex justify-between items-center gap-3 py-3 border-b border-white/5 last:border-0">
            <span className="text-gray-300 text-[13px]">{m.key}</span>
            <span className={"font-bold text-[13px] text-right " + (
              /comprar|buy/i.test(m.val) ? "text-green-400" :
              /vender|sell/i.test(m.val) ? "text-red-400" :
              /\+\d/.test(m.val) ? "text-green-400" : "text-white"
            )}>{m.val}</span>
          </div>
        ))}
      </div>
      {leituraSimples && (
        <div className="mt-4 bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-gray-300 text-[13px] leading-relaxed">
          {leituraSimples}
        </div>
      )}
    </div>
  );
}

function CardAnalistas({ secao }) {
  const tabela = extrairTabelaAnalistas(secao.corpo);
  if (!tabela) return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl p-5">
      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Recomendacoes por analista</div>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents()}>{secao.corpo}</ReactMarkdown>
    </div>
  );
  const cols = Object.keys(tabela[0] || {});
  return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl p-5 overflow-x-auto">
      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">Recomendacoes por analista</div>
      <table className="w-full border-collapse min-w-[500px]">
        <thead>
          <tr>
            {cols.map(col => (
              <th key={col} className="text-left text-[9px] font-bold uppercase tracking-wider text-gray-500 pb-3 border-b border-white/8 pr-4">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tabela.map((row, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0">
              {cols.map(col => {
                const val = row[col] || "—";
                const isRec = !/corretora|casa/i.test(col) && /comprar|buy|manter|hold|vender|sell/i.test(val);
                const pillCls = isRec
                  ? /comprar|buy/i.test(val) ? "bg-green-900/50 text-green-400 px-2 py-0.5 rounded text-[11px] font-bold"
                  : /manter|hold/i.test(val) ? "bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded text-[11px] font-bold"
                  : "bg-red-900/50 text-red-400 px-2 py-0.5 rounded text-[11px] font-bold"
                  : null;
                const upCls = val.startsWith("+") && val.includes("%") ? "text-green-400 font-bold"
                  : val.startsWith("-") && val.includes("%") ? "text-red-400 font-bold" : "text-gray-300";
                return (
                  <td key={col} className={"py-3 pr-4 text-[13px] " + (pillCls ? "" : upCls)}>
                    {pillCls ? <span className={pillCls}>{val}</span> : val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-gray-600 text-[11px] mt-3">Upside calculado com base no preco atual. Analistas com datas confirmadas nos ultimos 6 meses.</p>
    </div>
  );
}

function CardDistribuicao({ secao }) {
  const { comprar, manter, vender } = extrairDistribuicao(secao.corpo);
  const total = comprar + manter + vender || 1;
  const pct = v => Math.round((v / total) * 100);
  const faixa  = stripMd(secao.corpo.match(/\*\*FAIXA[^*]+\*\*:?\s*([^\n]+)/i)?.[1]?.trim() || "");
  const media  = stripMd(secao.corpo.match(/Média[^:]+:\s*\*\*?([^*\n]+)\*\*?/i)?.[1]?.trim() || "");
  const upside = stripMd(secao.corpo.match(/Upside implícito:[^*]*\*\*([^*]+)\*\*/i)?.[1]?.trim() || "");
  return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl p-5">
      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">Distribuicao das recomendacoes</div>
      <div className="h-2 rounded-full overflow-hidden bg-white/5 flex gap-0.5 mb-4">
        {comprar > 0 && <div className="bg-green-500 rounded-full" style={{ width:`${pct(comprar)}%` }} />}
        {manter  > 0 && <div className="bg-amber-400 rounded-full" style={{ width:`${pct(manter)}%`  }} />}
        {vender  > 0 && <div className="bg-red-500  rounded-full" style={{ width:`${pct(vender)}%`  }} />}
      </div>
      <div className="flex gap-5 flex-wrap text-[12px] mb-4">
        {comprar > 0 && <span className="flex items-center gap-1.5 text-white font-medium"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Comprar — {comprar} <span className="text-green-400">({pct(comprar)}%)</span></span>}
        {manter  > 0 && <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Manter — {manter} <span className="text-amber-400">({pct(manter)}%)</span></span>}
        {vender  > 0 && <span className="flex items-center gap-1.5 text-gray-300"><span className="w-2 h-2 rounded-full bg-red-500  inline-block" />Vender — {vender} <span className="text-red-400">({pct(vender)}%)</span></span>}
      </div>
      {(faixa || media || upside) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          {faixa  && <div className="bg-white/5 rounded-xl px-3 py-2 text-center"><div className="text-gray-500 text-[9px] uppercase tracking-wider mb-1">Faixa</div><div className="text-white text-[13px] font-bold">{faixa}</div></div>}
          {media  && <div className="bg-white/5 rounded-xl px-3 py-2 text-center"><div className="text-gray-500 text-[9px] uppercase tracking-wider mb-1">Media</div><div className="text-white text-[13px] font-bold">{media}</div></div>}
          {upside && <div className="bg-green-950/40 rounded-xl px-3 py-2 text-center"><div className="text-green-600 text-[9px] uppercase tracking-wider mb-1">Upside</div><div className="text-green-400 text-[13px] font-bold">{upside}</div></div>}
        </div>
      )}
    </div>
  );
}

function CardProjecoes({ secao }) {
  const { bear, base, bull } = extrairProjecoes(secao.corpo);
  const frase = stripMd(
    secao.corpo.split("\n").filter(l => l.trim().startsWith(">"))
      .map(l => l.replace(/^>\s*/, "").trim()).find(l => l.length > 10) || ""
  );
  return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl p-5">
      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">Faixa de projecoes</div>
      <div className="grid grid-cols-3 gap-3">
        <div style={{background:"rgba(20,4,4,0.7)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:"12px",padding:"14px",textAlign:"center"}}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">Cautelosa</div>
          <div className="text-white font-bold text-[15px]">{bear?.preco || "—"}</div>
          <div className="text-red-400/70 text-[11px] mt-1">{bear?.upside || "—"}</div>
        </div>
        <div style={{background:"rgba(20,16,4,0.7)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:"12px",padding:"14px",textAlign:"center"}}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">Referencia</div>
          <div className="text-white font-bold text-[15px]">{base?.preco || "—"}</div>
          <div className="text-amber-400/70 text-[11px] mt-1">{base?.upside || "—"}</div>
        </div>
        <div style={{background:"rgba(4,16,8,0.7)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:"12px",padding:"14px",textAlign:"center"}}>
          <div className="text-[10px] font-bold uppercase tracking-wider text-green-400 mb-2">Otimista</div>
          <div className="text-white font-bold text-[15px]">{bull?.preco || "—"}</div>
          <div className="text-green-400/70 text-[11px] mt-1">{bull?.upside || "—"}</div>
        </div>
      </div>
      {frase && <p className="text-gray-500 text-[11px] mt-3 text-center">{frase}</p>}
    </div>
  );
}

function CardSintese({ secao, semaforo }) {
  const texto = stripMd(
    secao.corpo.replace(/^#+.+$/m, "").replace(/^>\s*⚠️.+$/gm, "").trim()
  );
  const aviso = stripMd(secao.corpo.match(/>\s*⚠️.+/)?.[0]?.replace(/^>\s*/, "").trim() || "");
  const borda = semaforo === "verde" ? "border-green-500" : semaforo === "vermelho" ? "border-red-500" : "border-amber-500";
  const bg    = semaforo === "verde" ? "bg-green-950/40"  : semaforo === "vermelho" ? "bg-red-950/30"  : "bg-amber-950/30";
  const labelCor = semaforo === "verde" ? "text-green-400"   : semaforo === "vermelho" ? "text-red-400"   : "text-amber-400";
  return (
    <div className={bg + " border-2 " + borda + " rounded-2xl p-6"}>
      <div className={"text-[11px] font-bold uppercase tracking-widest mb-3 " + labelCor}>Sintese final</div>
      <p className="text-white/90 text-[15px] leading-relaxed">{texto}</p>
      {aviso && <p className="text-gray-600 text-[11px] mt-4 border-t border-white/5 pt-3">{aviso}</p>}
    </div>
  );
}

function CardGenerico({ secao }) {
  return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl p-5">
      <div className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">{secao.titulo}</div>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents()}>{secao.corpo}</ReactMarkdown>
    </div>
  );
}

// ─── SKELETON CARD (mostrado enquanto seção está chegando) ────────────────────
function CardSkeleton({ tipo }) {
  const alturas = {
    sentimento: "h-16", leitura: "h-20", momento: "h-32", valuation: "h-28",
    perspectivas: "h-32", forcas_riscos: "h-36", driver: "h-16", invalida: "h-24",
    consenso: "h-40", analistas: "h-48", distribuicao: "h-32", projecoes: "h-28",
    sintese: "h-24", default: "h-20",
  };
  const h = alturas[tipo] || alturas.default;
  return (
    <div className={"bg-[#080e1f] border border-white/5 rounded-2xl " + h + " overflow-hidden relative"}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent animate-[shimmer_1.5s_infinite]"
        style={{ backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite linear" }} />
    </div>
  );
}

// ─── RENDERIZADOR ─────────────────────────────────────────────────────────────
function RenderizarSecao({ secao, semaforo, visivel }) {
  const style = {
    opacity: visivel ? 1 : 0,
    transform: visivel ? "translateY(0)" : "translateY(12px)",
    transition: "opacity 0.4s ease, transform 0.4s ease",
  };
  let conteudo;
  switch (secao.tipo) {
    case "cabecalho":    conteudo = <CardCabecalho secao={secao} />; break;
    case "sentimento":   conteudo = <CardSentimento secao={secao} />; break;
    case "leitura":      conteudo = <CardLeitura secao={secao} />; break;
    case "momento":      conteudo = <CardContexto secao={secao} icon="📰" label="Momento atual do ativo" />; break;
    case "valuation":    conteudo = <CardContexto secao={secao} icon="⚖️" label="Leitura de valuation" />; break;
    case "perspectivas": conteudo = <CardContexto secao={secao} icon="🔮" label="Perspectivas futuras" />; break;
    case "forcas_riscos":conteudo = <CardForcasRiscos secao={secao} />; break;
    case "driver":       conteudo = <CardDriver secao={secao} />; break;
    case "invalida":     conteudo = <CardInvalida secao={secao} />; break;
    case "consenso":     conteudo = <CardConsenso secao={secao} />; break;
    case "analistas":    conteudo = <CardAnalistas secao={secao} />; break;
    case "distribuicao": conteudo = <CardDistribuicao secao={secao} />; break;
    case "projecoes":    conteudo = <CardProjecoes secao={secao} />; break;
    case "sintese":      conteudo = <CardSintese secao={secao} semaforo={semaforo} />; break;
    default:             conteudo = <CardGenerico secao={secao} />; break;
  }
  return <div style={style}>{conteudo}</div>;
}

// ─── PAGE PRINCIPAL ───────────────────────────────────────────────────────────
export default function Home() {
  const [user, setUser]                   = useState(null);
  const [ticker, setTicker]               = useState("");
  const [tickerAtual, setTickerAtual]     = useState(null); // ticker do relatório exibido
  const [sugestoes, setSugestoes]         = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [secoes, setSecoes]               = useState([]);           // FIX: sem textoCompleto — parse progressivo
  const [secoesVisiveis, setSecoesVisiveis] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [faseAtual, setFaseAtual]         = useState(null); // null | "coletando" | "cache_hit" | "gerando"
  const [erro, setErro]                   = useState("");
  const [msgIndex, setMsgIndex]           = useState(0);
  const [placeholder, setPlaceholder]     = useState(`ex: ${EXEMPLOS[0]}`);
  const [categoriaAtiva, setCategoriaAtiva]     = useState("ibovespa");
  const [filtro, setFiltro]               = useState("");
  const [categoriaAtivaPos, setCategoriaAtivaPos] = useState("ibovespa");
  const [filtroPos, setFiltroPos]         = useState("");
  const [semaforoForcado, setSemaforoForcado] = useState(null);
  const [modalLimiteAberto, setModalLimiteAberto] = useState(false);
  const [historico, setHistorico]           = useState([]);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const dropdownRef                         = useRef(null);
  const msgInterval  = useRef(null);
  const resultadoRef = useRef(null);
  const analiseRef   = useRef(null);  // âncora fixa no topo da área de análise
  const bufferRef    = useRef("");                                   // FIX: buffer acumulador para parse progressivo
  const secoesParsRef = useRef([]);                                  // FIX: referência das seções já detectadas

  // ─── Placeholder rotativo ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      exemploIdx = (exemploIdx + 1) % EXEMPLOS.length;
      setPlaceholder(`ex: ${EXEMPLOS[exemploIdx]}`);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // ─── Auth ─────────────────────────────────────────────────────────────────
  // Carrega histórico do usuário
  async function carregarHistorico(uid) {
    if (!uid) { setHistorico([]); return; }
    const { data } = await supabase
      .from("historico_consultas")
      .select("ticker, nome, criado_em")
      .eq("user_id", uid)
      .order("criado_em", { ascending: false })
      .limit(8);
    if (data) setHistorico(data);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      carregarHistorico(user?.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
      carregarHistorico(session?.user?.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ─── Loading messages ─────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) {
      setMsgIndex(0);
      msgInterval.current = setInterval(() => {
        setMsgIndex(prev => (prev + 1) % MENSAGENS_LOADING.length);
      }, 2000);
      // Rola para a área de análise assim que a busca começa
      setTimeout(() => {
        analiseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } else {
      clearInterval(msgInterval.current);
    }
    return () => clearInterval(msgInterval.current);
  }, [loading]);

  // ─── FIX: Parse progressivo — processa o buffer a cada chunk recebido ─────
  // Detecta novas seções `##` e as exibe imediatamente, sem esperar o [DONE]
  const processarBufferProgressivo = useCallback((buffer) => {
    // Estratégia: parseia incluindo seção atual incompleta.
    // parsearSecoes já retorna a última seção mesmo sem fechar com ##.
    // A cada chunk:
    //  - novas seções detectadas → adiciona e anima entrada
    //  - mesma quantidade       → atualiza corpo da última (texto chegando)
    const parsed = parsearSecoes(buffer);
    if (!parsed.length) return;

    const prevCount = secoesParsRef.current.length;

    if (parsed.length > prevCount) {
      // Novas seções chegaram — mostra imediatamente
      secoesParsRef.current = parsed;
      setSecoes([...parsed]);
      for (let i = prevCount; i < parsed.length; i++) {
        const idx = i;
        setTimeout(() => {
          setSecoesVisiveis(prev => prev.includes(idx) ? prev : [...prev, idx]);
        }, (idx - prevCount) * 120);
      }

    } else {
      // Mesma quantidade — atualiza corpo da última seção em tempo real
      secoesParsRef.current = parsed;
      setSecoes([...parsed]);
    }
  }, []);

  // ─── FIX: Busca com variação Yahoo e parse progressivo ────────────────────
  async function buscarAnalise(e, tickerOverride) {
    if (e) e.preventDefault();
    const t = (tickerOverride || ticker).trim().toUpperCase();

    // Verificação anônima
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      const consultasAnonimas = Number(localStorage.getItem("consultas_anonimas") || "0");
      if (consultasAnonimas >= 1) {
        setErro("Você já usou sua análise grátis. Crie uma conta para liberar mais 5 consultas.");
        setTimeout(() => { window.location.href = "/cadastro"; }, 1500);
        return;
      }
      localStorage.setItem("consultas_anonimas", String(consultasAnonimas + 1));
    }

    if (!t) return;
    if (!TICKERS_PERMITIDOS.has(t)) { setErro(`"${t}" não está disponível.`); return; }

    setTicker(t);
    setLoading(true);
    setFaseAtual("coletando");
    setTickerAtual(t);       // gráfico aparece imediatamente enquanto coleta roda
    setSecoes([]);
    setSecoesVisiveis([]);
    setErro("");
    setSemaforoForcado(null);
    bufferRef.current = "";
    secoesParsRef.current = [];

    // Verificação de limite para usuário logado
    if (u) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("consultas_usadas, limite_consultas, ultima_consulta, plano")
        .eq("id", u.id)
        .single();

      if (profileError) { setErro("Erro ao verificar limite."); setLoading(false); return; }

      const hoje = new Date().toISOString().split("T")[0];
      const ultimaConsulta = profile.ultima_consulta
        ? new Date(profile.ultima_consulta).toISOString().split("T")[0] : null;

      if (ultimaConsulta !== hoje) {
        await supabase.from("profiles").update({ consultas_usadas: 0, ultima_consulta: new Date().toISOString() }).eq("id", u.id);
        profile.consultas_usadas = 0;
      }

      if (profile.consultas_usadas >= profile.limite_consultas) {
        setModalLimiteAberto(true);
        setLoading(false);
        return;
      }

      await supabase.from("profiles").update({ consultas_usadas: profile.consultas_usadas + 1 }).eq("id", u.id);
    }



    try {
      const response = await fetch("/api/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: t }),
      });

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.replace("data: ", "");
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              bufferRef.current += parsed.text;
              processarBufferProgressivo(bufferRef.current);
            }
            if (parsed.fase === "coletando") setFaseAtual("coletando");
            if (parsed.fase === "cache_hit")  setFaseAtual("cache_hit");
            if (parsed.fase === "gerando")    setFaseAtual("gerando");
            if (parsed.error)    setErro(parsed.error);
            if (parsed.semaforo) setSemaforoForcado(parsed.semaforo);
          } catch {}
        }
      }

      // Parse final com texto completo para garantir consistência
      const secoesFinais = parsearSecoes(bufferRef.current);
      secoesParsRef.current = secoesFinais;
      setSecoes([...secoesFinais]);
      setSecoesVisiveis(secoesFinais.map((_, i) => i));

      // Salva no histórico do usuário logado
      if (u) {
        const cabecalho = secoesFinais.find(s => s.tipo === "cabecalho");
        const nomeEmpresa = cabecalho?.titulo?.split("—")?.[1]?.trim() || "";
        await supabase.from("historico_consultas").insert({
          user_id: u.id,
          ticker: t,
          nome: nomeEmpresa,
        });
        carregarHistorico(u.id);
      }

    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{minHeight:"100vh",background:"#040712",color:"#fff",fontFamily:"'Inter',sans-serif"}}>
      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes scan { 0%{top:0%;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes line-flow { 0%{stroke-dashoffset:1000} 100%{stroke-dashoffset:0} }
        .font-display { font-family:'Syne',sans-serif; }
        .font-mono-custom { font-family:'IBM Plex Mono',monospace; }
        .anim-fadeup { animation: fadeUp 0.7s ease forwards; }
        .anim-fadeup-2 { animation: fadeUp 0.7s ease 0.15s forwards; opacity:0; }
        .anim-fadeup-3 { animation: fadeUp 0.7s ease 0.3s forwards; opacity:0; }
        .anim-fadeup-4 { animation: fadeUp 0.7s ease 0.45s forwards; opacity:0; }
        .hero-input { outline:none; background:transparent; color:#fff; width:100%; font-size:15px; font-family:'IBM Plex Mono',monospace; letter-spacing:0.05em; }
        .hero-input::placeholder { color:rgba(255,255,255,0.2); }
        .hero-input:focus { outline: none; }
        .search-wrap:focus-within { border-color: rgba(52,211,153,0.45) !important; box-shadow: 0 0 0 1px rgba(52,211,153,0.15), 0 0 50px rgba(52,211,153,0.1), inset 0 1px 0 rgba(255,255,255,0.06) !important; background: rgba(4,8,22,0.95) !important; }
        .nav-link { color:rgba(255,255,255,0.45); font-size:13px; text-decoration:none; font-weight:500; letter-spacing:0.01em; transition:color 0.2s; }
        .nav-link:hover { color:rgba(255,255,255,0.9); }
        .suggestion-item:hover { background:rgba(52,211,153,0.08); }
        .cat-btn { transition: all 0.2s; }
        .cat-btn:hover { background: rgba(52,211,153,0.08) !important; border-color: rgba(52,211,153,0.3) !important; }
        .asset-btn { transition: all 0.15s; }
        .asset-btn:hover { background: rgba(52,211,153,0.1) !important; border-color: rgba(52,211,153,0.3) !important; transform: translateY(-1px); }
        .scanline { position:absolute; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(52,211,153,0.25),transparent); animation:scan 10s linear infinite; pointer-events:none; }
        .ticker-animation { animation: ticker-scroll 40s linear infinite; }
        .ticker-animation:hover { animation-play-state: paused; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes grid-breathe { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes line-flow { 0%{stroke-dashoffset:1000} 100%{stroke-dashoffset:0} }
        @keyframes ticker-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      `}</style>

      {/* NAVBAR */}
      <header style={{
        height:"60px", display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 2.5rem", borderBottom:"1px solid rgba(255,255,255,0.05)",
        background:"rgba(4,7,18,0.85)", backdropFilter:"blur(24px)",
        position:"sticky", top:0, zIndex:100,
      }}>
        <a href="/" style={{display:"flex",alignItems:"center",gap:"10px",textDecoration:"none"}}>
          <div style={{
            width:"28px",height:"28px",borderRadius:"7px",
            background:"linear-gradient(135deg,#34d399 0%,#059669 100%)",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"13px",color:"#000",
            boxShadow:"0 0 16px rgba(52,211,153,0.35)",flexShrink:0,
          }}>V</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"16px",color:"rgba(255,255,255,0.9)",letterSpacing:"-0.025em"}}>
            VEKTOR
          </span>
        </a>
        <nav style={{display:"flex",alignItems:"center",gap:"2.5rem"}} className="hidden md:flex">
          <a href="/como-funciona" className="nav-link">Como funciona</a>
          <a href="/recursos"      className="nav-link">Recursos</a>
          <a href="/planos"        className="nav-link">Planos</a>
          <a href="/faq"           className="nav-link">FAQ</a>
        </nav>
        {user ? (
          /* Avatar + dropdown de histórico */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownAberto(prev => !prev)}
              className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 hover:bg-white/5 transition"
            >
              {/* Avatar com inicial */}
              <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 font-bold text-sm">
                {(user.email?.[0] || "U").toUpperCase()}
              </div>
              <span className="text-white/60 text-xs hidden md:block max-w-[140px] truncate">
                {user.email}
              </span>
              <span className="text-white/40 text-xs">{dropdownAberto ? "▲" : "▼"}</span>
            </button>

            {/* Dropdown */}
            {dropdownAberto && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#0b1120] border border-white/10 rounded-2xl shadow-2xl z-[9999] overflow-hidden">
                {/* Header com email */}
                <div className="px-4 py-3 border-b border-white/8">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Logado como</p>
                  <p className="text-white text-sm font-medium truncate">{user.email}</p>
                </div>

                {/* Histórico */}
                <div className="px-4 py-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Últimas consultas</p>
                  {historico.length > 0 ? (
                    <ul className="space-y-1">
                      {historico.map((h, i) => (
                        <li key={i}>
                          <button
                            onClick={() => {
                              setDropdownAberto(false);
                              buscarAnalise(null, h.ticker);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/5 transition group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-green-400 font-bold text-xs">{h.ticker}</span>
                              {h.nome && <span className="text-white/40 text-xs truncate max-w-[120px]">{h.nome}</span>}
                            </div>
                            <span className="text-white/20 text-xs group-hover:text-white/50 transition">→</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-white/30 text-xs py-2">Nenhuma consulta ainda</p>
                  )}
                </div>

                {/* Sair */}
                <div className="px-4 py-3 border-t border-white/8">
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setUser(null);
                      setHistorico([]);
                      setDropdownAberto(false);
                      window.location.reload();
                    }}
                    className="w-full text-left text-red-400/70 hover:text-red-400 text-sm transition px-1"
                  >
                    Sair da conta
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login"
            className="rounded-xl border border-[#64d26f]/50 px-5 py-3 text-[#77db7c] text-sm flex items-center gap-2 hover:bg-[#64d26f]/10 transition">
            <span>👤</span> Entrar
          </Link>
        )}
      </header>

      <TickerTape />

      <main className="relative">

        {/* MODAL LIMITE */}
        {modalLimiteAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-green-500/30 bg-[#070b12] p-6 shadow-2xl">
              <div className="mb-4 inline-flex rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-green-400">
                Limite gratuito atingido
              </div>
              <h2 className="text-2xl font-black text-white mb-3">Você usou suas análises gratuitas de hoje</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">
                Volte amanhã gratuitamente ou libere o Plano Premium com até 50 análises por dia.
              </p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-5 space-y-2 text-sm text-gray-300">
                <p>✓ Até 50 análises por dia</p>
                <p>✓ Consenso consolidado dos analistas</p>
                <p>✓ Preço-alvo, upside e tese resumida</p>
                <p>✓ Plano mensal por R$49,90</p>
              </div>
              <a href="https://wa.me/5551991282389?text=Quero%20assinar%20o%20Plano%20Premium%20do%20Radar%20de%20Consenso"
                target="_blank" rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-xl bg-green-500 px-5 py-4 text-sm font-black text-black transition hover:bg-green-400">
                Liberar Premium no WhatsApp
              </a>
              <button type="button" onClick={() => setModalLimiteAberto(false)}
                className="mt-3 w-full rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-gray-400 transition hover:bg-white/5 hover:text-white">
                Continuar no plano grátis
              </button>
            </div>
          </div>
        )}

        {/* ─── HERO PREMIUM — CENTRALIZADA ─────────────────────────────── */}
        <section style={{
          position:"relative", overflow:"hidden",
          borderBottom:"1px solid rgba(255,255,255,0.05)",
          minHeight:"92vh",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          padding:"6rem 2rem 5rem",
        }}>
          {/* Background */}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#020510 0%,#030812 50%,#020510 100%)",pointerEvents:"none"}} />
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-60%)",width:"700px",height:"500px",background:"radial-gradient(ellipse, rgba(52,211,153,0.07) 0%, rgba(52,211,153,0.02) 45%, transparent 70%)",borderRadius:"50%",pointerEvents:"none",animation:"glow-pulse 7s ease-in-out infinite",filter:"blur(50px)"}} />
          <div style={{position:"absolute",top:"-15%",right:"5%",width:"500px",height:"400px",background:"radial-gradient(ellipse, rgba(52,211,153,0.04) 0%, transparent 65%)",borderRadius:"50%",pointerEvents:"none",animation:"glow-pulse 11s ease-in-out infinite 3s",filter:"blur(70px)"}} />
          <div style={{position:"absolute",bottom:"-10%",left:"-5%",width:"400px",height:"350px",background:"radial-gradient(ellipse, rgba(30,80,200,0.04) 0%, transparent 65%)",borderRadius:"50%",pointerEvents:"none",filter:"blur(60px)"}} />
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 100% 100% at 50% 50%, transparent 35%, rgba(2,5,16,0.75) 100%)",pointerEvents:"none"}} />
          <div style={{position:"absolute",inset:0,pointerEvents:"none",animation:"grid-breathe 9s ease-in-out infinite"}}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-grid-fine" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(52,211,153,0.05)" strokeWidth="0.5"/>
                </pattern>
                <pattern id="hero-grid-large" width="160" height="160" patternUnits="userSpaceOnUse">
                  <path d="M 160 0 L 0 0 0 160" fill="none" stroke="rgba(52,211,153,0.08)" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hero-grid-fine)" />
              <rect width="100%" height="100%" fill="url(#hero-grid-large)" />
            </svg>
          </div>
          <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
            {[{top:"18%",op:"0.03"},{top:"35%",op:"0.05"},{top:"52%",op:"0.06"},{top:"70%",op:"0.04"},{top:"85%",op:"0.03"}].map((l,i) => (
              <div key={i} style={{position:"absolute",left:0,right:0,top:l.top,height:"1px",background:"linear-gradient(90deg, transparent 0%, rgba(52,211,153," + l.op + ") 20%, rgba(52,211,153," + l.op + ") 80%, transparent 100%)"}} />
            ))}
          </div>
          <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden"}}>
            {[{x:"8%",y:"20%",dur:"7s",del:"0s"},{x:"88%",y:"15%",dur:"9s",del:"1s"},{x:"15%",y:"75%",dur:"6s",del:"2s"},{x:"92%",y:"70%",dur:"11s",del:"3s"},{x:"50%",y:"88%",dur:"8s",del:"1.5s"},{x:"35%",y:"10%",dur:"10s",del:"4s"}].map((p,i) => (
              <div key={i} style={{position:"absolute",left:p.x,top:p.y,width:"2px",height:"2px",borderRadius:"50%",background:"rgba(52,211,153,0.35)",animation:"float " + p.dur + " ease-in-out " + p.del + " infinite",boxShadow:"0 0 5px rgba(52,211,153,0.5)"}} />
            ))}
          </div>
          <div style={{position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",userSelect:"none"}}>
            {[{x:"5%",y:"25%",txt:"+24.7%"},{x:"87%",y:"22%",txt:"12/15"},{x:"3%",y:"60%",txt:"R$52"},{x:"90%",y:"58%",txt:"COMPRAR"},{x:"6%",y:"82%",txt:"80pts"},{x:"85%",y:"80%",txt:"+847"}].map((n,i) => (
              <span key={i} style={{position:"absolute",left:n.x,top:n.y,fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.06)",letterSpacing:"0.06em",animation:"glow-pulse " + (8+i) + "s ease-in-out " + (i*0.8) + "s infinite"}}>{n.txt}</span>
            ))}
          </div>
          <div className="scanline" />

          {/* CONTEÚDO CENTRALIZADO */}
          <div style={{position:"relative",zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",maxWidth:"720px",width:"100%"}} className="anim-fadeup">
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",border:"1px solid rgba(52,211,153,0.2)",background:"rgba(52,211,153,0.05)",borderRadius:"100px",padding:"5px 16px 5px 8px",marginBottom:"2rem"}}>
              <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"rgba(52,211,153,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 2s ease infinite"}} />
              </div>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#34d399",letterSpacing:"0.12em"}}>ALPHA INTELLIGENCE · LIVE</span>
            </div>
            <h1 style={{fontFamily:"'Inter',sans-serif",fontWeight:500,fontSize:"clamp(38px,5.5vw,68px)",lineHeight:1.04,letterSpacing:"-0.04em",color:"rgba(255,255,255,0.95)",marginBottom:"1.25rem"}}>
              Inteligência institucional<br/>
              <span style={{color:"#34d399",fontWeight:600}}>para investidores modernos.</span>
            </h1>
            <p className="anim-fadeup-2" style={{fontSize:"16px",lineHeight:1.7,color:"rgba(255,255,255,0.35)",maxWidth:"480px",marginBottom:"2.75rem",fontWeight:400,letterSpacing:"0.01em"}}>
              Consenso institucional, upside e inteligência quantitativa para ações, FIIs e ativos globais.
            </p>
            <div className="anim-fadeup-3" style={{width:"100%",maxWidth:"580px",marginBottom:"1.25rem"}}>
              <form onSubmit={buscarAnalise}>
                <div className="search-wrap" style={{display:"flex",alignItems:"center",background:"rgba(4,8,20,0.9)",border:"1px solid rgba(52,211,153,0.18)",borderRadius:"12px",padding:"6px 6px 6px 20px",transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)",position:"relative",backdropFilter:"blur(20px)",boxShadow:"0 0 0 1px rgba(52,211,153,0.06) inset, 0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 40px rgba(0,0,0,0.5)"}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",color:"rgba(52,211,153,0.3)",letterSpacing:"0.04em",marginRight:"12px",flexShrink:0,userSelect:"none",fontWeight:500}}>{">"}_</span>
                  <div style={{flex:1,position:"relative"}}>
                    <input type="text" value={ticker} className="hero-input" placeholder="Digite um ticker — PETR4, VALE3, NVDA..." disabled={loading} style={{fontSize:"16px"}}
                      onChange={e => {
                        const value = e.target.value.toUpperCase();
                        setTicker(value);
                        if (!value) { setSugestoes([]); setMostrarSugestoes(false); return; }
                        const ativosUnicos = Array.from(new Map(CATEGORIAS.flatMap(c => c.ativos).map(a => [a.ticker, a])).values());
                        setSugestoes(ativosUnicos.filter(a => a.ticker.includes(value) || a.nome.toLowerCase().includes(value.toLowerCase())).slice(0, 8));
                        setMostrarSugestoes(true);
                      }}
                    />
                    {mostrarSugestoes && sugestoes.length > 0 && (
                      <div style={{position:"absolute",left:"-52px",top:"calc(100% + 10px)",width:"calc(100% + 160px)",background:"rgba(4,7,18,0.97)",border:"1px solid rgba(52,211,153,0.12)",borderRadius:"10px",overflow:"hidden",zIndex:99999,boxShadow:"0 24px 60px rgba(0,0,0,0.6)",backdropFilter:"blur(24px)"}}>
                        {sugestoes.map(ativo => (
                          <div key={ativo.ticker + ativo.nome}
                            onClick={() => { setTicker(ativo.ticker); setMostrarSugestoes(false); }}
                            style={{padding:"10px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:"14px",borderBottom:"1px solid rgba(255,255,255,0.03)",transition:"background 0.1s"}}
                            onMouseEnter={e => e.currentTarget.style.background="rgba(52,211,153,0.06)"}
                            onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",color:"#34d399",fontWeight:600,minWidth:"58px"}}>{ativo.ticker}</span>
                            <span style={{fontSize:"12px",color:"rgba(255,255,255,0.35)"}}>{ativo.nome}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={loading || !ticker.trim()} style={{background:loading||!ticker.trim()?"rgba(255,255,255,0.04)":"rgba(52,211,153,0.12)",color:loading||!ticker.trim()?"rgba(255,255,255,0.2)":"#34d399",border:loading||!ticker.trim()?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(52,211,153,0.3)",borderRadius:"8px",padding:"0 24px",height:"50px",fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,fontSize:"11px",letterSpacing:"0.1em",cursor:loading||!ticker.trim()?"not-allowed":"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.2s",boxShadow:loading||!ticker.trim()?"none":"0 0 24px rgba(52,211,153,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"}}
                    onMouseEnter={e => { if (!loading && ticker.trim()) { e.currentTarget.style.background="rgba(52,211,153,0.2)"; e.currentTarget.style.boxShadow="0 0 32px rgba(52,211,153,0.25)"; }}}
                    onMouseLeave={e => { if (!loading && ticker.trim()) { e.currentTarget.style.background="rgba(52,211,153,0.12)"; e.currentTarget.style.boxShadow="0 0 24px rgba(52,211,153,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"; }}}>
                    {loading ? "PROCESSANDO..." : "ANALISAR"}
                  </button>
                </div>
              </form>
            </div>
            <div className="anim-fadeup-4" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0"}}>
              {[["FREE","Acesso gratuito"],["NO_AUTH","Sem cadastro"],["<1MIN","Resultado rápido"]].map(([code,label],i) => (
                <div key={label} style={{display:"flex",alignItems:"center",gap:"7px",paddingTop:"0",paddingBottom:"0",paddingRight:"18px",paddingLeft:i===0?"0":"18px",borderRight:i<2?"1px solid rgba(255,255,255,0.06)":"none"}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(52,211,153,0.4)",letterSpacing:"0.08em",fontWeight:600}}>{code}</span>
                  <span style={{fontSize:"11px",color:"rgba(255,255,255,0.22)",fontWeight:400}}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explorador de ativos */}
          {!secoes.length && !loading && (
            <div style={{width:"100%",maxWidth:"900px",marginTop:"4rem",paddingTop:"3rem",borderTop:"1px solid rgba(255,255,255,0.05)",position:"relative",zIndex:10}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"1.5rem",justifyContent:"center"}}>
                <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.04)"}} />
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.18)",letterSpacing:"0.12em"}}>EXPLORAR POR INDICE</span>
                <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.04)"}} />
              </div>
              <CategoriasExplorer onSelecionar={t => buscarAnalise(null, t)}
                categoriaAtiva={categoriaAtiva} setCategoriaAtiva={setCategoriaAtiva}
                filtro={filtro} setFiltro={setFiltro} />
            </div>
          )}
        </section>

        {/* ─── INTELLIGENCE PREVIEW — painel score abaixo da dobra ─────── */}
        {!secoes.length && !loading && (
        <section style={{position:"relative",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(4,8,20,0.5)",padding:"5rem 2.5rem",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 60% at 50% 0%, rgba(52,211,153,0.04) 0%, transparent 60%)",pointerEvents:"none"}} />
          <div style={{maxWidth:"1100px",margin:"0 auto",position:"relative",zIndex:1}}>
            <div style={{textAlign:"center",marginBottom:"3rem"}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.4)",letterSpacing:"0.14em",display:"block",marginBottom:"0.75rem"}}>CONSENSUS INTELLIGENCE ENGINE</span>
              <h2 style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:"clamp(22px,3vw,34px)",letterSpacing:"-0.03em",color:"rgba(255,255,255,0.75)",lineHeight:1.2}}>
                O que a inteligência do mercado{" "}
                <span style={{color:"#34d399",fontWeight:500}}>está sinalizando agora</span>
              </h2>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem"}} className="hidden lg:grid">
              {/* Score panel */}
              <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(52,211,153,0.12)",borderRadius:"16px",overflow:"hidden",backdropFilter:"blur(24px)",boxShadow:"0 0 60px rgba(52,211,153,0.04), inset 0 1px 0 rgba(255,255,255,0.04)"}}>
                <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:"8px"}}>
                  <div style={{display:"flex",gap:"5px"}}>
                    {["rgba(239,68,68,0.4)","rgba(245,158,11,0.4)","rgba(52,211,153,0.4)"].map((c,i) => (
                      <div key={i} style={{width:"7px",height:"7px",borderRadius:"50%",background:c}} />
                    ))}
                  </div>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",marginLeft:"4px"}}>vektor://score-engine</span>
                  <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:"4px"}}>
                    <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 2s ease infinite"}} />
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#34d399"}}>LIVE</span>
                  </div>
                </div>
                <div style={{padding:"14px 16px 0"}}>
                  <div style={{display:"flex",alignItems:"baseline",gap:"8px",marginBottom:"2px"}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"18px",fontWeight:700,color:"rgba(255,255,255,0.9)"}}>PETR4</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.5)"}}>+1.24%</span>
                  </div>
                  <span style={{fontSize:"11px",color:"rgba(255,255,255,0.25)"}}>Petrobras PN - Petroleo e Gas</span>
                </div>
                <div style={{padding:"16px",display:"flex",alignItems:"center",gap:"16px"}}>
                  <div style={{position:"relative",width:"70px",height:"70px",flexShrink:0}}>
                    <svg viewBox="0 0 70 70" style={{transform:"rotate(-90deg)"}}>
                      <circle cx="35" cy="35" r="28" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4"/>
                      <circle cx="35" cy="35" r="28" fill="none" stroke="#34d399" strokeWidth="4" strokeDasharray="175.9" strokeDashoffset="35.2" strokeLinecap="round" style={{filter:"drop-shadow(0 0 4px rgba(52,211,153,0.6))"}}/>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"16px",fontWeight:700,color:"#34d399",lineHeight:1}}>80</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"8px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.06em"}}>SCORE</span>
                    </div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.08em",marginBottom:"4px"}}>AI CONFIDENCE</div>
                    <div style={{fontSize:"13px",color:"rgba(255,255,255,0.8)",fontWeight:600,marginBottom:"2px"}}>Alta conviccao</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.5)"}}>80% dos analistas Comprar</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1px",background:"rgba(255,255,255,0.04)",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                  {[["UPSIDE","+ 24.7%","#34d399"],["PRECO-ALVO","R$ 52,00","rgba(255,255,255,0.7)"],["CONSENSO","12 / 15","rgba(255,255,255,0.7)"],["FLUXO","Comprador","#34d399"]].map(([lb,vl,cl]) => (
                    <div key={lb} style={{padding:"12px 14px",background:"rgba(4,8,20,0.85)"}}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.1em",marginBottom:"4px"}}>{lb}</div>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"13px",fontWeight:600,color:cl}}>{vl}</div>
                    </div>
                  ))}
                </div>
                <div style={{borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                  <svg viewBox="0 0 300 50" style={{width:"100%",display:"block"}}>
                    <defs>
                      <linearGradient id="sectionChartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" stopOpacity="0.1"/>
                        <stop offset="100%" stopColor="#34d399" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M0 45 C30 38,50 42,80 30 S120 18,150 20 S200 10,230 8 S265 5,300 2 L300 50 L0 50Z" fill="url(#sectionChartFill)"/>
                    <path d="M0 45 C30 38,50 42,80 30 S120 18,150 20 S200 10,230 8 S265 5,300 2" fill="none" stroke="#34d399" strokeWidth="1.2" style={{filter:"drop-shadow(0 0 3px rgba(52,211,153,0.4))"}}>
                      <animate attributeName="stroke-dashoffset" from="600" to="0" dur="2s" fill="freeze"/>
                    </path>
                  </svg>
                </div>
              </div>
              {/* Como funciona */}
              <div style={{background:"rgba(4,8,20,0.6)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"16px",padding:"1.5rem",backdropFilter:"blur(12px)",display:"flex",flexDirection:"column",gap:"1rem"}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em",marginBottom:"0.25rem"}}>HOW IT WORKS</div>
                {[
                  {n:"01",t:"Coleta de dados",d:"Busca recomendacoes em tempo real de 15+ casas de analise"},
                  {n:"02",t:"Sintese por IA",d:"Claude analisa e consolida as teses dos analistas"},
                  {n:"03",t:"Score institucional",d:"Calcula consenso, upside e nivel de conviccao"},
                  {n:"04",t:"Relatorio completo",d:"Entrega analise estruturada em segundos"},
                ].map(item => (
                  <div key={item.n} style={{display:"flex",gap:"12px",alignItems:"flex-start",padding:"10px",borderRadius:"8px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)"}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.4)",fontWeight:600,minWidth:"20px",marginTop:"1px"}}>{item.n}</span>
                    <div>
                      <div style={{fontSize:"12px",fontWeight:600,color:"rgba(255,255,255,0.7)",marginBottom:"3px"}}>{item.t}</div>
                      <div style={{fontSize:"11px",color:"rgba(255,255,255,0.25)",lineHeight:1.5}}>{item.d}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Stats */}
              <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                <div style={{background:"rgba(4,8,20,0.7)",border:"1px solid rgba(52,211,153,0.1)",borderRadius:"16px",padding:"1.25rem",backdropFilter:"blur(12px)"}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em",marginBottom:"1rem"}}>MARKET STATS</div>
                  {[["Ativos cobertos","847+","#34d399"],["Analistas monitorados","15+","rgba(255,255,255,0.6)"],["Casas de analise","12","rgba(255,255,255,0.6)"],["Atualizacao","Continua","#34d399"]].map(([label,val,color]) => (
                    <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <span style={{fontSize:"11px",color:"rgba(255,255,255,0.3)"}}>{label}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",fontWeight:600,color}}>{val}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:"rgba(4,8,20,0.7)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"12px",padding:"1rem",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",gap:"12px",animation:"float 10s ease-in-out 2s infinite"}}>
                  <div style={{width:"38px",height:"38px",borderRadius:"10px",flexShrink:0,background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3h18v18H3z" stroke="rgba(52,211,153,0.4)" strokeWidth="1"/>
                      <path d="M7 17l4-6 4 4 4-8" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.1em",marginBottom:"3px"}}>INSTITUTIONAL FLOW</div>
                    <div style={{fontSize:"12px",color:"rgba(255,255,255,0.6)",fontWeight:500}}>Fluxo comprador ativo</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(52,211,153,0.4)",marginTop:"2px"}}>847 ativos monitorados</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* ÂNCORA FIXA — scroll aponta aqui ao iniciar qualquer análise */}
        <div ref={analiseRef} />

        {/* LOADING — 3 estados visuais: coletando / gerando / blocos chegando */}
        {loading && secoes.length === 0 && (
          <div className="max-w-4xl mx-auto px-6 py-10">
            <div style={{background:"rgba(6,10,24,0.9)",borderRadius:"20px",padding:"2.5rem 2rem",border:"1px solid rgba(52,211,153,0.1)",backdropFilter:"blur(20px)",boxShadow:"0 0 60px rgba(52,211,153,0.04), 0 40px 80px rgba(0,0,0,0.4)"}}>
              <div className="flex flex-col items-center gap-6">

                {/* Spinner premium */}
                <div style={{position:"relative",width:"56px",height:"56px"}}>
                  <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"1px solid rgba(52,211,153,0.1)"}} />
                  <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"1.5px solid transparent",borderTopColor:"#34d399",animation:"spin 1.2s linear infinite"}} />
                  <div style={{position:"absolute",inset:"6px",borderRadius:"50%",border:"1px solid transparent",borderBottomColor:"rgba(52,211,153,0.3)",animation:"spin 0.9s linear infinite reverse"}} />
                  <div style={{position:"absolute",inset:"14px",borderRadius:"50%",background:"rgba(52,211,153,0.06)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 1.5s ease infinite"}} />
                  </div>
                </div>

                {/* Título e fase atual */}
                <div className="text-center">
                  <p style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:"18px",color:"rgba(255,255,255,0.9)",letterSpacing:"-0.02em"}}>Analisando <span style={{color:"#34d399",fontFamily:"'IBM Plex Mono',monospace",fontSize:"17px"}}>{ticker}</span></p>
                  {faseAtual === "cache_hit" && (
                    <p className="text-green-400 text-sm mt-1">⚡ Dados em cache — relatório em instantes</p>
                  )}
                  {faseAtual === "coletando" && (
                    <p className="text-gray-400 text-sm mt-1">Pesquisando analistas e dados de mercado — pode levar até 45 segundos</p>
                  )}
                  {faseAtual === "gerando" && (
                    <p className="text-green-400 text-sm mt-1">✅ Dados coletados — gerando o relatório agora</p>
                  )}
                </div>

                {/* Etapas — estilo terminal steps */}
                <div style={{width:"100%",display:"flex",flexDirection:"column",gap:"4px"}}>
                  {[
                    {
                      id:"coleta",
                      label: faseAtual === "cache_hit" ? "Cache hit — dados disponíveis" : "Coleta de dados e recomendações",
                      active: faseAtual === "coletando" || faseAtual === "cache_hit",
                      done: faseAtual === "gerando",
                      icon: faseAtual === "cache_hit" ? "⚡" : "01",
                    },
                    {
                      id:"gerar",
                      label:"Síntese e geração do relatório",
                      active: faseAtual === "gerando",
                      done: false,
                      icon:"02",
                    },
                    {
                      id:"blocos",
                      label:"Blocos aparecem em tempo real",
                      active: false,
                      done: false,
                      icon:"03",
                    },
                  ].map(step => (
                    <div key={step.id} style={{
                      display:"flex", alignItems:"center", gap:"12px",
                      padding:"10px 14px", borderRadius:"8px",
                      background: step.done
                        ? "rgba(52,211,153,0.04)"
                        : step.active
                        ? "rgba(52,211,153,0.06)"
                        : "rgba(255,255,255,0.01)",
                      border: step.done || step.active
                        ? "1px solid rgba(52,211,153,0.15)"
                        : "1px solid rgba(255,255,255,0.04)",
                      transition:"all 0.3s",
                    }}>
                      <span style={{
                        fontFamily:"'IBM Plex Mono',monospace",
                        fontSize:"10px", fontWeight:600,
                        color: step.done ? "#34d399" : step.active ? "rgba(52,211,153,0.7)" : "rgba(255,255,255,0.15)",
                        minWidth:"22px",
                      }}>
                        {step.done ? "✓" : step.icon}
                      </span>
                      <span style={{
                        fontFamily:"'Inter',sans-serif",
                        fontSize:"12px", flex:1,
                        color: step.done || step.active ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)",
                        letterSpacing:"0.01em",
                      }}>{step.label}</span>
                      {step.active && (
                        <div style={{
                          width:"12px",height:"12px",borderRadius:"50%",flexShrink:0,
                          border:"1.5px solid transparent",
                          borderTopColor:"#34d399",
                          animation:"spin 1s linear infinite",
                        }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Barra de progresso — progresso real baseado em msgIndex */}
                {(() => {
                  const pct = faseAtual === "gerando"
                    ? 100
                    : Math.min(Math.round(((msgIndex + 1) / MENSAGENS_LOADING.length) * 88) + 5, 90);
                  return (
                    <div style={{width:"100%"}}>
                      <div style={{
                        display:"flex", justifyContent:"space-between",
                        alignItems:"center", marginBottom:"8px",
                      }}>
                        <span style={{
                          fontFamily:"'IBM Plex Mono',monospace",
                          fontSize:"10px", letterSpacing:"0.06em",
                          color:"rgba(255,255,255,0.2)",
                        }}>
                          {faseAtual === "gerando" ? "GERANDO RELATÓRIO" : "COLETANDO DADOS"}
                        </span>
                        <span style={{
                          fontFamily:"'IBM Plex Mono',monospace",
                          fontSize:"11px", fontWeight:600,
                          color: faseAtual === "gerando" ? "#34d399" : "rgba(52,211,153,0.5)",
                          letterSpacing:"0.04em",
                        }}>{pct}%</span>
                      </div>
                      {/* Track */}
                      <div style={{
                        width:"100%", height:"2px",
                        background:"rgba(255,255,255,0.04)",
                        borderRadius:"100px", overflow:"hidden",
                        position:"relative",
                      }}>
                        {/* Fill */}
                        <div style={{
                          position:"absolute", left:0, top:0, bottom:0,
                          borderRadius:"100px",
                          width:`${pct}%`,
                          background:"linear-gradient(90deg, rgba(52,211,153,0.4), #34d399)",
                          boxShadow:"0 0 10px rgba(52,211,153,0.5)",
                          transition:"width 2.2s cubic-bezier(0.4,0,0.2,1)",
                        }} />
                        {/* Shimmer */}
                        <div style={{
                          position:"absolute", left:0, top:0, bottom:0,
                          width:`${pct}%`,
                          background:"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                          backgroundSize:"60px 100%",
                          animation:"shimmer 1.5s linear infinite",
                        }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Mensagem rotativa — terminal style */}
                {faseAtual === "coletando" && (
                  <div style={{
                    width:"100%",
                    background:"rgba(4,7,18,0.8)",
                    border:"1px solid rgba(52,211,153,0.1)",
                    borderRadius:"8px", padding:"10px 14px",
                    display:"flex", alignItems:"center", gap:"10px",
                    minHeight:"40px",
                  }}>
                    <span style={{
                      fontFamily:"'IBM Plex Mono',monospace",
                      fontSize:"11px", color:"rgba(52,211,153,0.4)",
                      flexShrink:0,
                    }}>$</span>
                    <p key={msgIndex} style={{
                      fontFamily:"'IBM Plex Mono',monospace",
                      fontSize:"11px", color:"rgba(52,211,153,0.65)",
                      letterSpacing:"0.02em", margin:0,
                    }}>
                      {MENSAGENS_LOADING[msgIndex].replace(/[🔍📰📊📈🏦📋🔎📡💹🗞️📉🌐⚖️💡📐🧠✍️⏳]/g, "").trim()}
                    </p>
                    <div style={{
                      marginLeft:"auto", display:"flex", gap:"3px", flexShrink:0,
                    }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{
                          width:"3px",height:"3px",borderRadius:"50%",
                          background:"rgba(52,211,153,0.4)",
                          animation:("pulse-dot 1.4s ease-in-out " + (i*0.2) + "s infinite"),
                        }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Research houses */}
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap",justifyContent:"center"}}>
                  {["Itaú BBA","BTG Pactual","XP","Bradesco BBI","Safra","Genial"].map((casa, i) => (
                    <span key={casa} style={{
                      fontFamily:"'IBM Plex Mono',monospace",
                      fontSize:"9px", letterSpacing:"0.06em",
                      color:"rgba(255,255,255,0.15)",
                      background:"rgba(255,255,255,0.02)",
                      border:"1px solid rgba(255,255,255,0.05)",
                      padding:"3px 10px", borderRadius:"4px",
                      animation:"pulse-dot 2s ease-in-out infinite",
                      animationDelay:((i*0.3) + "s"),
                    }}>{casa.toUpperCase()}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gráfico aparece imediatamente — assim que ticker é definido, antes do relatório */}
        {tickerAtual && secoes.length === 0 && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6">
            <CardGrafico ticker={tickerAtual} />
          </div>
        )}

        {/* Banner de progresso quando blocos já aparecem mas o stream ainda está ativo */}
        {loading && secoes.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6">
            <div className="bg-green-950/30 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border-2 border-green-500 border-t-transparent animate-spin flex-shrink-0" />
              <p className="text-green-400 text-sm font-medium">Gerando próximas seções...</p>
            </div>
          </div>
        )}

        {/* ERRO */}
        {erro && (
          <div className="max-w-4xl mx-auto px-6 mt-6">
            <div className="rounded-2xl border border-green-500/30 bg-green-950/20 p-5">
              <p className="text-white font-bold mb-2">Limite gratuito atingido</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{erro}</p>
              <a href="https://wa.me/5551991282389?text=Quero%20assinar%20o%20Plano%20Premium%20do%20Radar%20B3"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex w-full justify-center rounded-xl bg-green-500 px-5 py-3 text-sm font-black text-black hover:bg-green-400 transition">
                Liberar Plano Premium no WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* RESULTADO — blocos aparecem progressivamente durante o streaming */}
        {secoes.length > 0 && (
          <div style={{
            position:"relative",
            background:"#040712",
            minHeight:"100vh",
          }}>
            {/* Background técnico animado na área de resultado */}
            <div style={{
              position:"fixed", inset:0, pointerEvents:"none",
              zIndex:0, overflow:"hidden",
            }}>
              <div style={{
                position:"absolute", inset:0, opacity:1,
              }}>
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{position:"absolute",inset:0}}>
                  <defs>
                    <pattern id="result-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(52,211,153,0.04)" strokeWidth="0.5"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#result-grid)" />
                </svg>
              </div>
              {/* Orbs flutuantes */}
              <div style={{
                position:"absolute", top:"10%", right:"5%",
                width:"300px", height:"300px",
                background:"radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)",
                borderRadius:"50%", animation:"glow-pulse 8s ease-in-out infinite",
              }} />
              <div style={{
                position:"absolute", bottom:"20%", left:"2%",
                width:"200px", height:"200px",
                background:"radial-gradient(circle, rgba(52,211,153,0.03) 0%, transparent 70%)",
                borderRadius:"50%", animation:"glow-pulse 12s ease-in-out infinite 3s",
              }} />
            </div>
          <div ref={resultadoRef} style={{position:"relative",zIndex:1}} className="max-w-4xl mx-auto px-4 md:px-6 pb-8 pt-6 space-y-3">
            {secoes.map((secao, i) => (
              <React.Fragment key={i}>
                <RenderizarSecao secao={secao} semaforo={semaforoForcado}
                  visivel={secoesVisiveis.includes(i)} />
                {/* Gráfico TradingView — aparece logo após o cabeçalho */}
                {secao.tipo === "cabecalho" && tickerAtual && (
                  <CardGrafico ticker={tickerAtual} />
                )}
              </React.Fragment>
            ))}

            {!loading && (
              <>
                <p style={{
                  fontFamily:"'IBM Plex Mono',monospace",
                  fontSize:"10px", color:"rgba(255,255,255,0.12)",
                  textAlign:"center", paddingTop:"1rem", lineHeight:1.7,
                  letterSpacing:"0.02em",
                }}>
                  ⚠ Esta análise possui caráter informativo e educacional, baseada em dados públicos e consenso recente de mercado. Não constitui recomendação individualizada de investimento.
                </p>
                <div style={{
                  background:"rgba(6,10,24,0.8)",
                  border:"1px solid rgba(255,255,255,0.06)",
                  borderRadius:"16px", padding:"1.5rem",
                  backdropFilter:"blur(12px)",
                }}>
                  <div style={{
                    display:"flex", alignItems:"center", gap:"8px", marginBottom:"1.25rem",
                  }}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.1em"}}>EXPLORAR OUTRO ATIVO</span>
                    <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.04)"}} />
                  </div>
                  <CategoriasExplorer onSelecionar={t => { setTicker(t); buscarAnalise(null, t); }}
                    categoriaAtiva={categoriaAtivaPos} setCategoriaAtiva={setCategoriaAtivaPos}
                    filtro={filtroPos} setFiltro={setFiltroPos} />
                </div>
              </>
            )}
          </div>
          </div>
        )}

        {/* INSTITUCIONAL */}
        <section style={{
          position:"relative", padding:"5rem 2.5rem",
          borderTop:"1px solid rgba(255,255,255,0.05)",
          background:"#040712", overflow:"hidden",
        }}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 50% at 50% 0%, rgba(52,211,153,0.04) 0%, transparent 60%)",pointerEvents:"none"}} />
          <div style={{maxWidth:"900px",margin:"0 auto",textAlign:"center",position:"relative",zIndex:1}}>
            <div style={{
              display:"inline-flex",alignItems:"center",gap:"8px",
              border:"1px solid rgba(52,211,153,0.15)",
              background:"rgba(52,211,153,0.04)",
              borderRadius:"100px",padding:"5px 16px",
              marginBottom:"2rem",
            }}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.6)",letterSpacing:"0.1em"}}>INSTITUTIONAL COVERAGE</span>
            </div>
            <h2 style={{
              fontFamily:"'Inter',sans-serif",fontWeight:600,
              fontSize:"clamp(22px,2.8vw,32px)",letterSpacing:"-0.025em",
              color:"rgba(255,255,255,0.8)",marginBottom:"1rem",lineHeight:1.2,
            }}>
              Dados das principais{" "}
              <span style={{color:"#34d399",fontWeight:500}}>research houses do mercado</span>
            </h2>
            <p style={{fontSize:"14px",color:"rgba(255,255,255,0.3)",marginBottom:"3rem",maxWidth:"480px",margin:"0 auto 3rem",lineHeight:1.6}}>
              Consolidamos recomendações de bancos, corretoras e casas de análise independentes.
            </p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1px",background:"rgba(255,255,255,0.05)",borderRadius:"16px",overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)"}}>
              {["Itaú BBA","BTG Pactual","XP Investimentos","Bradesco BBI","Safra","Suno Research","Goldman Sachs","Morgan Stanley","J.P. Morgan"].map((s,i) => (
                <div key={s} style={{
                  padding:"20px",background:"rgba(8,12,28,0.6)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",
                  color:"rgba(255,255,255,0.3)",letterSpacing:"0.02em",
                  transition:"all 0.2s",cursor:"default",
                  borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(52,211,153,0.04)";e.currentTarget.style.color="rgba(52,211,153,0.7)"}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(8,12,28,0.6)";e.currentTarget.style.color="rgba(255,255,255,0.3)"}}
                >{s}</div>
              ))}
            </div>
            <div style={{
              marginTop:"2rem",padding:"1rem 1.5rem",
              background:"rgba(52,211,153,0.04)",
              border:"1px solid rgba(52,211,153,0.1)",
              borderRadius:"12px",display:"inline-flex",alignItems:"center",gap:"8px",
            }}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 2s ease infinite"}} />
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(52,211,153,0.6)",letterSpacing:"0.06em"}}>ATUALIZAÇÃO CONTÍNUA · DADOS PÚBLICOS DE MERCADO</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
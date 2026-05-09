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
        const delta = (Math.random() - 0.5) * 0.4;
        const varNum = parseFloat(c.variacao.replace("%","").replace("+","").replace(",",".")) + delta;
        const positivo = varNum >= 0;
        return { ...c, variacao: (positivo ? "+" : "") + varNum.toFixed(2).replace(".",",") + "%", positivo };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  const items = [...cotacoes, ...cotacoes];
  return (
    <div className="h-12 border-b border-white/10 bg-[#080b15] flex items-center overflow-hidden whitespace-nowrap text-sm">
      <div className="ticker-animation" style={{ display:"flex", gap:"2rem", paddingLeft:"2rem", width:"max-content" }}>
        {items.map((c, i) => (
          <div key={i} className="flex items-center gap-1">
            <strong className="text-white/95">{c.ticker}</strong>
            <span className="text-white/60">{c.preco}</span>
            <span className={c.positivo ? "text-[#69d97a]" : "text-[#ff6b66]"}>
              {c.positivo ? "▲" : "▼"} {c.variacao}
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
    id: "ibovespa",
    label: "📈 Ibovespa",
    descricao: "Ações do Ibovespa",
    subtitulo: "As principais ações da bolsa brasileira, que compõem o principal índice da B3",
    ativos: [
      { ticker: "ABEV3", nome: "Ambev" },
      { ticker: "ASAI3", nome: "Assaí" },
      { ticker: "AZUL4", nome: "Azul" },
      { ticker: "B3SA3", nome: "B3" },
      { ticker: "BBAS3", nome: "Banco do Brasil" },
      { ticker: "BBDC3", nome: "Bradesco ON" },
      { ticker: "BBDC4", nome: "Bradesco PN" },
      { ticker: "BBSE3", nome: "BB Seguridade" },
      { ticker: "BEEF3", nome: "Minerva" },
      { ticker: "BPAC11", nome: "BTG Pactual" },
      { ticker: "BRAP4", nome: "Bradespar" },
      { ticker: "BRFS3", nome: "BRF" },
      { ticker: "BRKM5", nome: "Braskem" },
      { ticker: "CMIG4", nome: "Cemig" },
      { ticker: "CMIN3", nome: "CSN Mineração" },
      { ticker: "COGN3", nome: "Cogna" },
      { ticker: "CPFE3", nome: "CPFL Energia" },
      { ticker: "CPLE6", nome: "Copel" },
      { ticker: "CSAN3", nome: "Cosan" },
      { ticker: "CSNA3", nome: "CSN" },
      { ticker: "CYRE3", nome: "Cyrela" },
      { ticker: "DXCO3", nome: "Dexco" },
      { ticker: "EGIE3", nome: "Engie Brasil" },
      { ticker: "ELET3", nome: "Eletrobras ON" },
      { ticker: "ELET6", nome: "Eletrobras PNB" },
      { ticker: "EMBR3", nome: "Embraer" },
      { ticker: "ENEV3", nome: "Eneva" },
      { ticker: "ENGI11", nome: "Energisa" },
      { ticker: "EQTL3", nome: "Equatorial" },
      { ticker: "EZTC3", nome: "EZTEC" },
      { ticker: "FLRY3", nome: "Fleury" },
      { ticker: "GGBR4", nome: "Gerdau" },
      { ticker: "GOAU4", nome: "Metalúrgica Gerdau" },
      { ticker: "HAPV3", nome: "Hapvida" },
      { ticker: "HYPE3", nome: "Hypera" },
      { ticker: "IGTI11", nome: "Iguatemi" },
      { ticker: "IRBR3", nome: "IRB Brasil" },
      { ticker: "ITSA4", nome: "Itaúsa" },
      { ticker: "ITUB4", nome: "Itaú Unibanco" },
      { ticker: "JBSS3", nome: "JBS" },
      { ticker: "KLBN11", nome: "Klabin" },
      { ticker: "LREN3", nome: "Lojas Renner" },
      { ticker: "MGLU3", nome: "Magazine Luiza" },
      { ticker: "MRFG3", nome: "Marfrig" },
      { ticker: "MRVE3", nome: "MRV" },
      { ticker: "MULT3", nome: "Multiplan" },
      { ticker: "NTCO3", nome: "Grupo Natura" },
      { ticker: "PCAR3", nome: "GPA" },
      { ticker: "PETR3", nome: "Petrobras ON" },
      { ticker: "PETR4", nome: "Petrobras PN" },
      { ticker: "PETZ3", nome: "Petz" },
      { ticker: "PRIO3", nome: "PRIO" },
      { ticker: "PSSA3", nome: "Porto Seguro" },
      { ticker: "RADL3", nome: "Raia Drogasil" },
      { ticker: "RAIL3", nome: "Rumo" },
      { ticker: "RAIZ4", nome: "Raízen" },
      { ticker: "RDOR3", nome: "Rede D'Or" },
      { ticker: "RENT3", nome: "Localiza" },
      { ticker: "RRRP3", nome: "3R Petroleum" },
      { ticker: "SANB11", nome: "Santander" },
      { ticker: "SBSP3", nome: "Sabesp" },
      { ticker: "SLCE3", nome: "SLC Agrícola" },
      { ticker: "SMTO3", nome: "São Martinho" },
      { ticker: "STBP3", nome: "Santos Brasil" },
      { ticker: "SUZB3", nome: "Suzano" },
      { ticker: "TAEE11", nome: "Taesa" },
      { ticker: "TIMS3", nome: "TIM" },
      { ticker: "TOTS3", nome: "TOTVS" },
      { ticker: "UGPA3", nome: "Ultrapar" },
      { ticker: "USIM5", nome: "Usiminas" },
      { ticker: "VALE3", nome: "Vale" },
      { ticker: "VBBR3", nome: "Vibra Energia" },
      { ticker: "VIVT3", nome: "Telefônica Brasil" },
      { ticker: "WEGE3", nome: "WEG" },
      { ticker: "YDUQ3", nome: "Yduqs" },
    ],
  },
  {
    id: "dividendos",
    label: "💰 Dividendos",
    descricao: "Ações do índice de dividendos (IDIV)",
    subtitulo: "Ações do índice IDIV — empresas com histórico relevante de distribuição de proventos",
    ativos: [
      { ticker: "ABEV3", nome: "Ambev" },
      { ticker: "BBAS3", nome: "Banco do Brasil" },
      { ticker: "BBDC3", nome: "Bradesco ON" },
      { ticker: "BBDC4", nome: "Bradesco PN" },
      { ticker: "BBSE3", nome: "BB Seguridade" },
      { ticker: "BPAC11", nome: "BTG Pactual" },
      { ticker: "CMIG4", nome: "Cemig" },
      { ticker: "CPFE3", nome: "CPFL Energia" },
      { ticker: "CPLE6", nome: "Copel" },
      { ticker: "CSAN3", nome: "Cosan" },
      { ticker: "EGIE3", nome: "Engie Brasil" },
      { ticker: "ELET3", nome: "Eletrobras ON" },
      { ticker: "ELET6", nome: "Eletrobras PNB" },
      { ticker: "ENEV3", nome: "Eneva" },
      { ticker: "EQTL3", nome: "Equatorial" },
      { ticker: "ITSA4", nome: "Itaúsa" },
      { ticker: "ITUB4", nome: "Itaú Unibanco" },
      { ticker: "JBSS3", nome: "JBS" },
      { ticker: "KLBN11", nome: "Klabin" },
      { ticker: "PETR3", nome: "Petrobras ON" },
      { ticker: "PETR4", nome: "Petrobras PN" },
      { ticker: "PRIO3", nome: "PRIO" },
      { ticker: "PSSA3", nome: "Porto Seguro" },
      { ticker: "SANB11", nome: "Santander" },
      { ticker: "SBSP3", nome: "Sabesp" },
      { ticker: "SUZB3", nome: "Suzano" },
      { ticker: "TAEE11", nome: "Taesa" },
      { ticker: "TIMS3", nome: "TIM" },
      { ticker: "TOTS3", nome: "TOTVS" },
      { ticker: "UGPA3", nome: "Ultrapar" },
      { ticker: "VALE3", nome: "Vale" },
      { ticker: "VIVT3", nome: "Telefônica Brasil" },
    ],
  },
  {
    id: "smallcaps",
    label: "🔬 Small Caps",
    descricao: "Ações do índice Small Caps (SMLL)",
    subtitulo: "Ações menores da bolsa brasileira com maior potencial de crescimento",
    ativos: [
      { ticker: "AERI3", nome: "Aeris" },
      { ticker: "AGRO3", nome: "BrasilAgro" },
      { ticker: "ALPA4", nome: "Alpargatas" },
      { ticker: "AMAR3", nome: "Marisa" },
      { ticker: "AMBP3", nome: "Ambipar" },
      { ticker: "ANIM3", nome: "Ânima" },
      { ticker: "ARML3", nome: "Armac" },
      { ticker: "BHIA3", nome: "Casas Bahia" },
      { ticker: "BLAU3", nome: "Blau Farmacêutica" },
      { ticker: "BRIT3", nome: "Britânia" },
      { ticker: "CBAV3", nome: "CBA" },
      { ticker: "CMIN3", nome: "CSN Mineração" },
      { ticker: "CURY3", nome: "Cury" },
      { ticker: "DIRR3", nome: "Direcional" },
      { ticker: "DXCO3", nome: "Dexco" },
      { ticker: "EVEN3", nome: "Even" },
      { ticker: "EZTC3", nome: "EZTEC" },
      { ticker: "FRAS3", nome: "Fras-le" },
      { ticker: "GFSA3", nome: "Gafisa" },
      { ticker: "GRND3", nome: "Grendene" },
      { ticker: "HBOR3", nome: "Helbor" },
      { ticker: "INTB3", nome: "Intelbras" },
      { ticker: "JHSF3", nome: "JHSF" },
      { ticker: "JSLG3", nome: "JSL" },
      { ticker: "KEPL3", nome: "Kepler Weber" },
      { ticker: "LAVV3", nome: "Lavvi" },
      { ticker: "LEVE3", nome: "Mahle Metal Leve" },
      { ticker: "LJQQ3", nome: "Lojas Quero-Quero" },
      { ticker: "LOGG3", nome: "LOG CP" },
      { ticker: "MATD3", nome: "Mater Dei" },
      { ticker: "MDIA3", nome: "M. Dias Branco" },
      { ticker: "MOVI3", nome: "Movida" },
      { ticker: "MTRE3", nome: "Mitre Realty" },
      { ticker: "MULT3", nome: "Multiplan" },
      { ticker: "MYPK3", nome: "Iochpe-Maxion" },
      { ticker: "ONCO3", nome: "Oncoclínicas" },
      { ticker: "ORVR3", nome: "Orizon" },
      { ticker: "POMO4", nome: "Marcopolo" },
      { ticker: "PTBL3", nome: "Portobello" },
      { ticker: "RECV3", nome: "PetroRecôncavo" },
      { ticker: "ROMI3", nome: "Romi" },
      { ticker: "SIMH3", nome: "Simpar" },
      { ticker: "SLCE3", nome: "SLC Agrícola" },
      { ticker: "SMFT3", nome: "Smart Fit" },
      { ticker: "SMTO3", nome: "São Martinho" },
      { ticker: "STBP3", nome: "Santos Brasil" },
      { ticker: "TEND3", nome: "Tenda" },
      { ticker: "TGMA3", nome: "Tegma" },
      { ticker: "TUPY3", nome: "Tupy" },
      { ticker: "UNIP6", nome: "Unipar" },
      { ticker: "VAMO3", nome: "Vamos" },
      { ticker: "VLID3", nome: "Valid" },
      { ticker: "VULC3", nome: "Vulcabras" },
      { ticker: "WIZC3", nome: "Wiz" },
      { ticker: "ZAMP3", nome: "Zamp" },
    ],
  },

  {
  id: "todo-mercado",
  label: "🌎 Todo Mercado",
  descricao: "Todas as ações disponíveis",
  subtitulo: "Lista ampla com ativos da B3 para análise completa",
  ativos: [
    { ticker: "A2FY34", nome: "A2" },
    { ticker: "AALR3", nome: "Alliar" },
    { ticker: "ABEV3", nome: "Ambev" },
    { ticker: "AERI3", nome: "Aeris" },
    { ticker: "AFLT3", nome: "Afluente" },
    { ticker: "AGRO3", nome: "BrasilAgro" },
    { ticker: "AGXY3", nome: "AgroGalaxy" },
    { ticker: "ALLD3", nome: "Allied" },
    { ticker: "ALOS3", nome: "Allos" },
    { ticker: "ALPA3", nome: "Alpargatas" },
    { ticker: "ALPK3", nome: "Estapar" },
    { ticker: "ALUP11", nome: "Alupar" },
    { ticker: "ALUP3", nome: "Alupar" },
    { ticker: "AMAR3", nome: "Marisa" },
    { ticker: "AMBP3", nome: "Ambipar" },
    { ticker: "AMER3", nome: "Americanas" },
    { ticker: "AMOB3", nome: "Automob" },
    { ticker: "ANIM3", nome: "Anima" },
    { ticker: "ARML3", nome: "Armac" },
    { ticker: "ARND3", nome: "Arandu" },
    { ticker: "ASAI3", nome: "Sendas" },
    { ticker: "ATED3", nome: "Atende" },
    { ticker: "AUAU3", nome: "Petz" },
    { ticker: "AURE3", nome: "Aura" },
    { ticker: "AVLL3", nome: "Alves" },
    { ticker: "AXIA3", nome: "Axia" },
    { ticker: "AZEV3", nome: "Azevedo" },
    { ticker: "AZTE3", nome: "Azteca" },
    { ticker: "AZUL3", nome: "Azul" },
    { ticker: "AZZA3", nome: "Azzas" },
    { ticker: "B1003", nome: "Banco" },
    { ticker: "B3SA3", nome: "B3" },
    { ticker: "BAZA3", nome: "Banco" },
    { ticker: "BBAS3", nome: "Banco" },
    { ticker: "BBDC3", nome: "Banco" },
    { ticker: "BBDC4", nome: "Banco" },
    { ticker: "BBSE3", nome: "BB" },
    { ticker: "BEEF3", nome: "Minerva" },
    { ticker: "BEES3", nome: "Banestes" },
    { ticker: "BGIP3", nome: "Banco" },
    { ticker: "BHIA3", nome: "Casas" },
    { ticker: "BIED3", nome: "Banco" },
    { ticker: "BIOM3", nome: "Biomm" },
    { ticker: "BLAU3", nome: "Blau" },
    { ticker: "BMEB3", nome: "Banco" },
    { ticker: "BMGB4", nome: "Banco" },
    { ticker: "BMKS3", nome: "Bemobi" },
    { ticker: "BMOB3", nome: "Bemobi" },
    { ticker: "BNBR3", nome: "Banco" },
    { ticker: "BOBR4", nome: "Bombril" },
    { ticker: "BPAC3", nome: "BTG" },
    { ticker: "BRAP3", nome: "Bradespar" },
    { ticker: "BRAV3", nome: "Brava" },
    { ticker: "BRKM3", nome: "Braskem" },
    { ticker: "BRSR3", nome: "Banrisul" },
    { ticker: "BRST3", nome: "Brisanet" },
    { ticker: "BSLI3", nome: "Banco" },
    { ticker: "CALI3", nome: "Call" },
    { ticker: "CAMB3", nome: "Cambuci" },
    { ticker: "CAML3", nome: "Camil" },
    { ticker: "CASH3", nome: "Meliuz" },
    { ticker: "CEAB3", nome: "Cea" },
    { ticker: "CEBR3", nome: "Ceb" },
    { ticker: "CEDO3", nome: "Cedro" },
    { ticker: "CEEB3", nome: "Coelba" },
    { ticker: "CGAS3", nome: "Comgas" },
    { ticker: "CGRA4", nome: "Grazziotin" },
    { ticker: "CLSC3", nome: "Celesc" },
    { ticker: "CMIG3", nome: "Cemig" },
    { ticker: "CMIN3", nome: "CSN" },
    { ticker: "COCE5", nome: "Coelce" },
    { ticker: "COGN3", nome: "Cogna" },
    { ticker: "CPFE3", nome: "CPFL" },
    { ticker: "CPLE3", nome: "Copel" },
    { ticker: "CSAN3", nome: "Cosan" },
    { ticker: "CSED3", nome: "Cruzeiro" },
    { ticker: "CSMG3", nome: "Copasa" },
    { ticker: "CSNA3", nome: "CSN" },
    { ticker: "CSUD3", nome: "CSU" },
    { ticker: "CTAX3", nome: "Contax" },
    { ticker: "CTSA3", nome: "Santos" },
    { ticker: "CURY3", nome: "Cury" },
    { ticker: "CVCB3", nome: "CVC" },
    { ticker: "CXSE3", nome: "Caixa" },
    { ticker: "CYRE3", nome: "Cyrela" },
    { ticker: "DASA3", nome: "Dasa" },
    { ticker: "DESK3", nome: "Desktop" },
    { ticker: "DEXP3", nome: "Dexxos" },
    { ticker: "DIRR3", nome: "Direcional" },
    { ticker: "DMVF3", nome: "D1000" },
    { ticker: "DOHL4", nome: "Dohler" },
    { ticker: "DOTZ3", nome: "Dotz" },
    { ticker: "DXCO3", nome: "Dexco" },
    { ticker: "EALT3", nome: "Eletropar" },
    { ticker: "ECOR3", nome: "Ecorodovias" },
    { ticker: "EGIE3", nome: "Engie" },
    { ticker: "EMBJ3", nome: "Embraer" },
    { ticker: "ENEV3", nome: "Eneva" },
    { ticker: "ENGI3", nome: "Energisa" },
    { ticker: "ENJU3", nome: "Enjoei" },
    { ticker: "ENMT3", nome: "Energisa" },
    { ticker: "EPAR3", nome: "Ecorodovias" },
    { ticker: "EQPA3", nome: "Equatorial" },
    { ticker: "EQTL3", nome: "Equatorial" },
    { ticker: "ESPA3", nome: "Espacolaser" },
    { ticker: "ETER3", nome: "Eternit" },
    { ticker: "EUCA3", nome: "Eucatex" },
    { ticker: "EVEN3", nome: "Even" },
    { ticker: "EZTC3", nome: "Eztec" },
    { ticker: "FESA3", nome: "Ferbasa" },
    { ticker: "FHER3", nome: "Fertilizantes" },
    { ticker: "FIGE3", nome: "Iguatemi" },
    { ticker: "FIQE3", nome: "Unifique" },
    { ticker: "FLRY3", nome: "Fleury" },
    { ticker: "FRAS3", nome: "Fras-le" },
    { ticker: "GEPA3", nome: "Paranapanema" },
    { ticker: "GFSA3", nome: "Gafisa" },
    { ticker: "GGBR3", nome: "Gerdau" },
    { ticker: "GGPS3", nome: "GPS" },
    { ticker: "GMAT3", nome: "Grupo" },
    { ticker: "GOAU3", nome: "Metalurgica" },
    { ticker: "GOAU4", nome: "Metalurgica" },
    { ticker: "GRND3", nome: "Grendene" },
    { ticker: "GSHP3", nome: "General" },
    { ticker: "HAGA3", nome: "Haga" },
    { ticker: "HAGA4", nome: "Haga" },
    { ticker: "HAPV3", nome: "Hapvida" },
    { ticker: "HBOR3", nome: "Helbor" },
    { ticker: "HBRE3", nome: "HBR" },
    { ticker: "HBSA3", nome: "Hidrovias" },
    { ticker: "HYPE3", nome: "Hypera" },
    { ticker: "IFCM3", nome: "Infracommerce" },
    { ticker: "IGTI3", nome: "Iguatemi" },
    { ticker: "INEP3", nome: "Inepar" },
    { ticker: "INTB3", nome: "Intelbras" },
    { ticker: "IRBR3", nome: "IRB" },
    { ticker: "ISAE3", nome: "Isa" },
    { ticker: "ISAE4", nome: "Isa" },
    { ticker: "ITSA3", nome: "Itausa" },
    { ticker: "ITSA4", nome: "Itausa" },
    { ticker: "ITUB3", nome: "Itau" },
    { ticker: "JALL3", nome: "Jalles" },
    { ticker: "JHSF3", nome: "JHSF" },
    { ticker: "JSLG3", nome: "JSL" },
    { ticker: "KEPL3", nome: "Kepler" },
    { ticker: "KLBN3", nome: "Klabin" },
    { ticker: "LAND3", nome: "Terra" },
    { ticker: "LAVV3", nome: "Lavvi" },
    { ticker: "LEVE3", nome: "Mahle" },
    { ticker: "LIGT3", nome: "Light" },
    { ticker: "LOGG3", nome: "Log" },
    { ticker: "LOGN3", nome: "Log-In" },
    { ticker: "LPSB3", nome: "LPS" },
    { ticker: "LREN3", nome: "Lojas" },
    { ticker: "LWSA3", nome: "Locaweb" },
    { ticker: "MATD3", nome: "Mater" },
    { ticker: "MBRF3", nome: "Marfrig" },
    { ticker: "MDIA3", nome: "M" },
    { ticker: "MEAL3", nome: "International" },
    { ticker: "MELK3", nome: "Melnick" },
    { ticker: "MGLU3", nome: "Magazine" },
    { ticker: "MILS3", nome: "Mills" },
    { ticker: "MOVI3", nome: "Movida" },
    { ticker: "MRVE3", nome: "MRV" },
    { ticker: "MULT3", nome: "Multiplan" },
    { ticker: "MYPK3", nome: "Iochpe" },
    { ticker: "NATU3", nome: "Natura" },
    { ticker: "NORD3", nome: "Nordon" },
    { ticker: "NUTR3", nome: "Nutriplant" },
    { ticker: "ODPV3", nome: "Odontoprev" },
    { ticker: "OIBR3", nome: "Oi" },
    { ticker: "ONCO3", nome: "Oncoclinicas" },
    { ticker: "PAGS34", nome: "PagSeguro" },
    { ticker: "PCAR3", nome: "Grupo" },
    { ticker: "PETR3", nome: "Petrobras" },
    { ticker: "PINE3", nome: "Banco" },
    { ticker: "PLPL3", nome: "Plano" },
    { ticker: "PNVL3", nome: "Dimed" },
    { ticker: "POMO3", nome: "Marcopolo" },
    { ticker: "POSI3", nome: "Positivo" },
    { ticker: "PRIO3", nome: "Prio" },
    { ticker: "PSSA3", nome: "Porto" },
    { ticker: "QUAL3", nome: "Qualicorp" },
    { ticker: "RADL3", nome: "Raia" },
    { ticker: "RAIL3", nome: "Rumo" },
    { ticker: "RDOR3", nome: "Rede" },
    { ticker: "RENT3", nome: "Localiza" },
    { ticker: "SANB3", nome: "Santander" },
    { ticker: "SBSP3", nome: "Sabesp" },
    { ticker: "SIMH3", nome: "Simpar" },
    { ticker: "SLCE3", nome: "SLC" },
    { ticker: "SMTO3", nome: "Sao" },
    { ticker: "SUZB3", nome: "Suzano" },
    { ticker: "TAEE3", nome: "Taesa" },
    { ticker: "TASA3", nome: "Taurus" },
    { ticker: "TEND3", nome: "Tenda" },
    { ticker: "TGMA3", nome: "Tegma" },
    { ticker: "TIMS3", nome: "TIM" },
    { ticker: "TOTS3", nome: "Totvs" },
    { ticker: "TRIS3", nome: "Trisul" },
    { ticker: "TUPY3", nome: "Tupy" },
    { ticker: "UGPA3", nome: "Ultrapar" },
    { ticker: "UNIP3", nome: "Unipar" },
    { ticker: "USIM3", nome: "Usiminas" },
    { ticker: "VALE3", nome: "Vale" },
    { ticker: "VAMO3", nome: "Vamos" },
    { ticker: "VBBR3", nome: "Vibra" },
    { ticker: "VIVA3", nome: "Vivara" },
    { ticker: "VIVT3", nome: "Telefonica" },
    { ticker: "VLID3", nome: "Valid" },
    { ticker: "VULC3", nome: "Vulcabras" },
    { ticker: "VVEO3", nome: "Viveo" },
    { ticker: "WEGE3", nome: "WEG" },
    { ticker: "WIZC3", nome: "Wiz" },
    { ticker: "YDUQ3", nome: "Yduqs" },
    ],
  },

 {
    id: "fiis",
    label: "🏢 Fundos Imob.",
    descricao: "Principais FIIs do mercado brasileiro",
    subtitulo: "Os principais FIIs do mercado brasileiro — renda passiva via imóveis",
    ativos: [
      { ticker: "AFHI11", nome: "AF Invest CRI" },
      { ticker: "ALZR11", nome: "Alianza Trust" },
      { ticker: "ARCT11", nome: "Arctium" },
      { ticker: "AURE11", nome: "Autonomy" },
      { ticker: "BCFF11", nome: "BTG Fundo de Fundos" },
      { ticker: "BCRI11", nome: "Banestes CRI" },
      { ticker: "BLMG11", nome: "Bluemacaw Log" },
      { ticker: "BRCO11", nome: "Bresco Logística" },
      { ticker: "BRCR11", nome: "BC Fund" },
      { ticker: "BTCI11", nome: "BTG CRI" },
      { ticker: "BTLG11", nome: "BTG Logística" },
      { ticker: "CPTS11", nome: "Capitânia Securities" },
      { ticker: "CVBI11", nome: "CVB Imob CRI" },
      { ticker: "DEVA11", nome: "Devant Recebíveis" },
      { ticker: "DONE11", nome: "Done CRI" },
      { ticker: "EDGA11", nome: "Edgard" },
      { ticker: "EURO11", nome: "Euro Recebíveis" },
      { ticker: "FIIB11", nome: "Industrial do Brasil" },
      { ticker: "FLMA11", nome: "FL Maracanã" },
      { ticker: "FVPQ11", nome: "Faria Lima" },
      { ticker: "GGRC11", nome: "GGR Covepi" },
      { ticker: "HCTR11", nome: "Hectare" },
      { ticker: "HGBS11", nome: "CSHG Brasil Shopping" },
      { ticker: "HGCR11", nome: "CSHG Recebíveis" },
      { ticker: "HGLG11", nome: "CSHG Logística" },
      { ticker: "HGPO11", nome: "CSHG Prime Offices" },
      { ticker: "HGRE11", nome: "CSHG Real Estate" },
      { ticker: "HGRU11", nome: "CSHG Renda Urbana" },
      { ticker: "HSAF11", nome: "HSI Ativos Financeiros" },
      { ticker: "HSML11", nome: "HSI Malls" },
      { ticker: "HTMX11", nome: "Hotel Maxinvest" },
      { ticker: "IRDM11", nome: "Iridium Recebíveis" },
      { ticker: "ITIP11", nome: "Itaúsa CRI" },
      { ticker: "JFLL11", nome: "JFL Living" },
      { ticker: "JSAF11", nome: "JS Ativos Financeiros" },
      { ticker: "JSRE11", nome: "JS Real Estate" },
      { ticker: "KNCR11", nome: "Kinea CRI" },
      { ticker: "KNHY11", nome: "Kinea High Yield" },
      { ticker: "KNIP11", nome: "Kinea Índice Preços" },
      { ticker: "KNRI11", nome: "Kinea Renda Imobiliária" },
      { ticker: "LVBI11", nome: "LivUp Logística" },
      { ticker: "MCCI11", nome: "Mauá Capital CRI" },
      { ticker: "MGFF11", nome: "Mogno Fundo de Fundos" },
      { ticker: "MXRF11", nome: "Maxi Renda" },
      { ticker: "NEWL11", nome: "Newport Logística" },
      { ticker: "NPAR11", nome: "Npar" },
      { ticker: "PATL11", nome: "Pátria Logística" },
      { ticker: "PVBI11", nome: "PV Brasil Offices" },
      { ticker: "RBRP11", nome: "RBR Properties" },
      { ticker: "RBRR11", nome: "RBR Rendimento" },
      { ticker: "RCFA11", nome: "REC CRI Agro" },
      { ticker: "RECR11", nome: "REC Recebíveis" },
      { ticker: "RZAG11", nome: "Riza Agro" },
      { ticker: "RZTR11", nome: "Riza Terrax" },
      { ticker: "SNAG11", nome: "Suno Agro" },
      { ticker: "SNEL11", nome: "Suno Energia" },
      { ticker: "TGAR11", nome: "TG Ativo Real" },
      { ticker: "TRXF11", nome: "TRX Real Estate" },
      { ticker: "URPR11", nome: "Urca Prime Renda" },
      { ticker: "VGHF11", nome: "Valora Hedge Fund" },
      { ticker: "VISC11", nome: "Vinci Shopping Centers" },
      { ticker: "VINO11", nome: "Vinci Offices" },
      { ticker: "VIUR11", nome: "Vinci Urban" },
      { ticker: "VRTA11", nome: "Fator Verita" },
      { ticker: "VSHO11", nome: "Vinci Shopping" },
      { ticker: "VSLH11", nome: "Versalhes" },
      { ticker: "XPCI11", nome: "XP CRI" },
      { ticker: "XPML11", nome: "XP Malls" },
      { ticker: "XPLG11", nome: "XP Log" },
      { ticker: "XPPR11", nome: "XP Properties" },
    ],
  },
  {
    id: "sp500",
    label: "🌎 S&P 500",
    descricao: "Top 100 ações americanas por capitalização",
    subtitulo: "Top 100 ações do S&P 500 por capitalização de mercado — NYSE e NASDAQ",
    ativos: [
      { ticker: "AAPL", nome: "Apple" },
      { ticker: "ABBV", nome: "AbbVie" },
      { ticker: "ABNB", nome: "Airbnb" },
      { ticker: "ACN", nome: "Accenture" },
      { ticker: "ADBE", nome: "Adobe" },
      { ticker: "AMD", nome: "AMD" },
      { ticker: "AMGN", nome: "Amgen" },
      { ticker: "AMZN", nome: "Amazon" },
      { ticker: "AXP", nome: "American Express" },
      { ticker: "BA", nome: "Boeing" },
      { ticker: "BAC", nome: "Bank of America" },
      { ticker: "BLK", nome: "BlackRock" },
      { ticker: "BRK.B", nome: "Berkshire Hathaway" },
      { ticker: "BSX", nome: "Boston Scientific" },
      { ticker: "C", nome: "Citigroup" },
      { ticker: "CAT", nome: "Caterpillar" },
      { ticker: "CL", nome: "Colgate" },
      { ticker: "CMCSA", nome: "Comcast" },
      { ticker: "COP", nome: "ConocoPhillips" },
      { ticker: "COST", nome: "Costco" },
      { ticker: "CRM", nome: "Salesforce" },
      { ticker: "CSCO", nome: "Cisco" },
      { ticker: "CVS", nome: "CVS Health" },
      { ticker: "CVX", nome: "Chevron" },
      { ticker: "DE", nome: "Deere & Co." },
      { ticker: "DHR", nome: "Danaher" },
      { ticker: "DIS", nome: "Disney" },
      { ticker: "DUK", nome: "Duke Energy" },
      { ticker: "EMR", nome: "Emerson Electric" },
      { ticker: "F", nome: "Ford" },
      { ticker: "GD", nome: "General Dynamics" },
      { ticker: "GE", nome: "GE Aerospace" },
      { ticker: "GILD", nome: "Gilead Sciences" },
      { ticker: "GM", nome: "General Motors" },
      { ticker: "GOOGL", nome: "Alphabet" },
      { ticker: "GS", nome: "Goldman Sachs" },
      { ticker: "HD", nome: "Home Depot" },
      { ticker: "HON", nome: "Honeywell" },
      { ticker: "IBM", nome: "IBM" },
      { ticker: "INTC", nome: "Intel" },
      { ticker: "INTU", nome: "Intuit" },
      { ticker: "ISRG", nome: "Intuitive Surgical" },
      { ticker: "JNJ", nome: "Johnson & Johnson" },
      { ticker: "JPM", nome: "JP Morgan Chase" },
      { ticker: "KO", nome: "Coca-Cola" },
      { ticker: "LIN", nome: "Linde" },
      { ticker: "LLY", nome: "Eli Lilly" },
      { ticker: "LMT", nome: "Lockheed Martin" },
      { ticker: "LOW", nome: "Lowe's" },
      { ticker: "MA", nome: "Mastercard" },
      { ticker: "MCD", nome: "McDonald's" },
      { ticker: "MDLZ", nome: "Mondelez" },
      { ticker: "MDT", nome: "Medtronic" },
      { ticker: "META", nome: "Meta" },
      { ticker: "MMM", nome: "3M" },
      { ticker: "MO", nome: "Altria" },
      { ticker: "MRK", nome: "Merck" },
      { ticker: "MS", nome: "Morgan Stanley" },
      { ticker: "MSFT", nome: "Microsoft" },
      { ticker: "MU", nome: "Micron Technology" },
      { ticker: "NEE", nome: "NextEra Energy" },
      { ticker: "NFLX", nome: "Netflix" },
      { ticker: "NKE", nome: "Nike" },
      { ticker: "NOW", nome: "ServiceNow" },
      { ticker: "NVDA", nome: "NVIDIA" },
      { ticker: "ORCL", nome: "Oracle" },
      { ticker: "PEP", nome: "PepsiCo" },
      { ticker: "PFE", nome: "Pfizer" },
      { ticker: "PG", nome: "Procter & Gamble" },
      { ticker: "PLTR", nome: "Palantir" },
      { ticker: "PM", nome: "Philip Morris" },
      { ticker: "PYPL", nome: "PayPal" },
      { ticker: "QCOM", nome: "Qualcomm" },
      { ticker: "RTX", nome: "Raytheon" },
      { ticker: "SBUX", nome: "Starbucks" },
      { ticker: "SHOP", nome: "Shopify" },
      { ticker: "SO", nome: "Southern Company" },
      { ticker: "SPGI", nome: "S&P Global" },
      { ticker: "SYK", nome: "Stryker" },
      { ticker: "T", nome: "AT&T" },
      { ticker: "TGT", nome: "Target" },
      { ticker: "TMO", nome: "Thermo Fisher" },
      { ticker: "TSLA", nome: "Tesla" },
      { ticker: "TSM", nome: "TSMC" },
      { ticker: "TXN", nome: "Texas Instruments" },
      { ticker: "UNH", nome: "UnitedHealth" },
      { ticker: "UNP", nome: "Union Pacific" },
      { ticker: "UPS", nome: "UPS" },
      { ticker: "USB", nome: "U.S. Bancorp" },
      { ticker: "V", nome: "Visa" },
      { ticker: "VZ", nome: "Verizon" },
      { ticker: "WFC", nome: "Wells Fargo" },
      { ticker: "WMT", nome: "Walmart" },
      { ticker: "XOM", nome: "ExxonMobil" },
      { ticker: "AMAT", nome: "Applied Materials" },
      { ticker: "ADI", nome: "Analog Devices" },
      { ticker: "ANET", nome: "Arista Networks" },
      { ticker: "APP", nome: "AppLovin" },
      { ticker: "BX", nome: "Blackstone" },
      { ticker: "CB", nome: "Chubb" },
      { ticker: "CEG", nome: "Constellation Energy" },
      { ticker: "COIN", nome: "Coinbase" },
      { ticker: "ZTS", nome: "Zoetis" },
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
  return (
    <div className="text-left">
      <div className="flex gap-2 flex-wrap mb-6 justify-center">
        {CATEGORIAS.map(cat => (
          <button key={cat.id} onClick={() => { setCategoriaAtiva(cat.id); setFiltro(""); }}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${categoriaAtiva === cat.id ? "bg-green-500 text-black" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700"}`}>
            {cat.label}
          </button>
        ))}
      </div>
      <div className="mt-2 mb-5 px-1">
        <div className="flex items-center gap-3 mb-1">
          <p className="text-white font-bold text-sm">{categoriaAtivaData?.descricao}</p>
          <span className="bg-green-900/40 border border-green-800 rounded-md px-2 py-0.5 text-xs font-bold text-green-400 whitespace-nowrap">
            {ativosFiltrados.length} ativos
          </span>
        </div>
        <p className="text-gray-500 text-xs">{categoriaAtivaData?.subtitulo}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {ativosFiltrados.map(item => (
          <button key={item.ticker} onClick={() => onSelecionar(item.ticker)}
            className="group flex flex-col items-start bg-gray-900 hover:bg-green-500 border border-gray-700 hover:border-green-400 rounded-xl px-3 py-3 transition-all duration-150 hover:scale-105 cursor-pointer w-[48%] sm:w-[30%] md:w-auto md:min-w-[90px]">
            <span className="font-bold text-xs text-green-400 group-hover:text-black leading-tight mb-0.5">{item.ticker}</span>
            <span className="text-gray-500 group-hover:text-black text-xs leading-tight break-words">{item.nome}</span>
          </button>
        ))}
        {ativosFiltrados.length === 0 && (
          <p className="text-gray-600 text-sm py-4">Nenhum ativo encontrado para "{filtro}"</p>
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
        <td className={`px-4 py-3 ${colorClass}`}>
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
    <div className="bg-[#0b1120] border border-white/10 rounded-2xl p-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-black text-white tracking-tight">{secao.titulo}</h1>
        {tipo && <p className="text-gray-500 text-xs mt-1">{tipo}</p>}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-white font-bold text-lg">{preco || "—"}</div>
        {data && <div className="text-gray-600 text-xs mt-1">{data}</div>}
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
    verde:    { bg: "bg-green-950/60",  border: "border-green-500/40",  label: "text-green-400",  text: "text-green-300/80" },
    amarelo:  { bg: "bg-amber-950/50",  border: "border-amber-500/40",  label: "text-amber-400",  text: "text-amber-300/80" },
    vermelho: { bg: "bg-red-950/50",    border: "border-red-500/40",    label: "text-red-400",    text: "text-red-300/80" },
  }[cor];
  return (
    <div className={`${paleta.bg} border ${paleta.border} rounded-2xl px-5 py-4 flex items-center gap-4`}>
      <span className="text-3xl leading-none flex-shrink-0">{emoji}</span>
      <div>
        <div className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${paleta.label}`}>Sentimento de mercado · {label}</div>
        {frase && <p className={`text-sm leading-snug ${paleta.text}`}>{frase}</p>}
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
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">🧠 Leitura do mercado</div>
      <p className="text-white font-semibold text-[15px] leading-relaxed border-l-2 border-green-500 pl-4">{frase}</p>
    </div>
  );
}

// FIX: CardContexto — valuation e outros com texto corrido formatado em blocos visuais
function CardContexto({ secao, icon, label }) {
  const bullets = extrairBullets(secao.corpo);

  // Parágrafos limpos — strip markdown, ignora metadados e separadores
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

  // Parte em sentenças para formatar melhor textos corridos (valuation)
  const sentencas = paragrafos.flatMap(p =>
    p.split(/(?<=[.!?])\s+/).filter(s => s.length > 10)
  );

  return (
    <div className="bg-[#0a1020] border border-white/10 rounded-2xl p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">{icon} {label}</div>
      {bullets.length > 0 ? (
        <ul className="space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-400 text-sm leading-relaxed border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="text-gray-700 mt-1 flex-shrink-0 text-xs">→</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : sentencas.length > 0 ? (
        <ul className="space-y-2">
          {sentencas.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-400 text-sm leading-relaxed border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="text-gray-700 mt-1 flex-shrink-0 text-xs">→</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600 text-sm italic">Sem informações disponíveis nas fontes consultadas.</p>
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
      <div className="bg-green-950/40 border border-green-500/25 rounded-2xl p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-3">🟢 Forças estruturais</div>
        <ul className="space-y-2">
          {forcas.length > 0 ? forcas.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-green-300/80 text-[13px] leading-relaxed border-b border-green-500/10 pb-2 last:border-0 last:pb-0">
              <span className="text-green-600 mt-1 flex-shrink-0 text-xs">+</span><span>{f}</span>
            </li>
          )) : <li className="text-green-800 text-sm">Dados insuficientes.</li>}
        </ul>
      </div>
      <div className="bg-red-950/40 border border-red-500/25 rounded-2xl p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3">🔴 Pontos de atenção</div>
        <ul className="space-y-2">
          {riscos.length > 0 ? riscos.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-red-300/80 text-[13px] leading-relaxed border-b border-red-500/10 pb-2 last:border-0 last:pb-0">
              <span className="text-red-600 mt-1 flex-shrink-0 text-xs">−</span><span>{r}</span>
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
      <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">🎯 Driver principal</div>
      <p className="text-gray-300 text-sm leading-relaxed">{texto}</p>
    </div>
  );
}

function CardInvalida({ secao }) {
  const bullets = extrairBullets(secao.corpo);
  const texto = stripMd(secao.corpo.replace(/^[•\-\*].+$/gm, "").replace(/^#+.+$/m, "").trim());
  return (
    <div className="bg-[#0f0808] border-l-2 border-red-500/70 border-t border-r border-b border-white/10 rounded-r-2xl p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3">⚠️ O que pode invalidar a tese</div>
      {bullets.length > 0 ? (
        <ul className="space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-red-300/70 text-sm leading-relaxed">
              <span className="text-red-600 mt-1 flex-shrink-0">×</span><span>{b}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-sm">{texto}</p>
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
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">📊 Consenso dos analistas</div>
      <div className="space-y-0">
        {metricas.map((m, i) => (
          <div key={i} className="flex justify-between items-baseline gap-3 py-3 border-b border-white/5 last:border-0">
            <span className="text-gray-500 text-sm">{m.key}</span>
            <span className={`font-bold text-sm text-right ${
              /comprar|buy/i.test(m.val) ? "text-green-400" :
              /vender|sell/i.test(m.val) ? "text-red-400" :
              /\+\d/.test(m.val) ? "text-green-400" : "text-white"
            }`}>{m.val}</span>
          </div>
        ))}
      </div>
      {leituraSimples && (
        <div className="mt-4 bg-white/5 border border-white/8 rounded-xl px-4 py-3 text-gray-400 text-[13px] leading-relaxed">
          💡 {leituraSimples}
        </div>
      )}
    </div>
  );
}

function CardAnalistas({ secao }) {
  const tabela = extrairTabelaAnalistas(secao.corpo);
  if (!tabela) return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl p-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents()}>{secao.corpo}</ReactMarkdown>
    </div>
  );
  const cols = Object.keys(tabela[0] || {});
  return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl p-5 overflow-x-auto">
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">📋 Recomendações por analista</div>
      <table className="w-full border-collapse min-w-[500px]">
        <thead>
          <tr>
            {cols.map(col => (
              <th key={col} className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-600 pb-3 border-b border-white/8 pr-4">{col}</th>
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
                  ? /comprar|buy/i.test(val) ? "bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full text-[11px] font-bold"
                  : /manter|hold/i.test(val) ? "bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded-full text-[11px] font-bold"
                  : "bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full text-[11px] font-bold"
                  : null;
                const upCls = val.startsWith("+") && val.includes("%") ? "text-green-400 font-bold"
                  : val.startsWith("-") && val.includes("%") ? "text-red-400 font-bold" : "text-gray-400";
                return (
                  <td key={col} className={`py-3 pr-4 text-sm ${pillCls ? "" : upCls}`}>
                    {pillCls ? <span className={pillCls}>{val}</span> : val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-gray-700 text-[11px] mt-3">Upside calculado com base no preço atual. Analistas com datas confirmadas nos últimos 6 meses.</p>
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
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">📊 Distribuição das recomendações</div>
      <div className="h-2 rounded-full overflow-hidden bg-white/5 flex gap-0.5 mb-3">
        {comprar > 0 && <div className="bg-green-500 rounded-full" style={{ width:`${pct(comprar)}%` }} />}
        {manter  > 0 && <div className="bg-amber-400 rounded-full" style={{ width:`${pct(manter)}%`  }} />}
        {vender  > 0 && <div className="bg-red-500  rounded-full" style={{ width:`${pct(vender)}%`  }} />}
      </div>
      <div className="flex gap-5 flex-wrap text-[12px] mb-4">
        {comprar > 0 && <span className="flex items-center gap-1.5 text-white"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Comprar — {comprar}</span>}
        {manter  > 0 && <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Manter — {manter}</span>}
        {vender  > 0 && <span className="flex items-center gap-1.5 text-gray-400"><span className="w-2 h-2 rounded-full bg-red-500  inline-block" />Vender — {vender}</span>}
      </div>
      {(faixa || media || upside) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
          {faixa  && <div className="bg-white/5 rounded-xl px-3 py-2 text-center"><div className="text-gray-600 text-[10px] uppercase tracking-wider mb-1">Faixa</div><div className="text-white text-sm font-bold">{faixa}</div></div>}
          {media  && <div className="bg-white/5 rounded-xl px-3 py-2 text-center"><div className="text-gray-600 text-[10px] uppercase tracking-wider mb-1">Média</div><div className="text-white text-sm font-bold">{media}</div></div>}
          {upside && <div className="bg-white/5 rounded-xl px-3 py-2 text-center"><div className="text-gray-600 text-[10px] uppercase tracking-wider mb-1">Upside</div><div className="text-green-400 text-sm font-bold">{upside}</div></div>}
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
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">📐 Faixa de projeções</div>
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-950/40 border border-red-500/20 rounded-xl p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">🐻 Cautelosa</div>
          <div className="text-white font-bold text-base">{bear?.preco || "—"}</div>
          <div className="text-red-400/70 text-xs mt-1">{bear?.upside || "—"}</div>
        </div>
        <div className="bg-amber-950/40 border border-amber-500/20 rounded-xl p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">⚖️ Referência</div>
          <div className="text-white font-bold text-base">{base?.preco || "—"}</div>
          <div className="text-amber-400/70 text-xs mt-1">{base?.upside || "—"}</div>
        </div>
        <div className="bg-green-950/40 border border-green-500/20 rounded-xl p-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-green-400 mb-2">🚀 Otimista</div>
          <div className="text-white font-bold text-base">{bull?.preco || "—"}</div>
          <div className="text-green-400/70 text-xs mt-1">{bull?.upside || "—"}</div>
        </div>
      </div>
      {frase && <p className="text-gray-600 text-[11px] mt-3 text-center">{frase}</p>}
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
  const label = semaforo === "verde" ? "text-green-400"   : semaforo === "vermelho" ? "text-red-400"   : "text-amber-400";
  return (
    <div className={`${bg} border-2 ${borda} rounded-2xl p-6`}>
      <div className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${label}`}>📌 Síntese final</div>
      <p className="text-white/90 text-[15px] leading-relaxed">{texto}</p>
      {aviso && <p className="text-gray-700 text-[11px] mt-4 border-t border-white/5 pt-3">{aviso}</p>}
    </div>
  );
}

function CardGenerico({ secao }) {
  return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">{secao.titulo}</div>
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
    <div className={`bg-[#080e1f] border border-white/5 rounded-2xl ${h} overflow-hidden relative`}>
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
    <div className="min-h-screen bg-[#050812] text-white font-sans">
      {/* Shimmer keyframe */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>

      {/* NAVBAR */}
      <header className="h-[78px] border-b border-white/10 flex items-center justify-between px-4 md:px-14">
        <a href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border border-[#69d27b]/50 flex items-center justify-center text-[#69d27b]">
            <span className="text-xl">📊</span>
          </div>
          <div className="text-xl font-bold tracking-tight">
            Radar de <span className="text-[#74d878]">Consenso</span>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-14 text-sm text-white/75">
          <a href="/como-funciona" className="hover:text-white transition-colors">Como funciona</a>
          <a href="/recursos"      className="hover:text-white transition-colors">Recursos</a>
          <a href="/planos"        className="hover:text-white transition-colors">Planos</a>
          <a href="/faq"           className="hover:text-white transition-colors">FAQ</a>
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

        <section className="relative min-h-[480px] border-b border-white/10 px-4 md:px-14 py-8 md:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_35%,rgba(42,143,83,0.15),transparent_35%),linear-gradient(180deg,#060916_0%,#050812_100%)]" />

          {/* GRÁFICO */}
          <div className="absolute right-14 top-16 w-[44%] h-[335px] opacity-75 hidden lg:block">
            <svg viewBox="0 0 620 330" className="w-full h-full">
              <defs>
                <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
                  <path d="M 42 0 L 0 0 0 42" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="620" height="330" fill="url(#grid)" opacity="0.45" />
              <path d="M20 280 C90 230, 115 310, 170 250 S260 190, 310 210 S390 145, 455 95 S525 50, 595 32" fill="none" stroke="#6edc7b" strokeWidth="2" opacity=".85" />
              {[80,105,130,170,205,240,275,315,355,395,430,470,510,545,575].map((x, i) => {
                const y = [210,230,190,165,195,155,132,152,118,95,115,80,62,48,35][i];
                const h = [52,45,58,64,46,70,66,48,72,76,54,72,85,70,65][i];
                const up = i % 4 !== 1;
                return (
                  <g key={x} opacity="0.9">
                    <line x1={x+8} y1={y-18} x2={x+8} y2={y+h+18} stroke={up ? "#6edc7b" : "#ff6b5f"} strokeWidth="1" />
                    <rect x={x} y={y} width="16" height={h} rx="2" fill={up ? "#72dc7c" : "#e85f55"} />
                  </g>
                );
              })}
              <text x="595" y="35"  fill="rgba(255,255,255,.65)" fontSize="14">130.000</text>
              <text x="595" y="105" fill="rgba(255,255,255,.5)"  fontSize="14">128.000</text>
              <text x="70"  y="320" fill="rgba(255,255,255,.45)" fontSize="14">Fev</text>
              <text x="210" y="320" fill="rgba(255,255,255,.45)" fontSize="14">Mar</text>
              <text x="350" y="320" fill="rgba(255,255,255,.45)" fontSize="14">Abr</text>
              <text x="490" y="320" fill="rgba(255,255,255,.45)" fontSize="14">Mai</text>
            </svg>
            <div className="absolute top-10 right-24 rounded-xl border border-white/10 bg-[#0b1020]/80 backdrop-blur px-5 py-4 shadow-2xl">
              <div className="text-white/50 text-xs uppercase tracking-widest mb-1">Exemplo · PETR4</div>
              <div className="text-white font-bold text-sm">Petrobras PN</div>
              <div className="text-white/60 text-xs mt-1">Preço atual: R$ 38,50</div>
              <div className="text-[#6fe17d] text-sm font-bold mt-2">↑ +24,7% potencial</div>
              <div className="mt-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-center font-bold">
                12 de 15 recomendam Comprar
              </div>
            </div>
          </div>

          {/* HERO ESQUERDA */}
          <div className="relative z-10 max-w-[660px] pt-4">
            <div className="flex gap-3 mb-8">
              <span className="rounded-full px-4 py-2 text-sm font-semibold border border-[#61ce70]/50 text-[#79dd7d]">Ações B3</span>
            </div>
            <h1 className="text-[32px] md:text-[48px] leading-[1.12] font-extrabold tracking-[-0.04em] max-w-[650px]">
              O que os <span className="text-[#77d77b]">analistas do mercado</span> estão recomendando agora?
            </h1>
            <p className="mt-6 text-[19px] leading-8 text-white/65 max-w-[610px]">
              Consenso de mercado, preço-alvo e tese consolidada para{" "}
              <strong className="text-white">Ações do Brasil</strong> — sem enrolação.
            </p>

            <form onSubmit={buscarAnalise} className="relative z-50 mt-6 flex flex-col md:flex-row rounded-xl border border-[#79dc80]/45 bg-[#111522]/90 max-w-[760px] overflow-visible">
              <div className="relative z-50 flex-1 flex items-center gap-4 px-5 py-4 md:py-0">
                <span className="text-2xl">🔍</span>
                <input type="text" value={ticker}
                  onChange={e => {
                    const value = e.target.value.toUpperCase();
                    setTicker(value);
                    if (!value) { setSugestoes([]); setMostrarSugestoes(false); return; }
                    const ativosUnicos = Array.from(new Map(CATEGORIAS.flatMap(c => c.ativos).map(a => [a.ticker, a])).values());
                    setSugestoes(ativosUnicos.filter(a => a.ticker.includes(value) || a.nome.toLowerCase().includes(value.toLowerCase())).slice(0, 8));
                    setMostrarSugestoes(true);
                  }}
                  placeholder={`Digite o ativo (${placeholder})`}
                  className="w-full bg-transparent text-white placeholder-white/40 focus:outline-none text-base"
                  disabled={loading}
                />
                {mostrarSugestoes && sugestoes.length > 0 && (
                  <div className="absolute left-0 top-full mt-2 w-full max-h-60 overflow-y-auto bg-[#0b1020] border border-white/10 rounded-lg z-[9999] shadow-2xl">
                    {sugestoes.map(ativo => (
                      <div key={`${ativo.ticker}-${ativo.nome}`}
                        onClick={() => { setTicker(ativo.ticker); setMostrarSugestoes(false); }}
                        className="px-4 py-2 hover:bg-green-500 hover:text-black cursor-pointer text-sm text-white/80">
                        {ativo.ticker} — {ativo.nome}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" disabled={loading || !ticker.trim()}
                className="mx-3 mb-3 md:mb-0 md:mr-4 h-[54px] rounded-lg bg-[#8bcf76] hover:brightness-110 disabled:bg-gray-600 disabled:cursor-not-allowed px-9 text-black font-bold tracking-wide transition">
                {loading ? "Analisando..." : "CONSULTAR AGORA →"}
              </button>
            </form>

            <div className="mt-4 grid grid-cols-3 md:flex md:items-center md:gap-8 text-white/65 text-sm">
              <span className="flex items-center gap-2"><b className="text-[#79dd7d]">✓</b> Acesso liberado</span>
              <span className="flex items-center gap-2 justify-center"><b className="text-[#79dd7d]">⚡</b> Sem cadastro</span>
              <span className="flex items-center gap-2 justify-end md:justify-start"><b className="text-[#79dd7d]">🕐</b> Resultado imediato</span>
            </div>
          </div>

          {!secoes.length && !loading && (
            <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
              <p className="text-white/40 text-xs uppercase font-bold tracking-widest mb-6 text-center">Ou explore por categoria</p>
              <CategoriasExplorer onSelecionar={t => buscarAnalise(null, t)}
                categoriaAtiva={categoriaAtiva} setCategoriaAtiva={setCategoriaAtiva}
                filtro={filtro} setFiltro={setFiltro} />
            </div>
          )}
        </section>

        {/* ÂNCORA FIXA — scroll aponta aqui ao iniciar qualquer análise */}
        <div ref={analiseRef} />

        {/* LOADING — 3 estados visuais: coletando / gerando / blocos chegando */}
        {loading && secoes.length === 0 && (
          <div className="max-w-4xl mx-auto px-6 py-10">
            <div className="bg-[#080e1f] rounded-2xl p-8 border border-white/10">
              <div className="flex flex-col items-center gap-6">

                {/* Spinner duplo */}
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                  <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-green-300/50 border-b-transparent animate-spin" style={{ animationDuration:"0.8s", animationDirection:"reverse" }} />
                </div>

                {/* Título e fase atual */}
                <div className="text-center">
                  <p className="text-white font-bold text-xl">Analisando {ticker}</p>
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

                {/* Etapas visuais */}
                <div className="w-full space-y-2">
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    faseAtual === "coletando" || faseAtual === "cache_hit"
                      ? "bg-green-950/40 border border-green-500/30 text-green-400"
                      : faseAtual === "gerando"
                      ? "bg-white/5 border border-white/5 text-gray-500"
                      : "bg-white/3 border border-white/5 text-gray-600"
                  }`}>
                    <span>{faseAtual === "gerando" ? "✅" : faseAtual === "cache_hit" ? "⚡" : "🔍"}</span>
                    <span>{faseAtual === "cache_hit" ? "Cache encontrado" : "Coleta de dados e recomendações"}</span>
                    {(faseAtual === "coletando") && (
                      <div className="ml-auto w-3 h-3 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                    )}
                  </div>
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                    faseAtual === "gerando"
                      ? "bg-green-950/40 border border-green-500/30 text-green-400"
                      : "bg-white/3 border border-white/5 text-gray-600"
                  }`}>
                    <span>{faseAtual === "gerando" ? "✍️" : "📝"}</span>
                    <span>Geração do relatório</span>
                    {faseAtual === "gerando" && (
                      <div className="ml-auto w-3 h-3 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm bg-white/3 border border-white/5 text-gray-600">
                    <span>📊</span>
                    <span>Blocos aparecem conforme chegam</span>
                  </div>
                </div>

                {/* Barra de progresso + percentual */}
                <div className="w-full space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">
                      {faseAtual === "gerando" ? "Gerando relatório..." : "Coletando dados..."}
                    </span>
                    <span className={`font-bold tabular-nums ${
                      faseAtual === "gerando" ? "text-green-400" : "text-gray-400"
                    }`}>
                      {faseAtual === "gerando"
                        ? "100%"
                        : `${Math.min(Math.round(((msgIndex + 1) / MENSAGENS_LOADING.length) * 90), 90)}%`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-[2000ms] ease-linear"
                      style={{
                        width: faseAtual === "gerando"
                          ? "100%"
                          : `${Math.min(Math.round(((msgIndex + 1) / MENSAGENS_LOADING.length) * 90), 90)}%`,
                        background: faseAtual === "gerando"
                          ? "linear-gradient(90deg, #22c55e, #4ade80)"
                          : "linear-gradient(90deg, #16a34a, #22c55e)",
                      }}
                    />
                  </div>
                </div>

                {/* Mensagem rotativa — mostra o que está sendo feito agora */}
                {faseAtual === "coletando" && (
                  <div className="w-full bg-[#0b1120] border border-white/8 rounded-xl px-4 py-3 text-center min-h-[44px] flex items-center justify-center">
                    <p key={msgIndex} className="text-green-400 text-sm font-medium">
                      {MENSAGENS_LOADING[msgIndex]}
                    </p>
                  </div>
                )}

                {/* Casas de análise */}
                <div className="flex gap-2 flex-wrap justify-center">
                  {["Itaú BBA","BTG Pactual","XP","Bradesco BBI","Safra","Genial"].map((casa, i) => (
                    <span key={casa} className="text-xs bg-white/5 text-gray-500 px-3 py-1 rounded-full animate-pulse" style={{ animationDelay:`${i*0.2}s` }}>{casa}</span>
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
          <div ref={resultadoRef} className="max-w-4xl mx-auto px-4 md:px-6 pb-8 pt-6 space-y-3">
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
                <p className="text-gray-700 text-[11px] text-center pt-2 leading-relaxed">
                  ⚠️ Esta análise possui caráter informativo e educacional, baseada em dados públicos e consenso recente de mercado. Não constitui recomendação individualizada de investimento.
                </p>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-4">
                  <p className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-5">🔍 Continue explorando — analise outro ativo</p>
                  <CategoriasExplorer onSelecionar={t => { setTicker(t); buscarAnalise(null, t); }}
                    categoriaAtiva={categoriaAtivaPos} setCategoriaAtiva={setCategoriaAtivaPos}
                    filtro={filtroPos} setFiltro={setFiltroPos} />
                </div>
              </>
            )}
          </div>
        )}

        {/* CORRETORAS */}
        <section className="relative px-4 md:px-14 py-20 text-center bg-[#050812] border-t border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(105,217,122,0.08),transparent_35%)]" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-green-500/30 bg-green-500/5 text-green-400 text-xs font-bold tracking-[0.22em] uppercase mb-8">
              <span>🛡</span> Confiança e transparência
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Cobertura das principais <br /><span className="text-[#79dd7d]">instituições</span> financeiras
            </h2>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {["Itaú BBA","XP Investimentos","BTG Pactual","Bradesco BBI","Safra","Suno Research"].map(source => (
                <div key={source} className="h-28 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/85 font-semibold text-base hover:border-green-400/40 hover:bg-green-400/[0.04] transition">{source}</div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {["Goldman Sachs","Morgan Stanley","J.P. Morgan"].map(source => (
                <div key={source} className="h-24 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/80 font-medium text-xl hover:border-green-400/40 hover:bg-green-400/[0.04] transition">{source}</div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
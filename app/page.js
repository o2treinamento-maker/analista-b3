"use client";
import React from "react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CardFluxo from "@/components/CardFluxo";
import CardFundamentalista from "@/components/CardFundamentalista";
import { track } from "@vercel/analytics";


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

const EXEMPLOS = ["PETR4", "BBAS3", "VALE3", "CMIG3"];
let exemploIdx = 0;

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
    <div style={{height:"36px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(4,7,18,0.95)",display:"flex",alignItems:"center",overflow:"hidden",whiteSpace:"nowrap",fontSize:"11px",letterSpacing:"0.02em",position:"relative"}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:"80px",background:"linear-gradient(90deg,rgba(4,7,18,1),transparent)",zIndex:2,pointerEvents:"none"}} />
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:"80px",background:"linear-gradient(270deg,rgba(4,7,18,1),transparent)",zIndex:2,pointerEvents:"none"}} />
      <div className="ticker-animation" style={{display:"flex",gap:"0",paddingLeft:"2rem",width:"max-content"}}>
        {items.map((c, i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:"6px",padding:"0 20px",borderRight:"1px solid rgba(255,255,255,0.05)"}}>
            <span style={{color:"rgba(255,255,255,0.5)",fontWeight:500,fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px"}}>{c.ticker}</span>
            <span style={{color:"rgba(255,255,255,0.25)",fontSize:"10px"}}>{c.preco}</span>
            <span style={{color:c.positivo?"#34d399":"#f87171",fontWeight:600,fontSize:"10px",fontFamily:"'IBM Plex Mono',monospace"}}>{c.positivo?"+":""}{c.variacao}</span>
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
    id: "bdrs",
  label: "🌎 BDRs",
  descricao: "Principais BDRs negociados na B3",
  subtitulo: "Empresas globais de tecnologia, consumo, saúde, bancos e energia negociadas via BDR no Brasil",
  ativos: [
    { ticker: "AAPL34", nome: "Apple" },
    { ticker: "MSFT34", nome: "Microsoft" },
    { ticker: "GOGL34", nome: "Alphabet" },
    { ticker: "AMZO34", nome: "Amazon" },
    { ticker: "NVDC34", nome: "NVIDIA" },
    { ticker: "TSLA34", nome: "Tesla" },
    { ticker: "M1TA34", nome: "Meta" },
    { ticker: "NFLX34", nome: "Netflix" },
    { ticker: "ORCL34", nome: "Oracle" },
    { ticker: "ADBE34", nome: "Adobe" },
    { ticker: "A1MD34", nome: "AMD" },
    { ticker: "INTC34", nome: "Intel" },
    { ticker: "CSCO34", nome: "Cisco" },
    { ticker: "QCOM34", nome: "Qualcomm" },
    { ticker: "IBM34", nome: "IBM" },
    { ticker: "PYPL34", nome: "PayPal" },
    { ticker: "VISA34", nome: "Visa" },
    { ticker: "MSCD34", nome: "Mastercard" },
    { ticker: "DISB34", nome: "Disney" },
    { ticker: "N1KE34", nome: "Nike" },
    { ticker: "S1BU34", nome: "Starbucks" },
    { ticker: "MCDC34", nome: "McDonald's" },
    { ticker: "WALM34", nome: "Walmart" },
    { ticker: "COWC34", nome: "Costco" },
    { ticker: "HOME34", nome: "Home Depot" },
    { ticker: "PGCO34", nome: "Procter & Gamble" },
    { ticker: "COCA34", nome: "Coca-Cola" },
    { ticker: "PEPB34", nome: "PepsiCo" },
    { ticker: "COLG34", nome: "Colgate" },
    { ticker: "MDLZ34", nome: "Mondelez" },
    { ticker: "JNJB34", nome: "Johnson & Johnson" },
    { ticker: "PFIZ34", nome: "Pfizer" },
    { ticker: "MRCK34", nome: "Merck" },
    { ticker: "LILY34", nome: "Eli Lilly" },
    { ticker: "ABTT34", nome: "Abbott" },
    { ticker: "UNHH34", nome: "UnitedHealth" },
    { ticker: "AMGN34", nome: "Amgen" },
    { ticker: "GILD34", nome: "Gilead" },
    { ticker: "TMO34", nome: "Thermo Fisher" },
    { ticker: "JPMC34", nome: "JPMorgan" },
    { ticker: "BOAC34", nome: "Bank of America" },
    { ticker: "CITI34", nome: "Citigroup" },
    { ticker: "GSGI34", nome: "Goldman Sachs" },
    { ticker: "MSBR34", nome: "Morgan Stanley" },
    { ticker: "AXPB34", nome: "American Express" },
    { ticker: "BLKC34", nome: "BlackRock" },
    { ticker: "BERK34", nome: "Berkshire Hathaway" },
    { ticker: "BOEI34", nome: "Boeing" },
    { ticker: "CATP34", nome: "Caterpillar" },
    { ticker: "DEEC34", nome: "Deere" },
    { ticker: "HONB34", nome: "Honeywell" },
    { ticker: "LMTB34", nome: "Lockheed Martin" },
    { ticker: "RTXB34", nome: "RTX" },
    { ticker: "EXXO34", nome: "ExxonMobil" },
    { ticker: "CHVX34", nome: "Chevron" },
    { ticker: "ATTB34", nome: "AT&T" },
    { ticker: "VERZ34", nome: "Verizon" },
    { ticker: "CMCS34", nome: "Comcast" },
    { ticker: "UPSS34", nome: "UPS" },
  ],
},
];

const TICKERS_PERMITIDOS = new Set(CATEGORIAS.flatMap(c => c.ativos.map(a => a.ticker.toUpperCase())));

function CategoriasExplorer({ onSelecionar, categoriaAtiva, setCategoriaAtiva, filtro, setFiltro }) {
  const categoriaAtivaData = CATEGORIAS.find(c => c.id === categoriaAtiva);
  const ativosFiltrados = categoriaAtivaData?.ativos.filter(a =>
    filtro === "" || a.ticker.includes(filtro.toUpperCase()) || a.nome.toLowerCase().includes(filtro.toLowerCase())
  ) || [];
  return (
    <div style={{textAlign:"left"}}>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"1.5rem",padding:"4px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"12px",width:"fit-content"}}>
        {CATEGORIAS.map(cat => (
          <button key={cat.id} onClick={() => { setCategoriaAtiva(cat.id); setFiltro(""); }}
            style={{padding:"8px 18px",borderRadius:"8px",border:"none",background:categoriaAtiva===cat.id?"rgba(52,211,153,0.12)":"transparent",color:categoriaAtiva===cat.id?"#34d399":"rgba(255,255,255,0.4)",fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",fontWeight:categoriaAtiva===cat.id?600:400,letterSpacing:"0.04em",cursor:"pointer",transition:"all 0.15s",outline:"none",boxShadow:categoriaAtiva===cat.id?"inset 0 0 0 1px rgba(52,211,153,0.2)":"none"}}
            onMouseEnter={e=>{if(categoriaAtiva!==cat.id){e.currentTarget.style.color="rgba(255,255,255,0.6)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}}
            onMouseLeave={e=>{if(categoriaAtiva!==cat.id){e.currentTarget.style.color="rgba(255,255,255,0.3)";e.currentTarget.style.background="transparent";}}}
          >{cat.label}</button>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"1rem",paddingBottom:"0.75rem",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.25)",letterSpacing:"0.08em"}}>{categoriaAtivaData?.descricao?.toUpperCase()}</span>
        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.6)",letterSpacing:"0.06em",background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.15)",padding:"2px 8px",borderRadius:"4px"}}>{ativosFiltrados.length} ATIVOS</span>
        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.25)",letterSpacing:"0.08em",marginLeft:"auto"}}>{categoriaAtivaData?.subtitulo}</span>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
        {ativosFiltrados.map(item => (
          <button key={item.ticker} onClick={() => onSelecionar(item.ticker)}
            style={{display:"flex",flexDirection:"column",alignItems:"flex-start",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"9px",padding:"10px 14px",cursor:"pointer",transition:"all 0.15s",minWidth:"88px"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(52,211,153,0.07)";e.currentTarget.style.borderColor="rgba(52,211,153,0.2)";e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.02)";e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";e.currentTarget.style.transform="translateY(0)";}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"13px",fontWeight:700,color:"rgba(52,211,153,0.9)",lineHeight:1.2,marginBottom:"3px"}}>{item.ticker}</span>
            <span style={{fontSize:"11px",color:"rgba(255,255,255,0.35)",lineHeight:1.3,fontWeight:400}}>{item.nome}</span>
          </button>
        ))}
        {ativosFiltrados.length === 0 && (
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(255,255,255,0.2)",padding:"1rem 0"}}>— nenhum resultado para "{filtro}"</span>
        )}
      </div>
    </div>
  );
}

function BuscaFlutuante({ visivel, onClick }) {
  if (!visivel) return null;
 
  return (
    <button
      onClick={onClick}
      aria-label="Buscar novo ativo"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9998,
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(52,211,153,0.95) 0%, rgba(5,150,105,0.95) 100%)",
        border: "1px solid rgba(52,211,153,0.5)",
        boxShadow: "0 8px 32px rgba(52,211,153,0.4), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 1px 0 rgba(255,255,255,0.15) inset",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        animation: "fadeUp 0.4s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
        e.currentTarget.style.boxShadow = "0 12px 40px rgba(52,211,153,0.5), 0 0 0 1px rgba(255,255,255,0.12) inset";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(52,211,153,0.4), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 1px 0 rgba(255,255,255,0.15) inset";
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </button>
  );
}
 
function MiniBuscaFinal({ ticker, setTicker, sugestoes, setSugestoes, mostrarSugestoes, setMostrarSugestoes, onBuscar, loading, isMobile }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(8,14,28,0.95) 0%, rgba(4,8,20,0.98) 100%)",
      border: "1px solid rgba(52,211,153,0.18)",
      borderRadius: "16px",
      padding: "24px 20px",
      marginBottom: "1.5rem",
      boxShadow: "0 0 40px rgba(52,211,153,0.04), inset 0 1px 0 rgba(255,255,255,0.04)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "16px",
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          background: "rgba(52,211,153,0.1)",
          border: "1px solid rgba(52,211,153,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div>
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: "12px",
            fontWeight: 700,
            color: "#34d399",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}>Analisar novo ativo</div>
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: "9px",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.08em",
            marginTop: "3px",
          }}>DIGITE OU ESCOLHA ABAIXO</div>
        </div>
      </div>
 
      <form onSubmit={onBuscar}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          background: "rgba(4,8,20,0.9)",
          border: "1px solid rgba(52,211,153,0.18)",
          borderRadius: "12px",
          padding: isMobile ? "12px" : "6px 6px 6px 18px",
          gap: isMobile ? "10px" : "0",
          position: "relative",
          transition: "border-color 0.2s",
        }}>
          {!isMobile && (
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: "12px",
              color: "rgba(52,211,153,0.3)",
              letterSpacing: "0.04em",
              marginRight: "10px",
              flexShrink: 0,
              userSelect: "none",
              fontWeight: 500,
            }}>{">"}_</span>
          )}
 
          <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
            <input
              type="text"
              value={ticker}
              placeholder={isMobile ? "Ex: PETR4, VALE3..." : "Digite outro ticker — PETR4, VALE3, NVDA..."}
              disabled={loading}
              style={{
                outline: "none",
                background: "transparent",
                color: "#fff",
                width: "100%",
                fontSize: isMobile ? "16px" : "15px",
                fontFamily: "'IBM Plex Mono',monospace",
                letterSpacing: "0.05em",
                border: "none",
                padding: 0,
              }}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                setTicker(value);
                if (!value) { setSugestoes([]); setMostrarSugestoes(false); return; }
                const ativosUnicos = Array.from(
                  new Map(
                    CATEGORIAS.flatMap(c => c.ativos).map(a => [a.ticker, a])
                  ).values()
                );
                setSugestoes(
                  ativosUnicos.filter(a =>
                    a.ticker.includes(value) ||
                    a.nome.toLowerCase().includes(value.toLowerCase())
                  ).slice(0, 6)
                );
                setMostrarSugestoes(true);
              }}
            />
 
            {mostrarSugestoes && sugestoes.length > 0 && (
              <div style={{
                position: "absolute",
                left: isMobile ? "-12px" : "-30px",
                right: isMobile ? "-12px" : "auto",
                top: "calc(100% + 12px)",
                width: isMobile ? "calc(100% + 24px)" : "min(440px, calc(100vw - 2rem))",
                background: "rgba(4,7,18,0.99)",
                border: "1px solid rgba(52,211,153,0.18)",
                borderRadius: "10px",
                overflow: "hidden",
                zIndex: 9997,
                boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
                backdropFilter: "blur(24px)",
              }}>
                {sugestoes.map((ativo) => (
                  <div
                    key={ativo.ticker + ativo.nome}
                    onClick={() => { setTicker(ativo.ticker); setMostrarSugestoes(false); }}
                    style={{
                      padding: "12px 16px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(52,211,153,0.06)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <span style={{
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: "13px",
                      color: "#34d399",
                      fontWeight: 700,
                      minWidth: "62px",
                    }}>{ativo.ticker}</span>
                    <span style={{
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.5)",
                    }}>{ativo.nome}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
 
          <button
            type="submit"
            disabled={loading || !ticker.trim()}
            style={{
              background: loading || !ticker.trim() ? "rgba(255,255,255,0.04)" : "rgba(52,211,153,0.15)",
              color: loading || !ticker.trim() ? "rgba(255,255,255,0.2)" : "#34d399",
              border: loading || !ticker.trim() ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(52,211,153,0.35)",
              borderRadius: isMobile ? "10px" : "8px",
              padding: isMobile ? "14px" : "0 22px",
              height: isMobile ? "auto" : "44px",
              width: isMobile ? "100%" : "auto",
              fontFamily: "'IBM Plex Mono',monospace",
              fontWeight: 700,
              fontSize: isMobile ? "12px" : "11px",
              letterSpacing: "0.12em",
              cursor: loading || !ticker.trim() ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.2s",
              boxShadow: loading || !ticker.trim() ? "none" : "0 0 20px rgba(52,211,153,0.15)",
            }}
          >
            {loading ? "PROCESSANDO..." : (isMobile ? "ANALISAR →" : "ANALISAR")}
          </button>
        </div>
      </form>
    </div>
  );
}

function stripMd(texto) {
  if (!texto) return "";
  return texto.replace(/\*\*([^*]+)\*\*/g,"$1").replace(/\*([^*]+)\*/g,"$1").replace(/__([^_]+)__/g,"$1").replace(/_([^_]+)_/g,"$1").replace(/`([^`]+)`/g,"$1").trim();
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

function CardGrafico({ ticker }) {
  const containerId = "tv_widget_" + ticker.replace(/[^a-zA-Z0-9]/g,"_");
  const symbol = tickerParaTradingView(ticker);
  useEffect(() => {
    const el = document.getElementById(containerId);
    if (!el || el.hasChildNodes()) return;
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({autosize:true,symbol,interval:"D",range:"6M",timezone:"America/Sao_Paulo",theme:"dark",style:"1",locale:"br",hide_top_toolbar:false,hide_legend:false,save_image:false,calendar:false,support_host:"https://www.tradingview.com",backgroundColor:"rgba(8, 14, 31, 1)",gridColor:"rgba(255, 255, 255, 0.04)"});
    el.appendChild(script);
    return () => { if (el) el.innerHTML = ""; };
  }, [ticker]);
  return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Grafico — {ticker}</div>
        <a href={"https://www.tradingview.com/chart/?symbol=" + symbol} target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-700 hover:text-gray-400 transition">Abrir no TradingView</a>
      </div>
      <div className="tradingview-widget-container" style={{height:"400px"}}>
        <div id={containerId} className="tradingview-widget-container__widget" style={{height:"100%",width:"100%"}} />
      </div>
    </div>
  );
}

function identificarTipo(titulo) {
  const t = titulo.toLowerCase().replace(/[\u{1F300}-\u{1FFFF}]/gu,"").replace(/[⚖️⚠️📡📰🔮🎯📊📌📐🧠]/g,"").trim();
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
      const titulo = linha.replace(/^## /,"").trim();
      secaoAtual = { tipo: identificarTipo(titulo), titulo, corpo: "" };
    } else if (linha.startsWith("# ") && secoes.length === 0 && !secaoAtual) {
      secoes.push({ tipo: "cabecalho", titulo: linha.replace(/^# /,"").trim(), corpo: "" });
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
    p: ({children}) => <p className="text-gray-300 leading-relaxed mb-3 text-[14px]">{children}</p>,
    strong: ({children}) => <strong className="text-white font-bold">{children}</strong>,
    ul: ({children}) => <ul className="list-none space-y-2 mb-3">{children}</ul>,
    ol: ({children}) => <ol className="list-decimal space-y-2 mb-3 pl-5 text-gray-400">{children}</ol>,
    li: ({children}) => <li className="flex items-start gap-2 text-gray-400 text-[14px] leading-relaxed"><span className="text-gray-600 mt-1 flex-shrink-0">•</span><span>{children}</span></li>,
    blockquote: ({children}) => <blockquote className="border-l-2 border-green-500/40 pl-4 my-3 text-gray-400 text-[13px] leading-relaxed">{children}</blockquote>,
    table: ({children}) => <div className="w-full my-3 overflow-hidden rounded-xl border border-white/10"><table className="w-full border-collapse text-sm">{children}</table></div>,
    thead: ({children}) => <thead className="bg-white/5">{children}</thead>,
    tbody: ({children}) => <tbody>{children}</tbody>,
    tr: ({children}) => <tr className="border-b border-white/5">{children}</tr>,
    th: ({children}) => <th className="px-4 py-3 text-left text-[#79dd7d] font-bold text-xs uppercase tracking-wider">{children}</th>,
    td: ({children}) => {
      const text = typeof children==="string"?children:Array.isArray(children)?children.join(""):String(children||"");
      const isComprar=/comprar|buy/i.test(text), isManter=/manter|hold/i.test(text), isVender=/vender|sell/i.test(text);
      const isPos=text.startsWith("+")&&text.includes("%"), isNeg=text.startsWith("-")&&text.includes("%");
      const colorClass=isComprar||isPos?"text-[#79dd7d] font-bold":isManter?"text-yellow-400 font-bold":isVender||isNeg?"text-red-400 font-bold":"text-white/70";
      const pillClass=isComprar?"bg-green-900/50 text-green-400 px-2 py-0.5 rounded-full text-xs font-bold":isManter?"bg-yellow-900/50 text-yellow-400 px-2 py-0.5 rounded-full text-xs font-bold":isVender?"bg-red-900/50 text-red-400 px-2 py-0.5 rounded-full text-xs font-bold":null;
      return <td className={"px-4 py-3 " + colorClass}>{pillClass?<span className={pillClass}>{children}</span>:children}</td>;
    },
    hr: () => null,
    h3: ({children}) => <h3 className="text-white/80 font-bold text-sm mt-4 mb-2">{children}</h3>,
  };
}

function extrairBullets(corpo) {
  return corpo.split("\n").filter(l => {
    const trim = l.trim();
    if (/^[-*]{2,}$/.test(trim)) return false;
    if (trim.startsWith("|")) return false;
    return trim.startsWith("•")||trim.startsWith("→")||(trim.startsWith("-")&&trim.length>2)||(trim.startsWith("*")&&trim.length>2&&!trim.startsWith("**"));
  }).map(l => stripMd(l.replace(/^[•→\-\*]\s*/,"").trim())).filter(b => b.length>3);
}

function extrairSentimento(corpo) {
  if (/🟢|positivo/i.test(corpo)) return { emoji:"🟢", label:"Positivo", cor:"verde" };
  if (/🔴|negativo/i.test(corpo)) return { emoji:"🔴", label:"Negativo", cor:"vermelho" };
  return { emoji:"🟡", label:"Neutro", cor:"amarelo" };
}

function extrairTabelaAnalistas(corpo) {
  const linhas = corpo.split("\n").filter(l => l.includes("|") && !l.includes("---"));
  if (linhas.length < 2) return null;
  const [header, ...rows] = linhas;
  const cols = header.split("|").map(c => c.trim()).filter(Boolean);
  return rows.map(row => {
    const cells = row.split("|").map(c => c.trim()).filter(Boolean);
    const obj = {};
    cols.forEach((col,i) => { obj[col] = cells[i] || "—"; });
    return obj;
  }).filter(r => Object.values(r).some(v => v && v !== "—"));
}

function extrairMetricasConsenso(corpo) {
  const linhas = corpo.split("\n").filter(l => l.includes("|") && !l.includes("---"));
  if (linhas.length < 2) return [];
  return linhas.slice(1).map(l => {
    const parts = l.split("|").map(c => c.trim()).filter(Boolean);
    return { key: stripMd(parts[0]||""), val: stripMd(parts[1]||"") };
  }).filter(r => r.key && r.val);
}

function extrairDistribuicao(corpo) {
  return {
    comprar: parseInt(corpo.match(/Comprar[^|]*\|\s*(\d+)/i)?.[1]||"0"),
    manter:  parseInt(corpo.match(/Manter[^|]*\|\s*(\d+)/i)?.[1]||"0"),
    vender:  parseInt(corpo.match(/Vender[^|]*\|\s*(\d+)/i)?.[1]||"0"),
  };
}

function extrairProjecoes(corpo) {
  const linhas = corpo.split("\n").filter(l => l.includes("|") && !l.includes("---"));
  const resultado = { bear:null, base:null, bull:null };
  for (const linha of linhas) {
    const cells = linha.split("|").map(c => c.trim()).filter(Boolean);
    if (!cells.length) continue;
    const tipo = cells[0].toLowerCase();
    const preco = stripMd(cells[1]||"—"), upside = stripMd(cells[2]||"—");
    if (/caute|bear/i.test(tipo)) resultado.bear = {preco,upside};
    else if (/refer|base/i.test(tipo)) resultado.base = {preco,upside};
    else if (/otim|bull/i.test(tipo)) resultado.bull = {preco,upside};
  }
  return resultado;
}

// ─── CARDS VISUAIS ────────────────────────────────────────────────────────────

function SectionLabel({ text, color, icon }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"14px"}}>
      {icon && <span style={{fontSize:"14px",lineHeight:1}}>{icon}</span>}
      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",fontWeight:700,color:color||"rgba(255,255,255,0.55)",letterSpacing:"0.08em",textTransform:"uppercase"}}>{text}</span>
      <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.06)"}} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBSTITUIR no page.js — função CardCabecalho final
// Cole no lugar da função CardCabecalho atual.
//   ✓ Sem duplicação da variação
//   ✓ Variação sempre com 2 casas decimais (+0,90% / -1,20%)
//   ✓ Badge colorido com seta
// ═══════════════════════════════════════════════════════════════════════════

function CardCabecalho({ secao }) {
  const tipo  = stripMd((secao.corpo.match(/\*\*Tipo de ativo:\*\*\s*(.+)/)?.[1] || "").trim());
  const linhaPreco = stripMd((secao.corpo.match(/\*\*Pre.o atual:\*\*\s*(.+)/)?.[1] || "").trim());

  // Extrai preço (R$ ou US$ com decimais)
  const precoMatch = linhaPreco.match(/(R\$\s*[\d.,]+|US\$\s*[\d.,]+|[\d.,]+)/);
  const preco = precoMatch ? precoMatch[1].trim() : "";

  // Extrai variação percentual (com ou sem sinal)
  const variacaoMatch = linhaPreco.match(/([+\-−]?\s*[\d.,]+\s*%)/);
  const variacaoStr = variacaoMatch ? variacaoMatch[1].replace(/\s/g, "") : "";

  // Detecta sinal (positivo / negativo / neutro)
  const isNeg = /^[-−]/.test(variacaoStr);
  const isPos = /^\+/.test(variacaoStr) || (variacaoStr && !isNeg && parseFloat(variacaoStr.replace(",", ".")) > 0);
  const variacaoCor   = isPos ? "#34d399" : isNeg ? "#f87171" : "rgba(255,255,255,0.5)";
  const variacaoBg    = isPos ? "rgba(52,211,153,0.12)"  : isNeg ? "rgba(248,113,113,0.12)"  : "rgba(255,255,255,0.04)";
  const variacaoBord  = isPos ? "rgba(52,211,153,0.25)"  : isNeg ? "rgba(248,113,113,0.25)"  : "rgba(255,255,255,0.08)";
  const variacaoSeta  = isPos ? "↗" : isNeg ? "↘" : "→";

  // ── Formata variação com 2 casas decimais sempre (ex: "+0,9%" → "+0,90%")
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

  // Data: limpa string e extrai só o padrão de data válido
  let dataLimpa = linhaPreco;
  if (preco) dataLimpa = dataLimpa.replace(preco, "");
  if (variacaoStr) dataLimpa = dataLimpa.replace(variacaoStr, "");
  dataLimpa = dataLimpa.replace(/[·•|]+/g, " ").replace(/\s+/g, " ").trim();
  const dataMatch = dataLimpa.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/);
  const data = dataMatch ? dataMatch[1].trim() : "";

  // Nome do ativo
  const tickerMatch = secao.titulo.match(/^([A-Z0-9]+)/);
  const ticker = tickerMatch?.[1] || "";
  const nomeEmpresa = secao.titulo.replace(ticker, "").replace(/^\s*[—–-]\s*/, "").trim();

  return (
    <div style={{
      background: "rgba(4,8,20,0.95)",
      border: "1px solid rgba(52,211,153,0.2)",
      borderRadius: "14px",
      boxShadow: "0 0 30px rgba(52,211,153,0.05), inset 0 1px 0 rgba(255,255,255,0.05)",
    }}>
      <div style={{
        padding: "20px 18px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
      }}>
        {/* LADO ESQUERDO — Ticker + Nome + Tipo */}
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: "10px",
            marginBottom: "8px",
            flexWrap: "wrap",
          }}>
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: "28px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}>{ticker}</span>
            {nomeEmpresa && (
              <span style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.45)",
                fontWeight: 400,
              }}>{nomeEmpresa}</span>
            )}
          </div>
          {tipo && (
            <span style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: "9px",
              color: "rgba(52,211,153,0.7)",
              letterSpacing: "0.12em",
              background: "rgba(52,211,153,0.08)",
              padding: "3px 10px",
              borderRadius: "4px",
              border: "1px solid rgba(52,211,153,0.15)",
              display: "inline-block",
            }}>{tipo.toUpperCase()}</span>
          )}
        </div>

        {/* LADO DIREITO — Preço + Badge de Variação + Data */}
        {preco && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "6px",
            flexShrink: 0,
          }}>
            {/* Preço grande */}
            <div style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: "28px",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}>{preco}</div>

            {/* Badge de variação colorido */}
            {variacaoFormatada && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 10px",
                background: variacaoBg,
                border: "1px solid " + variacaoBord,
                borderRadius: "8px",
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: "13px",
                fontWeight: 700,
                color: variacaoCor,
                letterSpacing: "-0.01em",
                boxShadow: isPos
                  ? "0 0 12px rgba(52,211,153,0.08)"
                  : isNeg
                  ? "0 0 12px rgba(248,113,113,0.08)"
                  : "none",
              }}>
                <span style={{ fontSize: "12px", fontWeight: 700 }}>{variacaoSeta}</span>
                <span>{variacaoFormatada}</span>
              </div>
            )}

            {/* Data sutil */}
            {data && (
              <div style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: "10px",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.04em",
                marginTop: "2px",
              }}>{data}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}



function CardSentimento({ secao }) {
  const { emoji, label, cor } = extrairSentimento(secao.corpo);
  const frase = stripMd(secao.corpo.split("\n").find(l => l.trim() && !l.includes(emoji) && !l.includes("##") && !l.startsWith("#") && l.trim().length > 10)?.trim()||"");
  const cfg = {
    verde:    { color:"#34d399", bg:"rgba(52,211,153,0.06)",  border:"rgba(52,211,153,0.2)",  badge:"BULLISH"  },
    amarelo:  { color:"#fbbf24", bg:"rgba(251,191,36,0.06)",  border:"rgba(251,191,36,0.2)",  badge:"NEUTRO"   },
    vermelho: { color:"#f87171", bg:"rgba(248,113,113,0.06)", border:"rgba(248,113,113,0.2)", badge:"BEARISH"  },
  }[cor];
  return (
    <div style={{background:cfg.bg,border:"1px solid "+cfg.border,borderRadius:"14px"}}>
      <div style={{padding:"20px 18px",display:"flex",alignItems:"flex-start",gap:"16px"}}>
        <div style={{width:"48px",height:"48px",borderRadius:"12px",flexShrink:0,background:cfg.color+"15",border:"1px solid "+cfg.color+"30",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",lineHeight:1}}>{emoji}</div>
        <div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",fontWeight:700,color:cfg.color,letterSpacing:"0.06em",marginBottom:"6px"}}>SENTIMENTO DE MERCADO</div>
          {frase && <p style={{fontSize:"14px",color:"rgba(255,255,255,0.65)",lineHeight:1.6,margin:0}}>{frase}</p>}
        </div>
      </div>
    </div>
  );
}

function CardLeitura({ secao }) {
  const frase = stripMd(secao.corpo.split("\n").filter(l => l.trim() && !l.startsWith(">") && !l.startsWith("#")).find(l => l.replace(/^[\s]+/,"").trim().length > 20)?.replace(/^[\s]+/,"").trim() || secao.corpo.slice(0,180).trim());
  return (
    <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"14px"}}>
      <div style={{padding:"20px 18px"}}>
        <SectionLabel text="Leitura do mercado" color="#60a5fa" />
        <p style={{fontSize:"15px",fontWeight:600,color:"rgba(255,255,255,0.85)",lineHeight:1.65,margin:0,borderLeft:"3px solid #60a5fa",paddingLeft:"14px"}}>{frase}</p>
      </div>
    </div>
  );
}

function extrairMomentoItems(corpo) {
  const bullets = extrairBullets(corpo);
  const paragrafos = corpo.split("\n").map(l => l.trim())
    .filter(l => l.length>10&&!l.startsWith("#")&&!l.startsWith("|")&&!l.startsWith(">")&&!/^[-*]{2,}$/.test(l))
    .map(l => stripMd(l)).filter(l => l.length>10);
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
    .filter(l => l.length>10&&!l.startsWith("#")&&!l.startsWith("|")&&!l.startsWith(">")&&!/^[-*]{2,}$/.test(l))
    .map(l => stripMd(l)).filter(l => l.length>10);
  const textos = bullets.length > 0 ? bullets : paragrafos;
  
  const PADROES = [
    { regex: /P\/L(?:\s+forward)?(?:\s+de)?[:\s~]*([0-9][0-9,\.]+x?)/i,        label: "P/L" },
    { regex: /EV\/EBITDA(?:\s+\w+E?)?(?:\s+de)?[:\s~]*([0-9][0-9,\.]+x?)/i,   label: "EV/EBITDA" },
    { regex: /dividend\s*yield(?:\s+de)?[:\s~]*([0-9][0-9,\.]+%?)/i,            label: "Dividend Yield" },
    { regex: /DY(?:\s+de)?[:\s~]*([0-9][0-9,\.]+%?)/i,                          label: "DY" },
    { regex: /upside(?:\s+de)?[:\s~]*([\+]?[0-9][0-9,\.]+%?)/i,                label: "Upside" },
    { regex: /pre[çc]o[- ]alvo(?:\s+m[eé]dio)?(?:\s+de)?[:\s]*R\$\s*([0-9][0-9,\.]+)/i, label: "Preço-alvo" },
    { regex: /TIR(?:\s+real)?(?:\s+de)?[:\s~]*([0-9][0-9,\.\-]+%?)/i,          label: "TIR" },
    { regex: /ROE(?:\s+de)?[:\s~]*([0-9][0-9,\.]+%?)/i,                          label: "ROE" },
    { regex: /FCFE?(?:\s+yield)?(?:\s+de)?[:\s~]*([0-9][0-9,\.\-]+%?)/i,       label: "FCF Yield" },
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

function CardMomento({ secao }) {
  const items = extrairMomentoItems(secao.corpo);
  return (
    <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",padding:"20px 18px"}}>
      <SectionLabel text="Momento atual do ativo" color="rgba(255,255,255,0.6)" icon="📰" />
      <div style={{display:"flex",flexDirection:"column",gap:"0"}}>
        {items.map((item,i) => (
          <div key={i} style={{display:"flex",gap:"12px",padding:"12px 0",borderBottom:i<items.length-1?"1px solid rgba(255,255,255,0.05)":"none",alignItems:"flex-start"}}>
            <div style={{width:"3px",borderRadius:"100px",background:"rgba(52,211,153,0.3)",flexShrink:0,alignSelf:"stretch",minHeight:"16px"}} />
            <div style={{flex:1}}>
              {item.fonte && (
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",fontWeight:700,color:"#34d399",letterSpacing:"0.06em",marginBottom:"4px",display:"block"}}>{item.fonte.toUpperCase()}</span>
              )}
              <p style={{fontSize:"14px",color:"rgba(255,255,255,0.7)",lineHeight:1.6,margin:0}}>{item.texto}</p>
              {item.data && (
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.25)",marginTop:"4px",display:"block"}}>{item.data}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardValuation({ secao }) {
  const { metricas, textos } = extrairMetricasValuation(secao.corpo);
  return (
    <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(96,165,250,0.15)",borderRadius:"14px",padding:"20px 18px"}}>
      <SectionLabel text="Leitura de valuation" color="#60a5fa" icon="⚖️" />
      <div style={{display:"flex",flexDirection:"column",gap:"0"}}>
        {textos.map((t,i) => (
          <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"9px 0",borderBottom:i<textos.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
            <span style={{color:"rgba(96,165,250,0.4)",fontSize:"12px",marginTop:"2px",flexShrink:0}}>◆</span>
            <span style={{fontSize:"14px",color:"rgba(255,255,255,0.65)",lineHeight:1.6}}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardPerspectivas({ secao }) {
  const bullets = extrairBullets(secao.corpo);
  const paragrafos = secao.corpo.split("\n").map(l => l.trim())
    .filter(l => l.length>10&&!l.startsWith("#")&&!l.startsWith("|")&&!l.startsWith(">")&&!/^[-*]{2,}$/.test(l))
    .map(l => stripMd(l)).filter(l => l.length>10);
  const items = bullets.length > 0 ? bullets : paragrafos;
  const getHorizonte = (texto) => {
    if (/2027|2028|2029|2030|longo prazo|médio prazo/i.test(texto)) return { label:"MÉDIO/LONGO", color:"rgba(251,191,36,0.7)" };
    if (/2026|curto prazo|próximo/i.test(texto)) return { label:"CURTO", color:"rgba(52,211,153,0.7)" };
    return { label:"GERAL", color:"rgba(255,255,255,0.25)" };
  };
  return (
    <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(168,85,247,0.15)",borderRadius:"14px",padding:"20px 18px"}}>
      <SectionLabel text="Perspectivas futuras" color="rgba(168,85,247,0.8)" icon="🔮" />
      <div style={{position:"relative"}}>
        <div style={{position:"absolute",left:"5px",top:"8px",bottom:"8px",width:"1px",background:"linear-gradient(180deg,rgba(168,85,247,0.3),rgba(168,85,247,0.05))"}} />
        <div style={{display:"flex",flexDirection:"column",gap:"0",paddingLeft:"22px"}}>
          {items.map((item,i) => {
            const h = getHorizonte(item);
            return (
              <div key={i} style={{position:"relative",padding:"10px 0",borderBottom:i<items.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                <div style={{position:"absolute",left:"-17px",top:"15px",width:"7px",height:"7px",borderRadius:"50%",background:h.color,boxShadow:"0 0 6px "+h.color}} />
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:h.color,letterSpacing:"0.08em",display:"block",marginBottom:"4px"}}>{h.label}</span>
                <p style={{fontSize:"14px",color:"rgba(255,255,255,0.65)",lineHeight:1.6,margin:0}}>{item}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CardContexto({ secao, icon, label }) {
  const bullets = extrairBullets(secao.corpo);
  const paragrafos = secao.corpo.split("\n").map(l => l.trim()).filter(l => l.length>10&&!l.startsWith("#")&&!l.startsWith("|")&&!l.startsWith(">")&&!/^[-*]{2,}$/.test(l)&&!/^\*\*[^*]+\*\*:/.test(l)&&!/^\*\*[^*]+\*\*$/.test(l)).map(l => stripMd(l)).filter(l => l.length>10);
  const sentencas = paragrafos.flatMap(p => p.split(/(?<=[.!?])\s+/).filter(s => s.length>10));
  const items = bullets.length > 0 ? bullets : sentencas;
  return (
    <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px"}}>
      <div style={{padding:"20px 18px"}}>
        <SectionLabel text={label} color="rgba(255,255,255,0.6)" icon={icon} />
        {items.length > 0 ? (
          <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:"0"}}>
            {items.map((item,i) => (
              <li key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"9px 0",borderBottom:i<items.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.25)",marginTop:"3px",flexShrink:0}}>{">"}</span>
                <span style={{fontSize:"14px",color:"rgba(255,255,255,0.65)",lineHeight:1.6}}>{item}</span>
              </li>
            ))}
          </ul>
        ) : <p style={{fontSize:"12px",color:"rgba(255,255,255,0.2)",fontStyle:"italic",margin:0}}>Sem dados disponíveis.</p>}
      </div>
    </div>
  );
}

function CardForcasRiscos({ secao }) {
  const partes = secao.corpo.split(/(?=###?\s*(🔴|PONT|RISCO|ATEN))/i);
  const forcas = extrairBullets(partes[0]||"");
  const riscos = extrairBullets(partes.slice(1).join("")||"");
  return (
    <div className="forcas-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
      <div style={{background:"rgba(4,16,8,0.9)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:"14px"}}>
        <div style={{padding:"20px 18px"}}>
          <SectionLabel text="Forcas estruturais" color="#34d399" />
          <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:"0"}}>
            {forcas.length>0?forcas.map((f,i) => (
              <li key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 0",borderBottom:i<forcas.length-1?"1px solid rgba(52,211,153,0.07)":"none"}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#34d399",marginTop:"2px",flexShrink:0,fontWeight:700}}>+</span>
                <span style={{fontSize:"13px",color:"rgba(52,211,153,0.8)",lineHeight:1.55}}>{f}</span>
              </li>
            )):<li style={{fontSize:"12px",color:"rgba(52,211,153,0.3)",padding:"8px 0"}}>Dados insuficientes.</li>}
          </ul>
        </div>
      </div>
      <div style={{background:"rgba(20,4,4,0.9)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:"14px"}}>
        <div style={{padding:"20px 18px"}}>
          <SectionLabel text="Pontos de atencao" color="#f87171" />
          <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:"0"}}>
            {riscos.length>0?riscos.map((r,i) => (
              <li key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 0",borderBottom:i<riscos.length-1?"1px solid rgba(248,113,113,0.07)":"none"}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#f87171",marginTop:"2px",flexShrink:0,fontWeight:700}}>-</span>
                <span style={{fontSize:"13px",color:"rgba(248,113,113,0.75)",lineHeight:1.55}}>{r}</span>
              </li>
            )):<li style={{fontSize:"12px",color:"rgba(248,113,113,0.3)",padding:"8px 0"}}>Dados insuficientes.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CardDriver({ secao }) {
  const texto = stripMd(secao.corpo.replace(/^#+.+$/m,"").trim());
  return (
    <div style={{background:"rgba(4,8,20,0.9)",border:"1px solid rgba(96,165,250,0.18)",borderRadius:"14px"}}>
      <div style={{padding:"20px 18px"}}>
        <SectionLabel text="Driver principal" color="#60a5fa" icon="🎯" />
        <p style={{fontSize:"14px",color:"rgba(255,255,255,0.7)",lineHeight:1.7,margin:0,borderLeft:"3px solid rgba(96,165,250,0.5)",paddingLeft:"14px"}}>{texto}</p>
      </div>
    </div>
  );
}

function CardInvalida({ secao }) {
  const bullets = extrairBullets(secao.corpo);
  const texto = stripMd(secao.corpo.replace(/^[•\-\*].+$/gm,"").replace(/^#+.+$/m,"").trim());
  return (
    <div style={{background:"rgba(20,4,4,0.85)",border:"1px solid rgba(248,113,113,0.18)",borderRadius:"14px"}}>
      <div style={{padding:"20px 18px"}}>
        <SectionLabel text="O que pode invalidar a tese" color="#f87171" />
        {bullets.length>0?(
          <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:"0"}}>
            {bullets.map((b,i) => (
              <li key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 0",borderBottom:i<bullets.length-1?"1px solid rgba(248,113,113,0.07)":"none"}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#f87171",marginTop:"2px",flexShrink:0,fontWeight:700}}>x</span>
                <span style={{fontSize:"13px",color:"rgba(248,113,113,0.7)",lineHeight:1.55}}>{b}</span>
              </li>
            ))}
          </ul>
        ):<p style={{fontSize:"13px",color:"rgba(255,255,255,0.4)",margin:0}}>{texto}</p>}
      </div>
    </div>
  );
}

function CardConsenso({ secao }) {
  const metricas = extrairMetricasConsenso(secao.corpo);
  return (
    <div style={{background:"rgba(4,8,20,0.9)",border:"1px solid rgba(52,211,153,0.15)",borderRadius:"14px",boxShadow:"0 0 20px rgba(52,211,153,0.04)"}}>
      <div style={{padding:"20px 18px"}}>
        <SectionLabel text="Consenso dos analistas" color="#34d399" icon="📊" />
        <div style={{display:"flex",flexDirection:"column",gap:"0"}}>
          {metricas.map((m,i) => (
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:i<metricas.length-1?"1px solid rgba(255,255,255,0.05)":"none",gap:"1rem"}}>
              <span style={{fontSize:"14px",color:"rgba(255,255,255,0.5)"}}>{m.key}</span>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"14px",fontWeight:700,textAlign:"right",color:/comprar|buy/i.test(m.val)?"#34d399":/vender|sell/i.test(m.val)?"#f87171":/\+\d/.test(m.val)?"#34d399":"rgba(255,255,255,0.85)"}}>{m.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardAnalistas({ secao }) {
  const tabela = extrairTabelaAnalistas(secao.corpo);
  if (!tabela) return (
    <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px"}}>
      <div style={{padding:"20px 18px"}}>
        <SectionLabel text="Recomendacoes por analista" color="rgba(255,255,255,0.6)" icon="📋" />
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents()}>{secao.corpo}</ReactMarkdown>
      </div>
    </div>
  );
  const cols = Object.keys(tabela[0]||{});
  return (
    <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px"}}>
      <div style={{padding:"20px 18px",overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <SectionLabel text="Recomendacoes por analista" color="rgba(255,255,255,0.6)" icon="📋" />
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:"500px"}}>
          <thead><tr>{cols.map(col => <th key={col} style={{textAlign:"left",fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.3)",padding:"6px 12px 10px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>{col.toUpperCase()}</th>)}</tr></thead>
          <tbody>
            {tabela.map((row,i) => (
              <tr key={i} style={{borderBottom:i<tabela.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                {cols.map(col => {
                  const val = row[col]||"—";
                  const isRec = !/corretora|casa/i.test(col) && /comprar|buy|manter|hold|vender|sell/i.test(val);
                  const isUp = val.startsWith("+")&&val.includes("%");
                  const isDown = val.startsWith("-")&&val.includes("%");
                  const recStyle = isRec ? (/comprar|buy/i.test(val)?{background:"rgba(52,211,153,0.12)",color:"#34d399",padding:"3px 10px",borderRadius:"4px",fontWeight:700,border:"1px solid rgba(52,211,153,0.2)"}:/manter|hold/i.test(val)?{background:"rgba(251,191,36,0.12)",color:"#fbbf24",padding:"3px 10px",borderRadius:"4px",fontWeight:700,border:"1px solid rgba(251,191,36,0.2)"}:{background:"rgba(248,113,113,0.12)",color:"#f87171",padding:"3px 10px",borderRadius:"4px",fontWeight:700,border:"1px solid rgba(248,113,113,0.2)"}) : null;
                  return <td key={col} style={{padding:"10px 12px 10px 0",fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",color:isUp?"#34d399":isDown?"#f87171":"rgba(255,255,255,0.55)"}}>{recStyle?<span style={{...recStyle,fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px"}}>{val}</span>:val}</td>;
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
  const pct = v => Math.round((v/total)*100);
  const dominant = comprar>=manter&&comprar>=vender?"comprar":vender>=manter?"vender":"manter";
  const domColor = dominant==="comprar"?"#34d399":dominant==="vender"?"#f87171":"#fbbf24";
  const domBorder = dominant==="comprar"?"rgba(52,211,153,0.18)":dominant==="vender"?"rgba(248,113,113,0.18)":"rgba(251,191,36,0.18)";
  return (
    <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid "+domBorder,borderRadius:"14px"}}>
      <div style={{padding:"20px 18px"}}>
        <SectionLabel text="Distribuicao das recomendacoes" color={domColor} icon="📊" />
        <div style={{height:"6px",borderRadius:"100px",overflow:"hidden",background:"rgba(255,255,255,0.04)",display:"flex",gap:"2px",marginBottom:"14px"}}>
          {comprar>0&&<div style={{background:"#34d399",borderRadius:"100px",width:pct(comprar)+"%"}} />}
          {manter>0&&<div style={{background:"#fbbf24",borderRadius:"100px",width:pct(manter)+"%"}} />}
          {vender>0&&<div style={{background:"#f87171",borderRadius:"100px",width:pct(vender)+"%"}} />}
        </div>
        <div style={{display:"flex",gap:"16px",flexWrap:"wrap"}}>
          {comprar>0&&<span style={{display:"flex",alignItems:"center",gap:"7px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",color:"rgba(255,255,255,0.75)"}}><span style={{width:"8px",height:"8px",borderRadius:"50%",background:"#34d399",display:"inline-block"}} />COMPRAR <span style={{color:"#34d399",fontWeight:700}}>{comprar}</span> <span style={{color:"rgba(52,211,153,0.4)"}}>({pct(comprar)}%)</span></span>}
          {manter>0&&<span style={{display:"flex",alignItems:"center",gap:"7px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(255,255,255,0.5)"}}><span style={{width:"8px",height:"8px",borderRadius:"50%",background:"#fbbf24",display:"inline-block"}} />MANTER <span style={{color:"#fbbf24",fontWeight:700}}>{manter}</span> <span style={{color:"rgba(251,191,36,0.4)"}}>({pct(manter)}%)</span></span>}
          {vender>0&&<span style={{display:"flex",alignItems:"center",gap:"7px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(255,255,255,0.5)"}}><span style={{width:"8px",height:"8px",borderRadius:"50%",background:"#f87171",display:"inline-block"}} />VENDER <span style={{color:"#f87171",fontWeight:700}}>{vender}</span> <span style={{color:"rgba(248,113,113,0.4)"}}>({pct(vender)}%)</span></span>}
        </div>
      </div>
    </div>
  );
}

function CardProjecoes({ secao }) {
  const { bear, base, bull } = extrairProjecoes(secao.corpo);
  return (
    <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px"}}>
      <div style={{padding:"20px 18px"}}>
        <SectionLabel text="Faixa de projecoes" color="rgba(255,255,255,0.6)" icon="📐" />
        <div className="projecoes-grid" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px"}}>
          {[
            {label:"BEAR",data:bear,color:"#f87171",bg:"rgba(20,4,4,0.8)",border:"rgba(248,113,113,0.2)"},
            {label:"BASE",data:base,color:"#fbbf24",bg:"rgba(20,16,4,0.8)",border:"rgba(251,191,36,0.2)"},
            {label:"BULL",data:bull,color:"#34d399",bg:"rgba(4,16,8,0.8)",border:"rgba(52,211,153,0.2)"},
          ].map(({label,data,color,bg,border}) => (
            <div key={label} style={{background:bg,border:"1px solid "+border,borderRadius:"10px",padding:"14px 12px",textAlign:"center"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color,letterSpacing:"0.14em",marginBottom:"8px",fontWeight:700}}>{label}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"16px",fontWeight:700,color:"rgba(255,255,255,0.9)",marginBottom:"4px"}}>{data?.preco||"—"}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color,opacity:0.7}}>{data?.upside||"—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CardSintese({ secao, semaforo }) {
  const texto = stripMd(secao.corpo.replace(/^#+.+$/m,"").replace(/^>\s*⚠️.+$/gm,"").trim());
  const aviso = stripMd(secao.corpo.match(/>\s*⚠️.+/)?.[0]?.replace(/^>\s*/,"").trim()||"");
  const cfg = semaforo==="verde"
    ? {color:"#34d399",bg:"rgba(4,20,10,0.95)",border:"rgba(52,211,153,0.25)",code:"BUY"}
    : semaforo==="vermelho"
    ? {color:"#f87171",bg:"rgba(20,4,4,0.95)",border:"rgba(248,113,113,0.25)",code:"SELL"}
    : {color:"#fbbf24",bg:"rgba(20,16,4,0.95)",border:"rgba(251,191,36,0.25)",code:"HOLD"};
  return (
    <div style={{background:cfg.bg,border:"1px solid "+cfg.border,borderRadius:"14px",boxShadow:"0 0 30px "+cfg.color+"08"}}>
      <div style={{padding:"20px 18px"}}>
        <SectionLabel text="Sintese final" color={cfg.color} icon="📌" />
        <p style={{fontSize:"15px",color:"rgba(255,255,255,0.85)",lineHeight:1.7,margin:0,fontWeight:500,borderLeft:"3px solid "+cfg.color,paddingLeft:"14px"}}>{texto}</p>
        {aviso && <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.2)",marginTop:"14px",paddingTop:"12px",borderTop:"1px solid rgba(255,255,255,0.05)",letterSpacing:"0.04em"}}>{aviso}</p>}
      </div>
    </div>
  );
}

function CardGenerico({ secao }) {
  return (
    <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px"}}>
      <div style={{padding:"20px 18px"}}>
        <SectionLabel text={secao.titulo} color="rgba(255,255,255,0.5)" />
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents()}>{secao.corpo}</ReactMarkdown>
      </div>
    </div>
  );
}

function DivisorPercepcao() {
  return (
    <div style={{
      margin: "32px 0 24px",
      position: "relative",
    }}>
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
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
        }}>
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
              fontSize: "12px",
              fontWeight: 700,
              color: "#60a5fa",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}>Percepção do mercado</div>
            <div style={{
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: "9px",
              color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.08em",
              marginTop: "3px",
            }}>↓ ANÁLISES AGREGADAS DE FONTES PÚBLICAS</div>
          </div>
        </div>

        <p style={{
          fontSize: "13px",
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.65,
          margin: 0,
          paddingLeft: "42px",
        }}>
          A partir daqui, leituras consolidadas a partir de <strong style={{color:"rgba(255,255,255,0.8)",fontWeight:600}}>relatórios de analistas, notícias e percepção pública do mercado</strong>, organizadas pela IA da Qyntor.
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
            fontSize: "9px",
            color: "rgba(96,165,250,0.6)",
            letterSpacing: "0.08em",
            background: "rgba(96,165,250,0.06)",
            border: "1px solid rgba(96,165,250,0.15)",
            padding: "3px 8px",
            borderRadius: "4px",
          }}>FONTE: WEB</span>

          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: "9px",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.08em",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "3px 8px",
            borderRadius: "4px",
          }}>CURADORIA: IA</span>

          <span style={{
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: "9px",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.04em",
            marginLeft: "auto",
          }}>conteúdo de terceiros</span>
        </div>
      </div>
    </div>
  );
}

function CardSkeleton({ tipo }) {
  const alturas = {sentimento:"h-16",leitura:"h-20",momento:"h-32",valuation:"h-28",perspectivas:"h-32",forcas_riscos:"h-36",driver:"h-16",invalida:"h-24",consenso:"h-40",analistas:"h-48",distribuicao:"h-32",projecoes:"h-28",sintese:"h-24",default:"h-20"};
  const h = alturas[tipo]||alturas.default;
  return (
    <div className={"bg-[#080e1f] border border-white/5 rounded-2xl " + h + " overflow-hidden relative"}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/3 to-transparent" style={{backgroundSize:"200% 100%",animation:"shimmer 1.5s infinite linear"}} />
    </div>
  );
}

function RenderizarSecao({ secao, semaforo, visivel }) {
  const style = {opacity:visivel?1:0,transform:visivel?"translateY(0)":"translateY(12px)",transition:"opacity 0.4s ease, transform 0.4s ease"};
  let conteudo;
  switch (secao.tipo) {
    case "cabecalho":    conteudo = <CardCabecalho secao={secao} />; break;
    case "sentimento":   conteudo = <CardSentimento secao={secao} />; break;
    case "leitura":      conteudo = <CardLeitura secao={secao} />; break;
    case "momento":      conteudo = <CardMomento secao={secao} />; break;
    case "valuation":    conteudo = <CardValuation secao={secao} />; break;
    case "perspectivas": conteudo = <CardPerspectivas secao={secao} />; break;
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

export default function Home() {
  const [user, setUser] = useState(null);
  const [ticker, setTicker] = useState("");
  const [tickerBusca, setTickerBusca] = useState("");
  const [sugestoesBusca, setSugestoesBusca] = useState([]);
  const [mostrarSugestoesBusca, setMostrarSugestoesBusca] = useState(false);
  const [mostrarFAB, setMostrarFAB] = useState(false);
  const [tickerAtual, setTickerAtual] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [secoes, setSecoes] = useState([]);
  const [secoesVisiveis, setSecoesVisiveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [faseAtual, setFaseAtual] = useState(null);
  const [erro, setErro] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState("ex: " + EXEMPLOS[0]);
  const [categoriaAtiva, setCategoriaAtiva] = useState("ibovespa");
  const [filtro, setFiltro] = useState("");
  const [categoriaAtivaPos, setCategoriaAtivaPos] = useState("ibovespa");
  const [filtroPos, setFiltroPos] = useState("");
  const [semaforoForcado, setSemaforoForcado] = useState(null);
  const [modalLimiteAberto, setModalLimiteAberto] = useState(false);
  const [historico, setHistorico] = useState([]);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false); // ← NOVO: menu hambúrguer
  const dropdownRef = useRef(null);
  const menuMobileRef = useRef(null); // ← NOVO
  const msgInterval = useRef(null);
  const resultadoRef = useRef(null);
  const analiseRef = useRef(null);
  const bufferRef = useRef("");
  const secoesParsRef = useRef([]);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      exemploIdx = (exemploIdx+1) % EXEMPLOS.length;
      setPlaceholder("ex: " + EXEMPLOS[exemploIdx]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  async function carregarHistorico(uid) {
    if (!uid) { setHistorico([]); return; }
    const { data } = await supabase.from("historico_consultas").select("ticker, nome, criado_em").eq("user_id",uid).order("criado_em",{ascending:false}).limit(8);
    if (data) setHistorico(data);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { setUser(user); carregarHistorico(user?.id); });
    const { data: listener } = supabase.auth.onAuthStateChange((_e,session) => { setUser(session?.user||null); carregarHistorico(session?.user?.id); });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownAberto(false);
      if (menuMobileRef.current && !menuMobileRef.current.contains(e.target)) setMenuMobileAberto(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (loading) {
      setMsgIndex(0);
      msgInterval.current = setInterval(() => { setMsgIndex(prev => (prev+1) % MENSAGENS_LOADING.length); }, 2000);
      setTimeout(() => { analiseRef.current?.scrollIntoView({behavior:"smooth",block:"start"}); }, 150);
    } else { clearInterval(msgInterval.current); }
    return () => clearInterval(msgInterval.current);
  }, [loading]);

   useEffect(() => {
    if (!secoes.length) { setMostrarFAB(false); return; }
    const checkScroll = () => setMostrarFAB(window.scrollY > 800);
    window.addEventListener("scroll", checkScroll);
    checkScroll();
    return () => window.removeEventListener("scroll", checkScroll);
  }, [secoes.length]);

  // ━━━ Rolar pro topo + focar input principal ━━━
  function rolarParaBuscaTopo() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      const input = document.querySelector(".hero-input");
      if (input) input.focus();
    }, 600);
  }

  const processarBufferProgressivo = useCallback((buffer) => {
    const parsed = parsearSecoes(buffer);
    if (!parsed.length) return;
    const prevCount = secoesParsRef.current.length;
    if (parsed.length > prevCount) {
      secoesParsRef.current = parsed;
      setSecoes([...parsed]);
      for (let i = prevCount; i < parsed.length; i++) {
        const idx = i;
        setTimeout(() => { setSecoesVisiveis(prev => prev.includes(idx) ? prev : [...prev, idx]); }, (idx-prevCount)*120);
      }
    } else {
      secoesParsRef.current = parsed;
      setSecoes([...parsed]);
    }
  }, []);

  async function fazerLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setHistorico([]);
    setDropdownAberto(false);
    setMenuMobileAberto(false);
    window.location.reload();
  }

  async function buscarAnalise(e, tickerOverride) {
    if (e) e.preventDefault();
    const t = (tickerOverride||ticker).trim().toUpperCase();
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) {
      const consultasAnonimas = Number(localStorage.getItem("consultas_anonimas")||"0");
      if (consultasAnonimas >= 1) { setErro("Voce ja usou sua analise gratis. Crie uma conta para liberar mais."); setTimeout(() => { window.location.href = "/cadastro"; }, 1500); return; }
      localStorage.setItem("consultas_anonimas", String(consultasAnonimas+1));
    }
    if (!t) return;
    if (!TICKERS_PERMITIDOS.has(t)) { setErro('"' + t + '" nao esta disponivel.'); return; }
    setTicker(t); setLoading(true); setFaseAtual("coletando"); setTickerAtual(t);

    setSecoes([]); setSecoesVisiveis([]); setErro(""); setSemaforoForcado(null);
    bufferRef.current = ""; secoesParsRef.current = [];

    // ━━━ TRACKING ━━━
    track("analise_solicitada", {
      ticker: t,
      usuario: u ? "logado" : "anonimo",
    });
    
    if (u) {
      const { data: profile, error: profileError } = await supabase.from("profiles").select("consultas_usadas, limite_consultas, ultima_consulta, plano").eq("id",u.id).single();
      if (profileError) { setErro("Erro ao verificar limite."); setLoading(false); return; }
      const hoje = new Date().toISOString().split("T")[0];
      const ultimaConsulta = profile.ultima_consulta ? new Date(profile.ultima_consulta).toISOString().split("T")[0] : null;
      if (ultimaConsulta !== hoje) { await supabase.from("profiles").update({consultas_usadas:0,ultima_consulta:new Date().toISOString()}).eq("id",u.id); profile.consultas_usadas = 0; }
      if (profile.consultas_usadas >= profile.limite_consultas) { setModalLimiteAberto(true); setLoading(false); return; }
      await supabase.from("profiles").update({consultas_usadas:profile.consultas_usadas+1}).eq("id",u.id);
    }
    try {
      const response = await fetch("/api/analisar", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticker:t})});
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.replace("data: ","");
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) { bufferRef.current += parsed.text; processarBufferProgressivo(bufferRef.current); }
            if (parsed.fase === "coletando") setFaseAtual("coletando");
            if (parsed.fase === "cache_hit")  setFaseAtual("cache_hit");
            if (parsed.fase === "gerando")    setFaseAtual("gerando");
            if (parsed.error) setErro(parsed.error);
            if (parsed.semaforo) setSemaforoForcado(parsed.semaforo);
          } catch {}
        }
      }
      const secoesFinais = parsearSecoes(bufferRef.current);
      secoesParsRef.current = secoesFinais;
      setSecoes([...secoesFinais]);
      setSecoesVisiveis(secoesFinais.map((_,i) => i));
      if (u) {
        const cabecalho = secoesFinais.find(s => s.tipo === "cabecalho");
        const nomeEmpresa = cabecalho?.titulo?.split("—")?.[1]?.trim()||"";
        await supabase.from("historico_consultas").insert({user_id:u.id,ticker:t,nome:nomeEmpresa});
        carregarHistorico(u.id);
      }
    } catch { setErro("Erro ao conectar com o servidor."); }
    finally { setLoading(false); }
  }

  return (
    <div style={{minHeight:"100vh",background:"#040712",color:"#fff",fontFamily:"'Inter',sans-serif"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes scan { 0%{top:0%;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes grid-breathe { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes ticker-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .anim-fadeup { animation: fadeUp 0.7s ease forwards; }
        .anim-fadeup-2 { animation: fadeUp 0.7s ease 0.15s forwards; opacity:0; }
        .anim-fadeup-3 { animation: fadeUp 0.7s ease 0.3s forwards; opacity:0; }
        .anim-fadeup-4 { animation: fadeUp 0.7s ease 0.45s forwards; opacity:0; }
        .hero-input { outline:none; background:transparent; color:#fff; width:100%; font-size:15px; font-family:'IBM Plex Mono',monospace; letter-spacing:0.05em; }
        .hero-input::placeholder { color:rgba(255,255,255,0.2); }
        .search-wrap:focus-within { border-color:rgba(52,211,153,0.45)!important; box-shadow:0 0 0 1px rgba(52,211,153,0.15),0 0 50px rgba(52,211,153,0.1),inset 0 1px 0 rgba(255,255,255,0.06)!important; background:rgba(4,8,22,0.95)!important; }
        @media (max-width: 600px) {
          .search-wrap { flex-direction: column !important; padding: 12px !important; gap: 10px !important; align-items: stretch !important; border-radius: 16px !important; }
          .search-wrap .search-prefix { display: none !important; }
          .search-input-row { display: flex; align-items: center; gap: 8px; }
          .search-wrap input { font-size: 15px !important; padding: 4px 0 !important; }
          .search-wrap .search-btn { height: 48px !important; padding: 0 !important; font-size: 12px !important; letter-spacing: 0.12em !important; border-radius: 10px !important; width: 100% !important; flex-shrink: 0 !important; }
        }
        .nav-link { color:rgba(255,255,255,0.5); font-size:13px; text-decoration:none; font-weight:500; transition:all 0.2s; padding: 8px 4px; border-bottom: 1px solid transparent; }
        .nav-link:hover { color:rgba(255,255,255,0.95); border-bottom-color: rgba(52,211,153,0.4); }
        .scanline { position:absolute; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(52,211,153,0.25),transparent); animation:scan 10s linear infinite; pointer-events:none; }
        .ticker-animation { animation:ticker-scroll 40s linear infinite; }
        .ticker-animation:hover { animation-play-state:paused; }
        .login-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px; border-radius: 10px;
          background: linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(52,211,153,0.06) 100%);
          border: 1px solid rgba(52,211,153,0.35);
          color: #34d399; font-size: 13px; font-weight: 600;
          text-decoration: none; transition: all 0.2s;
          box-shadow: 0 0 20px rgba(52,211,153,0.08), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .login-btn:hover {
          background: linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(52,211,153,0.1) 100%);
          border-color: rgba(52,211,153,0.5);
          box-shadow: 0 0 28px rgba(52,211,153,0.18), inset 0 1px 0 rgba(255,255,255,0.1);
          transform: translateY(-1px);
        }
        .user-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 6px 12px 6px 6px; border-radius: 100px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7); cursor: pointer;
          transition: all 0.2s;
        }
        .user-btn:hover {
          background: rgba(52,211,153,0.06);
          border-color: rgba(52,211,153,0.25);
        }
        .desktop-nav { display: none; }
        @media (min-width: 768px) { .desktop-nav { display: flex !important; align-items: center; gap: 2rem; } }
        .mobile-only { display: flex; }
        @media (min-width: 768px) { .mobile-only { display: none !important; } }
        .mobile-menu-toggle {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer; transition: all 0.2s;
        }
        .mobile-menu-toggle:hover {
          background: rgba(52,211,153,0.06);
          border-color: rgba(52,211,153,0.25);
        }
        .mobile-menu-toggle span {
          width: 16px; height: 1.5px; background: rgba(255,255,255,0.7);
          display: block; border-radius: 2px; transition: all 0.2s;
        }
        .mobile-menu-toggle span:not(:last-child) { margin-bottom: 4px; }
        .mobile-menu-toggle.open span:nth-child(1) { transform: translateY(5.5px) rotate(45deg); }
        .mobile-menu-toggle.open span:nth-child(2) { opacity: 0; }
        .mobile-menu-toggle.open span:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); }
        @media (max-width: 640px) {
          .forcas-grid { grid-template-columns: 1fr !important; }
          .projecoes-grid { grid-template-columns: 1fr !important; }
          .hero-trust { flex-wrap: wrap !important; justify-content: center !important; }
          .search-wrap { padding: 4px 4px 4px 12px !important; }
          .search-wrap button { padding: 0 14px !important; font-size: 10px !important; height: 44px !important; }
          * { max-width: 100%; box-sizing: border-box; }
        }
      `}</style>

      <header style={{height:"64px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.25rem",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(4,7,18,0.85)",backdropFilter:"blur(24px)",position:"sticky",top:0,zIndex:100}}>
        {/* LOGO */}
        <a href="/" style={{display:"flex",alignItems:"center",gap:"10px",textDecoration:"none"}}>
          <div style={{width:"30px",height:"30px",borderRadius:"8px",background:"linear-gradient(135deg,#34d399 0%,#059669 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"14px",color:"#000",boxShadow:"0 0 16px rgba(52,211,153,0.35)",flexShrink:0}}>Q</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"17px",color:"rgba(255,255,255,0.95)",letterSpacing:"-0.02em"}}>QYNTOR</span>
        </a>

        {/* NAV DESKTOP — apenas "Como funciona" e "Planos" */}
        <nav className="desktop-nav">
          <a href="/como-funciona" className="nav-link">Como funciona</a>
          <a href="/planos" className="nav-link">Planos</a>
        </nav>

        {/* LADO DIREITO */}
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          {user ? (
            <>
              {/* DESKTOP — botão de usuário com dropdown */}
              <div className="desktop-nav" style={{position:"relative"}} ref={dropdownRef}>
                <button onClick={() => setDropdownAberto(prev => !prev)} className="user-btn">
                  <div style={{width:"30px",height:"30px",borderRadius:"50%",background:"linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.1))",border:"1px solid rgba(52,211,153,0.4)",display:"flex",alignItems:"center",justifyContent:"center",color:"#34d399",fontWeight:700,fontSize:"13px"}}>{(user.email?.[0]||"U").toUpperCase()}</div>
                  <span style={{fontSize:"13px",maxWidth:"160px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</span>
                  <span style={{fontSize:"9px",color:"rgba(255,255,255,0.4)",marginLeft:"2px",transition:"transform 0.2s",transform:dropdownAberto?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
                </button>
                {dropdownAberto && (
                  <div style={{position:"fixed",right:"1rem",left:"1rem",top:"68px",maxWidth:"320px",marginLeft:"auto",background:"rgba(11,17,32,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"14px",boxShadow:"0 24px 60px rgba(0,0,0,0.7)",zIndex:9999,overflow:"hidden",backdropFilter:"blur(24px)",animation:"slideDown 0.2s ease"}}>
                    <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                      <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",marginBottom:"4px"}}>LOGADO COMO</p>
                      <p style={{fontSize:"13px",color:"#fff",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</p>
                    </div>
                    <div style={{padding:"14px 16px"}}>
                      <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",marginBottom:"8px"}}>ULTIMAS CONSULTAS</p>
                      {historico.length > 0 ? (
                        <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:"2px"}}>
                          {historico.map((h,i) => (
                            <li key={i}>
                              <button onClick={() => { setDropdownAberto(false); buscarAnalise(null, h.ticker); }}
                                style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",borderRadius:"8px",background:"transparent",border:"none",cursor:"pointer",transition:"background 0.15s"}}
                                onMouseEnter={e => e.currentTarget.style.background="rgba(52,211,153,0.06)"}
                                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                                  <span style={{color:"#34d399",fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",fontWeight:700}}>{h.ticker}</span>
                                  {h.nome && <span style={{color:"rgba(255,255,255,0.45)",fontSize:"12px",maxWidth:"140px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.nome}</span>}
                                </div>
                                <span style={{color:"rgba(255,255,255,0.25)",fontSize:"12px"}}>→</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : <p style={{fontSize:"12px",color:"rgba(255,255,255,0.3)",padding:"6px 0"}}>Nenhuma consulta ainda</p>}
                    </div>
                    <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"10px"}}>
                      <button onClick={fazerLogout}
                        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"10px 14px",borderRadius:"8px",background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",fontSize:"13px",fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
                        onMouseEnter={e => { e.currentTarget.style.background="rgba(248,113,113,0.15)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.35)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background="rgba(248,113,113,0.08)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.2)"; }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sair da conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* MOBILE — botão hambúrguer */}
              <div className="mobile-only" style={{position:"relative"}} ref={menuMobileRef}>
                <button onClick={() => setMenuMobileAberto(prev => !prev)} className={"mobile-menu-toggle " + (menuMobileAberto?"open":"")} aria-label="Menu">
                  <span /><span /><span />
                </button>
                {menuMobileAberto && (
                  <div style={{position:"absolute",right:0,top:"calc(100% + 10px)",width:"min(280px, calc(100vw - 2rem))",background:"rgba(11,17,32,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"14px",boxShadow:"0 24px 60px rgba(0,0,0,0.7)",zIndex:9999,overflow:"hidden",backdropFilter:"blur(24px)",animation:"slideDown 0.2s ease"}}>
                    {/* Bloco do usuário */}
                    <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:"12px"}}>
                      <div style={{width:"38px",height:"38px",borderRadius:"50%",background:"linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.1))",border:"1px solid rgba(52,211,153,0.4)",display:"flex",alignItems:"center",justifyContent:"center",color:"#34d399",fontWeight:700,fontSize:"14px",flexShrink:0}}>{(user.email?.[0]||"U").toUpperCase()}</div>
                      <div style={{minWidth:0,flex:1}}>
                        <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",marginBottom:"2px"}}>LOGADO</p>
                        <p style={{fontSize:"12px",color:"#fff",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</p>
                      </div>
                    </div>
                    {/* Links */}
                    <div style={{padding:"8px"}}>
                      <a href="/como-funciona" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"block",padding:"11px 14px",borderRadius:"8px",color:"rgba(255,255,255,0.75)",fontSize:"14px",textDecoration:"none",transition:"background 0.15s"}}
                        onMouseEnter={e => e.currentTarget.style.background="rgba(52,211,153,0.06)"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>Como funciona</a>
                      <a href="/planos" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"block",padding:"11px 14px",borderRadius:"8px",color:"rgba(255,255,255,0.75)",fontSize:"14px",textDecoration:"none",transition:"background 0.15s"}}
                        onMouseEnter={e => e.currentTarget.style.background="rgba(52,211,153,0.06)"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>Planos</a>
                    </div>
                    {/* Histórico */}
                    {historico.length > 0 && (
                      <div style={{padding:"8px 16px 12px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                        <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",margin:"4px 0 8px"}}>ULTIMAS CONSULTAS</p>
                        <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:"2px"}}>
                          {historico.slice(0,5).map((h,i) => (
                            <li key={i}>
                              <button onClick={() => { setMenuMobileAberto(false); buscarAnalise(null, h.ticker); }}
                                style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"8px 6px",borderRadius:"6px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left"}}>
                                <span style={{color:"#34d399",fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",fontWeight:700}}>{h.ticker}</span>
                                {h.nome && <span style={{color:"rgba(255,255,255,0.4)",fontSize:"12px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.nome}</span>}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* Sair */}
                    <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"10px"}}>
                      <button onClick={fazerLogout}
                        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"11px 14px",borderRadius:"8px",background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",fontSize:"13px",fontWeight:600,cursor:"pointer"}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sair da conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="login-btn desktop-nav">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Entrar
              </Link>
              {/* MOBILE — botão hambúrguer mesmo sem login */}
              <div className="mobile-only" style={{position:"relative"}} ref={menuMobileRef}>
                <button onClick={() => setMenuMobileAberto(prev => !prev)} className={"mobile-menu-toggle " + (menuMobileAberto?"open":"")} aria-label="Menu">
                  <span /><span /><span />
                </button>
                {menuMobileAberto && (
                  <div style={{position:"fixed",right:"1rem",left:"1rem",top:"68px",maxWidth:"300px",marginLeft:"auto",background:"rgba(11,17,32,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"14px",boxShadow:"0 24px 60px rgba(0,0,0,0.7)",zIndex:9999,overflow:"hidden",backdropFilter:"blur(24px)",animation:"slideDown 0.2s ease"}}>
                    <div style={{padding:"8px"}}>
                      <a href="/como-funciona" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"block",padding:"11px 14px",borderRadius:"8px",color:"rgba(255,255,255,0.75)",fontSize:"14px",textDecoration:"none"}}>Como funciona</a>
                      <a href="/planos" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"block",padding:"11px 14px",borderRadius:"8px",color:"rgba(255,255,255,0.75)",fontSize:"14px",textDecoration:"none"}}>Planos</a>
                    </div>
                    <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"10px"}}>
                      <Link href="/login" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"11px 14px",borderRadius:"8px",background:"linear-gradient(135deg, rgba(52,211,153,0.18), rgba(52,211,153,0.08))",border:"1px solid rgba(52,211,153,0.4)",color:"#34d399",fontSize:"13px",fontWeight:600,textDecoration:"none"}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                        </svg>
                        Entrar
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <TickerTape />

      <main className="relative" style={{overflowX:"hidden"}}>
        {modalLimiteAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-green-500/30 bg-[#070b12] p-6 shadow-2xl">
              <div className="mb-4 inline-flex rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-green-400">Limite gratuito atingido</div>
              <h2 className="text-2xl font-black text-white mb-3">Voce usou suas analises gratuitas de hoje</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">Volte amanha gratuitamente ou libere o Plano Premium com ate 50 analises por dia.</p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-5 space-y-2 text-sm text-gray-300">
                <p>Ate 50 analises por dia</p><p>Consenso consolidado dos analistas</p>
                <p>Preco-alvo, upside e tese resumida</p><p>Plano mensal por R$49,90</p>
              </div>
              <a href="https://wa.me/5551991282389?text=Quero%20assinar%20o%20Plano%20Premium" target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center rounded-xl bg-green-500 px-5 py-4 text-sm font-black text-black transition hover:bg-green-400">Liberar Premium no WhatsApp</a>
              <button type="button" onClick={() => setModalLimiteAberto(false)} className="mt-3 w-full rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-gray-400 transition hover:bg-white/5 hover:text-white">Continuar no plano gratis</button>
            </div>
          </div>
        )}

        <section style={{position:"relative",overflow:"hidden",borderBottom:"1px solid rgba(255,255,255,0.05)",minHeight:"92vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"clamp(4rem, 10vw, 6rem) 1rem clamp(3rem, 6vw, 5rem)"}}>
          <div style={{position:"absolute",inset:0,background:"linear-gradient(160deg,#020510 0%,#030812 50%,#020510 100%)",pointerEvents:"none"}} />
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-60%)",width:"700px",height:"500px",background:"radial-gradient(ellipse, rgba(52,211,153,0.07) 0%, rgba(52,211,153,0.02) 45%, transparent 70%)",borderRadius:"50%",pointerEvents:"none",animation:"glow-pulse 7s ease-in-out infinite",filter:"blur(50px)"}} />
          <div style={{position:"absolute",inset:0,pointerEvents:"none",animation:"grid-breathe 9s ease-in-out infinite"}}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hero-grid-fine" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(52,211,153,0.05)" strokeWidth="0.5"/></pattern>
                <pattern id="hero-grid-large" width="160" height="160" patternUnits="userSpaceOnUse"><path d="M 160 0 L 0 0 0 160" fill="none" stroke="rgba(52,211,153,0.08)" strokeWidth="0.5"/></pattern>
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

          <div style={{position:"relative",zIndex:10,display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",maxWidth:"720px",width:"100%"}} className="anim-fadeup">
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",border:"1px solid rgba(52,211,153,0.2)",background:"rgba(52,211,153,0.05)",borderRadius:"100px",padding:"5px 16px 5px 8px",marginBottom:"2rem"}}>
              <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"rgba(52,211,153,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 2s ease infinite"}} />
              </div>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#34d399",letterSpacing:"0.1em"}}>ALPHA INTELLIGENCE · LIVE</span>
            </div>
            <h1 style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:"clamp(26px,6vw,68px)",lineHeight:1.04,letterSpacing:"-0.04em",color:"rgba(255,255,255,0.95)",marginBottom:"1.25rem"}}>
              Inteligência quantitativa<br/>
              <span style={{color:"#34d399",fontWeight:600}}>para investidores modernos.</span>
            </h1>
            <p className="anim-fadeup-2" style={{fontSize:"16px",lineHeight:1.7,color:"rgba(255,255,255,0.45)",maxWidth:"480px",marginBottom:"2.75rem",fontWeight:400,letterSpacing:"0.01em"}}>
              Plataforma de inteligência financeira com leitura institucional, consenso de mercado e análise quantitativa.
            </p>
            <div className="anim-fadeup-3" style={{width:"100%",maxWidth:"580px",marginBottom:"1.25rem",position:"relative",zIndex:mostrarSugestoes?99999:"auto"}}>
              <form onSubmit={buscarAnalise}>
                {isMobile ? (
                  <div style={{display:"flex",flexDirection:"column",gap:"10px",position:"relative"}}>
                    <div style={{display:"flex",alignItems:"center",background:"rgba(4,8,20,0.95)",border:"1px solid rgba(52,211,153,0.25)",borderRadius:"14px",padding:"14px 16px",backdropFilter:"blur(20px)",boxShadow:"0 0 0 1px rgba(52,211,153,0.08) inset, 0 8px 40px rgba(0,0,0,0.5)"}}>
                      <input
                        type="text"
                        value={ticker}
                        className="hero-input"
                        placeholder="Digite o Ticker: PETR4..."
                        disabled={loading}
                        style={{fontSize:"17px",letterSpacing:"0.06em",fontFamily:"'IBM Plex Mono',monospace",background:"transparent",border:"none",outline:"none",color:"#fff",width:"100%"}}
                        onChange={e => {
                          const value = e.target.value.toUpperCase();
                          setTicker(value);
                          if (!value) { setSugestoes([]); setMostrarSugestoes(false); return; }
                          const ativosUnicos = Array.from(new Map(CATEGORIAS.flatMap(c => c.ativos).map(a => [a.ticker,a])).values());
                          setSugestoes(ativosUnicos.filter(a => a.ticker.includes(value)||a.nome.toLowerCase().includes(value.toLowerCase())).slice(0,6));
                          setMostrarSugestoes(true);
                        }}
                      />
                      {ticker.length > 0 && (
                        <button type="button" onClick={() => { setTicker(""); setSugestoes([]); setMostrarSugestoes(false); }}
                          style={{background:"none",border:"none",color:"rgba(255,255,255,0.3)",fontSize:"18px",cursor:"pointer",padding:"0 0 0 8px",flexShrink:0,lineHeight:1}}>×</button>
                      )}
                    </div>
                    {mostrarSugestoes && sugestoes.length > 0 && (
                      <div style={{background:"rgba(4,7,18,0.98)",border:"1px solid rgba(52,211,153,0.15)",borderRadius:"12px",overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,0.7)",backdropFilter:"blur(24px)"}}>
                        {sugestoes.map(ativo => (
                          <div key={ativo.ticker+ativo.nome}
                            onClick={() => { setTicker(ativo.ticker); setMostrarSugestoes(false); }}
                            style={{padding:"14px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:"16px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"14px",color:"#34d399",fontWeight:700,minWidth:"64px"}}>{ativo.ticker}</span>
                            <span style={{fontSize:"14px",color:"rgba(255,255,255,0.5)"}}>{ativo.nome}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button type="submit" disabled={loading||!ticker.trim()} style={{
                      background:loading||!ticker.trim()?"rgba(255,255,255,0.04)":"rgba(52,211,153,0.15)",
                      color:loading||!ticker.trim()?"rgba(255,255,255,0.2)":"#34d399",
                      border:loading||!ticker.trim()?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(52,211,153,0.35)",
                      borderRadius:"14px",height:"56px",width:"100%",
                      fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"13px",
                      letterSpacing:"0.14em",cursor:loading||!ticker.trim()?"not-allowed":"pointer",
                      transition:"all 0.2s",
                      boxShadow:loading||!ticker.trim()?"none":"0 0 28px rgba(52,211,153,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
                    }}>
                      {loading ? "PROCESSANDO..." : "ANALISAR →"}
                    </button>
                  </div>
                ) : (
                  <div className="search-wrap" style={{display:"flex",alignItems:"center",background:"rgba(4,8,20,0.9)",border:"1px solid rgba(52,211,153,0.18)",borderRadius:"12px",padding:"6px 6px 6px 20px",transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)",position:"relative",backdropFilter:"blur(20px)",boxShadow:"0 0 0 1px rgba(52,211,153,0.06) inset, 0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 40px rgba(0,0,0,0.5)"}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",color:"rgba(52,211,153,0.3)",letterSpacing:"0.04em",marginRight:"12px",flexShrink:0,userSelect:"none",fontWeight:500}}>{">"}_</span>
                    <div style={{flex:1,position:"relative"}}>
                      <input type="text" value={ticker} className="hero-input" placeholder="Digite um ticker — PETR4, VALE3, NVDA..." disabled={loading} style={{fontSize:"16px"}}
                        onChange={e => {
                          const value = e.target.value.toUpperCase();
                          setTicker(value);
                          if (!value) { setSugestoes([]); setMostrarSugestoes(false); return; }
                          const ativosUnicos = Array.from(new Map(CATEGORIAS.flatMap(c => c.ativos).map(a => [a.ticker,a])).values());
                          setSugestoes(ativosUnicos.filter(a => a.ticker.includes(value)||a.nome.toLowerCase().includes(value.toLowerCase())).slice(0,8));
                          setMostrarSugestoes(true);
                        }}
                      />
                      {mostrarSugestoes && sugestoes.length > 0 && (
                        <div style={{position:"absolute",left:"-52px",top:"calc(100% + 10px)",width:"min(calc(100% + 160px), calc(100vw - 2rem))",background:"#040712",border:"1px solid rgba(52,211,153,0.3)",borderRadius:"10px",overflow:"hidden",zIndex:99999,boxShadow:"0 24px 60px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.04) inset"}}>
                          {sugestoes.map(ativo => (
                            <div key={ativo.ticker+ativo.nome} onClick={() => { setTicker(ativo.ticker); setMostrarSugestoes(false); }}
                              style={{padding:"10px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:"14px",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"#040712",transition:"background 0.1s"}}
                              onMouseEnter={e => e.currentTarget.style.background="rgba(52,211,153,0.1)"}
                              onMouseLeave={e => e.currentTarget.style.background="#040712"}>
                              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",color:"#34d399",fontWeight:600,minWidth:"58px"}}>{ativo.ticker}</span>
                              <span style={{fontSize:"12px",color:"rgba(255,255,255,0.5)"}}>{ativo.nome}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button type="submit" disabled={loading||!ticker.trim()} style={{background:loading||!ticker.trim()?"rgba(255,255,255,0.04)":"rgba(52,211,153,0.12)",color:loading||!ticker.trim()?"rgba(255,255,255,0.2)":"#34d399",border:loading||!ticker.trim()?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(52,211,153,0.3)",borderRadius:"8px",padding:"0 24px",height:"50px",fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,fontSize:"11px",letterSpacing:"0.1em",cursor:loading||!ticker.trim()?"not-allowed":"pointer",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.2s",boxShadow:loading||!ticker.trim()?"none":"0 0 24px rgba(52,211,153,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"}}
                      onMouseEnter={e => { if (!loading && ticker.trim()) { e.currentTarget.style.background="rgba(52,211,153,0.2)"; e.currentTarget.style.boxShadow="0 0 32px rgba(52,211,153,0.25)"; }}}
                      onMouseLeave={e => { if (!loading && ticker.trim()) { e.currentTarget.style.background="rgba(52,211,153,0.12)"; e.currentTarget.style.boxShadow="0 0 24px rgba(52,211,153,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"; }}}>
                      {loading ? "PROCESSANDO..." : "ANALISAR"}
                    </button>
                  </div>
                )}
              </form>
            </div>
            <div className="anim-fadeup-4" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"0",flexWrap:isMobile?"wrap":"nowrap",flexDirection:isMobile?"column":"row"}}>
              {[["FREE","Acesso gratuito"],["NO_AUTH","Sem cadastro"],["<1MIN","Resultado rapido"]].map(([code,label],i) => (
                <div key={label} style={{display:"flex",alignItems:"center",gap:"7px",paddingTop:isMobile?"4px":"0",paddingBottom:isMobile?"4px":"0",paddingRight:isMobile?"0":"18px",paddingLeft:isMobile?"0":i===0?"0":"18px",borderRight:isMobile?"none":i<2?"1px solid rgba(255,255,255,0.06)":"none"}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.5)",letterSpacing:"0.06em",fontWeight:700}}>{code}</span>
                  <span style={{fontSize:"12px",color:"rgba(255,255,255,0.28)",fontWeight:400}}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {!secoes.length && !loading && (
            <div style={{width:"100%",maxWidth:"900px",marginTop:isMobile?"2rem":"4rem",paddingTop:isMobile?"1.5rem":"3rem",borderTop:"1px solid rgba(255,255,255,0.05)",position:"relative",zIndex:1,paddingLeft:0,paddingRight:0}}>
              <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"1.5rem",justifyContent:"center"}}>
                <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.04)"}} />
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.18)",letterSpacing:"0.12em"}}>EXPLORAR POR INDICE</span>
                <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.04)"}} />
              </div>
              <CategoriasExplorer onSelecionar={t => buscarAnalise(null,t)} categoriaAtiva={categoriaAtiva} setCategoriaAtiva={setCategoriaAtiva} filtro={filtro} setFiltro={setFiltro} />
            </div>
          )}
        </section>

        {!secoes.length && !loading && (
        <section style={{position:"relative",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(4,8,20,0.5)",padding:isMobile?"2rem 1rem":"clamp(2rem, 6vw, 5rem) 2.5rem",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 60% at 50% 0%, rgba(52,211,153,0.04) 0%, transparent 60%)",pointerEvents:"none"}} />
          <div style={{maxWidth:"1100px",margin:"0 auto",overflowX:"hidden",position:"relative",zIndex:1}}>
            <div style={{textAlign:"center",marginBottom:"3rem"}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.4)",letterSpacing:"0.14em",display:"block",marginBottom:"0.75rem"}}>CONSENSUS INTELLIGENCE ENGINE</span>
              <h2 style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:"clamp(18px,4vw,34px)",letterSpacing:"-0.03em",color:"rgba(255,255,255,0.75)",lineHeight:1.2}}>
                O que o mercado{" "}
                <span style={{color:"#34d399",fontWeight:500}}>esta sinalizando agora</span>
              </h2>
            </div>
            
              {isMobile && (
                <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
                    {[
                      {label:"Ativos cobertos",val:"847+",color:"#34d399"},
                      {label:"Analistas",val:"15+",color:"rgba(255,255,255,0.75)"},
                      {label:"Casas de analise",val:"12",color:"rgba(255,255,255,0.75)"},
                      {label:"Atualizacao",val:"Continua",color:"#34d399"},
                    ].map((item,ix) => (
                      <div key={ix} style={{background:"rgba(4,8,20,0.7)",border:"1px solid rgba(52,211,153,0.12)",borderRadius:"12px",padding:"16px 14px"}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.06em",marginBottom:"8px"}}>{item.label}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"20px",fontWeight:700,color:item.color}}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                    {[
                      {n:"01",t:"Coleta de dados",d:"Busca em 15+ casas de analise em tempo real"},
                      {n:"02",t:"Sintese por IA",d:"Claude consolida e gera o relatorio"},
                    ].map(item => (
                      <div key={item.n} style={{display:"flex",gap:"14px",alignItems:"center",padding:"14px 16px",borderRadius:"12px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(52,211,153,0.5)",fontWeight:700,flexShrink:0}}>{item.n}</span>
                        <div>
                          <div style={{fontSize:"14px",fontWeight:600,color:"rgba(255,255,255,0.85)",marginBottom:"3px"}}>{item.t}</div>
                          <div style={{fontSize:"12px",color:"rgba(255,255,255,0.35)",lineHeight:1.5}}>{item.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{display:isMobile?"none":"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem"}}>
              <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(52,211,153,0.12)",borderRadius:"16px",overflow:"hidden",backdropFilter:"blur(24px)",boxShadow:"0 0 60px rgba(52,211,153,0.04), inset 0 1px 0 rgba(255,255,255,0.04)"}}>
                <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",display:"flex",alignItems:"center",gap:"8px"}}>
                  <div style={{display:"flex",gap:"5px"}}>
                    {["rgba(239,68,68,0.4)","rgba(245,158,11,0.4)","rgba(52,211,153,0.4)"].map((c,i) => <div key={i} style={{width:"7px",height:"7px",borderRadius:"50%",background:c}} />)}
                  </div>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",marginLeft:"4px"}}>qyntor://score-engine</span>
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
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.08em",marginBottom:"4px"}}>{lb}</div>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"14px",fontWeight:600,color:cl}}>{vl}</div>
                    </div>
                  ))}
                </div>
                <div style={{borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                  <svg viewBox="0 0 300 50" style={{width:"100%",display:"block"}}>
                    <defs><linearGradient id="sectionChartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity="0.1"/><stop offset="100%" stopColor="#34d399" stopOpacity="0"/></linearGradient></defs>
                    <path d="M0 45 C30 38,50 42,80 30 S120 18,150 20 S200 10,230 8 S265 5,300 2 L300 50 L0 50Z" fill="url(#sectionChartFill)"/>
                    <path d="M0 45 C30 38,50 42,80 30 S120 18,150 20 S200 10,230 8 S265 5,300 2" fill="none" stroke="#34d399" strokeWidth="1.2" style={{filter:"drop-shadow(0 0 3px rgba(52,211,153,0.4))"}}>
                      <animate attributeName="stroke-dashoffset" from="600" to="0" dur="2s" fill="freeze"/>
                    </path>
                  </svg>
                </div>
              </div>
              <div style={{background:"rgba(4,8,20,0.6)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"16px",padding:"1.5rem",backdropFilter:"blur(12px)",display:"flex",flexDirection:"column",gap:"1rem"}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginBottom:"0.25rem"}}>HOW IT WORKS</div>
                {[{n:"01",t:"Coleta de dados",d:"Busca recomendacoes em tempo real de 15+ casas de analise"},{n:"02",t:"Sintese por IA",d:"Claude analisa e consolida as teses dos analistas"},{n:"03",t:"Score institucional",d:"Calcula consenso, upside e nivel de conviccao"},{n:"04",t:"Relatorio completo",d:"Entrega analise estruturada em segundos"}].map(item => (
                  <div key={item.n} style={{display:"flex",gap:"12px",alignItems:"flex-start",padding:"10px",borderRadius:"8px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)"}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.4)",fontWeight:600,minWidth:"20px",marginTop:"1px"}}>{item.n}</span>
                    <div>
                      <div style={{fontSize:"13px",fontWeight:600,color:"rgba(255,255,255,0.8)",marginBottom:"4px"}}>{item.t}</div>
                      <div style={{fontSize:"12px",color:"rgba(255,255,255,0.35)",lineHeight:1.5}}>{item.d}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                <div style={{background:"rgba(4,8,20,0.7)",border:"1px solid rgba(52,211,153,0.1)",borderRadius:"16px",padding:"1.25rem",backdropFilter:"blur(12px)"}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginBottom:"1rem"}}>MARKET STATS</div>
                  {[["Ativos cobertos","847+","#34d399"],["Analistas monitorados","15+","rgba(255,255,255,0.6)"],["Casas de analise","12","rgba(255,255,255,0.6)"],["Atualizacao","Continua","#34d399"]].map(([label,val,color]) => (
                    <div key={label} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
                      <span style={{fontSize:"12px",color:"rgba(255,255,255,0.4)"}}>{label}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"13px",fontWeight:600,color}}>{val}</span>
                    </div>
                  ))}
                </div>
                <div style={{background:"rgba(4,8,20,0.7)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"12px",padding:"1rem",backdropFilter:"blur(12px)",display:"flex",alignItems:"center",gap:"12px",animation:"float 10s ease-in-out 2s infinite"}}>
                  <div style={{width:"38px",height:"38px",borderRadius:"10px",flexShrink:0,background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.15)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 3h18v18H3z" stroke="rgba(52,211,153,0.4)" strokeWidth="1"/><path d="M7 17l4-6 4 4 4-8" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/></svg>
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

        <div ref={analiseRef} />

        {loading && secoes.length === 0 && (
          <div className="max-w-4xl mx-auto px-6 py-10">
            <div style={{background:"rgba(6,10,24,0.9)",borderRadius:"20px",padding:"2.5rem 2rem",border:"1px solid rgba(52,211,153,0.1)",backdropFilter:"blur(20px)",boxShadow:"0 0 60px rgba(52,211,153,0.04), 0 40px 80px rgba(0,0,0,0.4)"}}>
              <div className="flex flex-col items-center gap-6">
                <div style={{position:"relative",width:"56px",height:"56px"}}>
                  <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"1px solid rgba(52,211,153,0.1)"}} />
                  <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"1.5px solid transparent",borderTopColor:"#34d399",animation:"spin 1.2s linear infinite"}} />
                  <div style={{position:"absolute",inset:"6px",borderRadius:"50%",border:"1px solid transparent",borderBottomColor:"rgba(52,211,153,0.3)",animation:"spin 0.9s linear infinite reverse"}} />
                  <div style={{position:"absolute",inset:"14px",borderRadius:"50%",background:"rgba(52,211,153,0.06)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 1.5s ease infinite"}} />
                  </div>
                </div>
                <div className="text-center">
                  <p style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:"18px",color:"rgba(255,255,255,0.9)",letterSpacing:"-0.02em"}}>Analisando <span style={{color:"#34d399",fontFamily:"'IBM Plex Mono',monospace",fontSize:"17px"}}>{ticker}</span></p>
                  {faseAtual==="cache_hit"&&<p className="text-green-400 text-sm mt-1">Dados em cache — relatorio em instantes</p>}
                  {faseAtual==="coletando"&&<p className="text-gray-400 text-sm mt-1">Pesquisando analistas e dados de mercado — pode levar ate 45 segundos</p>}
                  {faseAtual==="gerando"&&<p className="text-green-400 text-sm mt-1">Dados coletados — gerando o relatorio agora</p>}
                </div>
                <div style={{width:"100%",display:"flex",flexDirection:"column",gap:"4px"}}>
                  {[
                    {id:"coleta",label:faseAtual==="cache_hit"?"Cache hit — dados disponíveis":"Coleta de dados e recomendacoes",active:faseAtual==="coletando"||faseAtual==="cache_hit",done:faseAtual==="gerando",icon:faseAtual==="cache_hit"?"⚡":"01"},
                    {id:"gerar",label:"Sintese e geracao do relatorio",active:faseAtual==="gerando",done:false,icon:"02"},
                    {id:"blocos",label:"Blocos aparecem em tempo real",active:false,done:false,icon:"03"},
                  ].map(step => (
                    <div key={step.id} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 14px",borderRadius:"8px",background:step.done?"rgba(52,211,153,0.04)":step.active?"rgba(52,211,153,0.06)":"rgba(255,255,255,0.01)",border:step.done||step.active?"1px solid rgba(52,211,153,0.15)":"1px solid rgba(255,255,255,0.04)",transition:"all 0.3s"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",fontWeight:600,color:step.done?"#34d399":step.active?"rgba(52,211,153,0.7)":"rgba(255,255,255,0.15)",minWidth:"22px"}}>{step.done?"✓":step.icon}</span>
                      <span style={{fontFamily:"'Inter',sans-serif",fontSize:"12px",flex:1,color:step.done||step.active?"rgba(255,255,255,0.6)":"rgba(255,255,255,0.2)",letterSpacing:"0.01em"}}>{step.label}</span>
                      {step.active&&<div style={{width:"12px",height:"12px",borderRadius:"50%",flexShrink:0,border:"1.5px solid transparent",borderTopColor:"#34d399",animation:"spin 1s linear infinite"}} />}
                    </div>
                  ))}
                </div>
                {(() => {
                  const pct = faseAtual==="gerando"?100:Math.min(Math.round(((msgIndex+1)/MENSAGENS_LOADING.length)*88)+5,90);
                  return (
                    <div style={{width:"100%"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",letterSpacing:"0.06em",color:"rgba(255,255,255,0.2)"}}>{faseAtual==="gerando"?"GERANDO RELATORIO":"COLETANDO DADOS"}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",fontWeight:600,color:faseAtual==="gerando"?"#34d399":"rgba(52,211,153,0.5)",letterSpacing:"0.04em"}}>{pct}%</span>
                      </div>
                      <div style={{width:"100%",height:"2px",background:"rgba(255,255,255,0.04)",borderRadius:"100px",overflow:"hidden",position:"relative"}}>
                        <div style={{position:"absolute",left:0,top:0,bottom:0,borderRadius:"100px",width:pct+"%",background:"linear-gradient(90deg, rgba(52,211,153,0.4), #34d399)",boxShadow:"0 0 10px rgba(52,211,153,0.5)",transition:"width 2.2s cubic-bezier(0.4,0,0.2,1)"}} />
                        <div style={{position:"absolute",left:0,top:0,bottom:0,width:pct+"%",background:"linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",backgroundSize:"60px 100%",animation:"shimmer 1.5s linear infinite"}} />
                      </div>
                    </div>
                  );
                })()}
                {faseAtual==="coletando"&&(
                  <div style={{width:"100%",background:"rgba(4,7,18,0.8)",border:"1px solid rgba(52,211,153,0.1)",borderRadius:"8px",padding:"10px 14px",display:"flex",alignItems:"center",gap:"10px",minHeight:"40px"}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(52,211,153,0.4)",flexShrink:0}}>$</span>
                    <p key={msgIndex} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(52,211,153,0.65)",letterSpacing:"0.02em",margin:0}}>{MENSAGENS_LOADING[msgIndex]}</p>
                    <div style={{marginLeft:"auto",display:"flex",gap:"3px",flexShrink:0}}>
                      {[0,1,2].map(i => <div key={i} style={{width:"3px",height:"3px",borderRadius:"50%",background:"rgba(52,211,153,0.4)",animation:"pulse-dot 1.4s ease-in-out " + (i*0.2) + "s infinite"}} />)}
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:"6px",flexWrap:"wrap",justifyContent:"center"}}>
                  {["Itau BBA","BTG Pactual","XP","Bradesco BBI","Safra","Genial"].map((casa,i) => (
                    <span key={casa} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",letterSpacing:"0.06em",color:"rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",padding:"3px 10px",borderRadius:"4px",animation:"pulse-dot 2s ease-in-out infinite",animationDelay:(i*0.3)+"s"}}>{casa.toUpperCase()}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {loading && secoes.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6">
            <div className="bg-green-950/30 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border-2 border-green-500 border-t-transparent animate-spin flex-shrink-0" />
              <p className="text-green-400 text-sm font-medium">Gerando proximas secoes...</p>
            </div>
          </div>
        )}

        {erro && (
          <div className="max-w-4xl mx-auto px-6 mt-6">
            <div className="rounded-2xl border border-green-500/30 bg-green-950/20 p-5">
              <p className="text-white font-bold mb-2">Limite gratuito atingido</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{erro}</p>
              <a href="https://wa.me/5551991282389?text=Quero%20assinar%20o%20Plano%20Premium" target="_blank" rel="noopener noreferrer" className="inline-flex w-full justify-center rounded-xl bg-green-500 px-5 py-3 text-sm font-black text-black hover:bg-green-400 transition">Liberar Plano Premium no WhatsApp</a>
            </div>
          </div>
        )}

        {secoes.length > 0 && (
          <div style={{position:"relative",background:"#040712",minHeight:"100vh"}}>
            <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,opacity:1}}>
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{position:"absolute",inset:0}}>
                  <defs><pattern id="result-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(52,211,153,0.04)" strokeWidth="0.5"/></pattern></defs>
                  <rect width="100%" height="100%" fill="url(#result-grid)" />
                </svg>
              </div>
              <div style={{position:"absolute",top:"10%",right:"5%",width:"300px",height:"300px",background:"radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)",borderRadius:"50%",animation:"glow-pulse 8s ease-in-out infinite"}} />
              <div style={{position:"absolute",bottom:"20%",left:"2%",width:"200px",height:"200px",background:"radial-gradient(circle, rgba(52,211,153,0.03) 0%, transparent 70%)",borderRadius:"50%",animation:"glow-pulse 12s ease-in-out infinite 3s"}} />
            </div>
            <div ref={resultadoRef} style={{position:"relative",zIndex:1}} className="max-w-4xl mx-auto px-4 md:px-6 pb-8 pt-6 space-y-3">
              {secoes.map((secao,i) => (
                <React.Fragment key={i}>
                  <RenderizarSecao secao={secao} semaforo={semaforoForcado} visivel={secoesVisiveis.includes(i)} />
                 {secao.tipo === "cabecalho" && tickerAtual && (
  <>
    <CardFluxo ticker={tickerAtual} />

    <div style={{ marginTop: "18px" }}>
      <CardFundamentalista ticker={tickerAtual} />
    </div>

    <DivisorPercepcao />
  </>
)}


                </React.Fragment>
              ))}
              {!loading && (
                <>
                  <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.12)",textAlign:"center",paddingTop:"1rem",lineHeight:1.7,letterSpacing:"0.02em"}}>
                    Esta analise possui carater informativo e educacional, baseada em dados publicos e consenso recente de mercado. Nao constitui recomendacao individualizada de investimento.
                  </p>

                  <MiniBuscaFinal
                    ticker={tickerBusca}
                    setTicker={setTickerBusca}
                    sugestoes={sugestoesBusca}
                    setSugestoes={setSugestoesBusca}
                    mostrarSugestoes={mostrarSugestoesBusca}
                    setMostrarSugestoes={setMostrarSugestoesBusca}
                    onBuscar={(e) => {
                      e.preventDefault();
                      setMostrarSugestoesBusca(false);
                      buscarAnalise(null, tickerBusca);
                      setTickerBusca("");
                    }}
                    loading={loading}
                    isMobile={isMobile}
                  />

                  <div style={{background:"rgba(6,10,24,0.8)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"16px",padding:"1.5rem",backdropFilter:"blur(12px)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"1.25rem"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.1em"}}>EXPLORAR OUTRO ATIVO</span>
                      <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.04)"}} />
                    </div>
                    <CategoriasExplorer onSelecionar={t => { setTicker(t); buscarAnalise(null,t); }} categoriaAtiva={categoriaAtivaPos} setCategoriaAtiva={setCategoriaAtivaPos} filtro={filtroPos} setFiltro={setFiltroPos} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <section style={{position:"relative",padding:isMobile?"2rem 1rem":"clamp(2rem, 6vw, 5rem) 2.5rem",borderTop:"1px solid rgba(255,255,255,0.05)",background:"#040712",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 60% 50% at 50% 0%, rgba(52,211,153,0.04) 0%, transparent 60%)",pointerEvents:"none"}} />
          <div style={{maxWidth:"900px",margin:"0 auto",textAlign:"center",position:"relative",zIndex:1}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"8px",border:"1px solid rgba(52,211,153,0.15)",background:"rgba(52,211,153,0.04)",borderRadius:"100px",padding:"5px 16px",marginBottom:"2rem"}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.6)",letterSpacing:"0.1em"}}>INSTITUTIONAL COVERAGE</span>
            </div>
            <h2 style={{fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:"clamp(22px,2.8vw,32px)",letterSpacing:"-0.025em",color:"rgba(255,255,255,0.8)",marginBottom:"1rem",lineHeight:1.2}}>
              Dados das principais{" "}
              <span style={{color:"#34d399",fontWeight:500}}>research houses do mercado</span>
            </h2>
            <p style={{fontSize:"14px",color:"rgba(255,255,255,0.3)",marginBottom:"3rem",maxWidth:"480px",margin:"0 auto 3rem",lineHeight:1.6}}>
              Consolidamos recomendacoes de bancos, corretoras e casas de analise independentes.
            </p>
            <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:"1px",background:"rgba(255,255,255,0.05)",borderRadius:"16px",overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)"}}>
              {["Itau BBA","BTG Pactual","XP Investimentos","Bradesco BBI","Safra","Suno Research","Goldman Sachs","Morgan Stanley","J.P. Morgan"].map((s,i) => (
                <div key={s} style={{padding:"20px",background:"rgba(8,12,28,0.6)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.02em",transition:"all 0.2s",cursor:"default",borderBottom:i<6?"1px solid rgba(255,255,255,0.04)":"none"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(52,211,153,0.04)";e.currentTarget.style.color="rgba(52,211,153,0.7)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(8,12,28,0.6)";e.currentTarget.style.color="rgba(255,255,255,0.3)";}}
                >{s}</div>
              ))}
            </div>
            <div style={{marginTop:"2rem",padding:"1rem 1.5rem",background:"rgba(52,211,153,0.04)",border:"1px solid rgba(52,211,153,0.1)",borderRadius:"12px",display:"inline-flex",alignItems:"center",gap:"8px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 2s ease infinite"}} />
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(52,211,153,0.6)",letterSpacing:"0.06em"}}>ATUALIZACAO CONTINUA · DADOS PUBLICOS DE MERCADO</span>
            </div>
          </div>
        </section>
        <BuscaFlutuante
          visivel={mostrarFAB && !loading}
          onClick={rolarParaBuscaTopo}
        />
      </main>
    </div>
  );
}
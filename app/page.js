"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── LOADING MESSAGES ────────────────────────────────────────────────────────
const MENSAGENS_LOADING = [
  "🔍 Buscando recomendações recentes na web...",
  "📊 Consultando relatórios do BTG Pactual...",
  "📈 Verificando análises da XP Investimentos...",
  "🏦 Checando recomendações do Itaú BBA...",
  "📋 Analisando dados do Bradesco BBI...",
  "🔎 Aprofundando a pesquisa de mercado...",
  "💡 Consolidando as teses dos analistas...",
  "📉 Calculando preço-alvo médio...",
  "⚖️ Avaliando consenso de compra e venda...",
  "🧠 Montando a tese unificada...",
  "✍️ Preparando o relatório final...",
  "⏳ Quase lá, finalizando a análise...",
];

const EXEMPLOS = ["PETR4", "BBAS3", "VALE3", "CMIG3"];
let exemploIdx = 0;

// ─── TICKER TAPE ─────────────────────────────────────────────────────────────
const COTACOES_TAPE = [
  { ticker: "IBOV",  preco: "127.305",    variacao: "+1,02%", positivo: true  },
  { ticker: "PETR4", preco: "R$49,08",    variacao: "+1,2%",  positivo: true  },
  { ticker: "VALE3", preco: "R$58,32",    variacao: "-0,8%",  positivo: false },
  { ticker: "ITUB4", preco: "R$35,90",    variacao: "+0,5%",  positivo: true  },
  { ticker: "WEGE3", preco: "R$52,14",    variacao: "+2,1%",  positivo: true  },
  { ticker: "BBAS3", preco: "R$28,45",    variacao: "-0,3%",  positivo: false },
  { ticker: "NVDA",  preco: "US$875,40",  variacao: "+3,2%",  positivo: true  },
  { ticker: "AAPL",  preco: "US$189,50",  variacao: "+0,8%",  positivo: true  },
  { ticker: "EMBR3", preco: "R$48,72",    variacao: "+1,8%",  positivo: true  },
  { ticker: "RENT3", preco: "R$19,34",    variacao: "-1,1%",  positivo: false },
  { ticker: "TSLA",  preco: "US$175,20",  variacao: "+2,4%",  positivo: true  },
  { ticker: "ABEV3", preco: "R$12,88",    variacao: "+0,3%",  positivo: true  },
  { ticker: "SUZB3", preco: "R$43,90",    variacao: "-0,6%",  positivo: false },
  { ticker: "META",  preco: "US$512,30",  variacao: "+1,5%",  positivo: true  },
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
}
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

// ─── SECTION PARSER ───────────────────────────────────────────────────────────
/**
 * Identifica o tipo visual de cada seção pelo título ## do markdown.
 * Retorna uma string que o renderizador usa para escolher o card correto.
 */
function identificarTipo(titulo) {
  // Remove emojis e normaliza para comparação robusta
  const t = titulo
    .toLowerCase()
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, "")
    .replace(/[⚖️⚠️📡📰🔮🎯📊📌📐🧠]/g, "")
    .trim();

  if (t.includes("sentimento"))                          return "sentimento";
  if (t.includes("leitura do mercado"))                  return "leitura";
  if (t.includes("momento atual"))                       return "momento";
  // valuation ANTES de qualquer check com "riscos"
  if (t.includes("valuation"))                           return "valuation";
  if (t.includes("perspectivas"))                        return "perspectivas";
  // forcas_riscos: precisa de parênteses para evitar bug de precedência &&
  if (t.includes("for") && (t.includes("risco") || t.includes("vs"))) return "forcas_riscos";
  if (t.includes("driver") || t.includes("principal"))  return "driver";
  if (t.includes("invalid") || t.includes("que pode"))  return "invalida";
  if (t.includes("consenso"))                            return "consenso";
  if (t.includes("recomenda") || t.includes("analista")) return "analistas";
  if (t.includes("distribui"))                           return "distribuicao";
  if (t.includes("proje") || t.includes("faixa"))        return "projecoes";
  if (t.includes("s") && t.includes("ntese"))            return "sintese";
  return "generico";
}

/**
 * Quebra o texto markdown em seções por `## título`.
 * Retorna array de { tipo, titulo, corpo }.
 */
function parsearSecoes(texto) {
  if (!texto) return [];

  // Separa o cabeçalho (# Ticker — Nome) do resto
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
      // Ignora separadores horizontais — não viram conteúdo de seção
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

// ─── MARKDOWN SIMPLES (para corpo de texto genérico) ──────────────────────────
function mdComponents(dark = false) {
  const textColor = dark ? "text-white/80" : "text-gray-300";
  const strongColor = dark ? "text-white" : "text-white";
  return {
    p: ({ children }) => <p className={`${textColor} leading-relaxed mb-3 text-[14px]`}>{children}</p>,
    strong: ({ children }) => <strong className={`${strongColor} font-bold`}>{children}</strong>,
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

// ─── EXTRATORES DE DADOS DO CORPO MARKDOWN ────────────────────────────────────

/** Extrai bullets de um corpo markdown (linhas com •, -, *, →) */
function extrairBullets(corpo) {
  return corpo.split("\n")
    .filter(l => {
      const trim = l.trim();
      // Exclui separadores markdown (---, ***, linhas só com hífens)
      if (/^[-*]{2,}$/.test(trim)) return false;
      // Exclui linhas de tabela
      if (trim.startsWith("|")) return false;
      // Deve começar com marcador de lista
      return trim.startsWith("•") || trim.startsWith("→") ||
             (trim.startsWith("-") && trim.length > 2) ||
             (trim.startsWith("*") && trim.length > 2 && !trim.startsWith("**"));
    })
    .map(l => l.replace(/^[•→\-\*]\s*/, "").trim())
    .filter(b => b.length > 3); // descarta bullets quase vazios
}

/** Extrai sentimento do texto: "🟢 Positivo" → { emoji, label, cor } */
function extrairSentimento(corpo) {
  if (/🟢|positivo/i.test(corpo)) return { emoji: "🟢", label: "Positivo", cor: "verde" };
  if (/🔴|negativo/i.test(corpo)) return { emoji: "🔴", label: "Negativo", cor: "vermelho" };
  return { emoji: "🟡", label: "Neutro", cor: "amarelo" };
}

/** Extrai dados da tabela de analistas */
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

/** Extrai métricas de consenso (tabela simples chave|valor) */
function extrairMetricasConsenso(corpo) {
  const linhas = corpo.split("\n").filter(l => l.includes("|") && !l.includes("---"));
  if (linhas.length < 2) return [];
  return linhas.slice(1).map(l => {
    const [, key, val] = l.split("|").map(c => c.trim());
    return { key, val };
  }).filter(r => r.key && r.val);
}

/** Extrai distribuição: qtd Comprar / Manter / Vender */
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

/** Extrai projeções (bear/base/bull) de tabela */
function extrairProjecoes(corpo) {
  const linhas = corpo.split("\n").filter(l => l.includes("|") && !l.includes("---"));
  const resultado = { bear: null, base: null, bull: null };
  for (const linha of linhas) {
    const cells = linha.split("|").map(c => c.trim()).filter(Boolean);
    if (!cells.length) continue;
    const tipo = cells[0].toLowerCase();
    const preco  = cells[1] || "—";
    const upside = cells[2] || "—";
    if (/caute|bear|🐻/i.test(tipo)) resultado.bear = { preco, upside };
    else if (/refer|base|⚖/i.test(tipo))   resultado.base = { preco, upside };
    else if (/otim|bull|🚀/i.test(tipo)) resultado.bull = { preco, upside };
  }
  return resultado;
}

// ─── CARDS DE SEÇÃO ───────────────────────────────────────────────────────────

function CardCabecalho({ secao }) {
  // Extrai ticker, nome, tipo, preço do corpo
  const tipo  = (secao.corpo.match(/\*\*Tipo de ativo:\*\*\s*(.+)/)?.[1] || "").trim();
  const preco = (secao.corpo.match(/\*\*Preço atual:\*\*\s*(.+)/)?.[1] || "").replace(/·.+/, "").trim();
  const data  = (secao.corpo.match(/·\s*(.+)/)?.[1] || "").trim();
  return (
    <div className="bg-[#0b1120] border border-white/10 rounded-2xl p-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-black text-white tracking-tight">{secao.titulo}</h1>
        {tipo && <p className="text-gray-500 text-xs mt-1">{tipo}</p>}
      </div>
      {preco && (
        <div className="text-right flex-shrink-0">
          <div className="text-white font-bold text-lg">{preco}</div>
          {data && <div className="text-gray-600 text-xs mt-0.5">{data}</div>}
        </div>
      )}
    </div>
  );
}

function CardSentimento({ secao }) {
  const { emoji, label, cor } = extrairSentimento(secao.corpo);
  const frase = secao.corpo.split("\n").find(l => l.trim() && !l.includes(emoji) && !l.includes("##") && !l.startsWith("#") && l.trim().length > 10)?.trim() || "";
  const paleta = {
    verde:    { bg: "bg-green-950/60",  border: "border-green-500/40",  label: "text-green-400",  text: "text-green-300/80" },
    amarelo:  { bg: "bg-amber-950/50",  border: "border-amber-500/40",  label: "text-amber-400",  text: "text-amber-300/80" },
    vermelho: { bg: "bg-red-950/50",    border: "border-red-500/40",    label: "text-red-400",    text: "text-red-300/80"   },
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
  const linhas = secao.corpo.split("\n").filter(l => l.trim() && !l.startsWith(">") && !l.startsWith("#"));
  const frase = linhas.find(l => l.replace(/^[👉\s]+/, "").trim().length > 20)?.replace(/^[👉\s]+/, "").trim() || secao.corpo.slice(0, 180).trim();
  return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-3">🧠 Leitura do mercado</div>
      <p className="text-white font-semibold text-[15px] leading-relaxed border-l-2 border-green-500 pl-4">{frase}</p>
    </div>
  );
}

function CardContexto({ secao, icon, label }) {
  const bullets = extrairBullets(secao.corpo);

  // Extrai parágrafos limpos quando não há bullets
  const paragrafos = secao.corpo
    .split("\n")
    .map(l => l.trim())
    .filter(l =>
      l.length > 10 &&
      !l.startsWith("#") &&
      !l.startsWith("|") &&
      !l.startsWith(">") &&
      !/^[-*]{2,}$/.test(l) &&
      !/^\*\*[^*]+\*\*:/.test(l)
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
      ) : paragrafos.length > 0 ? (
        <div className="space-y-2">
          {paragrafos.map((p, i) => (
            <p key={i} className="text-gray-400 text-sm leading-relaxed border-b border-white/5 pb-2 last:border-0 last:pb-0">
              {p.replace(/\*\*/g, "")}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-sm italic">Sem informações disponíveis nas fontes consultadas.</p>
      )}
    </div>
  );
}

function CardForcasRiscos({ secao }) {
  const corpo = secao.corpo;
  // Separa em dois blocos: FORÇAS e RISCOS por qualquer ### com keyword
  const splitPattern = /(?=###?\s*(🔴|PONT|RISCO|ATEN))/i;
  const partes = corpo.split(splitPattern);
  // partes[0] = bloco de forças, resto = riscos
  const partesForcas = partes[0] || "";
  const partesRiscos = partes.slice(1).join("") || "";
  const forcas = extrairBullets(partesForcas);
  const riscos = extrairBullets(partesRiscos);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="bg-green-950/40 border border-green-500/25 rounded-2xl p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-green-500 mb-3">🟢 Forças estruturais</div>
        <ul className="space-y-2">
          {forcas.length > 0 ? forcas.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-green-300/80 text-[13px] leading-relaxed border-b border-green-500/10 pb-2 last:border-0 last:pb-0">
              <span className="text-green-600 mt-1 flex-shrink-0 text-xs">+</span>
              <span>{f}</span>
            </li>
          )) : <li className="text-green-800 text-sm">Dados insuficientes.</li>}
        </ul>
      </div>
      <div className="bg-red-950/40 border border-red-500/25 rounded-2xl p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3">🔴 Pontos de atenção</div>
        <ul className="space-y-2">
          {riscos.length > 0 ? riscos.map((r, i) => (
            <li key={i} className="flex items-start gap-2 text-red-300/80 text-[13px] leading-relaxed border-b border-red-500/10 pb-2 last:border-0 last:pb-0">
              <span className="text-red-600 mt-1 flex-shrink-0 text-xs">−</span>
              <span>{r}</span>
            </li>
          )) : <li className="text-red-900 text-sm">Dados insuficientes.</li>}
        </ul>
      </div>
    </div>
  );
}

function CardDriver({ secao }) {
  const texto = secao.corpo.replace(/^#+.+$/m, "").trim();
  return (
    <div className="bg-[#080e1f] border-l-2 border-blue-500 border-t border-r border-b border-white/10 rounded-r-2xl p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">🎯 Driver principal</div>
      <p className="text-gray-300 text-sm leading-relaxed">{texto}</p>
    </div>
  );
}

function CardInvalida({ secao }) {
  const bullets = extrairBullets(secao.corpo);
  const texto = secao.corpo.replace(/^[•\-\*].+$/gm, "").replace(/^#+.+$/m, "").trim();
  return (
    <div className="bg-[#0f0808] border-l-2 border-red-500/70 border-t border-r border-b border-white/10 rounded-r-2xl p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-3">⚠️ O que pode invalidar a tese</div>
      {bullets.length > 0 ? (
        <ul className="space-y-2">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2 text-red-300/70 text-sm leading-relaxed">
              <span className="text-red-600 mt-1 flex-shrink-0">×</span>
              <span>{b}</span>
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
  // Extrai leitura simples do blockquote
  const leituraSimples = secao.corpo.match(/>\s*💡[^\n]*([\s\S]*?)(?=\n\n|\n---|\n##|$)/)?.[0]?.replace(/^>\s*/gm, "").replace(/💡\s*\*\*[^*]+\*\*:?\s*/,"").trim() || "";
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
                const isRec = /corretora|casa|recomend/i.test(col) === false && /comprar|buy|manter|hold|vender|sell/i.test(val);
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
      <p className="text-gray-700 text-[11px] mt-3">Upside calculado com base no preço atual. Apenas analistas com datas confirmadas nos últimos 6 meses.</p>
    </div>
  );
}

function CardDistribuicao({ secao }) {
  const { comprar, manter, vender } = extrairDistribuicao(secao.corpo);
  const total = comprar + manter + vender || 1;
  const pct = v => Math.round((v / total) * 100);
  // Faixa e média do corpo
  const faixa = secao.corpo.match(/\*\*FAIXA[^*]+\*\*:?\s*([^\n]+)/i)?.[1]?.trim() || "";
  const media = secao.corpo.match(/Média[^:]+:\s*\*\*?([^*\n]+)\*\*?/i)?.[1]?.trim() || "";
  const upside = secao.corpo.match(/Upside implícito:[^*]*\*\*([^*]+)\*\*/i)?.[1]?.trim() || "";
  return (
    <div className="bg-[#080e1f] border border-white/10 rounded-2xl p-5">
      <div className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-4">📊 Distribuição das recomendações</div>
      {/* Barra */}
      <div className="h-2 rounded-full overflow-hidden bg-white/5 flex gap-0.5 mb-3">
        {comprar > 0 && <div className="bg-green-500 rounded-full" style={{ width: `${pct(comprar)}%` }} />}
        {manter  > 0 && <div className="bg-amber-400 rounded-full" style={{ width: `${pct(manter)}%`  }} />}
        {vender  > 0 && <div className="bg-red-500  rounded-full" style={{ width: `${pct(vender)}%`  }} />}
      </div>
      <div className="flex gap-5 flex-wrap text-[12px] mb-4">
        {comprar > 0 && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Comprar — {comprar}</span>}
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
  const frase = secao.corpo.split("\n").filter(l => l.trim().startsWith(">")).map(l => l.replace(/^>\s*/,"").trim()).find(l => l.length > 10) || "";
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
  const texto = secao.corpo.replace(/^#+.+$/m, "").replace(/^>\s*⚠️.+$/gm, "").trim();
  const aviso = secao.corpo.match(/>\s*⚠️.+/)?.[0]?.replace(/^>\s*/,"").trim() || "";
  const borda = semaforo === "verde"    ? "border-green-500"
    : semaforo === "vermelho" ? "border-red-500"
    : "border-amber-500";
  const bg    = semaforo === "verde"    ? "bg-green-950/40"
    : semaforo === "vermelho" ? "bg-red-950/30"
    : "bg-amber-950/30";
  const label = semaforo === "verde"    ? "text-green-400"
    : semaforo === "vermelho" ? "text-red-400"
    : "text-amber-400";
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

// ─── RENDERIZADOR DE SEÇÕES ───────────────────────────────────────────────────
function RenderizarSecao({ secao, semaforo, visivel }) {
  const style = {
    opacity: visivel ? 1 : 0,
    transform: visivel ? "translateY(0)" : "translateY(16px)",
    transition: "opacity 0.5s ease, transform 0.5s ease",
  };

  let conteudo;
  switch (secao.tipo) {
    case "cabecalho":   conteudo = <CardCabecalho secao={secao} />; break;
    case "sentimento":  conteudo = <CardSentimento secao={secao} />; break;
    case "leitura":     conteudo = <CardLeitura secao={secao} />; break;
    case "momento":     conteudo = <CardContexto secao={secao} icon="📰" label="Momento atual do ativo" />; break;
    case "valuation":   conteudo = <CardContexto secao={secao} icon="⚖️" label="Leitura de valuation" />; break;
    case "perspectivas":conteudo = <CardContexto secao={secao} icon="🔮" label="Perspectivas futuras" />; break;
    case "forcas_riscos":conteudo = <CardForcasRiscos secao={secao} />; break;
    case "driver":      conteudo = <CardDriver secao={secao} />; break;
    case "invalida":    conteudo = <CardInvalida secao={secao} />; break;
    case "consenso":    conteudo = <CardConsenso secao={secao} />; break;
    case "analistas":   conteudo = <CardAnalistas secao={secao} />; break;
    case "distribuicao":conteudo = <CardDistribuicao secao={secao} />; break;
    case "projecoes":   conteudo = <CardProjecoes secao={secao} />; break;
    case "sintese":     conteudo = <CardSintese secao={secao} semaforo={semaforo} />; break;
    default:            conteudo = <CardGenerico secao={secao} />; break;
  }

  return <div style={style}>{conteudo}</div>;
}

// ─── PAGE PRINCIPAL ───────────────────────────────────────────────────────────
export default function Home() {

  
  const [user, setUser] = useState(null);
  const [ticker, setTicker]               = useState("");
  const [sugestoes, setSugestoes]         = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [textoCompleto, setTextoCompleto] = useState("");
  const [secoes, setSecoes]               = useState([]);
  const [secoesVisiveis, setSecoesVisiveis] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [erro, setErro]                   = useState("");
  const [msgIndex, setMsgIndex]           = useState(0);
  const [placeholder, setPlaceholder]     = useState(`ex: ${EXEMPLOS[0]}`);
  const [categoriaAtiva, setCategoriaAtiva]   = useState("ibovespa");
  const [filtro, setFiltro]               = useState("");
  const [categoriaAtivaPos, setCategoriaAtivaPos] = useState("ibovespa");
  const [filtroPos, setFiltroPos]         = useState("");
  const [semaforoForcado, setSemaforoForcado] = useState(null);
  const msgInterval  = useRef(null);
  const resultadoRef = useRef(null);
  const [modalLimiteAberto, setModalLimiteAberto] = useState(false);

  // Placeholder rotativo
  useEffect(() => {
    const interval = setInterval(() => {
      exemploIdx = (exemploIdx + 1) % EXEMPLOS.length;
      setPlaceholder(`ex: ${EXEMPLOS[exemploIdx]}`);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  async function carregarUsuario() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  }

  carregarUsuario();

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user || null);
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);

useEffect(() => {
  async function carregarUsuario() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);
  }

  carregarUsuario();

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user || null);
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);


  // Loading messages
  useEffect(() => {
    if (loading) {
      setMsgIndex(0);
      msgInterval.current = setInterval(() => {
        setMsgIndex(prev => (prev + 1) % MENSAGENS_LOADING.length);
      }, 2500);
      setTimeout(() => window.scrollTo({ top: 500, behavior: "smooth" }), 100);
    } else {
      clearInterval(msgInterval.current);
    }
    return () => clearInterval(msgInterval.current);
  }, [loading]);

  // Parser de seções com animação escalonada
  useEffect(() => {
    if (!textoCompleto) return;
    const parsed = parsearSecoes(textoCompleto);
    setSecoes(parsed);
    setSecoesVisiveis([]);
    parsed.forEach((_, i) => {
      setTimeout(() => setSecoesVisiveis(prev => [...prev, i]), i * 120);
    });
  }, [textoCompleto]);

  // Busca
  async function buscarAnalise(e, tickerOverride) {
    if (e) e.preventDefault();
    const t = (tickerOverride || ticker).trim().toUpperCase();
    const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  const consultasAnonimas = Number(
    localStorage.getItem("consultas_anonimas") || "0"
  );

  if (consultasAnonimas >= 1) {
    setErro("Você já usou sua análise grátis. Crie uma conta para liberar mais 5 consultas.");
    setTimeout(() => {
      window.location.href = "/cadastro";
    }, 1500);
    return;
  }

  localStorage.setItem("consultas_anonimas", String(consultasAnonimas + 1));
}
    if (!t) return;
    if (!TICKERS_PERMITIDOS.has(t)) {
      setErro(`"${t}" não está disponível.`);
      return;
    }
    setTicker(t);
    setLoading(true);
    setTextoCompleto("");
    setSecoes([]);
    setSecoesVisiveis([]);
    setErro("");
    setSemaforoForcado(null);
  let buffer = "";

// BLOQUEIO USUÁRIO LOGADO
if (user) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("consultas_usadas, limite_consultas, ultima_consulta, plano")
    .eq("id", user.id)
    .single();

  if (profileError) {
    setErro("Erro ao verificar limite.");
    setLoading(false);
    return;
  }

const hoje = new Date().toISOString().split("T")[0];

const ultimaConsulta = profile.ultima_consulta
  ? new Date(profile.ultima_consulta).toISOString().split("T")[0]
  : null;

// Mudou o dia → zera contador
if (ultimaConsulta !== hoje) {
  await supabase
    .from("profiles")
    .update({
      consultas_usadas: 0,
      ultima_consulta: new Date().toISOString(),
    })
    .eq("id", user.id);

  profile.consultas_usadas = 0;
}

  if (profile.consultas_usadas >= profile.limite_consultas) {
  setModalLimiteAberto(true);
  setLoading(false);
  return;
}

  await supabase
    .from("profiles")
    .update({
      consultas_usadas: profile.consultas_usadas + 1,
    })
    .eq("id", user.id);
}

try {
  const response = await fetch("/api/analisar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker: t }),
  });
      const reader = response.body.getReader();
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
            if (parsed.text)      buffer += parsed.text;
            if (parsed.error)     setErro(parsed.error);
            if (parsed.semaforo)  setSemaforoForcado(parsed.semaforo);
          } catch {}
        }
      }
      setTextoCompleto(buffer);
      setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050812] text-white font-sans">

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
  <button
    onClick={async () => {
      await supabase.auth.signOut();
      setUser(null);
      window.location.reload();
    }}
    className="rounded-xl border border-red-500/40 px-5 py-3 text-red-400 text-sm flex items-center gap-2 hover:bg-red-500/10 transition"
  >
    Sair
  </button>
) : (
  <Link
    href="/login"
    className="rounded-xl border border-[#64d26f]/50 px-5 py-3 text-[#77db7c] text-sm flex items-center gap-2 hover:bg-[#64d26f]/10 transition"
  >
    <span>👤</span> Entrar
  </Link>
)}
      </header>

      {/* TICKER TAPE */}
      <TickerTape />

      {/* HERO */}
      <main className="relative">

        {modalLimiteAberto && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-3xl border border-green-500/30 bg-[#070b12] p-6 shadow-2xl">
      <div className="mb-4 inline-flex rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-green-400">
        Limite gratuito atingido
      </div>

      <h2 className="text-2xl font-black text-white mb-3">
        Você usou suas 3 análises gratuitas de hoje
      </h2>

      <p className="text-gray-400 text-sm leading-relaxed mb-5">
        Volte amanhã gratuitamente ou libere o Plano Premium com até 50 análises por dia.
      </p>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-5 space-y-2 text-sm text-gray-300">
        <p>✓ Até 50 análises por dia</p>
        <p>✓ Consenso consolidado dos analistas</p>
        <p>✓ Preço-alvo, upside e tese resumida</p>
        <p>✓ Plano mensal por R$49,90</p>
      </div>

      <a
        href="https://wa.me/5551991282389?text=Quero%20assinar%20o%20Plano%20Premium%20do%20Radar%20de%20Consenso"
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center rounded-xl bg-green-500 px-5 py-4 text-sm font-black text-black transition hover:bg-green-400"
      >
        Liberar Premium no WhatsApp
      </a>

      <button
        type="button"
        onClick={() => setModalLimiteAberto(false)}
        className="mt-3 w-full rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-gray-400 transition hover:bg-white/5 hover:text-white"
      >
        Continuar no plano grátis
      </button>
    </div>
  </div>
)}
        <section className="relative min-h-[480px] border-b border-white/10 px-4 md:px-14 py-8 md:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_35%,rgba(42,143,83,0.15),transparent_35%),linear-gradient(180deg,#060916_0%,#050812_100%)]" />

          {/* GRÁFICO DIREITA */}
          <div className="absolute right-14 top-16 w-[44%] h-[335px] opacity-75 hidden lg:block">
            <div className="absolute inset-0 rounded-2xl bg-[linear-gradient(90deg,transparent,rgba(31,65,53,0.16))]" />
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
              <text x="595" y="175" fill="rgba(255,255,255,.5)"  fontSize="14">124.000</text>
              <text x="70"  y="320" fill="rgba(255,255,255,.45)" fontSize="14">Fev</text>
              <text x="210" y="320" fill="rgba(255,255,255,.45)" fontSize="14">Mar</text>
              <text x="350" y="320" fill="rgba(255,255,255,.45)" fontSize="14">Abr</text>
              <text x="490" y="320" fill="rgba(255,255,255,.45)" fontSize="14">Mai</text>
            </svg>
            <div className="absolute top-10 right-24 rounded-xl border border-white/10 bg-[#0b1020]/80 backdrop-blur px-5 py-4 shadow-2xl">
              <div className="text-white/50 text-xs uppercase tracking-widest mb-1">Exemplo · PETR4</div>
              <div className="text-white font-bold text-sm">Petrobras PN</div>
              <div className="text-white/60 text-xs mt-1">Preço atual: R$ 38,50</div>
              <div className="text-white/60 text-xs">Preço-alvo: R$ 48,00</div>
              <div className="text-[#6fe17d] text-sm font-bold mt-2">↑ +24,7% potencial</div>
              <div className="mt-2 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-center font-bold">
                12 de 15 recomendam Comprar
              </div>
            </div>
          </div>

          {/* CONTEÚDO ESQUERDA */}
          <div className="relative z-10 max-w-[660px] pt-4">
            <div className="flex gap-3 mb-8 flex-wrap">
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
              <div className="relative z-50 flex-1 flex items-center gap-4 px-5 py-4 md:py-0 text-white/55 text-lg">
                <span className="text-2xl">🔍</span>
                <input
                  type="text"
                  value={ticker}
                  onChange={e => {
                    const value = e.target.value.toUpperCase();
                    setTicker(value);
                    if (!value) { setSugestoes([]); setMostrarSugestoes(false); return; }
                    const ativosUnicos = Array.from(
                      new Map(CATEGORIAS.flatMap(c => c.ativos).map(a => [a.ticker, a])).values()
                    );
                    const filtrados = ativosUnicos
                      .filter(a => a.ticker.includes(value) || a.nome.toLowerCase().includes(value.toLowerCase()))
                      .slice(0, 8);
                    setSugestoes(filtrados);
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

          {/* CATEGORIAS (só aparece sem relatório) */}
          {!textoCompleto && !loading && (
            <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
              <p className="text-white/40 text-xs uppercase font-bold tracking-widest mb-6 text-center">Ou explore por categoria</p>
              <CategoriasExplorer
                onSelecionar={t => buscarAnalise(null, t)}
                categoriaAtiva={categoriaAtiva}
                setCategoriaAtiva={setCategoriaAtiva}
                filtro={filtro}
                setFiltro={setFiltro}
              />
            </div>
          )}
        </section>

        {/* LOADING */}
        {loading && (
          <div className="max-w-4xl mx-auto px-6 py-10">
            <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800">
              <div className="flex flex-col items-center gap-6">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-700" />
                  <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-green-300 border-b-transparent animate-spin" style={{ animationDuration:"0.8s", animationDirection:"reverse" }} />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl">Analisando o mercado {ticker}</p>
                  <p className="text-gray-500 text-sm mt-1">Isso pode levar até 90 segundos</p>
                </div>
                <div className="w-full bg-gray-800 rounded-xl px-6 py-4 text-center min-h-[56px] flex items-center justify-center">
                  <p key={msgIndex} className="text-green-400 text-sm font-medium">{MENSAGENS_LOADING[msgIndex]}</p>
                </div>
                <div className="w-full">
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all duration-[2500ms] ease-linear"
                      style={{ width:`${((msgIndex+1)/MENSAGENS_LOADING.length)*100}%` }} />
                  </div>
                  <p className="text-gray-600 text-xs text-right mt-1">{Math.round(((msgIndex+1)/MENSAGENS_LOADING.length)*100)}%</p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {["Itaú BBA","BTG Pactual","XP","Bradesco BBI","Safra","Genial"].map((casa, i) => (
                    <span key={casa} className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full animate-pulse" style={{ animationDelay:`${i*0.2}s` }}>{casa}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ERRO */}
        {erro && (
  <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-950/20 p-5 text-left">
    <p className="text-white font-bold mb-2">
      Limite gratuito atingido
    </p>

    <p className="text-gray-400 text-sm leading-relaxed mb-4">
      {erro}
    </p>

    <a
      href="https://wa.me/555191282389?text=Quero%20assinar%20o%20Plano%20Premium%20do%20Radar%20B3"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-full justify-center rounded-xl bg-green-500 px-5 py-3 text-sm font-black text-black hover:bg-green-400 transition"
    >
      Liberar Plano Premium no WhatsApp
    </a>
  </div>
)}

        {/* RESULTADO — cards com hierarquia visual */}
        {secoes.length > 0 && (
          <div ref={resultadoRef} className="max-w-4xl mx-auto px-4 md:px-6 pb-8 pt-8 space-y-3">
            {secoes.map((secao, i) => (
              <RenderizarSecao
                key={i}
                secao={secao}
                semaforo={semaforoForcado}
                visivel={secoesVisiveis.includes(i)}
              />
            ))}

            {/* AVISO REGULATÓRIO */}
            <p className="text-gray-700 text-[11px] text-center pt-2 leading-relaxed">
              ⚠️ Esta análise possui caráter informativo e educacional, baseada em dados públicos e consenso recente de mercado. Não constitui recomendação individualizada de investimento.
            </p>

            {/* EXPLORAR OUTRO ATIVO */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-4">
              <p className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-5">🔍 Continue explorando — analise outro ativo</p>
              <CategoriasExplorer
                onSelecionar={t => { setTicker(t); buscarAnalise(null, t); }}
                categoriaAtiva={categoriaAtivaPos}
                setCategoriaAtiva={setCategoriaAtivaPos}
                filtro={filtroPos}
                setFiltro={setFiltroPos}
              />
            </div>
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
              Cobertura das principais <br />
              <span className="text-[#79dd7d]">instituições</span> financeiras
            </h2>
            <p className="mt-6 text-white/55 text-lg max-w-2xl mx-auto leading-relaxed">
              Integramos recomendações de bancos, corretoras e research houses globais —{" "}
              <span className="text-[#79dd7d]">em tempo real.</span>
            </p>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {["Itaú BBA","XP Investimentos","BTG Pactual","Bradesco BBI","Safra","Suno Research"].map(source => (
                <div key={source} className="h-28 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/85 font-semibold text-base hover:border-green-400/40 hover:bg-green-400/[0.04] transition">
                  {source}
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {["Goldman Sachs","Morgan Stanley","J.P. Morgan"].map(source => (
                <div key={source} className="h-24 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/80 font-medium text-xl hover:border-green-400/40 hover:bg-green-400/[0.04] transition">
                  {source}
                </div>
              ))}
            </div>
            <div className="mt-16 max-w-5xl mx-auto rounded-2xl border border-green-500/25 bg-green-500/[0.03] px-6 md:px-8 py-7 flex flex-col md:flex-row items-center justify-between gap-5 text-left">
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-xl border border-green-400/20 bg-green-400/5 flex items-center justify-center text-green-400 text-2xl">🛡</div>
                <p className="text-white/65 text-base md:text-lg">
                  Atualizado continuamente com base nas recomendações{" "}
                  <span className="text-[#79dd7d]">mais recentes do mercado.</span>
                </p>
              </div>
              <div className="px-4 py-2 rounded-full border border-green-400/30 bg-green-400/10 text-green-400 text-xs font-bold uppercase tracking-wide">
                Atualização diária
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

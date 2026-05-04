"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

const EXEMPLOS = ["PETR4", "BBAS3", "AAPL34", "NVDA", "VALE3", "CMIG3"];
let exemploIdx = 0;

const COTACOES_TAPE = [
  { ticker: "IBOV", preco: "127.305", variacao: "+1,02%", positivo: true },
  { ticker: "PETR4", preco: "R$49,08", variacao: "+1,2%", positivo: true },
  { ticker: "VALE3", preco: "R$58,32", variacao: "-0,8%", positivo: false },
  { ticker: "ITUB4", preco: "R$35,90", variacao: "+0,5%", positivo: true },
  { ticker: "WEGE3", preco: "R$52,14", variacao: "+2,1%", positivo: true },
  { ticker: "BBAS3", preco: "R$28,45", variacao: "-0,3%", positivo: false },
  { ticker: "NVDA", preco: "US$875,40", variacao: "+3,2%", positivo: true },
  { ticker: "AAPL", preco: "US$189,50", variacao: "+0,8%", positivo: true },
  { ticker: "EMBR3", preco: "R$48,72", variacao: "+1,8%", positivo: true },
  { ticker: "RENT3", preco: "R$19,34", variacao: "-1,1%", positivo: false },
  { ticker: "TSLA", preco: "US$175,20", variacao: "+2,4%", positivo: true },
  { ticker: "ABEV3", preco: "R$12,88", variacao: "+0,3%", positivo: true },
  { ticker: "SUZB3", preco: "R$43,90", variacao: "-0,6%", positivo: false },
  { ticker: "META", preco: "US$512,30", variacao: "+1,5%", positivo: true },
  { ticker: "AAPL34", preco: "R$945,20", variacao: "+0,9%", positivo: true },
  { ticker: "RADL3", preco: "R$24,18", variacao: "+0,4%", positivo: true },
  { ticker: "MSFT", preco: "US$415,80", variacao: "+0,7%", positivo: true },
  { ticker: "PRIO3", preco: "R$42,60", variacao: "+1,4%", positivo: true },
];

function TickerTape() {
  const [cotacoes, setCotacoes] = useState(COTACOES_TAPE);

  useEffect(() => {
    const interval = setInterval(() => {
      setCotacoes(prev => prev.map(c => {
        const delta = (Math.random() - 0.5) * 0.4;
        const varNum = parseFloat(c.variacao.replace("%", "").replace("+", "").replace(",", ".")) + delta;
        const positivo = varNum >= 0;
        const varFormatted = (positivo ? "+" : "") + varNum.toFixed(2).replace(".", ",") + "%";
        return { ...c, variacao: varFormatted, positivo };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const items = [...cotacoes, ...cotacoes];

  return (
    <div className="h-12 border-b border-white/10 bg-[#080b15] flex items-center overflow-hidden whitespace-nowrap text-sm">
      <div className="ticker-animation" style={{ display: "flex", gap: "2rem", paddingLeft: "2rem", width: "max-content" }}>
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

const CATEGORIAS = [
  {
    id: "ibovespa",
    label: "📈 Ibovespa",
    descricao: "Ações do Ibovespa",
    subtitulo: "As principais ações da bolsa brasileira, que compõem o principal índice da B3",
    ativos: [
      { ticker: "ABEV3", nome: "Ambev" }, { ticker: "ASAI3", nome: "Assaí" }, { ticker: "AZUL4", nome: "Azul" },
      { ticker: "B3SA3", nome: "B3" }, { ticker: "BBAS3", nome: "Banco do Brasil" }, { ticker: "BBDC3", nome: "Bradesco ON" },
      { ticker: "BBDC4", nome: "Bradesco PN" }, { ticker: "BBSE3", nome: "BB Seguridade" }, { ticker: "BEEF3", nome: "Minerva" },
      { ticker: "BPAC11", nome: "BTG Pactual" }, { ticker: "BRAP4", nome: "Bradespar" }, { ticker: "BRFS3", nome: "BRF" },
      { ticker: "BRKM5", nome: "Braskem" }, { ticker: "CASH3", nome: "Méliuz" }, { ticker: "CCXC3", nome: "CCX Carvão" },
      { ticker: "CEAB3", nome: "C&A" }, { ticker: "CIEL3", nome: "Cielo" }, { ticker: "CMIG4", nome: "Cemig" },
      { ticker: "CMIN3", nome: "CSN Mineração" }, { ticker: "COGN3", nome: "Cogna" }, { ticker: "CPFE3", nome: "CPFL Energia" },
      { ticker: "CPLE6", nome: "Copel" }, { ticker: "CRFB3", nome: "Carrefour" }, { ticker: "CSAN3", nome: "Cosan" },
      { ticker: "CSNA3", nome: "CSN" }, { ticker: "CVCB3", nome: "CVC" }, { ticker: "CYRE3", nome: "Cyrela" },
      { ticker: "DXCO3", nome: "Dexco" }, { ticker: "EGIE3", nome: "Engie Brasil" }, { ticker: "ELET3", nome: "Eletrobras ON" },
      { ticker: "ELET6", nome: "Eletrobras PNB" }, { ticker: "EMBR3", nome: "Embraer" }, { ticker: "ENEV3", nome: "Eneva" },
      { ticker: "ENGI11", nome: "Energisa" }, { ticker: "EQTL3", nome: "Equatorial" }, { ticker: "EZTC3", nome: "EZTEC" },
      { ticker: "FLRY3", nome: "Fleury" }, { ticker: "GGBR4", nome: "Gerdau" }, { ticker: "GOAU4", nome: "Metalúrgica Gerdau" },
      { ticker: "GOLL4", nome: "Gol" }, { ticker: "HAPV3", nome: "Hapvida" }, { ticker: "HYPE3", nome: "Hypera" },
      { ticker: "IGTI11", nome: "Iguatemi" }, { ticker: "IRBR3", nome: "IRB Brasil" }, { ticker: "ITSA4", nome: "Itaúsa" },
      { ticker: "ITUB4", nome: "Itaú Unibanco" }, { ticker: "JBSS3", nome: "JBS" }, { ticker: "JHSF3", nome: "JHSF" },
      { ticker: "KLBN11", nome: "Klabin" }, { ticker: "LREN3", nome: "Lojas Renner" }, { ticker: "LWSA3", nome: "Locaweb" },
      { ticker: "MGLU3", nome: "Magazine Luiza" }, { ticker: "MRFG3", nome: "Marfrig" }, { ticker: "MRVE3", nome: "MRV" },
      { ticker: "MULT3", nome: "Multiplan" }, { ticker: "NTCO3", nome: "Grupo Natura" }, { ticker: "PCAR3", nome: "GPA" },
      { ticker: "PETR3", nome: "Petrobras ON" }, { ticker: "PETR4", nome: "Petrobras PN" }, { ticker: "PETZ3", nome: "Petz" },
      { ticker: "POSI3", nome: "Positivo" }, { ticker: "PRIO3", nome: "PetroRio" }, { ticker: "QUAL3", nome: "Qualicorp" },
      { ticker: "RADL3", nome: "Raia Drogasil" }, { ticker: "RAIZ4", nome: "Raízen" }, { ticker: "RDOR3", nome: "Rede D'Or" },
      { ticker: "RENT3", nome: "Localiza" }, { ticker: "RRRP3", nome: "3R Petroleum" }, { ticker: "SANB11", nome: "Santander" },
      { ticker: "SBSP3", nome: "Sabesp" }, { ticker: "SLCE3", nome: "SLC Agrícola" }, { ticker: "SMTO3", nome: "São Martinho" },
      { ticker: "STBP3", nome: "Santos Brasil" }, { ticker: "SUZB3", nome: "Suzano" }, { ticker: "TAEE11", nome: "Taesa" },
      { ticker: "TIMS3", nome: "TIM" }, { ticker: "TOTS3", nome: "TOTVS" }, { ticker: "UGPA3", nome: "Ultrapar" },
      { ticker: "USIM5", nome: "Usiminas" }, { ticker: "VALE3", nome: "Vale" }, { ticker: "VBBR3", nome: "Vibra Energia" },
      { ticker: "VIVT3", nome: "Telefônica" }, { ticker: "WEGE3", nome: "WEG" }, { ticker: "YDUQ3", nome: "Yduqs" },
    ],
  },
  {
    id: "dividendos",
    label: "💰 Dividendos",
    descricao: "Ações do índice de dividendos (IDIV)",
    subtitulo: "Ações do índice IDIV — empresas que historicamente distribuem os maiores proventos",
    ativos: [
      { ticker: "ABCB4", nome: "ABC Brasil" }, { ticker: "ALUP11", nome: "Alupar" }, { ticker: "BBAS3", nome: "Banco do Brasil" },
      { ticker: "BBSE3", nome: "BB Seguridade" }, { ticker: "BPAC11", nome: "BTG Pactual" }, { ticker: "BRSR6", nome: "Banrisul" },
      { ticker: "CEDO4", nome: "Cedro" }, { ticker: "CMIG4", nome: "Cemig" }, { ticker: "CPLE6", nome: "Copel" },
      { ticker: "CPFE3", nome: "CPFL Energia" }, { ticker: "CSNA3", nome: "CSN" }, { ticker: "EGIE3", nome: "Engie Brasil" },
      { ticker: "ELET3", nome: "Eletrobras ON" }, { ticker: "ELET6", nome: "Eletrobras PNB" }, { ticker: "ENGI11", nome: "Energisa" },
      { ticker: "EQTL3", nome: "Equatorial" }, { ticker: "GGBR4", nome: "Gerdau" }, { ticker: "GOAU4", nome: "Metalúrgica Gerdau" },
      { ticker: "ITSA4", nome: "Itaúsa" }, { ticker: "ITUB4", nome: "Itaú Unibanco" }, { ticker: "JBSS3", nome: "JBS" },
      { ticker: "KLBN11", nome: "Klabin" }, { ticker: "PETR4", nome: "Petrobras" }, { ticker: "PSSA3", nome: "Porto Seguro" },
      { ticker: "SANB11", nome: "Santander" }, { ticker: "SAPR11", nome: "Sanepar" }, { ticker: "SUZB3", nome: "Suzano" },
      { ticker: "TAEE11", nome: "Taesa" }, { ticker: "TIMS3", nome: "TIM" }, { ticker: "TRPL4", nome: "ISA CTEEP" },
      { ticker: "UGPA3", nome: "Ultrapar" }, { ticker: "VALE3", nome: "Vale" }, { ticker: "VBBR3", nome: "Vibra Energia" },
      { ticker: "VIVT3", nome: "Telefônica" },
    ],
  },
  {
    id: "smallcaps",
    label: "🔬 Small Caps",
    descricao: "Ações do índice Small Caps (SMLL)",
    subtitulo: "Ações do índice SMLL — empresas menores com maior potencial de crescimento",
    ativos: [
      { ticker: "AERI3", nome: "Aeris" }, { ticker: "AGRO3", nome: "BrasilAgro" }, { ticker: "ALPA4", nome: "Alpargatas" },
      { ticker: "AMAR3", nome: "Marisa" }, { ticker: "AMBP3", nome: "Ambipar" }, { ticker: "ANIM3", nome: "Ânima" },
      { ticker: "ARML3", nome: "Armac" }, { ticker: "ATOM3", nome: "Atom" }, { ticker: "BHIA3", nome: "Casas Bahia" },
      { ticker: "BLAU3", nome: "Blau Farmacêutica" }, { ticker: "BOAS3", nome: "BOA Safra" }, { ticker: "BRIT3", nome: "Britânia" },
      { ticker: "BRPR3", nome: "BR Properties" }, { ticker: "CALI3", nome: "Callink" }, { ticker: "CBAV3", nome: "CBA" },
      { ticker: "CEBR5", nome: "COELBA" }, { ticker: "CLSA3", nome: "Closed" }, { ticker: "CMIN3", nome: "CSN Mineração" },
      { ticker: "CNTO3", nome: "Cinto" }, { ticker: "CURY3", nome: "Cury" }, { ticker: "DIRR3", nome: "Direcional" },
      { ticker: "DMVF3", nome: "D&M" }, { ticker: "DXCO3", nome: "Dexco" }, { ticker: "EMAE4", nome: "EMAE" },
      { ticker: "ESPA3", nome: "Espaçolaser" }, { ticker: "EUCA4", nome: "Eucatex" }, { ticker: "EVEN3", nome: "Even" },
      { ticker: "EZTC3", nome: "EZTEC" }, { ticker: "FHER3", nome: "Fertilizantes Heringer" }, { ticker: "FRAS3", nome: "Frasle" },
      { ticker: "GFSA3", nome: "Gafisa" }, { ticker: "GRND3", nome: "Grendene" }, { ticker: "HBOR3", nome: "Helbor" },
      { ticker: "IFCM3", nome: "Infracommerce" }, { ticker: "IGSN3", nome: "Ignis" }, { ticker: "INTB3", nome: "Intelbras" },
      { ticker: "JHSF3", nome: "JHSF" }, { ticker: "JSLG3", nome: "JSL" }, { ticker: "KEPL3", nome: "Kepler Weber" },
      { ticker: "LAVV3", nome: "Lavvi" }, { ticker: "LEVE3", nome: "Mahle-Metal Leve" }, { ticker: "LJQQ3", nome: "Lojas Quero-Quero" },
      { ticker: "LOGG3", nome: "LOG CP" }, { ticker: "LPSB3", nome: "LPS Brasil" }, { ticker: "MATD3", nome: "Mater Dei" },
      { ticker: "MBLY3", nome: "Mobly" }, { ticker: "MDIA3", nome: "M. Dias Branco" }, { ticker: "MDNE3", nome: "Modenese" },
      { ticker: "MELK3", nome: "Méliuz" }, { ticker: "MOVI3", nome: "Movida" }, { ticker: "MTRE3", nome: "Mitre Realty" },
      { ticker: "MULT3", nome: "Multiplan" }, { ticker: "MYPK3", nome: "Iochpe-Maxion" }, { ticker: "NATU3", nome: "Natura" },
      { ticker: "NUTR3", nome: "Nutriplant" }, { ticker: "OMGE3", nome: "Omega Geração" }, { ticker: "ONCO3", nome: "Oncoclínicas" },
      { ticker: "ORVR3", nome: "Orizon" }, { ticker: "PATI4", nome: "Panatlantica" }, { ticker: "POMO4", nome: "Marcopolo" },
      { ticker: "PTBL3", nome: "Portobello" }, { ticker: "RECV3", nome: "PetroRecôncavo" }, { ticker: "RNEW11", nome: "Rio Energy" },
      { ticker: "ROMI3", nome: "Romi" }, { ticker: "SHUL4", nome: "Schuler" }, { ticker: "SIMH3", nome: "Simpar" },
      { ticker: "SLCE3", nome: "SLC Agrícola" }, { ticker: "SMFT3", nome: "SmartFit" }, { ticker: "SMTO3", nome: "São Martinho" },
      { ticker: "SOJA3", nome: "Boa Safra" }, { ticker: "STBP3", nome: "Santos Brasil" }, { ticker: "TASA4", nome: "Taurus Armas" },
      { ticker: "TEND3", nome: "Tenda" }, { ticker: "TGMA3", nome: "Tegma" }, { ticker: "TPVG3", nome: "Triunfo" },
      { ticker: "TUPY3", nome: "Tupy" }, { ticker: "UNIP6", nome: "Unipar" }, { ticker: "VAMO3", nome: "Vamos" },
      { ticker: "VLID3", nome: "Valid" }, { ticker: "VSTE3", nome: "Veste" }, { ticker: "VULC3", nome: "Vulcabras" },
      { ticker: "WEST3", nome: "Westwing" }, { ticker: "WIZC3", nome: "Wiz" }, { ticker: "WSON33", nome: "Wilson Sons" },
      { ticker: "ZAMP3", nome: "Zamp" },
    ],
  },
 
  {
    id: "sp500",
    label: "🌎 S&P 500",
    descricao: "Top 100 ações americanas por capitalização",
    subtitulo: "Top 100 ações do S&P 500 por capitalização de mercado — NYSE e NASDAQ",
    ativos: [
      { ticker: "AAPL", nome: "Apple" }, { ticker: "ABBV", nome: "AbbVie" }, { ticker: "ABNB", nome: "Airbnb" },
      { ticker: "ACN", nome: "Accenture" }, { ticker: "ADBE", nome: "Adobe" }, { ticker: "AMD", nome: "AMD" },
      { ticker: "AMGN", nome: "Amgen" }, { ticker: "AMZN", nome: "Amazon" }, { ticker: "AXP", nome: "American Express" },
      { ticker: "BA", nome: "Boeing" }, { ticker: "BAC", nome: "Bank of America" }, { ticker: "BLK", nome: "BlackRock" },
      { ticker: "BRK.B", nome: "Berkshire Hathaway" }, { ticker: "BSX", nome: "Boston Scientific" }, { ticker: "C", nome: "Citigroup" },
      { ticker: "CAT", nome: "Caterpillar" }, { ticker: "CL", nome: "Colgate" }, { ticker: "CMCSA", nome: "Comcast" },
      { ticker: "COP", nome: "ConocoPhillips" }, { ticker: "COST", nome: "Costco" }, { ticker: "CRM", nome: "Salesforce" },
      { ticker: "CSCO", nome: "Cisco" }, { ticker: "CVS", nome: "CVS Health" }, { ticker: "CVX", nome: "Chevron" },
      { ticker: "DE", nome: "Deere & Co." }, { ticker: "DHR", nome: "Danaher" }, { ticker: "DIS", nome: "Disney" },
      { ticker: "DUK", nome: "Duke Energy" }, { ticker: "EMR", nome: "Emerson Electric" }, { ticker: "F", nome: "Ford" },
      { ticker: "GD", nome: "General Dynamics" }, { ticker: "GE", nome: "GE Aerospace" }, { ticker: "GILD", nome: "Gilead Sciences" },
      { ticker: "GM", nome: "General Motors" }, { ticker: "GOOGL", nome: "Alphabet" }, { ticker: "GS", nome: "Goldman Sachs" },
      { ticker: "HD", nome: "Home Depot" }, { ticker: "HON", nome: "Honeywell" }, { ticker: "IBM", nome: "IBM" },
      { ticker: "INTC", nome: "Intel" }, { ticker: "INTU", nome: "Intuit" }, { ticker: "ISRG", nome: "Intuitive Surgical" },
      { ticker: "JNJ", nome: "Johnson & Johnson" }, { ticker: "JPM", nome: "JP Morgan Chase" }, { ticker: "KO", nome: "Coca-Cola" },
      { ticker: "LIN", nome: "Linde" }, { ticker: "LLY", nome: "Eli Lilly" }, { ticker: "LMT", nome: "Lockheed Martin" },
      { ticker: "LOW", nome: "Lowe's" }, { ticker: "MA", nome: "Mastercard" }, { ticker: "MCD", nome: "McDonald's" },
      { ticker: "MDLZ", nome: "Mondelez" }, { ticker: "MDT", nome: "Medtronic" }, { ticker: "META", nome: "Meta" },
      { ticker: "MMM", nome: "3M" }, { ticker: "MO", nome: "Altria" }, { ticker: "MRK", nome: "Merck" },
      { ticker: "MS", nome: "Morgan Stanley" }, { ticker: "MSFT", nome: "Microsoft" }, { ticker: "MU", nome: "Micron Technology" },
      { ticker: "NEE", nome: "NextEra Energy" }, { ticker: "NFLX", nome: "Netflix" }, { ticker: "NKE", nome: "Nike" },
      { ticker: "NOW", nome: "ServiceNow" }, { ticker: "NVDA", nome: "NVIDIA" }, { ticker: "ORCL", nome: "Oracle" },
      { ticker: "PEP", nome: "PepsiCo" }, { ticker: "PFE", nome: "Pfizer" }, { ticker: "PG", nome: "Procter & Gamble" },
      { ticker: "PLTR", nome: "Palantir" }, { ticker: "PM", nome: "Philip Morris" }, { ticker: "PYPL", nome: "PayPal" },
      { ticker: "QCOM", nome: "Qualcomm" }, { ticker: "RTX", nome: "Raytheon" }, { ticker: "SBUX", nome: "Starbucks" },
      { ticker: "SHOP", nome: "Shopify" }, { ticker: "SO", nome: "Southern Company" }, { ticker: "SPGI", nome: "S&P Global" },
      { ticker: "SYK", nome: "Stryker" }, { ticker: "T", nome: "AT&T" }, { ticker: "TGT", nome: "Target" },
      { ticker: "TMO", nome: "Thermo Fisher" }, { ticker: "TSLA", nome: "Tesla" }, { ticker: "TSM", nome: "TSMC" },
      { ticker: "TXN", nome: "Texas Instruments" }, { ticker: "UNH", nome: "UnitedHealth" }, { ticker: "UNP", nome: "Union Pacific" },
      { ticker: "UPS", nome: "UPS" }, { ticker: "USB", nome: "U.S. Bancorp" }, { ticker: "V", nome: "Visa" },
      { ticker: "VZ", nome: "Verizon" }, { ticker: "WFC", nome: "Wells Fargo" }, { ticker: "WMT", nome: "Walmart" },
      { ticker: "XOM", nome: "ExxonMobil" }, { ticker: "AMAT", nome: "Applied Materials" }, { ticker: "ADI", nome: "Analog Devices" },
      { ticker: "ANET", nome: "Arista Networks" }, { ticker: "APP", nome: "AppLovin" }, { ticker: "BX", nome: "Blackstone" },
      { ticker: "CB", nome: "Chubb" }, { ticker: "CEG", nome: "Constellation Energy" }, { ticker: "COIN", nome: "Coinbase" },
      { ticker: "ZTS", nome: "Zoetis" },
    ],
  },
  {
    id: "bdrs",
    label: "🌐 BDRs",
    descricao: "BDRs negociados na B3",
    subtitulo: "Brazilian Depositary Receipts — invista em empresas globais direto pela bolsa brasileira",
    ativos: [
      { ticker: "AAPL34", nome: "Apple" }, { ticker: "ABBV34", nome: "AbbVie" }, { ticker: "ABTT34", nome: "Abbott" },
      { ticker: "AMGN34", nome: "Amgen" }, { ticker: "AMZO34", nome: "Amazon" }, { ticker: "AORD34", nome: "Accenture" },
      { ticker: "AVGO34", nome: "Broadcom" }, { ticker: "AXPB34", nome: "American Express" }, { ticker: "BERK34", nome: "Berkshire Hathaway" },
      { ticker: "BOAC34", nome: "Bank of America" }, { ticker: "BOED34", nome: "Boeing" }, { ticker: "CATP34", nome: "Caterpillar" },
      { ticker: "CHVX34", nome: "Chevron" }, { ticker: "CISC34", nome: "Cisco" }, { ticker: "COCA34", nome: "Coca-Cola" },
      { ticker: "COST34", nome: "Costco" }, { ticker: "DISB34", nome: "Disney" }, { ticker: "DHER34", nome: "Danaher" },
      { ticker: "ELLI34", nome: "Eli Lilly" }, { ticker: "EXXO34", nome: "ExxonMobil" }, { ticker: "FBOK34", nome: "Meta" },
      { ticker: "FDMO34", nome: "Ford" }, { ticker: "GEHC34", nome: "GE Healthcare" }, { ticker: "GLAX34", nome: "GSK" },
      { ticker: "GOGL34", nome: "Alphabet" }, { ticker: "GSGI34", nome: "Goldman Sachs" }, { ticker: "HD34", nome: "Home Depot" },
      { ticker: "HONB34", nome: "Honeywell" }, { ticker: "IBMB34", nome: "IBM" }, { ticker: "INTC34", nome: "Intel" },
      { ticker: "JNJB34", nome: "Johnson & Johnson" }, { ticker: "JPMC34", nome: "JP Morgan" }, { ticker: "KLAC34", nome: "KLA Corp" },
      { ticker: "KNBR34", nome: "Kinder Morgan" }, { ticker: "LMTB34", nome: "Lockheed Martin" }, { ticker: "LVMH34", nome: "LVMH" },
      { ticker: "MCDC34", nome: "McDonald's" }, { ticker: "MDTC34", nome: "Medtronic" }, { ticker: "MELI34", nome: "MercadoLibre" },
      { ticker: "MERCK34", nome: "Merck" }, { ticker: "META34", nome: "Meta Platforms" }, { ticker: "MSBR34", nome: "Morgan Stanley" },
      { ticker: "MSFT34", nome: "Microsoft" }, { ticker: "NFLX34", nome: "Netflix" }, { ticker: "NIKE34", nome: "Nike" },
      { ticker: "NVDC34", nome: "NVIDIA" }, { ticker: "ORCL34", nome: "Oracle" }, { ticker: "PEPB34", nome: "PepsiCo" },
      { ticker: "PFIZ34", nome: "Pfizer" }, { ticker: "PGCO34", nome: "Procter & Gamble" }, { ticker: "PYPL34", nome: "PayPal" },
      { ticker: "QCOM34", nome: "Qualcomm" }, { ticker: "SBUX34", nome: "Starbucks" }, { ticker: "T34B34", nome: "AT&T" },
      { ticker: "TSLA34", nome: "Tesla" }, { ticker: "TXNB34", nome: "Texas Instruments" }, { ticker: "UNIH34", nome: "UnitedHealth" },
      { ticker: "UPSS34", nome: "UPS" }, { ticker: "VISA34", nome: "Visa" }, { ticker: "WALM34", nome: "Walmart" },
      { ticker: "WFCO34", nome: "Wells Fargo" }, { ticker: "XPBR31", nome: "XP Inc." },
    ],
  },
 
];

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
        {CATEGORIAS.map((cat) => (
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
        {ativosFiltrados.map((item) => (
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

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [textoCompleto, setTextoCompleto] = useState("");
  const [secoes, setSecoes] = useState([]);
  const [secoesVisiveis, setSecoesVisiveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState(`ex: ${EXEMPLOS[0]}`);
  const [categoriaAtiva, setCategoriaAtiva] = useState("ibovespa");
  const [filtro, setFiltro] = useState("");
  const [categoriaAtivaPos, setCategoriaAtivaPos] = useState("ibovespa");
  const [filtroPos, setFiltroPos] = useState("");
  const [semaforoForcado, setSemaforoForcado] = useState(null);
  const msgInterval = useRef(null);
  const resultadoRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      exemploIdx = (exemploIdx + 1) % EXEMPLOS.length;
      setPlaceholder(`ex: ${EXEMPLOS[exemploIdx]}`);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loading) {
      setMsgIndex(0);
      msgInterval.current = setInterval(() => {
        setMsgIndex((prev) => (prev + 1) % MENSAGENS_LOADING.length);
      }, 2500);
      setTimeout(() => { window.scrollTo({ top: 500, behavior: "smooth" }); }, 100);
    } else {
      clearInterval(msgInterval.current);
    }
    return () => clearInterval(msgInterval.current);
  }, [loading]);

  useEffect(() => {
    if (!textoCompleto) return;
    const partes = textoCompleto.split(/(?=^## )/m).filter(p => p.trim());
    setSecoes(partes);
    setSecoesVisiveis([]);
    partes.forEach((_, i) => {
      setTimeout(() => { setSecoesVisiveis(prev => [...prev, i]); }, i * 800);
    });
  }, [textoCompleto]);

  async function buscarAnalise(e, tickerOverride) {
    if (e) e.preventDefault();
    const t = (tickerOverride || ticker).trim().toUpperCase();
    if (!t) return;
    setTicker(t);
    setLoading(true);
    setTextoCompleto("");
    setSecoes([]);
    setSecoesVisiveis([]);
    setErro("");
    setSemaforoForcado(null);
    let buffer = "";
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
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.replace("data: ", "");
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) buffer += parsed.text;
              if (parsed.error) setErro(parsed.error);
              if (parsed.semaforo) setSemaforoForcado(parsed.semaforo);
            } catch {}
          }
        }
      }
      setTextoCompleto(buffer);
      setTimeout(() => resultadoRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    } catch (err) {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  // Card final usa semaforoForcado do backend (matemático) se disponível
  function getCorSemaforo() {
    if (semaforoForcado === "verde") return "verde";
    if (semaforoForcado === "vermelho") return "vermelho";
    if (semaforoForcado === "amarelo") return "amarelo";
    return null;
  }

  const mdComponents = () => ({
    h1: ({children}) => (
      <h1 className="text-2xl font-black text-white border-b border-white/10 pb-3 mb-5 tracking-tight">{children}</h1>
    ),
    h2: ({children}) => (
      <h2 className="text-lg font-bold mb-4 text-white/90 uppercase tracking-widest text-sm mt-6 flex items-center gap-2">
        <span className="h-px flex-1 bg-white/10" />
        {children}
        <span className="h-px flex-1 bg-white/10" />
      </h2>
    ),
    h3: ({children}) => (
      <h3 className="text-base font-bold text-white/80 mt-5 mb-2">{children}</h3>
    ),
    p: ({children}) => <p className="text-white/70 leading-relaxed mb-3 text-[14px] md:text-[15px]">{children}</p>,
    strong: ({children}) => <strong className="text-white font-bold">{children}</strong>,
    table: ({ children }) => (
  <div className="w-full my-4 overflow-hidden rounded-2xl border border-white/10 bg-[#090f20]">
    <table className="w-full table-fixed border-collapse text-sm">{children}</table>
  </div>
),
    thead: ({ children }) => (
  <thead className="hidden md:table-header-group bg-white/5">{children}</thead>
),
    tbody: ({ children }) => (
  <tbody className="block md:table-row-group">{children}</tbody>
),
    tr: ({ children }) => (
  <tr className="block md:table-row border-b border-white/10 md:border-b-0 p-4 md:p-0">{children}</tr>
),
    th: ({ children }) => (
  <th className="px-4 py-3 text-left text-[#79dd7d] font-bold text-xs uppercase tracking-wider border-b border-white/10 whitespace-normal break-words">{children}</th>
),
    td: ({ children }) => {
      const text = typeof children === "string" ? children : Array.isArray(children) ? children.join("") : String(children || "");
      const isComprar = text.toLowerCase().includes("comprar") || text.toLowerCase().includes("buy");
      const isManter = text.toLowerCase().includes("manter") || text.toLowerCase().includes("hold");
      const isVender = text.toLowerCase().includes("vender") || text.toLowerCase().includes("sell");
      const isPositivo = text.includes("+") && text.includes("%");
      const isNegativo = text.startsWith("-") && text.includes("%");
      const colorClass = isComprar || isPositivo ? "text-[#79dd7d] font-bold" : isManter ? "text-yellow-400 font-bold" : isVender || isNegativo ? "text-red-400 font-bold" : "text-white/80";
      const isData = /^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)[\s\/\-]/i.test(text) || (/\d{4}$/.test(text) && text.length <= 10);
      const isPreco = /^(R\$|US\$|\$)/.test(text);
      const isUpside = (text.startsWith("+") || text.startsWith("-")) && text.includes("%");
      const label = isData ? "Atualizado: " : isComprar || isManter || isVender ? "Recomendação: " : isPreco ? "Preço-alvo: " : isUpside ? "Upside: " : null;
      return <td className={`block md:table-cell px-0 md:px-4 py-1.5 md:py-3 border-b-0 md:border-b md:border-white/5 whitespace-normal break-words ${colorClass}`}>{label ? <span className="md:hidden text-white/40 text-xs font-normal">{label}</span> : null}{children}</td>;
    },
    li: ({children}) => (
      <li className="text-white/65 mb-2 ml-4 text-[15px] leading-relaxed">{children}</li>
    ),
    ul: ({children}) => <ul className="list-none space-y-1 mb-4 pl-2">{children}</ul>,
    ol: ({children}) => <ol className="list-decimal space-y-1 mb-4 pl-6 text-white/65">{children}</ol>,
    blockquote: ({children}) => (
      <blockquote className="border-l-4 border-[#79dd7d]/60 pl-5 my-4 text-white/75 bg-[#79dd7d]/5 py-3 rounded-r-xl text-[15px] leading-relaxed">{children}</blockquote>
    ),
    code: ({children}) => (
      <code className="bg-white/10 text-[#79dd7d] px-2 py-0.5 rounded text-xs font-mono">{children}</code>
    ),
    hr: () => <hr className="border-white/10 my-5" />,
  });

  const cor = getCorSemaforo();
  const borderColorFinal = cor === "verde" ? "border-green-500" : cor === "vermelho" ? "border-red-500" : cor === "amarelo" ? "border-yellow-500" : "border-gray-800";
  const bgColorFinal = cor === "verde" ? "bg-green-950/40" : cor === "vermelho" ? "bg-red-950/40" : cor === "amarelo" ? "bg-yellow-950/30" : "bg-gray-900";

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
          <a href="/recursos" className="hover:text-white transition-colors">Recursos</a>
          <a href="/planos" className="hover:text-white transition-colors">Planos</a>
          <a href="/faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>
        <button className="rounded-xl border border-[#64d26f]/50 px-5 py-3 text-[#77db7c] text-sm flex items-center gap-2 hover:bg-[#64d26f]/10 transition">
          <span>♙</span> Entrar
        </button>
      </header>

      {/* TICKER TAPE */}
      <TickerTape />

      {/* HERO */}
      <main className="relative">
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
              <path d="M35 285 C130 260, 185 235, 260 215 S390 155, 595 70" fill="none" stroke="#477eec" strokeWidth="1.4" opacity=".35" />
              {[80,105,130,170,205,240,275,315,355,395,430,470,510,545,575].map((x, i) => {
                const y = [210,230,190,165,195,155,132,152,118,95,115,80,62,48,35][i];
                const h = [52,45,58,64,46,70,66,48,72,76,54,72,85,70,65][i];
                const up = i % 4 !== 1;
                return (
                  <g key={x} opacity="0.9">
                    <line x1={x + 8} y1={y - 18} x2={x + 8} y2={y + h + 18} stroke={up ? "#6edc7b" : "#ff6b5f"} strokeWidth="1" />
                    <rect x={x} y={y} width="16" height={h} rx="2" fill={up ? "#72dc7c" : "#e85f55"} />
                  </g>
                );
              })}
              <text x="595" y="35" fill="rgba(255,255,255,.65)" fontSize="14">130.000</text>
              <text x="595" y="105" fill="rgba(255,255,255,.5)" fontSize="14">128.000</text>
              <text x="595" y="175" fill="rgba(255,255,255,.5)" fontSize="14">124.000</text>
              <text x="70" y="320" fill="rgba(255,255,255,.45)" fontSize="14">Fev</text>
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
              {[
                ["Ações B3", "green"], ["BDRs", "purple"], ["NYSE · NASDAQ", "yellow"],
              ].map(([label, color]) => (
                <span key={label} className={
                  "rounded-full px-4 py-2 text-sm font-semibold border " +
                  (color === "green" ? "border-[#61ce70]/50 text-[#79dd7d]" :
                   color === "blue" ? "border-blue-400/40 text-blue-300" :
                   color === "purple" ? "border-purple-400/40 text-purple-300" :
                   "border-yellow-500/50 text-yellow-300")
                }>{label}</span>
              ))}
            </div>

<h1 className="text-[32px] md:text-[48px] leading-[1.12] font-extrabold tracking-[-0.04em] max-w-[650px]">
                O que os <span className="text-[#77d77b]">analistas do mercado</span> estão recomendando agora?
            </h1>

            <p className="mt-6 text-[19px] leading-8 text-white/65 max-w-[610px]">
              Consenso de mercado, preço-alvo e tese consolidada para{" "}
              <strong className="text-white">ações, BDRs e Wall Street</strong> — sem enrolação.
            </p>

<form onSubmit={buscarAnalise} className="mt-6 flex flex-col md:flex-row rounded-xl border border-[#79dc80]/45 bg-[#111522]/90 max-w-[760px] overflow-hidden">
<div className="flex-1 flex items-center gap-4 px-5 py-4 md:py-0 text-white/55 text-lg">
                <span className="text-2xl">🔍</span>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder={`Digite o ativo para analisar? (${placeholder})`}
                  className="w-full bg-transparent text-white placeholder-white/40 focus:outline-none text-base"
                  disabled={loading}
                />
              </div>
              <button type="submit" disabled={loading || !ticker.trim()}
className="mx-3 mb-3 md:mb-0 md:mr-4 h-[54px] rounded-lg bg-[#8bcf76] hover:brightness-110 disabled:bg-gray-600 disabled:cursor-not-allowed px-9 text-black font-bold tracking-wide transition w-auto md:w-auto">
                  {loading ? "Analisando..." : "CONSULTAR AGORA →"}
              </button>
            </form>

           <p className="mt-3 text-white/35 text-xs text-center md:hidden">👆 Digite o ticker acima e toque em Consultar</p>
<div className="mt-4 grid grid-cols-3 md:flex md:items-center md:gap-8 text-white/65 text-sm md:text-base">
  <span className="flex items-center gap-2"><b className="text-[#79dd7d]">✓</b> Acesso liberado</span>
  <span className="flex items-center gap-2 justify-center"><b className="text-[#79dd7d]">⚡</b> Sem cadastro</span>
  <span className="flex items-center gap-2 justify-end md:justify-start"><b className="text-[#79dd7d]">🕐</b> Resultado imediato</span>
</div>

          </div>


          {/* CATEGORIAS */}
          {!textoCompleto && !loading && (
            <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
              <p className="text-white/40 text-xs uppercase font-bold tracking-widest mb-6 text-center">
                Ou explore por categoria
              </p>
              <CategoriasExplorer
                onSelecionar={(t) => buscarAnalise(null, t)}
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
                  <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-green-500 border-t-transparent animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-4 border-green-300 border-b-transparent animate-spin"
                    style={{ animationDuration: "0.8s", animationDirection: "reverse" }}></div>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl">Analisando {ticker}</p>
                  <p className="text-gray-500 text-sm mt-1">Isso pode levar até 30 segundos</p>
                </div>
                <div className="w-full bg-gray-800 rounded-xl px-6 py-4 text-center min-h-[56px] flex items-center justify-center">
                  <p key={msgIndex} className="text-green-400 text-sm font-medium">{MENSAGENS_LOADING[msgIndex]}</p>
                </div>
                <div className="w-full">
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full transition-all duration-[2500ms] ease-linear"
                      style={{ width: `${((msgIndex + 1) / MENSAGENS_LOADING.length) * 100}%` }} />
                  </div>
                  <p className="text-gray-600 text-xs text-right mt-1">
                    {Math.round(((msgIndex + 1) / MENSAGENS_LOADING.length) * 100)}%
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap justify-center">
                  {["Itaú BBA", "BTG Pactual", "XP", "Bradesco BBI", "Safra", "Genial"].map((casa, i) => (
                    <span key={casa} className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}>{casa}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ERRO */}
        {erro && (
          <div className="max-w-4xl mx-auto px-6 pb-10">
            <div className="bg-red-900/30 border border-red-800 rounded-2xl p-6 text-red-300">⚠️ {erro}</div>
          </div>
        )}

        {/* RESULTADO */}
        {secoes.length > 0 && (
          <div ref={resultadoRef} className="max-w-4xl mx-auto px-4 md:px-6 pb-8 space-y-4 pt-8">

          

            {/* SEÇÕES DO RELATÓRIO */}
            {secoes.map((secao, i) => (
              <div key={i}
                style={{
                  opacity: secoesVisiveis.includes(i) ? 1 : 0,
                  transform: secoesVisiveis.includes(i) ? "translateY(0)" : "translateY(20px)",
                  transition: "opacity 0.6s ease, transform 0.6s ease",
                }}
                className="bg-[#080e1f] rounded-2xl p-4 md:p-8 border border-white/10">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents()}>
                  {secao}
                </ReactMarkdown>
              </div>
            ))}

             

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-4">
              <p className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-5">
                🔍 Continue explorando — analise outro ativo
              </p>
              <CategoriasExplorer
                onSelecionar={(t) => { setTicker(t); buscarAnalise(null, t); }}
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
      <span>🛡</span>
      Confiança e transparência
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
      {["Itaú BBA", "XP Investimentos", "BTG Pactual", "Bradesco BBI", "Safra", "Suno Research"].map((source) => (
        <div
          key={source}
          className="h-28 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/85 font-semibold text-base md:text-lg hover:border-green-400/40 hover:bg-green-400/[0.04] transition"
        >
          {source}
        </div>
      ))}
    </div>

    <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
      {["Goldman Sachs", "Morgan Stanley", "J.P. Morgan"].map((source) => (
        <div
          key={source}
          className="h-24 rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/80 font-medium text-xl hover:border-green-400/40 hover:bg-green-400/[0.04] transition"
        >
          {source}
        </div>
      ))}
    </div>

    <div className="mt-16 max-w-5xl mx-auto rounded-2xl border border-green-500/25 bg-green-500/[0.03] px-6 md:px-8 py-7 flex flex-col md:flex-row items-center justify-between gap-5 text-left">
      <div className="flex items-center gap-5">
        <div className="h-14 w-14 rounded-xl border border-green-400/20 bg-green-400/5 flex items-center justify-center text-green-400 text-2xl">
          🛡
        </div>

        <p className="text-white/65 text-base md:text-lg">
          Atualizado continuamente com base nas recomendações{" "}
          <span className="text-[#79dd7d]">
            mais recentes do mercado.
          </span>
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
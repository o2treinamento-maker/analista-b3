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

const EXEMPLOS = ["PETR4", "MXRF11", "AAPL34", "NVDA", "VALE3", "HGLG11"];
let exemploIdx = 0;

const CATEGORIAS = [
  {
    id: "ibovespa",
    label: "📈 Ibovespa",
    descricao: "Todas as ações do índice Ibovespa",
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
      { ticker: "CASH3", nome: "Méliuz" },
      { ticker: "CCXC3", nome: "CCX Carvão" },
      { ticker: "CEAB3", nome: "C&A" },
      { ticker: "CIEL3", nome: "Cielo" },
      { ticker: "CMIG4", nome: "Cemig" },
      { ticker: "CMIN3", nome: "CSN Mineração" },
      { ticker: "COGN3", nome: "Cogna" },
      { ticker: "CPFE3", nome: "CPFL Energia" },
      { ticker: "CPLE6", nome: "Copel" },
      { ticker: "CRFB3", nome: "Carrefour" },
      { ticker: "CSAN3", nome: "Cosan" },
      { ticker: "CSNA3", nome: "CSN" },
      { ticker: "CVCB3", nome: "CVC" },
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
      { ticker: "GOLL4", nome: "Gol" },
      { ticker: "HAPV3", nome: "Hapvida" },
      { ticker: "HYPE3", nome: "Hypera" },
      { ticker: "IGTI11", nome: "Iguatemi" },
      { ticker: "IRBR3", nome: "IRB Brasil" },
      { ticker: "ITSA4", nome: "Itaúsa" },
      { ticker: "ITUB4", nome: "Itaú Unibanco" },
      { ticker: "JBSS3", nome: "JBS" },
      { ticker: "JHSF3", nome: "JHSF" },
      { ticker: "KLBN11", nome: "Klabin" },
      { ticker: "LREN3", nome: "Lojas Renner" },
      { ticker: "LWSA3", nome: "Locaweb" },
      { ticker: "MGLU3", nome: "Magazine Luiza" },
      { ticker: "MRFG3", nome: "Marfrig" },
      { ticker: "MRVE3", nome: "MRV" },
      { ticker: "MULT3", nome: "Multiplan" },
      { ticker: "NTCO3", nome: "Grupo Natura" },
      { ticker: "PCAR3", nome: "GPA" },
      { ticker: "PETR3", nome: "Petrobras ON" },
      { ticker: "PETR4", nome: "Petrobras PN" },
      { ticker: "PETZ3", nome: "Petz" },
      { ticker: "POSI3", nome: "Positivo" },
      { ticker: "PRIO3", nome: "PetroRio" },
      { ticker: "QUAL3", nome: "Qualicorp" },
      { ticker: "RADL3", nome: "Raia Drogasil" },
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
      { ticker: "VIVT3", nome: "Telefônica" },
      { ticker: "WEGE3", nome: "WEG" },
      { ticker: "YDUQ3", nome: "Yduqs" },
    ],
  },
  {
    id: "dividendos",
    label: "💰 Dividendos",
    descricao: "Ações do índice de dividendos (IDIV)",
    ativos: [
      { ticker: "ABCB4", nome: "ABC Brasil" },
      { ticker: "ALUP11", nome: "Alupar" },
      { ticker: "BBAS3", nome: "Banco do Brasil" },
      { ticker: "BBSE3", nome: "BB Seguridade" },
      { ticker: "BPAC11", nome: "BTG Pactual" },
      { ticker: "BRSR6", nome: "Banrisul" },
      { ticker: "CEDO4", nome: "Cedro" },
      { ticker: "CMIG4", nome: "Cemig" },
      { ticker: "CPLE6", nome: "Copel" },
      { ticker: "CPFE3", nome: "CPFL Energia" },
      { ticker: "CSNA3", nome: "CSN" },
      { ticker: "EGIE3", nome: "Engie Brasil" },
      { ticker: "ELET3", nome: "Eletrobras ON" },
      { ticker: "ELET6", nome: "Eletrobras PNB" },
      { ticker: "ENGI11", nome: "Energisa" },
      { ticker: "EQTL3", nome: "Equatorial" },
      { ticker: "GGBR4", nome: "Gerdau" },
      { ticker: "GOAU4", nome: "Metalúrgica Gerdau" },
      { ticker: "ITSA4", nome: "Itaúsa" },
      { ticker: "ITUB4", nome: "Itaú Unibanco" },
      { ticker: "JBSS3", nome: "JBS" },
      { ticker: "KLBN11", nome: "Klabin" },
      { ticker: "PETR4", nome: "Petrobras" },
      { ticker: "PSSA3", nome: "Porto Seguro" },
      { ticker: "SANB11", nome: "Santander" },
      { ticker: "SAPR11", nome: "Sanepar" },
      { ticker: "SUZB3", nome: "Suzano" },
      { ticker: "TAEE11", nome: "Taesa" },
      { ticker: "TIMS3", nome: "TIM" },
      { ticker: "TRPL4", nome: "ISA CTEEP" },
      { ticker: "UGPA3", nome: "Ultrapar" },
      { ticker: "VALE3", nome: "Vale" },
      { ticker: "VBBR3", nome: "Vibra Energia" },
      { ticker: "VIVT3", nome: "Telefônica" },
    ],
  },
  {
    id: "smallcaps",
    label: "🔬 Small Caps",
    descricao: "Ações do índice Small Caps (SMLL)",
    ativos: [
      { ticker: "AERI3", nome: "Aeris" },
      { ticker: "AGRO3", nome: "BrasilAgro" },
      { ticker: "ALPA4", nome: "Alpargatas" },
      { ticker: "AMAR3", nome: "Marisa" },
      { ticker: "AMBP3", nome: "Ambipar" },
      { ticker: "ANIM3", nome: "Ânima" },
      { ticker: "ARML3", nome: "Armac" },
      { ticker: "ATOM3", nome: "Atom" },
      { ticker: "BHIA3", nome: "Casas Bahia" },
      { ticker: "BLAU3", nome: "Blau Farmacêutica" },
      { ticker: "BOAS3", nome: "BOA Safra" },
      { ticker: "BRIT3", nome: "Britânia" },
      { ticker: "BRPR3", nome: "BR Properties" },
      { ticker: "CALI3", nome: "Callink" },
      { ticker: "CBAV3", nome: "CBA" },
      { ticker: "CEBR5", nome: "COELBA" },
      { ticker: "CLSA3", nome: "Closed" },
      { ticker: "CMIN3", nome: "CSN Mineração" },
      { ticker: "CNTO3", nome: "Cinto" },
      { ticker: "CURY3", nome: "Cury" },
      { ticker: "DIRR3", nome: "Direcional" },
      { ticker: "DMVF3", nome: "D&M" },
      { ticker: "DXCO3", nome: "Dexco" },
      { ticker: "EMAE4", nome: "EMAE" },
      { ticker: "ESPA3", nome: "Espaçolaser" },
      { ticker: "EUCA4", nome: "Eucatex" },
      { ticker: "EVEN3", nome: "Even" },
      { ticker: "EZTC3", nome: "EZTEC" },
      { ticker: "FHER3", nome: "Fertilizantes Heringer" },
      { ticker: "FRAS3", nome: "Frasle" },
      { ticker: "GFSA3", nome: "Gafisa" },
      { ticker: "GRND3", nome: "Grendene" },
      { ticker: "HBOR3", nome: "Helbor" },
      { ticker: "IFCM3", nome: "Infracommerce" },
      { ticker: "IGSN3", nome: "Ignis" },
      { ticker: "INTB3", nome: "Intelbras" },
      { ticker: "JHSF3", nome: "JHSF" },
      { ticker: "JSLG3", nome: "JSL" },
      { ticker: "KEPL3", nome: "Kepler Weber" },
      { ticker: "LAVV3", nome: "Lavvi" },
      { ticker: "LEVE3", nome: "Mahle-Metal Leve" },
      { ticker: "LJQQ3", nome: "Lojas Quero-Quero" },
      { ticker: "LOGG3", nome: "LOG CP" },
      { ticker: "LPSB3", nome: "LPS Brasil" },
      { ticker: "MATD3", nome: "Mater Dei" },
      { ticker: "MBLY3", nome: "Mobly" },
      { ticker: "MDIA3", nome: "M. Dias Branco" },
      { ticker: "MDNE3", nome: "Modenese" },
      { ticker: "MELK3", nome: "Méliuz" },
      { ticker: "MOVI3", nome: "Movida" },
      { ticker: "MTRE3", nome: "Mitre Realty" },
      { ticker: "MULT3", nome: "Multiplan" },
      { ticker: "MYPK3", nome: "Iochpe-Maxion" },
      { ticker: "NATU3", nome: "Natura" },
      { ticker: "NUTR3", nome: "Nutriplant" },
      { ticker: "OMGE3", nome: "Omega Geração" },
      { ticker: "ONCO3", nome: "Oncoclínicas" },
      { ticker: "ORVR3", nome: "Orizon" },
      { ticker: "PATI4", nome: "Panatlantica" },
      { ticker: "POMO4", nome: "Marcopolo" },
      { ticker: "PTBL3", nome: "Portobello" },
      { ticker: "RECV3", nome: "PetroRecôncavo" },
      { ticker: "RNEW11", nome: "Rio Energy" },
      { ticker: "ROMI3", nome: "Romi" },
      { ticker: "SHUL4", nome: "Schuler" },
      { ticker: "SIMH3", nome: "Simpar" },
      { ticker: "SLCE3", nome: "SLC Agrícola" },
      { ticker: "SMFT3", nome: "SmartFit" },
      { ticker: "SMTO3", nome: "São Martinho" },
      { ticker: "SOJA3", nome: "Boa Safra" },
      { ticker: "STBP3", nome: "Santos Brasil" },
      { ticker: "TASA4", nome: "Taurus Armas" },
      { ticker: "TEND3", nome: "Tenda" },
      { ticker: "TGMA3", nome: "Tegma" },
      { ticker: "TPVG3", nome: "Triunfo" },
      { ticker: "TUPY3", nome: "Tupy" },
      { ticker: "UNIP6", nome: "Unipar" },
      { ticker: "VAMO3", nome: "Vamos" },
      { ticker: "VLID3", nome: "Valid" },
      { ticker: "VSTE3", nome: "Veste" },
      { ticker: "VULC3", nome: "Vulcabras" },
      { ticker: "WEST3", nome: "Westwing" },
      { ticker: "WIZC3", nome: "Wiz" },
      { ticker: "WSON33", nome: "Wilson Sons" },
      { ticker: "ZAMP3", nome: "Zamp" },
    ],
  },
  {
    id: "fiis",
    label: "🏢 Fundos Imob.",
    descricao: "Principais FIIs do mercado brasileiro",
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
      { ticker: "ZTS", nome: "Zoetis" },
    ],
  },
  {
    id: "bdrs",
    label: "🌐 BDRs",
    descricao: "BDRs mais negociados na B3",
    ativos: [
      { ticker: "AAPL34", nome: "Apple" },
      { ticker: "AMZO34", nome: "Amazon" },
      { ticker: "BERK34", nome: "Berkshire" },
      { ticker: "COCA34", nome: "Coca-Cola" },
      { ticker: "DISB34", nome: "Disney" },
      { ticker: "FBOK34", nome: "Meta" },
      { ticker: "GOGL34", nome: "Alphabet" },
      { ticker: "JPMC34", nome: "JP Morgan" },
      { ticker: "MCDC34", nome: "McDonald's" },
      { ticker: "META34", nome: "Meta" },
      { ticker: "MSFT34", nome: "Microsoft" },
      { ticker: "NFLX34", nome: "Netflix" },
      { ticker: "NIKE34", nome: "Nike" },
      { ticker: "NVDC34", nome: "NVIDIA" },
      { ticker: "PGCO34", nome: "Procter & Gamble" },
      { ticker: "TSLA34", nome: "Tesla" },
      { ticker: "VISA34", nome: "Visa" },
      { ticker: "WALM34", nome: "Walmart" },
      { ticker: "XPBR31", nome: "XP Inc." },
    ],
  },
  {
    id: "cripto",
    label: "₿ ETFs & Cripto",
    descricao: "ETFs e ativos de cripto listados na B3",
    ativos: [
      { ticker: "BITH11", nome: "Bitcoin ETF Hashdex" },
      { ticker: "BITI11", nome: "Bitcoin ETF iShares" },
      { ticker: "BITC11", nome: "Bitcoin ETF" },
      { ticker: "BOVA11", nome: "ETF Ibovespa" },
      { ticker: "BRAX11", nome: "ETF IBrX-100" },
      { ticker: "ETHE11", nome: "Ethereum ETF" },
      { ticker: "HASH11", nome: "Cripto ETF Hashdex" },
      { ticker: "IVVB11", nome: "ETF S&P 500" },
      { ticker: "NASI11", nome: "ETF Nasdaq" },
      { ticker: "QBTC11", nome: "Bitcoin ETF QR" },
      { ticker: "SMAC11", nome: "ETF Small Caps" },
      { ticker: "SPXI11", nome: "ETF S&P 500 iShares" },
      { ticker: "TECK11", nome: "ETF Tecnologia" },
      { ticker: "XINA11", nome: "ETF China" },
    ],
  },
];

// Componente reutilizável de categorias
function CategoriasExplorer({ onSelecionar, categoriaAtiva, setCategoriaAtiva, filtro, setFiltro }) {
  const categoriaAtivaData = CATEGORIAS.find(c => c.id === categoriaAtiva);
  const ativosFiltrados = categoriaAtivaData?.ativos.filter(a =>
    filtro === "" ||
    a.ticker.includes(filtro.toUpperCase()) ||
    a.nome.toLowerCase().includes(filtro.toLowerCase())
  ) || [];

  return (
    <div className="text-left">
      {/* ABAS */}
      <div className="flex gap-2 flex-wrap mb-4 justify-center">
        {CATEGORIAS.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setCategoriaAtiva(cat.id); setFiltro(""); }}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              categoriaAtiva === cat.id
                ? "bg-green-500 text-black"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* HEADER + FILTRO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 px-1">
        <div>
          <p className="text-white text-sm font-semibold">{categoriaAtivaData?.descricao}</p>
          <p className="text-gray-500 text-xs">{ativosFiltrados.length} ativos</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 w-full sm:w-48">
          <span className="text-gray-500 text-xs">🔍</span>
          <input
            type="text"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Filtrar..."
            className="bg-transparent text-white text-xs placeholder-gray-500 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* CHIPS */}
      <div className="flex flex-wrap gap-2">
        {ativosFiltrados.map((item) => (
          <button
            key={item.ticker}
            onClick={() => onSelecionar(item.ticker)}
            className="group flex flex-col items-start bg-gray-900 hover:bg-green-500 border border-gray-700 hover:border-green-400 rounded-lg px-3 py-2 transition-all duration-150 hover:scale-105 cursor-pointer min-w-[80px]"
          >
            <span className="font-bold text-xs text-green-400 group-hover:text-black leading-tight">{item.ticker}</span>
            <span className="text-gray-500 group-hover:text-black text-xs leading-tight truncate max-w-[100px]">{item.nome}</span>
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
      setTimeout(() => {
        setSecoesVisiveis(prev => [...prev, i]);
      }, i * 800);
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

  // Detecta recomendação final de forma precisa — só no título ### da seção
  function detectarRecomendacao(secao) {
    const linhas = secao.split("\n");
    for (const linha of linhas) {
      const l = linha.toUpperCase().trim();
      if (l.startsWith("###")) {
        if (l.includes("COMPRAR")) return "comprar";
        if (l.includes("VENDER")) return "vender";
        if (l.includes("MANTER")) return "manter";
      }
    }
    return "manter"; // fallback
  }

  const mdComponents = (isComprar, isVender) => ({
    h1: ({children}) => <h1 className="text-2xl font-bold text-white border-b border-gray-700 pb-2 mb-4">{children}</h1>,
    h2: ({children}) => <h2 className="text-xl font-bold mb-4 text-gray-100">{children}</h2>,
    h3: ({children}) => <h3 className="text-lg font-semibold text-gray-200 mt-4 mb-2">{children}</h3>,
    p: ({children}) => <p className="text-gray-300 leading-relaxed mb-3">{children}</p>,
    strong: ({children}) => <strong className="text-white font-bold">{children}</strong>,
    table: ({children}) => <div className="overflow-x-auto my-4"><table className="w-full border-collapse text-sm">{children}</table></div>,
    thead: ({children}) => <thead className="bg-gray-800">{children}</thead>,
    th: ({children}) => <th className="px-4 py-3 text-left text-green-400 font-semibold border border-gray-700">{children}</th>,
    td: ({children}) => <td className="px-4 py-3 text-gray-300 border border-gray-700">{children}</td>,
    tr: ({children}) => <tr className="hover:bg-gray-800/50 transition-colors">{children}</tr>,
    li: ({children}) => <li className="text-gray-300 mb-1 ml-4">{children}</li>,
    ul: ({children}) => <ul className="list-disc space-y-1 mb-3 pl-4">{children}</ul>,
    ol: ({children}) => <ol className="list-decimal space-y-1 mb-3 pl-4">{children}</ol>,
    blockquote: ({children}) => <blockquote className="border-l-4 border-yellow-500 pl-4 my-3 text-yellow-200 bg-yellow-900/10 py-2 rounded-r">{children}</blockquote>,
    code: ({children}) => <code className="bg-gray-800 text-green-400 px-2 py-0.5 rounded text-xs font-mono">{children}</code>,
    hr: () => <hr className="border-gray-700 my-4" />,
  });

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* NAVBAR */}
      <nav className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-sm">📊</div>
            <span className="font-bold text-lg">Radar de <span className="text-green-400">Consenso</span></span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-gray-400 text-sm">
            <a href="/como-funciona" className="hover:text-white">Como funciona</a>
            <a href="/recursos" className="hover:text-white">Recursos</a>
            <a href="/planos" className="hover:text-white">Planos</a>
            <a href="/faq" className="hover:text-white">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <button className="border border-green-500 text-green-400 px-4 py-2 rounded-lg text-sm hover:bg-green-500 hover:text-black transition-colors">
              Entrar
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute bottom-0 bg-green-500 opacity-60 rounded-t"
              style={{ left: `${i * 5 + 2}%`, width: "2%", height: `${(i % 5 + 1) * 15}%` }} />
          ))}
        </div>
        <div className="relative max-w-5xl mx-auto px-6 py-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {[
              { label: "Ações B3", color: "bg-green-900/50 text-green-400 border-green-800" },
              { label: "FIIs", color: "bg-blue-900/50 text-blue-400 border-blue-800" },
              { label: "BDRs", color: "bg-purple-900/50 text-purple-400 border-purple-800" },
              { label: "NYSE · NASDAQ", color: "bg-yellow-900/50 text-yellow-400 border-yellow-800" },
            ].map((tag) => (
              <span key={tag.label} className={`text-xs font-bold px-3 py-1 rounded-full border ${tag.color}`}>
                {tag.label}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            O que os <span className="text-green-400">analistas do mercado</span><br />
            estão recomendando agora?
          </h1>
          <p className="text-gray-400 text-base md:text-lg mb-8">
            Consenso de mercado, preço-alvo e tese consolidada para <strong className="text-white">ações, FIIs, BDRs e Wall Street</strong> — sem enrolação.
          </p>

          <form onSubmit={buscarAnalise} className="flex flex-col md:flex-row gap-3 max-w-2xl mx-auto mb-6">
            <div className="flex-1 flex items-center bg-gray-900 border border-gray-700 rounded-xl px-4 gap-3">
              <span className="text-gray-500">🔍</span>
              <div className="flex-1">
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder={`Digite o ticker (${placeholder})`}
                  className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none py-4 transition-all"
                  disabled={loading}
                />
              </div>
            </div>
            <button type="submit" disabled={loading || !ticker.trim()}
              className="bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold px-8 py-4 rounded-xl transition-colors">
              {loading ? "Analisando..." : "CONSULTAR AGORA →"}
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400 mb-10">
            <span className="flex items-center gap-2"><span className="text-green-400">✓</span> Acesso liberado</span>
            <span className="flex items-center gap-2"><span className="text-green-400">⚡</span> Sem cadastro</span>
            <span className="flex items-center gap-2"><span className="text-green-400">🕐</span> Resultado imediato</span>
          </div>

          {/* CATEGORIAS — tela inicial */}
          {!textoCompleto && !loading && (
            <div className="mt-2">
              <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-4 text-center">
                Explore por categoria — clique para analisar
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
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="max-w-4xl mx-auto px-6 pb-10">
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
        <div ref={resultadoRef} className="max-w-4xl mx-auto px-4 md:px-6 pb-8 space-y-4">
          {secoes.map((secao, i) => {
            const isFinal = secao.includes("RECOMENDAÇÃO FINAL") || secao.includes("RECOMENDACAO FINAL");
            const rec = isFinal ? detectarRecomendacao(secao) : null;
            const isComprar = rec === "comprar";
            const isVender = rec === "vender";
            const borderColor = isFinal ? isComprar ? "border-green-500" : isVender ? "border-red-500" : "border-yellow-500" : "border-gray-800";
            const bgColor = isFinal ? isComprar ? "bg-green-950/40" : isVender ? "bg-red-950/40" : "bg-yellow-950/30" : "bg-gray-900";
            return (
              <div key={i}
                style={{
                  opacity: secoesVisiveis.includes(i) ? 1 : 0,
                  transform: secoesVisiveis.includes(i) ? "translateY(0)" : "translateY(20px)",
                  transition: "opacity 0.6s ease, transform 0.6s ease",
                }}
                className={`${bgColor} rounded-2xl p-5 md:p-8 border-2 ${borderColor}`}
              >
                {isFinal && (
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 pb-6 border-b border-gray-700">
                    <div className="text-5xl">{isComprar ? "🟢" : isVender ? "🔴" : "🟡"}</div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-1">Recomendação Final</p>
                      <p className={`text-3xl font-black ${isComprar ? "text-green-400" : isVender ? "text-red-400" : "text-yellow-400"}`}>
                        {isComprar ? "COMPRAR" : isVender ? "VENDER" : "MANTER"}
                      </p>
                    </div>
                    <div className={`px-6 py-3 rounded-full font-bold text-sm ${isComprar ? "bg-green-500 text-black" : isVender ? "bg-red-500 text-white" : "bg-yellow-500 text-black"}`}>
                      {isComprar ? "↑ ALTA ESPERADA" : isVender ? "↓ EVITAR" : "→ AGUARDAR"}
                    </div>
                  </div>
                )}
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents(isComprar, isVender)}>
                  {secao}
                </ReactMarkdown>
              </div>
            );
          })}

          {/* CONTINUE EXPLORANDO — categorias após o resultado */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mt-4">
            <p className="text-gray-400 text-xs uppercase font-bold tracking-widest mb-5">
              🔍 Continue explorando — analise outro ativo
            </p>
            <CategoriasExplorer
              onSelecionar={(t) => {
                setTicker(t);
                buscarAnalise(null, t);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              categoriaAtiva={categoriaAtivaPos}
              setCategoriaAtiva={setCategoriaAtivaPos}
              filtro={filtroPos}
              setFiltro={setFiltroPos}
            />
          </div>
        </div>
      )}

      {/* CORRETORAS */}
      <div className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-xl font-bold mb-2">Fontes do Brasil e do mundo</h2>
          <p className="text-gray-500 text-sm mb-8">Consolidamos dados de corretoras, bancos e casas de análise líderes</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {["Itaú BBA", "XP Investimentos", "BTG Pactual", "Bradesco BBI", "Safra", "Suno Research", "Goldman Sachs", "Morgan Stanley", "JP Morgan"].map((c) => (
              <span key={c} className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg text-sm text-gray-300 font-medium">{c}</span>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: "📊", title: "Consenso de Mercado", desc: "Veja o que a maioria dos analistas está recomendando para qualquer ativo." },
            { icon: "🎯", title: "Preço-Alvo Médio", desc: "Confira o preço-alvo médio e o range pessimista/otimista do mercado." },
            { icon: "📋", title: "Tese Consolidada", desc: "Entenda os pontos positivos e riscos de ações, FIIs, BDRs e NYSE/NASDAQ." },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="w-10 h-10 bg-green-900/40 rounded-lg flex items-center justify-center text-xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-sm mb-1">{f.title}</h3>
              <p className="text-gray-500 text-xs">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
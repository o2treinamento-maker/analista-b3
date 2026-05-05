import Anthropic from "@anthropic-ai/sdk";
import { Redis } from "@upstash/redis";
const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── NORMALIZADOR DE TICKERS ───────────────────────────────────────────────
const TICKER_ALIASES = {
  "PETROBRAS": "PETR4", "PETROBRAS PN": "PETR4", "PETROBRAS ON": "PETR3",
  "VALE": "VALE3", "ITAU": "ITUB4", "ITAÚ": "ITUB4",
  "BRADESCO": "BBDC4", "BRADESCO PN": "BBDC4", "BRADESCO ON": "BBDC3",
  "AMBEV": "ABEV3", "BANCO DO BRASIL": "BBAS3", "BB": "BBAS3",
  "EMBRAER": "EMBR3", "WEG": "WEGE3", "LOCALIZA": "RENT3",
  "SUZANO": "SUZB3", "ELETROBRAS": "ELET3", "SABESP": "SBSP3",
  "EQUATORIAL": "EQTL3", "TOTVS": "TOTS3",
  "APPLE": "AAPL", "MICROSOFT": "MSFT", "NVIDIA": "NVDA",
  "GOOGLE": "GOOGL", "ALPHABET": "GOOGL", "TESLA": "TSLA",
  "AMAZON": "AMZN", "META": "META", "NETFLIX": "NFLX",
  "MAXI RENDA": "MXRF11", "HGLG": "HGLG11", "XPML": "XPML11",
  "KNRI": "KNRI11", "VISC": "VISC11",
};

function normalizarTicker(input) {
  const upper = input.trim().toUpperCase();
  return TICKER_ALIASES[upper] || upper;
}

async function buscarPrecoAtual(ticker) {
  try {
    const isBR = ticker.endsWith("3") || ticker.endsWith("4") || ticker.endsWith("11");
    const symbol = isBR ? `${ticker}.SA` : ticker;

    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    );

    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice || null;
  } catch (error) {
    console.error("Erro ao buscar preço no Yahoo:", error);
    return null;
  }
}

// ─── CACHE: EXPIRA MEIA-NOITE ──────────────────────────────────────────────
function segundosAteMeiaNoite() {
  const agora = new Date();
  const meiaNoite = new Date();
  meiaNoite.setHours(24, 0, 0, 0);
  return Math.floor((meiaNoite - agora) / 1000);
}

// ─── FUNÇÕES DE CÁLCULO (VOCÊ CONTROLA, NÃO O MODELO) ─────────────────────
function parseNumero(valor) {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "number") return valor;
  const limpo = String(valor).replace(/[^\d,.-]/g, "").replace(",", ".");
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}

function normalizarRecomendacao(rec) {
  if (!rec) return "Manter";
  const t = rec.toLowerCase();
  if (t.includes("comprar") || t.includes("buy") || t.includes("strong buy") ||
      t.includes("outperform") || t.includes("overweight") || t.includes("positivo")) return "Comprar";
  if (t.includes("vender") || t.includes("sell") || t.includes("underperform") ||
      t.includes("underweight") || t.includes("reduce")) return "Vender";
  return "Manter";
}

function formatarMoeda(valor, moeda = "BRL") {
  if (valor === null || valor === undefined) return "—";
  const prefixo = moeda === "USD" ? "US$" : "R$";
  return `${prefixo} ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatarPercentual(valor) {
  if (valor === null || valor === undefined) return "—";
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function calcularConsenso(dados) {
  const precoAtual = parseNumero(dados.precoAtual);
  const taxaReferencia = parseNumero(dados.taxaReferencia);
  const analistas = Array.isArray(dados.analistas) ? dados.analistas : [];

  const analistasValidos = analistas
    .map((a) => ({
      casa: a.casa || "Não informado",
      recomendacao: normalizarRecomendacao(a.recomendacao),
      precoAlvo: parseNumero(a.precoAlvo),
      data: a.data || null,
      observacao: a.observacao || "",
      moedaPrecoAlvo: a.moedaPrecoAlvo || dados.moeda || null,
    }))
    .filter((a) => a.data)
    .filter((a) => {
      // Descarta recomendações com mais de 6 meses
      const [ano, mes] = a.data.split("-").map(Number);
      if (!ano || !mes) return false;
      const dataRec = new Date(ano, mes - 1, 1);
      const seisM = new Date();
      seisM.setMonth(seisM.getMonth() - 6);
      return dataRec >= seisM;
    });

  const tipoAtivo = (dados.tipoAtivo || "").toLowerCase();
  const moedaAtivo = dados.moeda || "BRL";
  const isB3 = tipoAtivo.includes("b3") || moedaAtivo === "BRL";
  const isAmericana = tipoAtivo.includes("americana") || moedaAtivo === "USD";

  const analistasComPreco = analistasValidos.filter((a) => {
    if (typeof a.precoAlvo !== "number" || a.precoAlvo <= 0) return false;
    const texto = `${a.observacao || ""}`.toLowerCase();
    const moedaPrecoAlvo = (a.moedaPrecoAlvo || "").toUpperCase();
    if (isB3) {
      if (moedaPrecoAlvo === "USD") return false;
      if (texto.includes("us$") || texto.includes("usd") ||
          texto.includes("adr") || texto.includes("nyse") ||
          texto.includes("nasdaq")) return false;
    }
    if (isAmericana) {
      if (moedaPrecoAlvo === "BRL") return false;
    }
    return true;
  });

  const qtdComprar = analistasValidos.filter((a) => a.recomendacao === "Comprar").length;
  const qtdManter  = analistasValidos.filter((a) => a.recomendacao === "Manter").length;
  const qtdVender  = analistasValidos.filter((a) => a.recomendacao === "Vender").length;
  const total      = analistasValidos.length;
  const totalComPreco = analistasComPreco.length;

  const precoAlvoMedio  = totalComPreco > 0 ? analistasComPreco.reduce((s, a) => s + a.precoAlvo, 0) / totalComPreco : null;
  const precoAlvoMinimo = totalComPreco > 0 ? Math.min(...analistasComPreco.map((a) => a.precoAlvo)) : null;
  const precoAlvoMaximo = totalComPreco > 0 ? Math.max(...analistasComPreco.map((a) => a.precoAlvo)) : null;

  const upsideMedio  = precoAtual && precoAlvoMedio  ? ((precoAlvoMedio  - precoAtual) / precoAtual) * 100 : null;
  const upsideMinimo = precoAtual && precoAlvoMinimo ? ((precoAlvoMinimo - precoAtual) / precoAtual) * 100 : null;
  const upsideMaximo = precoAtual && precoAlvoMaximo ? ((precoAlvoMaximo - precoAtual) / precoAtual) * 100 : null;
  const premio       = upsideMedio !== null && taxaReferencia !== null ? upsideMedio - taxaReferencia : null;

  const percComprar = total > 0 ? qtdComprar / total : 0;

// dispersão (%)
const dispersao =
  precoAlvoMinimo && precoAlvoMaximo && precoAlvoMedio
    ? ((precoAlvoMaximo - precoAlvoMinimo) / precoAlvoMedio) * 100
    : null;

// critérios
const consensoForte = percComprar >= 0.7;
const consensoFraco = percComprar < 0.5;

const premioBom = premio !== null && premio >= 5;
const premioRuim = premio !== null && premio < 0;

const dispersaoAlta = dispersao !== null && dispersao > 30;

// semáforo novo
let semaforo = null;

if (premioRuim || consensoFraco) {
  semaforo = "vermelho";
} else if (consensoForte && premioBom && !dispersaoAlta) {
  semaforo = "verde";
} else {
  semaforo = "amarelo";
}

  const moeda = dados.moeda || "BRL";

  return {
    ticker:               dados.ticker || "",
    nome:                 dados.nome || "",
    tipoAtivo:            dados.tipoAtivo || "Ativo financeiro",
    moeda,
    precoAtual,
    taxaReferencia,
    taxaReferenciaNome:   dados.taxaReferenciaNome || (moeda === "USD" ? "Treasury 10Y" : "Selic"),
    pontosPositivos:      dados.pontosPositivos || [],
    riscos:               dados.riscos || [],
    contextoGeral:        dados.contextoGeral || "",
    analistas: analistasValidos.map((a) => ({
      ...a,
      precoAlvoFormatado: formatarMoeda(a.precoAlvo, moeda),
      upsideFormatado: precoAtual && a.precoAlvo
        ? formatarPercentual(((a.precoAlvo - precoAtual) / precoAtual) * 100)
        : "—",
    })),
    fmt: {
      precoAtual:          formatarMoeda(precoAtual, moeda),
      taxaReferencia:      formatarPercentual(taxaReferencia),
      percentualComprar:   total > 0 ? formatarPercentual((qtdComprar / total) * 100) : "—",
      precoAlvoMedio:      formatarMoeda(precoAlvoMedio, moeda),
      precoAlvoMinimo:     formatarMoeda(precoAlvoMinimo, moeda),
      precoAlvoMaximo:     formatarMoeda(precoAlvoMaximo, moeda),
      upsideMedio:         formatarPercentual(upsideMedio),
      upsideMinimo:        formatarPercentual(upsideMinimo),
      upsideMaximo:        formatarPercentual(upsideMaximo),
      premio:              formatarPercentual(premio),
    },
    dist: { qtdComprar, qtdManter, qtdVender, total, totalComPreco },
    semaforo,
  };
}

function extrairJSON(texto) {
  try { return JSON.parse(texto); } catch { /* continua */ }
  const match = texto.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("IA não retornou JSON válido.");
  return JSON.parse(match[0]);
}

// ─── HANDLER PRINCIPAL ─────────────────────────────────────────────────────
export async function POST(request) {
  const body = await request.json();

  if (!body.ticker) {
    return new Response(JSON.stringify({ error: "Ticker não informado" }), { status: 400 });
  }

  const ticker = normalizarTicker(body.ticker);
  const cacheKeyDados = `dados-analistas:${ticker}`;

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const now = new Date();

const dataHoje = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
}).format(now);

  const mes = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  month: "long",
}).format(now);

const ano = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
}).format(now);

const mesAno = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  month: "long",
  year: "numeric",
}).format(now);

  const dataAnterior = new Date(now);
  dataAnterior.setMonth(dataAnterior.getMonth() - 1);
  const mesAnterior = dataAnterior.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const dataLimite = new Date(now);
  dataLimite.setMonth(dataLimite.getMonth() - 6);
  const dataLimiteStr = dataLimite.toLocaleDateString("pt-BR");

  (async () => {
    try {
      let dadosColetados = null;

      try {
        const cachedDados = await kv.get(cacheKeyDados);
        if (cachedDados) {
          dadosColetados = cachedDados;
        }
      } catch (e) {
        console.error("KV read dados error:", e);
      }

      if (!dadosColetados) {
        const coletaRes = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 5000,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 6 }],
          system: `
Você é um coletor de dados financeiros. Retorne APENAS JSON válido. Sem markdown, sem explicações.

REGRAS CRÍTICAS:
— Data de hoje: ${dataHoje}. Descarte recomendações anteriores a ${dataLimiteStr}.
— NÃO invente dados. NÃO inclua Yahoo Finance, TipRanks, MarketBeat, StockAnalysis como analistas individuais.
— NÃO busque recomendações de ADR. Para VALE3, PETR4, ITUB4 e demais tickers B3, busque APENAS recomendações da ação negociada na B3 em reais.
— Use apenas casas reais: XP, BTG, Itaú BBA, Bradesco BBI, Safra, Genial, Santander, Citi, Goldman Sachs, Morgan Stanley, JP Morgan, BofA, UBS, Barclays, Oppenheimer, Piper Sandler, Suno, Empiricus etc.
— Para ações brasileiras: busque Selic atual. Para americanas: busque Treasury 10Y.
— Se a data de uma recomendação não estiver clara, NÃO inclua o analista.
— Todo analista incluído DEVE ter precoAlvo numérico maior que zero.

REGRA DE MOEDA:
— Para ativos da B3, inclua APENAS preços-alvo em reais (R$).
— Se estiver em dólar, ADR, NYSE ou NASDAQ, descarte para tickers B3.
— Para ações americanas, inclua APENAS preços-alvo em dólares (US$).
— No JSON, inclua "moedaPrecoAlvo": "BRL" ou "USD".

Formato obrigatório:
{
  "ticker": "",
  "nome": "",
  "tipoAtivo": "Ação B3 | FII | BDR | Ação Americana",
  "moeda": "BRL | USD",
  "precoAtual": 0,
  "taxaReferenciaNome": "Selic | Treasury 10Y",
  "taxaReferencia": 0,
  "analistas": [
    {
      "casa": "",
      "recomendacao": "Comprar | Manter | Vender | Outperform | Overweight | etc",
      "precoAlvo": 0,
      "moedaPrecoAlvo": "BRL | USD",
      "data": "YYYY-MM",
      "observacao": ""
    }
  ],
  "pontosPositivos": [],
  "riscos": [],
  "contextoGeral": ""
}`,
          messages: [{
            role: "user",
            content: `Pesquise recomendações recentes para ${ticker}.
Buscas sugeridas:
— "${ticker} preço-alvo analistas ${mes} ${ano}"
— "${ticker} recomendação XP BTG Itaú ${mesAno}"
— "${ticker} preço-alvo ${mesAnterior}"
— "${ticker} analyst price target ${mes} ${ano}"
— "${ticker} buy sell hold rating ${mes} ${ano}"

Retorne apenas JSON válido.`,
          }],
        });

        const textoJSON = coletaRes.content
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("");

        dadosColetados = extrairJSON(textoJSON);

        try {
          await kv.set(cacheKeyDados, dadosColetados, { ex: 60 * 60 * 24 * 30 });
        } catch (e) {
          console.error("KV write dados error:", e);
        }
      }

      const precoAtualYahoo = await buscarPrecoAtual(ticker);

      if (precoAtualYahoo) {
        dadosColetados.precoAtual = precoAtualYahoo;
      }

      const d = calcularConsenso(dadosColetados);

      const reportStream = await client.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: `
Você é um redator financeiro em português brasileiro.
Use EXCLUSIVAMENTE os dados fornecidos. Não invente números. Não altere nenhum valor.
Não faça recomendação de compra/venda. O primeiro caractere deve ser #.`,
        messages: [{
          role: "user",
          content: `
Gere o relatório usando APENAS estes dados calculados:

DADOS:
${JSON.stringify({
  ticker: d.ticker,
  nome: d.nome,
  tipoAtivo: d.tipoAtivo,
  dataHoje,
  precoAtual: d.fmt.precoAtual,
  taxaReferenciaNome: d.taxaReferenciaNome,
  taxaReferencia: d.fmt.taxaReferencia,
  percentualComprar: d.fmt.percentualComprar,
  upsideMedio: d.fmt.upsideMedio,
  premio: d.fmt.premio,
  precoAlvoMedio: d.fmt.precoAlvoMedio,
  precoAlvoMinimo: d.fmt.precoAlvoMinimo,
  precoAlvoMaximo: d.fmt.precoAlvoMaximo,
  upsideMinimo: d.fmt.upsideMinimo,
  upsideMaximo: d.fmt.upsideMaximo,
  dist: d.dist,
  analistas: d.analistas,
  pontosPositivos: d.pontosPositivos,
  riscos: d.riscos,
  contextoGeral: d.contextoGeral,
}, null, 2)}

FORMATO OBRIGATÓRIO:

# ${d.ticker} — ${d.nome}

**Tipo de ativo:** ${d.tipoAtivo}
**Preço atual:** ${d.fmt.precoAtual} · ${dataHoje}

---

## CONSENSO DOS ANALISTAS

| Indicador | Leitura |
|---|---|
| 📊 Recomendação predominante | ${d.dist.qtdComprar} de ${d.dist.total} analistas indicam Comprar |
| 🎯 Potencial de valorização estimado | ${d.fmt.upsideMedio} |
| 💰 ${d.taxaReferenciaNome} | ${d.fmt.taxaReferencia} ao ano |
| ⚖️ Comparação com renda fixa | ${d.fmt.premio} |
| 📅 Janela dos dados | Últimos 6 meses |

> 💡 **Leitura simples:** explique em 1 frase clara o que esses dados significam para um investidor leigo, sem recomendar compra ou venda.

---

## RECOMENDAÇÕES POR ANALISTA (amostra recente)

| Corretora / Casa | Recomendação | Preço-alvo | Upside | Data |
|---|---|---|---|---|
${d.analistas.map((a) => `| ${a.casa} | ${a.recomendacao} | ${a.precoAlvoFormatado} | ${a.upsideFormatado} | ${a.data} |`).join("\n")}

> Upside calculado com base no preço atual em ${dataHoje}. Apenas analistas individuais com datas confirmadas nos últimos 6 meses.

---

## DISTRIBUIÇÃO DAS RECOMENDAÇÕES

| Recomendação | Qtd. de Analistas |
|---|---|
| ✅ Comprar | ${d.dist.qtdComprar} |
| 🟡 Manter | ${d.dist.qtdManter} |
| ❌ Vender | ${d.dist.qtdVender} |

**FAIXA DE PREÇOS-ALVO:** ${d.fmt.precoAlvoMinimo} a ${d.fmt.precoAlvoMaximo}  
**Média estatística:** ${d.fmt.precoAlvoMedio} *(${d.dist.totalComPreco} analistas com preço-alvo)*  
**Upside implícito: ${d.fmt.upsideMedio}** em relação ao preço atual

---

## TESE UNIFICADA

### ✅ Pontos positivos predominantes:
${d.pontosPositivos.length > 0 ? d.pontosPositivos.map((p) => `— ${p}`).join("\n") : "— Dados insuficientes nas fontes consultadas."}

### ⚠️ Principais riscos apontados:
${d.riscos.length > 0 ? d.riscos.map((r) => `— ${r}`).join("\n") : "— Dados insuficientes nas fontes consultadas."}

### 📌 Tese consolidada:
[escreva 2 a 4 frases resumindo a visão do mercado, sem dar veredito]

---

## FAIXA DE PROJEÇÕES DOS ANALISTAS

Nos últimos 6 meses, os preços-alvo encontrados ficam entre **${d.fmt.precoAlvoMinimo}** e **${d.fmt.precoAlvoMaximo}**.

| Leitura | Preço-alvo | Upside |
|---|---|---|
| 🐻 Projeção mais cautelosa | ${d.fmt.precoAlvoMinimo} | ${d.fmt.upsideMinimo} |
| ⚖️ Referência estatística | ${d.fmt.precoAlvoMedio} | ${d.fmt.upsideMedio} |
| 🚀 Projeção mais otimista | ${d.fmt.precoAlvoMaximo} | ${d.fmt.upsideMaximo} |

> A média é apenas uma referência estatística. A leitura principal deve considerar a faixa de projeções, a dispersão entre analistas e a recomendação predominante.

[escreva 1 frase simples explicando se o consenso parece concentrado ou disperso]

---

> ⚠️ *Aviso regulatório: Esta análise possui caráter informativo e educacional, baseada em dados públicos e consenso recente de mercado. Não constitui recomendação individualizada de investimento.*`,
        }],
      });

      for await (const chunk of reportStream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
          );
        }
      }

      if (d.semaforo) {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify({ semaforo: d.semaforo })}\n\n`)
        );
      }

      await writer.write(encoder.encode("data: [DONE]\n\n"));
    } catch (error) {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
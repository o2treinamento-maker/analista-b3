// src/app/api/analisar/route.js
// ═══════════════════════════════════════════════════════════════════════════
// ANÁLISE AVANÇADA v4.1 — SIMPLES, ROBUSTO E ECONÔMICO
// ═══════════════════════════════════════════════════════════════════════════
//
// FILOSOFIA v4.1: "Simples é melhor que inteligente"
//
//   ✓ Cache do RELATÓRIO FINAL — 7 dias
//   ✓ Cache dos dados coletados — 7 dias
//   ✓ ÚNICA invalidação: variação > 5% no dia (lógica simples)
//   ✓ Timestamp visível pro usuário (transparência)
//   ✓ Prompt caching da Anthropic
//   ✓ Preço atual SEMPRE fresco da Brapi
//
//   ❌ SEM variação acumulada (muito frágil)
//   ❌ SEM refresh em background (complexidade desnecessária)
//
//   ECONOMIA ESPERADA: 90-95% em produção
// ═══════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { Redis } from "@upstash/redis";

const kv = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════
const JANELA_PRIMARIA_MESES = 3;
const JANELA_FALLBACK_MESES = 6;
const MIN_ANALISTAS = 3;

// 🌟 v4.1: TTLs de 7 dias (economia máxima)
const TTL_DADOS = 60 * 60 * 24 * 7;        // 7 dias
const TTL_RELATORIO = 60 * 60 * 24 * 7;    // 7 dias
const VARIACAO_MAX_CACHE = 5;               // 5% no dia → invalida cache

// ═══════════════════════════════════════════════════════════════════════════
// TICKER ALIASES
// ═══════════════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════════════
// BUSCAR PREÇO ATUAL (SEMPRE FRESCO)
// ═══════════════════════════════════════════════════════════════════════════
async function buscarPrecoAtual(ticker) {
  try {
    const token = process.env.BRAPI_TOKEN;
    if (!token) {
      console.error("BRAPI_TOKEN nao configurado");
      return null;
    }

    const url = `https://brapi.dev/api/quote/${ticker}?range=1d&interval=1d&token=${token}`;
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      const detalhe = await res.text();
      console.error("Erro BRAPI:", res.status, detalhe);
      return null;
    }

    const data = await res.json();
    const ativo = data?.results?.[0];

    return {
      precoAtual: ativo?.regularMarketPrice ?? null,
      variacaoDia: ativo?.regularMarketChangePercent ?? null,
      abertura: ativo?.regularMarketOpen ?? null,
      maximaDia: ativo?.regularMarketDayHigh ?? null,
      minimaDia: ativo?.regularMarketDayLow ?? null,
      fechamentoAnterior: ativo?.regularMarketPreviousClose ?? null,
      dataCotacao: ativo?.regularMarketTime
        ? new Date(ativo.regularMarketTime * 1000).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })
        : null,
    };
  } catch (err) {
    console.error("Erro BRAPI:", err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════
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

function garantirPontoFinal(texto) {
  if (!texto) return "";
  const t = String(texto).trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
}

function normalizarSentimento(sentimento) {
  if (!sentimento) return null;
  const s = sentimento.toLowerCase();
  if (s.includes("positivo") || s.includes("positive")) return "Positivo";
  if (s.includes("negativo") || s.includes("negative")) return "Negativo";
  return "Neutro";
}

function emojiSentimento(sentimento) {
  if (sentimento === "Positivo") return "🟢";
  if (sentimento === "Negativo") return "🔴";
  return "🟡";
}

// 🌟 NOVO v4.1: helper SIMPLES pra verificar variação alta
// Retorna true APENAS se temos certeza que variação foi > 5%
// Em caso de dado faltando, retorna false (não invalida cache desnecessariamente)
function variacaoEhAlta(cotacao) {
  if (!cotacao) return false;
  if (cotacao.variacaoDia === null || cotacao.variacaoDia === undefined) return false;
  if (typeof cotacao.variacaoDia !== "number") return false;
  if (isNaN(cotacao.variacaoDia)) return false;

  return Math.abs(cotacao.variacaoDia) > VARIACAO_MAX_CACHE;
}

// 🌟 NOVO v4.1: formata "há quanto tempo" pra exibir ao usuário
function formatarTempoCache(cachedAt) {
  if (!cachedAt) return "agora";

  const agora = new Date();
  const dataCache = new Date(cachedAt);
  const diffMs = agora - dataCache;
  const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDias = Math.floor(diffHoras / 24);

  if (diffHoras < 1) return "há menos de 1 hora";
  if (diffHoras < 24) return `há ${diffHoras} ${diffHoras === 1 ? "hora" : "horas"}`;
  if (diffDias === 1) return "há 1 dia";
  return `há ${diffDias} dias`;
}

function filtrarPorJanela(analistasMapeados, meses) {
  return analistasMapeados.filter((a) => {
    if (!a.data) return false;
    const [ano, mes] = a.data.split("-").map(Number);
    if (!ano || !mes) return false;
    const dataRec = new Date(ano, mes - 1, 1);
    const limite = new Date();
    limite.setMonth(limite.getMonth() - meses);
    return dataRec >= limite;
  });
}

function calcularConsenso(dados) {
  const precoAtual     = parseNumero(dados.precoAtual);
  const taxaReferencia = parseNumero(dados.taxaReferencia);
  const analistas      = Array.isArray(dados.analistas) ? dados.analistas : [];

  const analistasMapeados = analistas
    .map((a) => ({
      casa:          a.casa || "Não informado",
      recomendacao:  normalizarRecomendacao(a.recomendacao),
      precoAlvo:     parseNumero(a.precoAlvo),
      data:          a.data || null,
      observacao:    a.observacao || "",
      moedaPrecoAlvo: a.moedaPrecoAlvo || dados.moeda || null,
    }))
    .filter((a) => a.data);

  let analistasValidos = filtrarPorJanela(analistasMapeados, JANELA_PRIMARIA_MESES);
  let janelaUsada = JANELA_PRIMARIA_MESES;
  let janelaExpandida = false;

  if (analistasValidos.length < MIN_ANALISTAS) {
    const analistasFallback = filtrarPorJanela(analistasMapeados, JANELA_FALLBACK_MESES);
    if (analistasFallback.length > analistasValidos.length) {
      analistasValidos = analistasFallback;
      janelaUsada = JANELA_FALLBACK_MESES;
      janelaExpandida = true;
    }
  }

  analistasValidos.sort((a, b) => b.data.localeCompare(a.data));

  const tipoAtivo  = (dados.tipoAtivo || "").toLowerCase();
  const moedaAtivo = dados.moeda || "BRL";
  const isB3       = tipoAtivo.includes("b3") || moedaAtivo === "BRL";
  const isAmericana = tipoAtivo.includes("americana") || moedaAtivo === "USD";

  const analistasComPreco = analistasValidos.filter((a) => {
    if (typeof a.precoAlvo !== "number" || a.precoAlvo <= 0) return false;
    const texto        = `${a.observacao || ""}`.toLowerCase();
    const moedaPrecoAlvo = (a.moedaPrecoAlvo || "").toUpperCase();
    if (isB3) {
      if (moedaPrecoAlvo === "USD") return false;
      if (texto.includes("us$") || texto.includes("usd") ||
          texto.includes("adr") || texto.includes("nyse") ||
          texto.includes("nasdaq")) return false;
    }
    if (isAmericana && moedaPrecoAlvo === "BRL") return false;
    return true;
  });

  const qtdComprar    = analistasValidos.filter((a) => a.recomendacao === "Comprar").length;
  const qtdManter     = analistasValidos.filter((a) => a.recomendacao === "Manter").length;
  const qtdVender     = analistasValidos.filter((a) => a.recomendacao === "Vender").length;
  const total         = analistasValidos.length;
  const totalComPreco = analistasComPreco.length;

  const precoAlvoMedio  = totalComPreco > 0 ? analistasComPreco.reduce((s, a) => s + a.precoAlvo, 0) / totalComPreco : null;
  const precoAlvoMinimo = totalComPreco > 0 ? Math.min(...analistasComPreco.map((a) => a.precoAlvo)) : null;
  const precoAlvoMaximo = totalComPreco > 0 ? Math.max(...analistasComPreco.map((a) => a.precoAlvo)) : null;

  const upsideMedio  = precoAtual && precoAlvoMedio  ? ((precoAlvoMedio  - precoAtual) / precoAtual) * 100 : null;
  const upsideMinimo = precoAtual && precoAlvoMinimo ? ((precoAlvoMinimo - precoAtual) / precoAtual) * 100 : null;
  const upsideMaximo = precoAtual && precoAlvoMaximo ? ((precoAlvoMaximo - precoAtual) / precoAtual) * 100 : null;
  const premio       = upsideMedio !== null && taxaReferencia !== null ? upsideMedio - taxaReferencia : null;

  const percComprar    = total > 0 ? qtdComprar / total : 0;
  const dispersao      = precoAlvoMinimo && precoAlvoMaximo && precoAlvoMedio
    ? ((precoAlvoMaximo - precoAlvoMinimo) / precoAlvoMedio) * 100
    : null;

  const consensoForte  = percComprar >= 0.7;
  const consensoFraco  = percComprar < 0.5;
  const premioBom      = premio !== null && premio >= 5;
  const premioRuim     = premio !== null && premio < 0;
  const dispersaoAlta  = dispersao !== null && dispersao > 30;

  let semaforo = null;
  if (premioRuim || consensoFraco)                        semaforo = "vermelho";
  else if (consensoForte && premioBom && !dispersaoAlta)  semaforo = "verde";
  else                                                     semaforo = "amarelo";

  const moeda = dados.moeda || "BRL";

  return {
    ticker:            dados.ticker || "",
    nome:              dados.nome || "",
    tipoAtivo:         dados.tipoAtivo || "Ativo financeiro",
    moeda,
    precoAtual,
    taxaReferencia,
    taxaReferenciaNome: dados.taxaReferenciaNome || (moeda === "USD" ? "Treasury 10Y" : "Selic"),
    pontosPositivos:   dados.pontosPositivos || [],
    riscos:            dados.riscos || [],
    contextoGeral:     dados.contextoGeral || "",
    janelaUsada,
    janelaExpandida,
    analistas: analistasValidos.map((a) => ({
      ...a,
      precoAlvoFormatado: formatarMoeda(a.precoAlvo, moeda),
      upsideFormatado: precoAtual && a.precoAlvo
        ? formatarPercentual(((a.precoAlvo - precoAtual) / precoAtual) * 100)
        : "—",
    })),
    fmt: {
      precoAtual:        formatarMoeda(precoAtual, moeda),
      taxaReferencia:    formatarPercentual(taxaReferencia),
      percentualComprar: total > 0 ? formatarPercentual((qtdComprar / total) * 100) : "—",
      precoAlvoMedio:    formatarMoeda(precoAlvoMedio, moeda),
      precoAlvoMinimo:   formatarMoeda(precoAlvoMinimo, moeda),
      precoAlvoMaximo:   formatarMoeda(precoAlvoMaximo, moeda),
      upsideMedio:       formatarPercentual(upsideMedio),
      upsideMinimo:      formatarPercentual(upsideMinimo),
      upsideMaximo:      formatarPercentual(upsideMaximo),
      premio:            formatarPercentual(premio),
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

// Streaming simulado pro cache (UX consistente)
async function streamRelatorioCacheado(relatorio, enviar) {
  const tamanhoChunk = 40;
  for (let i = 0; i < relatorio.length; i += tamanhoChunk) {
    const chunk = relatorio.slice(i, i + tamanhoChunk);
    await enviar({ text: chunk });
    if (i % (tamanhoChunk * 5) === 0) {
      await new Promise(r => setTimeout(r, 8));
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export async function POST(request) {
  const body = await request.json();

  if (!body.ticker) {
    return new Response(JSON.stringify({ error: "Ticker não informado" }), { status: 400 });
  }

  const ticker = normalizarTicker(body.ticker);

  // 🌟 v4.1: chaves de cache versionadas (invalidação automática de caches v3 antigos)
  const cacheKeyDados = `dados-analistas-v4:${ticker}`;
  const cacheKeyRelatorio = `relatorio-v4:${ticker}`;

  const encoder = new TextEncoder();
  const stream  = new TransformStream();
  const writer  = stream.writable.getWriter();

  const enviar = (obj) =>
    writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

  const now      = new Date();
  const dataHoje = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric",
  }).format(now);

  const dataLimite = new Date(now);
  dataLimite.setMonth(dataLimite.getMonth() - JANELA_FALLBACK_MESES);
  const dataLimiteStr = dataLimite.toLocaleDateString("pt-BR");

  (async () => {
    try {
      await enviar({ fase: "coletando" });

      // ─── Busca cache do relatório + cotação fresca em paralelo
      const [relatorioCacheado, cotacaoBrapi] = await Promise.all([
        kv.get(cacheKeyRelatorio).catch(e => {
          console.error("KV read relatorio error:", e);
          return null;
        }),
        buscarPrecoAtual(ticker),
      ]);

      // ─── ÚNICA invalidação: variação alta no dia
      const cacheInvalido = variacaoEhAlta(cotacaoBrapi);

      // ─── CACHE HIT: usa relatório cacheado
      if (relatorioCacheado && !cacheInvalido) {
        const tempoNoCache = formatarTempoCache(relatorioCacheado.cachedAt);

        await enviar({
          fase: "cache_hit",
          cachedAt: relatorioCacheado.cachedAt,
          tempoNoCache,
        });

        // Envia preço fresco
        if (cotacaoBrapi) {
          await enviar({ cotacao: cotacaoBrapi });
        }

        // Re-stream do relatório
        await streamRelatorioCacheado(relatorioCacheado.texto, enviar);

        const meta = relatorioCacheado.dados || {};
        if (meta.semaforo) await enviar({ semaforo: meta.semaforo });
        if (meta.sentimento) await enviar({ sentimento: meta.sentimento });

        await writer.write(encoder.encode("data: [DONE]\n\n"));
        await writer.close();
        return;
      }

      // ─── CACHE MISS (ou invalidado): busca dados
      if (cacheInvalido) {
        await enviar({
          fase: "cache_invalidado",
          motivo: `variação de ${cotacaoBrapi?.variacaoDia?.toFixed(1)}% no dia`,
        });
      }

      let dadosColetados = null;

      // Tenta cache dos dados (mesmo se relatório foi invalidado, dados de analistas podem servir)
      if (!cacheInvalido) {
        try {
          const cachedDados = await kv.get(cacheKeyDados);
          if (cachedDados) {
            dadosColetados = cachedDados;
            await enviar({ fase: "dados_cache_hit" });
          }
        } catch (e) {
          console.error("KV read dados error:", e);
        }
      }

      // ─── Coleta dados via IA + Web Search (se cache miss)
      if (!dadosColetados) {
        const coletaRes = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 5000,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 10 }],
          // 🌟 Prompt caching: 90% off no input em chamadas subsequentes
          system: [{
            type: "text",
            text: `
Você é um coletor de dados financeiros. Retorne APENAS JSON válido. Sem markdown, sem explicações.

REGRAS CRÍTICAS:
— Data de hoje: ${dataHoje}. Descarte recomendações anteriores a ${dataLimiteStr}.
— NÃO invente dados. NÃO inclua Yahoo Finance, TipRanks, MarketBeat, StockAnalysis como analistas individuais.
— NÃO busque recomendações de ADR. Para VALE3, PETR4, ITUB4 e demais tickers B3, busque APENAS recomendações da ação negociada na B3 em reais.
— Use apenas casas reais: XP, BTG, Itaú BBA, Bradesco BBI, Safra, Genial, Santander, Citi, Goldman Sachs, Morgan Stanley, JP Morgan, BofA, UBS, Barclays, Oppenheimer, Piper Sandler, Suno, Empiricus etc.
— Para ações brasileiras: busque Selic atual. Para americanas: busque Treasury 10Y.
— Se a data de uma recomendação não estiver clara, NÃO inclua o analista.
— Todo analista incluído DEVE ter precoAlvo numérico maior que zero.
— Não invente notícias ou eventos.
— Não criar narrativas sem fonte recente.
— Não afirmar cenários futuros como certeza.
— Perspectivas devem ser tratadas como probabilidades.
— Se não houver informações suficientes, deixe claro.
— Priorize notícias dos últimos 30 dias.
— Considere resultados trimestrais, guidance, fluxo, juros, commodities, dólar e cenário setorial quando relevantes.
— Evite linguagem promocional ou emocional.

FONTES PREFERENCIAIS PARA AÇÕES BRASILEIRAS:
Priorize buscas em: InfoMoney, Money Times, Seu Dinheiro, Estadão E-Investidor, Investing.com Brasil, Valor Investe, RI da própria empresa.
Não use redes sociais, fóruns, blogs sem fonte clara ou páginas sem data.

REGRA DE MOEDA:
— Para ativos da B3, inclua APENAS preços-alvo em reais (R$).
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
  "contextoGeral": "",
  "noticiasRecentes": [],
  "perspectivasFuturas": [],
  "sentimentoMercado": "Positivo | Neutro | Negativo"
}`,
            cache_control: { type: "ephemeral" },
          }],
          messages: [{
            role: "user",
            content: `Pesquise recomendações recentes para ${ticker}.

Buscas sugeridas:
— "${ticker} preço-alvo site:infomoney.com.br"
— "${ticker} preço-alvo site:moneytimes.com.br"
— "${ticker} recomendação site:einvestidor.estadao.com.br"
— "${ticker} preço-alvo site:seudinheiro.com"
— "${ticker} recomendação analistas site:valorinveste.globo.com"
— "${ticker} RI cobertura analistas"
— "${ticker} preço alvo XP BTG Itaú BBA Safra Genial"

Além das recomendações dos analistas, identifique também:
— principais notícias recentes do ativo
— eventos relevantes dos últimos 30 dias
— percepção atual do mercado
— possíveis drivers futuros
— riscos relevantes

Busque:
— consenso de analistas e preço-alvo
— notícias recentes e resultados trimestrais
— guidance e cenário macro relacionado ao ativo
— fatores que podem impactar o papel nos próximos meses
— sentimento geral do mercado em relação ao ativo (Positivo, Neutro ou Negativo)

Retorne apenas JSON válido.`,
          }],
        });

        const textoJSON = coletaRes.content
          .filter((c) => c.type === "text")
          .map((c) => c.text)
          .join("");

        dadosColetados = extrairJSON(textoJSON);

        try {
          await kv.set(cacheKeyDados, dadosColetados, { ex: TTL_DADOS });
        } catch (e) {
          console.error("KV write dados error:", e);
        }
      }

      // ─── Sobrescreve com cotação SEMPRE fresca da Brapi
      if (cotacaoBrapi) {
        dadosColetados.precoAtual = cotacaoBrapi.precoAtual;
        dadosColetados.variacaoDia = cotacaoBrapi.variacaoDia;
        dadosColetados.abertura = cotacaoBrapi.abertura;
        dadosColetados.maximaDia = cotacaoBrapi.maximaDia;
        dadosColetados.minimaDia = cotacaoBrapi.minimaDia;
        dadosColetados.fechamentoAnterior = cotacaoBrapi.fechamentoAnterior;
        dadosColetados.dataCotacao = cotacaoBrapi.dataCotacao;
      }

      const d          = calcularConsenso(dadosColetados);
      const sentimento = normalizarSentimento(dadosColetados.sentimentoMercado || null);

      const janelaTexto = d.janelaExpandida
        ? `Últimos ${d.janelaUsada} meses *(cobertura limitada nos últimos ${JANELA_PRIMARIA_MESES} meses, janela expandida)*`
        : `Últimos ${d.janelaUsada} meses`;

      const janelaUpsideNota = d.janelaExpandida
        ? `Upside calculado com base no preço atual em ${dataHoje}. Janela expandida para ${d.janelaUsada} meses por baixa cobertura recente.`
        : `Upside calculado com base no preço atual em ${dataHoje}. Apenas analistas individuais com datas confirmadas nos últimos ${d.janelaUsada} meses.`;

      await enviar({ fase: "gerando" });

      // Acumula relatório pra cachear depois
      let relatorioCompleto = "";

      const reportStream = await client.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: [{
          type: "text",
          text: `
Você é um redator financeiro em português brasileiro.
Use EXCLUSIVAMENTE os dados fornecidos. Não invente números. Não altere nenhum valor.
Não faça recomendação de compra/venda.
IMPORTANTE: Comece a resposta IMEDIATAMENTE com "# ${d.ticker}" sem nenhum preâmbulo.`,
          cache_control: { type: "ephemeral" },
        }],
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
  variacaoDia: formatarPercentual(dadosColetados.variacaoDia),
  taxaReferenciaNome: d.taxaReferenciaNome,
  taxaReferencia: d.fmt.taxaReferencia,
  janelaUsada: d.janelaUsada,
  janelaExpandida: d.janelaExpandida,
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
  noticiasRecentes: dadosColetados.noticiasRecentes || [],
  perspectivasFuturas: dadosColetados.perspectivasFuturas || [],
  sentimentoMercado: sentimento,
}, null, 2)}

FORMATO OBRIGATÓRIO — siga EXATAMENTE esta estrutura sem adicionar texto antes do #:

# ${d.ticker} — ${d.nome}

**Tipo de ativo:** ${d.tipoAtivo}
**Preço atual:** ${d.fmt.precoAtual} · ${formatarPercentual(dadosColetados.variacaoDia)} · ${dadosColetados.dataCotacao || dataHoje}
---

## 📡 SENTIMENTO DE MERCADO

${sentimento ? `${emojiSentimento(sentimento)} ${sentimento}` : "🟡 Neutro"}

[escreva 1 frase curta justificando o sentimento com base nas notícias e percepção coletada]

---

## 🧠 LEITURA DO MERCADO

👉 [escreva 1 frase forte interpretando o ativo com base no contexto geral — sem repetir números]

---

## 📰 MOMENTO ATUAL DO ATIVO

${dadosColetados.noticiasRecentes?.length
  ? dadosColetados.noticiasRecentes.map((n) => `• ${garantirPontoFinal(n)}`).join("\n\n")
  : "• Não foram encontrados eventos recentes relevantes nas fontes consultadas."}

---

## 🔮 PERSPECTIVAS FUTURAS

${dadosColetados.perspectivasFuturas?.length
  ? dadosColetados.perspectivasFuturas.map((p) => `• ${garantirPontoFinal(p)}`).join("\n\n")
  : "• Cenário futuro indefinido com base nas fontes consultadas."}

---

## ⚖️ FORÇAS vs RISCOS

### 🟢 FORÇAS ESTRUTURAIS
${d.pontosPositivos.length > 0 ? d.pontosPositivos.map((p) => `• ${garantirPontoFinal(p)}`).join("\n\n") : "• Dados insuficientes nas fontes consultadas."}

### 🔴 PONTOS DE ATENÇÃO
${d.riscos.length > 0 ? d.riscos.map((r) => `• ${garantirPontoFinal(r)}`).join("\n\n") : "• Dados insuficientes nas fontes consultadas."}

---

## 🎯 DRIVER PRINCIPAL

[explique em 1 ou 2 frases quais são os principais fatores que vão determinar o desempenho da ação]

---

## ⚠️ O QUE PODE INVALIDAR A TESE

[liste 2 a 4 riscos objetivos que fariam o cenário positivo não acontecer]

---

## CONSENSO DOS ANALISTAS

| Indicador | Leitura |
|---|---|
| 📊 Recomendação predominante | ${d.dist.qtdComprar} de ${d.dist.total} analistas indicam Comprar |
| 🎯 Potencial de valorização estimado | ${d.fmt.upsideMedio} |
| 📅 Janela dos dados | ${janelaTexto} |

> 💡 **Leitura simples:** explique em 1 frase clara o que esses dados significam para um investidor leigo, sem recomendar compra ou venda.

---

## RECOMENDAÇÕES POR ANALISTA (amostra recente)

| Corretora / Casa | Recomendação | Preço-alvo | Upside | Data |
|---|---|---|---|---|
${d.analistas.map((a) => `| ${a.casa} | ${a.recomendacao} | ${a.precoAlvoFormatado} | ${a.upsideFormatado} | ${a.data} |`).join("\n")}

> ${janelaUpsideNota}

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

## FAIXA DE PROJEÇÕES DOS ANALISTAS

| Leitura | Preço-alvo | Upside |
|---|---|---|
| 🐻 Projeção mais cautelosa | ${d.fmt.precoAlvoMinimo} | ${d.fmt.upsideMinimo} |
| ⚖️ Referência estatística | ${d.fmt.precoAlvoMedio} | ${d.fmt.upsideMedio} |
| 🚀 Projeção mais otimista | ${d.fmt.precoAlvoMaximo} | ${d.fmt.upsideMaximo} |

> A média é apenas uma referência estatística.

[escreva 1 frase simples explicando se o consenso parece concentrado ou disperso]

---

## 📌 SÍNTESE FINAL

[resuma em 2 frases: qualidade da empresa + dependência do cenário — sem recomendar compra ou venda]

---

> ⚠️ *Aviso regulatório: Esta análise possui caráter informativo e educacional, baseada em dados públicos e consenso recente de mercado. Não constitui recomendação individualizada de investimento.*`,
        }],
      });

      for await (const chunk of reportStream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          const text = chunk.delta.text;
          relatorioCompleto += text;
          await enviar({ text });
        }
      }

      if (d.semaforo) await enviar({ semaforo: d.semaforo });
      if (sentimento) await enviar({ sentimento });

      // 🌟 v4.1: salva relatório no cache COM timestamp
      try {
        await kv.set(cacheKeyRelatorio, {
          texto: relatorioCompleto,
          dados: {
            semaforo: d.semaforo,
            sentimento,
          },
          cachedAt: new Date().toISOString(),
        }, { ex: TTL_RELATORIO });
      } catch (e) {
        console.error("KV write relatorio error:", e);
      }

      await writer.write(encoder.encode("data: [DONE]\n\n"));

    } catch (error) {
      console.error("Erro no handler:", error);
      await enviar({ error: error.message });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection:      "keep-alive",
    },
  });
}
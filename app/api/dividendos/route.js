// src/app/api/dividendos/route.js
// ═══════════════════════════════════════════════════════════════════════════
// ANÁLISE DE DIVIDENDOS v2.1 — "Dividend Growth Stability + Edge Cases"
// ═══════════════════════════════════════════════════════════════════════════
//
// MUDANÇAS v2.1 (vs v2.0):
//   ✓ FIX 1: header agora retorna `anoInicio` E `anosConsecutivos` separados
//   ✓ FIX 2: historicoAnual preenche anos faltantes com ZERO (sem gaps visuais)
//   ✓ FIX 3: proximosPagamentos filtra valores zerados (Brapi às vezes retorna)
//   ✓ FIX 4: CAGR detecta gaps no histórico e marca como "histórico irregular"
//   ✓ Score de crescimento penaliza histórico irregular (gaps = -10 pts max)
// ═══════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";

const BRAPI_TOKEN = process.env.BRAPI_TOKEN;
const ANO_CORTE_DESDOBRAMENTO = 2009;

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS MATEMÁTICOS
// ═══════════════════════════════════════════════════════════════════════════

function media(arr) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

function desvioPadrao(arr) {
  if (arr.length < 2) return 0;
  const m = media(arr);
  const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(v);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function regressaoLinear(x, y) {
  if (x.length !== y.length || x.length < 2) {
    return { slope: 0, intercept: 0, r2: 0 };
  }

  const n = x.length;
  const mediaX = media(x);
  const mediaY = media(y);

  let numerador = 0;
  let denominador = 0;
  for (let i = 0; i < n; i++) {
    numerador += (x[i] - mediaX) * (y[i] - mediaY);
    denominador += (x[i] - mediaX) ** 2;
  }

  if (denominador === 0) return { slope: 0, intercept: mediaY, r2: 0 };

  const slope = numerador / denominador;
  const intercept = mediaY - slope * mediaX;

  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yPred = slope * x[i] + intercept;
    ssRes += (y[i] - yPred) ** 2;
    ssTot += (y[i] - mediaY) ** 2;
  }
  const r2 = ssTot === 0 ? 0 : clamp(1 - ssRes / ssTot, 0, 1);

  return { slope, intercept, r2 };
}

// ═══════════════════════════════════════════════════════════════════════════
// BUSCA DE DADOS
// ═══════════════════════════════════════════════════════════════════════════

async function buscarDadosBrapi(ticker) {
  if (!BRAPI_TOKEN) throw new Error("BRAPI_TOKEN não configurado");

  const url = `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}?dividends=true&token=${BRAPI_TOKEN}`;
  const resp = await fetch(url, { next: { revalidate: 21600 } });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Brapi ${resp.status}: ${body.slice(0, 200)}`);
  }

  const json = await resp.json();
  if (json.error || !json.results?.[0]) {
    throw new Error(json.message || `${ticker} não encontrado`);
  }

  return json.results[0];
}

// ═══════════════════════════════════════════════════════════════════════════
// PROCESSAMENTO
// ═══════════════════════════════════════════════════════════════════════════

function normalizarPagamentos(cashDividends) {
  if (!Array.isArray(cashDividends)) return [];

  return cashDividends
    .map(p => ({
      data: new Date(p.paymentDate),
      dataCom: p.lastDatePrior ? new Date(p.lastDatePrior) : null,
      valor: Number(p.rate) || 0,
      tipo: (p.label || "DIVIDENDO").toUpperCase(),
      aprovadoEm: p.approvedOn ? new Date(p.approvedOn) : null,
    }))
    .filter(p =>
      p.valor > 0.0001 &&
      !isNaN(p.data.getTime()) &&
      p.data.getFullYear() >= ANO_CORTE_DESDOBRAMENTO
    )
    .sort((a, b) => b.data - a.data);
}

function agruparPorAno(pagamentos) {
  const mapa = new Map();

  for (const p of pagamentos) {
    const ano = p.data.getFullYear();
    if (!mapa.has(ano)) {
      mapa.set(ano, {
        ano, total: 0, dividendo: 0, jcp: 0, rendimento: 0, qtdPagamentos: 0,
      });
    }
    const entry = mapa.get(ano);
    entry.total += p.valor;
    entry.qtdPagamentos += 1;
    if (p.tipo === "JCP") entry.jcp += p.valor;
    else if (p.tipo === "RENDIMENTO") entry.rendimento += p.valor;
    else entry.dividendo += p.valor;
  }

  return Array.from(mapa.values()).sort((a, b) => a.ano - b.ano);
}

/**
 * 🌟 FIX v2.1: preenche anos faltantes com zero
 * Pega o histórico agrupado e garante que TODOS os anos do range tenham entry.
 * Anos sem pagamento ganham objeto com total=0.
 *
 * Isso é usado:
 *   - Pelo GRÁFICO (mostra barras zeradas em vez de pular anos)
 *   - Pra detectar GAPS no CAGR
 */
function preencherAnosFaltantes(historicoAgrupado) {
  if (historicoAgrupado.length === 0) return [];

  const primeiroAno = historicoAgrupado[0].ano;
  const ultimoAno = historicoAgrupado[historicoAgrupado.length - 1].ano;
  const mapa = new Map(historicoAgrupado.map(h => [h.ano, h]));

  const completo = [];
  for (let ano = primeiroAno; ano <= ultimoAno; ano++) {
    if (mapa.has(ano)) {
      completo.push(mapa.get(ano));
    } else {
      completo.push({
        ano, total: 0, dividendo: 0, jcp: 0, rendimento: 0, qtdPagamentos: 0,
        gap: true, // marca que é ano sem pagamento
      });
    }
  }
  return completo;
}

function calcularDY12m(pagamentos, precoAtual) {
  if (!precoAtual || precoAtual <= 0) return 0;
  const agora = new Date();
  const umAnoAtras = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000);
  const ultimos12m = pagamentos
    .filter(p => p.data >= umAnoAtras && p.data <= agora)
    .reduce((s, p) => s + p.valor, 0);
  return ultimos12m / precoAtual;
}

/**
 * 🌟 FIX v2.1: CAGR considera gaps
 * Se a janela de 5 anos tem GAPS (anos sem pagamento), marca como irregular.
 * Pra empresas saudáveis (sem gaps), funciona igual a antes.
 */
function calcularCAGR(historicoCompleto) {
  const anoCorrente = new Date().getFullYear();
  // Histórico completo já tem gaps preenchidos com zero
  const completos = historicoCompleto.filter(h => h.ano < anoCorrente);
  if (completos.length < 2) return { cagr: 0, temGap: false, anosUsados: 0 };

  const janela = completos.slice(-5);

  // Detecta gaps (anos com total === 0 no meio)
  const temGap = janela.some(h => h.total === 0);

  // Pra calcular CAGR honestamente, ignora os zeros
  const validos = janela.filter(h => h.total > 0);
  if (validos.length < 2) return { cagr: 0, temGap, anosUsados: validos.length };

  const inicio = validos[0].total;
  const fim = validos[validos.length - 1].total;
  const anosReais = validos[validos.length - 1].ano - validos[0].ano;

  if (inicio <= 0 || fim <= 0 || anosReais <= 0) {
    return { cagr: 0, temGap, anosUsados: validos.length };
  }

  const cagr = Math.pow(fim / inicio, 1 / anosReais) - 1;

  return { cagr, temGap, anosUsados: validos.length };
}

function calcularEstabilidadeDirecional(historicoCompleto) {
  const anoCorrente = new Date().getFullYear();
  // Usa só anos com pagamento (ignora gaps pra não distorcer regressão)
  const completos = historicoCompleto.filter(h => h.ano < anoCorrente && h.total > 0);
  if (completos.length < 3) {
    return { estabilidade: 0, r2: 0, tendencia: "indefinida" };
  }

  const janela = completos.slice(-5);
  const x = janela.map(h => h.ano);
  const y = janela.map(h => h.total);

  const { slope, intercept, r2 } = regressaoLinear(x, y);

  const residuos = y.map((valor, i) => {
    const esperado = slope * x[i] + intercept;
    return valor - esperado;
  });

  const mediaY = media(y);
  if (mediaY === 0) return { estabilidade: 0, r2: 0, tendencia: "indefinida" };

  const dpResiduos = desvioPadrao(residuos);
  const cvResiduos = dpResiduos / Math.abs(mediaY);

  let estabilidade = clamp(1 - cvResiduos, 0, 1);

  if (r2 > 0.7) {
    estabilidade += (r2 - 0.7) * 0.5;
    estabilidade = clamp(estabilidade, 0, 1);
  }

  const slopeRelativo = slope / mediaY;
  let tendencia;
  if (slopeRelativo > 0.05) tendencia = "crescente";
  else if (slopeRelativo < -0.05) tendencia = "queda";
  else tendencia = "estavel";

  return { estabilidade, r2, tendencia, slope };
}

function calcularBonusPatamar(historicoCompleto) {
  const anoCorrente = new Date().getFullYear();
  const completos = historicoCompleto.filter(h => h.ano < anoCorrente && h.total > 0);
  if (completos.length < 3) return 0;

  const ultimos3 = completos.slice(-3).map(h => h.total);
  const m = media(ultimos3);
  if (m === 0) return 0;

  const cv = desvioPadrao(ultimos3) / m;
  if (cv < 0.10) return 5;
  if (cv < 0.20) return 3;
  return 0;
}

function anosConsecutivos(historicoCompleto) {
  const anoCorrente = new Date().getFullYear();
  // Aqui ignora gaps: conta anos consecutivos com total > 0 a partir do mais recente
  const completos = historicoCompleto.filter(h => h.ano < anoCorrente && h.total > 0);
  if (completos.length === 0) return 0;

  let consecutivos = 1;
  for (let i = completos.length - 1; i > 0; i--) {
    if (completos[i].ano - completos[i - 1].ano === 1) consecutivos++;
    else break;
  }
  return consecutivos;
}

/**
 * 🌟 FIX v2.1: retorna informações adicionais úteis pro header
 */
function calcularEstatisticasHistorico(historicoCompleto) {
  const anoCorrente = new Date().getFullYear();
  const completos = historicoCompleto.filter(h => h.ano < anoCorrente && h.total > 0);

  if (completos.length === 0) {
    return {
      anoInicio: null,
      anosConsec: 0,
      anosTotaisPagos: 0,
      temGaps: false,
      qtdGaps: 0,
    };
  }

  const anoInicio = completos[0].ano;
  const anosTotaisPagos = completos.length;
  const consec = anosConsecutivos(historicoCompleto);

  // Conta gaps
  const todosAnos = historicoCompleto.filter(h => h.ano < anoCorrente);
  const qtdGaps = todosAnos.filter(h => h.total === 0).length;

  return {
    anoInicio,
    anosConsec: consec,
    anosTotaisPagos,
    temGaps: qtdGaps > 0,
    qtdGaps,
  };
}

function detectarFrequencia(historicoCompleto) {
  const anoCorrente = new Date().getFullYear();
  const completos = historicoCompleto.filter(h => h.ano < anoCorrente && h.total > 0);
  if (completos.length === 0) return { label: "indefinida", media: 0 };

  const ultimos3 = completos.slice(-3);
  const mediaPagamentos = media(ultimos3.map(h => h.qtdPagamentos));

  if (mediaPagamentos >= 10) return { label: "mensal", media: mediaPagamentos };
  if (mediaPagamentos >= 5) return { label: "bimestral", media: mediaPagamentos };
  if (mediaPagamentos >= 3) return { label: "trimestral", media: mediaPagamentos };
  if (mediaPagamentos >= 1.5) return { label: "semestral", media: mediaPagamentos };
  return { label: "anual", media: mediaPagamentos };
}

/**
 * 🌟 FIX v2.1 (BUG 3): filtra pagamentos com valor zero
 * Brapi às vezes retorna pagamentos anunciados mas com valor=0 (ainda não aprovado).
 */
function proximosPagamentos(pagamentos) {
  const agora = new Date();
  return pagamentos
    .filter(p => p.data > agora && p.valor >= 0.01) // FIX: valor mínimo R$ 0,01
    .sort((a, b) => a.data - b.data)
    .slice(0, 3)
    .map(p => ({
      data: p.data.toISOString(),
      dataCom: p.dataCom ? p.dataCom.toISOString() : null,
      valor: p.valor,
      tipo: p.tipo,
      dataComJaPassou: p.dataCom ? p.dataCom < agora : null,
    }));
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORE v2.1
// ═══════════════════════════════════════════════════════════════════════════

function calcularScores({ dy12m, cagr, temGap, estabilidade, anosConsec, bonusPatamar }) {
  // YIELD
  let scoreYield;
  if (dy12m >= 0.12) {
    scoreYield = 95 + Math.min((dy12m - 0.12) * 100, 5);
  } else if (dy12m >= 0.08) {
    scoreYield = 75 + ((dy12m - 0.08) / 0.04) * 20;
  } else if (dy12m >= 0.05) {
    scoreYield = 55 + ((dy12m - 0.05) / 0.03) * 20;
  } else if (dy12m >= 0.03) {
    scoreYield = 35 + ((dy12m - 0.03) / 0.02) * 20;
  } else if (dy12m >= 0.01) {
    scoreYield = 15 + ((dy12m - 0.01) / 0.02) * 20;
  } else {
    scoreYield = dy12m * 1500;
  }
  scoreYield = clamp(scoreYield, 0, 100);

  // CRESCIMENTO — CAGR limitado a 30%, penaliza gaps
  const cagrCapeado = Math.min(cagr, 0.30);

  let scoreCrescimento;
  if (cagrCapeado >= 0.15) {
    scoreCrescimento = 90 + Math.min((cagrCapeado - 0.15) * 67, 10);
  } else if (cagrCapeado >= 0.05) {
    scoreCrescimento = 70 + (cagrCapeado - 0.05) * 200;
  } else if (cagrCapeado >= 0) {
    scoreCrescimento = 50 + cagrCapeado * 400;
  } else {
    scoreCrescimento = clamp(50 + cagrCapeado * 200, 0, 50);
  }

  // 🌟 FIX 4: penaliza se tem gaps no histórico (CAGR menos confiável)
  if (temGap) {
    scoreCrescimento = clamp(scoreCrescimento - 10, 0, 100);
  }

  scoreCrescimento = clamp(scoreCrescimento, 0, 100);

  // CONSISTÊNCIA
  const scoreEstabilidade = estabilidade * 100;
  const scoreAnos = clamp(anosConsec * 5, 0, 100);
  const scoreConsistencia = clamp(scoreEstabilidade * 0.6 + scoreAnos * 0.4, 0, 100);

  // FINAL
  const scoreBase =
    scoreYield * 0.30 +
    scoreCrescimento * 0.35 +
    scoreConsistencia * 0.35;

  const final = Math.round(clamp(scoreBase + bonusPatamar, 0, 100));

  return {
    final,
    yield: Math.round(scoreYield),
    crescimento: Math.round(scoreCrescimento),
    consistencia: Math.round(scoreConsistencia),
    bonusPatamar,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICAÇÕES
// ═══════════════════════════════════════════════════════════════════════════

function classificarPagadora({ score, anosConsec, estabilidade, cagr, temGap }) {
  if (score >= 80 && anosConsec >= 10 && estabilidade >= 0.65 && !temGap) {
    return { label: "ARISTOCRATA", cor: "verde", desc: "paga e cresce consistentemente" };
  }
  if (score >= 70 && estabilidade >= 0.55 && !temGap) {
    return { label: "PAGADORA CONSISTENTE", cor: "verde", desc: "boa previsibilidade" };
  }
  if (score >= 55 && cagr > 0 && !temGap) {
    return { label: "PAGADORA EM CRESCIMENTO", cor: "amarelo", desc: "trajetória ascendente" };
  }
  if (anosConsec >= 5 && estabilidade < 0.5) {
    return { label: "PAGADORA CÍCLICA", cor: "laranja", desc: "paga sempre mas com volatilidade" };
  }
  if (score >= 30) {
    return { label: "PAGADORA IRREGULAR", cor: "laranja", desc: temGap ? "anos sem pagar no histórico" : "histórico volátil" };
  }
  return { label: "PERFIL DE BAIXO DIVIDENDO", cor: "vermelho", desc: "dividendos pouco relevantes" };
}

function classificarYield(dy12m) {
  if (dy12m >= 0.10) return { label: "muito alto", cor: "verde" };
  if (dy12m >= 0.06) return { label: "alto", cor: "verde" };
  if (dy12m >= 0.04) return { label: "moderado", cor: "amarelo" };
  if (dy12m >= 0.02) return { label: "baixo", cor: "laranja" };
  return { label: "muito baixo", cor: "vermelho" };
}

function classificarCrescimento(cagr) {
  if (cagr >= 0.15) return { label: "acelerado", cor: "verde" };
  if (cagr >= 0.05) return { label: "saudável", cor: "verde" };
  if (cagr >= 0) return { label: "estável", cor: "amarelo" };
  if (cagr >= -0.10) return { label: "em queda", cor: "laranja" };
  return { label: "em forte queda", cor: "vermelho" };
}

function classificarEstabilidade(estabilidade) {
  if (estabilidade >= 0.80) return { label: "muito alta", cor: "verde", estrelas: 5 };
  if (estabilidade >= 0.65) return { label: "alta", cor: "verde", estrelas: 4 };
  if (estabilidade >= 0.45) return { label: "moderada", cor: "amarelo", estrelas: 3 };
  if (estabilidade >= 0.25) return { label: "baixa", cor: "laranja", estrelas: 2 };
  return { label: "muito baixa", cor: "vermelho", estrelas: 1 };
}

// ═══════════════════════════════════════════════════════════════════════════
// LEITURA TEXTUAL
// ═══════════════════════════════════════════════════════════════════════════

function gerarLeitura({ ticker, dy12m, cagr, anosConsec, anosTotaisPagos, estabilidade, tendencia, temGap }) {
  const partes = [];
  const dyPct = (dy12m * 100).toFixed(1);
  const cagrPct = (cagr * 100).toFixed(1);

  // Abertura: usa anos TOTAIS pagos, não consecutivos
  if (anosConsec === 0) {
    partes.push(`${ticker} não tem histórico consistente de pagamento de dividendos.`);
    return partes.join(" ");
  }

  if (temGap) {
    // 🌟 FIX 4: comunica gaps na leitura
    partes.push(`${ticker} pagou dividendos em ${anosTotaisPagos} anos, mas com lacunas no histórico.`);
  } else if (anosConsec >= 20) {
    partes.push(`${ticker} distribui dividendos há ${anosConsec} anos consecutivos.`);
  } else if (anosConsec >= 5) {
    partes.push(`${ticker} paga proventos consistentemente há ${anosConsec} anos.`);
  } else {
    partes.push(`${ticker} paga dividendos, mas com histórico curto (${anosConsec} anos consecutivos).`);
  }

  if (dy12m >= 0.10) {
    partes.push(`Dividend Yield 12m de ${dyPct}% é muito alto pra padrões brasileiros.`);
  } else if (dy12m >= 0.06) {
    partes.push(`Dividend Yield 12m de ${dyPct}% é considerado alto.`);
  } else if (dy12m >= 0.04) {
    partes.push(`Dividend Yield 12m de ${dyPct}% é moderado.`);
  } else if (dy12m >= 0.02) {
    partes.push(`Dividend Yield 12m de ${dyPct}% é baixo — empresa prioriza reinvestimento.`);
  } else {
    partes.push(`Dividend Yield 12m de ${dyPct}% é muito baixo — perfil de growth.`);
  }

  if (temGap) {
    partes.push(`CAGR distorcido pelas lacunas — use com cautela.`);
  } else if (cagr >= 0.10) {
    partes.push(`Crescimento médio anual de +${cagrPct}% — empresa eleva dividendos consistentemente.`);
  } else if (cagr >= 0) {
    partes.push(`Crescimento médio de +${cagrPct}% — pagamentos estáveis.`);
  } else if (cagr >= -0.15) {
    partes.push(`Dividendos em queda (${cagrPct}% a.a.) — atenção à tendência.`);
  } else {
    partes.push(`Forte queda nos dividendos (${cagrPct}% a.a.) — pode estar mudando política de proventos.`);
  }

  if (!temGap && estabilidade >= 0.80 && tendencia === "crescente") {
    partes.push(`Trajetória de crescimento muito consistente — alta previsibilidade.`);
  } else if (!temGap && estabilidade >= 0.65 && tendencia === "estavel") {
    partes.push(`Patamar de pagamentos sólido e previsível.`);
  } else if (estabilidade < 0.4) {
    partes.push(`Alta volatilidade — não use médias como expectativa pro próximo ano.`);
  }

  return partes.join(" ");
}

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get("ticker")?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: "ticker obrigatório" }, { status: 400 });
  }

  if (!/^[A-Z0-9]{2,8}$/.test(ticker)) {
    return NextResponse.json({ error: "ticker inválido" }, { status: 400 });
  }

  try {
    const dados = await buscarDadosBrapi(ticker);
    const precoAtual = dados.regularMarketPrice;
    const nome = dados.longName || dados.shortName || ticker;
    const cashDividends = dados.dividendsData?.cashDividends || [];

    const pagamentos = normalizarPagamentos(cashDividends);

    if (pagamentos.length === 0) {
      return NextResponse.json({
        ticker, nome, precoAtual,
        temDividendos: false,
        versaoAlgoritmo: "v2.1",
        leitura: `${ticker} não possui histórico relevante de pagamento de dividendos. Pode ser empresa em fase de crescimento que reinveste lucros, FII recém-listado, ou ativo com política de retenção.`,
      });
    }

    // 🌟 FIX 2: agrupa + preenche gaps com zero
    const historicoAgrupado = agruparPorAno(pagamentos);
    const historicoCompleto = preencherAnosFaltantes(historicoAgrupado);

    const dy12m = calcularDY12m(pagamentos, precoAtual);

    // 🌟 FIX 4: CAGR detecta gaps
    const { cagr, temGap } = calcularCAGR(historicoCompleto);

    const estDir = calcularEstabilidadeDirecional(historicoCompleto);
    const estabilidade = estDir.estabilidade;

    // 🌟 FIX 1: estatísticas estendidas do histórico
    const stats = calcularEstatisticasHistorico(historicoCompleto);
    const anosConsec = stats.anosConsec;

    const frequencia = detectarFrequencia(historicoCompleto);
    const proximos = proximosPagamentos(pagamentos);
    const bonusPatamar = calcularBonusPatamar(historicoCompleto);

    const agora = new Date();
    const umAnoAtras = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000);
    const ultimos12m = pagamentos.filter(p => p.data >= umAnoAtras && p.data <= agora);
    const total12m = ultimos12m.reduce((s, p) => s + p.valor, 0);
    const dividendo12m = ultimos12m.filter(p => p.tipo === "DIVIDENDO").reduce((s, p) => s + p.valor, 0);
    const jcp12m = ultimos12m.filter(p => p.tipo === "JCP").reduce((s, p) => s + p.valor, 0);
    const rendimento12m = ultimos12m.filter(p => p.tipo === "RENDIMENTO").reduce((s, p) => s + p.valor, 0);

    const scores = calcularScores({
      dy12m, cagr, temGap, estabilidade, anosConsec, bonusPatamar,
    });

    const classPagadora = classificarPagadora({
      score: scores.final, anosConsec, estabilidade, cagr, temGap,
    });
    const classYield = classificarYield(dy12m);
    const classCrescimento = classificarCrescimento(cagr);
    const classEstabilidade = classificarEstabilidade(estabilidade);

    const leitura = gerarLeitura({
      ticker, dy12m, cagr, anosConsec,
      anosTotaisPagos: stats.anosTotaisPagos,
      estabilidade,
      tendencia: estDir.tendencia,
      temGap,
    });

    return NextResponse.json({
      ticker, nome, precoAtual, temDividendos: true,
      versaoAlgoritmo: "v2.1",

      metricas: {
        dy12m,
        cagr5y: cagr,
        estabilidade,
        anosConsecutivos: anosConsec,
        total12m,
        r2Tendencia: estDir.r2,
        tendencia: estDir.tendencia,

        // 🌟 FIX 1: novos campos pro header
        anoInicio: stats.anoInicio,
        anosTotaisPagos: stats.anosTotaisPagos,
        temGaps: stats.temGaps,
        qtdGaps: stats.qtdGaps,
      },

      composicao12m: {
        total: total12m,
        dividendo: dividendo12m,
        jcp: jcp12m,
        rendimento: rendimento12m,
        pctDividendo: total12m > 0 ? dividendo12m / total12m : 0,
        pctJcp: total12m > 0 ? jcp12m / total12m : 0,
        pctRendimento: total12m > 0 ? rendimento12m / total12m : 0,
      },

      frequencia,
      historicoAnual: historicoCompleto, // 🌟 FIX 2: já vem com anos faltantes preenchidos
      proximos,
      scores,

      classificacoes: {
        pagadora: classPagadora,
        yield: classYield,
        crescimento: classCrescimento,
        estabilidade: classEstabilidade,
      },

      leitura,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/dividendos] erro:", err.message);
    return NextResponse.json(
      { error: err.message || "erro ao calcular dividendos" },
      { status: 500 }
    );
  }
}
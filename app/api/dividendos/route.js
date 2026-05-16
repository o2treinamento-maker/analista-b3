// src/app/api/dividendos/route.js

import { NextResponse } from "next/server";

const BRAPI_TOKEN = process.env.BRAPI_TOKEN;
const ANO_CORTE_DESDOBRAMENTO = 2009;

// ============================================================
// HELPERS MATEMÁTICOS
// ============================================================

function media(arr) {
  const validos = arr.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (!validos.length) return 0;
  return validos.reduce((s, x) => s + x, 0) / validos.length;
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

  const mediaX = media(x);
  const mediaY = media(y);

  let numerador = 0;
  let denominador = 0;

  for (let i = 0; i < x.length; i++) {
    numerador += (x[i] - mediaX) * (y[i] - mediaY);
    denominador += (x[i] - mediaX) ** 2;
  }

  if (denominador === 0) {
    return { slope: 0, intercept: mediaY, r2: 0 };
  }

  const slope = numerador / denominador;
  const intercept = mediaY - slope * mediaX;

  let ssRes = 0;
  let ssTot = 0;

  for (let i = 0; i < x.length; i++) {
    const yPred = slope * x[i] + intercept;
    ssRes += (y[i] - yPred) ** 2;
    ssTot += (y[i] - mediaY) ** 2;
  }

  const r2 = ssTot === 0 ? 0 : clamp(1 - ssRes / ssTot, 0, 1);

  return { slope, intercept, r2 };
}

// ============================================================
// FETCH BRAPI
// ============================================================

async function parseJsonSeguro(resp, origem) {
  const text = await resp.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${origem} retornou resposta não-JSON: ${text.slice(0, 180)}`);
  }
}

async function buscarDadosBrapi(ticker) {
  if (!BRAPI_TOKEN) throw new Error("BRAPI_TOKEN não configurado");

  const url =
    `https://brapi.dev/api/quote/${encodeURIComponent(ticker)}` +
    `?dividends=true&token=${BRAPI_TOKEN}`;

  const resp = await fetch(url, { next: { revalidate: 21600 } });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Brapi ${resp.status}: ${body.slice(0, 200)}`);
  }

  const json = await parseJsonSeguro(resp, "Brapi dividendos");

  if (json.error || !json.results?.[0]) {
    throw new Error(json.message || `${ticker} não encontrado`);
  }

  const resultado = json.results[0];

  // Aviso defensivo se a Brapi mudar a estrutura no futuro
  if (
    !resultado.dividendsData?.cashDividends &&
    !resultado.cashDividends
  ) {
    console.warn(
      `[Brapi] ${ticker}: estrutura de dividendos não encontrada. Chaves:`,
      Object.keys(resultado)
    );
  }

  return resultado;
}

// Extrai cashDividends de qualquer formato (novo ou antigo) da Brapi
function extrairCashDividends(ativo) {
  return (
    ativo?.dividendsData?.cashDividends ||
    ativo?.cashDividends ||
    []
  );
}

// ============================================================
// NORMALIZAÇÃO E AGRUPAMENTO
// ============================================================

function normalizarPagamentos(cashDividends) {
  if (!Array.isArray(cashDividends)) return [];

  return cashDividends
    .map((p) => ({
      data: new Date(p.paymentDate),
      dataCom: p.lastDatePrior ? new Date(p.lastDatePrior) : null,
      valor: Number(p.rate) || 0,
      tipo: (p.label || "DIVIDENDO").toUpperCase(),
      aprovadoEm: p.approvedOn ? new Date(p.approvedOn) : null,
    }))
    .filter(
      (p) =>
        p.valor > 0.0001 &&
        !Number.isNaN(p.data.getTime()) &&
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
        ano,
        total: 0,
        dividendo: 0,
        jcp: 0,
        rendimento: 0,
        qtdPagamentos: 0,
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

function preencherAnosFaltantes(historicoAgrupado) {
  if (!historicoAgrupado.length) return [];

  const primeiroAno = historicoAgrupado[0].ano;
  const ultimoAno = historicoAgrupado[historicoAgrupado.length - 1].ano;
  const mapa = new Map(historicoAgrupado.map((h) => [h.ano, h]));

  const completo = [];

  for (let ano = primeiroAno; ano <= ultimoAno; ano++) {
    if (mapa.has(ano)) {
      completo.push({ ...mapa.get(ano), gap: false });
    } else {
      completo.push({
        ano,
        total: 0,
        dividendo: 0,
        jcp: 0,
        rendimento: 0,
        qtdPagamentos: 0,
        gap: true,
      });
    }
  }

  return completo;
}

// ============================================================
// MÉTRICAS
// ============================================================

function calcularDY12m(pagamentos, precoAtual) {
  if (!precoAtual || precoAtual <= 0) return 0;

  const agora = new Date();
  const umAnoAtras = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000);

  const total12m = pagamentos
    .filter((p) => p.data >= umAnoAtras && p.data <= agora)
    .reduce((s, p) => s + p.valor, 0);

  return total12m / precoAtual;
}

function calcularCAGR(historicoCompleto) {
  const anoCorrente = new Date().getFullYear();
  const anosFechados = historicoCompleto.filter((h) => h.ano < anoCorrente);

  if (anosFechados.length < 2) {
    return { cagr: 0, temGap: false, anosUsados: 0 };
  }

  const janela = anosFechados.slice(-5);
  const temGap = janela.some((h) => h.total === 0);
  const validos = janela.filter((h) => h.total > 0);

  if (validos.length < 2) {
    return { cagr: 0, temGap, anosUsados: validos.length };
  }

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

  const completos = historicoCompleto.filter(
    (h) => h.ano < anoCorrente && h.total > 0
  );

  if (completos.length < 3) {
    return { estabilidade: 0, r2: 0, tendencia: "indefinida", slope: 0 };
  }

  const janela = completos.slice(-5);
  const x = janela.map((h) => h.ano);
  const y = janela.map((h) => h.total);

  const { slope, intercept, r2 } = regressaoLinear(x, y);

  const residuos = y.map((valor, i) => {
    const esperado = slope * x[i] + intercept;
    return valor - esperado;
  });

  const mediaY = media(y);

  if (mediaY === 0) {
    return { estabilidade: 0, r2: 0, tendencia: "indefinida", slope: 0 };
  }

  const dpResiduos = desvioPadrao(residuos);
  const cvResiduos = dpResiduos / Math.abs(mediaY);

  let estabilidade = clamp(1 - cvResiduos, 0, 1);

  if (r2 > 0.7) {
    estabilidade = clamp(estabilidade + (r2 - 0.7) * 0.5, 0, 1);
  }

  const slopeRelativo = slope / mediaY;

  let tendencia = "estavel";
  if (slopeRelativo > 0.05) tendencia = "crescente";
  else if (slopeRelativo < -0.05) tendencia = "queda";

  return { estabilidade, r2, tendencia, slope };
}

function anosConsecutivos(historicoCompleto) {
  const anoCorrente = new Date().getFullYear();

  const completos = historicoCompleto.filter(
    (h) => h.ano < anoCorrente && h.total > 0
  );

  if (!completos.length) return 0;

  let consecutivos = 1;

  for (let i = completos.length - 1; i > 0; i--) {
    if (completos[i].ano - completos[i - 1].ano === 1) {
      consecutivos++;
    } else {
      break;
    }
  }

  return consecutivos;
}

function calcularEstatisticasHistorico(historicoCompleto) {
  const anoCorrente = new Date().getFullYear();

  const pagos = historicoCompleto.filter(
    (h) => h.ano < anoCorrente && h.total > 0
  );

  if (!pagos.length) {
    return {
      anoInicio: null,
      anosConsec: 0,
      anosTotaisPagos: 0,
      temGaps: false,
      qtdGaps: 0,
      mediaAnual5y: 0,
      ultimoAnoPago: null,
    };
  }

  const anosFechados = historicoCompleto.filter((h) => h.ano < anoCorrente);
  const qtdGaps = anosFechados.filter((h) => h.total === 0).length;
  const ultimos5Validos = pagos.slice(-5);

  return {
    anoInicio: pagos[0].ano,
    anosConsec: anosConsecutivos(historicoCompleto),
    anosTotaisPagos: pagos.length,
    temGaps: qtdGaps > 0,
    qtdGaps,
    mediaAnual5y: media(ultimos5Validos.map((h) => h.total)),
    ultimoAnoPago: pagos[pagos.length - 1].ano,
  };
}

function detectarFrequencia(historicoCompleto, ehFII) {
  const anoCorrente = new Date().getFullYear();

  const pagos = historicoCompleto.filter(
    (h) => h.ano < anoCorrente && h.total > 0
  );

  if (!pagos.length) {
    return { label: "indefinida", media: 0 };
  }

  const ultimos3 = pagos.slice(-3);
  const mediaPagamentos = media(ultimos3.map((h) => h.qtdPagamentos));

  if (ehFII && mediaPagamentos >= 9) {
    return { label: "mensal", media: mediaPagamentos };
  }

  if (mediaPagamentos >= 10) return { label: "mensal", media: mediaPagamentos };
  if (mediaPagamentos >= 5) return { label: "bimestral", media: mediaPagamentos };
  if (mediaPagamentos >= 3) return { label: "trimestral", media: mediaPagamentos };
  if (mediaPagamentos >= 1.5) return { label: "semestral", media: mediaPagamentos };

  return { label: "anual", media: mediaPagamentos };
}

function proximosPagamentos(pagamentos) {
  const agora = new Date();

  return pagamentos
    .filter((p) => p.data > agora && p.valor >= 0.01)
    .sort((a, b) => a.data - b.data)
    .slice(0, 3)
    .map((p) => ({
      data: p.data.toISOString(),
      dataCom: p.dataCom ? p.dataCom.toISOString() : null,
      valor: p.valor,
      tipo: p.tipo,
      dataComJaPassou: p.dataCom ? p.dataCom < agora : null,
    }));
}

function calcularComposicao12m(pagamentos) {
  const agora = new Date();
  const umAnoAtras = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000);

  const ultimos12m = pagamentos.filter(
    (p) => p.data >= umAnoAtras && p.data <= agora
  );

  const total = ultimos12m.reduce((s, p) => s + p.valor, 0);
  const dividendo = ultimos12m
    .filter((p) => p.tipo === "DIVIDENDO")
    .reduce((s, p) => s + p.valor, 0);
  const jcp = ultimos12m
    .filter((p) => p.tipo === "JCP")
    .reduce((s, p) => s + p.valor, 0);
  const rendimento = ultimos12m
    .filter((p) => p.tipo === "RENDIMENTO")
    .reduce((s, p) => s + p.valor, 0);

  return {
    total,
    dividendo,
    jcp,
    rendimento,
    pctDividendo: total > 0 ? dividendo / total : 0,
    pctJcp: total > 0 ? jcp / total : 0,
    pctRendimento: total > 0 ? rendimento / total : 0,
  };
}

function calcularBonusPatamar(historicoCompleto) {
  const anoCorrente = new Date().getFullYear();

  const pagos = historicoCompleto.filter(
    (h) => h.ano < anoCorrente && h.total > 0
  );

  if (pagos.length < 3) return 0;

  const ultimos3 = pagos.slice(-3).map((h) => h.total);
  const m = media(ultimos3);

  if (m === 0) return 0;

  const cv = desvioPadrao(ultimos3) / m;

  if (cv < 0.1) return 5;
  if (cv < 0.2) return 3;

  return 0;
}

// ============================================================
// CLASSIFICAÇÕES E PERFIS
// ============================================================

function detectarArmadilha({ dy12m, cagr, estabilidade, tendencia }) {
  if (dy12m >= 0.12 && (cagr < -0.08 || estabilidade < 0.35)) {
    return {
      risco: true,
      nivel: "alto",
      motivo: "yield elevado acompanhado de deterioração histórica",
    };
  }

  if (dy12m >= 0.08 && estabilidade < 0.45) {
    return {
      risco: true,
      nivel: "moderado",
      motivo: "pagamentos inconsistentes apesar do yield alto",
    };
  }

  if (tendencia === "queda" && cagr < -0.05) {
    return {
      risco: true,
      nivel: "moderado",
      motivo: "histórico recente mostra enfraquecimento dos dividendos",
    };
  }

  return { risco: false, nivel: "baixo", motivo: null };
}

function perfilRenda({ dy12m, cagr, estabilidade, ehFII }) {
  if (dy12m >= 0.08 && estabilidade >= 0.6) {
    return {
      label: "RENDA FORTE",
      desc: "foco maior em geração de renda recorrente",
    };
  }

  if (cagr >= 0.12 && estabilidade >= 0.55) {
    return {
      label: "DIVIDEND GROWTH",
      desc: "crescimento consistente dos proventos",
    };
  }

  if (!ehFII && dy12m < 0.03 && cagr >= 0.15) {
    return {
      label: "REINVESTIMENTO / GROWTH",
      desc: "empresa tende a reinvestir mais os lucros",
    };
  }

  return {
    label: "RENDA MODERADA",
    desc: "equilíbrio entre distribuição e reinvestimento",
  };
}

function calcularScores({
  dy12m,
  cagr,
  estabilidade,
  anosConsec,
  bonusPatamar,
  temGap,
  qtdGaps,
  armadilha,
  ehFII,
}) {
  // YIELD
  let scoreYield;
  if (dy12m >= 0.12) scoreYield = 90;
  else if (dy12m >= 0.08) scoreYield = 78;
  else if (dy12m >= 0.05) scoreYield = 65;
  else if (dy12m >= 0.03) scoreYield = 52;
  else if (dy12m >= 0.01) scoreYield = 35;
  else scoreYield = 15;

  // CRESCIMENTO
  const cagrLimitado = Math.min(cagr, 0.3);

  let scoreCrescimento;
  if (cagrLimitado >= 0.15) scoreCrescimento = 92;
  else if (cagrLimitado >= 0.08) scoreCrescimento = 78;
  else if (cagrLimitado >= 0.03) scoreCrescimento = 64;
  else if (cagrLimitado >= 0) scoreCrescimento = 52;
  else if (cagrLimitado >= -0.1) scoreCrescimento = 36;
  else scoreCrescimento = 18;

  if (temGap) {
    scoreCrescimento -= Math.min(qtdGaps * 3, 10);
  }

  // PREVISIBILIDADE
  const scoreEstabilidade = estabilidade * 100;
  const scoreAnos = ehFII
    ? clamp(anosConsec * 4.5, 0, 100)
    : clamp(anosConsec * 5, 0, 100);

  const scorePrevisibilidade = scoreEstabilidade * 0.65 + scoreAnos * 0.35;

  // SUSTENTABILIDADE
  let scoreSustentabilidade = 70;

  if (armadilha.risco) {
    if (armadilha.nivel === "alto") scoreSustentabilidade -= 35;
    else scoreSustentabilidade -= 18;
  }

  if (cagr < -0.1) scoreSustentabilidade -= 15;
  if (estabilidade < 0.35) scoreSustentabilidade -= 15;
  if (temGap) scoreSustentabilidade -= Math.min(qtdGaps * 4, 15);

  scoreSustentabilidade = clamp(scoreSustentabilidade, 0, 100);

  // SCORE FINAL
  const scoreBase =
    scoreYield * 0.25 +
    scoreCrescimento * 0.35 +
    scorePrevisibilidade * 0.25 +
    scoreSustentabilidade * 0.15;

  const final = Math.round(clamp(scoreBase + bonusPatamar, 0, 100));

  return {
    final,
    yield: Math.round(scoreYield),
    crescimento: Math.round(clamp(scoreCrescimento, 0, 100)),
    previsibilidade: Math.round(clamp(scorePrevisibilidade, 0, 100)),
    sustentabilidade: Math.round(scoreSustentabilidade),
    bonusPatamar,
  };
}

function classificarPagadora({
  score,
  anosConsec,
  estabilidade,
  cagr,
  temGap,
  dy12m,
}) {
  if (
    score >= 82 &&
    anosConsec >= 15 &&
    estabilidade >= 0.7 &&
    dy12m >= 0.04 &&
    !temGap
  ) {
    return {
      label: "ARISTOCRATA",
      cor: "verde",
      desc: "histórico longo e previsível de distribuição",
    };
  }

  if (score >= 72 && estabilidade >= 0.58 && !temGap) {
    return {
      label: "PAGADORA CONSISTENTE",
      cor: "verde",
      desc: "boa previsibilidade de dividendos",
    };
  }

  if (cagr >= 0.08 && estabilidade >= 0.5) {
    return {
      label: "DIVIDEND GROWTH",
      cor: "amarelo",
      desc: "trajetória de crescimento dos proventos",
    };
  }

  if (anosConsec >= 5 && estabilidade < 0.45) {
    return {
      label: "PAGADORA CÍCLICA",
      cor: "laranja",
      desc: "histórico mais volátil de distribuição",
    };
  }

  if (score >= 35) {
    return {
      label: "PAGADORA IRREGULAR",
      cor: "laranja",
      desc: temGap ? "histórico possui lacunas" : "pagamentos pouco previsíveis",
    };
  }

  return {
    label: "BAIXA RELEVÂNCIA EM DIVIDENDOS",
    cor: "vermelho",
    desc: "proventos pouco representativos",
  };
}

function classificarYield(dy12m) {
  if (dy12m >= 0.1) return { label: "muito alto", cor: "verde" };
  if (dy12m >= 0.06) return { label: "alto", cor: "verde" };
  if (dy12m >= 0.04) return { label: "moderado", cor: "amarelo" };
  if (dy12m >= 0.02) return { label: "baixo", cor: "laranja" };
  return { label: "muito baixo", cor: "vermelho" };
}

function classificarCrescimento(cagr) {
  if (cagr >= 0.15) return { label: "acelerado", cor: "verde" };
  if (cagr >= 0.05) return { label: "saudável", cor: "verde" };
  if (cagr >= 0) return { label: "estável", cor: "amarelo" };
  if (cagr >= -0.1) return { label: "em queda", cor: "laranja" };
  return { label: "forte deterioração", cor: "vermelho" };
}

// ============================================================
// LEITURA NARRATIVA
// ============================================================

function gerarLeituraPrincipal({ armadilha, classificacao, perfil, temGap }) {
  if (armadilha.risco && armadilha.nivel === "alto") {
    return "Apesar do dividend yield elevado, o histórico mostra deterioração relevante na previsibilidade e consistência dos pagamentos, aumentando o risco de armadilha de dividendos.";
  }

  if (classificacao.label === "ARISTOCRATA") {
    return "A empresa apresenta um histórico longo e previsível de distribuição, perfil normalmente associado a ativos maduros e com foco consistente em remuneração ao acionista.";
  }

  if (perfil.label === "DIVIDEND GROWTH") {
    return "O histórico mostra crescimento relativamente consistente dos dividendos ao longo do tempo, indicando evolução da capacidade de distribuição.";
  }

  if (perfil.label === "RENDA FORTE") {
    return "O ativo combina yield elevado com um histórico relativamente estável de distribuição, característica comum em ativos voltados para geração de renda.";
  }

  if (temGap) {
    return "O histórico possui interrupções ou períodos sem distribuição, reduzindo a previsibilidade futura dos proventos.";
  }

  return "A empresa possui perfil intermediário de dividendos, com equilíbrio entre distribuição e reinvestimento.";
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const ticker = (searchParams.get("ticker") || "").trim().toUpperCase();

    if (!ticker) {
      return NextResponse.json(
        { error: "Ticker não informado" },
        { status: 400 }
      );
    }

    const ehFII = ticker.endsWith("11");

    const ativo = await buscarDadosBrapi(ticker);

    // CORREÇÃO PRINCIPAL: cashDividends agora vive dentro de dividendsData
    const cashDividends = extrairCashDividends(ativo);

    const pagamentos = normalizarPagamentos(cashDividends);

    const historicoBruto = agruparPorAno(pagamentos);
    const historicoCompleto = preencherAnosFaltantes(historicoBruto);

    const precoAtual =
      Number(ativo.regularMarketPrice) || Number(ativo.price) || 0;

    const dy12m = calcularDY12m(pagamentos, precoAtual);

    const { cagr, temGap, anosUsados } = calcularCAGR(historicoCompleto);

    const { estabilidade, r2, tendencia, slope } =
      calcularEstabilidadeDirecional(historicoCompleto);

    const stats = calcularEstatisticasHistorico(historicoCompleto);
    const freq = detectarFrequencia(historicoCompleto, ehFII);
    const bonusPatamar = calcularBonusPatamar(historicoCompleto);

    const armadilha = detectarArmadilha({ dy12m, cagr, estabilidade, tendencia });

    const perfil = perfilRenda({ dy12m, cagr, estabilidade, ehFII });

    const scores = calcularScores({
      dy12m,
      cagr,
      estabilidade,
      anosConsec: stats.anosConsec,
      bonusPatamar,
      temGap,
      qtdGaps: stats.qtdGaps,
      armadilha,
      ehFII,
    });

    const classificacao = classificarPagadora({
      score: scores.final,
      anosConsec: stats.anosConsec,
      estabilidade,
      cagr,
      temGap,
      dy12m,
    });

    const yieldClass = classificarYield(dy12m);
    const crescimentoClass = classificarCrescimento(cagr);

    const composicao = calcularComposicao12m(pagamentos);
    const proximos = proximosPagamentos(pagamentos);

    const leituraPrincipal = gerarLeituraPrincipal({
      armadilha,
      classificacao,
      perfil,
      temGap,
    });

    return NextResponse.json({
      ticker,
      empresa: ativo.longName || ativo.shortName || ticker,
      setor: ativo.sector || ativo.sectorDisp || "—",
      precoAtual,
      ehFII,

      scoreFinal: scores.final,

      scoreDividendos: {
        final: scores.final,
        yield: scores.yield,
        crescimento: scores.crescimento,
        previsibilidade: scores.previsibilidade,
        sustentabilidade: scores.sustentabilidade,
        bonusPatamar: scores.bonusPatamar,
      },

      perfilRenda: perfil,
      classificacao,
      armadilhaDividendos: armadilha,

      metricas: {
        dy12m,
        cagrDividendos: cagr,
        estabilidade,
        r2Linearidade: r2,
        tendencia,
        slope,
        anosConsecutivos: stats.anosConsec,
        anosPagando: stats.anosTotaisPagos,
        anoInicio: stats.anoInicio,
        mediaAnual5y: stats.mediaAnual5y,
        gaps: stats.qtdGaps,
        frequencia: freq.label,
        mediaPagamentosAno: freq.media,
        payoutQualitativo: armadilha.risco
          ? "pressionado"
          : estabilidade >= 0.6
          ? "saudável"
          : "moderado",
      },

      classificacoes: {
        yield: yieldClass,
        crescimento: crescimentoClass,
      },

      composicao12m: composicao,
      proximosPagamentos: proximos,

      leitura: {
        principal: leituraPrincipal,
        resumo: classificacao.desc,
        perfil: perfil.desc,
      },

      historico: historicoCompleto,
      pagamentosRecentes: pagamentos.slice(0, 24),

      metadata: {
        fonte: "Brapi",
        atualizadoEm: new Date().toISOString(),
        anosUsadosCAGR: anosUsados,
        qtdPagamentosBrutos: cashDividends.length,
      },
    });
  } catch (error) {
    console.error("Erro rota dividendos:", error);

    return NextResponse.json(
      {
        error: "Erro ao gerar análise de dividendos",
        detalhe: error.message,
      },
      { status: 500 }
    );
  }
}
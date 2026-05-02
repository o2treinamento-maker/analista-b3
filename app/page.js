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

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [textoCompleto, setTextoCompleto] = useState("");
  const [secoes, setSecoes] = useState([]);
  const [secoesVisiveis, setSecoesVisiveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState(`ex: ${EXEMPLOS[0]}`);
  const msgInterval = useRef(null);

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

  async function buscarAnalise(e) {
    e.preventDefault();
    if (!ticker.trim()) return;
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
        body: JSON.stringify({ ticker: ticker.trim() }),
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
    } catch (err) {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  const mdComponents = (isFinal, isComprar, isVender) => ({
    h1: ({children}) => <h1 className="text-2xl font-bold text-white border-b border-gray-700 pb-2 mb-4">{children}</h1>,
    h2: ({children}) => <h2 className={`text-xl font-bold mb-4 ${isFinal ? (isComprar ? "text-green-400" : isVender ? "text-red-400" : "text-yellow-400") : "text-green-400"}`}>{children}</h2>,
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
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">

          {/* TAGS DE ATIVOS */}
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

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center gap-2"><span className="text-green-400">✓</span> Acesso liberado</span>
            <span className="flex items-center gap-2"><span className="text-green-400">⚡</span> Sem cadastro</span>
            <span className="flex items-center gap-2"><span className="text-green-400">🕐</span> Resultado imediato</span>
          </div>
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
                <p key={msgIndex} className="text-green-400 text-sm font-medium">
                  {MENSAGENS_LOADING[msgIndex]}
                </p>
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

      {/* RESULTADO POR SEÇÕES */}
      {secoes.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 md:px-6 pb-16 space-y-4">
          {secoes.map((secao, i) => {
            const isFinal = secao.includes("RECOMENDAÇÃO FINAL") || secao.includes("RECOMENDACAO FINAL");
            const textoUpper = secao.toUpperCase();
            const isComprar = isFinal && (textoUpper.includes("COMPRAR") || textoUpper.includes("COMPRA"));
            const isVender = isFinal && (textoUpper.includes("VENDER") || textoUpper.includes("VENDA"));
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
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents(isFinal, isComprar, isVender)}>
                  {secao}
                </ReactMarkdown>
              </div>
            );
          })}
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
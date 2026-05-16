"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { TODOS_OS_ATIVOS } from "@/lib/tickers";
import { useWatchlist } from "@/hooks/useWatchlist";
import CardFluxo from "@/components/CardFluxo";
import CardQuant from "@/components/CardQuant";
import CardFundamentalista from "@/components/CardFundamentalista";
import CardDividendos from "@/components/CardDividendos";
import CardGraficoCarteira from "@/components/CardGraficoCarteira";
import RelatorioCarteira from "@/components/RelatorioCarteira";
import CardMestres from "@/components/CardMestres";
import CardRobos from "@/components/CardRobos";

const GREEN = "#34d399";
const RED = "#f87171";
const YELLOW = "#fbbf24";
const GOLD = "#fbbf24"; // 🎓 cor temática dos mestres
const PURPLE = "#a855f7"; // 🤖 cor temática dos robôs

export default function CarteiraPage() {
  const router = useRouter();

  // ─── Watchlist via hook ────────────────────────────────────────────────
  const {
    tickers: watchlist,
    loading: loadingWatchlist,
    adicionando,
    removendo,
    erro: erroWatchlist,
    user,
    adicionar,
    remover,
  } = useWatchlist();

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [tickerInput, setTickerInput] = useState("");
  const [tickerSelecionado, setTickerSelecionado] = useState("");
  const [horaAtual, setHoraAtual] = useState("");
  const [abaAtiva, setAbaAtiva] = useState("fluxo");

  // Validação / autocomplete
  const [erroLocal, setErroLocal] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const sugestoesRef = useRef(null);

  // Lazy load das abas
  const [abasJaAbertas, setAbasJaAbertas] = useState(new Set(["fluxo"]));

  // Cotação
  const [cotacao, setCotacao] = useState(null);
  const [loadingCotacao, setLoadingCotacao] = useState(false);

  // Responsividade
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarAberta, setSidebarAberta] = useState(false);

  // Erro consolidado (hook ou local)
  const erroTicker = erroLocal || erroWatchlist;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fecha sugestões ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (sugestoesRef.current && !sugestoesRef.current.contains(e.target)) {
        setMostrarSugestoes(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    function atualizarHora() {
      setHoraAtual(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }
    atualizarHora();
    const interval = setInterval(atualizarHora, 60000);
    return () => clearInterval(interval);
  }, []);

  // Redireciona se não tiver usuário (depois que o hook carregar)
  useEffect(() => {
    if (!loadingWatchlist && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      setLoadingAuth(false);
    }
  }, [user, loadingWatchlist, router]);

  // Quando a watchlist carregar, seleciona o primeiro ticker (ou PETR4 default)
  useEffect(() => {
    if (loadingWatchlist) return;

    if (watchlist.length > 0) {
      // Se o atual não está mais na lista, troca pelo primeiro
      if (!tickerSelecionado || !watchlist.includes(tickerSelecionado)) {
        setTickerSelecionado(watchlist[0]);
      }
    } else if (!tickerSelecionado) {
      // Lista vazia — default PETR4 só pra mostrar algo
      setTickerSelecionado("PETR4");
    }
  }, [watchlist, loadingWatchlist, tickerSelecionado]);

  // Busca cotação na Brapi
  useEffect(() => {
    if (!tickerSelecionado) {
      setCotacao(null);
      return;
    }

    setLoadingCotacao(true);
    setCotacao(null);

    const token = process.env.NEXT_PUBLIC_BRAPI_TOKEN || "";
    const url = `https://brapi.dev/api/quote/${tickerSelecionado}?token=${token}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        const ativo = data?.results?.[0];
        if (ativo) {
          setCotacao({
            preco: ativo.regularMarketPrice ?? null,
            variacao: ativo.regularMarketChangePercent ?? null,
            nome: ativo.longName || ativo.shortName || "",
            moeda: ativo.currency || "BRL",
          });
        }
        setLoadingCotacao(false);
      })
      .catch((err) => {
        console.error("Erro Brapi:", err);
        setLoadingCotacao(false);
      });
  }, [tickerSelecionado]);

  function selecionarAba(id) {
    setAbaAtiva(id);
    setAbasJaAbertas((prev) => {
      if (prev.has(id)) return prev;
      const novo = new Set(prev);
      novo.add(id);
      return novo;
    });
  }

  // ─── Filtra sugestões enquanto digita ──────────────────────────────────────
  function handleInputChange(e) {
    const value = e.target.value.toUpperCase();
    setTickerInput(value);
    setErroLocal("");

    if (!value) {
      setSugestoes([]);
      setMostrarSugestoes(false);
      return;
    }

    const filtradas = TODOS_OS_ATIVOS.filter(
      (a) =>
        a.ticker.includes(value) ||
        a.nome.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 6);

    setSugestoes(filtradas);
    setMostrarSugestoes(filtradas.length > 0);
  }

  function escolherSugestao(ticker) {
    setTickerInput(ticker);
    setMostrarSugestoes(false);
    setSugestoes([]);
  }

  async function adicionarTicker(e) {
    e.preventDefault();

    const ticker = tickerInput.trim().toUpperCase();
    if (!ticker) return;

    setErroLocal("");
    setMostrarSugestoes(false);

    // Se já está na carteira, só seleciona e fecha
    if (watchlist.includes(ticker)) {
      setTickerSelecionado(ticker);
      setTickerInput("");
      if (isMobile) setSidebarAberta(false);
      return;
    }

    // Usa o hook (ele valida ticker, checa duplicata, insere e atualiza estado)
    const resultado = await adicionar(ticker);

    if (resultado.ok) {
      setTickerSelecionado(ticker);
      setTickerInput("");
      if (isMobile) setSidebarAberta(false);
    }
    // Se deu erro, o próprio hook já setou erroWatchlist
  }

  async function removerTicker(ticker) {
    const resultado = await remover(ticker);

    if (resultado.ok) {
      // Se removeu o que estava selecionado, troca pro próximo
      if (tickerSelecionado === ticker) {
        const novaLista = watchlist.filter((t) => t !== ticker);
        setTickerSelecionado(novaLista[0] || "");
      }
    }
  }

  function selecionarTicker(ticker) {
    setTickerSelecionado(ticker);
    if (isMobile) setSidebarAberta(false);
  }

  function formatarMoeda(valor, moeda = "BRL") {
    if (valor == null) return "—";
    const prefixo = moeda === "USD" ? "US$" : "R$";
    return `${prefixo} ${Number(valor).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function formatarVariacao(valor) {
    if (valor == null) return "—";
    const sinal = valor >= 0 ? "+" : "";
    return `${sinal}${Number(valor).toFixed(2).replace(".", ",")}%`;
  }

  const abas = [
    { id: "fluxo", titulo: "Fluxo", subtitulo: "Direção quantitativa", cor: YELLOW },
    { id: "quant", titulo: "Quant", subtitulo: "Score proprietário", cor: GREEN },
    { id: "fundamentalista", titulo: "Fundamentos", subtitulo: "Valor e eficiência", cor: GREEN },
    { id: "dividendos", titulo: "Dividendos", subtitulo: "Yield e histórico", cor: GREEN },
    { id: "mestres", titulo: "Mestres", subtitulo: "6 lendas humanas", cor: GOLD },
    { id: "robos", titulo: "Robôs", subtitulo: "6 engines quant", cor: PURPLE },
    { id: "relatorio", titulo: "Radar", subtitulo: "Notícias e consenso", cor: "#60a5fa" },
  ];

  if (loadingAuth || loadingWatchlist) {
    return (
      <main
        style={{
          height: "100vh",
          background: "#030712",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'IBM Plex Mono', monospace",
          letterSpacing: "0.16em",
          fontSize: "11px",
        }}
      >
        INICIANDO TERMINAL...
      </main>
    );
  }

  const variacaoCor =
    cotacao?.variacao == null
      ? "rgba(255,255,255,0.5)"
      : cotacao.variacao > 0
      ? GREEN
      : cotacao.variacao < 0
      ? RED
      : "rgba(255,255,255,0.5)";

  return (
    <main
      style={{
        height: "100vh",
        overflow: "hidden",
        background:
          "radial-gradient(circle at top left, rgba(52,211,153,0.09), transparent 26%), radial-gradient(circle at bottom right, rgba(59,130,246,0.06), transparent 28%), #030712",
        color: "#fff",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "220px minmax(0, 1fr)",
        fontSize: "13px",
        width: "100%",
      }}
    >
      {/* OVERLAY MOBILE */}
      {isMobile && sidebarAberta && (
        <div
          onClick={() => setSidebarAberta(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(4px)",
            zIndex: 998,
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(3,7,18,0.96)",
          backdropFilter: "blur(16px)",
          padding: "14px",
          position: isMobile ? "fixed" : "static",
          top: 0,
          left: 0,
          width: isMobile ? "240px" : "auto",
          transform: isMobile
            ? sidebarAberta
              ? "translateX(0)"
              : "translateX(-100%)"
            : "none",
          transition: "transform 0.25s ease",
          zIndex: 999,
        }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            color: GREEN,
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "4px",
          }}
        >
          Mesa Quant
        </div>

        <h1
          style={{
            fontSize: "20px",
            fontWeight: 800,
            margin: "0 0 14px",
            letterSpacing: "-0.05em",
          }}
        >
          Watchlist
        </h1>

        <div ref={sugestoesRef} style={{ position: "relative", marginBottom: "14px" }}>
          <form
            onSubmit={adicionarTicker}
            style={{ display: "flex", gap: "6px" }}
          >
            <input
              value={tickerInput}
              onChange={handleInputChange}
              onFocus={() => {
                if (sugestoes.length > 0) setMostrarSugestoes(true);
              }}
              placeholder="Digite um ticker..."
              disabled={adicionando}
              style={{
                flex: 1,
                minWidth: 0,
                background: "rgba(255,255,255,0.045)",
                border: erroTicker
                  ? "1px solid rgba(248,113,113,0.5)"
                  : "1px solid rgba(255,255,255,0.10)",
                borderRadius: "9px",
                padding: "8px 10px",
                color: "#fff",
                outline: "none",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "12px",
                fontWeight: 700,
                opacity: adicionando ? 0.6 : 1,
              }}
            />

            <button
              type="submit"
              disabled={adicionando}
              style={{
                width: "36px",
                borderRadius: "9px",
                border: "1px solid rgba(52,211,153,0.35)",
                background: "rgba(52,211,153,0.12)",
                color: GREEN,
                fontSize: "16px",
                cursor: adicionando ? "not-allowed" : "pointer",
                opacity: adicionando ? 0.5 : 1,
              }}
            >
              {adicionando ? "…" : "+"}
            </button>
          </form>

          {/* SUGESTÕES DE AUTOCOMPLETE */}
          {mostrarSugestoes && sugestoes.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                background: "rgba(4,7,18,0.99)",
                border: "1px solid rgba(52,211,153,0.25)",
                borderRadius: "9px",
                overflow: "hidden",
                zIndex: 1000,
                boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
                backdropFilter: "blur(20px)",
              }}
            >
              {sugestoes.map((ativo) => (
                <div
                  key={ativo.ticker}
                  onClick={() => escolherSugestao(ativo.ticker)}
                  style={{
                    padding: "8px 10px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(52,211,153,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "12px",
                      fontWeight: 800,
                      color: GREEN,
                    }}
                  >
                    {ativo.ticker}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.45)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {ativo.nome}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* MENSAGEM DE ERRO */}
          {erroTicker && (
            <div
              style={{
                marginTop: "8px",
                padding: "7px 10px",
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.25)",
                borderRadius: "7px",
                color: "#f87171",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              {erroTicker}
            </div>
          )}
        </div>

        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            color: "rgba(255,255,255,0.32)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          {watchlist.length} ativos
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          {watchlist.map((ticker, idx) => {
            const ativo = tickerSelecionado === ticker;
            const sendoRemovido = removendo === ticker;

            return (
              <div
                key={`${ticker}-${idx}`}
                onClick={() => !sendoRemovido && selecionarTicker(ticker)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "10px",
                  cursor: sendoRemovido ? "wait" : "pointer",
                  background: ativo
                    ? "linear-gradient(135deg, rgba(52,211,153,0.13), rgba(52,211,153,0.04))"
                    : "rgba(255,255,255,0.035)",
                  border: ativo
                    ? "1px solid rgba(52,211,153,0.38)"
                    : "1px solid rgba(255,255,255,0.07)",
                  boxShadow: ativo ? "0 0 22px rgba(52,211,153,0.09)" : "none",
                  transition: "all 0.2s ease",
                  opacity: sendoRemovido ? 0.4 : 1,
                }}
              >
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: ativo ? GREEN : "rgba(255,255,255,0.78)",
                  }}
                >
                  {ticker}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removerTicker(ticker);
                  }}
                  disabled={sendoRemovido}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "rgba(255,255,255,0.35)",
                    cursor: sendoRemovido ? "wait" : "pointer",
                    fontSize: "14px",
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <section
        style={{
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          padding: isMobile ? "8px" : "10px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto",
            minWidth: 0,
          }}
        >
          {/* TOPBAR */}
          <div
            style={{
              marginBottom: "10px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(4,8,20,0.85)",
              backdropFilter: "blur(14px)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "6px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "9px",
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isMobile && (
                  <button
                    onClick={() => setSidebarAberta(true)}
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "6px",
                      border: "1px solid rgba(52,211,153,0.25)",
                      background: "rgba(52,211,153,0.08)",
                      color: GREEN,
                      fontSize: "13px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                    aria-label="Abrir watchlist"
                  >
                    ☰
                  </button>
                )}
                <span style={{ color: GREEN, fontWeight: 800 }}>
                  ● Terminal Quant
                </span>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <span>{watchlist.length} ativos</span>
                <span>{horaAtual}</span>
              </div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "10px",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "22px",
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {tickerSelecionado || "—"}
                </span>

                {cotacao?.nome && (
                  <span
                    style={{
                      fontSize: "11px",
                      color: "rgba(255,255,255,0.45)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      minWidth: 0,
                    }}
                  >
                    {cotacao.nome}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: "10px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: 900,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {loadingCotacao
                    ? "..."
                    : cotacao?.preco != null
                    ? formatarMoeda(cotacao.preco, cotacao.moeda)
                    : "—"}
                </span>

                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 800,
                    color: variacaoCor,
                  }}
                >
                  {loadingCotacao
                    ? ""
                    : cotacao?.variacao != null
                    ? formatarVariacao(cotacao.variacao)
                    : ""}
                </span>
              </div>
            </div>
          </div>

          {/* ABAS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "repeat(2, 1fr)"
                : "repeat(7, minmax(0, 1fr))",
              gap: "9px",
              marginBottom: "10px",
            }}
          >
            {abas.map((aba) => {
              const ativa = abaAtiva === aba.id;

              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => selecionarAba(aba.id)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: "15px",
                    border: ativa
                      ? `1px solid ${aba.cor}`
                      : "1px solid rgba(255,255,255,0.08)",
                    background: ativa
                      ? "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(255,255,255,0.03))"
                      : "rgba(4,8,20,0.70)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: ativa
                      ? "0 0 20px rgba(52,211,153,0.09)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                      marginBottom: "6px",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "10px",
                        fontWeight: 900,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: ativa ? aba.cor : "rgba(255,255,255,0.55)",
                      }}
                    >
                      {aba.titulo}
                    </div>

                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: aba.cor,
                        boxShadow: `0 0 10px ${aba.cor}`,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.38)",
                    }}
                  >
                    {aba.subtitulo}
                  </div>
                </button>
              );
            })}
          </div>

          {/* CONTEÚDO DAS ABAS */}
          {tickerSelecionado ? (
            <div
              style={{
                width: "100%",
                minWidth: 0,
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {abasJaAbertas.has("fluxo") && (
                <div style={{ display: abaAtiva === "fluxo" ? "block" : "none" }}>
                  <CardGraficoCarteira ticker={tickerSelecionado} />
                </div>
              )}

              {abasJaAbertas.has("quant") && (
                <div style={{ display: abaAtiva === "quant" ? "block" : "none" }}>
                  <CardQuant ticker={tickerSelecionado} />
                </div>
              )}

              {abasJaAbertas.has("fundamentalista") && (
                <div
                  style={{
                    display: abaAtiva === "fundamentalista" ? "block" : "none",
                  }}
                >
                  <CardFundamentalista ticker={tickerSelecionado} />
                </div>
              )}

              {abasJaAbertas.has("dividendos") && (
                <div
                  style={{
                    display: abaAtiva === "dividendos" ? "block" : "none",
                  }}
                >
                  <CardDividendos ticker={tickerSelecionado} />
                </div>
              )}

              {abasJaAbertas.has("mestres") && (
                <div
                  style={{
                    display: abaAtiva === "mestres" ? "block" : "none",
                  }}
                >
                  <CardMestres ticker={tickerSelecionado} />
                </div>
              )}

              {abasJaAbertas.has("robos") && (
                <div
                  style={{
                    display: abaAtiva === "robos" ? "block" : "none",
                  }}
                >
                  <CardRobos ticker={tickerSelecionado} />
                </div>
              )}

              {abasJaAbertas.has("relatorio") && (
                <div
                  style={{
                    display: abaAtiva === "relatorio" ? "block" : "none",
                  }}
                >
                  <RelatorioCarteira ticker={tickerSelecionado} />
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "24px",
                color: "rgba(255,255,255,0.45)",
                textAlign: "center",
              }}
            >
              Adicione um ticker para visualizar a análise.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
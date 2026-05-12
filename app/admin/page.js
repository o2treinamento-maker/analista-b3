"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

const PERIODOS = [
  { id: "1", label: "HOJE", dias: 1 },
  { id: "7", label: "7D", dias: 7 },
  { id: "30", label: "30D", dias: 30 },
  { id: "90", label: "90D", dias: 90 },
  { id: "all", label: "TUDO", dias: null },
];

const FILTROS_PLANO = [
  { id: "todos", label: "TODOS" },
  { id: "free", label: "FREE" },
  { id: "premium", label: "PREMIUM" },
];

const COLUNAS = [
  { id: "email", label: "EMAIL", ordenavel: true },
  { id: "plano", label: "PLANO", ordenavel: true },
  { id: "total_analises", label: "ANÁLISES", ordenavel: true },
  { id: "consultas_usadas", label: "USADAS HOJE", ordenavel: true },
  { id: "limite_consultas", label: "LIMITE", ordenavel: true },
  { id: "created_at", label: "CRIADO", ordenavel: true },
  { id: "acoes", label: "AÇÕES", ordenavel: false },
];

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [autorizado, setAutorizado] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [topTickers, setTopTickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acaoLoading, setAcaoLoading] = useState(null);
  const [periodo, setPeriodo] = useState("7");
  const [busca, setBusca] = useState("");
  const [filtroPlano, setFiltroPlano] = useState("todos");
  const [ordenacao, setOrdenacao] = useState({ coluna: "created_at", direcao: "desc" });

  useEffect(() => {
    verificarAcesso();
  }, []);

  useEffect(() => {
    if (autorizado) carregarDados();
  }, [periodo, autorizado]);

  async function verificarAcesso() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (!user || user.email !== ADMIN_EMAIL) {
      setAutorizado(false);
      return;
    }
    setAutorizado(true);
  }

  function getDataInicio() {
    const p = PERIODOS.find(p => p.id === periodo);
    if (!p || !p.dias) return null;
    return new Date(Date.now() - p.dias * 24 * 60 * 60 * 1000).toISOString();
  }

  function getDataInicioAnterior() {
    const p = PERIODOS.find(p => p.id === periodo);
    if (!p || !p.dias) return null;
    return new Date(Date.now() - 2 * p.dias * 24 * 60 * 60 * 1000).toISOString();
  }

  async function carregarDados() {
    setLoading(true);

    const dataInicio = getDataInicio();
    const dataInicioAnterior = getDataInicioAnterior();
    const periodoLabel = PERIODOS.find(p => p.id === periodo)?.label || "";

    const { data: usuariosData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: contagens } = await supabase
      .from("historico_consultas")
      .select("user_id");

    const contagensPorUser = {};
    (contagens || []).forEach(c => {
      contagensPorUser[c.user_id] = (contagensPorUser[c.user_id] || 0) + 1;
    });

    const usuariosEnriquecidos = (usuariosData || []).map(u => ({
      ...u,
      total_analises: contagensPorUser[u.id] || 0,
    }));

    setUsuarios(usuariosEnriquecidos);

    let queryPeriodo = supabase
      .from("analises_publicas")
      .select("*", { count: "exact", head: true });
    if (dataInicio) queryPeriodo = queryPeriodo.gte("criado_em", dataInicio);
    const { count: analisesPeriodo } = await queryPeriodo;

    let analisesAnterior = 0;
    if (dataInicio && dataInicioAnterior) {
      const { count } = await supabase
        .from("analises_publicas")
        .select("*", { count: "exact", head: true })
        .gte("criado_em", dataInicioAnterior)
        .lt("criado_em", dataInicio);
      analisesAnterior = count || 0;
    }

    const { count: analisesHoje } = await supabase
      .from("analises_publicas")
      .select("*", { count: "exact", head: true })
      .gte("criado_em", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    let queryAnon = supabase
      .from("analises_publicas")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "anonimo");
    if (dataInicio) queryAnon = queryAnon.gte("criado_em", dataInicio);
    const { count: anonimos } = await queryAnon;

    const usuariosPremium = (usuariosData || []).filter(u => u.plano === "premium").length;

    // ────────────────────────────────────────────────
    // NOVOS USUÁRIOS no período + comparação com anterior
    // ────────────────────────────────────────────────
    let novosUsuarios = 0;
    if (dataInicio) {
      novosUsuarios = (usuariosData || []).filter(u =>
        u.created_at && new Date(u.created_at).toISOString() >= dataInicio
      ).length;
    } else {
      // Período "TUDO" = todos os usuários
      novosUsuarios = usuariosData?.length || 0;
    }

    let novosAnterior = 0;
    if (dataInicio && dataInicioAnterior) {
      novosAnterior = (usuariosData || []).filter(u => {
        if (!u.created_at) return false;
        const dt = new Date(u.created_at).toISOString();
        return dt >= dataInicioAnterior && dt < dataInicio;
      }).length;
    }

    let crescimentoNovos = null;
    if (novosAnterior > 0) {
      crescimentoNovos = Math.round(((novosUsuarios - novosAnterior) / novosAnterior) * 100);
    } else if (novosUsuarios > 0) {
      crescimentoNovos = 100;
    }
    // ────────────────────────────────────────────────

    let crescimento = null;
    if (analisesAnterior > 0) {
      crescimento = Math.round(((analisesPeriodo - analisesAnterior) / analisesAnterior) * 100);
    } else if (analisesPeriodo > 0) {
      crescimento = 100;
    }

    setMetricas({
      totalUsuarios: usuariosData?.length || 0,
      usuariosPremium,
      novosUsuarios,
      crescimentoNovos,
      analisesPeriodo: analisesPeriodo || 0,
      analisesHoje: analisesHoje || 0,
      anonimos: anonimos || 0,
      crescimento,
      periodoLabel,
    });

    let queryTickers = supabase.from("analises_publicas").select("ticker");
    if (dataInicio) queryTickers = queryTickers.gte("criado_em", dataInicio);
    const { data: tickersData } = await queryTickers;

    const contagemTickers = {};
    (tickersData || []).forEach(t => {
      contagemTickers[t.ticker] = (contagemTickers[t.ticker] || 0) + 1;
    });

    const topTickersList = Object.entries(contagemTickers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ticker, total]) => ({ ticker, total }));

    setTopTickers(topTickersList);
    setLoading(false);
  }

  async function tornarPremium(userId) {
    if (!confirm("Tornar este usuário Premium?")) return;
    setAcaoLoading(userId);
    await supabase.from("profiles").update({ plano: "premium", limite_consultas: 50 }).eq("id", userId);
    await carregarDados();
    setAcaoLoading(null);
  }

  async function removerPremium(userId) {
    if (!confirm("Voltar este usuário para o plano Free?")) return;
    setAcaoLoading(userId);
    await supabase.from("profiles").update({ plano: "free", limite_consultas: 3 }).eq("id", userId);
    await carregarDados();
    setAcaoLoading(null);
  }

  async function resetarLimite(userId) {
    if (!confirm("Resetar limite diário deste usuário?")) return;
    setAcaoLoading(userId);
    await supabase.from("profiles").update({ consultas_usadas: 0 }).eq("id", userId);
    await carregarDados();
    setAcaoLoading(null);
  }

  function trocarOrdenacao(coluna) {
    if (ordenacao.coluna === coluna) {
      setOrdenacao({ coluna, direcao: ordenacao.direcao === "asc" ? "desc" : "asc" });
    } else {
      setOrdenacao({ coluna, direcao: "desc" });
    }
  }

  const usuariosFiltrados = useMemo(() => {
    let lista = [...usuarios];

    if (busca.trim()) {
      const termo = busca.trim().toLowerCase();
      lista = lista.filter(u => (u.email || "").toLowerCase().includes(termo));
    }

    if (filtroPlano !== "todos") {
      lista = lista.filter(u => (u.plano || "free") === filtroPlano);
    }

    const { coluna, direcao } = ordenacao;
    lista.sort((a, b) => {
      let va = a[coluna];
      let vb = b[coluna];

      if (coluna === "created_at") {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      } else if (coluna === "plano") {
        va = (va || "free");
        vb = (vb || "free");
      } else if (typeof va === "string") {
        va = (va || "").toLowerCase();
        vb = (vb || "").toLowerCase();
      } else {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      }

      if (va < vb) return direcao === "asc" ? -1 : 1;
      if (va > vb) return direcao === "asc" ? 1 : -1;
      return 0;
    });

    return lista;
  }, [usuarios, busca, filtroPlano, ordenacao]);

  if (autorizado === null) {
    return (
      <div style={{minHeight:"100vh",background:"#040712",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace"}}>
        Verificando acesso...
      </div>
    );
  }

  if (!autorizado) {
    return (
      <div style={{minHeight:"100vh",background:"#040712",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:"1rem",padding:"2rem"}}>
        <div style={{fontSize:"48px"}}>🔒</div>
        <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:"24px"}}>Acesso negado</h1>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:"14px",textAlign:"center"}}>
          {!user ? "Você precisa estar logado." : "Esta área é restrita."}
        </p>
        <Link href="/" style={{color:"#34d399",textDecoration:"none",fontSize:"14px",marginTop:"1rem"}}>← Voltar para home</Link>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#040712",color:"#fff",fontFamily:"'Inter',sans-serif",padding:"2rem 1.5rem"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>

      <div style={{maxWidth:"1200px",margin:"0 auto"}}>

        {/* HEADER */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem",paddingBottom:"1rem",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <Link href="/" style={{display:"flex",alignItems:"center",gap:"10px",textDecoration:"none"}}>
              <div style={{width:"30px",height:"30px",borderRadius:"8px",background:"linear-gradient(135deg,#34d399 0%,#059669 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"14px",color:"#000"}}>Q</div>
              <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"17px",color:"rgba(255,255,255,0.95)"}}>QYNTOR</span>
            </Link>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#34d399",letterSpacing:"0.12em",background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.2)",padding:"4px 10px",borderRadius:"6px"}}>ADMIN</span>
          </div>
          <button onClick={carregarDados} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.7)",padding:"8px 16px",borderRadius:"8px",fontSize:"12px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
            🔄 ATUALIZAR
          </button>
        </div>

        {/* SELETOR DE PERÍODO */}
        <div style={{display:"flex",gap:"6px",marginBottom:"1.5rem",flexWrap:"wrap"}}>
          {PERIODOS.map(p => (
            <button key={p.id} onClick={() => setPeriodo(p.id)}
              style={{
                background: periodo === p.id ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.03)",
                border: "1px solid " + (periodo === p.id ? "rgba(52,211,153,0.4)" : "rgba(255,255,255,0.06)"),
                color: periodo === p.id ? "#34d399" : "rgba(255,255,255,0.5)",
                padding: "6px 14px", borderRadius: "6px",
                fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px",
                fontWeight: 600, letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.15s",
              }}>
              {p.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{textAlign:"center",padding:"4rem 0",color:"rgba(255,255,255,0.4)"}}>Carregando...</div>
        ) : (
          <>
            {/* MÉTRICAS — agora com NOVOS USUÁRIOS */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:"12px",marginBottom:"2rem"}}>
              {[
                {label:"USUÁRIOS",val:metricas.totalUsuarios,color:"#34d399",sub:"total cadastrados"},
                {label:"PREMIUM",val:metricas.usuariosPremium,color:"#fbbf24",sub:"ativos"},
                {
                  label:`NOVOS (${metricas.periodoLabel})`,
                  val:metricas.novosUsuarios,
                  color:"#a855f7",
                  sub: metricas.crescimentoNovos !== null
                    ? (metricas.crescimentoNovos >= 0 ? `↑ +${metricas.crescimentoNovos}%` : `↓ ${metricas.crescimentoNovos}%`)
                    : "novos cadastros",
                  subColor: metricas.crescimentoNovos === null
                    ? "rgba(255,255,255,0.35)"
                    : metricas.crescimentoNovos >= 0 ? "#34d399" : "#f87171"
                },
                {
                  label:`ANÁLISES (${metricas.periodoLabel})`,
                  val:metricas.analisesPeriodo,
                  color:"rgba(255,255,255,0.85)",
                  sub: metricas.crescimento !== null
                    ? (metricas.crescimento >= 0 ? `↑ +${metricas.crescimento}%` : `↓ ${metricas.crescimento}%`)
                    : "sem comparação",
                  subColor: metricas.crescimento === null
                    ? "rgba(255,255,255,0.35)"
                    : metricas.crescimento >= 0 ? "#34d399" : "#f87171"
                },
                {label:"ÚLTIMAS 24H",val:metricas.analisesHoje,color:"#60a5fa",sub:"análises"},
                {label:"ANÔNIMAS",val:metricas.anonimos,color:"rgba(255,255,255,0.5)",sub:`no período ${metricas.periodoLabel}`},
              ].map(m => (
                <div key={m.label} style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"16px"}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.08em",marginBottom:"8px"}}>{m.label}</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"28px",fontWeight:700,color:m.color}}>{m.val}</div>
                  {m.sub && (
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:m.subColor||"rgba(255,255,255,0.35)",marginTop:"4px"}}>
                      {m.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* TOP TICKERS */}
            {topTickers.length > 0 ? (
              <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"20px",marginBottom:"2rem"}}>
                <h2 style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",fontWeight:700,letterSpacing:"0.12em",color:"#34d399",marginBottom:"16px"}}>🏆 TOP ATIVOS ({metricas.periodoLabel})</h2>
                <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                  {topTickers.map(t => {
                    const max = topTickers[0].total;
                    const pct = (t.total / max) * 100;
                    return (
                      <div key={t.ticker} style={{display:"flex",alignItems:"center",gap:"12px"}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",color:"#34d399",fontWeight:700,minWidth:"70px"}}>{t.ticker}</span>
                        <div style={{flex:1,height:"8px",background:"rgba(255,255,255,0.04)",borderRadius:"100px",overflow:"hidden"}}>
                          <div style={{height:"100%",width:pct+"%",background:"linear-gradient(90deg, rgba(52,211,153,0.6), #34d399)",borderRadius:"100px"}} />
                        </div>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",color:"rgba(255,255,255,0.7)",minWidth:"30px",textAlign:"right"}}>{t.total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"2rem",marginBottom:"2rem",textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:"13px"}}>
                Nenhuma análise no período "{metricas.periodoLabel}"
              </div>
            )}

            {/* TABELA DE USUÁRIOS */}
            <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",overflow:"hidden"}}>

              <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"12px",marginBottom:"14px"}}>
                  <h2 style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.7)"}}>
                    👥 USUÁRIOS ({usuariosFiltrados.length}{usuariosFiltrados.length !== usuarios.length ? ` de ${usuarios.length}` : ""})
                  </h2>
                </div>

                <div style={{display:"flex",gap:"10px",flexWrap:"wrap",alignItems:"center"}}>
                  <div style={{position:"relative",flex:"1 1 240px",minWidth:"200px"}}>
                    <input
                      type="text"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="🔍 Buscar por email..."
                      style={{
                        width:"100%",
                        background:"rgba(255,255,255,0.03)",
                        border:"1px solid rgba(255,255,255,0.08)",
                        color:"#fff",
                        padding:"8px 12px",
                        borderRadius:"8px",
                        fontSize:"13px",
                        fontFamily:"'Inter',sans-serif",
                        outline:"none",
                      }}
                    />
                    {busca && (
                      <button onClick={() => setBusca("")}
                        style={{position:"absolute",right:"8px",top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"rgba(255,255,255,0.4)",fontSize:"14px",cursor:"pointer",padding:"4px 8px"}}>
                        ×
                      </button>
                    )}
                  </div>

                  <div style={{display:"flex",gap:"4px",background:"rgba(255,255,255,0.02)",padding:"3px",borderRadius:"8px",border:"1px solid rgba(255,255,255,0.06)"}}>
                    {FILTROS_PLANO.map(f => (
                      <button key={f.id} onClick={() => setFiltroPlano(f.id)}
                        style={{
                          background: filtroPlano === f.id ? "rgba(52,211,153,0.12)" : "transparent",
                          border:"none",
                          color: filtroPlano === f.id ? "#34d399" : "rgba(255,255,255,0.45)",
                          padding:"6px 12px",
                          borderRadius:"6px",
                          fontSize:"10px",
                          fontFamily:"'IBM Plex Mono',monospace",
                          fontWeight:700,
                          letterSpacing:"0.08em",
                          cursor:"pointer",
                          transition:"all 0.15s",
                        }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:"800px"}}>
                  <thead>
                    <tr style={{background:"rgba(255,255,255,0.02)"}}>
                      {COLUNAS.map(col => (
                        <th key={col.id}
                          onClick={() => col.ordenavel && trocarOrdenacao(col.id)}
                          style={{
                            padding:"10px 16px",
                            textAlign:"left",
                            fontFamily:"'IBM Plex Mono',monospace",
                            fontSize:"9px",
                            fontWeight:700,
                            letterSpacing:"0.1em",
                            color: ordenacao.coluna === col.id ? "#34d399" : "rgba(255,255,255,0.35)",
                            cursor: col.ordenavel ? "pointer" : "default",
                            userSelect:"none",
                            whiteSpace:"nowrap",
                          }}>
                          {col.label}
                          {col.ordenavel && ordenacao.coluna === col.id && (
                            <span style={{marginLeft:"4px",fontSize:"8px"}}>
                              {ordenacao.direcao === "asc" ? "▲" : "▼"}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map(u => (
                      <tr key={u.id} style={{borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                        <td style={{padding:"12px 16px",fontSize:"13px",color:"rgba(255,255,255,0.85)"}}>{u.email}</td>
                        <td style={{padding:"12px 16px"}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",fontWeight:700,letterSpacing:"0.06em",padding:"3px 8px",borderRadius:"4px",background:u.plano==="premium"?"rgba(251,191,36,0.12)":"rgba(255,255,255,0.04)",color:u.plano==="premium"?"#fbbf24":"rgba(255,255,255,0.5)",border:"1px solid "+(u.plano==="premium"?"rgba(251,191,36,0.25)":"rgba(255,255,255,0.08)")}}>
                            {(u.plano||"free").toUpperCase()}
                          </span>
                        </td>
                        <td style={{padding:"12px 16px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"13px",color:"#34d399",fontWeight:600}}>{u.total_analises}</td>
                        <td style={{padding:"12px 16px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"13px",color:"rgba(255,255,255,0.7)"}}>{u.consultas_usadas || 0}</td>
                        <td style={{padding:"12px 16px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"13px",color:"rgba(255,255,255,0.5)"}}>{u.limite_consultas || 3}</td>
                        <td style={{padding:"12px 16px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(255,255,255,0.4)"}}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "-"}
                        </td>
                        <td style={{padding:"12px 16px"}}>
                          <div style={{display:"flex",gap:"4px"}}>
                            {u.plano !== "premium" ? (
                              <button onClick={() => tornarPremium(u.id)} disabled={acaoLoading === u.id} title="Ativar Premium"
                                style={{background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.25)",color:"#fbbf24",padding:"4px 10px",borderRadius:"6px",fontSize:"11px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                                ⭐ PRO
                              </button>
                            ) : (
                              <button onClick={() => removerPremium(u.id)} disabled={acaoLoading === u.id} title="Voltar para Free"
                                style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.25)",color:"#f87171",padding:"4px 10px",borderRadius:"6px",fontSize:"11px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                                ❌ FREE
                              </button>
                            )}
                            <button onClick={() => resetarLimite(u.id)} disabled={acaoLoading === u.id} title="Resetar limite diário"
                              style={{background:"rgba(96,165,250,0.1)",border:"1px solid rgba(96,165,250,0.25)",color:"#60a5fa",padding:"4px 10px",borderRadius:"6px",fontSize:"11px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                              🔄
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {usuariosFiltrados.length === 0 && usuarios.length > 0 && (
                <div style={{padding:"3rem 1rem",textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:"14px"}}>
                  Nenhum usuário corresponde aos filtros.
                  <br />
                  <button onClick={() => { setBusca(""); setFiltroPlano("todos"); }}
                    style={{marginTop:"12px",background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.2)",color:"#34d399",padding:"6px 14px",borderRadius:"6px",fontSize:"11px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em"}}>
                    LIMPAR FILTROS
                  </button>
                </div>
              )}

              {usuarios.length === 0 && (
                <div style={{padding:"3rem 1rem",textAlign:"center",color:"rgba(255,255,255,0.3)",fontSize:"14px"}}>
                  Nenhum usuário cadastrado ainda
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
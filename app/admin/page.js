"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [autorizado, setAutorizado] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [topTickers, setTopTickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acaoLoading, setAcaoLoading] = useState(null);

  useEffect(() => {
    verificarAcesso();
  }, []);

  async function verificarAcesso() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (!user) {
      setAutorizado(false);
      return;
    }
    
    if (user.email !== ADMIN_EMAIL) {
      setAutorizado(false);
      return;
    }
    
    setAutorizado(true);
    await carregarDados();
  }

  async function carregarDados() {
    setLoading(true);
    
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

    const { count: totalAnalises } = await supabase
      .from("analises_publicas")
      .select("*", { count: "exact", head: true });

    const { count: analisesHoje } = await supabase
      .from("analises_publicas")
      .select("*", { count: "exact", head: true })
      .gte("criado_em", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { count: anonimos } = await supabase
      .from("analises_publicas")
      .select("*", { count: "exact", head: true })
      .eq("user_type", "anonimo");

    const usuariosPremium = (usuariosData || []).filter(u => u.plano === "premium").length;

    setMetricas({
      totalUsuarios: usuariosData?.length || 0,
      usuariosPremium,
      totalAnalises: totalAnalises || 0,
      analisesHoje: analisesHoje || 0,
      anonimos: anonimos || 0,
    });

    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: tickersData } = await supabase
      .from("analises_publicas")
      .select("ticker")
      .gte("criado_em", seteDiasAtras);

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
    await supabase
      .from("profiles")
      .update({ plano: "premium", limite_consultas: 50 })
      .eq("id", userId);
    await carregarDados();
    setAcaoLoading(null);
  }

  async function removerPremium(userId) {
    if (!confirm("Voltar este usuário para o plano Free?")) return;
    setAcaoLoading(userId);
    await supabase
      .from("profiles")
      .update({ plano: "free", limite_consultas: 3 })
      .eq("id", userId);
    await carregarDados();
    setAcaoLoading(null);
  }

  async function resetarLimite(userId) {
    if (!confirm("Resetar limite diário deste usuário?")) return;
    setAcaoLoading(userId);
    await supabase
      .from("profiles")
      .update({ consultas_usadas: 0 })
      .eq("id", userId);
    await carregarDados();
    setAcaoLoading(null);
  }

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
        
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"2rem",paddingBottom:"1rem",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
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

        {loading ? (
          <div style={{textAlign:"center",padding:"4rem 0",color:"rgba(255,255,255,0.4)"}}>Carregando...</div>
        ) : (
          <>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",gap:"12px",marginBottom:"2rem"}}>
              {[
                {label:"USUÁRIOS",val:metricas.totalUsuarios,color:"#34d399"},
                {label:"PREMIUM",val:metricas.usuariosPremium,color:"#fbbf24"},
                {label:"ANÁLISES (TOTAL)",val:metricas.totalAnalises,color:"rgba(255,255,255,0.7)"},
                {label:"ANÁLISES (24H)",val:metricas.analisesHoje,color:"#60a5fa"},
                {label:"ANÔNIMAS",val:metricas.anonimos,color:"rgba(255,255,255,0.5)"},
              ].map(m => (
                <div key={m.label} style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"16px"}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.08em",marginBottom:"8px"}}>{m.label}</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"28px",fontWeight:700,color:m.color}}>{m.val}</div>
                </div>
              ))}
            </div>

            {topTickers.length > 0 && (
              <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",padding:"20px",marginBottom:"2rem"}}>
                <h2 style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",fontWeight:700,letterSpacing:"0.12em",color:"#34d399",marginBottom:"16px"}}>🏆 TOP ATIVOS (ÚLTIMOS 7 DIAS)</h2>
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
            )}

            <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",overflow:"hidden"}}>
              <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                <h2 style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.7)"}}>👥 USUÁRIOS ({usuarios.length})</h2>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:"800px"}}>
                  <thead>
                    <tr style={{background:"rgba(255,255,255,0.02)"}}>
                      {["EMAIL","PLANO","ANÁLISES","USADAS HOJE","LIMITE","CRIADO","AÇÕES"].map(h => (
                        <th key={h} style={{padding:"10px 16px",textAlign:"left",fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.35)"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map(u => (
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
                              <button
                                onClick={() => tornarPremium(u.id)}
                                disabled={acaoLoading === u.id}
                                title="Ativar Premium"
                                style={{background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.25)",color:"#fbbf24",padding:"4px 10px",borderRadius:"6px",fontSize:"11px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                                ⭐ PRO
                              </button>
                            ) : (
                              <button
                                onClick={() => removerPremium(u.id)}
                                disabled={acaoLoading === u.id}
                                title="Voltar para Free"
                                style={{background:"rgba(248,113,113,0.1)",border:"1px solid rgba(248,113,113,0.25)",color:"#f87171",padding:"4px 10px",borderRadius:"6px",fontSize:"11px",cursor:"pointer",fontFamily:"'IBM Plex Mono',monospace"}}>
                                ❌ FREE
                              </button>
                            )}
                            <button
                              onClick={() => resetarLimite(u.id)}
                              disabled={acaoLoading === u.id}
                              title="Resetar limite diário"
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
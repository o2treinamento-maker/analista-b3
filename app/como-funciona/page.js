"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ComoFunciona() {
  const [user, setUser] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const dropdownRef = useRef(null);
  const menuMobileRef = useRef(null);

  async function carregarHistorico(uid) {
    if (!uid) { setHistorico([]); return; }
    const { data } = await supabase.from("historico_consultas").select("ticker, nome, criado_em").eq("user_id",uid).order("criado_em",{ascending:false}).limit(5);
    if (data) setHistorico(data);
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => { setUser(user); carregarHistorico(user?.id); });
    const { data: listener } = supabase.auth.onAuthStateChange((_e,session) => { setUser(session?.user||null); carregarHistorico(session?.user?.id); });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownAberto(false);
      if (menuMobileRef.current && !menuMobileRef.current.contains(e.target)) setMenuMobileAberto(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function fazerLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setHistorico([]);
    setDropdownAberto(false);
    setMenuMobileAberto(false);
    window.location.href = "/";
  }

  const passos = [
    {
      numero: "01",
      icon: "🔍",
      titulo: "Digite o ticker ou nome da acao",
      descricao: "Basta digitar o codigo da acao (ex: PETR4, VALE3) ou o nome da empresa no campo de busca. Cobrimos todos os ativos do Ibovespa, IDIV e Small Caps.",
      detalhe: "847+ ativos disponiveis",
    },
    {
      numero: "02",
      icon: "🌐",
      titulo: "Buscamos em tempo real na web",
      descricao: "Nossa IA acessa a web e consulta relatorios recentes de BTG Pactual, XP Investimentos, Itau BBA, Bradesco BBI, Safra e outras casas de analise — dados atualizados, nao uma base estatica.",
      detalhe: "15+ casas de analise",
    },
    {
      numero: "03",
      icon: "🧠",
      titulo: "Consolidamos as analises",
      descricao: "Calculamos o consenso de mercado, o preco-alvo medio e identificamos os pontos positivos e riscos mais citados pelos analistas institucionais.",
      detalhe: "Consenso em segundos",
    },
    {
      numero: "04",
      icon: "📊",
      titulo: "Receba o relatorio completo",
      descricao: "Em segundos voce tem acesso a um relatorio completo com consenso, tabela de recomendacoes por analista, tese unificada, valuation e recomendacao final.",
      detalhe: "Resultado em < 1 min",
    },
  ];

  const entregas = [
    { icon: "📊", titulo: "Consenso de Mercado", desc: "Quantos analistas recomendam Comprar, Manter ou Vender — com percentuais e distribuicao visual." },
    { icon: "🎯", titulo: "Preco-Alvo Medio", desc: "Media dos precos-alvo dos analistas e upside implicito em relacao a cotacao atual." },
    { icon: "📋", titulo: "Recomendacoes por Analista", desc: "Tabela completa com recomendacao, preco-alvo e data de cada casa de analise." },
    { icon: "🧠", titulo: "Tese Consolidada", desc: "Principais pontos positivos e riscos identificados pelos analistas institucionais." },
    { icon: "📰", titulo: "Momento Atual do Ativo", desc: "Noticias e eventos recentes relevantes para a tese de investimento." },
    { icon: "✅", titulo: "Sintese Final", desc: "COMPRAR, MANTER ou VENDER — com justificativa clara baseada no consenso." },
  ];

  const fontes = [
    "BTG Pactual", "XP Investimentos", "Itau BBA",
    "Bradesco BBI", "Safra", "Genial Investimentos",
    "Suno Research", "Goldman Sachs", "J.P. Morgan",
  ];

  return (
    <div style={{minHeight:"100vh",background:"#040712",color:"#fff",fontFamily:"'Inter',sans-serif",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        .nav-link { color:rgba(255,255,255,0.5); font-size:13px; text-decoration:none; font-weight:500; transition:all 0.2s; padding: 8px 4px; border-bottom: 1px solid transparent; }
        .nav-link:hover { color:rgba(255,255,255,0.95); border-bottom-color: rgba(52,211,153,0.4); }
        .nav-link.active { color:#34d399; border-bottom-color: rgba(52,211,153,0.5); }
        .login-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 9px 18px; border-radius: 10px;
          background: linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(52,211,153,0.06) 100%);
          border: 1px solid rgba(52,211,153,0.35);
          color: #34d399; font-size: 13px; font-weight: 600;
          text-decoration: none; transition: all 0.2s;
          box-shadow: 0 0 20px rgba(52,211,153,0.08), inset 0 1px 0 rgba(255,255,255,0.06);
        }
        .login-btn:hover {
          background: linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(52,211,153,0.1) 100%);
          border-color: rgba(52,211,153,0.5);
          box-shadow: 0 0 28px rgba(52,211,153,0.18), inset 0 1px 0 rgba(255,255,255,0.1);
          transform: translateY(-1px);
        }
        .user-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 6px 12px 6px 6px; border-radius: 100px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7); cursor: pointer;
          transition: all 0.2s;
        }
        .user-btn:hover {
          background: rgba(52,211,153,0.06);
          border-color: rgba(52,211,153,0.25);
        }
        .desktop-nav { display: none; }
        @media (min-width: 768px) { .desktop-nav { display: flex !important; align-items: center; gap: 2rem; } }
        .mobile-only { display: flex; }
        @media (min-width: 768px) { .mobile-only { display: none !important; } }
        .mobile-menu-toggle {
          display: flex; align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer; transition: all 0.2s;
        }
        .mobile-menu-toggle:hover {
          background: rgba(52,211,153,0.06);
          border-color: rgba(52,211,153,0.25);
        }
        .mobile-menu-toggle span {
          width: 16px; height: 1.5px; background: rgba(255,255,255,0.7);
          display: block; border-radius: 2px; transition: all 0.2s;
        }
        .mobile-menu-toggle span:not(:last-child) { margin-bottom: 4px; }
        .mobile-menu-toggle.open span:nth-child(1) { transform: translateY(5.5px) rotate(45deg); }
        .mobile-menu-toggle.open span:nth-child(2) { opacity: 0; }
        .mobile-menu-toggle.open span:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); }
        .step-card { transition: border-color 0.2s, box-shadow 0.2s; }
        .step-card:hover { border-color: rgba(52,211,153,0.2) !important; box-shadow: 0 0 30px rgba(52,211,153,0.05); }
        .entrega-card { transition: background 0.15s, border-color 0.15s; }
        .entrega-card:hover { background: rgba(52,211,153,0.04) !important; border-color: rgba(52,211,153,0.15) !important; }
        .fonte-pill { transition: background 0.15s, color 0.15s; }
        .fonte-pill:hover { background: rgba(52,211,153,0.06) !important; color: rgba(52,211,153,0.7) !important; }
        .anim-1 { animation: fadeUp 0.7s ease 0.0s forwards; opacity:0; }
        .anim-2 { animation: fadeUp 0.7s ease 0.1s forwards; opacity:0; }
        .anim-3 { animation: fadeUp 0.7s ease 0.2s forwards; opacity:0; }
        @media (max-width: 640px) {
          .passos-linha { display: none !important; }
          .step-card { flex-direction: column !important; gap: 14px !important; }
          .step-badge-detalhe { align-self: flex-start !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{height:"64px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.25rem",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(4,7,18,0.85)",backdropFilter:"blur(24px)",position:"sticky",top:0,zIndex:100}}>
        {/* LOGO */}
        <a href="/" style={{display:"flex",alignItems:"center",gap:"10px",textDecoration:"none"}}>
          <div style={{width:"30px",height:"30px",borderRadius:"8px",background:"linear-gradient(135deg,#34d399 0%,#059669 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"14px",color:"#000",boxShadow:"0 0 16px rgba(52,211,153,0.35)",flexShrink:0}}>V</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"17px",color:"rgba(255,255,255,0.95)",letterSpacing:"-0.02em"}}>VEKTOR</span>
        </a>

        {/* NAV DESKTOP — apenas "Como funciona" e "Planos" */}
        <nav className="desktop-nav">
          <a href="/como-funciona" className="nav-link active">Como funciona</a>
          <a href="/planos" className="nav-link">Planos</a>
        </nav>

        {/* LADO DIREITO */}
        <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
          {user ? (
            <>
              {/* DESKTOP — botão de usuário com dropdown */}
              <div className="desktop-nav" style={{position:"relative"}} ref={dropdownRef}>
                <button onClick={() => setDropdownAberto(prev => !prev)} className="user-btn">
                  <div style={{width:"30px",height:"30px",borderRadius:"50%",background:"linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.1))",border:"1px solid rgba(52,211,153,0.4)",display:"flex",alignItems:"center",justifyContent:"center",color:"#34d399",fontWeight:700,fontSize:"13px"}}>{(user.email?.[0]||"U").toUpperCase()}</div>
                  <span style={{fontSize:"13px",maxWidth:"160px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</span>
                  <span style={{fontSize:"9px",color:"rgba(255,255,255,0.4)",marginLeft:"2px",transition:"transform 0.2s",transform:dropdownAberto?"rotate(180deg)":"rotate(0deg)"}}>▼</span>
                </button>
                {dropdownAberto && (
                  <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",width:"300px",background:"rgba(11,17,32,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"14px",boxShadow:"0 24px 60px rgba(0,0,0,0.7)",zIndex:9999,overflow:"hidden",backdropFilter:"blur(24px)",animation:"slideDown 0.2s ease"}}>
                    <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                      <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",marginBottom:"4px"}}>LOGADO COMO</p>
                      <p style={{fontSize:"13px",color:"#fff",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</p>
                    </div>
                    {historico.length > 0 && (
                      <div style={{padding:"14px 16px"}}>
                        <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",marginBottom:"8px"}}>ULTIMAS CONSULTAS</p>
                        <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:"2px"}}>
                          {historico.map((h,i) => (
                            <li key={i}>
                              <a href={"/?t=" + encodeURIComponent(h.ticker)}
                                style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 10px",borderRadius:"8px",background:"transparent",border:"none",cursor:"pointer",transition:"background 0.15s",textDecoration:"none"}}
                                onMouseEnter={e => e.currentTarget.style.background="rgba(52,211,153,0.06)"}
                                onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                                <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                                  <span style={{color:"#34d399",fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",fontWeight:700}}>{h.ticker}</span>
                                  {h.nome && <span style={{color:"rgba(255,255,255,0.45)",fontSize:"12px",maxWidth:"140px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.nome}</span>}
                                </div>
                                <span style={{color:"rgba(255,255,255,0.25)",fontSize:"12px"}}>→</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"10px"}}>
                      <button onClick={fazerLogout}
                        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"10px 14px",borderRadius:"8px",background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",fontSize:"13px",fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}
                        onMouseEnter={e => { e.currentTarget.style.background="rgba(248,113,113,0.15)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.35)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background="rgba(248,113,113,0.08)"; e.currentTarget.style.borderColor="rgba(248,113,113,0.2)"; }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sair da conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* MOBILE — botão hambúrguer */}
              <div className="mobile-only" style={{position:"relative"}} ref={menuMobileRef}>
                <button onClick={() => setMenuMobileAberto(prev => !prev)} className={"mobile-menu-toggle " + (menuMobileAberto?"open":"")} aria-label="Menu">
                  <span /><span /><span />
                </button>
                {menuMobileAberto && (
                  <div style={{position:"absolute",right:0,top:"calc(100% + 10px)",width:"min(280px, calc(100vw - 2rem))",background:"rgba(11,17,32,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"14px",boxShadow:"0 24px 60px rgba(0,0,0,0.7)",zIndex:9999,overflow:"hidden",backdropFilter:"blur(24px)",animation:"slideDown 0.2s ease"}}>
                    <div style={{padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:"12px"}}>
                      <div style={{width:"38px",height:"38px",borderRadius:"50%",background:"linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.1))",border:"1px solid rgba(52,211,153,0.4)",display:"flex",alignItems:"center",justifyContent:"center",color:"#34d399",fontWeight:700,fontSize:"14px",flexShrink:0}}>{(user.email?.[0]||"U").toUpperCase()}</div>
                      <div style={{minWidth:0,flex:1}}>
                        <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",marginBottom:"2px"}}>LOGADO</p>
                        <p style={{fontSize:"12px",color:"#fff",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</p>
                      </div>
                    </div>
                    <div style={{padding:"8px"}}>
                      <a href="/como-funciona" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"block",padding:"11px 14px",borderRadius:"8px",color:"#34d399",fontSize:"14px",textDecoration:"none",background:"rgba(52,211,153,0.06)"}}>Como funciona</a>
                      <a href="/planos" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"block",padding:"11px 14px",borderRadius:"8px",color:"rgba(255,255,255,0.75)",fontSize:"14px",textDecoration:"none",transition:"background 0.15s"}}
                        onMouseEnter={e => e.currentTarget.style.background="rgba(52,211,153,0.06)"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>Planos</a>
                    </div>
                    {historico.length > 0 && (
                      <div style={{padding:"8px 16px 12px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                        <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",margin:"4px 0 8px"}}>ULTIMAS CONSULTAS</p>
                        <ul style={{margin:0,padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:"2px"}}>
                          {historico.slice(0,5).map((h,i) => (
                            <li key={i}>
                              <a href={"/?t=" + encodeURIComponent(h.ticker)} onClick={() => setMenuMobileAberto(false)}
                                style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"8px 6px",borderRadius:"6px",background:"transparent",border:"none",cursor:"pointer",textAlign:"left",textDecoration:"none"}}>
                                <span style={{color:"#34d399",fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px",fontWeight:700}}>{h.ticker}</span>
                                {h.nome && <span style={{color:"rgba(255,255,255,0.4)",fontSize:"12px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.nome}</span>}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"10px"}}>
                      <button onClick={fazerLogout}
                        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"11px 14px",borderRadius:"8px",background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",color:"#f87171",fontSize:"13px",fontWeight:600,cursor:"pointer"}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sair da conta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="login-btn desktop-nav">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Entrar
              </Link>
              {/* MOBILE — botão hambúrguer mesmo sem login */}
              <div className="mobile-only" style={{position:"relative"}} ref={menuMobileRef}>
                <button onClick={() => setMenuMobileAberto(prev => !prev)} className={"mobile-menu-toggle " + (menuMobileAberto?"open":"")} aria-label="Menu">
                  <span /><span /><span />
                </button>
                {menuMobileAberto && (
                  <div style={{position:"absolute",right:0,top:"calc(100% + 10px)",width:"min(260px, calc(100vw - 2rem))",background:"rgba(11,17,32,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"14px",boxShadow:"0 24px 60px rgba(0,0,0,0.7)",zIndex:9999,overflow:"hidden",backdropFilter:"blur(24px)",animation:"slideDown 0.2s ease"}}>
                    <div style={{padding:"8px"}}>
                      <a href="/como-funciona" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"block",padding:"11px 14px",borderRadius:"8px",color:"#34d399",fontSize:"14px",textDecoration:"none",background:"rgba(52,211,153,0.06)"}}>Como funciona</a>
                      <a href="/planos" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"block",padding:"11px 14px",borderRadius:"8px",color:"rgba(255,255,255,0.75)",fontSize:"14px",textDecoration:"none"}}>Planos</a>
                    </div>
                    <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",padding:"10px"}}>
                      <Link href="/login" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",padding:"11px 14px",borderRadius:"8px",background:"linear-gradient(135deg, rgba(52,211,153,0.18), rgba(52,211,153,0.08))",border:"1px solid rgba(52,211,153,0.4)",color:"#34d399",fontSize:"13px",fontWeight:600,textDecoration:"none"}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                        </svg>
                        Entrar
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      <main>
        {/* HERO */}
        <section style={{position:"relative",padding:"5rem 1.5rem 4rem",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.05)",overflow:"hidden"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"600px",height:"400px",background:"radial-gradient(ellipse, rgba(52,211,153,0.07) 0%, transparent 70%)",pointerEvents:"none",filter:"blur(40px)",animation:"glow-pulse 7s ease-in-out infinite"}} />
          <div style={{position:"relative",zIndex:1,maxWidth:"680px",margin:"0 auto"}}>
            <div className="anim-1" style={{display:"inline-flex",alignItems:"center",gap:"8px",border:"1px solid rgba(52,211,153,0.2)",background:"rgba(52,211,153,0.05)",borderRadius:"100px",padding:"5px 16px 5px 8px",marginBottom:"1.5rem"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 2s ease infinite"}} />
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#34d399",letterSpacing:"0.1em"}}>COMO FUNCIONA</span>
            </div>
            <h1 className="anim-2" style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:"clamp(28px,5vw,52px)",lineHeight:1.1,letterSpacing:"-0.035em",color:"rgba(255,255,255,0.95)",marginBottom:"1.25rem"}}>
              Consenso institucional{" "}
              <span style={{color:"#34d399",fontWeight:600}}>em segundos.</span>
            </h1>
            <p className="anim-3" style={{fontSize:"16px",color:"rgba(255,255,255,0.45)",lineHeight:1.7,maxWidth:"480px",margin:"0 auto"}}>
              Em menos de 1 minuto voce acessa o que os principais analistas do Brasil estao recomendando para qualquer ativo da B3.
            </p>
          </div>
        </section>

        {/* PASSOS */}
        <section style={{maxWidth:"860px",margin:"0 auto",padding:"4rem 1.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"2.5rem"}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em"}}>O PROCESSO</span>
            <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.05)"}} />
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"12px",position:"relative"}}>
            {/* Linha vertical conectora */}
            <div className="passos-linha" style={{position:"absolute",left:"35px",top:"70px",bottom:"70px",width:"1px",background:"linear-gradient(180deg,rgba(52,211,153,0.2),rgba(52,211,153,0.05))",pointerEvents:"none"}} />
            {passos.map((passo, i) => (
              <div key={passo.numero} className="step-card" style={{display:"flex",gap:"20px",alignItems:"flex-start",background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",padding:"24px 24px 24px 20px"}}>
                {/* Numero + icon */}
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",flexShrink:0}}>
                  <div style={{width:"48px",height:"48px",borderRadius:"12px",background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px",lineHeight:1}}>
                    {passo.icon}
                  </div>
                </div>
                {/* Conteudo */}
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.5)",fontWeight:700,letterSpacing:"0.1em"}}>{passo.numero}</span>
                    <h2 style={{fontFamily:"'Inter',sans-serif",fontSize:"16px",fontWeight:600,color:"rgba(255,255,255,0.9)",margin:0}}>{passo.titulo}</h2>
                  </div>
                  <p style={{fontSize:"14px",color:"rgba(255,255,255,0.45)",lineHeight:1.65,margin:0,maxWidth:"580px"}}>{passo.descricao}</p>
                </div>
                {/* Badge detalhe */}
                <div className="step-badge-detalhe" style={{flexShrink:0,alignSelf:"center"}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.5)",background:"rgba(52,211,153,0.06)",border:"1px solid rgba(52,211,153,0.12)",padding:"4px 10px",borderRadius:"4px",whiteSpace:"nowrap"}}>{passo.detalhe}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* O QUE VOCE RECEBE */}
        <section style={{borderTop:"1px solid rgba(255,255,255,0.05)",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(4,8,20,0.4)",padding:"4rem 1.5rem"}}>
          <div style={{maxWidth:"860px",margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"2.5rem"}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em"}}>O QUE VOCE RECEBE</span>
              <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.05)"}} />
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"10px"}}>
              {entregas.map(item => (
                <div key={item.titulo} className="entrega-card" style={{background:"rgba(4,8,20,0.7)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"14px",padding:"18px 16px",display:"flex",gap:"14px",alignItems:"flex-start"}}>
                  <span style={{fontSize:"18px",flexShrink:0,marginTop:"1px"}}>{item.icon}</span>
                  <div>
                    <div style={{fontSize:"13px",fontWeight:600,color:"rgba(255,255,255,0.85)",marginBottom:"5px"}}>{item.titulo}</div>
                    <div style={{fontSize:"12px",color:"rgba(255,255,255,0.35)",lineHeight:1.6}}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FONTES */}
        <section style={{padding:"4rem 1.5rem",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{maxWidth:"860px",margin:"0 auto",textAlign:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"2.5rem"}}>
              <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.05)"}} />
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em"}}>FONTES CONSULTADAS</span>
              <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.05)"}} />
            </div>
            <p style={{fontSize:"13px",color:"rgba(255,255,255,0.3)",marginBottom:"1.5rem",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.02em"}}>Buscamos recomendacoes nas principais casas de analise do Brasil e do mundo</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1px",background:"rgba(255,255,255,0.05)",borderRadius:"16px",overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)"}}>
              {fontes.map((fonte, i) => (
                <div key={fonte} className="fonte-pill" style={{padding:"18px",background:"rgba(8,12,28,0.6)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.02em",cursor:"default",borderBottom:i<6?"1px solid rgba(255,255,255,0.04)":"none"}}>
                  {fonte}
                </div>
              ))}
            </div>
            <div style={{marginTop:"1.5rem",display:"inline-flex",alignItems:"center",gap:"8px",padding:"8px 16px",background:"rgba(52,211,153,0.04)",border:"1px solid rgba(52,211,153,0.1)",borderRadius:"8px"}}>
              <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 2s ease infinite"}} />
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.6)",letterSpacing:"0.06em"}}>DADOS PUBLICOS · ATUALIZACAO CONTINUA</span>
            </div>
          </div>
        </section>

        {/* FAQ RAPIDO */}
        <section style={{padding:"4rem 1.5rem",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{maxWidth:"680px",margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"2.5rem"}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em"}}>DUVIDAS FREQUENTES</span>
              <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.05)"}} />
            </div>
            {[
              {q:"Preciso me cadastrar para usar?", a:"Nao. A primeira analise e totalmente gratuita e sem cadastro. Para mais analises por dia, basta criar uma conta gratis."},
              {q:"Os dados sao em tempo real?", a:"Sim. Cada vez que voce faz uma analise, nossa IA busca as recomendacoes mais recentes publicadas pelas casas de analise na web."},
              {q:"Quantas analises posso fazer?", a:"1 analise gratis sem cadastro. Com conta gratis, 3 analises por dia. Com o plano premium, ate 50 analises por dia."},
              {q:"O VEKTOR e um assessor de investimentos?", a:"Nao. O VEKTOR e uma ferramenta informativa que consolida dados publicos de analistas. Nao constitui recomendacao individualizada de investimento."},
            ].map((item, i) => (
              <div key={i} style={{padding:"18px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{fontSize:"14px",fontWeight:600,color:"rgba(255,255,255,0.85)",marginBottom:"8px",display:"flex",gap:"10px",alignItems:"flex-start"}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.5)",fontWeight:700,marginTop:"2px",flexShrink:0}}>Q.</span>
                  {item.q}
                </div>
                <div style={{fontSize:"13px",color:"rgba(255,255,255,0.4)",lineHeight:1.65,paddingLeft:"20px"}}>{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{padding:"5rem 1.5rem",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"500px",height:"300px",background:"radial-gradient(ellipse, rgba(52,211,153,0.06) 0%, transparent 70%)",pointerEvents:"none",filter:"blur(40px)"}} />
          <div style={{position:"relative",zIndex:1,maxWidth:"520px",margin:"0 auto"}}>
            <div style={{background:"rgba(4,8,20,0.9)",border:"1px solid rgba(52,211,153,0.15)",borderRadius:"20px",padding:"3rem 2rem",backdropFilter:"blur(20px)",boxShadow:"0 0 60px rgba(52,211,153,0.05)"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.5)",letterSpacing:"0.12em",marginBottom:"1rem"}}>PRONTO PARA COMECAR?</div>
              <h2 style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:"clamp(22px,4vw,32px)",letterSpacing:"-0.03em",color:"rgba(255,255,255,0.95)",marginBottom:"0.75rem",lineHeight:1.15}}>
                Faca sua primeira<br/><span style={{color:"#34d399"}}>analise agora.</span>
              </h2>
              <p style={{fontSize:"14px",color:"rgba(255,255,255,0.35)",marginBottom:"2rem",lineHeight:1.6}}>
                Sem cadastro, sem cartao. Resultado em menos de 1 minuto.
              </p>
              <a href="/" style={{display:"inline-flex",alignItems:"center",gap:"8px",background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.35)",color:"#34d399",padding:"14px 32px",borderRadius:"12px",textDecoration:"none",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"12px",letterSpacing:"0.12em",boxShadow:"0 0 24px rgba(52,211,153,0.15)",transition:"all 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(52,211,153,0.2)";e.currentTarget.style.boxShadow="0 0 32px rgba(52,211,153,0.25)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(52,211,153,0.12)";e.currentTarget.style.boxShadow="0 0 24px rgba(52,211,153,0.15)";}}>
                ANALISAR UM ATIVO →
              </a>
              <div style={{display:"flex",justifyContent:"center",gap:"24px",marginTop:"1.5rem",flexWrap:"wrap"}}>
                {[["FREE","Gratis"],["NO_AUTH","Sem cadastro"],["<1MIN","Resultado rapido"]].map(([code,label]) => (
                  <div key={code} style={{display:"flex",alignItems:"center",gap:"6px"}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(52,211,153,0.5)",fontWeight:700}}>{code}</span>
                    <span style={{fontSize:"11px",color:"rgba(255,255,255,0.25)"}}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
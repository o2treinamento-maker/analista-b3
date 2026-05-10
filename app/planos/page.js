"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Planos() {
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

  const planos = [
    {
      id: "anonimo",
      badge: null,
      nome: "Sem cadastro",
      preco: "Gratis",
      subpreco: "sem cartao necessario",
      destaque: false,
      corAccent: "rgba(255,255,255,0.35)",
      corBorda: "rgba(255,255,255,0.08)",
      corBg: "rgba(4,8,20,0.6)",
      glowColor: null,
      itens: [
        { ok: true,  texto: "1 analise por dia" },
        { ok: true,  texto: "Relatorio completo" },
        { ok: true,  texto: "Grafico TradingView" },
        { ok: false, texto: "Historico de consultas" },
        { ok: false, texto: "Suporte prioritario" },
      ],
      cta: "Analisar agora",
      ctaHref: "/",
      ctaPrimary: false,
    },
    {
      id: "free",
      badge: null,
      nome: "Plano Free",
      preco: "Gratis",
      subpreco: "com cadastro gratis",
      destaque: false,
      corAccent: "rgba(96,165,250,0.8)",
      corBorda: "rgba(96,165,250,0.15)",
      corBg: "rgba(4,8,20,0.85)",
      glowColor: "rgba(96,165,250,0.03)",
      itens: [
        { ok: true,  texto: "3 analises por dia" },
        { ok: true,  texto: "Relatorio completo" },
        { ok: true,  texto: "Grafico TradingView" },
        { ok: true,  texto: "Historico de consultas" },
        { ok: false, texto: "Suporte prioritario" },
      ],
      cta: "Criar conta gratis",
      ctaHref: "/cadastro",
      ctaPrimary: false,
    },
    {
      id: "premium",
      badge: "MAIS POPULAR",
      nome: "Premium",
      preco: "R$ 49,90",
      subpreco: "por mes · cancele quando quiser",
      destaque: true,
      corAccent: "#34d399",
      corBorda: "rgba(52,211,153,0.3)",
      corBg: "rgba(4,18,10,0.95)",
      glowColor: "rgba(52,211,153,0.06)",
      itens: [
        { ok: true, texto: "Analises ilimitadas" },
        { ok: true, texto: "Relatorio completo" },
        { ok: true, texto: "Grafico TradingView" },
        { ok: true, texto: "Historico de consultas" },
        { ok: true, texto: "Suporte prioritario" },
      ],
      cta: "Assinar pelo WhatsApp",
      ctaHref: "https://wa.me/5551991282389?text=Quero%20assinar%20o%20Plano%20Premium%20VEKTOR",
      ctaPrimary: true,
    },
  ];

  return (
    <div style={{minHeight:"100vh",background:"#040712",color:"#fff",fontFamily:"'Inter',sans-serif",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes glow-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
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
        .plano-card { transition: transform 0.2s; }
        .plano-card:hover { transform: translateY(-4px); }
        .anim-1 { animation: fadeUp 0.6s ease 0s forwards; opacity:0; }
        .anim-2 { animation: fadeUp 0.6s ease 0.1s forwards; opacity:0; }
        .anim-3 { animation: fadeUp 0.6s ease 0.2s forwards; opacity:0; }
        @media (max-width: 860px) {
          .planos-grid { grid-template-columns: 1fr !important; max-width: 400px !important; margin: 0 auto !important; }
          .comparativo-grid { display: none !important; }
          .comparativo-mobile { display: flex !important; }
        }
        @media (min-width: 861px) {
          .comparativo-mobile { display: none !important; }
        }
      `}</style>

      {/* HEADER */}
      <header style={{height:"64px",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.25rem",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(4,7,18,0.85)",backdropFilter:"blur(24px)",position:"sticky",top:0,zIndex:100}}>
        {/* LOGO */}
        <a href="/" style={{display:"flex",alignItems:"center",gap:"10px",textDecoration:"none"}}>
          <div style={{width:"30px",height:"30px",borderRadius:"8px",background:"linear-gradient(135deg,#34d399 0%,#059669 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"14px",color:"#000",boxShadow:"0 0 16px rgba(52,211,153,0.35)",flexShrink:0}}>V</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"17px",color:"rgba(255,255,255,0.95)",letterSpacing:"-0.02em"}}>VEKTOR</span>
        </a>

        {/* NAV DESKTOP */}
        <nav className="desktop-nav">
          <a href="/como-funciona" className="nav-link">Como funciona</a>
          <a href="/planos" className="nav-link active">Planos</a>
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
              {/* MOBILE — hambúrguer logado */}
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
                        style={{display:"block",padding:"11px 14px",borderRadius:"8px",color:"rgba(255,255,255,0.75)",fontSize:"14px",textDecoration:"none",transition:"background 0.15s"}}
                        onMouseEnter={e => e.currentTarget.style.background="rgba(52,211,153,0.06)"}
                        onMouseLeave={e => e.currentTarget.style.background="transparent"}>Como funciona</a>
                      <a href="/planos" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"block",padding:"11px 14px",borderRadius:"8px",color:"#34d399",fontSize:"14px",textDecoration:"none",background:"rgba(52,211,153,0.06)"}}>Planos</a>
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
              {/* MOBILE — hambúrguer deslogado */}
              <div className="mobile-only" style={{position:"relative"}} ref={menuMobileRef}>
                <button onClick={() => setMenuMobileAberto(prev => !prev)} className={"mobile-menu-toggle " + (menuMobileAberto?"open":"")} aria-label="Menu">
                  <span /><span /><span />
                </button>
                {menuMobileAberto && (
                  <div style={{position:"absolute",right:0,top:"calc(100% + 10px)",width:"min(260px, calc(100vw - 2rem))",background:"rgba(11,17,32,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"14px",boxShadow:"0 24px 60px rgba(0,0,0,0.7)",zIndex:9999,overflow:"hidden",backdropFilter:"blur(24px)",animation:"slideDown 0.2s ease"}}>
                    <div style={{padding:"8px"}}>
                      <a href="/como-funciona" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"block",padding:"11px 14px",borderRadius:"8px",color:"rgba(255,255,255,0.75)",fontSize:"14px",textDecoration:"none"}}>Como funciona</a>
                      <a href="/planos" onClick={() => setMenuMobileAberto(false)}
                        style={{display:"block",padding:"11px 14px",borderRadius:"8px",color:"#34d399",fontSize:"14px",textDecoration:"none",background:"rgba(52,211,153,0.06)"}}>Planos</a>
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
        <section style={{position:"relative",padding:"5rem 1.5rem 4rem",textAlign:"center",overflow:"hidden",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"600px",height:"400px",background:"radial-gradient(ellipse, rgba(52,211,153,0.06) 0%, transparent 70%)",pointerEvents:"none",filter:"blur(50px)",animation:"glow-pulse 7s ease-in-out infinite"}} />
          <div style={{position:"relative",zIndex:1}}>
            <div className="anim-1" style={{display:"inline-flex",alignItems:"center",gap:"8px",border:"1px solid rgba(52,211,153,0.2)",background:"rgba(52,211,153,0.05)",borderRadius:"100px",padding:"5px 16px 5px 8px",marginBottom:"1.5rem"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 2s ease infinite"}} />
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#34d399",letterSpacing:"0.1em"}}>PLANOS E PRECOS</span>
            </div>
            <h1 className="anim-2" style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:"clamp(28px,5vw,52px)",lineHeight:1.1,letterSpacing:"-0.035em",color:"rgba(255,255,255,0.95)",marginBottom:"1rem"}}>
              Simples assim.{" "}
              <span style={{color:"#34d399",fontWeight:600}}>Sem surpresas.</span>
            </h1>
            <p className="anim-3" style={{fontSize:"16px",color:"rgba(255,255,255,0.4)",maxWidth:"420px",margin:"0 auto",lineHeight:1.65}}>
              Comece gratis sem cadastro. Escale quando quiser.
            </p>
          </div>
        </section>

        {/* CARDS */}
        <section style={{padding:"4rem 1.5rem"}}>
          <div className="planos-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",maxWidth:"960px",margin:"0 auto"}}>
            {planos.map((p) => (
              <div key={p.id} className="plano-card" style={{background:p.corBg,border:"1px solid "+p.corBorda,borderRadius:"20px",padding:"28px 24px",display:"flex",flexDirection:"column",boxShadow:p.destaque?"0 0 60px "+p.glowColor+", inset 0 1px 0 rgba(255,255,255,0.05)":p.glowColor?"0 0 40px "+p.glowColor:"none"}}>

                {p.badge && (
                  <div style={{display:"flex",justifyContent:"center",marginBottom:"14px",marginTop:"-6px"}}>
                    <div style={{background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.28)",borderRadius:"100px",padding:"4px 14px",display:"inline-flex"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"#34d399",fontWeight:700,letterSpacing:"0.12em",whiteSpace:"nowrap"}}>{p.badge}</span>
                    </div>
                  </div>
                )}

                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:p.corAccent,letterSpacing:"0.1em",fontWeight:700,marginBottom:"14px"}}>{p.nome.toUpperCase()}</div>

                <div style={{marginBottom:"4px"}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:p.preco==="Gratis"?"22px":"clamp(26px,3.5vw,32px)",fontWeight:p.preco==="Gratis"?500:700,color:p.destaque?"#34d399":"rgba(255,255,255,0.75)",letterSpacing:"0.01em",lineHeight:1}}>{p.preco}</span>
                </div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.28)",letterSpacing:"0.03em",marginBottom:"26px"}}>{p.subpreco}</div>

                <div style={{height:"1px",background:p.destaque?"rgba(52,211,153,0.12)":"rgba(255,255,255,0.05)",marginBottom:"20px"}} />

                <div style={{display:"flex",flexDirection:"column",gap:"11px",flex:1,marginBottom:"28px"}}>
                  {p.itens.map((item,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:"10px"}}>
                      <div style={{width:"16px",height:"16px",borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",background:item.ok?(p.destaque?"rgba(52,211,153,0.12)":"rgba(255,255,255,0.05)"):"transparent",border:item.ok?"none":"1px solid rgba(255,255,255,0.06)"}}>
                        {item.ok
                          ? <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4l2 2 4-4" stroke={p.destaque?"#34d399":"rgba(255,255,255,0.45)"} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : <svg width="8" height="8" viewBox="0 0 8 8"><path d="M2 2l4 4M6 2l-4 4" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        }
                      </div>
                      <span style={{fontSize:"13px",color:item.ok?"rgba(255,255,255,"+(p.destaque?"0.8":"0.5")+")":"rgba(255,255,255,0.18)"}}>{item.texto}</span>
                    </div>
                  ))}
                </div>

                <a href={p.ctaHref}
                  target={p.ctaHref.startsWith("http")?"_blank":undefined}
                  rel={p.ctaHref.startsWith("http")?"noopener noreferrer":undefined}
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"7px",background:p.ctaPrimary?"rgba(52,211,153,0.13)":"rgba(255,255,255,0.04)",border:"1px solid "+(p.ctaPrimary?"rgba(52,211,153,0.32)":"rgba(255,255,255,0.08)"),color:p.ctaPrimary?"#34d399":"rgba(255,255,255,0.45)",padding:"13px 20px",borderRadius:"12px",textDecoration:"none",fontFamily:"'IBM Plex Mono',monospace",fontWeight:600,fontSize:"11px",letterSpacing:"0.1em",boxShadow:p.ctaPrimary?"0 0 20px rgba(52,211,153,0.12)":"none",transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background=p.ctaPrimary?"rgba(52,211,153,0.22)":"rgba(255,255,255,0.07)";if(p.ctaPrimary)e.currentTarget.style.boxShadow="0 0 28px rgba(52,211,153,0.22)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background=p.ctaPrimary?"rgba(52,211,153,0.13)":"rgba(255,255,255,0.04)";if(p.ctaPrimary)e.currentTarget.style.boxShadow="0 0 20px rgba(52,211,153,0.12)";}}>
                  {p.id==="premium" && <span style={{fontSize:"13px"}}>{"💬"}</span>}
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
          <p style={{textAlign:"center",marginTop:"1.75rem",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.18)",letterSpacing:"0.04em",padding:"0 1rem"}}>
            Premium via WhatsApp · Pix ou transferencia · Sem fidelidade · Cancele quando quiser
          </p>
        </section>

        {/* TABELA COMPARATIVA */}
        <section style={{borderTop:"1px solid rgba(255,255,255,0.05)",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(4,8,20,0.4)",padding:"3.5rem 1.5rem"}}>
          <div style={{maxWidth:"680px",margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"2rem"}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em"}}>COMPARATIVO</span>
              <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.05)"}} />
            </div>

            {/* DESKTOP */}
            <div className="comparativo-grid" style={{background:"rgba(4,8,20,0.8)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{padding:"12px 16px"}} />
                {["Sem cadastro","Free","Premium"].map((h,i) => (
                  <div key={h} style={{padding:"12px 16px",textAlign:"center",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",fontWeight:700,letterSpacing:"0.06em",color:i===2?"#34d399":"rgba(255,255,255,0.35)",borderLeft:"1px solid rgba(255,255,255,0.04)"}}>{h}</div>
                ))}
              </div>
              {[
                ["Analises/dia",       "1",         "3",       "Ilimitadas"],
                ["Relatorio completo", "Sim",        "Sim",     "Sim"],
                ["Grafico",            "Sim",        "Sim",     "Sim"],
                ["Historico",          "—",          "Sim",     "Sim"],
                ["Suporte",            "—",          "—",       "Prioritario"],
                ["Preco",              "Gratis",     "Gratis",  "R$ 49,90/mes"],
              ].map(([label,...vals],ri) => (
                <div key={label} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",borderBottom:ri<5?"1px solid rgba(255,255,255,0.04)":"none",background:ri%2===0?"transparent":"rgba(255,255,255,0.01)"}}>
                  <div style={{padding:"13px 16px",fontSize:"13px",color:"rgba(255,255,255,0.4)"}}>{label}</div>
                  {vals.map((v,ci) => (
                    <div key={ci} style={{padding:"13px 16px",textAlign:"center",fontSize:"13px",fontWeight:ci===2?600:400,fontFamily:"'IBM Plex Mono',monospace",color:v==="—"?"rgba(255,255,255,0.15)":ci===2?"#34d399":"rgba(255,255,255,0.5)",borderLeft:"1px solid rgba(255,255,255,0.04)"}}>{v}</div>
                  ))}
                </div>
              ))}
            </div>

            {/* MOBILE — cards empilhados */}
            <div className="comparativo-mobile" style={{display:"none",flexDirection:"column",gap:"12px"}}>
              {[
                {nome:"Sem cadastro",cor:"rgba(255,255,255,0.5)",linhas:[["Analises/dia","1"],["Relatorio","Sim"],["Grafico","Sim"],["Historico","—"],["Suporte","—"],["Preco","Gratis"]]},
                {nome:"Free",cor:"rgba(96,165,250,0.8)",linhas:[["Analises/dia","3"],["Relatorio","Sim"],["Grafico","Sim"],["Historico","Sim"],["Suporte","—"],["Preco","Gratis"]]},
                {nome:"Premium",cor:"#34d399",destaque:true,linhas:[["Analises/dia","Ilimitadas"],["Relatorio","Sim"],["Grafico","Sim"],["Historico","Sim"],["Suporte","Prioritario"],["Preco","R$ 49,90/mes"]]},
              ].map((p,i)=>(
                <div key={i} style={{background:p.destaque?"rgba(4,18,10,0.85)":"rgba(4,8,20,0.8)",border:"1px solid "+(p.destaque?"rgba(52,211,153,0.25)":"rgba(255,255,255,0.07)"),borderRadius:"14px",overflow:"hidden"}}>
                  <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",fontWeight:700,letterSpacing:"0.08em",color:p.cor}}>{p.nome.toUpperCase()}</div>
                  {p.linhas.map(([k,v],j)=>(
                    <div key={j} style={{display:"flex",justifyContent:"space-between",padding:"11px 16px",borderBottom:j<p.linhas.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                      <span style={{fontSize:"13px",color:"rgba(255,255,255,0.4)"}}>{k}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"13px",color:v==="—"?"rgba(255,255,255,0.18)":p.destaque?"#34d399":"rgba(255,255,255,0.7)",fontWeight:p.destaque?600:400}}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{padding:"4rem 1.5rem",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{maxWidth:"620px",margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"2rem"}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em"}}>DUVIDAS</span>
              <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.05)"}} />
            </div>
            {[
              {q:"Como funciona o pagamento do Premium?",a:"Pelo WhatsApp — voce fala com a gente, paga via Pix ou transferencia e ativa na hora. Sem burocracia."},
              {q:"Posso cancelar quando quiser?",a:"Sim. Sem fidelidade, sem multa. So nos avisar pelo WhatsApp."},
              {q:"O que conta como uma analise?",a:"Cada vez que voce busca um ativo conta como 1 analise. O limite reseta todo dia a meia-noite."},
              {q:"Tem limite de ativos disponiveis?",a:"Cobrimos todos os ativos do Ibovespa, IDIV e Small Caps — mais de 847 acoes da B3."},
            ].map((item,i) => (
              <div key={i} style={{padding:"18px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{fontSize:"14px",fontWeight:600,color:"rgba(255,255,255,0.85)",marginBottom:"8px",display:"flex",gap:"10px"}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.5)",fontWeight:700,marginTop:"3px",flexShrink:0}}>Q.</span>
                  {item.q}
                </div>
                <div style={{fontSize:"13px",color:"rgba(255,255,255,0.4)",lineHeight:1.65,paddingLeft:"22px"}}>{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{padding:"5rem 1.5rem",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"500px",height:"300px",background:"radial-gradient(ellipse, rgba(52,211,153,0.05) 0%, transparent 70%)",pointerEvents:"none",filter:"blur(40px)"}} />
          <div style={{position:"relative",zIndex:1,maxWidth:"480px",margin:"0 auto"}}>
            <div style={{background:"rgba(4,8,20,0.9)",border:"1px solid rgba(52,211,153,0.15)",borderRadius:"20px",padding:"3rem 2rem",backdropFilter:"blur(20px)",boxShadow:"0 0 60px rgba(52,211,153,0.04)"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.5)",letterSpacing:"0.12em",marginBottom:"1rem"}}>PRONTO PARA COMECAR?</div>
              <h2 style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:"clamp(22px,4vw,30px)",letterSpacing:"-0.03em",color:"rgba(255,255,255,0.95)",marginBottom:"0.75rem",lineHeight:1.2}}>
                Primeira analise{" "}
                <span style={{color:"#34d399"}}>totalmente gratis.</span>
              </h2>
              <p style={{fontSize:"14px",color:"rgba(255,255,255,0.35)",marginBottom:"2rem",lineHeight:1.6}}>
                Sem cadastro, sem cartao. Resultado em menos de 1 minuto.
              </p>
              <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                <a href="/"
                  style={{display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399",padding:"14px 24px",borderRadius:"12px",textDecoration:"none",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"11px",letterSpacing:"0.12em",boxShadow:"0 0 20px rgba(52,211,153,0.12)",transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(52,211,153,0.2)";e.currentTarget.style.boxShadow="0 0 28px rgba(52,211,153,0.22)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(52,211,153,0.12)";e.currentTarget.style.boxShadow="0 0 20px rgba(52,211,153,0.12)";}}>
                  ANALISAR UM ATIVO {"→"}
                </a>
                <a href="https://wa.me/5551991282389?text=Quero%20assinar%20o%20Plano%20Premium%20VEKTOR"
                  target="_blank" rel="noopener noreferrer"
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",background:"transparent",border:"1px solid rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.4)",padding:"13px 24px",borderRadius:"12px",textDecoration:"none",fontFamily:"'IBM Plex Mono',monospace",fontWeight:500,fontSize:"11px",letterSpacing:"0.08em",transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.15)";e.currentTarget.style.color="rgba(255,255,255,0.6)";}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";e.currentTarget.style.color="rgba(255,255,255,0.4)";}}>
                  <span style={{fontSize:"13px"}}>{"💬"}</span> Falar sobre o Premium
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
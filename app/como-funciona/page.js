"use client";

// ═══════════════════════════════════════════════════════════════════════════
// ÍCONES SVG (Lucide style)
// ═══════════════════════════════════════════════════════════════════════════

function Icon({ name, size = 16, color = "currentColor", strokeWidth = 1.75 }) {
  const baseProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (name) {
    case "trending-up":
      return (
        <svg {...baseProps}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case "chart-bar":
      return (
        <svg {...baseProps}>
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
      );
    case "landmark":
      return (
        <svg {...baseProps}>
          <line x1="3" y1="22" x2="21" y2="22" />
          <line x1="6" y1="18" x2="6" y2="11" />
          <line x1="10" y1="18" x2="10" y2="11" />
          <line x1="14" y1="18" x2="14" y2="11" />
          <line x1="18" y1="18" x2="18" y2="11" />
          <polygon points="12 2 20 7 4 7" />
        </svg>
      );
    case "coins":
      return (
        <svg {...baseProps}>
          <circle cx="8" cy="8" r="6" />
          <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
          <path d="M7 6h1v4" />
          <path d="m16.71 13.88.7.71-2.82 2.82" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...baseProps}>
          <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0-3 3H5a3 3 0 0 0 0 6h1a3 3 0 0 0 3 3v1a3 3 0 0 0 6 0v-1a3 3 0 0 0 3-3h1a3 3 0 0 0 0-6h-1a3 3 0 0 0-3-3V5a3 3 0 0 0-3-3Z" />
        </svg>
      );
    case "search":
      return (
        <svg {...baseProps}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case "layers":
      return (
        <svg {...baseProps}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case "zap":
      return (
        <svg {...baseProps}>
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function ComoFunciona() {
  // ─── 4 PASSOS DO PROCESSO ─────────────────────────────────────────────────
  const passos = [
    {
      numero: "01",
      icon: "search",
      titulo: "Digite o ticker ou nome do ativo",
      descricao: "Cole o código (PETR4, VALE3, BBAS3) ou o nome da empresa. Cobrimos Ibovespa, IDIV, Small Caps, FIIs e BDRs — todos com a mesma profundidade analítica.",
      detalhe: "847+ ativos cobertos",
    },
    {
      numero: "02",
      icon: "layers",
      titulo: "4 motores quantitativos processam o ativo",
      descricao: "Fluxo, Quant, Fundamentos e Dividendos rodam em paralelo. Cada motor aplica sua lógica proprietária sobre preço, balanço e estrutura técnica do papel.",
      detalhe: "Análise em paralelo",
    },
    {
      numero: "03",
      icon: "chart-bar",
      titulo: "Scores consolidados em leitura única",
      descricao: "Cada motor entrega uma nota objetiva e visual: score de 0 a 100, regime de fluxo, eficiência operacional e qualidade de dividendos. Tudo numa leitura institucional.",
      detalhe: "Leitura em segundos",
    },
    {
      numero: "04",
      icon: "sparkles",
      titulo: "Camada de IA (opcional, para usuários cadastrados)",
      descricao: "Por cima dos motores, a IA consolida consenso de analistas, preço-alvo médio e tese de mercado em texto institucional — útil quando você quer ir além dos números.",
      detalhe: "Acesso com cadastro grátis",
    },
  ];

  // ─── O QUE VOCÊ RECEBE ────────────────────────────────────────────────────
  const entregas = [
    { grupo: "Fluxo", icon: "trending-up", titulo: "Direção e regime do preço", desc: "EMA12, EMA50, zonas de suporte e resistência. Identifica fluxo comprador, vendedor ou em transição." },
    { grupo: "Quant", icon: "chart-bar", titulo: "Score Quantor de 0 a 100", desc: "Modelo proprietário que cruza tendência, momentum, volatilidade adaptativa e estrutura técnica." },
    { grupo: "Fundamentos", icon: "landmark", titulo: "Valuation, qualidade e robustez", desc: "P/L, P/VP, ROE, margens, alavancagem e geração de caixa. Três pilares condensados em um score." },
    { grupo: "Dividendos", icon: "coins", titulo: "DY, histórico e consistência", desc: "Dividend Yield atual, média de 5 anos, payout e regularidade. Diferencia pagadores consistentes de yield trap." },
    { grupo: "IA", icon: "sparkles", titulo: "Consenso de analistas", desc: "Quantos analistas recomendam Comprar, Manter ou Vender. Preço-alvo médio e upside implícito." },
    { grupo: "IA", icon: "sparkles", titulo: "Tese institucional consolidada", desc: "Principais pontos positivos e riscos da tese, com síntese final em formato de leitura executiva." },
  ];

  const fontes = [
    "BTG Pactual", "XP Investimentos", "Itaú BBA",
    "Bradesco BBI", "Safra", "Genial Investimentos",
    "Suno Research", "Goldman Sachs", "J.P. Morgan",
  ];

  return (
    <div style={{minHeight:"100vh",background:"#040712",color:"#fff",fontFamily:"'Inter',sans-serif",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.6} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .step-card { transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s; }
        .step-card:hover { border-color: rgba(52,211,153,0.25) !important; box-shadow: 0 8px 30px rgba(52,211,153,0.08); transform: translateY(-2px); }
        .step-card.ia { border-color: rgba(96,165,250,0.2) !important; }
        .step-card.ia:hover { border-color: rgba(96,165,250,0.4) !important; box-shadow: 0 8px 30px rgba(96,165,250,0.1); }
        .entrega-card { transition: background 0.15s, border-color 0.15s, transform 0.15s; }
        .entrega-card:hover { transform: translateY(-1px); }
        .entrega-card.verde:hover { background: rgba(52,211,153,0.05) !important; border-color: rgba(52,211,153,0.2) !important; }
        .entrega-card.azul:hover { background: rgba(96,165,250,0.05) !important; border-color: rgba(96,165,250,0.2) !important; }
        .fonte-pill { transition: background 0.15s, color 0.15s; }
        .fonte-pill:hover { background: rgba(96,165,250,0.05) !important; color: rgba(96,165,250,0.7) !important; }
        .anim-1 { animation: fadeUp 0.7s ease 0.0s forwards; opacity:0; }
        .anim-2 { animation: fadeUp 0.7s ease 0.1s forwards; opacity:0; }
        .anim-3 { animation: fadeUp 0.7s ease 0.2s forwards; opacity:0; }
        @media (max-width: 640px) {
          .passos-linha { display: none !important; }
          .step-card { flex-direction: column !important; gap: 14px !important; }
          .step-badge-detalhe { align-self: flex-start !important; }
        }
      `}</style>

      <main>
        {/* ─── HERO ────────────────────────────────────────────────────────── */}
        <section style={{position:"relative",padding:"5rem 1.5rem 4rem",textAlign:"center",borderBottom:"1px solid rgba(255,255,255,0.05)",overflow:"hidden"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"600px",height:"400px",background:"radial-gradient(ellipse, rgba(52,211,153,0.07) 0%, transparent 70%)",pointerEvents:"none",filter:"blur(40px)",animation:"glow-pulse 7s ease-in-out infinite"}} />
          <div style={{position:"relative",zIndex:1,maxWidth:"1000px",margin:"0 auto"}}>
            <div className="anim-1" style={{display:"inline-flex",alignItems:"center",gap:"8px",border:"1px solid rgba(52,211,153,0.2)",background:"rgba(52,211,153,0.05)",borderRadius:"100px",padding:"5px 16px 5px 8px",marginBottom:"2rem"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 2s ease infinite"}} />
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"#34d399",letterSpacing:"0.1em"}}>QUANTOR ANALYTICS ENGINE</span>
            </div>

            {/* TÍTULO no mesmo estilo do "Simples assim. Sem surpresas." da página /planos */}
            <h1 className="anim-2" style={{
              fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontWeight:800,
              fontSize:"clamp(34px, 6vw, 72px)",
              lineHeight:1.05,
              letterSpacing:"-0.04em",
              marginBottom:"1.5rem",
              marginTop:0,
              color:"#fff",
            }}>
              4 motores quantitativos.{" "}
              <span style={{color:"#86efac"}}>1 leitura institucional.</span>
            </h1>

            <p className="anim-3" style={{
              fontSize:"clamp(15px, 1.5vw, 17px)",
              color:"rgba(255,255,255,0.5)",
              lineHeight:1.65,
              maxWidth:"620px",
              margin:"0 auto",
              fontWeight:400,
            }}>
              A Quantor não é só IA — é um sistema de motores quantitativos rodando em paralelo sobre cada ativo. A IA é a camada extra, não o produto principal.
            </p>
          </div>
        </section>

        {/* ─── PASSOS DO PROCESSO ──────────────────────────────────────────── */}
        <section style={{maxWidth:"900px",margin:"0 auto",padding:"4rem 1.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"2.5rem"}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em"}}>O PROCESSO</span>
            <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.05)"}} />
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:"12px",position:"relative"}}>
            <div className="passos-linha" style={{position:"absolute",left:"35px",top:"70px",bottom:"70px",width:"1px",background:"linear-gradient(180deg,rgba(52,211,153,0.2),rgba(96,165,250,0.15))",pointerEvents:"none"}} />

            {passos.map((passo) => {
              const isIA = passo.numero === "04";
              const corPrincipal = isIA ? "#60a5fa" : "#34d399";
              const corBg = isIA ? "rgba(96,165,250,0.08)" : "rgba(52,211,153,0.08)";
              const corBorda = isIA ? "rgba(96,165,250,0.18)" : "rgba(52,211,153,0.15)";

              return (
                <div key={passo.numero} className={"step-card " + (isIA ? "ia" : "")} style={{
                  display:"flex",
                  gap:"20px",
                  alignItems:"flex-start",
                  background: isIA
                    ? "linear-gradient(135deg, rgba(96,165,250,0.05), rgba(4,8,20,0.85))"
                    : "rgba(4,8,20,0.85)",
                  border:`1px solid ${isIA ? "rgba(96,165,250,0.18)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius:"16px",
                  padding:"24px 24px 24px 20px",
                  position:"relative",
                }}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",flexShrink:0}}>
                    <div style={{
                      width:"48px",
                      height:"48px",
                      borderRadius:"12px",
                      background: corBg,
                      border:`1px solid ${corBorda}`,
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                    }}>
                      <Icon name={passo.icon} size={20} color={corPrincipal} />
                    </div>
                  </div>

                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px",flexWrap:"wrap"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color: isIA ? "rgba(96,165,250,0.6)" : "rgba(52,211,153,0.5)",fontWeight:700,letterSpacing:"0.1em"}}>{passo.numero}</span>
                      <h2 style={{fontFamily:"'Inter',sans-serif",fontSize:"16px",fontWeight:600,color:"rgba(255,255,255,0.92)",margin:0}}>{passo.titulo}</h2>
                      {isIA && (
                        <span style={{
                          fontFamily:"'IBM Plex Mono',monospace",
                          fontSize:"8px",
                          color:"rgba(96,165,250,0.7)",
                          letterSpacing:"0.14em",
                          fontWeight:700,
                          background:"rgba(96,165,250,0.08)",
                          border:"1px solid rgba(96,165,250,0.2)",
                          padding:"3px 8px",
                          borderRadius:"4px",
                        }}>CAMADA EXTRA</span>
                      )}
                    </div>
                    <p style={{fontSize:"14px",color:"rgba(255,255,255,0.5)",lineHeight:1.65,margin:0,maxWidth:"600px"}}>{passo.descricao}</p>
                  </div>

                  <div className="step-badge-detalhe" style={{flexShrink:0,alignSelf:"center"}}>
                    <span style={{
                      fontFamily:"'IBM Plex Mono',monospace",
                      fontSize:"10px",
                      color: isIA ? "rgba(96,165,250,0.6)" : "rgba(52,211,153,0.5)",
                      background: corBg,
                      border:`1px solid ${corBorda}`,
                      padding:"4px 10px",
                      borderRadius:"4px",
                      whiteSpace:"nowrap",
                    }}>{passo.detalhe}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── O QUE VOCÊ RECEBE ───────────────────────────────────────────── */}
        <section style={{borderTop:"1px solid rgba(255,255,255,0.05)",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(4,8,20,0.4)",padding:"4rem 1.5rem"}}>
          <div style={{maxWidth:"900px",margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"2.5rem"}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em"}}>O QUE VOCÊ RECEBE EM CADA ANÁLISE</span>
              <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.05)"}} />
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"10px"}}>
              {entregas.map((item, idx) => {
                const isIA = item.grupo === "IA";
                const cor = isIA ? "#60a5fa" : "#34d399";

                return (
                  <div key={idx} className={"entrega-card " + (isIA ? "azul" : "verde")} style={{
                    background:"rgba(4,8,20,0.7)",
                    border:"1px solid rgba(255,255,255,0.07)",
                    borderRadius:"14px",
                    padding:"18px 16px",
                    display:"flex",
                    flexDirection:"column",
                    gap:"12px",
                  }}>
                    <div style={{display:"flex",alignItems:"center",gap:"10px",justifyContent:"space-between"}}>
                      <div style={{
                        width:"32px",
                        height:"32px",
                        borderRadius:"9px",
                        background: `${cor}15`,
                        border:`1px solid ${cor}30`,
                        display:"flex",
                        alignItems:"center",
                        justifyContent:"center",
                        flexShrink:0,
                      }}>
                        <Icon name={item.icon} size={15} color={cor} />
                      </div>
                      <span style={{
                        fontFamily:"'IBM Plex Mono',monospace",
                        fontSize:"8px",
                        color: cor,
                        letterSpacing:"0.14em",
                        fontWeight:700,
                        background: `${cor}08`,
                        border:`1px solid ${cor}20`,
                        padding:"3px 8px",
                        borderRadius:"4px",
                      }}>{item.grupo.toUpperCase()}</span>
                    </div>

                    <div>
                      <div style={{fontSize:"13px",fontWeight:600,color:"rgba(255,255,255,0.88)",marginBottom:"6px",letterSpacing:"-0.005em"}}>{item.titulo}</div>
                      <div style={{fontSize:"12px",color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>


        {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
        <section style={{padding:"4rem 1.5rem",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
          <div style={{maxWidth:"720px",margin:"0 auto"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"2.5rem"}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em"}}>DÚVIDAS FREQUENTES</span>
              <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.05)"}} />
            </div>

            {[
              {q:"Os motores quantitativos usam IA?", a:"Não. Fluxo, Quant, Fundamentos e Dividendos são modelos proprietários que aplicam lógica matemática e estatística sobre dados de mercado (preço, balanço, fluxo). A IA só entra na camada de consenso de analistas, opcional."},
              {q:"Preciso me cadastrar pra usar?", a:"Não. A análise rápida com os 4 motores quantitativos é gratuita e sem cadastro. A camada de IA com consenso de analistas exige conta grátis (3 análises por dia)."},
              {q:"Os dados são em tempo real?", a:"Sim. Cotação, fundamentos e dividendos vêm da B3 com atualização contínua. A camada de IA busca os relatórios mais recentes publicados pelas casas de análise no momento da consulta."},
              {q:"O que diferencia os 4 motores?", a:"Cada um responde uma pergunta diferente. Fluxo: pra onde o preço aponta? Quant: qual o score técnico? Fundamentos: a empresa vale o preço? Dividendos: paga bem e com consistência? Juntos, formam a leitura institucional."},
              {q:"A Quantor é um assessor de investimentos?", a:"Não. A Quantor é uma ferramenta de inteligência quantitativa que consolida dados públicos. Não constitui recomendação individualizada de investimento."},
            ].map((item, i) => (
              <div key={i} style={{padding:"18px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                <div style={{fontSize:"14px",fontWeight:600,color:"rgba(255,255,255,0.88)",marginBottom:"8px",display:"flex",gap:"10px",alignItems:"flex-start"}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.5)",fontWeight:700,marginTop:"2px",flexShrink:0}}>Q.</span>
                  {item.q}
                </div>
                <div style={{fontSize:"13px",color:"rgba(255,255,255,0.45)",lineHeight:1.65,paddingLeft:"20px"}}>{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA FINAL ───────────────────────────────────────────────────── */}
        <section style={{padding:"5rem 1.5rem",textAlign:"center",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"500px",height:"300px",background:"radial-gradient(ellipse, rgba(52,211,153,0.06) 0%, transparent 70%)",pointerEvents:"none",filter:"blur(40px)"}} />
          <div style={{position:"relative",zIndex:1,maxWidth:"540px",margin:"0 auto"}}>
            <div style={{background:"rgba(4,8,20,0.9)",border:"1px solid rgba(52,211,153,0.15)",borderRadius:"20px",padding:"3rem 2rem",backdropFilter:"blur(20px)",boxShadow:"0 0 60px rgba(52,211,153,0.05)"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(52,211,153,0.5)",letterSpacing:"0.12em",marginBottom:"1rem"}}>PRONTO PARA COMEÇAR?</div>
              {/* CTA com mesmo estilo de fonte do "Simples assim" */}
              <h2 style={{
                fontFamily:"'Inter',sans-serif",
                fontWeight:800,
                fontSize:"clamp(24px,4vw,36px)",
                letterSpacing:"-0.035em",
                color:"#fff",
                marginBottom:"0.75rem",
                lineHeight:1.1,
              }}>
                Sua primeira leitura<br/><span style={{color:"#86efac"}}>completa em segundos.</span>
              </h2>
              <p style={{fontSize:"14px",color:"rgba(255,255,255,0.4)",marginBottom:"2rem",lineHeight:1.6}}>
                4 motores quantitativos, sem cadastro. A camada de IA é grátis com conta.
              </p>
              <a href="/" style={{display:"inline-flex",alignItems:"center",gap:"10px",background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.35)",color:"#34d399",padding:"14px 32px",borderRadius:"12px",textDecoration:"none",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"12px",letterSpacing:"0.12em",boxShadow:"0 0 24px rgba(52,211,153,0.15)",transition:"all 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(52,211,153,0.2)";e.currentTarget.style.boxShadow="0 0 32px rgba(52,211,153,0.25)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(52,211,153,0.12)";e.currentTarget.style.boxShadow="0 0 24px rgba(52,211,153,0.15)";}}>
                <Icon name="zap" size={14} color="#34d399" />
                <span>ANALISAR UM ATIVO</span>
                <span>→</span>
              </a>
              <div style={{display:"flex",justifyContent:"center",gap:"24px",marginTop:"1.75rem",flexWrap:"wrap"}}>
                {[
                  ["FREE","Grátis"],
                  ["NO_AUTH","Sem cadastro"],
                  ["<1MIN","Resultado rápido"],
                ].map(([code,label]) => (
                  <div key={code} style={{display:"flex",alignItems:"center",gap:"6px"}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"9px",color:"rgba(52,211,153,0.5)",fontWeight:700}}>{code}</span>
                    <span style={{fontSize:"11px",color:"rgba(255,255,255,0.3)"}}>{label}</span>
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
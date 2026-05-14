"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { track } from "@vercel/analytics";
import { CATEGORIAS } from "@/data/categorias";
import { TODOS_OS_ATIVOS, TICKERS_PERMITIDOS } from "@/lib/tickers";
import RelatorioIA, { parsearSecoes } from "@/components/RelatorioIA";
import { useWatchlist } from "@/hooks/useWatchlist";

// ═══════════════════════════════════════════════════════════════════════════
// SISTEMA DE ÍCONES SVG (estilo Lucide / outline tech)
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
    case "zap":
      return (
        <svg {...baseProps}>
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
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
    case "trending-up":
      return (
        <svg {...baseProps}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
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
    case "sprout":
      return (
        <svg {...baseProps}>
          <path d="M7 20h10" />
          <path d="M10 20c5.5-2.5.8-6.4 3-10" />
          <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z" />
          <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z" />
        </svg>
      );
    case "globe":
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case "building":
      return (
        <svg {...baseProps}>
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01" />
          <path d="M16 6h.01" />
          <path d="M12 6h.01" />
          <path d="M12 10h.01" />
          <path d="M12 14h.01" />
          <path d="M16 10h.01" />
          <path d="M16 14h.01" />
          <path d="M8 10h.01" />
          <path d="M8 14h.01" />
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
    default:
      return null;
  }
}

const ICONE_CATEGORIA = {
  ibovespa: "trending-up",
  dividendos: "coins",
  small_caps: "sprout",
  smallcaps: "sprout",
  "small-caps": "sprout",
  todomercado: "globe",
  todo_mercado: "globe",
  "todo-mercado": "globe",
  fii: "building",
  fundosimob: "building",
  fundos_imobiliarios: "building",
  bdr: "landmark",
  bdrs: "landmark",
};

// ═══════════════════════════════════════════════════════════════════════════
// PARTÍCULAS NO FUNDO (animação leve, pontos verdes flutuando)
// ═══════════════════════════════════════════════════════════════════════════

function ParticulasFundo() {
  // Network animado em canvas: partículas se movem e conectam por linhas
  const canvasRef = useRef(null);
  const animacaoRef = useRef(null);
  const particulasRef = useRef([]);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    if (!montado) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Detecta se é mobile pra reduzir partículas (economiza bateria)
    const isMobileNow = window.innerWidth < 768;
    const QUANTIDADE = isMobileNow ? 35 : 70;
    const DISTANCIA_CONEXAO = isMobileNow ? 110 : 140;
    const VELOCIDADE_MAX = 0.35;

    // Ajusta canvas para tela cheia + densidade de pixels (retina)
    function ajustarCanvas() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
    }
    ajustarCanvas();

    // Gera partículas iniciais com posição e velocidade aleatórias
    particulasRef.current = Array.from({ length: QUANTIDADE }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * VELOCIDADE_MAX,
      vy: (Math.random() - 0.5) * VELOCIDADE_MAX,
      raio: 0.8 + Math.random() * 1.6,
      opacidade: 0.35 + Math.random() * 0.45,
    }));

    let pausado = false;

    // Pausa animação quando a aba sai de foco (economiza bateria)
    function lidarVisibilidade() {
      pausado = document.hidden;
    }
    document.addEventListener("visibilitychange", lidarVisibilidade);

    function frame() {
      if (pausado) {
        animacaoRef.current = requestAnimationFrame(frame);
        return;
      }

      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      const particulas = particulasRef.current;

      // 1) Move e desenha cada partícula
      for (let i = 0; i < particulas.length; i++) {
        const p = particulas[i];
        p.x += p.vx;
        p.y += p.vy;

        // Ricochete nas bordas
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));

        // Desenha partícula com glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.raio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${p.opacidade})`;
        ctx.shadowColor = "rgba(52, 211, 153, 0.7)";
        ctx.shadowBlur = p.raio * 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 2) Desenha linhas entre partículas próximas
      for (let i = 0; i < particulas.length; i++) {
        for (let j = i + 1; j < particulas.length; j++) {
          const a = particulas[i];
          const b = particulas[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < DISTANCIA_CONEXAO) {
            // Opacidade da linha cai conforme distância aumenta
            const forca = 1 - dist / DISTANCIA_CONEXAO;
            const opacidadeLinha = forca * 0.35;

            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(52, 211, 153, ${opacidadeLinha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      animacaoRef.current = requestAnimationFrame(frame);
    }
    frame();

    // Ajusta quando redimensiona
    function lidarResize() {
      ajustarCanvas();
    }
    window.addEventListener("resize", lidarResize);

    return () => {
      cancelAnimationFrame(animacaoRef.current);
      document.removeEventListener("visibilitychange", lidarVisibilidade);
      window.removeEventListener("resize", lidarResize);
    };
  }, [montado]);

  if (!montado) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════

const MENSAGENS_LOADING = [
  "Buscando recomendacoes recentes na web...",
  "Lendo relatorios do InfoMoney e Money Times...",
  "Consultando cobertura do BTG Pactual...",
  "Verificando analises da XP Investimentos...",
  "Checando recomendacoes do Itau BBA...",
  "Analisando dados do Bradesco BBI e Safra...",
  "Pesquisando consenso de mercado...",
  "Verificando sentimento dos analistas...",
  "Coletando precos-alvo das casas de analise...",
  "Lendo noticias recentes do ativo...",
  "Verificando resultados trimestrais...",
  "Analisando cenario macroeconomico...",
  "Avaliando valuation atual do papel...",
  "Consolidando as teses dos analistas...",
  "Calculando upside e preco-alvo medio...",
  "Montando a tese unificada de mercado...",
  "Redigindo o relatorio final...",
  "Quase la, finalizando a analise...",
];

const COTACOES_TAPE = [
  { ticker: "IBOV",  preco: "127.305",   variacao: "+1,02%", positivo: true  },
  { ticker: "PETR4", preco: "R$49,08",   variacao: "+1,2%",  positivo: true  },
  { ticker: "VALE3", preco: "R$58,32",   variacao: "-0,8%",  positivo: false },
  { ticker: "ITUB4", preco: "R$35,90",   variacao: "+0,5%",  positivo: true  },
  { ticker: "WEGE3", preco: "R$52,14",   variacao: "+2,1%",  positivo: true  },
  { ticker: "BBAS3", preco: "R$28,45",   variacao: "-0,3%",  positivo: false },
  { ticker: "NVDA",  preco: "US$875,40", variacao: "+3,2%",  positivo: true  },
  { ticker: "AAPL",  preco: "US$189,50", variacao: "+0,8%",  positivo: true  },
  { ticker: "EMBR3", preco: "R$48,72",   variacao: "+1,8%",  positivo: true  },
  { ticker: "RENT3", preco: "R$19,34",   variacao: "-1,1%",  positivo: false },
  { ticker: "TSLA",  preco: "US$175,20", variacao: "+2,4%",  positivo: true  },
  { ticker: "ABEV3", preco: "R$12,88",   variacao: "+0,3%",  positivo: true  },
  { ticker: "SUZB3", preco: "R$43,90",   variacao: "-0,6%",  positivo: false },
  { ticker: "META",  preco: "US$512,30", variacao: "+1,5%",  positivo: true  },
];

function TickerTape() {
  const [cotacoes, setCotacoes] = useState(COTACOES_TAPE);
  useEffect(() => {
    const interval = setInterval(() => {
      setCotacoes(prev => prev.map(c => {
        const delta = (Math.random() - 0.5) * 0.3;
        const varNum = parseFloat(c.variacao.replace("%","").replace("+","").replace(",",".")) + delta;
        const positivo = varNum >= 0;
        return { ...c, variacao: (positivo ? "+" : "") + varNum.toFixed(2).replace(".",",") + "%", positivo };
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  const items = [...cotacoes, ...cotacoes, ...cotacoes];
  return (
    <div style={{height:"36px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(4,7,18,0.95)",display:"flex",alignItems:"center",overflow:"hidden",whiteSpace:"nowrap",fontSize:"11px",letterSpacing:"0.02em",position:"relative",zIndex:1}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:"80px",background:"linear-gradient(90deg,rgba(4,7,18,1),transparent)",zIndex:2,pointerEvents:"none"}} />
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:"80px",background:"linear-gradient(270deg,rgba(4,7,18,1),transparent)",zIndex:2,pointerEvents:"none"}} />
      <div className="ticker-animation" style={{display:"flex",gap:"0",paddingLeft:"2rem",width:"max-content"}}>
        {items.map((c, i) => (
          <div key={i} style={{display:"flex",alignItems:"center",gap:"6px",padding:"0 20px",borderRight:"1px solid rgba(255,255,255,0.05)"}}>
            <span style={{color:"rgba(255,255,255,0.5)",fontWeight:500,fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px"}}>{c.ticker}</span>
            <span style={{color:"rgba(255,255,255,0.25)",fontSize:"10px"}}>{c.preco}</span>
            <span style={{color:c.positivo?"#34d399":"#f87171",fontWeight:600,fontSize:"10px",fontFamily:"'IBM Plex Mono',monospace"}}>{c.positivo?"+":""}{c.variacao}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriasExplorer({ onSelecionar, categoriaAtiva, setCategoriaAtiva, filtro, setFiltro }) {
  const categoriaAtivaData = CATEGORIAS.find(c => c.id === categoriaAtiva);
  const ativosFiltrados = categoriaAtivaData?.ativos.filter(a =>
    filtro === "" || a.ticker.includes(filtro.toUpperCase()) || a.nome.toLowerCase().includes(filtro.toLowerCase())
  ) || [];

  function limparLabel(label) {
    if (!label) return "";
    return label.replace(/^[\p{Emoji}\p{Extended_Pictographic}\s]+/u, "").trim();
  }

  function limparTexto(texto) {
    if (!texto) return "";
    return texto.replace(/^[\p{Emoji}\p{Extended_Pictographic}\s]+/u, "").trim();
  }

  return (
    <div style={{textAlign:"center"}}>
      <div style={{display:"flex",gap:"4px",flexWrap:"wrap",padding:"4px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"12px",width:"fit-content",margin:"0 auto 1.5rem",justifyContent:"center"}}>
        {CATEGORIAS.map(cat => {
          const ativa = categoriaAtiva === cat.id;
          const iconeName = ICONE_CATEGORIA[cat.id] || "trending-up";
          return (
            <button key={cat.id} onClick={() => { setCategoriaAtiva(cat.id); setFiltro(""); }}
              style={{display:"flex",alignItems:"center",gap:"8px",padding:"9px 16px",borderRadius:"8px",border:"none",background: ativa ? "rgba(52,211,153,0.12)" : "transparent",color: ativa ? "#34d399" : "rgba(255,255,255,0.5)",fontFamily:"'Inter',sans-serif",fontSize:"13px",fontWeight: ativa ? 600 : 500,letterSpacing:"-0.005em",cursor:"pointer",transition:"all 0.15s",outline:"none",boxShadow: ativa ? "inset 0 0 0 1px rgba(52,211,153,0.2)" : "none",whiteSpace: "nowrap"}}
              onMouseEnter={e=>{if(!ativa){e.currentTarget.style.color="rgba(255,255,255,0.85)";e.currentTarget.style.background="rgba(255,255,255,0.04)";}}}
              onMouseLeave={e=>{if(!ativa){e.currentTarget.style.color="rgba(255,255,255,0.5)";e.currentTarget.style.background="transparent";}}}
            >
              <Icon name={iconeName} size={14} />
              <span>{limparLabel(cat.label)}</span>
            </button>
          );
        })}
      </div>

      <div style={{marginBottom: "1.25rem",paddingBottom: "1rem",borderBottom: "1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display: "flex",alignItems: "center",justifyContent: "center",gap: "10px",marginBottom: "6px"}}>
          <h3 style={{fontFamily:"'Inter',sans-serif",fontSize: "16px",color: "rgba(255,255,255,0.92)",fontWeight: 600,letterSpacing: "-0.015em",margin: 0}}>
            {limparTexto(categoriaAtivaData?.descricao)}
          </h3>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#34d399",letterSpacing:"0.08em",background:"rgba(52,211,153,0.1)",border:"1px solid rgba(52,211,153,0.25)",padding:"3px 9px",borderRadius:"4px",fontWeight:700}}>
            {ativosFiltrados.length} ATIVOS
          </span>
        </div>
        <p style={{fontFamily:"'Inter',sans-serif",fontSize:"13px",color:"rgba(255,255,255,0.55)",margin: 0,maxWidth: "560px",marginLeft: "auto",marginRight: "auto",lineHeight: 1.5}}>
          {limparTexto(categoriaAtivaData?.subtitulo)}
        </p>
      </div>

      <div style={{display:"flex",flexWrap:"wrap",gap:"6px",justifyContent:"center"}}>
        {ativosFiltrados.map(item => (
          <button key={item.ticker} onClick={() => onSelecionar(item.ticker)}
            style={{display:"flex",flexDirection:"column",alignItems:"flex-start",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"9px",padding:"10px 14px",cursor:"pointer",transition:"all 0.15s",minWidth:"88px"}}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(52,211,153,0.07)";e.currentTarget.style.borderColor="rgba(52,211,153,0.2)";e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.02)";e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";e.currentTarget.style.transform="translateY(0)";}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"13px",fontWeight:700,color:"rgba(52,211,153,0.9)",lineHeight:1.2,marginBottom:"3px"}}>{item.ticker}</span>
            <span style={{fontSize:"11px",color:"rgba(255,255,255,0.5)",lineHeight:1.3,fontWeight:400}}>{item.nome}</span>
          </button>
        ))}
        {ativosFiltrados.length === 0 && (
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(255,255,255,0.2)",padding:"1rem 0"}}>— nenhum resultado para "{filtro}"</span>
        )}
      </div>
    </div>
  );
}

function BuscaFlutuante({ visivel, onClick }) {
  if (!visivel) return null;
  return (
    <button onClick={onClick} aria-label="Buscar novo ativo" style={{position: "fixed",bottom: "24px",right: "24px",zIndex: 9998,width: "56px",height: "56px",borderRadius: "50%",background: "linear-gradient(135deg, rgba(52,211,153,0.95) 0%, rgba(5,150,105,0.95) 100%)",border: "1px solid rgba(52,211,153,0.5)",boxShadow: "0 8px 32px rgba(52,211,153,0.4), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 1px 0 rgba(255,255,255,0.15) inset",cursor: "pointer",display: "flex",alignItems: "center",justifyContent: "center",transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",animation: "fadeUp 0.4s ease"}}
      onMouseEnter={(e) => {e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";e.currentTarget.style.boxShadow = "0 12px 40px rgba(52,211,153,0.5), 0 0 0 1px rgba(255,255,255,0.12) inset";}}
      onMouseLeave={(e) => {e.currentTarget.style.transform = "translateY(0) scale(1)";e.currentTarget.style.boxShadow = "0 8px 32px rgba(52,211,153,0.4), 0 0 0 1px rgba(255,255,255,0.08) inset, 0 1px 0 rgba(255,255,255,0.15) inset";}}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    </button>
  );
}

function MiniBuscaFinal({ ticker, setTicker, sugestoes, setSugestoes, mostrarSugestoes, setMostrarSugestoes, onBuscar, loading, isMobile }) {
  return (
    <div style={{background: "linear-gradient(180deg, rgba(8,14,28,0.95) 0%, rgba(4,8,20,0.98) 100%)",border: "1px solid rgba(52,211,153,0.18)",borderRadius: "16px",padding: "24px 20px",marginBottom: "1.5rem",boxShadow: "0 0 40px rgba(52,211,153,0.04), inset 0 1px 0 rgba(255,255,255,0.04)"}}>
      <div style={{display: "flex",alignItems: "center",gap: "10px",marginBottom: "16px"}}>
        <div style={{width: "32px",height: "32px",borderRadius: "10px",background: "rgba(52,211,153,0.1)",border: "1px solid rgba(52,211,153,0.25)",display: "flex",alignItems: "center",justifyContent: "center",flexShrink: 0}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div>
          <div style={{fontFamily: "'IBM Plex Mono',monospace",fontSize: "12px",fontWeight: 700,color: "#34d399",letterSpacing: "0.12em",textTransform: "uppercase",lineHeight: 1.2}}>Analisar novo ativo</div>
          <div style={{fontFamily: "'IBM Plex Mono',monospace",fontSize: "9px",color: "rgba(255,255,255,0.3)",letterSpacing: "0.08em",marginTop: "3px"}}>DIGITE OU ESCOLHA ABAIXO</div>
        </div>
      </div>

      <form onSubmit={onBuscar}>
        <div style={{display: "flex",flexDirection: isMobile ? "column" : "row",alignItems: isMobile ? "stretch" : "center",background: "rgba(4,8,20,0.9)",border: "1px solid rgba(52,211,153,0.18)",borderRadius: "12px",padding: isMobile ? "12px" : "6px 6px 6px 18px",gap: isMobile ? "10px" : "0",position: "relative",transition: "border-color 0.2s"}}>
          {!isMobile && (
            <span style={{fontFamily: "'IBM Plex Mono',monospace",fontSize: "12px",color: "rgba(52,211,153,0.3)",letterSpacing: "0.04em",marginRight: "10px",flexShrink: 0,userSelect: "none",fontWeight: 500}}>{">"}_</span>
          )}
          <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
            <input type="text" value={ticker} placeholder={isMobile ? "Ex: PETR4, VALE3..." : "Digite outro ticker — PETR4, VALE3, NVDA..."} disabled={loading}
              style={{outline: "none",background: "transparent",color: "#fff",width: "100%",fontSize: isMobile ? "16px" : "15px",fontFamily: "'IBM Plex Mono',monospace",letterSpacing: "0.05em",border: "none",padding: 0}}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                setTicker(value);
                if (!value) { setSugestoes([]); setMostrarSugestoes(false); return; }
                setSugestoes(TODOS_OS_ATIVOS.filter(a => a.ticker.includes(value) || a.nome.toLowerCase().includes(value.toLowerCase())).slice(0, 6));
                setMostrarSugestoes(true);
              }}
            />
            {mostrarSugestoes && sugestoes.length > 0 && (
              <div style={{position: "absolute",left: isMobile ? "-12px" : "-30px",right: isMobile ? "-12px" : "auto",top: "calc(100% + 12px)",width: isMobile ? "calc(100% + 24px)" : "min(440px, calc(100vw - 2rem))",background: "rgba(4,7,18,0.99)",border: "1px solid rgba(52,211,153,0.18)",borderRadius: "10px",overflow: "hidden",zIndex: 9997,boxShadow: "0 24px 60px rgba(0,0,0,0.7)",backdropFilter: "blur(24px)"}}>
                {sugestoes.map((ativo) => (
                  <div key={ativo.ticker + ativo.nome} onClick={() => { setTicker(ativo.ticker); setMostrarSugestoes(false); }}
                    style={{padding: "12px 16px",cursor: "pointer",display: "flex",alignItems: "center",gap: "14px",borderBottom: "1px solid rgba(255,255,255,0.03)",transition: "background 0.1s"}}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(52,211,153,0.06)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <span style={{fontFamily: "'IBM Plex Mono',monospace",fontSize: "13px",color: "#34d399",fontWeight: 700,minWidth: "62px"}}>{ativo.ticker}</span>
                    <span style={{fontSize: "13px",color: "rgba(255,255,255,0.5)"}}>{ativo.nome}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button type="submit" disabled={loading || !ticker.trim()}
            style={{background: loading || !ticker.trim() ? "rgba(255,255,255,0.04)" : "rgba(52,211,153,0.15)",color: loading || !ticker.trim() ? "rgba(255,255,255,0.2)" : "#34d399",border: loading || !ticker.trim() ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(52,211,153,0.35)",borderRadius: isMobile ? "10px" : "8px",padding: isMobile ? "14px" : "0 22px",height: isMobile ? "auto" : "44px",width: isMobile ? "100%" : "auto",fontFamily: "'IBM Plex Mono',monospace",fontWeight: 700,fontSize: isMobile ? "12px" : "11px",letterSpacing: "0.12em",cursor: loading || !ticker.trim() ? "not-allowed" : "pointer",whiteSpace: "nowrap",flexShrink: 0,transition: "all 0.2s",boxShadow: loading || !ticker.trim() ? "none" : "0 0 20px rgba(52,211,153,0.15)"}}>
            {loading ? "PROCESSANDO..." : (isMobile ? "ANALISAR →" : "ANALISAR")}
          </button>
        </div>
      </form>
    </div>
  );
}

function BotaoAdicionarCarteira({ ticker, jaEsta, adicionando, logado, onAdicionar }) {
  const [adicionadoAgora, setAdicionadoAgora] = useState(false);
  useEffect(() => { setAdicionadoAgora(false); }, [ticker]);
  const exibirComoNaCarteira = jaEsta || adicionadoAgora;

  async function handleClick() {
    if (exibirComoNaCarteira || adicionando) return;
    if (!logado) { window.location.href = "/login"; return; }
    const resultado = await onAdicionar();
    if (resultado?.ok) setAdicionadoAgora(true);
  }

  const cor = exibirComoNaCarteira ? "#60a5fa" : "#34d399";
  const bg = exibirComoNaCarteira ? "rgba(96,165,250,0.08)" : "rgba(52,211,153,0.10)";
  const borda = exibirComoNaCarteira ? "rgba(96,165,250,0.28)" : "rgba(52,211,153,0.32)";
  const glow = exibirComoNaCarteira ? "0 0 22px rgba(96,165,250,0.08)" : "0 0 22px rgba(52,211,153,0.10)";
  const icone = exibirComoNaCarteira ? "✓" : "★";
  const texto = exibirComoNaCarteira ? "Já está na sua carteira" : "Adicionar à minha carteira";

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
      <button onClick={handleClick} disabled={exibirComoNaCarteira || adicionando}
        style={{display: "inline-flex",alignItems: "center",gap: "10px",padding: "11px 22px",background: bg,border: `1px solid ${borda}`,borderRadius: "100px",color: cor,fontFamily: "'Inter', sans-serif",fontSize: "13px",fontWeight: 600,letterSpacing: "0.01em",cursor: exibirComoNaCarteira ? "default" : (adicionando ? "wait" : "pointer"),boxShadow: glow,transition: "all 0.2s ease"}}
        onMouseEnter={(e) => {
          if (exibirComoNaCarteira || adicionando) return;
          e.currentTarget.style.background = "rgba(52,211,153,0.18)";
          e.currentTarget.style.borderColor = "rgba(52,211,153,0.5)";
          e.currentTarget.style.transform = "translateY(-1px)";
          e.currentTarget.style.boxShadow = "0 6px 28px rgba(52,211,153,0.2)";
        }}
        onMouseLeave={(e) => {
          if (exibirComoNaCarteira || adicionando) return;
          e.currentTarget.style.background = bg;
          e.currentTarget.style.borderColor = borda;
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = glow;
        }}>
        <span style={{ fontSize: "14px", lineHeight: 1 }}>{adicionando ? "…" : icone}</span>
        <span>{adicionando ? "Adicionando..." : texto}</span>
      </button>
    </div>
  );
}

function FundoAnimado() {
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg,#020510 0%,#030812 50%,#020510 100%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-60%)", width: "700px", height: "500px", background: "radial-gradient(ellipse, rgba(52,211,153,0.07) 0%, rgba(52,211,153,0.02) 45%, transparent 70%)", borderRadius: "50%", pointerEvents: "none", animation: "glow-pulse 7s ease-in-out infinite", filter: "blur(50px)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", animation: "grid-breathe 9s ease-in-out infinite" }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hero-grid-fine" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(52,211,153,0.05)" strokeWidth="0.5" /></pattern>
            <pattern id="hero-grid-large" width="160" height="160" patternUnits="userSpaceOnUse"><path d="M 160 0 L 0 0 0 160" fill="none" stroke="rgba(52,211,153,0.08)" strokeWidth="0.5" /></pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid-fine)" />
          <rect width="100%" height="100%" fill="url(#hero-grid-large)" />
        </svg>
      </div>
      <div className="scanline" />
    </>
  );
}

function InputBuscaHero({ ticker, setTicker, sugestoes, setSugestoes, mostrarSugestoes, setMostrarSugestoes, onBuscar, loading, isMobile, grande = false }) {
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", background: "rgba(4,8,20,0.95)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "14px", padding: "14px 16px", backdropFilter: "blur(20px)", boxShadow: "0 0 0 1px rgba(52,211,153,0.08) inset, 0 8px 40px rgba(0,0,0,0.5)" }}>
          <input type="text" value={ticker} className="hero-input" placeholder="Digite o Ticker: PETR4..." disabled={loading}
            style={{ fontSize: "17px", letterSpacing: "0.06em", fontFamily: "'IBM Plex Mono',monospace", background: "transparent", border: "none", outline: "none", color: "#fff", width: "100%" }}
            onChange={e => {
              const value = e.target.value.toUpperCase();
              setTicker(value);
              if (!value) { setSugestoes([]); setMostrarSugestoes(false); return; }
              setSugestoes(TODOS_OS_ATIVOS.filter(a => a.ticker.includes(value) || a.nome.toLowerCase().includes(value.toLowerCase())).slice(0, 6));
              setMostrarSugestoes(true);
            }}
          />
          {ticker.length > 0 && (
            <button type="button" onClick={() => { setTicker(""); setSugestoes([]); setMostrarSugestoes(false); }}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", fontSize: "18px", cursor: "pointer", padding: "0 0 0 8px", flexShrink: 0, lineHeight: 1 }}>×</button>
          )}
        </div>
        {mostrarSugestoes && sugestoes.length > 0 && (
          <div style={{ background: "rgba(4,7,18,0.98)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.7)", backdropFilter: "blur(24px)" }}>
            {sugestoes.map(ativo => (
              <div key={ativo.ticker + ativo.nome} onClick={() => { setTicker(ativo.ticker); setMostrarSugestoes(false); }}
                style={{ padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: "16px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "14px", color: "#34d399", fontWeight: 700, minWidth: "64px" }}>{ativo.ticker}</span>
                <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>{ativo.nome}</span>
              </div>
            ))}
          </div>
        )}
        <button type="submit" disabled={loading || !ticker.trim()} style={{background: loading || !ticker.trim() ? "rgba(255,255,255,0.04)" : "rgba(52,211,153,0.15)",color: loading || !ticker.trim() ? "rgba(255,255,255,0.2)" : "#34d399",border: loading || !ticker.trim() ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(52,211,153,0.35)",borderRadius: "14px", height: "56px", width: "100%",fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: "13px",letterSpacing: "0.14em", cursor: loading || !ticker.trim() ? "not-allowed" : "pointer",transition: "all 0.2s",boxShadow: loading || !ticker.trim() ? "none" : "0 0 28px rgba(52,211,153,0.18), inset 0 1px 0 rgba(255,255,255,0.08)"}}>
          {loading ? "PROCESSANDO..." : "ANALISAR →"}
        </button>
      </div>
    );
  }

  return (
    <div className="search-wrap" style={{display: "flex",alignItems: "center",background: "rgba(4,8,20,0.9)",border: "1px solid rgba(52,211,153,0.18)",borderRadius: grande ? "16px" : "12px",padding: grande ? "10px 10px 10px 26px" : "6px 6px 6px 20px",transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",position: "relative",backdropFilter: "blur(20px)",boxShadow: "0 0 0 1px rgba(52,211,153,0.06) inset, 0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 40px rgba(0,0,0,0.5)"}}>
      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: grande ? "14px" : "12px", color: "rgba(52,211,153,0.3)", letterSpacing: "0.04em", marginRight: grande ? "16px" : "12px", flexShrink: 0, userSelect: "none", fontWeight: 500 }}>{">"}_</span>
      <div style={{ flex: 1, position: "relative" }}>
        <input type="text" value={ticker} className="hero-input" placeholder="Digite um ticker — PETR4, VALE3..." disabled={loading} style={{ fontSize: grande ? "20px" : "16px" }}
          onChange={e => {
            const value = e.target.value.toUpperCase();
            setTicker(value);
            if (!value) { setSugestoes([]); setMostrarSugestoes(false); return; }
            setSugestoes(TODOS_OS_ATIVOS.filter(a => a.ticker.includes(value) || a.nome.toLowerCase().includes(value.toLowerCase())).slice(0, 8));
            setMostrarSugestoes(true);
          }}
        />
        {mostrarSugestoes && sugestoes.length > 0 && (
          <div style={{ position: "absolute", left: "-52px", top: "calc(100% + 10px)", width: "min(calc(100% + 160px), calc(100vw - 2rem))", background: "#040712", border: "1px solid rgba(52,211,153,0.3)", borderRadius: "10px", overflow: "hidden", zIndex: 99999, boxShadow: "0 24px 60px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.04) inset" }}>
            {sugestoes.map(ativo => (
              <div key={ativo.ticker + ativo.nome} onClick={() => { setTicker(ativo.ticker); setMostrarSugestoes(false); }}
                style={{ padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "14px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "#040712", transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(52,211,153,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "#040712"}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "12px", color: "#34d399", fontWeight: 600, minWidth: "58px" }}>{ativo.ticker}</span>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>{ativo.nome}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button type="submit" disabled={loading || !ticker.trim()} style={{background: loading || !ticker.trim() ? "rgba(255,255,255,0.04)" : "rgba(52,211,153,0.12)",color: loading || !ticker.trim() ? "rgba(255,255,255,0.2)" : "#34d399",border: loading || !ticker.trim() ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(52,211,153,0.3)",borderRadius: grande ? "10px" : "8px",padding: grande ? "0 28px" : "0 24px",height: grande ? "56px" : "50px",fontFamily: "'IBM Plex Mono',monospace",fontWeight: 600,fontSize: grande ? "12px" : "11px",letterSpacing: "0.1em",cursor: loading || !ticker.trim() ? "not-allowed" : "pointer",whiteSpace: "nowrap",flexShrink: 0,transition: "all 0.2s",boxShadow: loading || !ticker.trim() ? "none" : "0 0 24px rgba(52,211,153,0.15), inset 0 1px 0 rgba(255,255,255,0.08)"}}>
        {loading ? "PROCESSANDO..." : "ANALISAR"}
      </button>
    </div>
  );
}

function ToggleModo({ modoRapido, setModoRapido, isMobile, user, mostrarTextoExplicativo = true }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px", background: "rgba(4,8,20,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "100px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
        <button type="button" onClick={() => setModoRapido(true)} style={{ padding: "9px 18px", borderRadius: "100px", border: "none", background: modoRapido ? "rgba(52,211,153,0.15)" : "transparent", color: modoRapido ? "#34d399" : "rgba(255,255,255,0.4)", fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", fontWeight: modoRapido ? 700 : 500, letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px", boxShadow: modoRapido ? "inset 0 0 0 1px rgba(52,211,153,0.25)" : "none", whiteSpace: "nowrap" }}>
          <Icon name="zap" size={14} />
          <span>RÁPIDA (5s)</span>
        </button>
        <button type="button" onClick={() => setModoRapido(false)} style={{ padding: "9px 18px", borderRadius: "100px", border: "none", background: !modoRapido ? "rgba(52,211,153,0.15)" : "transparent", color: !modoRapido ? "#34d399" : "rgba(255,255,255,0.4)", fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", fontWeight: !modoRapido ? 700 : 500, letterSpacing: "0.08em", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px", boxShadow: !modoRapido ? "inset 0 0 0 1px rgba(52,211,153,0.25)" : "none", whiteSpace: "nowrap", opacity: !user ? 0.65 : 1 }}>
          <Icon name="chart-bar" size={14} />
          <span>AVANÇADA (45s)</span>
          {!user && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </button>
      </div>

      {mostrarTextoExplicativo && (
        <div style={{ textAlign: "center", maxWidth: "440px", padding: "0 1rem" }}>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.5 }}>
            {modoRapido ? (<>Análise rápida com <strong style={{ color: "rgba(52,211,153,0.7)" }}>dados técnicos e fundamentalistas</strong> da B3</>) : (<>Análise avançada com <strong style={{ color: "rgba(52,211,153,0.7)" }}>consenso de analistas, preço-alvo e tese</strong> de mercado</>)}
          </p>
          {!modoRapido && !user && (
            <Link href="/cadastro" style={{ marginTop: "10px", display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.25)", borderRadius: "100px", fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", color: "#34d399", fontWeight: 600, letterSpacing: "0.02em", textDecoration: "none", cursor: "pointer", transition: "all 0.2s" }}>
              <span>🎁</span>
              <span>Criar conta grátis · 3 análises/dia</span>
              <span style={{ marginLeft: "2px", fontSize: "12px" }}>→</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function HeroDeslogado({ buscarAnalise, ticker, setTicker, sugestoes, setSugestoes, mostrarSugestoes, setMostrarSugestoes, modoRapido, setModoRapido, loading, isMobile, user, secoes, categoriaAtiva, setCategoriaAtiva, filtro, setFiltro }) {
  return (
    <section style={{position: "relative",overflow: "hidden",borderBottom: "1px solid rgba(255,255,255,0.05)",minHeight: isMobile ? "auto" : "calc(100vh - 100px)",display: "flex",flexDirection: "column",alignItems: "center",justifyContent: "center",padding: isMobile ? "2.5rem 1rem 2rem" : "3rem 1rem 3rem"}}>
      <FundoAnimado />
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: "720px", width: "100%" }} className="anim-fadeup">
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid rgba(52,211,153,0.2)", background: "rgba(52,211,153,0.05)", borderRadius: "100px", padding: "5px 16px 5px 8px", marginBottom: "1.5rem" }}>
          <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(52,211,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", animation: "pulse-dot 2s ease infinite" }} />
          </div>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", color: "#34d399", letterSpacing: "0.1em" }}>ALPHA INTELLIGENCE · LIVE</span>
        </div>

        <h1 style={{fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",fontWeight: 600,fontSize: isMobile ? "32px" : "clamp(36px, 4.5vw, 52px)",lineHeight: 1.05,letterSpacing: "-0.035em",marginBottom: "1rem",marginTop: 0,background: "linear-gradient(120deg, rgba(255,255,255,0.95) 0%, rgba(167,243,208,0.95) 35%, rgba(52,211,153,0.9) 50%, rgba(167,243,208,0.95) 65%, rgba(255,255,255,0.95) 100%)",backgroundSize: "200% 100%",WebkitBackgroundClip: "text",backgroundClip: "text",WebkitTextFillColor: "transparent",color: "transparent",animation: "gradient-shift 8s ease-in-out infinite"}}>
          Inteligência quantitativa<br />
          para investidores modernos.
        </h1>

        <p className="anim-fadeup-2" style={{fontSize: isMobile ? "14px" : "15px",lineHeight: 1.6,color: "rgba(255,255,255,0.5)",maxWidth: "440px",marginBottom: "1.75rem",fontWeight: 400,letterSpacing: "0.005em"}}>
          Plataforma de inteligência financeira com leitura institucional, consenso de mercado e análise quantitativa.
        </p>

        <div className="anim-fadeup-3" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ToggleModo modoRapido={modoRapido} setModoRapido={setModoRapido} isMobile={isMobile} user={user} />
          <div style={{ width: "100%", maxWidth: "580px", marginBottom: "1rem", position: "relative", zIndex: mostrarSugestoes ? 99999 : "auto" }}>
            <form onSubmit={buscarAnalise}>
              <InputBuscaHero ticker={ticker} setTicker={setTicker} sugestoes={sugestoes} setSugestoes={setSugestoes} mostrarSugestoes={mostrarSugestoes} setMostrarSugestoes={setMostrarSugestoes} onBuscar={buscarAnalise} loading={loading} isMobile={isMobile} />
            </form>
          </div>
        </div>
      </div>

      {!secoes.length && !loading && (
        <div style={{ width: "100%", maxWidth: "900px", marginTop: isMobile ? "2rem" : "3rem", paddingTop: isMobile ? "1.5rem" : "2.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", position: "relative", zIndex: 1, paddingLeft: 0, paddingRight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem", justifyContent: "center" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.04)" }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "10px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em" }}>EXPLORAR POR INDICE</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.04)" }} />
          </div>
          <div style={{ pointerEvents: loading ? "none" : "auto", opacity: loading ? 0.4 : 1, transition: "opacity 0.2s" }}>
            <CategoriasExplorer onSelecionar={t => buscarAnalise(null, t)} categoriaAtiva={categoriaAtiva} setCategoriaAtiva={setCategoriaAtiva} filtro={filtro} setFiltro={setFiltro} />
          </div>
        </div>
      )}
    </section>
  );
}

function HeroLogado({ buscarAnalise, ticker, setTicker, sugestoes, setSugestoes, mostrarSugestoes, setMostrarSugestoes, modoRapido, setModoRapido, loading, isMobile, user, secoes, categoriaAtiva, setCategoriaAtiva, filtro, setFiltro }) {
  return (
    <section style={{position: "relative",overflow: "hidden",borderBottom: "1px solid rgba(255,255,255,0.05)",minHeight: "calc(100vh - 100px)",display: "flex",flexDirection: "column",alignItems: "center",justifyContent: "center",padding: isMobile ? "3rem 1rem 3rem" : "4rem 2rem 4rem"}}>
      <FundoAnimado />
      <div style={{position: "relative",zIndex: 10,display: "flex",flexDirection: "column",alignItems: "center",textAlign: "center",maxWidth: "720px",width: "100%",marginTop: isMobile ? "0" : "2rem"}} className="anim-fadeup">
        <h1 style={{fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",fontSize: isMobile ? "28px" : "44px",marginBottom: isMobile ? "2rem" : "2.5rem",marginTop: 0,fontWeight: 500,letterSpacing: "-0.035em",lineHeight: 1.1,background: "linear-gradient(120deg, rgba(255,255,255,0.95) 0%, rgba(167,243,208,0.95) 35%, rgba(52,211,153,0.85) 50%, rgba(167,243,208,0.95) 65%, rgba(255,255,255,0.95) 100%)",backgroundSize: "200% 100%",WebkitBackgroundClip: "text",backgroundClip: "text",WebkitTextFillColor: "transparent",color: "transparent",animation: "gradient-shift 8s ease-in-out infinite"}}>
          O que você quer analisar hoje?
        </h1>

        <div className="anim-fadeup-2" style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <ToggleModo modoRapido={modoRapido} setModoRapido={setModoRapido} isMobile={isMobile} user={user} mostrarTextoExplicativo={false} />
        </div>

        <div className="anim-fadeup-3" style={{width: "100%",maxWidth: "640px",marginBottom: "0.75rem",position: "relative",zIndex: mostrarSugestoes ? 99999 : "auto"}}>
          <form onSubmit={buscarAnalise}>
            <InputBuscaHero ticker={ticker} setTicker={setTicker} sugestoes={sugestoes} setSugestoes={setSugestoes} mostrarSugestoes={mostrarSugestoes} setMostrarSugestoes={setMostrarSugestoes} onBuscar={buscarAnalise} loading={loading} isMobile={isMobile} grande />
          </form>
        </div>

        <p style={{fontFamily: "'Inter', sans-serif",fontSize: "12px",color: "rgba(255,255,255,0.3)",margin: 0,lineHeight: 1.5,marginBottom: "1.5rem"}}>
          {modoRapido ? "Dados técnicos e fundamentalistas da B3" : "Consenso de analistas, preço-alvo e tese de mercado"}
        </p>
      </div>

      {!secoes.length && !loading && (
        <div style={{width: "100%",maxWidth: "900px",marginTop: isMobile ? "1.5rem" : "2.5rem",paddingTop: isMobile ? "1.5rem" : "2rem",borderTop: "1px solid rgba(255,255,255,0.05)",position: "relative",zIndex: 1}}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem", justifyContent: "center" }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.04)" }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "10px", color: "rgba(255,255,255,0.18)", letterSpacing: "0.12em" }}>EXPLORAR POR INDICE</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.04)" }} />
          </div>
          <div style={{ pointerEvents: loading ? "none" : "auto", opacity: loading ? 0.4 : 1, transition: "opacity 0.2s" }}>
            <CategoriasExplorer onSelecionar={t => buscarAnalise(null, t)} categoriaAtiva={categoriaAtiva} setCategoriaAtiva={setCategoriaAtiva} filtro={filtro} setFiltro={setFiltro} />
          </div>
        </div>
      )}
    </section>
  );
}

function SecoesMarketing({ isMobile }) {
  return (
    <>
      <section style={{ position: "relative", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(4,8,20,0.5)", padding: isMobile ? "2rem 1rem" : "clamp(2rem, 6vw, 5rem) 2.5rem", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 60% at 50% 0%, rgba(52,211,153,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "1100px", margin: "0 auto", overflowX: "hidden", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "10px", color: "rgba(52,211,153,0.4)", letterSpacing: "0.14em", display: "block", marginBottom: "0.75rem" }}>CONSENSUS INTELLIGENCE ENGINE</span>
            <h2 style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: "clamp(18px,4vw,34px)", letterSpacing: "-0.03em", color: "rgba(255,255,255,0.75)", lineHeight: 1.2 }}>
              O que o mercado <span style={{ color: "#34d399", fontWeight: 500 }}>está sinalizando agora</span>
            </h2>
          </div>
          <div style={{ display: isMobile ? "flex" : "grid", gridTemplateColumns: isMobile ? undefined : "1fr 1fr 1fr", gap: "1rem", flexDirection: isMobile ? "column" : undefined }}>
            <div style={{ background: "rgba(4,8,20,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "1.5rem", backdropFilter: "blur(12px)", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>HOW IT WORKS</div>
              {[
                { n: "01", t: "Coleta de dados", d: "Busca recomendacoes em tempo real de 15+ casas de analise" },
                { n: "02", t: "Sintese por IA", d: "Claude analisa e consolida as teses dos analistas" },
                { n: "03", t: "Score institucional", d: "Calcula consenso, upside e nivel de conviccao" },
                { n: "04", t: "Relatorio completo", d: "Entrega analise estruturada em segundos" }
              ].map(item => (
                <div key={item.n} style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "10px", borderRadius: "8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "10px", color: "rgba(52,211,153,0.4)", fontWeight: 600, minWidth: "20px", marginTop: "1px" }}>{item.n}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", marginBottom: "4px" }}>{item.t}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>{item.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(4,8,20,0.7)", border: "1px solid rgba(52,211,153,0.1)", borderRadius: "16px", padding: "1.25rem", backdropFilter: "blur(12px)" }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: "1rem" }}>MARKET STATS</div>
              {[
                ["Ativos cobertos", "847+", "#34d399"],
                ["Analistas monitorados", "15+", "rgba(255,255,255,0.6)"],
                ["Casas de analise", "12", "rgba(255,255,255,0.6)"],
                ["Atualizacao", "Continua", "#34d399"]
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{label}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "13px", fontWeight: 600, color }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(4,8,20,0.7)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "1.25rem", backdropFilter: "blur(12px)" }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: "1rem" }}>WHY IT WORKS</div>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: "1rem" }}>
                Inteligência financeira estruturada em múltiplas camadas, com base em consenso de mercado e análise quantitativa.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {["Consenso", "Quant", "Price Targets", "Fluxo", "Sentimento"].map(tag => (
                  <span key={tag} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "10px", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", padding: "4px 10px", borderRadius: "4px" }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ position: "relative", padding: isMobile ? "2rem 1rem" : "clamp(2rem, 6vw, 5rem) 2.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", background: "#040712", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(52,211,153,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid rgba(52,211,153,0.15)", background: "rgba(52,211,153,0.04)", borderRadius: "100px", padding: "5px 16px", marginBottom: "2rem" }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "10px", color: "rgba(52,211,153,0.6)", letterSpacing: "0.1em" }}>INSTITUTIONAL COVERAGE</span>
          </div>
          <h2 style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: "clamp(22px,2.8vw,32px)", letterSpacing: "-0.025em", color: "rgba(255,255,255,0.8)", marginBottom: "1rem", lineHeight: 1.2 }}>
            Inteligência de mercado <span style={{ color: "#34d399", fontWeight: 500 }}>estruturada em múltiplas camadas</span>
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.3)", marginBottom: "3rem", maxWidth: "480px", margin: "0 auto 3rem", lineHeight: 1.6 }}>
            Modelos quantitativos, consenso de mercado e leitura institucional organizados em uma estrutura analítica unificada.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: "1px", background: "rgba(255,255,255,0.05)", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)" }}>
            {["Consenso de Analistas", "Leitura Quantitativa", "Price Targets", "Sentimento de Mercado", "Momentum", "Valuation", "Fluxo Institucional", "Perspetiva Setorial", "Risco"].map((s, i) => (
              <div key={s} style={{ padding: "20px", background: "rgba(8,12,28,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.02em", transition: "all 0.2s", cursor: "default", borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.04)" : "none" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(52,211,153,0.04)"; e.currentTarget.style.color = "rgba(52,211,153,0.7)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(8,12,28,0.6)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
              >{s}</div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — HOME
// ═══════════════════════════════════════════════════════════════════════════

export default function Home() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [ticker, setTicker] = useState("");
  const [modoRapido, setModoRapido] = useState(true);
  const [analiseRapidaConcluida, setAnaliseRapidaConcluida] = useState(false);
  const [cardsAbertos, setCardsAbertos] = useState({
    fluxo: true,
    quant: true,
    fundamentalista: true,
    dividendos: true,
  });

  function toggleCardAnalise(id) {
    setCardsAbertos(prev => ({ ...prev, [id]: !prev[id] }));
  }

  const [tickerBusca, setTickerBusca] = useState("");
  const [sugestoesBusca, setSugestoesBusca] = useState([]);
  const [mostrarSugestoesBusca, setMostrarSugestoesBusca] = useState(false);
  const [mostrarFAB, setMostrarFAB] = useState(false);
  const [tickerAtual, setTickerAtual] = useState(null);
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [secoes, setSecoes] = useState([]);
  const [secoesVisiveis, setSecoesVisiveis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [faseAtual, setFaseAtual] = useState(null);
  const [erro, setErro] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [categoriaAtiva, setCategoriaAtiva] = useState("ibovespa");
  const [filtro, setFiltro] = useState("");
  const [categoriaAtivaPos, setCategoriaAtivaPos] = useState("ibovespa");
  const [filtroPos, setFiltroPos] = useState("");
  const [semaforoForcado, setSemaforoForcado] = useState(null);
  const [modalLimiteAberto, setModalLimiteAberto] = useState(false);

  const {
    adicionar: adicionarNaCarteira,
    estaNaCarteira,
    adicionando: adicionandoCarteira,
    user: usuarioCarteira,
  } = useWatchlist();

  const msgInterval = useRef(null);
  const resultadoRef = useRef(null);
  const analiseRef = useRef(null);
  const bufferRef = useRef("");
  const secoesParsRef = useRef([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
      setAuthChecked(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handlePageShow = () => {
      setErro("");
      setLoading(false);
      setFaseAtual(null);
      setMostrarSugestoes(false);
      setSugestoes([]);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    if (loading) {
      setMsgIndex(0);
      msgInterval.current = setInterval(() => { setMsgIndex(prev => (prev + 1) % MENSAGENS_LOADING.length); }, 2000);
      setTimeout(() => { analiseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 150);
    } else {
      clearInterval(msgInterval.current);
    }
    return () => clearInterval(msgInterval.current);
  }, [loading]);

  useEffect(() => {
    if (secoes.length > 0 && !loading) {
      setTimeout(() => {
        analiseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [secoes.length, loading]);

  useEffect(() => {
    if (!secoes.length) { setMostrarFAB(false); return; }
    const checkScroll = () => setMostrarFAB(window.scrollY > 800);
    window.addEventListener("scroll", checkScroll);
    checkScroll();
    return () => window.removeEventListener("scroll", checkScroll);
  }, [secoes.length]);

  function rolarParaBuscaTopo() {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => {
      const input = document.querySelector(".hero-input");
      if (input) input.focus();
    }, 600);
  }

  const processarBufferProgressivo = useCallback((buffer) => {
    const parsed = parsearSecoes(buffer);
    if (!parsed.length) return;
    const prevCount = secoesParsRef.current.length;
    if (parsed.length > prevCount) {
      secoesParsRef.current = parsed;
      setSecoes([...parsed]);
      for (let i = prevCount; i < parsed.length; i++) {
        const idx = i;
        setTimeout(() => {
          setSecoesVisiveis(prev => prev.includes(idx) ? prev : [...prev, idx]);
        }, (idx - prevCount) * 120);
      }
    } else {
      secoesParsRef.current = parsed;
      setSecoes([...parsed]);
    }
  }, []);

  async function buscarAnalise(e, tickerOverride, forcarCompleta = false) {
    if (e) e.preventDefault();
    if (loading) {
      setErro("Aguarde a análise atual terminar antes de iniciar outra.");
      setTimeout(() => setErro(""), 3000);
      return;
    }
    const t = (tickerOverride || ticker).trim().toUpperCase();
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!t) return;
    if (!TICKERS_PERMITIDOS.has(t)) { setErro('"' + t + '" nao esta disponivel.'); return; }

    const usarModoRapido = modoRapido && !forcarCompleta;

    if (!usarModoRapido && !u) {
      setErro("🎁 Crie sua conta grátis em 30s pra desbloquear a análise avançada — redirecionando...");
      setLoading(false);
      setTimeout(() => { window.location.href = "/cadastro"; }, 2500);
      return;
    }

    if (usarModoRapido && !u) {
      const consultasAnonimas = Number(localStorage.getItem("consultas_anonimas") || "0");
      if (consultasAnonimas >= 3) {
        setLoading(false);
        window.location.href = "/cadastro?origem=limite";
        return;
      }
      localStorage.setItem("consultas_anonimas", String(consultasAnonimas + 1));
    }

    setTicker(t); setLoading(true); setTickerAtual(t);
    setSecoes([]); setSecoesVisiveis([]); setErro(""); setSemaforoForcado(null);
    setAnaliseRapidaConcluida(false);
    bufferRef.current = ""; secoesParsRef.current = [];

    if (usarModoRapido) {
      setFaseAtual("rapido");
      track("analise_solicitada", { ticker: t, usuario: u ? "logado" : "anonimo", modo: "rapido" });
      supabase.from("analises_publicas").insert({
        ticker: t,
        user_type: u ? "logado" : "anonimo",
        user_id: u?.id || null,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : null,
      }).then(() => {}).catch(() => {});

      let nomeEmpresa = "", precoStr = "", variacaoStr = "", dataStr = "";
      try {
        const brapiToken = process.env.NEXT_PUBLIC_BRAPI_TOKEN || "";
        const respBrapi = await fetch(`https://brapi.dev/api/quote/${t}?token=${brapiToken}`);
        if (respBrapi.ok) {
          const dados = await respBrapi.json();
          if (dados.results && dados.results.length > 0) {
            const ativo = dados.results[0];
            nomeEmpresa = ativo.longName || ativo.shortName || "";
            const variacaoNum = ativo.regularMarketChangePercent || 0;
            const sinal = variacaoNum >= 0 ? "+" : "";
            variacaoStr = `${sinal}${variacaoNum.toFixed(2).replace(".", ",")}%`;
            const isUS = t.endsWith("34") || /^[A-Z]+$/.test(t);
            const moeda = isUS ? "US$" : "R$";
            precoStr = `${moeda} ${(ativo.regularMarketPrice || 0).toFixed(2).replace(".", ",")}`;
            dataStr = new Date().toLocaleDateString("pt-BR");
          }
        }
      } catch (err) {
        console.warn("Erro ao buscar cotação:", err);
      }

      const tituloCabecalho = nomeEmpresa ? `${t} — ${nomeEmpresa}` : t;
      const tipoAtivo = t.endsWith("11") ? "FII" : (t.endsWith("34") || /^[A-Z]+$/.test(t)) ? "BDR" : "Ação B3";
      const corpoCabecalho = precoStr ? `**Tipo de ativo:** ${tipoAtivo}\n**Preço atual:** ${precoStr} ${variacaoStr} · ${dataStr}` : `**Tipo de ativo:** ${tipoAtivo}`;
      const cabecalhoMinimo = { tipo: "cabecalho", titulo: tituloCabecalho, corpo: corpoCabecalho };

      secoesParsRef.current = [cabecalhoMinimo];
      setSecoes([cabecalhoMinimo]);
      setSecoesVisiveis([0]);

      if (u) {
        await supabase.from("historico_consultas").insert({ user_id: u.id, ticker: t, nome: nomeEmpresa });
      }

      setTimeout(() => {
        setLoading(false);
        setFaseAtual(null);
        setAnaliseRapidaConcluida(true);
      }, 800);
      return;
    }

    setFaseAtual("coletando");
    track("analise_solicitada", { ticker: t, usuario: u ? "logado" : "anonimo", modo: "completa" });
    supabase.from("analises_publicas").insert({
      ticker: t,
      user_type: u ? "logado" : "anonimo",
      user_id: u?.id || null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 200) : null,
    }).then(() => {}).catch(() => {});

    if (!usarModoRapido && u) {
      const { data: profile, error: profileError } = await supabase.from("profiles").select("consultas_usadas, limite_consultas, ultima_consulta, plano").eq("id", u.id).single();
      if (profileError) { setErro("Erro ao verificar limite."); setLoading(false); return; }
      const hoje = new Date().toISOString().split("T")[0];
      const ultimaConsulta = profile.ultima_consulta ? new Date(profile.ultima_consulta).toISOString().split("T")[0] : null;
      if (ultimaConsulta !== hoje) {
        await supabase.from("profiles").update({ consultas_usadas: 0, ultima_consulta: new Date().toISOString() }).eq("id", u.id);
        profile.consultas_usadas = 0;
      }
      if (profile.consultas_usadas >= profile.limite_consultas) {
        setModalLimiteAberto(true);
        setLoading(false);
        return;
      }
      await supabase.from("profiles").update({ consultas_usadas: profile.consultas_usadas + 1 }).eq("id", u.id);
    }

    try {
      const response = await fetch("/api/analisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: t }),
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.replace("data: ", "");
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) { bufferRef.current += parsed.text; processarBufferProgressivo(bufferRef.current); }
            if (parsed.fase === "coletando") setFaseAtual("coletando");
            if (parsed.fase === "cache_hit")  setFaseAtual("cache_hit");
            if (parsed.fase === "gerando")    setFaseAtual("gerando");
            if (parsed.error) setErro(parsed.error);
            if (parsed.semaforo) setSemaforoForcado(parsed.semaforo);
          } catch {}
        }
      }
      const secoesFinais = parsearSecoes(bufferRef.current);
      secoesParsRef.current = secoesFinais;
      setSecoes([...secoesFinais]);
      setSecoesVisiveis(secoesFinais.map((_, i) => i));
      if (u) {
        const cabecalho = secoesFinais.find(s => s.tipo === "cabecalho");
        const nomeEmpresa = cabecalho?.titulo?.split("—")?.[1]?.trim() || "";
        await supabase.from("historico_consultas").insert({ user_id: u.id, ticker: t, nome: nomeEmpresa });
      }
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#040712", color: "#fff", fontFamily: "'Inter',sans-serif", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes scan { 0%{top:0%;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes grid-breathe { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes ticker-scroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes gradient-shift { 0%,100%{background-position:0% 50%} 50%{background-position:100% 50%} }
        .anim-fadeup { animation: fadeUp 0.7s ease forwards; }
        .anim-fadeup-2 { animation: fadeUp 0.7s ease 0.15s forwards; opacity:0; }
        .anim-fadeup-3 { animation: fadeUp 0.7s ease 0.3s forwards; opacity:0; }
        .hero-input { outline:none; background:transparent; color:#fff; width:100%; font-size:15px; font-family:'IBM Plex Mono',monospace; letter-spacing:0.05em; }
        .hero-input::placeholder { color:rgba(255,255,255,0.2); }
        .search-wrap:focus-within { border-color:rgba(52,211,153,0.45)!important; box-shadow:0 0 0 1px rgba(52,211,153,0.15),0 0 50px rgba(52,211,153,0.1),inset 0 1px 0 rgba(255,255,255,0.06)!important; background:rgba(4,8,22,0.95)!important; }
        @media (max-width: 600px) {
          .search-wrap { flex-direction: column !important; padding: 12px !important; gap: 10px !important; align-items: stretch !important; border-radius: 16px !important; }
          .search-wrap .search-prefix { display: none !important; }
          .search-wrap input { font-size: 15px !important; padding: 4px 0 !important; }
          .search-wrap button { height: 48px !important; padding: 0 !important; font-size: 12px !important; letter-spacing: 0.12em !important; border-radius: 10px !important; width: 100% !important; flex-shrink: 0 !important; }
        }
        .scanline { position:absolute; left:0; right:0; height:1px; background:linear-gradient(90deg,transparent,rgba(52,211,153,0.25),transparent); animation:scan 10s linear infinite; pointer-events:none; }
        .ticker-animation { animation:ticker-scroll 40s linear infinite; }
        .ticker-animation:hover { animation-play-state:paused; }

        /* Numeração discreta entre cards de análise */
        .card-numero {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          color: rgba(52,211,153,0.35);
          letter-spacing: 0.18em;
          text-align: center;
          padding: 6px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .card-numero::before, .card-numero::after {
          content: '';
          flex: 1;
          max-width: 60px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(52,211,153,0.15), transparent);
        }

        /* Separação visual entre cards de análise (sem mexer em outros arquivos) */
        .relatorio-resultados > * {
          position: relative;
        }
        /* Adiciona uma marca lateral verde no início de cada card direto */
        .relatorio-resultados > div[class*="rounded"],
        .relatorio-resultados > div[style*="border"] {
          scroll-margin-top: 90px;
        }
        @media (max-width: 640px) { * { max-width: 100%; box-sizing: border-box; } }
      `}</style>

      {/* PARTÍCULAS DE FUNDO — atrás de tudo */}
      <ParticulasFundo />

      <TickerTape />

      <main className="relative" style={{ overflowX: "hidden", position: "relative", zIndex: 1 }}>

        {modalLimiteAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-green-500/30 bg-[#070b12] p-6 shadow-2xl">
              <div className="mb-4 inline-flex rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-green-400">Limite gratuito atingido</div>
              <h2 className="text-2xl font-black text-white mb-3">Voce usou suas analises gratuitas de hoje</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-5">Volte amanha gratuitamente ou libere o Plano Premium com ate 50 analises por dia.</p>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-5 space-y-2 text-sm text-gray-300">
                <p>Ate 50 analises por dia</p><p>Consenso consolidado dos analistas</p>
                <p>Preco-alvo, upside e tese resumida</p><p>Plano mensal por R$49,90</p>
              </div>
              <a href="https://wa.me/5551991282389?text=Quero%20assinar%20o%20Plano%20Premium" target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center rounded-xl bg-green-500 px-5 py-4 text-sm font-black text-black transition hover:bg-green-400">Liberar Premium no WhatsApp</a>
              <button type="button" onClick={() => setModalLimiteAberto(false)} className="mt-3 w-full rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-gray-400 transition hover:bg-white/5 hover:text-white">Continuar no plano gratis</button>
            </div>
          </div>
        )}

        {authChecked && (
          user ? (
            <HeroLogado buscarAnalise={buscarAnalise} ticker={ticker} setTicker={setTicker} sugestoes={sugestoes} setSugestoes={setSugestoes} mostrarSugestoes={mostrarSugestoes} setMostrarSugestoes={setMostrarSugestoes} modoRapido={modoRapido} setModoRapido={setModoRapido} loading={loading} isMobile={isMobile} user={user} secoes={secoes} categoriaAtiva={categoriaAtiva} setCategoriaAtiva={setCategoriaAtiva} filtro={filtro} setFiltro={setFiltro} />
          ) : (
            <HeroDeslogado buscarAnalise={buscarAnalise} ticker={ticker} setTicker={setTicker} sugestoes={sugestoes} setSugestoes={setSugestoes} mostrarSugestoes={mostrarSugestoes} setMostrarSugestoes={setMostrarSugestoes} modoRapido={modoRapido} setModoRapido={setModoRapido} loading={loading} isMobile={isMobile} user={user} secoes={secoes} categoriaAtiva={categoriaAtiva} setCategoriaAtiva={setCategoriaAtiva} filtro={filtro} setFiltro={setFiltro} />
          )
        )}

        {loading && secoes.length === 0 && (
          <div ref={analiseRef} className="max-w-4xl mx-auto px-6 py-10" style={{ scrollMarginTop: "80px" }}>
            <div style={{ background: "rgba(6,10,24,0.9)", borderRadius: "20px", padding: "2.5rem 2rem", border: "1px solid rgba(52,211,153,0.1)", backdropFilter: "blur(20px)", boxShadow: "0 0 60px rgba(52,211,153,0.04), 0 40px 80px rgba(0,0,0,0.4)" }}>
              <div className="flex flex-col items-center gap-6">
                <div style={{ position: "relative", width: "56px", height: "56px" }}>
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1px solid rgba(52,211,153,0.1)" }} />
                  <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "1.5px solid transparent", borderTopColor: "#34d399", animation: "spin 1.2s linear infinite" }} />
                  <div style={{ position: "absolute", inset: "6px", borderRadius: "50%", border: "1px solid transparent", borderBottomColor: "rgba(52,211,153,0.3)", animation: "spin 0.9s linear infinite reverse" }} />
                  <div style={{ position: "absolute", inset: "14px", borderRadius: "50%", background: "rgba(52,211,153,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#34d399", animation: "pulse-dot 1.5s ease infinite" }} />
                  </div>
                </div>
                <div className="text-center">
                  <p style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: "18px", color: "rgba(255,255,255,0.9)", letterSpacing: "-0.02em" }}>Analisando <span style={{ color: "#34d399", fontFamily: "'IBM Plex Mono',monospace", fontSize: "17px" }}>{ticker}</span></p>
                  {faseAtual === "cache_hit" && <p className="text-green-400 text-sm mt-1">Dados em cache — relatorio em instantes</p>}
                  {faseAtual === "coletando" && <p className="text-gray-400 text-sm mt-1">Pesquisando analistas e dados de mercado — pode levar ate 45 segundos</p>}
                  {faseAtual === "gerando" && <p className="text-green-400 text-sm mt-1">Dados coletados — gerando o relatorio agora</p>}
                </div>
                {faseAtual === "coletando" && (
                  <div style={{ width: "100%", background: "rgba(4,7,18,0.8)", border: "1px solid rgba(52,211,153,0.1)", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", minHeight: "40px" }}>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", color: "rgba(52,211,153,0.4)", flexShrink: 0 }}>$</span>
                    <p key={msgIndex} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "11px", color: "rgba(52,211,153,0.65)", letterSpacing: "0.02em", margin: 0 }}>{MENSAGENS_LOADING[msgIndex]}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {loading && secoes.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 md:px-6 pt-6">
            <div className="bg-green-950/30 border border-green-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-3 h-3 rounded-full border-2 border-green-500 border-t-transparent animate-spin flex-shrink-0" />
              <p className="text-green-400 text-sm font-medium">Gerando proximas secoes...</p>
            </div>
          </div>
        )}

        {erro && (
          <div className="max-w-4xl mx-auto px-6 mt-6">
            <div className="rounded-2xl border border-green-500/30 bg-green-950/20 p-5 relative">
              <button onClick={() => setErro("")} style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", width: "28px", height: "28px", borderRadius: "50%", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1, transition: "all 0.15s" }} aria-label="Fechar">×</button>
              <p className="text-white font-bold mb-2 pr-8">Atenção</p>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">{erro}</p>
              <a href="https://wa.me/5551991282389?text=Quero%20assinar%20o%20Plano%20Premium" target="_blank" rel="noopener noreferrer" className="inline-flex w-full justify-center rounded-xl bg-green-500 px-5 py-3 text-sm font-black text-black hover:bg-green-400 transition">Liberar Plano Premium no WhatsApp</a>
            </div>
          </div>
        )}

        {/* RESULTADOS — usa RelatorioIA com numeração entre cards */}
        {secoes.length > 0 && (
          <div ref={analiseRef} style={{ position: "relative", minHeight: "100vh", scrollMarginTop: "80px" }}>
            <div ref={resultadoRef} className="max-w-4xl mx-auto px-4 md:px-6 pb-8 pt-6 relatorio-resultados" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              <RelatorioIA
                secoes={secoes}
                secoesVisiveis={secoesVisiveis}
                semaforo={semaforoForcado}
                tickerAtual={tickerAtual}
                cardsAbertos={cardsAbertos}
                onToggleCard={toggleCardAnalise}
              />

              {!loading && (
                <>
                  {analiseRapidaConcluida && tickerAtual && (
                    <div style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.06) 0%, rgba(96,165,250,0.06) 100%)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: "16px", padding: "24px 20px", textAlign: "center", marginTop: "1rem", marginBottom: "1rem" }}>
                      <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>
                        <Icon name="chart-bar" size={28} color="#34d399" />
                      </div>
                      <h3 style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: "18px", color: "rgba(255,255,255,0.95)", marginBottom: "8px", letterSpacing: "-0.02em" }}>Quer ir mais fundo?</h3>
                      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: "1.25rem", maxWidth: "420px", margin: "0 auto 1.25rem" }}>
                        Acesse uma leitura aprofundada com consenso de analistas, recomendações, preço-alvo e tese consolidada de mercado.
                      </p>
                      <button onClick={() => { setAnaliseRapidaConcluida(false); buscarAnalise(null, tickerAtual, true); }} disabled={loading}
                        style={{ background: "linear-gradient(135deg, #34d399 0%, #059669 100%)", color: "#000", border: "none", padding: "14px 28px", borderRadius: "12px", fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: "12px", letterSpacing: "0.12em", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 0 24px rgba(52,211,153,0.25)", transition: "all 0.2s", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <span>▼</span>
                        <span>GERAR ANÁLISE AVANÇADA (~45s)</span>
                      </button>
                      <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "10px", color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em", marginTop: "12px" }}>CONSENSO + RECOMENDAÇÕES + PREÇO-ALVO</p>
                    </div>
                  )}

                  {tickerAtual && (
                    <BotaoAdicionarCarteira ticker={tickerAtual} jaEsta={estaNaCarteira(tickerAtual)} adicionando={adicionandoCarteira} logado={!!usuarioCarteira} onAdicionar={() => adicionarNaCarteira(tickerAtual)} />
                  )}

                  <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "10px", color: "rgba(255,255,255,0.12)", textAlign: "center", paddingTop: "1rem", lineHeight: 1.7, letterSpacing: "0.02em" }}>
                    Esta analise possui carater informativo e educacional, baseada em dados publicos e consenso recente de mercado. Nao constitui recomendacao individualizada de investimento.
                  </p>

                  <MiniBuscaFinal ticker={tickerBusca} setTicker={setTickerBusca} sugestoes={sugestoesBusca} setSugestoes={setSugestoesBusca} mostrarSugestoes={mostrarSugestoesBusca} setMostrarSugestoes={setMostrarSugestoesBusca}
                    onBuscar={(e) => { e.preventDefault(); setMostrarSugestoesBusca(false); buscarAnalise(null, tickerBusca); setTickerBusca(""); }}
                    loading={loading} isMobile={isMobile} />

                  <div style={{ background: "rgba(6,10,24,0.8)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "1.5rem", backdropFilter: "blur(12px)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: "10px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>EXPLORAR OUTRO ATIVO</span>
                      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.04)" }} />
                    </div>
                    <div style={{ pointerEvents: loading ? "none" : "auto", opacity: loading ? 0.4 : 1, transition: "opacity 0.2s" }}>
                      <CategoriasExplorer onSelecionar={t => { setTicker(t); buscarAnalise(null, t); }} categoriaAtiva={categoriaAtivaPos} setCategoriaAtiva={setCategoriaAtivaPos} filtro={filtroPos} setFiltro={setFiltroPos} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {authChecked && !user && !secoes.length && !loading && (
          <SecoesMarketing isMobile={isMobile} />
        )}

        <BuscaFlutuante visivel={mostrarFAB && !loading} onClick={rolarParaBuscaTopo} />
      </main>
    </div>
  );
}
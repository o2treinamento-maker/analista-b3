"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

function CadastroConteudo() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [cadastroConcluido, setCadastroConcluido] = useState(false);

  // 🎯 Copy dinâmico baseado em como o usuário chegou aqui
  const searchParams = useSearchParams();
  const origem = searchParams.get("origem");

  const COPY = {
    limite: {
      badge: "CONSULTA GRÁTIS UTILIZADA",
      titulo: "Continue sua análise",
      destaque: "50 Análises Rápidas por dia  - 3 Análises Avançadas por dia ",
      subtituloAntes: "Você gostou? Crie uma conta grátis e libere ",
      subtituloDepois: " — sem cartão.",
    },
    avancada: {
      badge: "ANÁLISE AVANÇADA",
      titulo: "Desbloqueie a análise avançada",
      destaque: "consenso de analistas, preço-alvo e tese",
      subtituloAntes: "Cadastro grátis em 30s libera ",
      subtituloDepois: " de mercado.",
    },
    default: {
      badge: "GRÁTIS · SEM CARTÃO",
      titulo: "Crie sua conta",
      destaque: "50 Análises Rápidas por dia - 3 Análises Avançadas por dia",
      subtituloAntes: "",
      subtituloDepois: ", sem cartão de crédito. Cadastro em 30 segundos.",
    },
  };

  const copy = COPY[origem] || COPY.default;

  async function handleCadastro(e) {
    e.preventDefault();
    setLoading(true);
    setMensagem("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    // Erro explícito do Supabase (ex: senha fraca, email inválido)
    if (error) {
      setMensagem(error.message);
      setLoading(false);
      return;
    }

    // 🔒 BLINDAGEM: detecta "email já cadastrado"
    // Supabase finge sucesso pra proteger privacidade (anti-enumeration).
    // Quando email já existe, retorna user com identities = [] (array vazio).
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      setMensagem("Esse email já está cadastrado. Faça login ou recupere sua senha.");
      setLoading(false);
      return;
    }

    setCadastroConcluido(true);
    setLoading(false);
  }

  if (cadastroConcluido) {
    return (
      <div style={{minHeight:"100vh",background:"#040712",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",fontFamily:"'Inter',sans-serif"}}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@700;800&family=Inter:wght@300;400;500;600&display=swap');
          @keyframes glow-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          .card-confirm { animation: fadeUp 0.5s ease forwards; }
        `}</style>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 40%, rgba(52,211,153,0.07) 0%, transparent 60%)",pointerEvents:"none",filter:"blur(40px)",animation:"glow-pulse 7s ease-in-out infinite"}} />
        <div className="card-confirm" style={{position:"relative",background:"rgba(4,8,20,0.95)",border:"1px solid rgba(52,211,153,0.2)",borderRadius:"20px",padding:"2.5rem 2rem",width:"100%",maxWidth:"420px",textAlign:"center",boxShadow:"0 0 60px rgba(52,211,153,0.06), inset 0 1px 0 rgba(255,255,255,0.05)",backdropFilter:"blur(20px)"}}>
          {/* Icone */}
          <div style={{width:"52px",height:"52px",borderRadius:"14px",background:"rgba(52,211,153,0.08)",border:"1px solid rgba(52,211,153,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"22px",margin:"0 auto 1.25rem"}}>✉️</div>

          <div style={{display:"inline-flex",alignItems:"center",gap:"6px",border:"1px solid rgba(52,211,153,0.2)",background:"rgba(52,211,153,0.06)",borderRadius:"100px",padding:"4px 14px",marginBottom:"1.25rem"}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#34d399",letterSpacing:"0.1em",fontWeight:600}}>EMAIL ENVIADO</span>
          </div>

          <h1 style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:"22px",color:"rgba(255,255,255,0.95)",letterSpacing:"-0.02em",marginBottom:"0.75rem",lineHeight:1.2}}>
            Confirme sua conta
          </h1>
          <p style={{fontSize:"14px",color:"rgba(255,255,255,0.4)",lineHeight:1.65,marginBottom:"1.25rem"}}>
            Enviamos um link de confirmacao para:
          </p>

          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"10px",padding:"12px 16px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"13px",color:"rgba(255,255,255,0.7)",marginBottom:"1.25rem",wordBreak:"break-all"}}>
            {email}
          </div>

          <p style={{fontSize:"13px",color:"rgba(255,255,255,0.35)",lineHeight:1.65,marginBottom:"1.75rem"}}>
            Abra seu email, clique no link de confirmacao e depois volte para fazer login.
          </p>

          <Link href="/login" style={{display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(52,211,153,0.12)",border:"1px solid rgba(52,211,153,0.3)",color:"#34d399",padding:"13px 20px",borderRadius:"12px",textDecoration:"none",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"11px",letterSpacing:"0.12em",boxShadow:"0 0 20px rgba(52,211,153,0.1)",transition:"all 0.2s"}}>
            IR PARA LOGIN →
          </Link>

          <p style={{marginTop:"1.25rem",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.04em"}}>
            Nao encontrou? Verifique spam ou promocoes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#040712",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",fontFamily:"'Inter',sans-serif",color:"#fff"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@700;800&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes glow-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .cadastro-card { animation: fadeUp 0.5s ease forwards; }
        .vektor-input { width:100%; background:rgba(4,8,20,0.8); border:1px solid rgba(255,255,255,0.08); color:#fff; padding:14px 16px; border-radius:12px; font-size:14px; font-family:'IBM Plex Mono',monospace; outline:none; transition:border-color 0.2s, box-shadow 0.2s; box-sizing:border-box; }
        .vektor-input::placeholder { color:rgba(255,255,255,0.2); }
        .vektor-input:focus { border-color:rgba(52,211,153,0.4); box-shadow:0 0 0 1px rgba(52,211,153,0.1), 0 0 20px rgba(52,211,153,0.06); }
      `}</style>

      {/* Glow fundo */}
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 40%, rgba(52,211,153,0.06) 0%, transparent 60%)",pointerEvents:"none",filter:"blur(50px)",animation:"glow-pulse 7s ease-in-out infinite"}} />

      {/* Header minimo */}
      <a href="/" style={{position:"fixed",top:"20px",left:"24px",display:"flex",alignItems:"center",gap:"8px",textDecoration:"none",zIndex:10}}>
        <div style={{width:"26px",height:"26px",borderRadius:"6px",background:"linear-gradient(135deg,#34d399 0%,#059669 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"12px",color:"#000",boxShadow:"0 0 12px rgba(52,211,153,0.3)"}}>Q</div>
        <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"15px",color:"rgba(255,255,255,0.7)",letterSpacing:"-0.02em"}}>QYNTOR</span>
      </a>

      <div className="cadastro-card" style={{position:"relative",background:"rgba(4,8,20,0.95)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"20px",padding:"2.5rem 2rem",width:"100%",maxWidth:"420px",boxShadow:"0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",backdropFilter:"blur(20px)"}}>

        {/* Badge — dinâmico baseado na origem */}
        <div style={{display:"inline-flex",alignItems:"center",gap:"6px",border:"1px solid rgba(52,211,153,0.2)",background:"rgba(52,211,153,0.06)",borderRadius:"100px",padding:"4px 12px",marginBottom:"1.25rem"}}>
          <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 2s ease infinite"}} />
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#34d399",letterSpacing:"0.1em",fontWeight:600}}>{copy.badge}</span>
        </div>

        <h1 style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:"22px",color:"rgba(255,255,255,0.95)",letterSpacing:"-0.02em",marginBottom:"0.6rem",lineHeight:1.2}}>
          {copy.titulo}
        </h1>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.4)",lineHeight:1.65,marginBottom:"2rem"}}>
          {copy.subtituloAntes}
          <span style={{color:"rgba(52,211,153,0.8)",fontWeight:600}}>{copy.destaque}</span>
          {copy.subtituloDepois}
        </p>

        <form onSubmit={handleCadastro} style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          <input
            type="email"
            placeholder="Seu email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="vektor-input"
            required
          />
          <input
            type="password"
            placeholder="Crie uma senha"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            className="vektor-input"
            required
          />

          <button
            type="submit"
            disabled={loading}
            style={{background:loading?"rgba(255,255,255,0.04)":"rgba(52,211,153,0.12)",border:"1px solid "+(loading?"rgba(255,255,255,0.06)":"rgba(52,211,153,0.3)"),color:loading?"rgba(255,255,255,0.3)":"#34d399",padding:"14px 20px",borderRadius:"12px",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"11px",letterSpacing:"0.12em",cursor:loading?"not-allowed":"pointer",boxShadow:loading?"none":"0 0 20px rgba(52,211,153,0.1)",transition:"all 0.2s",marginTop:"4px"}}
            onMouseEnter={e=>{ if(!loading){e.currentTarget.style.background="rgba(52,211,153,0.2)";e.currentTarget.style.boxShadow="0 0 28px rgba(52,211,153,0.2)";} }}
            onMouseLeave={e=>{ if(!loading){e.currentTarget.style.background="rgba(52,211,153,0.12)";e.currentTarget.style.boxShadow="0 0 20px rgba(52,211,153,0.1)";} }}>
            {loading ? "CRIANDO CONTA..." : "CRIAR CONTA GRÁTIS →"}
          </button>
        </form>

        {mensagem && (
          <div style={{marginTop:"1rem",padding:"10px 14px",background:"rgba(248,113,113,0.06)",border:"1px solid rgba(248,113,113,0.15)",borderRadius:"8px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:"rgba(248,113,113,0.7)",textAlign:"center"}}>
            {mensagem}
          </div>
        )}

        {/* Separador */}
        <div style={{display:"flex",alignItems:"center",gap:"12px",margin:"1.5rem 0"}}>
          <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.05)"}} />
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"0.06em"}}>OU</span>
          <div style={{flex:1,height:"1px",background:"rgba(255,255,255,0.05)"}} />
        </div>

        <p style={{textAlign:"center",fontSize:"13px",color:"rgba(255,255,255,0.35)"}}>
          Ja tem conta?{" "}
          <Link href="/login" style={{color:"rgba(52,211,153,0.7)",fontWeight:600,textDecoration:"none",transition:"color 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.color="#34d399"}
            onMouseLeave={e=>e.currentTarget.style.color="rgba(52,211,153,0.7)"}>
            Entrar
          </Link>
        </p>

        {/* Info planos */}
        <div style={{marginTop:"1.5rem",padding:"12px 14px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:"10px",display:"flex",alignItems:"flex-start",gap:"10px"}}>
          <span style={{fontSize:"13px",marginTop:"1px",flexShrink:0}}>🔒</span>
          <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.2)",lineHeight:1.6,margin:0,letterSpacing:"0.02em"}}>
            Conta gratis: 3 analises/dia. Plano Premium R$49,90/mes para analises ilimitadas.{" "}
            <Link href="/planos" style={{color:"rgba(52,211,153,0.4)",textDecoration:"none"}}>Ver planos</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={
      <div style={{minHeight:"100vh",background:"#040712",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{color:"rgba(255,255,255,0.4)",fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px"}}>Carregando...</div>
      </div>
    }>
      <CadastroConteudo />
    </Suspense>
  );
}
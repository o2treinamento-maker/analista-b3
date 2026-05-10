"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [mensagemTipo, setMensagemTipo] = useState("erro"); // "erro" | "info"

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMensagem("");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setMensagemTipo("erro");
      setMensagem("Email ou senha invalidos.");
      setLoading(false);
      return;
    }

    if (!data.user.email_confirmed_at) {
      await supabase.auth.signOut();
      setMensagemTipo("info");
      setMensagem("Confirme seu email antes de acessar. Verifique sua caixa de entrada.");
      setLoading(false);
      return;
    }

    router.push("/");
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:"#040712",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",fontFamily:"'Inter',sans-serif",color:"#fff"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@700;800&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes glow-pulse { 0%,100%{opacity:0.3} 50%{opacity:0.7} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .login-card { animation: fadeUp 0.5s ease forwards; }
        .vektor-input { width:100%; background:rgba(4,8,20,0.8); border:1px solid rgba(255,255,255,0.08); color:#fff; padding:14px 16px; border-radius:12px; font-size:14px; font-family:'IBM Plex Mono',monospace; outline:none; transition:border-color 0.2s, box-shadow 0.2s; box-sizing:border-box; }
        .vektor-input::placeholder { color:rgba(255,255,255,0.2); }
        .vektor-input:focus { border-color:rgba(52,211,153,0.4); box-shadow:0 0 0 1px rgba(52,211,153,0.1), 0 0 20px rgba(52,211,153,0.06); }
      `}</style>

      {/* Glow fundo */}
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 40%, rgba(52,211,153,0.06) 0%, transparent 60%)",pointerEvents:"none",filter:"blur(50px)",animation:"glow-pulse 7s ease-in-out infinite"}} />

      {/* Logo */}
      <a href="/" style={{position:"fixed",top:"20px",left:"24px",display:"flex",alignItems:"center",gap:"8px",textDecoration:"none",zIndex:10}}>
        <div style={{width:"26px",height:"26px",borderRadius:"6px",background:"linear-gradient(135deg,#34d399 0%,#059669 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"12px",color:"#000",boxShadow:"0 0 12px rgba(52,211,153,0.3)"}}>V</div>
        <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"15px",color:"rgba(255,255,255,0.7)",letterSpacing:"-0.02em"}}>VEKTOR</span>
      </a>

      <div className="login-card" style={{position:"relative",background:"rgba(4,8,20,0.95)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"20px",padding:"2.5rem 2rem",width:"100%",maxWidth:"420px",boxShadow:"0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",backdropFilter:"blur(20px)"}}>

        {/* Badge */}
        <div style={{display:"inline-flex",alignItems:"center",gap:"6px",border:"1px solid rgba(52,211,153,0.2)",background:"rgba(52,211,153,0.06)",borderRadius:"100px",padding:"4px 12px",marginBottom:"1.25rem"}}>
          <div style={{width:"5px",height:"5px",borderRadius:"50%",background:"#34d399",animation:"pulse-dot 2s ease infinite"}} />
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"#34d399",letterSpacing:"0.1em",fontWeight:600}}>ACESSE SUA CONTA</span>
        </div>

        <h1 style={{fontFamily:"'Inter',sans-serif",fontWeight:700,fontSize:"22px",color:"rgba(255,255,255,0.95)",letterSpacing:"-0.02em",marginBottom:"0.6rem",lineHeight:1.2}}>
          Entrar no VEKTOR
        </h1>
        <p style={{fontSize:"13px",color:"rgba(255,255,255,0.4)",lineHeight:1.65,marginBottom:"2rem"}}>
          Faca login para usar suas{" "}
          <span style={{color:"rgba(52,211,153,0.7)",fontWeight:600}}>consultas diarias</span>.
        </p>

        <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:"12px"}}>
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
            placeholder="Sua senha"
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
            {loading ? "ENTRANDO..." : "ENTRAR →"}
          </button>
        </form>

        {/* Mensagem erro/info */}
        {mensagem && (
          <div style={{marginTop:"1rem",padding:"10px 14px",background:mensagemTipo==="info"?"rgba(251,191,36,0.06)":"rgba(248,113,113,0.06)",border:"1px solid "+(mensagemTipo==="info"?"rgba(251,191,36,0.18)":"rgba(248,113,113,0.15)"),borderRadius:"8px",fontFamily:"'IBM Plex Mono',monospace",fontSize:"11px",color:mensagemTipo==="info"?"rgba(251,191,36,0.8)":"rgba(248,113,113,0.7)",textAlign:"center",lineHeight:1.5}}>
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
          Ainda nao tem conta?{" "}
          <Link href="/cadastro" style={{color:"rgba(52,211,153,0.7)",fontWeight:600,textDecoration:"none",transition:"color 0.2s"}}
            onMouseEnter={e=>e.currentTarget.style.color="#34d399"}
            onMouseLeave={e=>e.currentTarget.style.color="rgba(52,211,153,0.7)"}>
            Criar conta gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
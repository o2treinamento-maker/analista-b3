"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    if (!email.trim()) {
      setErro("Digite seu email.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setLoading(false);

    if (error) {
      setErro("Nao foi possivel enviar o email. Tenta novamente.");
      return;
    }

    setEnviado(true);
  }

  return (
    <div style={{minHeight:"100vh",background:"#040712",color:"#fff",fontFamily:"'Inter',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem 1rem"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>

      <div style={{width:"100%",maxWidth:"420px"}}>

        <Link href="/" style={{display:"flex",alignItems:"center",gap:"10px",textDecoration:"none",justifyContent:"center",marginBottom:"2rem"}}>
          <div style={{width:"36px",height:"36px",borderRadius:"10px",background:"linear-gradient(135deg,#34d399 0%,#059669 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"16px",color:"#000",boxShadow:"0 0 16px rgba(52,211,153,0.35)"}}>Q</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"19px",color:"rgba(255,255,255,0.95)",letterSpacing:"-0.02em"}}>QYNTOR</span>
        </Link>

        <div style={{background:"rgba(4,8,20,0.85)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"14px",padding:"2rem"}}>

          {enviado ? (
            <>
              <div style={{fontSize:"42px",textAlign:"center",marginBottom:"1rem"}}>📧</div>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"22px",textAlign:"center",marginBottom:"12px",letterSpacing:"-0.02em"}}>Email enviado</h1>
              <p style={{fontSize:"14px",color:"rgba(255,255,255,0.55)",textAlign:"center",lineHeight:1.6,marginBottom:"1.5rem"}}>
                Enviamos um link pra <strong style={{color:"#34d399"}}>{email}</strong>. Abre seu email e clica no link pra redefinir a senha.
              </p>
              <div style={{background:"rgba(251,191,36,0.06)",border:"1px solid rgba(251,191,36,0.15)",borderRadius:"8px",padding:"12px",marginBottom:"1.5rem"}}>
                <p style={{fontSize:"12px",color:"rgba(251,191,36,0.85)",margin:0,lineHeight:1.5}}>
                  Nao chegou em 1 minuto? Olha a caixa de SPAM ou tenta de novo.
                </p>
              </div>
              <Link href="/login" style={{display:"block",textAlign:"center",color:"#34d399",fontSize:"13px",textDecoration:"none",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em"}}>
                ← VOLTAR AO LOGIN
              </Link>
            </>
          ) : (
            <>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"24px",marginBottom:"8px",letterSpacing:"-0.02em"}}>Esqueceu a senha?</h1>
              <p style={{fontSize:"14px",color:"rgba(255,255,255,0.55)",lineHeight:1.6,marginBottom:"1.5rem"}}>
                Digita seu email e a gente te envia um link pra criar uma nova senha.
              </p>

              <form onSubmit={handleSubmit}>
                <label style={{display:"block",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.5)",letterSpacing:"0.08em",marginBottom:"6px"}}>EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={loading}
                  required
                  style={{
                    width:"100%",
                    background:"rgba(255,255,255,0.03)",
                    border:"1px solid rgba(255,255,255,0.1)",
                    color:"#fff",
                    padding:"12px 14px",
                    borderRadius:"10px",
                    fontSize:"14px",
                    fontFamily:"'Inter',sans-serif",
                    outline:"none",
                    marginBottom:"1.5rem",
                    boxSizing:"border-box",
                  }}
                />

                {erro && (
                  <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:"8px",padding:"10px 14px",marginBottom:"1rem"}}>
                    <p style={{fontSize:"12px",color:"#f87171",margin:0}}>{erro}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  style={{
                    width:"100%",
                    background: loading || !email.trim() ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #34d399 0%, #059669 100%)",
                    color: loading || !email.trim() ? "rgba(255,255,255,0.3)" : "#000",
                    border:"none",
                    padding:"14px",
                    borderRadius:"10px",
                    fontFamily:"'IBM Plex Mono',monospace",
                    fontWeight:700,
                    fontSize:"12px",
                    letterSpacing:"0.12em",
                    cursor: loading || !email.trim() ? "not-allowed" : "pointer",
                    transition:"all 0.2s",
                  }}>
                  {loading ? "ENVIANDO..." : "ENVIAR LINK"}
                </button>
              </form>

              <div style={{marginTop:"1.5rem",paddingTop:"1.5rem",borderTop:"1px solid rgba(255,255,255,0.06)",textAlign:"center"}}>
                <Link href="/login" style={{color:"rgba(255,255,255,0.5)",fontSize:"13px",textDecoration:"none",fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.06em"}}>
                  ← VOLTAR AO LOGIN
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function RedefinirSenha() {
  const router = useRouter();
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [tokenValido, setTokenValido] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setTokenValido(true);
      } else {
        setTokenValido(false);
      }
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    // Validações locais (antes de chamar Supabase)
    if (novaSenha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmar) {
      setErro("As senhas nao conferem.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password: novaSenha });

    setLoading(false);

    if (error) {
      const msgLower = (error.message || "").toLowerCase();

      // 1. Senha igual à antiga
      if (
        msgLower.includes("different from the old password") ||
        msgLower.includes("same_password") ||
        msgLower.includes("new password should be different")
      ) {
        setErro("Essa e a sua senha atual. Escolhe uma nova diferente.");
        return;
      }

      // 2. Senha fraca demais (Supabase pode reclamar)
      if (
        msgLower.includes("password should be") ||
        msgLower.includes("weak_password") ||
        msgLower.includes("password is too weak")
      ) {
        setErro("Senha muito fraca. Tenta uma com mais caracteres ou variacoes.");
        return;
      }

      // 3. Token expirado / sessao invalida
      if (
        msgLower.includes("expired") ||
        msgLower.includes("invalid") ||
        msgLower.includes("jwt") ||
        msgLower.includes("session")
      ) {
        setErro("O link de redefinicao expirou. Solicita um novo email.");
        return;
      }

      // 4. Erro genérico (fallback)
      setErro("Erro ao redefinir senha. Tenta novamente.");
      return;
    }

    setSucesso(true);
    setTimeout(() => router.push("/login"), 2500);
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

          {sucesso ? (
            <>
              <div style={{fontSize:"42px",textAlign:"center",marginBottom:"1rem"}}>✅</div>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"22px",textAlign:"center",marginBottom:"12px"}}>Senha redefinida!</h1>
              <p style={{fontSize:"14px",color:"rgba(255,255,255,0.55)",textAlign:"center",lineHeight:1.6}}>
                Pronto. Voce vai ser redirecionado pro login...
              </p>
            </>
          ) : tokenValido === false ? (
            <>
              <div style={{fontSize:"42px",textAlign:"center",marginBottom:"1rem"}}>⚠️</div>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"22px",textAlign:"center",marginBottom:"12px"}}>Link expirado</h1>
              <p style={{fontSize:"14px",color:"rgba(255,255,255,0.55)",textAlign:"center",lineHeight:1.6,marginBottom:"1.5rem"}}>
                Esse link de redefinicao nao e mais valido. Solicita um novo email.
              </p>
              <Link href="/esqueci-senha" style={{display:"block",textAlign:"center",background:"linear-gradient(135deg, #34d399 0%, #059669 100%)",color:"#000",padding:"14px",borderRadius:"10px",textDecoration:"none",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,fontSize:"12px",letterSpacing:"0.12em"}}>
                PEDIR NOVO LINK
              </Link>
            </>
          ) : tokenValido === null ? (
            <p style={{textAlign:"center",color:"rgba(255,255,255,0.4)",fontFamily:"'IBM Plex Mono',monospace",fontSize:"12px"}}>Verificando...</p>
          ) : (
            <>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:"24px",marginBottom:"8px",letterSpacing:"-0.02em"}}>Nova senha</h1>
              <p style={{fontSize:"14px",color:"rgba(255,255,255,0.55)",lineHeight:1.6,marginBottom:"1.5rem"}}>
                Cria uma nova senha pra sua conta. Minimo 6 caracteres.
              </p>

              <form onSubmit={handleSubmit}>
                <label style={{display:"block",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.5)",letterSpacing:"0.08em",marginBottom:"6px"}}>NOVA SENHA</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  required
                  minLength={6}
                  style={{width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",padding:"12px 14px",borderRadius:"10px",fontSize:"14px",outline:"none",marginBottom:"1rem",boxSizing:"border-box"}}
                />

                <label style={{display:"block",fontFamily:"'IBM Plex Mono',monospace",fontSize:"10px",color:"rgba(255,255,255,0.5)",letterSpacing:"0.08em",marginBottom:"6px"}}>CONFIRMAR SENHA</label>
                <input
                  type="password"
                  value={confirmar}
                  onChange={(e) => setConfirmar(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  required
                  minLength={6}
                  style={{width:"100%",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",padding:"12px 14px",borderRadius:"10px",fontSize:"14px",outline:"none",marginBottom:"1.5rem",boxSizing:"border-box"}}
                />

                {erro && (
                  <div style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",borderRadius:"8px",padding:"10px 14px",marginBottom:"1rem"}}>
                    <p style={{fontSize:"12px",color:"#f87171",margin:0}}>{erro}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !novaSenha || !confirmar}
                  style={{
                    width:"100%",
                    background: loading || !novaSenha || !confirmar ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg, #34d399 0%, #059669 100%)",
                    color: loading || !novaSenha || !confirmar ? "rgba(255,255,255,0.3)" : "#000",
                    border:"none",
                    padding:"14px",
                    borderRadius:"10px",
                    fontFamily:"'IBM Plex Mono',monospace",
                    fontWeight:700,
                    fontSize:"12px",
                    letterSpacing:"0.12em",
                    cursor: loading || !novaSenha || !confirmar ? "not-allowed" : "pointer",
                  }}>
                  {loading ? "SALVANDO..." : "REDEFINIR SENHA"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

// ═══════════════════════════════════════════════════════════════════════════
// HeaderQyntor.jsx
//
// Header unificado do app. Renderizado UMA vez no layout.js e aparece em
// todas as telas (Home, Carteira, Descobrir).
//
// Detecta automaticamente em qual rota está usando usePathname() e destaca
// a aba correspondente com a cor da seção:
//   - /          → Analisar  (verde)
//   - /carteira  → Carteira  (azul)
//   - /descobrir → Descobrir (roxo)
//
// Contém:
//   - Logo QYNTOR
//   - 3 abas centrais
//   - Dropdown do usuário (com histórico)
//   - Menu hambúrguer (mobile)
//   - Botões "Entrar" / "Criar conta" quando não logado
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG DAS ABAS
// ═══════════════════════════════════════════════════════════════════════════

const ABAS = [
  {
    id: "analisar",
    label: "Analisar",
    href: "/",
    color: "#34d399",
    glow: "rgba(52,211,153,0.6)",
    soft: "rgba(52,211,153,0.08)",
    border: "rgba(52,211,153,0.25)",
  },
  {
    id: "carteira",
    label: "Minha Carteira",
    href: "/carteira",
    color: "#60a5fa",
    glow: "rgba(96,165,250,0.6)",
    soft: "rgba(96,165,250,0.08)",
    border: "rgba(96,165,250,0.25)",
  },
  {
    id: "descobrir",
    label: "Descobrir",
    href: "/descobrir",
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.6)",
    soft: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.25)",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: detecta aba ativa a partir do pathname
// ═══════════════════════════════════════════════════════════════════════════

function detectarAbaAtiva(pathname) {
  if (!pathname) return "analisar";
  if (pathname.startsWith("/carteira")) return "carteira";
  if (pathname.startsWith("/descobrir")) return "descobrir";
  return "analisar";
}

// ═══════════════════════════════════════════════════════════════════════════
// HEADER PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function HeaderQyntor() {
  const pathname = usePathname();
  const router = useRouter();
  const abaAtivaId = detectarAbaAtiva(pathname);
  const abaAtiva = ABAS.find((a) => a.id === abaAtivaId);

  const [user, setUser] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const dropdownRef = useRef(null);
  const menuMobileRef = useRef(null);

  // ── Auth ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      carregarHistorico(user?.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user || null);
      carregarHistorico(session?.user?.id);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function carregarHistorico(uid) {
    if (!uid) {
      setHistorico([]);
      return;
    }
    const { data } = await supabase
      .from("historico_consultas")
      .select("ticker, nome, criado_em")
      .eq("user_id", uid)
      .order("criado_em", { ascending: false })
      .limit(8);
    if (data) setHistorico(data);
  }

  // ── Click fora pra fechar dropdowns ──────────────────────────────────────
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownAberto(false);
      }
      if (menuMobileRef.current && !menuMobileRef.current.contains(e.target)) {
        setMenuMobileAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────
  async function fazerLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setHistorico([]);
    setDropdownAberto(false);
    setMenuMobileAberto(false);
    router.refresh();
    window.location.href = "/";
  }

  // ── Ao clicar em ticker do histórico, leva pra Home com o ticker ────────
  function abrirTicker(ticker) {
    setDropdownAberto(false);
    setMenuMobileAberto(false);
    router.push(`/?ticker=${ticker}`);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Syne:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap');

        .header-qyntor {
          height: 64px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 1.25rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(4,7,18,0.85);
          backdrop-filter: blur(24px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
          justify-self: start;
        }

        .header-logo-mark {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, #34d399 0%, #059669 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 14px;
          color: #000;
          box-shadow: 0 0 16px rgba(52,211,153,0.35);
          flex-shrink: 0;
        }

        .header-logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 17px;
          color: rgba(255,255,255,0.95);
          letter-spacing: -0.02em;
        }

        /* ──── ABAS CENTRAIS ──── */
        .header-tabs {
          display: none;
          align-items: center;
          gap: 6px;
          padding: 4px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          justify-self: center;
        }

        @media (min-width: 880px) {
          .header-tabs { display: flex; }
        }

        .header-tab {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 8px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-decoration: none;
          color: rgba(255,255,255,0.45);
          transition: all 0.18s ease;
          white-space: nowrap;
        }

        .header-tab:hover {
          color: rgba(255,255,255,0.85);
          background: rgba(255,255,255,0.03);
        }

        .header-tab.ativo {
          color: var(--tab-color);
          background: var(--tab-soft);
          box-shadow: inset 0 0 0 1px var(--tab-border);
        }

        .header-tab-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--tab-color);
          box-shadow: 0 0 8px var(--tab-glow);
          flex-shrink: 0;
        }

        /* ──── LADO DIREITO ──── */
        .header-right {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-shrink: 0;
          min-width: 0;
          justify-self: end;
        }

        .user-btn {
          display: none;
          align-items: center;
          gap: 10px;
          padding: 6px 12px 6px 6px;
          border-radius: 100px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-btn:hover {
          background: rgba(52,211,153,0.06);
          border-color: rgba(52,211,153,0.25);
        }

        @media (min-width: 768px) {
          .user-btn { display: flex; }
        }

        .login-btn {
          display: none;
          align-items: center;
          gap: 8px;
          padding: 9px 18px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(52,211,153,0.12) 0%, rgba(52,211,153,0.06) 100%);
          border: 1px solid rgba(52,211,153,0.35);
          color: #34d399;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 0 20px rgba(52,211,153,0.08), inset 0 1px 0 rgba(255,255,255,0.06);
          font-family: 'Inter', sans-serif;
        }

        .login-btn:hover {
          background: linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(52,211,153,0.1) 100%);
          border-color: rgba(52,211,153,0.5);
          box-shadow: 0 0 28px rgba(52,211,153,0.18), inset 0 1px 0 rgba(255,255,255,0.1);
          transform: translateY(-1px);
        }

        @media (min-width: 768px) {
          .login-btn { display: flex; }
        }

        .entrar-link {
          display: none;
          color: rgba(255,255,255,0.6);
          font-size: 13px;
          font-weight: 500;
          text-decoration: none;
          padding: 9px 14px;
          border-radius: 10px;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
        }

        .entrar-link:hover {
          color: rgba(255,255,255,0.95);
          background: rgba(255,255,255,0.04);
        }

        @media (min-width: 768px) {
          .entrar-link { display: inline-flex; align-items: center; }
        }

        /* ──── BURGUER MOBILE ──── */
        .mobile-burguer {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
        }

        @media (min-width: 880px) {
          .mobile-burguer { display: none; }
        }

        .mobile-burguer:hover {
          background: rgba(52,211,153,0.06);
          border-color: rgba(52,211,153,0.25);
        }

        .mobile-burguer span {
          width: 16px;
          height: 1.5px;
          background: rgba(255,255,255,0.7);
          display: block;
          border-radius: 2px;
          transition: all 0.2s;
        }

        .mobile-burguer span:not(:last-child) { margin-bottom: 4px; }

        .mobile-burguer.open span:nth-child(1) { transform: translateY(5.5px) rotate(45deg); }
        .mobile-burguer.open span:nth-child(2) { opacity: 0; }
        .mobile-burguer.open span:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); }

        /* ──── ANIMAÇÃO DROPDOWN ──── */
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header className="header-qyntor">
        {/* ═══ LADO ESQUERDO — LOGO ═══ */}
        <Link href="/" className="header-logo">
          <div className="header-logo-mark">Q</div>
          <span className="header-logo-text">QUANTOR</span>
        </Link>

        {/* ═══ CENTRO — 3 ABAS (desktop) ═══ */}
        <nav className="header-tabs">
          {ABAS.map((aba) => {
            const ativa = aba.id === abaAtivaId;
            return (
              <Link
                key={aba.id}
                href={aba.href}
                className={`header-tab ${ativa ? "ativo" : ""}`}
                style={{
                  "--tab-color": aba.color,
                  "--tab-glow": aba.glow,
                  "--tab-soft": aba.soft,
                  "--tab-border": aba.border,
                }}
              >
                {ativa && <span className="header-tab-dot" />}
                <span>{aba.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* ═══ LADO DIREITO ═══ */}
        <div className="header-right">
          {user ? (
            <>
              {/* DESKTOP — botão de usuário com dropdown */}
              <div style={{ position: "relative" }} ref={dropdownRef}>
                <button
                  onClick={() => setDropdownAberto((prev) => !prev)}
                  className="user-btn"
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.1))",
                      border: "1px solid rgba(52,211,153,0.4)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#34d399",
                      fontWeight: 700,
                      fontSize: "13px",
                    }}
                  >
                    {(user.email?.[0] || "U").toUpperCase()}
                  </div>
                  <span
                    style={{
                      fontSize: "13px",
                      maxWidth: "160px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {user.email}
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      color: "rgba(255,255,255,0.4)",
                      marginLeft: "2px",
                      transition: "transform 0.2s",
                      transform: dropdownAberto ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </button>

                {dropdownAberto && (
                  <DropdownUsuario
                    user={user}
                    historico={historico}
                    onAbrirTicker={abrirTicker}
                    onLogout={fazerLogout}
                  />
                )}
              </div>

              {/* MOBILE — botão hambúrguer */}
              <div style={{ position: "relative" }} ref={menuMobileRef}>
                <button
                  onClick={() => setMenuMobileAberto((prev) => !prev)}
                  className={"mobile-burguer " + (menuMobileAberto ? "open" : "")}
                  aria-label="Menu"
                >
                  <span />
                  <span />
                  <span />
                </button>

                {menuMobileAberto && (
                  <MenuMobileLogado
                    user={user}
                    historico={historico}
                    abaAtivaId={abaAtivaId}
                    onFechar={() => setMenuMobileAberto(false)}
                    onAbrirTicker={abrirTicker}
                    onLogout={fazerLogout}
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="entrar-link">
                Entrar
              </Link>

              <Link href="/cadastro" className="login-btn">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                Criar conta grátis
              </Link>

              {/* MOBILE — burguer pra deslogado */}
              <div style={{ position: "relative" }} ref={menuMobileRef}>
                <button
                  onClick={() => setMenuMobileAberto((prev) => !prev)}
                  className={"mobile-burguer " + (menuMobileAberto ? "open" : "")}
                  aria-label="Menu"
                >
                  <span />
                  <span />
                  <span />
                </button>

                {menuMobileAberto && (
                  <MenuMobileDeslogado
                    abaAtivaId={abaAtivaId}
                    onFechar={() => setMenuMobileAberto(false)}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DROPDOWN USUÁRIO (desktop, quando logado)
// ═══════════════════════════════════════════════════════════════════════════

function DropdownUsuario({ user, historico, onAbrirTicker, onLogout }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: "calc(100% + 8px)",
        width: "320px",
        background: "rgba(11,17,32,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        zIndex: 9999,
        overflow: "hidden",
        backdropFilter: "blur(24px)",
        animation: "slideDown 0.2s ease",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: "6px",
          }}
        >
          Logado como
        </p>
        <p
          style={{
            fontSize: "13px",
            color: "#fff",
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            margin: 0,
          }}
        >
          {user.email}
        </p>
      </div>

      {/* Histórico */}
      <div style={{ padding: "14px 16px" }}>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          Últimas consultas
        </p>
        {historico.length > 0 ? (
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {historico.map((h, i) => (
              <li key={i}>
                <button
                  onClick={() => onAbrirTicker(h.ticker)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(52,211,153,0.06)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        color: "#34d399",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      {h.ticker}
                    </span>
                    {h.nome && (
                      <span
                        style={{
                          color: "rgba(255,255,255,0.45)",
                          fontSize: "12px",
                          maxWidth: "160px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h.nome}
                      </span>
                    )}
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px" }}>
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p
            style={{
              fontSize: "12px",
              color: "rgba(255,255,255,0.3)",
              padding: "6px 0",
              margin: 0,
            }}
          >
            Nenhuma consulta ainda
          </p>
        )}
      </div>

      {/* Links extras */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "8px",
        }}
      >
        <Link
          href="/como-funciona"
          style={{
            display: "block",
            padding: "10px 12px",
            borderRadius: "8px",
            color: "rgba(255,255,255,0.65)",
            fontSize: "13px",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          Como funciona
        </Link>
        <Link
          href="/planos"
          style={{
            display: "block",
            padding: "10px 12px",
            borderRadius: "8px",
            color: "rgba(255,255,255,0.65)",
            fontSize: "13px",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          Planos
        </Link>
      </div>

      {/* Logout */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "10px",
        }}
      >
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 14px",
            borderRadius: "8px",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            color: "#f87171",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(248,113,113,0.15)";
            e.currentTarget.style.borderColor = "rgba(248,113,113,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(248,113,113,0.08)";
            e.currentTarget.style.borderColor = "rgba(248,113,113,0.2)";
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sair da conta
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU MOBILE (logado)
// ═══════════════════════════════════════════════════════════════════════════

function MenuMobileLogado({
  user,
  historico,
  abaAtivaId,
  onFechar,
  onAbrirTicker,
  onLogout,
}) {
  return (
    <div
      style={{
        position: "fixed",
        right: "1rem",
        left: "1rem",
        top: "68px",
        maxWidth: "340px",
        marginLeft: "auto",
        background: "rgba(11,17,32,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        zIndex: 9999,
        overflow: "hidden",
        backdropFilter: "blur(24px)",
        animation: "slideDown 0.2s ease",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Bloco do usuário */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <div
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.1))",
            border: "1px solid rgba(52,211,153,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#34d399",
            fontWeight: 700,
            fontSize: "14px",
            flexShrink: 0,
          }}
        >
          {(user.email?.[0] || "U").toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: "2px",
            }}
          >
            Logado
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#fff",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              margin: 0,
            }}
          >
            {user.email}
          </p>
        </div>
      </div>

      {/* Abas */}
      <div
        style={{
          padding: "8px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 700,
            padding: "4px 10px 8px",
            margin: 0,
          }}
        >
          Navegação
        </p>
        {ABAS.map((aba) => {
          const ativa = aba.id === abaAtivaId;
          return (
            <Link
              key={aba.id}
              href={aba.href}
              onClick={onFechar}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "11px 14px",
                borderRadius: "8px",
                color: ativa ? aba.color : "rgba(255,255,255,0.75)",
                background: ativa ? aba.soft : "transparent",
                border: ativa ? `1px solid ${aba.border}` : "1px solid transparent",
                fontSize: "14px",
                fontWeight: ativa ? 600 : 400,
                textDecoration: "none",
                transition: "background 0.15s",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {ativa && (
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: aba.color,
                    boxShadow: `0 0 8px ${aba.glow}`,
                  }}
                />
              )}
              <span>{aba.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Histórico */}
      {historico.length > 0 && (
        <div
          style={{
            padding: "8px 16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 700,
              margin: "4px 0 8px",
            }}
          >
            Últimas consultas
          </p>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {historico.slice(0, 5).map((h, i) => (
              <li key={i}>
                <button
                  onClick={() => onAbrirTicker(h.ticker)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 6px",
                    borderRadius: "6px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      color: "#34d399",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {h.ticker}
                  </span>
                  {h.nome && (
                    <span
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h.nome}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Links extras */}
      <div style={{ padding: "8px" }}>
        <Link
          href="/como-funciona"
          onClick={onFechar}
          style={{
            display: "block",
            padding: "10px 14px",
            borderRadius: "8px",
            color: "rgba(255,255,255,0.65)",
            fontSize: "13px",
            textDecoration: "none",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Como funciona
        </Link>
        <Link
          href="/planos"
          onClick={onFechar}
          style={{
            display: "block",
            padding: "10px 14px",
            borderRadius: "8px",
            color: "rgba(255,255,255,0.65)",
            fontSize: "13px",
            textDecoration: "none",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Planos
        </Link>
      </div>

      {/* Sair */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "10px",
        }}
      >
        <button
          onClick={onLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "11px 14px",
            borderRadius: "8px",
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            color: "#f87171",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sair da conta
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU MOBILE (deslogado)
// ═══════════════════════════════════════════════════════════════════════════

function MenuMobileDeslogado({ abaAtivaId, onFechar }) {
  return (
    <div
      style={{
        position: "fixed",
        right: "1rem",
        left: "1rem",
        top: "68px",
        maxWidth: "320px",
        marginLeft: "auto",
        background: "rgba(11,17,32,0.98)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "14px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
        zIndex: 9999,
        overflow: "hidden",
        backdropFilter: "blur(24px)",
        animation: "slideDown 0.2s ease",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Abas */}
      <div style={{ padding: "8px" }}>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "rgba(255,255,255,0.35)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            fontWeight: 700,
            padding: "4px 10px 8px",
            margin: 0,
          }}
        >
          Navegação
        </p>
        {ABAS.map((aba) => {
          const ativa = aba.id === abaAtivaId;
          return (
            <Link
              key={aba.id}
              href={aba.href}
              onClick={onFechar}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "11px 14px",
                borderRadius: "8px",
                color: ativa ? aba.color : "rgba(255,255,255,0.75)",
                background: ativa ? aba.soft : "transparent",
                border: ativa ? `1px solid ${aba.border}` : "1px solid transparent",
                fontSize: "14px",
                fontWeight: ativa ? 600 : 400,
                textDecoration: "none",
              }}
            >
              {ativa && (
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: aba.color,
                    boxShadow: `0 0 8px ${aba.glow}`,
                  }}
                />
              )}
              <span>{aba.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Links secundários */}
      <div
        style={{
          padding: "8px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href="/como-funciona"
          onClick={onFechar}
          style={{
            display: "block",
            padding: "10px 14px",
            borderRadius: "8px",
            color: "rgba(255,255,255,0.65)",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          Como funciona
        </Link>
        <Link
          href="/planos"
          onClick={onFechar}
          style={{
            display: "block",
            padding: "10px 14px",
            borderRadius: "8px",
            color: "rgba(255,255,255,0.65)",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          Planos
        </Link>
      </div>

      {/* CTAs */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <Link
          href="/cadastro"
          onClick={onFechar}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px 14px",
            borderRadius: "10px",
            background:
              "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(52,211,153,0.1))",
            border: "1px solid rgba(52,211,153,0.4)",
            color: "#34d399",
            fontSize: "13px",
            fontWeight: 700,
            textDecoration: "none",
            boxShadow: "0 0 20px rgba(52,211,153,0.12)",
          }}
        >
          <span>🎁</span>
          <span>Criar conta grátis</span>
        </Link>

        <Link
          href="/login"
          onClick={onFechar}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.7)",
            fontSize: "13px",
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          Já tenho conta
        </Link>
      </div>
    </div>
  );
}
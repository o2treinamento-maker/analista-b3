// lib/supabase/admin.js
// ═══════════════════════════════════════════════════════════════════════════
// CLIENTE SUPABASE ADMIN
//
// Use APENAS em API routes (servidor). NUNCA importe esse arquivo em
// componentes do navegador — a chave service_role daria acesso total ao banco.
//
// Características:
// - Usa SERVICE_ROLE_KEY (ignora RLS — pode ler/escrever qualquer coisa)
// - Sem cookies (não precisa de usuário logado)
// - Ideal pra: cron jobs, jobs de admin, webhooks
//
// Para escrita do usuário autenticado, use lib/supabase/server.js
// Para leitura do navegador, use lib/supabase/client.js
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL não está definida no .env.local");
}

if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY não está definida no .env.local. " +
    "Pegue ela em: Supabase Dashboard > Project Settings > API > service_role"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
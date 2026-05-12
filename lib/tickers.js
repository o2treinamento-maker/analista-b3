// ─────────────────────────────────────────────
// HELPERS — unificam categorias + extras
// ─────────────────────────────────────────────

import { CATEGORIAS } from "@/data/categorias";
import { TICKERS_EXTRAS } from "@/data/tickers-extras";

// Lista única de TODOS os tickers (categorias + extras)
// Usada pra autocomplete e validação
export const TODOS_OS_ATIVOS = (() => {
  const mapa = new Map();
  
  // Primeiro adiciona os de categorias
  CATEGORIAS.flatMap(c => c.ativos).forEach(a => {
    mapa.set(a.ticker, a);
  });
  
  // Depois adiciona extras (sobrescrevem se houver duplicata)
  TICKERS_EXTRAS.forEach(a => {
    mapa.set(a.ticker, a);
  });
  
  return Array.from(mapa.values());
})();

// Set de tickers válidos (usado pra validar busca)
export const TICKERS_PERMITIDOS = new Set(
  TODOS_OS_ATIVOS.map(a => a.ticker.toUpperCase())
);
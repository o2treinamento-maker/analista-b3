"use client";
import CartaoIdentidade from "@/components/CartaoIdentidade";
export default function TesteCartao() {
  return (
    <div style={{padding: 40, background: "#040712", minHeight: "100vh"}}>
      <CartaoIdentidade 
        ticker="PETR4" 
        logado={true}
        onAbrirDimensao={(id) => alert("Abrir: " + id)}
      />
    </div>
  );
}
export default function Planos() {
  const planos = [
    {
      icon: "🆓",
      nome: "Free",
      preco: "R$ 0",
      periodo: "para sempre",
      consultas: "1 consulta/dia",
      descricao: "Perfeito para conhecer o produto",
      cor: "border-gray-700",
      botao: "bg-gray-700 hover:bg-gray-600 text-white",
      badge: null,
      features: [
        "1 análise por dia",
        "Consenso de mercado",
        "Preço-alvo médio",
        "Tese consolidada",
      ],
    },
    {
      icon: "⚡",
      nome: "Starter",
      preco: "R$ 47",
      periodo: "/mês",
      consultas: "50 consultas/mês",
      descricao: "Para o investidor casual",
      cor: "border-blue-500",
      botao: "bg-blue-500 hover:bg-blue-400 text-white",
      badge: null,
      features: [
        "50 análises por mês",
        "Consenso de mercado",
        "Preço-alvo médio",
        "Tese consolidada",
        "Recomendação final",
      ],
    },
    {
      icon: "🚀",
      nome: "Pro",
      preco: "R$ 147",
      periodo: "/mês",
      consultas: "150 consultas/mês",
      descricao: "Para o investidor ativo",
      cor: "border-green-500",
      botao: "bg-green-500 hover:bg-green-400 text-black",
      badge: "Mais popular",
      features: [
        "150 análises por mês",
        "Consenso de mercado",
        "Preço-alvo médio",
        "Tese consolidada",
        "Recomendação final",
        "Acesso prioritário a novidades",
      ],
    },
    {
      icon: "💎",
      nome: "Ultra",
      preco: "R$ 397",
      periodo: "/mês",
      consultas: "400 consultas/mês",
      descricao: "Para o trader profissional",
      cor: "border-purple-500",
      botao: "bg-purple-500 hover:bg-purple-400 text-white",
      badge: "Melhor custo-benefício",
      features: [
        "400 análises por mês",
        "Consenso de mercado",
        "Preço-alvo médio",
        "Tese consolidada",
        "Recomendação final",
        "Acesso prioritário a novidades",
        "Suporte prioritário",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* NAVBAR */}
      <nav className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-sm">📊</div>
          <span className="font-bold text-lg">Radar de Consenso <span className="text-green-400">B3</span></span>
        </a>
        <div className="hidden md:flex items-center gap-8 text-gray-400 text-sm">
          <a href="/" className="hover:text-white">Como funciona</a>
          <a href="/" className="hover:text-white">Recursos</a>
          <a href="/planos" className="text-white font-semibold">Planos</a>
          <a href="/" className="hover:text-white">FAQ</a>
        </div>
        <button className="border border-green-500 text-green-400 px-4 py-2 rounded-lg text-sm hover:bg-green-500 hover:text-black transition-colors">
          Entrar
        </button>
      </nav>

      {/* HEADER */}
      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Escolha o plano <span className="text-green-400">ideal para você</span>
        </h1>
        <p className="text-gray-400 text-lg mb-4">
          Sem fidelidade. Cancele quando quiser.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-2"><span className="text-green-400">✓</span> Sem taxa de setup</span>
          <span className="flex items-center gap-2"><span className="text-green-400">✓</span> Cancele a qualquer momento</span>
          <span className="flex items-center gap-2"><span className="text-green-400">✓</span> Suporte por email</span>
        </div>
      </div>

      {/* CARDS DE PLANOS */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {planos.map((plano) => (
            <div key={plano.nome}
              className={`relative bg-gray-900 rounded-2xl p-6 border-2 ${plano.cor} flex flex-col`}>

              {/* Badge */}
              {plano.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-green-500 text-black text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    {plano.badge}
                  </span>
                </div>
              )}

              {/* Ícone e nome */}
              <div className="text-4xl mb-3">{plano.icon}</div>
              <h2 className="text-xl font-bold text-white mb-1">{plano.nome}</h2>
              <p className="text-gray-500 text-sm mb-4">{plano.descricao}</p>

              {/* Preço */}
              <div className="mb-2">
                <span className="text-4xl font-black text-white">{plano.preco}</span>
                <span className="text-gray-400 text-sm">{plano.periodo}</span>
              </div>
              <p className="text-green-400 text-sm font-semibold mb-6">{plano.consultas}</p>

              {/* Botão */}
              <button className={`w-full py-3 rounded-xl font-bold text-sm transition-colors mb-6 ${plano.botao}`}>
                {plano.preco === "R$ 0" ? "Começar grátis" : "Assinar agora"}
              </button>

              {/* Features */}
              <div className="space-y-2 flex-1">
                {plano.features.map((f) => (
                  <div key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ rápido */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-bold mb-8 text-gray-300">Dúvidas frequentes</h2>
          <div className="space-y-4 text-left">
            {[
              { q: "Posso cancelar quando quiser?", r: "Sim! Não há fidelidade. Cancele a qualquer momento sem multa." },
              { q: "Como são contadas as consultas?", r: "Cada análise de uma ação conta como 1 consulta. As consultas não acumulam para o próximo mês." },
              { q: "Qual forma de pagamento?", r: "Aceitamos cartão de crédito, débito e Pix." },
              { q: "Os dados são em tempo real?", r: "Sim! Buscamos as recomendações mais recentes dos analistas na web antes de cada análise." },
            ].map((item) => (
              <div key={item.q} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <p className="font-semibold text-white mb-1">{item.q}</p>
                <p className="text-gray-400 text-sm">{item.r}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="mt-16 text-center bg-gray-900 border border-gray-800 rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-2">Pronto para investir melhor?</h2>
          <p className="text-gray-400 mb-6">Comece grátis hoje e veja o que os analistas estão recomendando.</p>
          <a href="/" className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold px-10 py-4 rounded-xl transition-colors text-lg">
            Começar agora →
          </a>
        </div>
      </div>
    </div>
  );
}
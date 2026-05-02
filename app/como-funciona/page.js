export default function ComoFunciona() {
  const passos = [
    {
      numero: "01",
      icon: "🔍",
      titulo: "Digite o ticker ou nome da ação",
      descricao: "Basta digitar o código da ação (ex: PETR4, VALE3) ou o nome da empresa no campo de busca.",
    },
    {
      numero: "02",
      icon: "🌐",
      titulo: "Buscamos em tempo real",
      descricao: "Nossa IA acessa a web e consulta relatórios recentes de BTG Pactual, XP Investimentos, Itaú BBA, Bradesco BBI, Safra e outras casas.",
    },
    {
      numero: "03",
      icon: "🧠",
      titulo: "Consolidamos as análises",
      descricao: "Calculamos o consenso de mercado, o preço-alvo médio e identificamos os pontos positivos e riscos mais citados pelos analistas.",
    },
    {
      numero: "04",
      icon: "📊",
      titulo: "Receba o relatório completo",
      descricao: "Em segundos você tem acesso a um relatório completo com consenso, tabela de recomendações, tese unificada e recomendação final.",
    },
  ];

  const fontes = [
    "BTG Pactual", "XP Investimentos", "Itaú BBA",
    "Bradesco BBI", "Safra", "Genial Investimentos",
    "Suno Research", "Empiricus", "BB Investimentos",
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
          <a href="/como-funciona" className="text-white font-semibold">Como funciona</a>
          <a href="/recursos" className="hover:text-white">Recursos</a>
          <a href="/planos" className="hover:text-white">Planos</a>
          <a href="/faq" className="hover:text-white">FAQ</a>
        </div>
        <button className="border border-green-500 text-green-400 px-4 py-2 rounded-lg text-sm hover:bg-green-500 hover:text-black transition-colors">
          Entrar
        </button>
      </nav>

      {/* HEADER */}
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">
          Como o <span className="text-green-400">Radar de Consenso B3</span> funciona
        </h1>
        <p className="text-gray-400 text-lg">
          Em menos de 30 segundos você tem acesso ao que os principais analistas do Brasil estão recomendando.
        </p>
      </div>

      {/* PASSOS */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="space-y-6">
          {passos.map((passo, i) => (
            <div key={passo.numero}
              className="flex gap-6 bg-gray-900 border border-gray-800 rounded-2xl p-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-green-900/40 border border-green-800 rounded-xl flex items-center justify-center text-2xl">
                  {passo.icon}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-green-400 font-black text-sm">{passo.numero}</span>
                  <h2 className="text-xl font-bold text-white">{passo.titulo}</h2>
                </div>
                <p className="text-gray-400 leading-relaxed">{passo.descricao}</p>
              </div>
              {i < passos.length - 1 && (
                <div className="absolute left-1/2 mt-24 text-gray-700 text-2xl hidden">↓</div>
              )}
            </div>
          ))}
        </div>

        {/* FONTES */}
        <div className="mt-16 text-center">
          <h2 className="text-xl font-bold mb-2">Fontes consultadas</h2>
          <p className="text-gray-500 text-sm mb-8">Buscamos recomendações nas principais casas de análise do Brasil</p>
          <div className="flex flex-wrap justify-center gap-3">
            {fontes.map((fonte) => (
              <span key={fonte} className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg text-sm text-gray-300">
                {fonte}
              </span>
            ))}
          </div>
        </div>

        {/* O QUE VOCÊ RECEBE */}
        <div className="mt-16">
          <h2 className="text-xl font-bold text-center mb-8">O que você recebe em cada análise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: "📊", titulo: "Consenso de Mercado", desc: "Quantos analistas recomendam Comprar, Manter ou Vender." },
              { icon: "🎯", titulo: "Preço-Alvo Médio", desc: "Média dos preços-alvo dos analistas e upside implícito." },
              { icon: "📋", titulo: "Recomendações por Analista", desc: "Tabela completa com recomendação, preço-alvo e data de cada casa." },
              { icon: "🧠", titulo: "Tese Consolidada", desc: "Principais pontos positivos e riscos identificados pelos analistas." },
              { icon: "✅", titulo: "Recomendação Final", desc: "COMPRAR, MANTER ou VENDER — com justificativa clara." },
              { icon: "⚠️", titulo: "Aviso Regulatório", desc: "Transparência total: informamos que não somos assessores certificados." },
            ].map((item) => (
              <div key={item.titulo} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex gap-4">
                <div className="text-2xl">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-white text-sm mb-1">{item.titulo}</h3>
                  <p className="text-gray-400 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-gray-900 border border-gray-800 rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-2">Pronto para testar?</h2>
          <p className="text-gray-400 mb-6">Comece grátis agora — sem cadastro, sem cartão.</p>
          <a href="/"
            className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold px-10 py-4 rounded-xl transition-colors text-lg">
            Fazer minha primeira análise →
          </a>
        </div>
      </div>
    </div>
  );
}
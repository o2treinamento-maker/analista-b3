export default function Recursos() {
  const recursos = [
    {
      icon: "🌐",
      titulo: "Dados em Tempo Real",
      descricao: "Nossa IA busca na web antes de cada análise, garantindo as recomendações mais recentes dos analistas — sem dados desatualizados.",
      destaque: true,
    },
    {
      icon: "🏦",
      titulo: "9+ Casas de Análise",
      descricao: "Consolidamos recomendações de BTG Pactual, XP Investimentos, Itaú BBA, Bradesco BBI, Safra, Genial, Suno Research e outras.",
      destaque: false,
    },
    {
      icon: "📊",
      titulo: "Consenso Visual",
      descricao: "Veja de forma clara quantos analistas recomendam Comprar, Manter ou Vender — com distribuição percentual.",
      destaque: false,
    },
    {
      icon: "🎯",
      titulo: "Preço-Alvo Médio",
      descricao: "Calculamos automaticamente a média dos preços-alvo e o upside/downside implícito em relação ao preço atual.",
      destaque: false,
    },
    {
      icon: "🧠",
      titulo: "Tese Consolidada por IA",
      descricao: "Nossa IA identifica os argumentos que mais se repetem entre os analistas e monta uma tese narrativa clara e objetiva.",
      destaque: true,
    },
    {
      icon: "🟢",
      titulo: "Recomendação Final Clara",
      descricao: "COMPRAR, MANTER ou VENDER — com destaque visual em verde, amarelo ou vermelho para facilitar a leitura.",
      destaque: false,
    },
    {
      icon: "⚡",
      titulo: "Resultado em Segundos",
      descricao: "Em menos de 30 segundos você tem acesso a um relatório completo que levaria horas para montar manualmente.",
      destaque: false,
    },
    {
      icon: "📱",
      titulo: "100% Responsivo",
      descricao: "Funciona perfeitamente em qualquer dispositivo — celular, tablet ou computador. Consulte onde estiver.",
      destaque: false,
    },
    {
      icon: "🔒",
      titulo: "Sem Cadastro Inicial",
      descricao: "Comece sem criar conta. Faça sua primeira análise agora mesmo, sem formulários ou cartão de crédito.",
      destaque: true,
    },
  ];

  const comparacao = [
    { item: "Dados em tempo real", radar: true, manual: false, outros: false },
    { item: "Múltiplas casas consolidadas", radar: true, manual: true, outros: false },
    { item: "Resultado em segundos", radar: true, manual: false, outros: true },
    { item: "Tese narrativa em português", radar: true, manual: true, outros: false },
    { item: "Sem cadastro para usar", radar: true, manual: true, outros: false },
    { item: "Preço acessível", radar: true, manual: false, outros: false },
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
          <a href="/como-funciona" className="hover:text-white">Como funciona</a>
          <a href="/recursos" className="text-white font-semibold">Recursos</a>
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
          Tudo que você precisa para <span className="text-green-400">investir melhor</span>
        </h1>
        <p className="text-gray-400 text-lg">
          O Radar de Consenso B3 reúne o melhor da análise fundamentalista em um só lugar.
        </p>
      </div>

      {/* GRID DE RECURSOS */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recursos.map((r) => (
            <div key={r.titulo}
              className={`bg-gray-900 rounded-2xl p-6 border ${r.destaque ? "border-green-800 bg-green-950/20" : "border-gray-800"}`}>
              <div className="text-3xl mb-4">{r.icon}</div>
              <h3 className="font-bold text-white mb-2">{r.titulo}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{r.descricao}</p>
              {r.destaque && (
                <span className="inline-block mt-3 text-xs bg-green-900/40 text-green-400 border border-green-800 px-3 py-1 rounded-full">
                  Destaque
                </span>
              )}
            </div>
          ))}
        </div>

        {/* TABELA COMPARATIVA */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-2">Por que o Radar de Consenso B3?</h2>
          <p className="text-gray-500 text-center text-sm mb-8">Compare com as alternativas</p>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-gray-300">Recurso</th>
                  <th className="px-6 py-4 text-center text-green-400 font-bold">Radar B3</th>
                  <th className="px-6 py-4 text-center text-gray-400">Pesquisa manual</th>
                  <th className="px-6 py-4 text-center text-gray-400">Outras ferramentas</th>
                </tr>
              </thead>
              <tbody>
                {comparacao.map((item, i) => (
                  <tr key={item.item} className={i % 2 === 0 ? "bg-gray-900" : "bg-gray-900/50"}>
                    <td className="px-6 py-4 text-gray-300">{item.item}</td>
                    <td className="px-6 py-4 text-center text-xl">{item.radar ? "✅" : "❌"}</td>
                    <td className="px-6 py-4 text-center text-xl">{item.manual ? "✅" : "❌"}</td>
                    <td className="px-6 py-4 text-center text-xl">{item.outros ? "✅" : "❌"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-gray-900 border border-gray-800 rounded-2xl p-10">
          <h2 className="text-2xl font-bold mb-2">Experimente grátis agora</h2>
          <p className="text-gray-400 mb-6">Sem cadastro. Sem cartão. Resultado em segundos.</p>
          <a href="/"
            className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold px-10 py-4 rounded-xl transition-colors text-lg">
            Fazer minha primeira análise →
          </a>
        </div>
      </div>
    </div>
  );
}
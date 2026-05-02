export default function FAQ() {
  const perguntas = [
    {
      categoria: "Sobre o produto",
      items: [
        { q: "O que é o Radar de Consenso B3?", r: "É uma plataforma que busca e consolida as recomendações dos principais analistas do mercado brasileiro sobre qualquer ação listada na B3. Em segundos você tem acesso ao consenso de mercado, preço-alvo médio e tese consolidada." },
        { q: "Como os dados são obtidos?", r: "Usamos inteligência artificial com acesso à web para buscar as recomendações mais recentes de casas como BTG Pactual, XP Investimentos, Itaú BBA, Bradesco BBI, Safra, Genial e outras antes de cada análise." },
        { q: "Os dados são em tempo real?", r: "Sim! A cada consulta buscamos as informações mais atualizadas disponíveis na web. Não usamos dados em cache ou desatualizados." },
        { q: "Para quais ações posso fazer análise?", r: "Qualquer ação listada na B3. Basta digitar o ticker (ex: PETR4, VALE3, ITUB4) ou o nome da empresa." },
      ]
    },
    {
      categoria: "Planos e pagamento",
      items: [
        { q: "Posso cancelar quando quiser?", r: "Sim! Não há fidelidade ou multa. Você pode cancelar a qualquer momento pelo painel da sua conta." },
        { q: "Como são contadas as consultas?", r: "Cada análise de uma ação conta como 1 consulta. As consultas não acumulam para o próximo mês." },
        { q: "Quais formas de pagamento são aceitas?", r: "Aceitamos cartão de crédito, débito e Pix. O pagamento é processado de forma segura." },
        { q: "Posso mudar de plano?", r: "Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento." },
        { q: "Há desconto no plano anual?", r: "Estamos trabalhando nisso! Em breve teremos opção de plano anual com desconto de até 20%." },
      ]
    },
    {
      categoria: "Técnico",
      items: [
        { q: "A análise é feita por IA?", r: "Sim, usamos o modelo Claude da Anthropic, combinado com busca em tempo real na web para garantir dados atualizados e análises precisas." },
        { q: "A análise é uma recomendação oficial?", r: "Não. O Radar de Consenso B3 consolida informações públicas de analistas do mercado. Não somos uma casa de análise regulamentada. Sempre consulte um assessor certificado antes de investir." },
        { q: "Funciona no celular?", r: "Sim! O site é responsivo e funciona em qualquer dispositivo — celular, tablet ou computador." },
      ]
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
          <a href="/como-funciona" className="hover:text-white">Como funciona</a>
          <a href="/recursos" className="hover:text-white">Recursos</a>
          <a href="/planos" className="hover:text-white">Planos</a>
          <a href="/faq" className="text-white font-semibold">FAQ</a>
        </div>
        <button className="border border-green-500 text-green-400 px-4 py-2 rounded-lg text-sm hover:bg-green-500 hover:text-black transition-colors">
          Entrar
        </button>
      </nav>

      {/* HEADER */}
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Perguntas <span className="text-green-400">Frequentes</span></h1>
        <p className="text-gray-400 text-lg">Tudo que você precisa saber sobre o Radar de Consenso B3</p>
      </div>

      {/* PERGUNTAS */}
      <div className="max-w-3xl mx-auto px-6 pb-20 space-y-12">
        {perguntas.map((categoria) => (
          <div key={categoria.categoria}>
            <h2 className="text-green-400 font-bold uppercase text-sm tracking-widest mb-4">{categoria.categoria}</h2>
            <div className="space-y-3">
              {categoria.items.map((item) => (
                <div key={item.q} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <p className="font-semibold text-white mb-2">{item.q}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{item.r}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="text-center bg-gray-900 border border-gray-800 rounded-2xl p-10">
          <h2 className="text-xl font-bold mb-2">Ainda tem dúvidas?</h2>
          <p className="text-gray-400 mb-6">Entre em contato pelo email e respondemos em até 24h.</p>
          <a href="mailto:contato@radarb3.com.br"
            className="inline-block bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-3 rounded-xl transition-colors">
            Falar com suporte →
          </a>
        </div>
      </div>
    </div>
  );
}
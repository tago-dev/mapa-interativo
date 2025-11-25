import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-white">
      {/* Header */}
      <header className="w-full py-6 px-8 flex justify-between items-center border-b border-gray-800">
        <div className="text-2xl font-bold bg-linear-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
          Mapa Interativo
        </div>
        <nav>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Entrar
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Mapa <br />
            <span className="text-blue-500">Interativo</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            plataforma completa privada
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/login"
              className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25"
            >
              Acessar o Mapa
            </Link>
            <Link
              href="#recursos"
              className="px-8 py-4 rounded-full bg-gray-800 hover:bg-gray-700 text-white font-bold text-lg transition-all border border-gray-700"
            >
              Saiba Mais
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="recursos" className="py-20 bg-gray-800/50 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Visualização Geográfica"
            description="Navegue por um mapa interativo detalhado de todos os municípios brasileiros com renderização otimizada."
            icon="🗺️"
          />
          <FeatureCard
            title="Dados Políticos"
            description="Acesse informações sobre prefeitos, partidos e bases de apoio em cada cidade com um clique."
            icon="📊"
          />
          <FeatureCard
            title="Análise Regional"
            description="Filtre por mesorregiões e estados para entender o cenário político de forma macro e micro."
            icon="🔍"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-800">
        © {new Date().getFullYear()} Mapa Interativo. Todos os direitos reservados.
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-6 rounded-2xl bg-gray-800 border border-gray-700 hover:border-blue-500/50 transition-colors">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2 text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

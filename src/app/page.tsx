import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 w-full py-5 px-8 flex justify-between items-center border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <span className="text-lg font-semibold text-slate-200">Sistema de Monitoramento</span>
        <nav className="flex items-center gap-4">
          <span className="text-xs text-slate-500 hidden sm:block">Acesso restrito</span>
          <Link
            href="/login"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium border border-slate-700"
          >
            Entrar
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="max-w-2xl space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Sistema Operacional
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Plataforma de Inteligência
              <br />
              <span className="text-slate-400">Política Regional</span>
            </h1>
            <p className="text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
              Sistema privado de monitoramento e análise de dados políticos.
              Acesso exclusivo para usuários credenciados.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 py-6 border-y border-slate-800/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">399</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Municípios</p>
            </div>
            <div className="text-center border-x border-slate-800/50">
              <p className="text-2xl font-bold text-white">24/7</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Monitoramento</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Privado</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/login"
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-lg shadow-blue-500/20"
            >
              Acessar Sistema
            </Link>
            <button
              disabled
              className="px-6 py-3 rounded-lg bg-slate-800/50 text-slate-500 font-medium border border-slate-700/50 cursor-not-allowed"
            >
              Solicitar Acesso
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 border-t border-slate-800/50 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-slate-600">Sistema protegido e monitorado</span>
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Todos os direitos reservados. Uso interno.
          </p>
        </div>
      </footer>
    </div>
  );
}

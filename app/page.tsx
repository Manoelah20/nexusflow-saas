import Link from "next/link";
import { Zap, ShieldCheck, Mail, ArrowRight, Activity, Terminal, CheckCircle2, Lock, Sparkles, Cpu, Layers } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 selection:bg-cyan-500 selection:text-slate-950 relative overflow-hidden bg-grid-pattern">
      {/* Dynamic Ambient Background Lights */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-600/20 via-sky-500/15 to-indigo-600/20 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-[40%] -left-32 w-80 h-80 bg-cyan-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-[50%] -right-32 w-80 h-80 bg-indigo-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Navbar */}
      <nav className="border-b border-white/[0.08] bg-[#030712]/75 backdrop-blur-xl sticky top-0 z-50 px-6 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-9 h-9 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-cyan-400">
                <Zap size={20} className="fill-cyan-400 text-cyan-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-mono">
                nexus<span className="text-cyan-400">flow</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 font-mono border border-cyan-400/20 tracking-wider">
                V2.4 PRO
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs sm:text-sm text-slate-400 hover:text-white transition font-medium px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="relative group overflow-hidden rounded-xl p-[1px] font-semibold text-xs sm:text-sm"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-indigo-600 transition-all duration-300 group-hover:opacity-90"></span>
              <span className="relative flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950/90 text-white group-hover:bg-transparent transition-all duration-300">
                Acessar Console <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative max-w-5xl mx-auto px-6 pt-24 pb-20 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border-cyan-500/20 text-xs text-cyan-300 mb-8 shadow-inner">
          <Sparkles size={14} className="text-cyan-400 animate-pulse" />
          <span className="font-mono tracking-wide">Next-Gen Realtime Event Engine</span>
        </div>

        <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
          Orquestração de Webhooks{" "}
          <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 font-black">
            com latência ultra-baixa
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 font-light">
          A plataforma moderna de infraestrutura para desenvolvedores front-end e engenheiros de produto. 
          Gatilhos HTTP tipados, regras declarativas e streaming de logs em tempo real.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
          >
            Abrir Console Interativo <ArrowRight size={16} />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl glass-panel hover:bg-slate-800/60 text-slate-200 font-semibold text-sm transition flex items-center justify-center gap-2 border-white/10 hover:border-cyan-500/30"
          >
            <Lock size={15} className="text-slate-400" /> Criar Workspace
          </Link>
        </div>
      </header>

      {/* Hero Visual Preview */}
      <div className="max-w-5xl mx-auto px-6 mb-24 z-10 relative">
        <div className="rounded-2xl glass-panel p-2 shadow-2xl border-white/10 glow-cyan">
          <div className="bg-[#0b1120] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-4 py-3 bg-slate-900/60 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                <span className="ml-3 text-xs font-mono text-slate-400">~/nexusflow/architecture.tsx</span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Edge Streaming Live
              </span>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/5 space-y-2">
                <div className="text-slate-400 text-[11px]">TRIGGER INGESTION</div>
                <div className="text-cyan-300 font-bold">POST /webhooks/v1/event</div>
                <div className="text-slate-500 text-[10px]">Zod runtime type validation</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/5 space-y-2">
                <div className="text-slate-400 text-[11px]">DISPATCH PIPELINE</div>
                <div className="text-indigo-300 font-bold">Resend + Queue Router</div>
                <div className="text-slate-500 text-[10px]">Zero-cold-start latency</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-950/80 border border-white/5 space-y-2">
                <div className="text-slate-400 text-[11px]">REALTIME TELEMETRY</div>
                <div className="text-emerald-400 font-bold">Supabase CDC Socket</div>
                <div className="text-slate-500 text-[10px]">Sub-50ms browser updates</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards Modernos */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-white/[0.06]">
        <div className="text-center mb-14">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Stack Arquitetural</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            Construído com o estado da arte do ecossistema React
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel-interactive rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-5 border border-cyan-500/20">
              <Cpu size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-mono">Edge Native Next 15</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Server Actions e Route Handlers assíncronos otimizados para máxima taxa de requisições por segundo.
            </p>
          </div>

          <div className="glass-panel-interactive rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 border border-indigo-500/20">
              <Layers size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-mono">Row Level Security</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Isolamento multi-inquilino certificado no núcleo do PostgreSQL. Nenhuma fuga de dados entre workspaces.
            </p>
          </div>

          <div className="glass-panel-interactive rounded-2xl p-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/20">
              <Activity size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-mono">Live WebSocket CDC</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Cada log gravado dispara eventos via Change Data Capture no banco, alimentando as métricas instantaneamente.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6 font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            nexusflow saas — crafted for modern front-end engineers © {new Date().getFullYear()}
          </div>
          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/pricing" className="hover:text-cyan-400 transition">
              Planos e Preços
            </Link>
            <Link href="/terms" className="hover:text-cyan-400 transition">
              Termos de Uso
            </Link>
            <Link href="/privacy" className="hover:text-cyan-400 transition">
              Privacidade (LGPD)
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

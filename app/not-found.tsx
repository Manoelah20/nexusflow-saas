import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-6 text-center font-mono relative overflow-hidden bg-grid-pattern">
      <div className="max-w-md space-y-6 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-center text-cyan-400 mx-auto shadow-lg shadow-cyan-500/20">
          <Zap size={24} className="fill-cyan-400" />
        </div>
        <div className="space-y-2">
          <span className="text-xs text-rose-400 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
            ERROR 404 // NOT FOUND
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-2">Página não encontrada</h1>
          <p className="text-xs text-slate-400 font-light leading-relaxed">
            A rota solicitada não existe ou foi movida na infraestrutura do NexusFlow.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20"
        >
          <ArrowLeft size={14} /> Voltar para o início
        </Link>
      </div>
    </div>
  );
}

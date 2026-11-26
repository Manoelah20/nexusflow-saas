'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Zap, Shield, Sparkles, MessageSquare, ArrowRight, PhoneCall, HelpCircle, Building2 } from 'lucide-react';

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      badge: 'Ideia inicial',
      tagline: 'Em planejamento',
      priceDisplay: 'Em definição',
      period: '',
      description: 'Recebimento de eventos por webhook autenticado.',
      features: [
        'Validação dos campos permitidos',
        'Limite de tamanho da requisição',
        'Resumo do resultado e latência',
      ],
      popular: false,
      cta: 'Entre em contato',
    },
    {
      id: 'pro',
      name: 'Professional Pro',
      badge: 'Ideia em avaliação',
      tagline: 'Em planejamento',
      priceDisplay: 'Em definição',
      period: '',
      description: 'Ações que podem ser configuradas conforme o ambiente.',
      features: [
        'E-mail via Resend',
        'Webhooks Slack e Discord',
        'Encaminhamento HTTP para destino HTTPS público',
      ],
      popular: true,
      cta: 'Entre em contato',
    },
    {
      id: 'custom',
      name: 'Enterprise / Sob Medida',
      badge: 'Ideia futura',
      tagline: 'Ainda não disponível',
      priceDisplay: 'Em definição',
      period: '',
      description: 'Recursos empresariais ainda não implementados.',
      features: [
        'Limites e capacidade a definir',
        'Política de retenção a definir',
        'Disponibilidade e suporte a definir',
      ],
      popular: false,
      cta: 'Entre em contato',
    },
  ];

  const handleOpenContact = (planId: string) => {
    setSelectedPlan(planId);
    setIsContactModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-6 sm:p-12 font-sans bg-grid-pattern relative overflow-hidden">
      {/* Luzes de Fundo Dinâmicas */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-cyan-600/20 via-sky-500/15 to-indigo-600/20 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">
        {/* Topo */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition"
          >
            <ArrowLeft size={14} /> Voltar para o início
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-mono px-3.5 py-1.5 rounded-xl glass-panel text-slate-300 hover:text-white transition"
          >
            Acessar Console →
          </Link>
        </div>

        {/* Header Explicativo */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono border border-cyan-500/20 shadow-inner">
            <Sparkles size={14} /> Planos demonstrativos
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight font-mono">
            Ideias de planos para o NexusFlow
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
            Esta página é uma simulação de como os planos poderiam ser apresentados. O serviço comercial ainda não está configurado.
          </p>

          <div className="pt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono text-cyan-300">
            <HelpCircle size={14} className="text-cyan-400" />
            <span>Preços, limites e recursos são exemplos, não uma oferta comercial.</span>
          </div>
        </div>

        {/* Grid de Planos Flexíveis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 sm:p-8 relative flex flex-col justify-between transition-all ${
                plan.popular
                  ? 'glass-panel border-cyan-500/60 shadow-2xl shadow-cyan-500/10'
                  : 'glass-panel border-white/[0.08] hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 text-slate-950 text-[10px] font-mono font-bold uppercase tracking-wider shadow-lg">
                  Mais Procurado
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                    {plan.badge}
                  </span>
                  <h2 className="text-2xl font-bold text-white font-mono">{plan.name}</h2>
                  <p className="text-xs text-slate-400 mt-2 font-light leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.06]">
                  <div className="font-mono">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {plan.priceDisplay}
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">{plan.period}</span>
                  </div>
                  <p className="text-[11px] text-cyan-300/80 font-mono mt-1">{plan.tagline}</p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-white/[0.06] text-xs font-mono">
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider">Escopo e Recursos:</div>
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-slate-300">
                      <Check size={14} className="text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handleOpenContact(plan.id)}
                  className={`w-full py-3 rounded-xl font-mono text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-900 hover:bg-slate-800 text-white border border-white/10'
                  }`}
                >
                  {plan.cta} <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de Contato / Cotação Comercial */}
        {isContactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="glass-panel border-white/10 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">PLANOS ILUSTRATIVOS</span>
                  <h3 className="text-lg font-bold text-white font-mono mt-0.5">
                    Plano {selectedPlan?.toUpperCase()}
                  </h3>
                </div>
                <button onClick={() => setIsContactModalOpen(false)} className="text-slate-400 hover:text-white transition">
                  ✕
                </button>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                Os planos e preços são ilustrativos. O canal de contato ainda não foi configurado; nenhum dado pessoal será solicitado ou enviado por esta página.
              </p>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition"
              >
                Entendi
              </button>
            </div>
          </div>
        )}

        {/* Rodapé da Página */}
        <footer className="pt-12 border-t border-white/[0.06] text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>NexusFlow SaaS © {new Date().getFullYear()} — Modelos Comerciais Customizados</div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/terms" className="hover:text-white transition">Termos</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-white transition">Privacidade (LGPD)</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

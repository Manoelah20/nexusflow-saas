'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Zap, Shield, Sparkles, MessageSquare, ArrowRight, PhoneCall, HelpCircle, Building2, Send } from 'lucide-react';

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadVolume, setLeadVolume] = useState('10k a 50k eventos/mês');
  const [submitted, setSubmitted] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      badge: 'Pequenos Negócios & Validação',
      tagline: 'Investimento inicial flexível',
      priceDisplay: 'A partir de R$ 97',
      period: '/mês (referência inicial)',
      description: 'Ideal para validar integrações e automações com volume moderado de requisições.',
      features: [
        'Até 5 pipelines configurados',
        'Volume inicial sugerido: até 15.000 req/mês',
        'E-mails transacionais (Resend)',
        'Notificações em Slack e Discord',
        'Telemetria de rede e logs por 7 dias',
        'Suporte técnico por e-mail e chamados',
      ],
      popular: false,
      cta: 'Solicitar Cotação Starter',
    },
    {
      id: 'pro',
      name: 'Professional Pro',
      badge: 'Mais Recomendado',
      tagline: 'Ideal para E-commerces & SaaS',
      priceDisplay: 'A partir de R$ 297',
      period: '/mês (sujeito a volume)',
      description: 'Estrutura completa com canal de WhatsApp ativado e telemetria analítica profunda.',
      features: [
        'Até 25 pipelines simultâneos',
        'Volume sugerido: 50.000 a 200.000 req/mês',
        'Disparo Instantâneo para WhatsApp',
        'E-mails transacionais + Webhooks Slack/Discord',
        'Telemetria analítica P95 e exportação CSV/JSON',
        'Retenção estendida de logs (30 dias)',
        'Suporte prioritário via WhatsApp direto',
      ],
      popular: true,
      cta: 'Personalizar Plano Pro',
    },
    {
      id: 'custom',
      name: 'Enterprise / Sob Medida',
      badge: 'Solução Dedicada',
      tagline: 'Customizado para sua operação',
      priceDisplay: 'Sob Consulta',
      period: 'Proposta personalizada',
      description: 'Para operações de alto volume, fintechs e empresas com requisitos rígidos de SLA.',
      features: [
        'Pipelines e requisições ilimitadas',
        'Rate limit dedicado e escalabilidade serverless',
        'WhatsApp + Slack + Discord + Repasse HTTP',
        'Retenção de logs por 365 dias (Auditoria LGPD)',
        'Acordo de Nível de Serviço formal (SLA 99.9%)',
        'Opção de implantação White-label (marca própria)',
        'Gerente de contas e suporte de engenharia 24/7',
      ],
      popular: false,
      cta: 'Conversar com Consultor',
    },
  ];

  const handleOpenContact = (planId: string) => {
    setSelectedPlan(planId);
    setIsContactModalOpen(true);
    setSubmitted(false);
  };

  const handleSendLead = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Formata mensagem para abrir no WhatsApp comercial
    const message = encodeURIComponent(
      `Olá! Tenho interesse no NexusFlow (${selectedPlan?.toUpperCase()}).\n\nNome: ${leadName}\nEmpresa: ${leadCompany}\nVolume estimado: ${leadVolume}\nContato: ${leadPhone}`
    );

    setTimeout(() => {
      // Abre o WhatsApp com a mensagem pronta
      window.open(`https://wa.me/5511999998888?text=${message}`, '_blank');
      setIsContactModalOpen(false);
    }, 1200);
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
            <Sparkles size={14} /> Planos Comerciais Flexíveis
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight font-mono">
            Investimento proporcional ao tamanho da sua operação
          </h1>
          <p className="text-sm sm:text-base text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
            Cada negócio possui um volume único de webhooks e necessidades específicas. Apresentamos valores de referência iniciais e adaptamos a proposta exatamente ao seu cenário.
          </p>

          <div className="pt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono text-cyan-300">
            <HelpCircle size={14} className="text-cyan-400" />
            <span>Valores sujeitos a alinhamento comercial sem compromisso.</span>
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
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">PROPOSTA PERSONALIZADA</span>
                  <h3 className="text-lg font-bold text-white font-mono mt-0.5">
                    Cotação para Plano {selectedPlan?.toUpperCase()}
                  </h3>
                </div>
                <button onClick={() => setIsContactModalOpen(false)} className="text-slate-400 hover:text-white transition">
                  ✕
                </button>
              </div>

              {submitted ? (
                <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 font-mono">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Check size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Solicitação Recebida!</h4>
                  <p className="text-xs text-slate-300 font-light">
                    Abrindo atendimento comercial para alinharmos os detalhes da sua operação...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSendLead} className="space-y-4 font-mono text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Seu Nome / Responsável</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Eduardo"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Nome da Empresa ou Projeto</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Minha Loja Virtual Ltda"
                      value={leadCompany}
                      onChange={(e) => setLeadCompany(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">WhatsApp / Telefone para Contato</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: (11) 98765-4321"
                      value={leadPhone}
                      onChange={(e) => setLeadPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Volume Estimado de Eventos / Mês</label>
                    <select
                      value={leadVolume}
                      onChange={(e) => setLeadVolume(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 text-xs font-mono"
                    >
                      <option value="Até 10k eventos/mês">Até 10.000 requisições/mês</option>
                      <option value="10k a 50k eventos/mês">10.000 a 50.000 requisições/mês</option>
                      <option value="50k a 200k eventos/mês">50.000 a 200.000 requisições/mês</option>
                      <option value="Acima de 500k eventos/mês">Acima de 500.000 requisições/mês (Enterprise)</option>
                    </select>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed font-light pt-1">
                    Ao clicar abaixo, você será direcionado para um canal direto com nosso time técnico para receber a proposta sem compromisso.
                  </p>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 font-mono"
                  >
                    Conversar com Especialista <Send size={14} />
                  </button>
                </form>
              )}
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

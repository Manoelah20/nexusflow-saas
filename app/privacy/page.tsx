import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Database } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-6 sm:p-12 font-sans bg-grid-pattern relative">
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition"
        >
          <ArrowLeft size={14} /> Voltar para o início
        </Link>

        <header className="border-b border-white/10 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20 mb-3">
            <ShieldCheck size={14} /> Privacidade
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            Política de Privacidade e Proteção de Dados
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-mono">Informações do protótipo; revisar e completar antes de oferecer o serviço ao público.</p>
        </header>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-light">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              1. Quais dados coletamos
            </h2>
            <p>
              Para prestar os serviços de automação e telemetria, o NexusFlow processa os seguintes dados:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs font-mono">
              <li><strong>Dados de Conta:</strong> Nome e endereço de e-mail do titular da conta;</li>
              <li><strong>Credenciais:</strong> Senhas armazenadas usando hash bcrypt; tokens de redefinição e verificação são armazenados como hashes;</li>
              <li><strong>Tokens de Autenticação:</strong> Hashes criptográficos SHA-256 de API Keys (nunca o segredo em texto puro);</li>
              <li><strong>Metadados:</strong> IP pode ser usado temporariamente para limitar requisições; logs guardam um resumo do evento, latência e resultado, sem o conteúdo pessoal completo.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              2. Finalidade e Base Legal do Tratamento
            </h2>
            <p>
              As finalidades, bases legais, prazos de retenção e responsabilidades dos fornecedores precisam ser definidos pelo operador do serviço antes do lançamento. Não use dados reais neste protótipo.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              3. Medidas de Segurança da Informação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono pt-2">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Lock size={13} /> Criptografia em Trânsito e Repouso
                </span>
                <p className="text-slate-400 font-light leading-relaxed">
                  A aplicação deve ser publicada somente em HTTPS. A segurança do armazenamento depende também das configurações e dos contratos do provedor escolhido.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Database size={13} /> Isolamento Multi-Inquilino
                </span>
                <p className="text-slate-400 font-light leading-relaxed">
                  As consultas principais são limitadas ao usuário autenticado. Isso não substitui uma revisão independente nem garante ausência de falhas.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              4. Direitos dos Titulares de Dados
            </h2>
            <p>
              Antes de produção, o operador deve configurar um canal de contato e processos para solicitações dos titulares. Atualmente o protótipo não oferece exportação ou exclusão de conta pelo painel.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs font-mono">
              <li>Acesso, correção e exclusão, conforme fluxo a ser definido pelo operador;</li>
              <li>Portabilidade dos dados em formato estruturado, conforme aplicável.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              5. Compartilhamento com Terceiros
            </h2>
            <p>
              O serviço usa provedores de banco de dados e e-mail configurados pelo operador. A lista efetiva, os países de processamento e os contratos precisam ser confirmados para cada ambiente antes da publicação.
            </p>
          </section>
        </div>

        <footer className="pt-8 border-t border-white/10 text-xs text-slate-500 font-mono text-center">
          NexusFlow SaaS © {new Date().getFullYear()} — Proteção e Privacidade de Dados por Design.
        </footer>
      </div>
    </div>
  );
}

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, CheckCircle2 } from 'lucide-react';

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
            <ShieldCheck size={14} /> Conformidade LGPD & GDPR
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            Política de Privacidade e Proteção de Dados
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-mono">Em estrita observância à Lei Geral de Proteção de Dados (Lei 13.709/2018)</p>
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
              <li><strong>Credenciais Criptografadas:</strong> Senha com hash irreversível via algoritmo Bcrypt (fator de custo 10);</li>
              <li><strong>Tokens de Autenticação:</strong> Hashes criptográficos SHA-256 de API Keys (nunca o segredo em texto puro);</li>
              <li><strong>Metadados de Telemetria:</strong> Endereço IP do emissor de webhooks, latência de execução (ms), códigos de status HTTP e registros de entrega.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              2. Finalidade e Base Legal do Tratamento
            </h2>
            <p>
              O tratamento de dados é realizado estritamente para a execução de contrato e prestação dos serviços contratados (Art. 7º, V da LGPD), bem como para o cumprimento de obrigações legais de registro de acesso a aplicações (Marco Civil da Internet, Art. 15).
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
                  Tráfego protegido com protocolo HTTPS/TLS obrigatório e banco de dados Neon criptografado.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Database size={13} /> Isolamento Multi-Inquilino
                </span>
                <p className="text-slate-400 font-light leading-relaxed">
                  Workspaces estritamente separados por chaves primárias UUID v4. Nenhuma mistura entre contas.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              4. Direitos dos Titulares de Dados
            </h2>
            <p>
              Em conformidade com o Artigo 18 da LGPD, o usuário pode exercer a qualquer momento:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs font-mono">
              <li><strong>Direito de Acesso e Portabilidade:</strong> Exportação completa de seus logs e pipelines em formatos abertos (CSV e JSON) diretamente pelo painel;</li>
              <li><strong>Direito de Retificação:</strong> Atualização de nome e redefinição instantânea de senha;</li>
              <li><strong>Direito à Eliminação (Esquecimento):</strong> Exclusão total de sua conta com remoção em cascata (ON DELETE CASCADE) de todos os registros de telemetria e chaves do banco de dados.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              5. Compartilhamento com Terceiros
            </h2>
            <p>
              O NexusFlow <strong>não comercializa</strong> dados pessoais em nenhuma hipótese. Os dados transitam exclusivamente através de provedores de infraestrutura essenciais (Neon para persistência de dados e Resend para disparo de e-mails transacionais configurados pelo próprio usuário).
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

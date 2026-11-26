import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, FileText } from 'lucide-react';

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-mono border border-cyan-500/20 mb-3">
            <FileText size={14} /> Contrato de Licença e Uso
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
            Termos de Uso do Serviço
          </h1>
          <p className="text-xs text-slate-400 mt-2 font-mono">Rascunho de protótipo — precisa de revisão jurídica e identificação do operador antes do lançamento.</p>
        </header>

        <div className="space-y-6 text-sm text-slate-300 leading-relaxed font-light">
          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              1. Objeto e Aceitação
            </h2>
            <p>
              Este projeto está em desenvolvimento. Estes termos são um rascunho e não constituem ainda um contrato de serviço. O operador, os canais de suporte, os preços e as condições finais ainda precisam ser definidos.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              2. Cadastro e Responsabilidade de Credenciais
            </h2>
            <p>
              O usuário é o único responsável pela guarda e confidencialidade de suas credenciais de acesso e API Keys geradas. Todas as ações efetuadas a partir de suas chaves de autenticação serão imputadas à sua conta. Em caso de extravio ou comprometimento de um token Bearer, o usuário deve imediatamente revogá-lo por meio do painel de controle.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              3. Uso Aceitável e Proibições
            </h2>
            <p>
              É expressamente proibido utilizar a infraestrutura do NexusFlow para:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs font-mono">
              <li>Envio de comunicações não autorizadas, SPAM ou correntes de e-mail;</li>
              <li>Tentativas de sobrecarga, ataques de negação de serviço (DoS/DDoS) ou varredura de vulnerabilidades;</li>
              <li>Tráfego de conteúdo ilícito, fraudulento, difamatório ou que viole direitos de propriedade intelectual de terceiros;</li>
              <li>Violação proposital de limites de taxa de requisição (Rate Limiting).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              4. Disponibilidade e Nível de Serviço (SLA)
            </h2>
            <p>
              O protótipo não oferece compromisso de disponibilidade (SLA). Não há garantia de operação contínua ou suporte neste estágio.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              5. Propriedade Intelectual e Licença
            </h2>
            <p>
              Os direitos sobre código, marcas e conteúdo devem ser definidos pelo titular do projeto antes da distribuição ou da oferta do serviço.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              6. Foro de Eleição
            </h2>
            <p>
              Este instrumento é regido pelas leis da República Federativa do Brasil, em especial o Marco Civil da Internet (Lei nº 12.965/14) e a Lei Geral de Proteção de Dados (Lei nº 13.709/18).
            </p>
          </section>
        </div>

        <footer className="pt-8 border-t border-white/10 text-xs text-slate-500 font-mono text-center">
          NexusFlow SaaS © {new Date().getFullYear()} — Todos os direitos reservados.
        </footer>
      </div>
    </div>
  );
}

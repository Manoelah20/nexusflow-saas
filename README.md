# NexusFlow

> Protótipo de aplicação SaaS para receber webhooks autenticados, validar eventos e executar ações configuradas.

## 🎯 Para que este aplicativo serve?

O NexusFlow recebe requisições HTTP POST autenticadas por uma chave Bearer e valida um conjunto limitado de campos. Para um evento aceito, pode enviar e-mail via Resend, publicar em um webhook Slack/Discord ou encaminhar um POST HTTP para um endereço HTTPS público.

1. **Recebimento**: Endpoint HTTP POST por automação, protegido por chave Bearer.
2. **Validação**: O payload permitido é validado com Zod e tem limite de tamanho.
3. **Ações disponíveis**: E-mail via Resend, webhook Slack/Discord e repasse HTTP.
4. **Registro**: O banco guarda resultado, latência e resumo dos campos; o conteúdo pessoal completo não é incluído no resumo do log.

## 💼 Casos de Uso Reais

- 🛒 **E-commerce & Checkout**: Disparo de confirmação imediata de compra e nota fiscal quando o gateway aprova o pagamento.
- 🚨 **Monitoramento de Infraestrutura**: Alertas de falha crítica de servidores para equipes de engenharia.
- 📬 **Onboarding de Clientes**: Envio automático de boas-vindas, verificação de e-mail e chaves de acesso no cadastro.
- 🔗 **Hub de Integrações**: Centralizador de webhooks externos em um único painel seguro e auditável.

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Destaque |
| --- | --- | --- |
| **Frontend** | Next.js 15 (App Router, React 19) | Interface moderna com tema escuro, Glassmorphism e Tailwind CSS |
| **Banco de Dados** | Neon (PostgreSQL Serverless) | Escalabilidade serverless com bancos isolados para produção e testes |
| **ORM** | Drizzle ORM | Consultas fortemente tipadas e proteção nativa contra SQL Injection |
| **Autenticação & Segurança** | NextAuth.js v5 + Bcryptjs | Sessões JWT com cookies seguros, confirmação de e-mail, rate limiting e recadastro |
| **Validação** | Zod | Validação em runtime de schemas e tipagem estrita de payloads |
| **Mensageria** | Resend API | Entrega transacional de e-mails com confirmação de conta e recuperação de senha |
| **Deploy & Hospedagem** | Vercel | Build e publicação contínua a partir da branch `main` no GitHub |
| **Ícones & UI** | Lucide React | Visual hacker/terminal moderno com feedback visual interativo |

## ✨ Principais Funcionalidades

- ✉️ **Confirmação de E-mail no Cadastro**: Fluxo de verificação por token com envio transacional via Resend antes do acesso completo.
- 🚦 **Rate Limiting**: Controle de frequência de requisições persistido no banco (`rate_limit_buckets`).
- 👁️ **Visualização de Senha**: Alternância com 1 clique (ícone de olho) para conferir a senha digitada.
- 🔑 **Recadastrar Senha**: Opção "Esqueceu a senha?" integrada na tela de login com recadastro seguro e invalidação da senha anterior.
- 🛡️ **Segurança Multi-Tenant**: Dados e pipelines isolados por usuário (UUIDs v4) nas tabelas `users`, `automations`, `api_keys` e `execution_logs`.
- 🔒 **API Keys protegidas**: Autenticação de webhooks baseada em hash SHA-256 (tokens puros nunca são armazenados no banco e só podem ser copiados uma vez na interface).
- 🧪 **Simulador de Eventos Integrado**: Teste seus webhooks direto pelo navegador com injeção de payloads customizados.
- 💻 **Gerador Automático de cURL**: Copie chamadas prontas para integrar no terminal ou no Postman.
- 📊 **Console de Telemetria**: Visualização detalhada de histórico, latência em ms e modal de depuração de payloads.

## 🚀 Como Rodar o Projeto Localmente

### 1. Clonar o repositório e instalar dependências

```bash
git clone https://github.com/Manoelah20/nexusflow-saas.git
cd nexusflow-saas
npm install
```

## 👩‍💻 Autoria

Projeto desenvolvido por **Manoela Harrison** ([GitHub @Manoelah20](https://github.com/Manoelah20)).

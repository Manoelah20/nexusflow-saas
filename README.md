# ⚡ NexusFlow SaaS — Next-Gen Realtime Event Engine

> **Plataforma Enterprise de Orquestração de Webhooks e Automação de Eventos com Telemetria em Tempo Real.**

Desenvolvido para engenheiros de produto, desenvolvedores e empresas modernas que precisam conectar eventos externos (compras em e-commerce, alertas de segurança, transações bancárias, webhooks de terceiros) a ações automatizadas com latência ultra-baixa e monitoramento ao vivo.

---

## 🎯 Para que este aplicativo serve?

Imagine que seu sistema ou loja virtual (ex: Shopify, Stripe, Hotmart, Mercado Pago ou seu próprio backend) acaba de confirmar uma venda ou detectar um erro crítico:

1. **Recebimento Instantâneo (Ingestion)**: O NexusFlow disponibiliza endpoints HTTP tipados e blindados com autenticação Bearer para receber dados via POST.
2. **Validação Estrita de Dados**: Cada payload JSON é validado em microssegundos com **Zod**, rejeitando requisições malformadas ou com dados incompletos.
3. **Disparo de Ações (Dispatch)**: Executa ações automáticas de alta prioridade (como envio de e-mails transacionais via **Resend**, alertas de incidentes ou repasse HTTP).
4. **Telemetria e Auditoria em Tempo Real**: Cada disparo é registrado no banco com métricas de latência em milissegundos, status de entrega (`200 OK` ou `FAILED`) e payload completo inspecionável para depuração.

---

## 💼 Casos de Uso Reais

- 🛒 **E-commerce & Checkout**: Disparo de confirmação imediata de compra e nota fiscal quando o gateway aprova o pagamento.
- 🚨 **Monitoramento de Infraestrutura**: Alertas de falha crítica de servidores para equipes de engenharia.
- 📬 **Onboarding de Clientes**: Envio automático de boas-vindas e chaves de acesso assim que um novo assinante se cadastra.
- 🔗 **Hub de Integrações**: Centralizador de webhooks externos em um único painel seguro e auditável.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Destaque |
|---|---|---|
| **Frontend** | Next.js 15 (App Router, React 19) | Interface moderna com tema escuro, Glassmorphism e Tailwind CSS |
| **Banco de Dados** | Neon (PostgreSQL Serverless) | Escalabilidade serverless com até 10 bancos gratuitos |
| **ORM** | Drizzle ORM | Consultas fortemente tipadas e proteção nativa contra SQL Injection |
| **Autenticação** | NextAuth.js v5 + Bcryptjs | Sessões JWT com cookies seguros, senhas criptografadas e recadastro |
| **Validação** | Zod | Validação em runtime de schemas e tipagem estrita de payloads |
| **Mensageria** | Resend API | Entrega transacional de e-mails com alta entregabilidade |
| **Ícones & UI** | Lucide React | Visual hacker/terminal moderno com feedback visual interativo |

---

## ✨ Principais Funcionalidades

- 👁️ **Visualização de Senha**: Alternância com 1 clique (ícone de olho) para conferir a senha digitada.
- 🔑 **Recadastrar Senha**: Opção "Esqueceu a senha?" integrada na tela de login com recadastro seguro e invalidação da senha anterior.
- 🛡️ **Segurança Multi-Tenant**: Dados e pipelines totalmente isolados por usuário (UUIDs v4).
- 🔒 **API Keys Criptografadas**: Autenticação de webhooks baseada em hash SHA-256 (tokens puros nunca são expostos no banco).
- 🧪 **Simulador de Eventos Integrado**: Teste seus webhooks direto pelo navegador com injeção de payloads customizados.
- 💻 **Gerador Automático de cURL**: Copie chamadas prontas para integrar no terminal ou no Postman.
- 📊 **Console de Telemetria**: Visualização detalhada de histórico, latência em ms e modal de depuração de payloads.

---

## 🚀 Como Rodar o Projeto Localmente

### 1. Clonar o repositório e instalar dependências
```bash
git clone https://github.com/seu-usuario/nexusflow-saas.git
cd nexusflow-saas
npm install
```

### 2. Configurar variáveis de ambiente
Crie um arquivo `.env.local` na raiz do projeto com suas credenciais:

```env
# Banco de dados Neon (PostgreSQL gratuito em https://neon.tech):
DATABASE_URL="postgresql://usuario:senha@ep-exemplo.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Segredo de sessão JWT do NextAuth:
AUTH_SECRET="chave-secreta-aleatoria-de-32-caracteres"
NEXTAUTH_URL="http://localhost:3000"

# Chave de e-mails do Resend (opcional para testes reais em https://resend.com):
RESEND_API_KEY="re_123456789_abcdefghijklmnopqrstuvwxyz"
```

### 3. Criar as tabelas no banco de dados
Execute a migração automatizada para provisionar as tabelas no Neon:
```bash
npm run db:migrate
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Abra seu navegador em **[http://localhost:3000](http://localhost:3000)**.

---

## 🧪 Suíte de Testes de Segurança

O projeto conta com uma suíte automatizada de testes cobrindo SQL Injection, hashing bcrypt, isolamento multi-tenant, tokens SHA-256 e validação Zod:

```bash
npx tsx scripts/security-tests.mjs
```
*Resultado: 22 testes de segurança executados e 100% aprovados.*

---

## 📄 Licença

Distribuído sob licença comercial privada. Desenvolvido com foco em alta performance e segurança empresarial.

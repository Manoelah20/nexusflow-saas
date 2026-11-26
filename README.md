# NexusFlow

> Protótipo de aplicação SaaS para receber webhooks autenticados, validar eventos e executar ações configuradas.

O projeto está em desenvolvimento e ainda não deve ser tratado como serviço comercial pronto. A página de planos é demonstrativa; autenticação, e-mail e banco exigem configuração própria. Faça a revisão de segurança e privacidade do seu ambiente antes de usar dados reais.

---

## 🎯 Para que este aplicativo serve?

O NexusFlow recebe requisições HTTP POST autenticadas por uma chave Bearer e valida um conjunto limitado de campos. Para um evento aceito, pode enviar e-mail via Resend, publicar em um webhook Slack/Discord ou encaminhar um POST HTTP para um endereço HTTPS público.

1. **Recebimento**: Endpoint HTTP POST por automação, protegido por chave Bearer.
2. **Validação**: O payload permitido é validado com Zod e tem limite de tamanho.
3. **Ações disponíveis**: E-mail via Resend, webhook Slack/Discord e repasse HTTP.
4. **Registro**: O banco guarda resultado, latência e resumo dos campos; o conteúdo pessoal completo não é incluído no resumo do log.

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
- 🔒 **API Keys protegidas**: Autenticação de webhooks baseada em hash SHA-256 (tokens puros nunca são armazenados no banco e só podem ser copiados uma vez na interface).
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

# Segredo de sessão do NextAuth:
AUTH_SECRET="chave-secreta-aleatoria-de-32-caracteres"
AUTH_URL="http://localhost:3000"

# E-mail transacional (necessário para cadastro e recuperação de senha):
RESEND_API_KEY="re_123456789_abcdefghijklmnopqrstuvwxyz"
RESEND_FROM_EMAIL="NexusFlow <noreply@seu-dominio-verificado.com>"
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

Existe uma suíte que grava e apaga dados. **Nunca a execute apontando para produção.** Use apenas um banco PostgreSQL descartável e isolado, com as tabelas criadas, e configure explicitamente:

```bash
$env:NEXUSFLOW_TEST_DATABASE_URL="postgresql://.../banco_descartavel?sslmode=require"
$env:NEXUSFLOW_ALLOW_DESTRUCTIVE_SECURITY_TESTS="true"
npm run security:test
```

O script não carrega `.env.local` e exige uma confirmação adicional porque remove os dados de teste ao final. A suíte ainda precisa ser atualizada para cobrir os novos fluxos de confirmação de e-mail e rate limiting.

---

## 📄 Licença

Distribuído sob licença comercial privada. Desenvolvido com foco em alta performance e segurança empresarial.

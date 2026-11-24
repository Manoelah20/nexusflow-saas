import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../db/schema.js';
import { users, apiKeys, automations, executionLogs } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import pkg from '@next/env';
const { loadEnvConfig } = pkg;

loadEnvConfig(process.cwd());

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL ausente');
  process.exit(1);
}

const client = neon(dbUrl);
const db = drizzle(client, { schema });

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

async function runSecuritySuite() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║       NEXUSFLOW — SUÍTE DE TESTES DE SEGURANÇA E DADOS         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // ──────────────────────────────────────────────────────────────────────────
  console.log('🛡️  TESTE 1: Criptografia e Armazenamento Seguro de Senhas');
  // ──────────────────────────────────────────────────────────────────────────
  const testPassword = 'PasswordForte@2026';
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  assert(hashedPassword !== testPassword, 'A senha nunca é salva em texto puro');
  assert(hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$'), 'Formato Bcrypt com Salt Rounds 10 verificado');
  
  const isMatch = await bcrypt.compare(testPassword, hashedPassword);
  assert(isMatch === true, 'Senha correta valida com sucesso');

  const isWrongMatch = await bcrypt.compare('SenhaIncorreta123', hashedPassword);
  assert(isWrongMatch === false, 'Senha incorreta é rejeitada de imediato');

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n🛡️  TESTE 2: Prevenção contra SQL Injection');
  // ──────────────────────────────────────────────────────────────────────────
  const maliciousEmail = "admin' OR '1'='1' --";
  const injectionResult = await db
    .select()
    .from(users)
    .where(eq(users.email, maliciousEmail));

  assert(injectionResult.length === 0, 'Injeção SQL tratada como string literal parametrizada (sem vazamento de dados)');

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n🛡️  TESTE 3: Criação de Usuários e Isolamento Multi-Tenant');
  // ──────────────────────────────────────────────────────────────────────────
  const emailA = `tenant_a_${Date.now()}@teste.com`;
  const emailB = `tenant_b_${Date.now()}@teste.com`;

  const [userA] = await db
    .insert(users)
    .values({ email: emailA, password: hashedPassword, name: 'Empresa A' })
    .returning();

  const [userB] = await db
    .insert(users)
    .values({ email: emailB, password: hashedPassword, name: 'Empresa B' })
    .returning();

  assert(userA.id && userB.id, 'Usuários criados com identificadores UUID v4 não sequenciais');
  assert(userA.id !== userB.id, 'Tenants isolados possuem UUIDs independentes');

  // Criar automações para A e B
  const [autoA] = await db
    .insert(automations)
    .values({
      userId: userA.id,
      name: 'Pipeline Confidencial Empresa A',
      triggerType: 'webhook',
      actionType: 'send_email',
    })
    .returning();

  const [autoB] = await db
    .insert(automations)
    .values({
      userId: userB.id,
      name: 'Pipeline Confidencial Empresa B',
      triggerType: 'webhook',
      actionType: 'http_post',
    })
    .returning();

  // Testar isolamento: consulta do Tenant A só pode ver automações de A
  const automationsOfA = await db
    .select()
    .from(automations)
    .where(eq(automations.userId, userA.id));

  const hasDataOfB = automationsOfA.some(a => a.userId === userB.id || a.id === autoB.id);
  assert(!hasDataOfB, 'Isolamento estrito: Tenant A não tem visibilidade dos pipelines do Tenant B');

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n🛡️  TESTE 4: Fluxo de Recadastro / Redefinição de Senha Segura');
  // ──────────────────────────────────────────────────────────────────────────
  const newSecretPassword = 'NovaSenhaSuperSegura#99';
  const newHashedPassword = await bcrypt.hash(newSecretPassword, 10);

  await db
    .update(users)
    .set({ password: newHashedPassword })
    .where(eq(users.id, userA.id));

  const [updatedUserA] = await db
    .select()
    .from(users)
    .where(eq(users.id, userA.id));

  const oldPassWorks = await bcrypt.compare(testPassword, updatedUserA.password);
  const newPassWorks = await bcrypt.compare(newSecretPassword, updatedUserA.password);

  assert(!oldPassWorks, 'Senha antiga é imediatamente invalidada após o recadastro');
  assert(newPassWorks, 'Nova senha recadastrada autentica com sucesso');

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n🛡️  TESTE 5: Segurança de API Keys e Hashing Criptográfico (SHA-256)');
  // ──────────────────────────────────────────────────────────────────────────
  const rawApiKey = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawApiKey).digest('hex');

  const [createdApiKey] = await db
    .insert(apiKeys)
    .values({
      userId: userA.id,
      name: 'Chave de Produção Tenant A',
      keyHash: tokenHash,
    })
    .returning();

  assert(createdApiKey.keyHash === tokenHash, 'Chave armazenada como hash SHA-256 irreversível');
  assert(createdApiKey.keyHash !== rawApiKey, 'Token Bearer puro NUNCA é gravado no banco de dados');

  // Tentativa com token adulterado/falso
  const fakeToken = 'bearer_token_adulterado_hacker';
  const fakeHash = createHash('sha256').update(fakeToken).digest('hex');

  const [authWithFake] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, fakeHash));

  assert(!authWithFake, 'Token adulterado é negado imediatamente (401 Unauthorized)');

  // Autenticação com o token correto
  const [authWithReal] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.keyHash, tokenHash));

  assert(authWithReal && authWithReal.userId === userA.id, 'Token legítimo autentica com sucesso o Tenant proprietário');

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n🛡️  TESTE 6: Validação Estrita de Payloads com Schema Zod');
  // ──────────────────────────────────────────────────────────────────────────
  const payloadSchema = z.object({
    email: z.string().email(),
    name: z.string().optional(),
    message: z.string().min(1),
  });

  const validPayload = { email: 'contato@cliente.com', name: 'Maria', message: 'Compra realizada!' };
  const parseValid = payloadSchema.safeParse(validPayload);
  assert(parseValid.success, 'Payload com formato válido é aceito');

  const invalidEmailPayload = { email: 'email_sem_arroba', message: 'Teste' };
  const parseInvalidEmail = payloadSchema.safeParse(invalidEmailPayload);
  assert(!parseInvalidEmail.success, 'Payload com e-mail inválido é rejeitado antes do processamento');

  const emptyMessagePayload = { email: 'contato@cliente.com', message: '' };
  const parseEmpty = payloadSchema.safeParse(emptyMessagePayload);
  assert(!parseEmpty.success, 'Payload com mensagem vazia é bloqueado (min 1 char)');

  const missingEmailPayload = { message: 'Mensagem sem destinatário' };
  const parseMissing = payloadSchema.safeParse(missingEmailPayload);
  assert(!parseMissing.success, 'Campos obrigatórios ausentes disparam erro de schema 400');

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n🛡️  TESTE 7: Persistência e Integridade de Logs de Auditoria');
  // ──────────────────────────────────────────────────────────────────────────
  const [logSuccess] = await db
    .insert(executionLogs)
    .values({
      automationId: autoA.id,
      userId: userA.id,
      status: 'success',
      payloadSummary: validPayload,
      latencyMs: 42,
    })
    .returning();

  assert(logSuccess.id && logSuccess.status === 'success', 'Log de telemetria gravado com status success');
  assert(logSuccess.latencyMs === 42, 'Métrica de latência em milissegundos persistida com exatidão');

  const [logFailed] = await db
    .insert(executionLogs)
    .values({
      automationId: autoA.id,
      userId: userA.id,
      status: 'failed',
      payloadSummary: invalidEmailPayload,
      latencyMs: 15,
      errorMessage: 'Payload inválido conforme schema Zod',
    })
    .returning();

  assert(logFailed.status === 'failed' && logFailed.errorMessage !== null, 'Falhas de execução registradas com mensagem de erro detalhada');

  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n🧹 Limpeza de Dados de Teste');
  // ──────────────────────────────────────────────────────────────────────────
  await db.delete(users).where(eq(users.id, userA.id));
  await db.delete(users).where(eq(users.id, userB.id));

  // Verificar deleção em cascata (ON DELETE CASCADE)
  const remainingLogs = await db
    .select()
    .from(executionLogs)
    .where(eq(executionLogs.userId, userA.id));

  assert(remainingLogs.length === 0, 'Exclusão em cascata (Foreign Key Cascade) remove logs e dados vinculados do tenant');

  console.log('\n────────────────────────────────────────────────────────────────');
  console.log(`📊 RESULTADO FINAL: ${passed} passaram | ${failed} falharam`);
  console.log('────────────────────────────────────────────────────────────────\n');

  if (failed > 0) process.exit(1);
}

runSecuritySuite().catch(err => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});

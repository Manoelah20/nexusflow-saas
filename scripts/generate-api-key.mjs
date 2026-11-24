/**
 * NexusFlow — Gerador de API Key
 *
 * Uso:
 *   node scripts/generate-api-key.mjs [nome-da-chave] [user-id-opcional]
 *
 * Exemplo:
 *   node scripts/generate-api-key.mjs "minha-chave-producao"
 */

import { createHash, randomBytes } from 'crypto';

const keyName = process.argv[2] || 'default-key';
const userId = process.argv[3] || '<SEU_USER_ID_UUID>';

// Gera token seguro: 32 bytes = 64 chars hex
const rawToken = randomBytes(32).toString('hex');
const keyHash  = createHash('sha256').update(rawToken).digest('hex');

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║           NexusFlow — API Key Gerada com Sucesso         ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('📛 Nome da chave :', keyName);
console.log('🔑 Token (Bearer):', rawToken);
console.log('🔒 SHA-256 Hash  :', keyHash);

console.log('\n──────────────────────────────────────────────────────────');
console.log('📋 SQL — Execute no Neon Console (SQL Editor):');
console.log('──────────────────────────────────────────────────────────\n');

console.log(`INSERT INTO api_keys (user_id, name, key_hash)
VALUES (
  '${userId}',
  '${keyName}',
  '${keyHash}'
);\n`);

console.log('──────────────────────────────────────────────────────────');
console.log('💻 cURL de teste (substitua :triggerId pelo ID da sua automação):');
console.log('──────────────────────────────────────────────────────────\n');

console.log(`curl -X POST http://localhost:3000/api/webhooks/:triggerId \\
  -H "Authorization: Bearer ${rawToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"teste@exemplo.com","name":"Cliente Teste","message":"Disparo realizado com sucesso!"}'`);

console.log('\n⚠️  Guarde o Token acima com segurança — apenas o hash é mantido no banco.\n');

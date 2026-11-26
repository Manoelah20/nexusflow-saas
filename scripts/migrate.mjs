import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import pkg from '@next/env';
const { loadEnvConfig } = pkg;

loadEnvConfig(process.cwd());

async function runMigration() {
  const sqlUrl = process.env.DATABASE_URL;
  if (!sqlUrl) {
    console.error('DATABASE_URL ausente no .env.local');
    process.exit(1);
  }

  console.log('Conectando ao Neon...');
  const sql = neon(sqlUrl);

  const initSql = readFileSync('db/init.sql', 'utf8');
  console.log('Executando db/init.sql no Neon...');

  // Quebrar em comandos individuais (ignora comentários e linhas vazias)
  const statements = initSql
    .replace(/^\s*--.*$/gm, '')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    await sql(statement);
  }

  console.log('✅ Todas as tabelas e índices foram criados com sucesso no Neon!');

  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  console.log('Tabelas no banco:', tables.map(t => t.table_name));
}

runMigration().catch(err => {
  console.error('Erro na migração:', err);
  process.exit(1);
});

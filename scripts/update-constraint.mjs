import { neon } from '@neondatabase/serverless';
import pkg from '@next/env';
const { loadEnvConfig } = pkg;

loadEnvConfig(process.cwd());

async function updateConstraint() {
  const sql = neon(process.env.DATABASE_URL);
  console.log('Atualizando constraint action_type no Neon...');
  
  await sql`ALTER TABLE automations DROP CONSTRAINT IF EXISTS automations_action_type_check;`;
  await sql`ALTER TABLE automations ADD CONSTRAINT automations_action_type_check CHECK (action_type IN ('send_email', 'whatsapp_message', 'slack_webhook', 'discord_webhook', 'http_post', 'critical_alert'));`;
  
  console.log('✅ Constraint atualizada com sucesso para WhatsApp, Slack e Discord!');
}

updateConstraint().catch(console.error);

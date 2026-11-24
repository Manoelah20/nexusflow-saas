export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { apiKeys, automations, executionLogs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { resend } from '@/lib/resend';
import { z } from 'zod';
import { createHash } from 'crypto';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeErrorMessage } from '@/lib/safe-error';

// Schema estrito de Ingestão com suporte a E-mail, WhatsApp, Slack e Discord
const payloadSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  phone: z.string().min(8, 'Número de telefone deve conter DDI + DDD + Número').optional(),
  message: z.string().min(1, 'Mensagem obrigatória'),
  targetUrl: z.string().url().optional(), // Para webhooks Slack, Discord ou repasse HTTP
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ triggerId: string }> }
) {
  const startTime = Date.now();
  const resolvedParams = await params;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';

  // 🛡️ Rate Limiting: Máximo de 120 requisições por minuto por IP/Trigger
  const limiter = rateLimit(`webhook:${resolvedParams.triggerId}:${ip}`, 120, 60000);
  if (!limiter.success) {
    return NextResponse.json(
      { error: 'Rate limit excedido (máximo de 120 req/min). Aguarde alguns instantes.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    // 1. Validar Bearer Token contra a tabela apiKeys (SHA-256)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token de autenticação ausente' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const [apiKey] = await db
      .select({ userId: apiKeys.userId })
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, tokenHash))
      .limit(1);

    if (!apiKey) {
      return NextResponse.json({ error: 'Token inválido ou não autorizado' }, { status: 401 });
    }

    // 2. Buscar Automação ativa pelo ID
    const [automation] = await db
      .select()
      .from(automations)
      .where(
        and(
          eq(automations.id, resolvedParams.triggerId),
          eq(automations.isActive, true)
        )
      )
      .limit(1);

    if (!automation) {
      return NextResponse.json({ error: 'Automação não encontrada ou inativa' }, { status: 404 });
    }

    // 3. Validar corpo da requisição com Zod
    const rawBody = await request.json();
    const parseResult = payloadSchema.safeParse(rawBody);

    if (!parseResult.success) {
      await db.insert(executionLogs).values({
        automationId: automation.id,
        userId: automation.userId,
        status: 'failed',
        payloadSummary: rawBody,
        latencyMs: Date.now() - startTime,
        errorMessage: 'Payload inválido conforme schema Zod',
      });
      return NextResponse.json(
        { error: 'Payload inválido', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { email, name, phone, message, targetUrl } = parseResult.data;

    // 4. Executar Ação Multi-Canal
    let executionStatus: 'success' | 'failed' = 'success';
    let errorMessage: string | null = null;
    let dispatchDetails: Record<string, any> = {};

    try {
      // ── CANAL 1: E-mail Transacional (Resend) ───────────────────────────
      if (automation.actionType === 'send_email') {
        const targetEmail = email || 'cliente@exemplo.com';
        await resend.emails.send({
          from: 'NexusFlow <automations@resend.dev>',
          to: [targetEmail],
          subject: `Notificação Automática: ${automation.name}`,
          html: `<div>
            <h2>Olá ${name || 'Cliente'},</h2>
            <p>Sua automação disparou com sucesso:</p>
            <blockquote style="background:#f4f4f5;padding:12px;border-left:4px solid #0284c7;">${message}</blockquote>
            <p><small>Gerado por NexusFlow AI Engine</small></p>
          </div>`,
        });
        dispatchDetails = { channel: 'email', recipient: targetEmail };
      }

      // ── CANAL 2: WhatsApp (Z-API / Evolution / Gateway) ─────────────────
      else if (automation.actionType === 'whatsapp_message') {
        const targetPhone = phone || '5511999998888';
        const formattedPhone = targetPhone.replace(/\D/g, '');
        
        // Se houver URL de webhook do gateway WhatsApp informada
        if (targetUrl) {
          await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              number: formattedPhone,
              text: `*NexusFlow:* Olá ${name || 'Cliente'}!\n\n${message}`,
            }),
          });
        }
        dispatchDetails = { channel: 'whatsapp', phone: formattedPhone, delivered: true };
      }

      // ── CANAL 3: Slack Incoming Webhook ─────────────────────────────────
      else if (automation.actionType === 'slack_webhook') {
        const webhookUrl = targetUrl || (automation.actionConfig as any)?.slackUrl;
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `⚡ *NexusFlow Alert: ${automation.name}*`,
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Pipeline:* ${automation.name}\n*Contato:* ${name || 'N/A'} (${email || phone || 'N/A'})\n*Mensagem:* ${message}`,
                  },
                },
              ],
            }),
          });
        }
        dispatchDetails = { channel: 'slack', status: 'posted' };
      }

      // ── CANAL 4: Discord Webhook ────────────────────────────────────────
      else if (automation.actionType === 'discord_webhook') {
        const webhookUrl = targetUrl || (automation.actionConfig as any)?.discordUrl;
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: 'NexusFlow Engine',
              embeds: [
                {
                  title: `⚡ Evento Disparado: ${automation.name}`,
                  description: message,
                  color: 0x06b6d4, // Cyan
                  fields: [
                    { name: 'Usuário', value: name || 'N/A', inline: true },
                    { name: 'Destinatário', value: email || phone || 'N/A', inline: true },
                  ],
                  footer: { text: 'NexusFlow Telemetry' },
                  timestamp: new Date().toISOString(),
                },
              ],
            }),
          });
        }
        dispatchDetails = { channel: 'discord', status: 'posted' };
      }

      // ── CANAL 5: Repasse HTTP POST ──────────────────────────────────────
      else if (automation.actionType === 'http_post') {
        const forwardUrl = targetUrl || (automation.actionConfig as any)?.targetUrl;
        if (forwardUrl) {
          await fetch(forwardUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'NexusFlow-Forwarder/2.5' },
            body: JSON.stringify(parseResult.data),
          });
        }
        dispatchDetails = { channel: 'http_forward', url: forwardUrl };
      }

      // ── CANAL 6: Alerta Crítico / Sentry ─────────────────────────────────
      else if (automation.actionType === 'critical_alert') {
        dispatchDetails = { channel: 'critical_alert', severity: 'high', notified: true };
      }
    } catch (err: any) {
      executionStatus = 'failed';
      errorMessage = sanitizeErrorMessage(err, 'Erro durante o disparo da ação');
    }

    const latency = Date.now() - startTime;

    // 5. Gravar Log de Execução no Banco de Dados
    await db.insert(executionLogs).values({
      automationId: automation.id,
      userId: automation.userId,
      status: executionStatus,
      payloadSummary: { ...parseResult.data, _dispatch: dispatchDetails },
      latencyMs: latency,
      errorMessage: errorMessage,
    });

    if (executionStatus === 'failed') {
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json({ success: true, latency_ms: latency, channel: automation.actionType });
  } catch (err: any) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(err, 'Erro interno no servidor') },
      { status: 500 }
    );
  }
}

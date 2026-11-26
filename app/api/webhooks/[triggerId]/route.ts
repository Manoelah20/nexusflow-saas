export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { apiKeys, automations, executionLogs } from '@/db/schema';
import { getClientAddress, rateLimit } from '@/lib/rate-limit';
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/read-json';
import { escapeHtml, sendEmail } from '@/lib/resend';
import { postJsonToPublicHttps } from '@/lib/safe-http';
import { sanitizeErrorMessage } from '@/lib/safe-error';

const payloadSchema = z.object({
  email: z.string().trim().email().max(254).optional(),
  name: z.string().trim().max(100).optional(),
  phone: z.string().trim().min(8).max(32).optional(),
  message: z.string().trim().min(1).max(5_000),
}).strict();

type Payload = z.infer<typeof payloadSchema>;

function summarizePayload(payload: Payload) {
  return {
    hasEmail: Boolean(payload.email),
    hasName: Boolean(payload.name),
    hasPhone: Boolean(payload.phone),
    messageLength: payload.message.length,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ triggerId: string }> },
) {
  const startedAt = Date.now();
  try {
    const { triggerId } = await params;
    const limiter = await rateLimit(`webhook:${triggerId}:${getClientAddress(request)}`, 120, 60_000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Limite de requisições excedido. Aguarde e tente novamente.' },
        { status: 429, headers: { 'Retry-After': String(Math.max(1, limiter.reset - Math.floor(Date.now() / 1000))) } },
      );
    }

    const authHeader = request.headers.get('authorization') || '';
    const match = /^Bearer\s+([a-f0-9]{64})$/i.exec(authHeader);
    if (!match) return NextResponse.json({ error: 'Token de autenticação inválido.' }, { status: 401 });

    const tokenHash = createHash('sha256').update(match[1]).digest('hex');
    const [apiKey] = await db
      .select({ userId: apiKeys.userId })
      .from(apiKeys)
      .where(eq(apiKeys.keyHash, tokenHash))
      .limit(1);
    if (!apiKey) return NextResponse.json({ error: 'Token de autenticação inválido.' }, { status: 401 });

    const [automation] = await db
      .select()
      .from(automations)
      .where(and(
        eq(automations.id, triggerId),
        eq(automations.userId, apiKey.userId),
        eq(automations.isActive, true),
      ))
      .limit(1);
    if (!automation || automation.triggerType !== 'webhook') {
      return NextResponse.json({ error: 'Webhook não encontrado ou inativo.' }, { status: 404 });
    }

    const body = await readJsonWithLimit(request, 32 * 1024);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
      await db.insert(executionLogs).values({
        automationId: automation.id,
        userId: automation.userId,
        status: 'failed',
        payloadSummary: { invalidPayload: true },
        latencyMs: Date.now() - startedAt,
        errorMessage: 'Payload inválido.',
      });
      return NextResponse.json({ error: 'Payload inválido. Confira os campos permitidos e seus limites.' }, { status: 400 });
    }

    const payload = parsed.data;
    const actionConfig = (automation.actionConfig || {}) as Record<string, unknown>;
    const destination = typeof actionConfig.targetUrl === 'string' ? actionConfig.targetUrl : '';
    let channel: string;
    let statusCode: number | null = null;

    try {
      if (automation.actionType === 'send_email') {
        if (!payload.email) throw new Error('Informe um e-mail de destino no evento.');
        const safeName = escapeHtml(payload.name || 'Cliente');
        const safeMessage = escapeHtml(payload.message);
        await sendEmail(
          payload.email,
          `Notificação automática: ${automation.name}`,
          `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a"><h2>Olá ${safeName},</h2><p>${safeMessage}</p><p><small>Mensagem enviada pelo NexusFlow.</small></p></div>`,
          `Olá ${payload.name || 'Cliente'},\n\n${payload.message}\n\nMensagem enviada pelo NexusFlow.`,
        );
        channel = 'email';
      } else if (automation.actionType === 'slack_webhook') {
        if (!destination) throw new Error('A automação não tem um destino configurado.');
        statusCode = await postJsonToPublicHttps(destination, {
          text: `NexusFlow · ${automation.name}\n${payload.message}`,
        });
        channel = 'slack';
      } else if (automation.actionType === 'discord_webhook') {
        if (!destination) throw new Error('A automação não tem um destino configurado.');
        statusCode = await postJsonToPublicHttps(destination, {
          username: 'NexusFlow',
          embeds: [{ title: automation.name, description: payload.message.slice(0, 4_000), color: 0x06b6d4 }],
        });
        channel = 'discord';
      } else if (automation.actionType === 'http_post') {
        if (!destination) throw new Error('A automação não tem um destino configurado.');
        statusCode = await postJsonToPublicHttps(destination, payload);
        channel = 'http';
      } else {
        throw new Error('Esta ação ainda não está habilitada.');
      }
    } catch (error) {
      const safeMessage = sanitizeErrorMessage(error, 'Falha ao executar a ação configurada.');
      await db.insert(executionLogs).values({
        automationId: automation.id,
        userId: automation.userId,
        status: 'failed',
        payloadSummary: summarizePayload(payload),
        latencyMs: Date.now() - startedAt,
        errorMessage: safeMessage,
      });
      return NextResponse.json({ error: safeMessage }, { status: 502 });
    }

    const latency = Date.now() - startedAt;
    await db.insert(executionLogs).values({
      automationId: automation.id,
      userId: automation.userId,
      status: 'success',
      payloadSummary: { ...summarizePayload(payload), channel, destinationStatus: statusCode },
      latencyMs: latency,
    });

    return NextResponse.json({ success: true, latency_ms: latency, channel });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: 'A requisição excede o tamanho permitido.' }, { status: 413 });
    }
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
    console.error('Erro ao processar webhook.');
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, 'Erro interno no servidor.') },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { desc, eq, and, lt } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/db';
import { automations } from '@/db/schema';
import { getClientAddress, rateLimit } from '@/lib/rate-limit';
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/read-json';
import { sanitizeErrorMessage } from '@/lib/safe-error';

const automationInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  trigger_type: z.literal('webhook'),
  action_type: z.enum(['send_email', 'slack_webhook', 'discord_webhook', 'http_post']),
  action_url: z.string().trim().url().max(2048).optional(),
}).strict().superRefine((value, context) => {
  if (value.action_type === 'send_email') {
    if (value.action_url) context.addIssue({ code: z.ZodIssueCode.custom, path: ['action_url'], message: 'A ação de e-mail não usa URL de destino.' });
    return;
  }

  if (!value.action_url) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['action_url'], message: 'Informe a URL HTTPS pública do destino.' });
    return;
  }

  try {
    const url = new URL(value.action_url);
    if (url.protocol !== 'https:' || (url.port && url.port !== '443') || url.username || url.password || url.hash) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['action_url'], message: 'Use HTTPS na porta padrão, sem credenciais ou fragmento.' });
    }
  } catch {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['action_url'], message: 'URL de destino inválida.' });
  }
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
    const cursor = searchParams.get('cursor');

    let query = db.select().from(automations).where(eq(automations.userId, session.user.id)).orderBy(desc(automations.createdAt));

    if (cursor) {
      const cursorDate = new Date(cursor);
      query = db.select().from(automations).where(
        and(
          eq(automations.userId, session.user.id),
          lt(automations.createdAt, cursorDate)
        )
      );
    }

    const userAutomations = await query.limit(limit);

    const safeAutomations = userAutomations.map((automation) => ({
      id: automation.id,
      userId: automation.userId,
      name: automation.name,
      triggerType: automation.triggerType,
      filterCondition: automation.filterCondition,
      actionType: automation.actionType,
      isActive: automation.isActive,
      createdAt: automation.createdAt,
      actionConfig: {},
    }));
    const newCursor = userAutomations.length > 0 ? userAutomations[userAutomations.length - 1].createdAt.toISOString() : null;

    return NextResponse.json({ success: true, data: safeAutomations, cursor: newCursor }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, 'Erro ao buscar automações') },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const limiter = await rateLimit(`automations:${session.user.id}:${getClientAddress(request)}`, 20, 60_000);
    if (!limiter.success) return NextResponse.json({ error: 'Muitas automações criadas. Tente novamente em um minuto.' }, { status: 429 });

    const body = await readJsonWithLimit(request, 8 * 1024);
    const parsed = automationInputSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Dados da automação inválidos ou ação ainda não disponível.' }, { status: 400 });

    const actionConfig = parsed.data.action_url ? { targetUrl: parsed.data.action_url } : {};
    const [newAutomation] = await db
      .insert(automations)
      .values({
        userId: session.user.id,
        name: parsed.data.name,
        triggerType: 'webhook',
        actionType: parsed.data.action_type,
        actionConfig,
        isActive: true,
      })
      .returning({
        id: automations.id,
        userId: automations.userId,
        name: automations.name,
        triggerType: automations.triggerType,
        filterCondition: automations.filterCondition,
        actionType: automations.actionType,
        isActive: automations.isActive,
        createdAt: automations.createdAt,
      });

    return NextResponse.json({ success: true, data: { ...newAutomation, actionConfig: {} } }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: 'A requisição excede o tamanho permitido.' }, { status: 413 });
    }
    console.error('Erro ao criar automação.');
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, 'Erro interno no servidor') },
      { status: 500 },
    );
  }
}

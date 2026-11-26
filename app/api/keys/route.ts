import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';
import { sanitizeErrorMessage } from '@/lib/safe-error';
import { getClientAddress, rateLimit } from '@/lib/rate-limit';
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/read-json';

const keyNameSchema = z.object({ name: z.string().trim().min(1).max(80) }).strict();

// Listar chaves do usuário logado (sem expor o hash completo)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
    const offset = Number(searchParams.get('offset') || 0);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const keysCount = await db.select({ count: sql`count(*)` }).from(apiKeys).where(eq(apiKeys.userId, session.user.id));

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, session.user.id))
      .orderBy(desc(apiKeys.createdAt))
      .limit(limit)
      .offset(offset);

    const total = (keysCount[0] as { count: number }).count;

    return NextResponse.json({ success: true, data: keys, total, limit, offset }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    console.error('Erro ao listar chaves:', err);
    return NextResponse.json(
      { error: sanitizeErrorMessage(err, 'Erro ao carregar chaves') },
      { status: 500 }
    );
  }
}

// Criar nova chave de API (Token exibido apenas UMA vez)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const limiter = await rateLimit(`keys:${session.user.id}:${getClientAddress(request)}`, 10, 60 * 60_000);
    if (!limiter.success) return NextResponse.json({ error: 'Limite de criação de chaves excedido.' }, { status: 429 });

    const body = await readJsonWithLimit(request, 4 * 1024);
    const parsed = keyNameSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Informe um nome de até 80 caracteres para a chave.' }, { status: 400 });
    const name = parsed.data.name;

    // Gerar token seguro de 32 bytes (64 caracteres hex)
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    const [newKey] = await db
      .insert(apiKeys)
      .values({
        userId: session.user.id,
        name,
        keyHash: tokenHash,
      })
      .returning({
        id: apiKeys.id,
        name: apiKeys.name,
        createdAt: apiKeys.createdAt,
      });

    // Retorna o rawToken APENAS nesta resposta de criação
    return NextResponse.json({
      success: true,
      data: {
        ...newKey,
        rawToken, // O usuário deve copiar agora
      },
    }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    if (err instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: 'A requisição excede o tamanho permitido.' }, { status: 413 });
    }
    console.error('Erro ao criar chave:', err);
    return NextResponse.json(
      { error: sanitizeErrorMessage(err, 'Erro ao gerar chave') },
      { status: 500 }
    );
  }
}

// Revogar/Excluir chave
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da chave é obrigatório' }, { status: 400 });
    }

    await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, session.user.id)));

    return NextResponse.json({ success: true, message: 'Chave revogada com sucesso' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    console.error('Erro ao revogar chave:', err);
    return NextResponse.json(
      { error: sanitizeErrorMessage(err, 'Erro ao revogar chave') },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { apiKeys } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createHash, randomBytes } from 'crypto';
import { sanitizeErrorMessage } from '@/lib/safe-error';

// Listar chaves do usuário logado (sem expor o hash completo)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const keys = await db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, session.user.id))
      .orderBy(desc(apiKeys.createdAt));

    return NextResponse.json({ success: true, data: keys });
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

    const body = await request.json();
    const name = body.name?.trim() || 'Nova API Key';

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
    }, { status: 201 });
  } catch (err) {
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

    return NextResponse.json({ success: true, message: 'Chave revogada com sucesso' });
  } catch (err) {
    console.error('Erro ao revogar chave:', err);
    return NextResponse.json(
      { error: sanitizeErrorMessage(err, 'Erro ao revogar chave') },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { automations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sanitizeErrorMessage } from '@/lib/safe-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userAutomations = await db
      .select()
      .from(automations)
      .where(eq(automations.userId, session.user.id))
      .orderBy(desc(automations.createdAt));

    return NextResponse.json({ success: true, data: userAutomations });
  } catch (err: any) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(err, 'Erro ao buscar automações') },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado. Faça login para criar automações.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, trigger_type, action_type } = body;

    if (!name || !trigger_type || !action_type) {
      return NextResponse.json(
        { error: 'Nome, tipo de gatilho e ação são obrigatórios' },
        { status: 400 }
      );
    }

    const [newAutomation] = await db
      .insert(automations)
      .values({
        userId: session.user.id,
        name,
        triggerType: trigger_type,
        actionType: action_type,
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, data: newAutomation }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(err, 'Erro interno no servidor') },
      { status: 500 }
    );
  }
}

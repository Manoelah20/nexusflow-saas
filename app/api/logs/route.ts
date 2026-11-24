export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { executionLogs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { sanitizeErrorMessage } from '@/lib/safe-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const logs = await db
      .select()
      .from(executionLogs)
      .where(eq(executionLogs.userId, session.user.id))
      .orderBy(desc(executionLogs.createdAt))
      .limit(50);

    return NextResponse.json({ success: true, data: logs });
  } catch (err: any) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(err, 'Erro ao carregar logs') },
      { status: 500 }
    );
  }
}

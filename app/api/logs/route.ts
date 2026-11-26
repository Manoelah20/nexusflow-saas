import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { executionLogs } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { sanitizeErrorMessage } from '@/lib/safe-error';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
    const offset = Number(searchParams.get('offset') || 0);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const logs = await db
      .select()
      .from(executionLogs)
      .where(eq(executionLogs.userId, session.user.id))
      .orderBy(desc(executionLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const totalCount = await db.select({ count: sql`count(*)` }).from(executionLogs).where(eq(executionLogs.userId, session.user.id));

    return NextResponse.json({ success: true, data: logs, total: totalCount.length }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err: any) {
    return NextResponse.json(
      { error: sanitizeErrorMessage(err, 'Erro ao carregar logs') },
      { status: 500 }
    );
  }
}

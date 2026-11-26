import { createHash } from 'node:crypto';
import { and, eq, gt, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/db';
import { emailVerificationTokens, users } from '@/db/schema';
import { getClientAddress, rateLimit } from '@/lib/rate-limit';
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/read-json';

const verifySchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{40,64}$/),
  password: z.string().min(12, 'A senha deve ter pelo menos 12 caracteres').max(128),
}).strict();

export async function POST(request: Request) {
  try {
    const limiter = await rateLimit(`verify-email:${getClientAddress(request)}`, 10, 60_000);
    if (!limiter.success) return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto.' }, { status: 429 });

    const body = await readJsonWithLimit(request, 8 * 1024);
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Link inválido ou senha fora do padrão.' }, { status: 400 });

    const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
    const [verification] = await db
      .delete(emailVerificationTokens)
      .where(and(
        eq(emailVerificationTokens.tokenHash, tokenHash),
        gt(emailVerificationTokens.expiresAt, new Date()),
      ))
      .returning({ userId: emailVerificationTokens.userId });

    if (!verification) return NextResponse.json({ error: 'Link inválido ou expirado. Solicite outro.' }, { status: 400 });

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    await db
      .update(users)
      .set({
        password: hashedPassword,
        emailVerifiedAt: new Date(),
        sessionVersion: sql`${users.sessionVersion} + 1`,
      })
      .where(eq(users.id, verification.userId));
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, verification.userId));

    return NextResponse.json(
      { success: true, message: 'E-mail confirmado. Agora você já pode entrar.' },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: 'A requisição excede o tamanho permitido.' }, { status: 413 });
    }
    console.error('Erro ao confirmar e-mail.');
    return NextResponse.json({ error: 'Não foi possível confirmar o e-mail.' }, { status: 500 });
  }
}

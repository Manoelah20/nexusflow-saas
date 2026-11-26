import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/db';
import { passwordResetTokens, users } from '@/db/schema';
import { getClientAddress, rateLimit } from '@/lib/rate-limit';
import { hasEmailProviderConfig, sendPasswordResetEmail } from '@/lib/resend';
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/read-json';
import { sanitizeErrorMessage } from '@/lib/safe-error';

const requestResetSchema = z.object({
  mode: z.literal('request'),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
});

const completeResetSchema = z.object({
  mode: z.literal('complete'),
  token: z.string().regex(/^[A-Za-z0-9_-]{40,64}$/),
  newPassword: z.string().min(12, 'A senha deve ter pelo menos 12 caracteres').max(128),
});

const resetSchema = z.discriminatedUnion('mode', [requestResetSchema, completeResetSchema]);
const genericRequestMessage = 'Se houver uma conta para esse e-mail, enviaremos um link para redefinir a senha.';

export async function POST(request: Request) {
  try {
    const ip = getClientAddress(request);
    const limiter = await rateLimit(`reset:${ip}`, 5, 60_000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' },
        { status: 429, headers: { 'Retry-After': String(Math.max(1, limiter.reset - Math.floor(Date.now() / 1000))) } },
      );
    }

    const body = await readJsonWithLimit(request, 8 * 1024);
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    if (parsed.data.mode === 'request') {
      if (!hasEmailProviderConfig()) {
        return NextResponse.json(
          { error: 'A recuperação de senha está temporariamente indisponível.' },
          { status: 503 },
        );
      }

      const emailLimit = await rateLimit(`reset-email:${parsed.data.email}`, 3, 15 * 60_000);
      if (!emailLimit.success) {
        return NextResponse.json({ success: true, message: genericRequestMessage }, { status: 202 });
      }

      const [user] = await db
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(sql`lower(${users.email}) = ${parsed.data.email}`)
        .limit(1);

      if (user) {
        const rawToken = randomBytes(32).toString('base64url');
        const tokenHash = createHash('sha256').update(rawToken).digest('hex');
        await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
        await db.insert(passwordResetTokens).values({
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 30 * 60_000),
        });

        const configuredBaseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;
        const resetUrl = new URL('/login', configuredBaseUrl);
        resetUrl.searchParams.set('token', rawToken);

        try {
          await sendPasswordResetEmail(user.email, resetUrl.toString());
        } catch {
          await db.delete(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, tokenHash));
          console.error('Falha ao enviar e-mail de redefinição.');
        }
      }

      return NextResponse.json({ success: true, message: genericRequestMessage }, { status: 202 });
    }

    const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
    const [resetToken] = await db
      .delete(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date()),
      ))
      .returning({ userId: passwordResetTokens.userId });

    if (!resetToken) {
      return NextResponse.json({ error: 'Este link é inválido ou expirou. Solicite outro.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);
    await db
      .update(users)
      .set({
        password: hashedPassword,
        sessionVersion: sql`${users.sessionVersion} + 1`,
      })
      .where(eq(users.id, resetToken.userId));
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, resetToken.userId));

    return NextResponse.json({ success: true, message: 'Senha alterada. Entre novamente com a nova senha.' });
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json({ error: 'A requisição excede o tamanho permitido.' }, { status: 413 });
    }
    console.error('Erro no fluxo de redefinição de senha.');
    return NextResponse.json(
      { error: sanitizeErrorMessage(error, 'Erro ao processar a solicitação.') },
      { status: 500 },
    );
  }
}

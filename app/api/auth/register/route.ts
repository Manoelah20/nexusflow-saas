import { createHash, randomBytes } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/db';
import { emailVerificationTokens, users } from '@/db/schema';
import { getClientAddress, rateLimit } from '@/lib/rate-limit';
import { readJsonWithLimit, RequestBodyTooLargeError } from '@/lib/read-json';
import { hasEmailProviderConfig, sendVerificationEmail } from '@/lib/resend';

const registerSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email('E-mail inválido')
      .max(254)
      .transform((value) => value.toLowerCase()),
    name: z.string().trim().max(100).optional(),
  })
  .strict();

const genericMessage =
  'Se esse e-mail puder ser usado, enviaremos um link de confirmação. Verifique sua caixa de entrada.';

export async function POST(request: Request) {
  let step = 'start';

  try {
    step = 'rate-limit-ip';
    const ip = getClientAddress(request);
    const limiter = await rateLimit(`register:${ip}`, 5, 60_000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde um minuto e tente novamente.' },
        { status: 429 }
      );
    }

    step = 'read-body';
    const body = await readJsonWithLimit(request, 8 * 1024);
    const parseResult = registerSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos. Confira o e-mail e o nome.' },
        { status: 400 }
      );
    }

    step = 'check-email-provider';
    if (!hasEmailProviderConfig()) {
      return NextResponse.json(
        { error: 'A criação de contas está temporariamente indisponível.' },
        { status: 503 }
      );
    }

    const { email, name } = parseResult.data;

    step = 'rate-limit-email';
    const emailLimiter = await rateLimit(`register-email:${email}`, 3, 60 * 60_000);
    if (!emailLimiter.success) {
      return NextResponse.json({ success: true, message: genericMessage }, { status: 202 });
    }

    step = 'select-existing-user';
    const [existingUser] = await db
      .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    let userId = existingUser?.id;

    if (!existingUser) {
      step = 'hash-password';
      // A senha só é criada depois que a pessoa comprovar acesso ao e-mail.
      const unusablePassword = await bcrypt.hash(randomBytes(32).toString('hex'), 12);

      step = 'insert-user';
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: unusablePassword,
          name: name || email.split('@')[0],
          emailVerifiedAt: null,
        })
        .onConflictDoNothing()
        .returning({ id: users.id });

      userId = newUser?.id;

      // Em caso de concorrência no mesmo e-mail normalizado, busca o registo existente.
      if (!userId) {
        step = 'select-raced-user';
        const [racedUser] = await db
          .select({ id: users.id, emailVerifiedAt: users.emailVerifiedAt })
          .from(users)
          .where(sql`lower(${users.email}) = ${email}`)
          .limit(1);

        if (!racedUser || racedUser.emailVerifiedAt) {
          return NextResponse.json({ success: true, message: genericMessage }, { status: 202 });
        }
        userId = racedUser.id;
      }
    } else if (existingUser.emailVerifiedAt) {
      return NextResponse.json({ success: true, message: genericMessage }, { status: 202 });
    }

    if (!userId) {
      return NextResponse.json({ success: true, message: genericMessage }, { status: 202 });
    }

    step = 'create-verification-token';
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');

    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
    await db.insert(emailVerificationTokens).values({
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60_000),
    });

    step = 'build-verify-url';
    const baseUrl =
      process.env.AUTH_URL || process.env.NEXTAUTH_URL || new URL(request.url).origin;
    const verifyUrl = new URL('/login', baseUrl);
    verifyUrl.searchParams.set('verify', token);

    step = 'send-verification-email';
    try {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user) {
        await sendVerificationEmail(user.email, verifyUrl.toString());
      }
    } catch (mailError) {
      await db
        .delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.tokenHash, tokenHash));
      console.error('[register] Falha ao enviar e-mail de confirmação:', mailError);
    }

    return NextResponse.json(
      { success: true, message: genericMessage },
      {
        status: 202,
        headers: { 'Cache-Control': 'private, no-store' },
      }
    );
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return NextResponse.json(
        { error: 'A requisição excede o tamanho permitido.' },
        { status: 413 }
      );
    }

    console.error(`[register] Erro no passo "${step}":`, error);
    return NextResponse.json(
      { error: 'Não foi possível processar o cadastro.' },
      { status: 500 }
    );
  }
}
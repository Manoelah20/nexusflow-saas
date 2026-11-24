import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const resetPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
});

export async function POST(request: Request) {
  try {
    // 🛡️ Rate Limiting: Máximo de 5 tentativas de recuperação por minuto por IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'global-reset';
    const limiter = rateLimit(`reset:${ip}`, 5, 60000);

    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas de redefinição. Por segurança, tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parseResult = resetPasswordSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { email, newPassword } = parseResult.data;

    // Verificar se o usuário existe
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'Nenhuma conta encontrada com este e-mail' },
        { status: 404 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso! Você já pode entrar com sua nova senha.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao redefinir senha' },
      { status: 500 }
    );
  }
}

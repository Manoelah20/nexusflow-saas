import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const registerSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    // 🛡️ Rate Limiting: Máximo de 5 cadastros por minuto por IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'global-register';
    const limiter = rateLimit(`register:${ip}`, 5, 60000);

    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Muitas tentativas de cadastro. Por segurança, tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { email, password, name } = parseResult.data;

    // Verificar se usuário já existe
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}

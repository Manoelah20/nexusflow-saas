import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const [user] = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            password: users.password,
            sessionVersion: users.sessionVersion,
            emailVerifiedAt: users.emailVerifiedAt,
          })
          .from(users)
          .where(sql`lower(${users.email}) = ${parsed.data.email}`)
          .limit(1);

        if (!user || !user.emailVerifiedAt) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.sessionVersion =
          (user as typeof user & { sessionVersion: number }).sessionVersion ?? 0;
        return token;
      }

      if (typeof token.id !== 'string' || typeof token.sessionVersion !== 'number') {
        return null;
      }

      const [currentUser] = await db
        .select({ sessionVersion: users.sessionVersion })
        .from(users)
        .where(eq(users.id, token.id))
        .limit(1);

      if (!currentUser || currentUser.sessionVersion !== token.sessionVersion) {
        return null;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.id === 'string') {
        session.user.id = token.id;
      }
      return session;
    },
  },
});

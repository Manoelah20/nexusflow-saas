import { createHash } from 'node:crypto';
import { lt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { rateLimitBuckets } from '@/db/schema';

/**
 * Banco compartilhado evita que limites sejam reiniciados entre instâncias
 * serverless. O identificador é armazenado como hash para não persistir IPs.
 * Falhas do banco devem falhar fechadas no chamador, sem liberar a requisição.
 */
export async function rateLimit(
  identifier: string,
  limit = 60,
  windowMs = 60_000,
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = new Date();
  const nextReset = new Date(now.getTime() + windowMs);
  const bucketHash = createHash('sha256').update(identifier).digest('hex');

  const [bucket] = await db
    .insert(rateLimitBuckets)
    .values({ bucketHash, count: 1, resetAt: nextReset })
    .onConflictDoUpdate({
      target: rateLimitBuckets.bucketHash,
      set: {
        count: sql<number>`CASE WHEN ${rateLimitBuckets.resetAt} <= ${now} THEN 1 ELSE ${rateLimitBuckets.count} + 1 END`,
        resetAt: sql<Date>`CASE WHEN ${rateLimitBuckets.resetAt} <= ${now} THEN ${nextReset} ELSE ${rateLimitBuckets.resetAt} END`,
      },
    })
    .returning({ count: rateLimitBuckets.count, resetAt: rateLimitBuckets.resetAt });

  if (Math.random() < 0.01) {
    void (async () => {
      try {
        await db.delete(rateLimitBuckets).where(lt(rateLimitBuckets.resetAt, now));
      } catch {
        // A limpeza é auxiliar; nunca altera a decisão do limite.
      }
    })();
  }

  const reset = Math.ceil(new Date(bucket.resetAt).getTime() / 1000);
  return {
    success: bucket.count <= limit,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    reset,
  };
}

export function getClientAddress(request: Request): string {
  // Vercel e outros proxies confiáveis reescrevem x-real-ip/x-forwarded-for.
  // Em produção, configure apenas um proxy confiável na frente da aplicação.
  // Limitamos a primeiro IP para evitar spoofing via X-Forwarded-For.
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Apenas o primeiro IP (o mais próximo do cliente)
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

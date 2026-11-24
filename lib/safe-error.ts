/**
 * NexusFlow Safe Error Handler & Sanitizer
 * Garante que nenhuma string de conexão, senha, token ou credencial
 * do .env seja vazada em respostas JSON de erro para o cliente.
 */

export function sanitizeErrorMessage(error: unknown, fallback: string = 'Erro interno no servidor'): string {
  if (!error) return fallback;

  let message = typeof error === 'string' ? error : (error as any)?.message || fallback;

  // Filtra padrões de URLs com credenciais (ex: postgresql://user:pass@...)
  message = message.replace(/postgresql:\/\/[^@\s]+@[^\s]+/gi, 'postgresql://[REDACTED]');
  message = message.replace(/postgres:\/\/[^@\s]+@[^\s]+/gi, 'postgres://[REDACTED]');
  
  // Filtra chaves do Resend
  message = message.replace(/re_[a-zA-Z0-9_-]+/gi, 're_[REDACTED]');

  // Filtra tokens JWT ou Bearer
  message = message.replace(/Bearer\s+[a-zA-Z0-9_.-]+/gi, 'Bearer [REDACTED]');

  // Se o erro for uma falha de conexão interna do banco, não expõe a stack
  if (message.includes('password') || message.includes('auth') || message.includes('connect') || message.includes('getaddrinfo')) {
    return fallback;
  }

  return message;
}

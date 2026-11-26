const safeMessages = new Set([
  'Destino HTTP não permitido. Use um endereço HTTPS público na porta padrão.',
  'Destino HTTP não permitido.',
  'Tempo limite do destino excedido.',
  'Provedor de e-mail indisponível.',
  'Provedor de e-mail recusou a mensagem.',
  'Informe um e-mail de destino no evento.',
  'A automação não tem um destino configurado.',
  'Esta ação ainda não está habilitada.',
]);

export function sanitizeErrorMessage(error: unknown, fallback = 'Erro interno no servidor'): string {
  const message = typeof error === 'string'
    ? error
    : error instanceof Error
      ? error.message
      : '';

  if (safeMessages.has(message)) return message;
  if (/^O destino respondeu com HTTP (?:[1-5]\d\d|inválido)\.$/.test(message)) return message;
  return fallback;
}

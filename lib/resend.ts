import { Resend } from 'resend';

export function hasEmailProviderConfig(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('Provedor de e-mail indisponível.');
  return new Resend(apiKey);
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<void> {
  if (!hasEmailProviderConfig()) throw new Error('Provedor de e-mail indisponível.');
  const result = await getResendClient().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: [to],
    subject,
    html,
    text,
  });
  if (result.error) {
    console.error('[resend] Erro retornado pelo provedor:', result.error);
    throw new Error('Provedor de e-mail recusou a mensagem.');
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const safeUrl = escapeHtml(resetUrl);
  await sendEmail(
    to,
    'Redefinição da senha do NexusFlow',
    `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h1 style="font-size:22px">Redefina sua senha</h1>
      <p>Recebemos uma solicitação para criar uma nova senha para sua conta NexusFlow.</p>
      <p><a href="${safeUrl}">Escolher nova senha</a></p>
      <p>O link expira em 30 minutos e só pode ser usado uma vez. Se você não pediu essa alteração, ignore este e-mail.</p>
    </div>`,
    `Para redefinir sua senha, acesse: ${resetUrl}\n\nO link expira em 30 minutos e só pode ser usado uma vez.`,
  );
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
  const safeUrl = escapeHtml(verifyUrl);
  await sendEmail(
    to,
    'Confirme seu e-mail do NexusFlow',
    `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h1 style="font-size:22px">Confirme seu e-mail</h1>
      <p>Para ativar sua conta NexusFlow, confirme que este endereço pertence a você.</p>
      <p><a href="${safeUrl}">Confirmar e-mail</a></p>
      <p>O link expira em 24 horas e só pode ser usado uma vez. Se você não criou a conta, ignore esta mensagem.</p>
    </div>`,
    `Para confirmar seu e-mail, acesse: ${verifyUrl}\n\nO link expira em 24 horas e só pode ser usado uma vez.`,
  );
}
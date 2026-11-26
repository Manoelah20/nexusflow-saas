export class RequestBodyTooLargeError extends Error {
  constructor() {
    super('Corpo da requisição excede o limite permitido.');
    this.name = 'RequestBodyTooLargeError';
  }
}

export async function readJsonWithLimit<T = unknown>(request: Request, maxBytes = 16 * 1024): Promise<T> {
  const announcedLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(announcedLength) && announcedLength > maxBytes) {
    throw new RequestBodyTooLargeError();
  }

  if (!request.body) throw new SyntaxError('Corpo JSON obrigatório.');

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new RequestBodyTooLargeError();
    }
    chunks.push(value);
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(new TextDecoder().decode(body)) as T;
}

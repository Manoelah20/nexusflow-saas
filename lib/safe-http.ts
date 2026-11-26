import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import https from 'node:https';

const blockedNetworks = new BlockList();

for (const [network, prefix] of [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8],
  ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24],
  ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24],
  ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
] as const) blockedNetworks.addSubnet(network, prefix, 'ipv4');

for (const [network, prefix] of [
  ['::', 128], ['::1', 128], ['::ffff:0:0', 96], ['64:ff9b:1::', 48],
  ['100::', 64], ['2001:db8::', 32], ['fc00::', 7], ['fe80::', 10], ['ff00::', 8],
] as const) blockedNetworks.addSubnet(network, prefix, 'ipv6');

function isPublicAddress(address: string, family: number): boolean {
  if (!family || blockedNetworks.check(address, family === 6 ? 'ipv6' : 'ipv4')) return false;
  return isIP(address) === family;
}

/** POST JSON only to public HTTPS destinations, pinned to the validated DNS result. */
export async function postJsonToPublicHttps(destination: string, payload: unknown): Promise<number> {
  const url = new URL(destination);
  if (
    url.protocol !== 'https:' ||
    (url.port && url.port !== '443') ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw new Error('Destino HTTP não permitido. Use um endereço HTTPS público na porta padrão.');
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error('Destino HTTP não permitido.');
  }

  const addresses = await lookup(hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address, family }) => !isPublicAddress(address, family))) {
    throw new Error('Destino HTTP não permitido.');
  }

  // O callback usa os endereços já verificados, evitando uma segunda resolução DNS
  // diferente entre a checagem e a conexão (DNS rebinding).
  const pinnedLookup = ((_: string, options: { all?: boolean }, callback: (...args: any[]) => void) => {
    if (options?.all) callback(null, addresses);
    else callback(null, addresses[0].address, addresses[0].family);
  }) as typeof import('node:dns').lookup;

  const body = JSON.stringify(payload);
  return new Promise<number>((resolve, reject) => {
    const request = https.request(url, {
      method: 'POST',
      lookup: pinnedLookup,
      servername: hostname,
      timeout: 8_000,
      headers: {
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
        'user-agent': 'NexusFlow-Webhook/1.0',
      },
    }, (response) => {
      const status = response.statusCode ?? 0;
      response.resume();
      if (status >= 200 && status < 300) resolve(status);
      else reject(new Error(`O destino respondeu com HTTP ${status || 'inválido'}.`));
    });

    request.on('timeout', () => request.destroy(new Error('Tempo limite do destino excedido.')));
    request.on('error', reject);
    request.end(body);
  });
}

import crypto from 'crypto';

export type AuthPayload = {
  sub: string;
  role?: string;
  exp: number;
};

function base64UrlEncode(value: Buffer | string) {
  return Buffer.from(value).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

export function verifyAuthToken(token: string | null): AuthPayload | null {
  if (!token || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, encodedSignature] = token.split('.', 2);
  const secret = process.env.JWT_SECRET || 'change-this-local-secret';
  const expectedSignature = base64UrlEncode(
    crypto.createHmac('sha256', secret).update(encodedPayload).digest()
  );

  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(encodedSignature);

  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AuthPayload;

    if (!payload.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function bearerTokenFromRequest(request: Request) {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

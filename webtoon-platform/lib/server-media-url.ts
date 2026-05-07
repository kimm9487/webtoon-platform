import crypto from 'crypto';
import { uploadPath } from './media-url';

const PHP_API_BASE_URL = process.env.NEXT_PUBLIC_PHP_API_URL || 'http://localhost:8000/api';

export function signedMediaUrl(value: string): string {
  const path = uploadPath(value);

  if (!path) {
    return value;
  }

  return `${PHP_API_BASE_URL}/media/${encodeURIComponent(signMediaPath(path))}`;
}

function signMediaPath(path: string): string {
  const payload = base64UrlEncode(
    Buffer.from(
      JSON.stringify({
        path,
        exp: Math.floor(Date.now() / 1000) + 600,
      })
    )
  );

  return `${payload}.${hmacSha256(payload)}`;
}

function hmacSha256(value: string): string {
  const secret = process.env.MEDIA_SIGNING_SECRET || process.env.JWT_SECRET || 'change-this-local-secret';

  return base64UrlEncode(crypto.createHmac('sha256', secret).update(value).digest());
}

function base64UrlEncode(value: Buffer): string {
  return value.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

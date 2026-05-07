const PHP_API_BASE_URL = process.env.NEXT_PUBLIC_PHP_API_URL || 'http://localhost:8000/api';
const PHP_PUBLIC_BASE_URL = PHP_API_BASE_URL.replace(/\/api\/?$/, '');

function localUploadPath(value: string): string | null {
  if (value.startsWith('/uploads/')) {
    return value;
  }

  try {
    const url = new URL(value);
    return url.pathname.startsWith('/uploads/') ? url.pathname : null;
  } catch {
    return null;
  }
}

export function mediaUrl(value: string): string {
  const path = localUploadPath(value);

  if (!path) {
    return value;
  }

  return `${PHP_PUBLIC_BASE_URL}${path}`;
}

export function uploadPath(value: string): string | null {
  return localUploadPath(value);
}

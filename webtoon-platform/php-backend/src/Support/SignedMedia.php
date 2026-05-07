<?php

declare(strict_types=1);

namespace App\Support;

use App\Config;

final class SignedMedia
{
    private const DEFAULT_TTL_SECONDS = 600;

    public static function issue(string $path, ?int $ttlSeconds = null): string
    {
        $normalizedPath = self::normalizePath($path);
        $payload = [
            'path' => $normalizedPath,
            'exp' => time() + ($ttlSeconds ?? self::DEFAULT_TTL_SECONDS),
        ];

        $encodedPayload = self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES) ?: '{}');
        $signature = hash_hmac('sha256', $encodedPayload, self::secret(), true);

        return $encodedPayload . '.' . self::base64UrlEncode($signature);
    }

    /** @return array{path: string, exp: int}|null */
    public static function verify(?string $token): ?array
    {
        if (!$token || !str_contains($token, '.')) {
            return null;
        }

        [$encodedPayload, $encodedSignature] = explode('.', $token, 2);
        $expected = self::base64UrlEncode(hash_hmac('sha256', $encodedPayload, self::secret(), true));

        if (!hash_equals($expected, $encodedSignature)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($encodedPayload), true);

        if (!is_array($payload) || !isset($payload['path'], $payload['exp']) || (int)$payload['exp'] < time()) {
            return null;
        }

        $path = self::normalizePath((string)$payload['path']);

        if ($path === '') {
            return null;
        }

        return [
            'path' => $path,
            'exp' => (int)$payload['exp'],
        ];
    }

    public static function publicUrl(string $path): string
    {
        return self::publicBaseUrl() . '/api/media/' . self::issue($path);
    }

    public static function normalizePath(string $path): string
    {
        $parsedPath = parse_url($path, PHP_URL_PATH);
        $value = is_string($parsedPath) ? $parsedPath : $path;
        $value = '/' . ltrim($value, '/');

        if (!str_starts_with($value, '/uploads/')) {
            return '';
        }

        if (str_contains($value, '..') || str_contains($value, "\0")) {
            return '';
        }

        return $value;
    }

    private static function publicBaseUrl(): string
    {
        $configured = Config::get('PHP_PUBLIC_URL', '');

        if (is_string($configured) && trim($configured) !== '') {
            return rtrim(trim($configured), '/');
        }

        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';

        return $scheme . '://' . $host;
    }

    private static function secret(): string
    {
        return Config::get('MEDIA_SIGNING_SECRET', Config::get('JWT_SECRET', 'change-this-local-secret')) ?? 'change-this-local-secret';
    }

    private static function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $value): string
    {
        return base64_decode(strtr($value, '-_', '+/')) ?: '';
    }
}

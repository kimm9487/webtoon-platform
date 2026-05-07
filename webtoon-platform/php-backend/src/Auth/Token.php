<?php

declare(strict_types=1);

namespace App\Auth;

use App\Config;

final class Token
{
    /** @param array<string, mixed> $payload */
    public static function issue(array $payload): string
    {
        $payload['exp'] = time() + 60 * 60 * 24 * 7;
        $encodedPayload = self::base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES) ?: '{}');
        $signature = hash_hmac('sha256', $encodedPayload, self::secret(), true);

        return $encodedPayload . '.' . self::base64UrlEncode($signature);
    }

    /** @return array<string, mixed>|null */
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

        if (!is_array($payload) || !isset($payload['exp']) || (int)$payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    private static function secret(): string
    {
        return Config::get('JWT_SECRET', 'change-this-local-secret') ?? 'change-this-local-secret';
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

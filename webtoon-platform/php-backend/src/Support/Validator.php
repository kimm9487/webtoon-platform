<?php

declare(strict_types=1);

namespace App\Support;

final class Validator
{
    /** @param array<string, mixed> $data */
    public static function string(array $data, string $key, int $min = 1, int $max = 191): ?string
    {
        $value = $data[$key] ?? null;

        if (!is_string($value)) {
            return null;
        }

        $value = trim($value);
        $length = strlen($value);

        if ($length < $min || $length > $max) {
            return null;
        }

        return $value;
    }
}

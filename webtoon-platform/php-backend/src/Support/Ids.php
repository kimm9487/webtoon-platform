<?php

declare(strict_types=1);

namespace App\Support;

final class Ids
{
    public static function make(string $prefix): string
    {
        return $prefix . '_' . bin2hex(random_bytes(12));
    }
}

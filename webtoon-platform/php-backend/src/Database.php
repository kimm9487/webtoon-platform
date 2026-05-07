<?php

declare(strict_types=1);

namespace App;

use PDO;
use RuntimeException;

final class Database
{
    private static ?PDO $pdo = null;

    public static function connection(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        $url = Config::get('DATABASE_URL');

        if (!$url) {
            throw new RuntimeException('DATABASE_URL is not set.');
        }

        $parts = parse_url($url);

        if (!$parts || ($parts['scheme'] ?? '') !== 'mysql') {
            throw new RuntimeException('DATABASE_URL must be a mysql URL.');
        }

        $host = $parts['host'] ?? '127.0.0.1';
        $port = (int)($parts['port'] ?? 3306);
        $database = ltrim($parts['path'] ?? '', '/');
        $user = rawurldecode($parts['user'] ?? '');
        $password = rawurldecode($parts['pass'] ?? '');

        $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
        self::$pdo = new PDO($dsn, $user, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        return self::$pdo;
    }
}

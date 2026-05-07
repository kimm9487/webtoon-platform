<?php

declare(strict_types=1);

namespace App\Http;

final class Request
{
    /** @param array<string, string> $query @param array<string, string> $headers */
    public function __construct(
        public readonly string $method,
        public readonly string $path,
        public readonly array $query,
        public readonly array $headers,
        private readonly string $rawBody,
    ) {
    }

    public static function fromGlobals(): self
    {
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $headers = [];

        foreach ($_SERVER as $key => $value) {
            if (str_starts_with($key, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = (string)$value;
            }
        }

        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = (string)$_SERVER['CONTENT_TYPE'];
        }

        return new self(
            strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET'),
            rtrim($uri, '/') ?: '/',
            $_GET,
            $headers,
            file_get_contents('php://input') ?: '',
        );
    }

    /** @return array<string, mixed> */
    public function json(): array
    {
        if ($this->rawBody === '') {
            return [];
        }

        $decoded = json_decode($this->rawBody, true);
        return is_array($decoded) ? $decoded : [];
    }

    public function bearerToken(): ?string
    {
        $header = $this->headers['authorization'] ?? '';

        if (preg_match('/^Bearer\s+(.+)$/i', $header, $matches) !== 1) {
            return null;
        }

        return trim($matches[1]);
    }
}

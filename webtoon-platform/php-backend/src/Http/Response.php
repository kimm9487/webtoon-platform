<?php

declare(strict_types=1);

namespace App\Http;

final class Response
{
    /** @param array<string, mixed> $headers */
    public function __construct(
        private readonly string $body,
        private readonly int $status = 200,
        private readonly array $headers = [],
    ) {
    }

    /** @param mixed $data */
    public static function json($data, int $status = 200): self
    {
        return new self(json_encode($data, JSON_UNESCAPED_SLASHES) ?: '{}', $status, [
            'Content-Type' => 'application/json; charset=utf-8',
        ]);
    }

    public function send(): void
    {
        http_response_code($this->status);
        header('Access-Control-Allow-Origin: http://localhost:3000');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

        foreach ($this->headers as $name => $value) {
            header($name . ': ' . $value);
        }

        echo $this->body;
    }
}

<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Support\SignedMedia;

final class MediaController
{
    /** @param array<string, string> $params */
    public function show(Request $request, array $params): Response
    {
        $payload = SignedMedia::verify($params['token'] ?? null);

        if (!$payload) {
            return Response::json(['success' => false, 'error' => 'Invalid or expired media URL.'], 403);
        }

        $root = realpath(dirname(__DIR__, 2) . '/public/uploads');
        $file = realpath(dirname(__DIR__, 2) . '/public' . $payload['path']);

        if (!$root || !$file || !str_starts_with($file, $root . DIRECTORY_SEPARATOR) || !is_file($file)) {
            return Response::json(['success' => false, 'error' => 'Media not found.'], 404);
        }

        $mime = $this->mimeType($file);

        if (!in_array($mime, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], true)) {
            return Response::json(['success' => false, 'error' => 'Unsupported media type.'], 415);
        }

        return new Response((string)file_get_contents($file), 200, [
            'Content-Type' => $mime,
            'Content-Length' => (string)filesize($file),
            'Cache-Control' => 'private, max-age=300',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function mimeType(string $filename): string
    {
        $image = getimagesize($filename);

        if (is_array($image) && isset($image['mime'])) {
            return (string)$image['mime'];
        }

        return '';
    }
}

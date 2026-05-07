<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Token;
use App\Database;
use App\Http\Request;
use App\Http\Response;
use App\Support\SignedMedia;

final class UploadController
{
    private const MAX_BYTES = 5 * 1024 * 1024;

    public function store(Request $request): Response
    {
        if (!$this->canUpload($request)) {
            return Response::json(['success' => false, 'error' => 'Author access required.'], 403);
        }

        if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
            return Response::json(['success' => false, 'error' => 'file is required.'], 400);
        }

        $file = $_FILES['file'];

        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            return Response::json(['success' => false, 'error' => 'Upload failed.'], 400);
        }

        if (($file['size'] ?? 0) <= 0 || ($file['size'] ?? 0) > self::MAX_BYTES) {
            return Response::json(['success' => false, 'error' => 'File must be 5MB or smaller.'], 400);
        }

        $tmpName = (string)($file['tmp_name'] ?? '');
        $mime = $this->mimeType($tmpName);
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
        ];

        if (!isset($extensions[$mime])) {
            return Response::json(['success' => false, 'error' => 'Only JPG, PNG, and GIF files are allowed.'], 400);
        }

        $type = $this->uploadType((string)($request->query['type'] ?? 'images'));
        $directory = dirname(__DIR__, 2) . '/public/uploads/' . $type;

        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            return Response::json(['success' => false, 'error' => 'Upload directory could not be created.'], 500);
        }

        $filename = bin2hex(random_bytes(16)) . '.' . $extensions[$mime];
        $target = $directory . '/' . $filename;

        if (!move_uploaded_file($tmpName, $target)) {
            return Response::json(['success' => false, 'error' => 'File could not be saved.'], 500);
        }

        $path = '/uploads/' . $type . '/' . $filename;
        $url = SignedMedia::publicUrl($path);

        return Response::json([
            'success' => true,
            'data' => [
                'url' => $url,
                'path' => $path,
                'mime' => $mime,
                'size' => (int)$file['size'],
                'originalName' => (string)($file['name'] ?? ''),
            ],
            'message' => 'File uploaded.',
        ], 201);
    }

    private function canUpload(Request $request): bool
    {
        $payload = Token::verify($request->bearerToken());

        if (!$payload || !isset($payload['sub'])) {
            return false;
        }

        $statement = Database::connection()->prepare('SELECT role FROM users WHERE id = :id LIMIT 1');
        $statement->execute(['id' => (string)$payload['sub']]);
        $user = $statement->fetch();

        return $user && in_array((string)$user['role'], ['AUTHOR', 'ADMIN'], true);
    }

    private function mimeType(string $filename): string
    {
        if ($filename === '' || !is_file($filename)) {
            return '';
        }

        $image = getimagesize($filename);

        if (is_array($image) && isset($image['mime'])) {
            return (string)$image['mime'];
        }

        return '';
    }

    private function uploadType(string $value): string
    {
        return in_array($value, ['thumbnails', 'episodes'], true) ? $value : 'images';
    }

}

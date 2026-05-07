<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Token;
use App\Database;
use App\Http\Request;
use App\Http\Response;
use App\Support\Ids;
use App\Support\Validator;

final class CommentController
{
    public function index(Request $request): Response
    {
        $episodeId = $request->query['episodeId'] ?? null;

        if (!is_string($episodeId) || trim($episodeId) === '') {
            return Response::json([
                'success' => false,
                'error' => 'episodeId is required.',
            ], 400);
        }

        $statement = Database::connection()->prepare(
            'SELECT c.id, c.userId, c.episodeId, c.content, c.likes, c.createdAt, c.updatedAt,
                    u.username, u.profileImage
             FROM comments c
             JOIN users u ON u.id = c.userId
             WHERE c.episodeId = :episodeId
             ORDER BY c.createdAt DESC'
        );
        $statement->execute(['episodeId' => $episodeId]);

        return Response::json([
            'success' => true,
            'data' => $statement->fetchAll(),
            'message' => 'Comments fetched.',
        ]);
    }

    public function store(Request $request): Response
    {
        $userId = $this->authenticatedUserId($request);

        if (!$userId) {
            return Response::json(['success' => false, 'error' => 'Unauthorized.'], 401);
        }

        $body = $request->json();
        $episodeId = Validator::string($body, 'episodeId', 1, 191);
        $content = Validator::string($body, 'content', 1, 5000);

        if (!$episodeId || !$content) {
            return Response::json([
                'success' => false,
                'error' => 'episodeId and content are required.',
            ], 400);
        }

        $id = Ids::make('cmt');
        $statement = Database::connection()->prepare(
            'INSERT INTO comments (id, userId, episodeId, content, likes, createdAt, updatedAt)
             VALUES (:id, :userId, :episodeId, :content, 0, NOW(3), NOW(3))'
        );
        $statement->execute([
            'id' => $id,
            'userId' => $userId,
            'episodeId' => $episodeId,
            'content' => $content,
        ]);

        return Response::json([
            'success' => true,
            'data' => $this->findComment($id),
            'message' => 'Comment created.',
        ], 201);
    }

    /** @param array<string, string> $params */
    public function update(Request $request, array $params): Response
    {
        $userId = $this->authenticatedUserId($request);

        if (!$userId) {
            return Response::json(['success' => false, 'error' => 'Unauthorized.'], 401);
        }

        $content = Validator::string($request->json(), 'content', 1, 5000);

        if (!$content) {
            return Response::json(['success' => false, 'error' => 'content is required.'], 400);
        }

        $statement = Database::connection()->prepare(
            'UPDATE comments SET content = :content, updatedAt = NOW(3)
             WHERE id = :id AND userId = :userId'
        );
        $statement->execute([
            'id' => $params['id'],
            'userId' => $userId,
            'content' => $content,
        ]);

        if ($statement->rowCount() === 0) {
            return Response::json(['success' => false, 'error' => 'Comment not found.'], 404);
        }

        return Response::json([
            'success' => true,
            'data' => $this->findComment($params['id']),
            'message' => 'Comment updated.',
        ]);
    }

    /** @param array<string, string> $params */
    public function destroy(Request $request, array $params): Response
    {
        $userId = $this->authenticatedUserId($request);

        if (!$userId) {
            return Response::json(['success' => false, 'error' => 'Unauthorized.'], 401);
        }

        $statement = Database::connection()->prepare('DELETE FROM comments WHERE id = :id AND userId = :userId');
        $statement->execute([
            'id' => $params['id'],
            'userId' => $userId,
        ]);

        if ($statement->rowCount() === 0) {
            return Response::json(['success' => false, 'error' => 'Comment not found.'], 404);
        }

        return Response::json([
            'success' => true,
            'message' => 'Comment deleted.',
        ]);
    }

    private function authenticatedUserId(Request $request): ?string
    {
        $payload = Token::verify($request->bearerToken());
        return $payload && isset($payload['sub']) ? (string)$payload['sub'] : null;
    }

    /** @return array<string, mixed>|null */
    private function findComment(string $id): ?array
    {
        $statement = Database::connection()->prepare(
            'SELECT c.id, c.userId, c.episodeId, c.content, c.likes, c.createdAt, c.updatedAt,
                    u.username, u.profileImage
             FROM comments c
             JOIN users u ON u.id = c.userId
             WHERE c.id = :id
             LIMIT 1'
        );
        $statement->execute(['id' => $id]);
        $comment = $statement->fetch();

        return $comment ?: null;
    }
}

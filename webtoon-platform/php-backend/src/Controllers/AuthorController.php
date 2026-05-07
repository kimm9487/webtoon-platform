<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Token;
use App\Database;
use App\Http\Request;
use App\Http\Response;
use App\Support\Ids;
use App\Support\Validator;

final class AuthorController
{
    public function dashboard(Request $request): Response
    {
        $author = $this->requireAuthor($request);

        if (!$author) {
            return Response::json(['success' => false, 'error' => 'Author access required.'], 403);
        }

        $pdo = Database::connection();
        $statement = $pdo->prepare(
            'SELECT w.id, w.title, w.description, w.thumbnail, w.genre, w.status, w.rating, w.views,
                    w.createdAt, w.updatedAt, COUNT(e.id) AS episodeCount
             FROM webtoons w
             LEFT JOIN episodes e ON e.webtoonId = w.id
             WHERE w.authorId = :authorId
             GROUP BY w.id
             ORDER BY w.createdAt DESC'
        );
        $statement->execute(['authorId' => $author['id']]);
        $webtoons = array_map([$this, 'formatWebtoon'], $statement->fetchAll());

        return Response::json([
            'success' => true,
            'data' => [
                'author' => $author,
                'webtoons' => $webtoons,
                'stats' => [
                    'webtoonCount' => count($webtoons),
                    'episodeCount' => array_sum(array_map(fn ($item) => (int)$item['episodeCount'], $webtoons)),
                    'views' => array_sum(array_map(fn ($item) => (int)$item['views'], $webtoons)),
                ],
            ],
        ]);
    }

    public function createWebtoon(Request $request): Response
    {
        $author = $this->requireAuthor($request);

        if (!$author) {
            return Response::json(['success' => false, 'error' => 'Author access required.'], 403);
        }

        $body = $request->json();
        $title = Validator::string($body, 'title', 1, 191);
        $description = Validator::string($body, 'description', 1, 5000);
        $thumbnail = Validator::string($body, 'thumbnail', 1, 191);

        if (!$title || !$description || !$thumbnail) {
            return Response::json([
                'success' => false,
                'error' => 'title, description, and thumbnail are required.',
            ], 400);
        }

        $status = $this->status((string)($body['status'] ?? 'ONGOING'));
        $genre = $this->genre($body['genre'] ?? []);
        $id = Ids::make('web');

        $statement = Database::connection()->prepare(
            'INSERT INTO webtoons (id, title, authorId, description, thumbnail, genre, status, rating, views, createdAt, updatedAt)
             VALUES (:id, :title, :authorId, :description, :thumbnail, :genre, :status, 0, 0, NOW(3), NOW(3))'
        );
        $statement->execute([
            'id' => $id,
            'title' => $title,
            'authorId' => $author['id'],
            'description' => $description,
            'thumbnail' => $thumbnail,
            'genre' => json_encode($genre, JSON_UNESCAPED_SLASHES),
            'status' => $status,
        ]);

        return Response::json([
            'success' => true,
            'data' => $this->findOwnedWebtoon($id, (string)$author['id']),
            'message' => 'Webtoon created.',
        ], 201);
    }

    /** @param array<string, string> $params */
    public function updateWebtoon(Request $request, array $params): Response
    {
        $author = $this->requireAuthor($request);

        if (!$author || !$this->ownsWebtoon($params['id'], (string)$author['id'])) {
            return Response::json(['success' => false, 'error' => 'Webtoon not found.'], 404);
        }

        $body = $request->json();
        $title = Validator::string($body, 'title', 1, 191);
        $description = Validator::string($body, 'description', 1, 5000);
        $thumbnail = Validator::string($body, 'thumbnail', 1, 191);

        if (!$title || !$description || !$thumbnail) {
            return Response::json(['success' => false, 'error' => 'Invalid webtoon data.'], 400);
        }

        $statement = Database::connection()->prepare(
            'UPDATE webtoons
             SET title = :title, description = :description, thumbnail = :thumbnail, genre = :genre, status = :status, updatedAt = NOW(3)
             WHERE id = :id AND authorId = :authorId'
        );
        $statement->execute([
            'id' => $params['id'],
            'authorId' => $author['id'],
            'title' => $title,
            'description' => $description,
            'thumbnail' => $thumbnail,
            'genre' => json_encode($this->genre($body['genre'] ?? []), JSON_UNESCAPED_SLASHES),
            'status' => $this->status((string)($body['status'] ?? 'ONGOING')),
        ]);

        return Response::json([
            'success' => true,
            'data' => $this->findOwnedWebtoon($params['id'], (string)$author['id']),
            'message' => 'Webtoon updated.',
        ]);
    }

    /** @param array<string, string> $params */
    public function deleteWebtoon(Request $request, array $params): Response
    {
        $author = $this->requireAuthor($request);

        if (!$author || !$this->ownsWebtoon($params['id'], (string)$author['id'])) {
            return Response::json(['success' => false, 'error' => 'Webtoon not found.'], 404);
        }

        $statement = Database::connection()->prepare('DELETE FROM webtoons WHERE id = :id AND authorId = :authorId');
        $statement->execute(['id' => $params['id'], 'authorId' => $author['id']]);

        return Response::json(['success' => true, 'message' => 'Webtoon deleted.']);
    }

    /** @param array<string, string> $params */
    public function createEpisode(Request $request, array $params): Response
    {
        $author = $this->requireAuthor($request);

        if (!$author || !$this->ownsWebtoon($params['id'], (string)$author['id'])) {
            return Response::json(['success' => false, 'error' => 'Webtoon not found.'], 404);
        }

        $body = $request->json();
        $title = Validator::string($body, 'title', 1, 191);
        $episodeNumber = (int)($body['episodeNumber'] ?? 0);

        if (!$title || $episodeNumber < 1) {
            return Response::json(['success' => false, 'error' => 'episodeNumber and title are required.'], 400);
        }

        $id = Ids::make('eps');
        $statement = Database::connection()->prepare(
            'INSERT INTO episodes (id, webtoonId, episodeNumber, title, description, images, views, likes, createdAt, updatedAt)
             VALUES (:id, :webtoonId, :episodeNumber, :title, :description, :images, 0, 0, NOW(3), NOW(3))'
        );
        $statement->execute([
            'id' => $id,
            'webtoonId' => $params['id'],
            'episodeNumber' => $episodeNumber,
            'title' => $title,
            'description' => is_string($body['description'] ?? null) ? trim((string)$body['description']) : null,
            'images' => json_encode($this->images($body['images'] ?? []), JSON_UNESCAPED_SLASHES),
        ]);

        return Response::json([
            'success' => true,
            'data' => $this->findEpisode($id),
            'message' => 'Episode created.',
        ], 201);
    }

    /** @param array<string, string> $params */
    public function updateEpisode(Request $request, array $params): Response
    {
        $author = $this->requireAuthor($request);
        $episode = $this->findEpisode($params['id']);

        if (!$author || !$episode || !$this->ownsWebtoon((string)$episode['webtoonId'], (string)$author['id'])) {
            return Response::json(['success' => false, 'error' => 'Episode not found.'], 404);
        }

        $body = $request->json();
        $title = Validator::string($body, 'title', 1, 191);
        $episodeNumber = (int)($body['episodeNumber'] ?? 0);

        if (!$title || $episodeNumber < 1) {
            return Response::json(['success' => false, 'error' => 'Invalid episode data.'], 400);
        }

        $statement = Database::connection()->prepare(
            'UPDATE episodes
             SET episodeNumber = :episodeNumber, title = :title, description = :description, images = :images, updatedAt = NOW(3)
             WHERE id = :id'
        );
        $statement->execute([
            'id' => $params['id'],
            'episodeNumber' => $episodeNumber,
            'title' => $title,
            'description' => is_string($body['description'] ?? null) ? trim((string)$body['description']) : null,
            'images' => json_encode($this->images($body['images'] ?? []), JSON_UNESCAPED_SLASHES),
        ]);

        return Response::json([
            'success' => true,
            'data' => $this->findEpisode($params['id']),
            'message' => 'Episode updated.',
        ]);
    }

    /** @param array<string, string> $params */
    public function deleteEpisode(Request $request, array $params): Response
    {
        $author = $this->requireAuthor($request);
        $episode = $this->findEpisode($params['id']);

        if (!$author || !$episode || !$this->ownsWebtoon((string)$episode['webtoonId'], (string)$author['id'])) {
            return Response::json(['success' => false, 'error' => 'Episode not found.'], 404);
        }

        $statement = Database::connection()->prepare('DELETE FROM episodes WHERE id = :id');
        $statement->execute(['id' => $params['id']]);

        return Response::json(['success' => true, 'message' => 'Episode deleted.']);
    }

    /** @return array<string, mixed>|null */
    private function requireAuthor(Request $request): ?array
    {
        $payload = Token::verify($request->bearerToken());

        if (!$payload || !isset($payload['sub'])) {
            return null;
        }

        $pdo = Database::connection();
        $userStatement = $pdo->prepare('SELECT id, username, role FROM users WHERE id = :id LIMIT 1');
        $userStatement->execute(['id' => (string)$payload['sub']]);
        $user = $userStatement->fetch();

        if (!$user || !in_array((string)$user['role'], ['AUTHOR', 'ADMIN'], true)) {
            return null;
        }

        $authorStatement = $pdo->prepare('SELECT * FROM authors WHERE userId = :userId LIMIT 1');
        $authorStatement->execute(['userId' => $user['id']]);
        $author = $authorStatement->fetch();

        if ($author) {
            return $author;
        }

        $id = Ids::make('aut');
        $create = $pdo->prepare(
            'INSERT INTO authors (id, userId, name, bio, followers, createdAt, updatedAt)
             VALUES (:id, :userId, :name, :bio, 0, NOW(3), NOW(3))'
        );
        $create->execute([
            'id' => $id,
            'userId' => $user['id'],
            'name' => $user['username'],
            'bio' => 'Author profile',
        ]);

        $authorStatement->execute(['userId' => $user['id']]);
        $author = $authorStatement->fetch();

        return $author ?: null;
    }

    private function ownsWebtoon(string $webtoonId, string $authorId): bool
    {
        $statement = Database::connection()->prepare('SELECT id FROM webtoons WHERE id = :id AND authorId = :authorId LIMIT 1');
        $statement->execute(['id' => $webtoonId, 'authorId' => $authorId]);
        return (bool)$statement->fetch();
    }

    /** @return array<string, mixed>|null */
    private function findOwnedWebtoon(string $id, string $authorId): ?array
    {
        $statement = Database::connection()->prepare(
            'SELECT w.*, COUNT(e.id) AS episodeCount
             FROM webtoons w
             LEFT JOIN episodes e ON e.webtoonId = w.id
             WHERE w.id = :id AND w.authorId = :authorId
             GROUP BY w.id
             LIMIT 1'
        );
        $statement->execute(['id' => $id, 'authorId' => $authorId]);
        $webtoon = $statement->fetch();

        return $webtoon ? $this->formatWebtoon($webtoon) : null;
    }

    /** @return array<string, mixed>|null */
    private function findEpisode(string $id): ?array
    {
        $statement = Database::connection()->prepare('SELECT * FROM episodes WHERE id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $episode = $statement->fetch();

        if (!$episode) {
            return null;
        }

        $images = json_decode((string)$episode['images'], true);
        $episode['images'] = is_array($images) ? $images : [];

        return $episode;
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function formatWebtoon(array $row): array
    {
        $genre = json_decode((string)$row['genre'], true);
        $row['genre'] = is_array($genre) ? $genre : [];
        $row['status'] = strtolower((string)$row['status']);
        $row['episodeCount'] = (int)($row['episodeCount'] ?? 0);
        return $row;
    }

    /** @param mixed $value @return array<int, string> */
    private function genre(mixed $value): array
    {
        if (is_string($value)) {
            $value = explode(',', $value);
        }

        if (!is_array($value)) {
            return [];
        }

        return array_values(array_filter(array_map(fn ($item) => trim((string)$item), $value)));
    }

    /** @param mixed $value @return array<int, string> */
    private function images(mixed $value): array
    {
        if (is_string($value)) {
            $value = preg_split('/\r\n|\r|\n/', $value) ?: [];
        }

        if (!is_array($value)) {
            return [];
        }

        return array_values(array_filter(array_map(fn ($item) => trim((string)$item), $value)));
    }

    private function status(string $value): string
    {
        $status = strtoupper($value);
        return in_array($status, ['ONGOING', 'COMPLETED', 'HIATUS'], true) ? $status : 'ONGOING';
    }
}

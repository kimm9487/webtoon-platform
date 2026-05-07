<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Database;
use App\Http\Request;
use App\Http\Response;

final class SearchController
{
    public function index(Request $request): Response
    {
        $query = trim((string)($request->query['q'] ?? ''));
        $status = strtoupper(trim((string)($request->query['status'] ?? '')));
        $genre = trim((string)($request->query['genre'] ?? ''));
        $limit = min(max((int)($request->query['limit'] ?? 20), 1), 50);

        $where = [];
        $params = [];

        if ($query !== '') {
            $where[] = '(w.title LIKE :titleQuery OR w.description LIKE :descriptionQuery OR u.username LIKE :usernameQuery OR a.name LIKE :authorQuery)';
            $params['titleQuery'] = '%' . $query . '%';
            $params['descriptionQuery'] = '%' . $query . '%';
            $params['usernameQuery'] = '%' . $query . '%';
            $params['authorQuery'] = '%' . $query . '%';
        }

        if (in_array($status, ['ONGOING', 'COMPLETED', 'HIATUS'], true)) {
            $where[] = 'w.status = :status';
            $params['status'] = $status;
        }

        if ($genre !== '') {
            $where[] = 'JSON_SEARCH(w.genre, "one", :genre) IS NOT NULL';
            $params['genre'] = $genre;
        }

        $sql = 'SELECT w.id, w.title, w.description, w.thumbnail, w.genre, w.status, w.rating, w.views,
                       w.createdAt, w.updatedAt, u.username AS author
                FROM webtoons w
                JOIN authors a ON a.id = w.authorId
                JOIN users u ON u.id = a.userId';

        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY w.views DESC, w.createdAt DESC LIMIT ' . $limit;

        $statement = Database::connection()->prepare($sql);
        $statement->execute($params);
        $rows = array_map([$this, 'formatWebtoon'], $statement->fetchAll());

        return Response::json([
            'success' => true,
            'data' => $rows,
            'message' => 'Search completed.',
        ]);
    }

    /** @param array<string, mixed> $row @return array<string, mixed> */
    private function formatWebtoon(array $row): array
    {
        $genre = json_decode((string)$row['genre'], true);
        $row['genre'] = is_array($genre) ? $genre : [];
        $row['status'] = strtolower((string)$row['status']);
        return $row;
    }
}

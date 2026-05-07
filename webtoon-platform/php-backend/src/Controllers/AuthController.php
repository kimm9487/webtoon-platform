<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Auth\Token;
use App\Database;
use App\Http\Request;
use App\Http\Response;
use App\Support\Ids;
use App\Support\Validator;
use PDOException;

final class AuthController
{
    public function register(Request $request): Response
    {
        $body = $request->json();
        $email = Validator::string($body, 'email', 5, 191);
        $username = Validator::string($body, 'username', 3, 191);
        $password = Validator::string($body, 'password', 8, 191);

        if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL) || !$username || !$password) {
            return Response::json([
                'success' => false,
                'error' => 'Valid email, username, and password are required.',
            ], 400);
        }

        $role = strtoupper((string)($body['role'] ?? 'USER'));
        $role = in_array($role, ['USER', 'AUTHOR'], true) ? $role : 'USER';
        $id = Ids::make('usr');

        try {
            $pdo = Database::connection();
            $statement = Database::connection()->prepare(
                'INSERT INTO users (id, email, username, password, role, createdAt, updatedAt)
                 VALUES (:id, :email, :username, :password, :role, NOW(3), NOW(3))'
            );
            $statement->execute([
                'id' => $id,
                'email' => $email,
                'username' => $username,
                'password' => password_hash($password, PASSWORD_DEFAULT),
                'role' => $role,
            ]);

            if ($role === 'AUTHOR') {
                $authorStatement = $pdo->prepare(
                    'INSERT INTO authors (id, userId, name, bio, followers, createdAt, updatedAt)
                     VALUES (:id, :userId, :name, :bio, 0, NOW(3), NOW(3))'
                );
                $authorStatement->execute([
                    'id' => Ids::make('aut'),
                    'userId' => $id,
                    'name' => $username,
                    'bio' => 'Author profile',
                ]);
            }
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                return Response::json([
                    'success' => false,
                    'error' => 'Email or username already exists.',
                ], 409);
            }

            throw $error;
        }

        return Response::json([
            'success' => true,
            'data' => [
                'token' => Token::issue(['sub' => $id, 'role' => $role]),
                'user' => $this->findUser($id),
            ],
            'message' => 'Registered.',
        ], 201);
    }

    public function login(Request $request): Response
    {
        $body = $request->json();
        $email = Validator::string($body, 'email', 5, 191);
        $password = Validator::string($body, 'password', 1, 191);

        if (!$email || !$password) {
            return Response::json([
                'success' => false,
                'error' => 'Email and password are required.',
            ], 400);
        }

        $statement = Database::connection()->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $statement->execute(['email' => $email]);
        $user = $statement->fetch();

        if (!$user || !password_verify($password, (string)$user['password'])) {
            return Response::json([
                'success' => false,
                'error' => 'Invalid credentials.',
            ], 401);
        }

        return Response::json([
            'success' => true,
            'data' => [
                'token' => Token::issue(['sub' => $user['id'], 'role' => $user['role']]),
                'user' => $this->publicUser($user),
            ],
            'message' => 'Logged in.',
        ]);
    }

    public function me(Request $request): Response
    {
        $payload = Token::verify($request->bearerToken());

        if (!$payload) {
            return Response::json([
                'success' => false,
                'error' => 'Unauthorized.',
            ], 401);
        }

        $user = $this->findUser((string)$payload['sub']);

        if (!$user) {
            return Response::json([
                'success' => false,
                'error' => 'User not found.',
            ], 404);
        }

        return Response::json([
            'success' => true,
            'data' => $user,
        ]);
    }

    /** @return array<string, mixed>|null */
    private function findUser(string $id): ?array
    {
        $statement = Database::connection()->prepare(
            'SELECT id, email, username, profileImage, bio, role, createdAt, updatedAt
             FROM users WHERE id = :id LIMIT 1'
        );
        $statement->execute(['id' => $id]);
        $user = $statement->fetch();

        return $user ? $this->publicUser($user) : null;
    }

    /** @param array<string, mixed> $user @return array<string, mixed> */
    private function publicUser(array $user): array
    {
        unset($user['password']);
        return $user;
    }
}

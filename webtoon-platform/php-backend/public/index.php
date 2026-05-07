<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/bootstrap.php';

use App\Http\Request;
use App\Http\Response;
use App\Router;

$request = Request::fromGlobals();
$router = new Router();

$router->post('/api/auth/register', 'AuthController@register');
$router->post('/api/auth/login', 'AuthController@login');
$router->get('/api/auth/me', 'AuthController@me');

$router->get('/api/comments', 'CommentController@index');
$router->post('/api/comments', 'CommentController@store');
$router->put('/api/comments/{id}', 'CommentController@update');
$router->delete('/api/comments/{id}', 'CommentController@destroy');

$router->get('/api/search', 'SearchController@index');

$router->get('/api/author/dashboard', 'AuthorController@dashboard');
$router->post('/api/author/webtoons', 'AuthorController@createWebtoon');
$router->put('/api/author/webtoons/{id}', 'AuthorController@updateWebtoon');
$router->delete('/api/author/webtoons/{id}', 'AuthorController@deleteWebtoon');
$router->post('/api/author/webtoons/{id}/episodes', 'AuthorController@createEpisode');
$router->put('/api/author/episodes/{id}', 'AuthorController@updateEpisode');
$router->delete('/api/author/episodes/{id}', 'AuthorController@deleteEpisode');

try {
    $router->dispatch($request)->send();
} catch (Throwable $error) {
    error_log($error->getMessage());

    Response::json([
        'success' => false,
        'error' => 'Internal server error.',
    ], 500)->send();
}

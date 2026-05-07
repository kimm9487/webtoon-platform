<?php

declare(strict_types=1);

namespace App;

use App\Http\Request;
use App\Http\Response;

final class Router
{
    /** @var array<int, array{method: string, pattern: string, handler: string}> */
    private array $routes = [];

    public function get(string $pattern, string $handler): void
    {
        $this->add('GET', $pattern, $handler);
    }

    public function post(string $pattern, string $handler): void
    {
        $this->add('POST', $pattern, $handler);
    }

    public function put(string $pattern, string $handler): void
    {
        $this->add('PUT', $pattern, $handler);
    }

    public function delete(string $pattern, string $handler): void
    {
        $this->add('DELETE', $pattern, $handler);
    }

    public function dispatch(Request $request): Response
    {
        if ($request->method === 'OPTIONS') {
            return Response::json(['success' => true]);
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $request->method) {
                continue;
            }

            $params = $this->match($route['pattern'], $request->path);

            if ($params === null) {
                continue;
            }

            [$controllerName, $method] = explode('@', $route['handler'], 2);
            $class = 'App\\Controllers\\' . $controllerName;
            $controller = new $class();

            return $controller->{$method}($request, $params);
        }

        return Response::json([
            'success' => false,
            'error' => 'Not found.',
        ], 404);
    }

    private function add(string $method, string $pattern, string $handler): void
    {
        $this->routes[] = [
            'method' => $method,
            'pattern' => rtrim($pattern, '/') ?: '/',
            'handler' => $handler,
        ];
    }

    /** @return array<string, string>|null */
    private function match(string $pattern, string $path): ?array
    {
        $paramNames = [];
        $segments = array_map(function (string $segment) use (&$paramNames): string {
            if (preg_match('/^\{([A-Za-z_][A-Za-z0-9_]*)\}$/', $segment, $matches) === 1) {
                $paramNames[] = $matches[1];
                return '([^/]+)';
            }

            return preg_quote($segment, '#');
        }, explode('/', trim($pattern, '/')));

        $regex = '/' . implode('/', $segments);

        if (preg_match('#^' . $regex . '$#', $path, $matches) !== 1) {
            return null;
        }

        array_shift($matches);
        return array_combine($paramNames, array_map('urldecode', $matches)) ?: [];
    }
}

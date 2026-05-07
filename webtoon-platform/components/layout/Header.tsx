'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWebtoonStore } from '@/lib/store';
import { authApi } from '@/lib/php-api';

export default function Header() {
  const router = useRouter();
  const { user, setUser, isLoggedIn, logout } = useWebtoonStore();
  const isAuthenticated = Boolean(isLoggedIn || user);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    if (!token || user) {
      return;
    }

    authApi
      .me()
      .then((response) => {
        if (response.success && response.data) {
          setUser(response.data);
        }
      })
      .catch(() => {
        localStorage.removeItem('auth_token');
      });
  }, [setUser, user]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    logout();
    router.push('/');
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center">
              <span className="font-bold text-white">W</span>
            </div>
            <span className="font-bold text-xl text-gray-950 hidden sm:inline">Webtoon</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-700">
            <Link href="/webtoons" className="hover:text-purple-700 transition">
              웹툰
            </Link>
            <Link href="/webtoons?status=ongoing" className="hover:text-purple-700 transition">
              연재중
            </Link>
            <Link href="/webtoons?status=completed" className="hover:text-purple-700 transition">
              완결
            </Link>
            <Link href="/character-chat" className="hover:text-purple-700 transition">
              캐릭터 챗봇
            </Link>
            {isAuthenticated ? (
              <Link href="/favorites" className="hover:text-purple-700 transition">
                즐겨찾기
              </Link>
            ) : null}
            {user?.role === 'AUTHOR' || user?.role === 'ADMIN' ? (
              <Link href="/dashboard/author" className="hover:text-purple-700 transition">
                작가 대시보드
              </Link>
            ) : null}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="hidden sm:inline text-sm text-gray-700">{user?.username}</span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="border border-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-50 transition"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-700 px-3 py-2 rounded-md text-sm font-semibold hover:bg-gray-100 transition"
                >
                  로그인
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-purple-700 transition"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

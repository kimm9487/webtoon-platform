'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWebtoonStore } from '@/lib/store';
import { authApi } from '@/lib/php-api';
import {
  FavoriteNotification,
  favoriteNotificationChangedEvent,
  markFavoriteNotificationsRead,
  readFavoriteNotifications,
} from '@/lib/favorites';

const sessionDismissedNewWebtoonKey = 'session_dismissed_new_webtoon_id';

export default function Header() {
  const router = useRouter();
  const { user, setUser, isLoggedIn, logout } = useWebtoonStore();
  const isAuthenticated = Boolean(isLoggedIn || user);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<FavoriteNotification[]>([]);
  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

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

  useEffect(() => {
    if (!user) {
      return;
    }

    const refreshNotifications = () => {
      setNotifications(readFavoriteNotifications(user.id));
    };
    const timer = window.setTimeout(refreshNotifications, 0);

    window.addEventListener(favoriteNotificationChangedEvent, refreshNotifications);
    window.addEventListener('storage', refreshNotifications);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(favoriteNotificationChangedEvent, refreshNotifications);
      window.removeEventListener('storage', refreshNotifications);
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem(sessionDismissedNewWebtoonKey);
    setIsNotificationOpen(false);
    setNotifications([]);
    logout();
    router.push('/');
  };

  const toggleNotifications = () => {
    if (!user) {
      return;
    }

    setIsNotificationOpen((current) => {
      const next = !current;

      if (next) {
        setNotifications(markFavoriteNotificationsRead(user.id));
      }

      return next;
    });
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
              캐릭터 채팅
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
                <div className="relative">
                  <button
                    type="button"
                    onClick={toggleNotifications}
                    className="relative flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50 transition"
                    aria-label="알림 보기"
                    aria-expanded={isNotificationOpen}
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold leading-none text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationOpen && (
                    <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <p className="text-sm font-bold text-gray-950">알림</p>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <Link
                              key={notification.id}
                              href={`/episodes/${notification.episodeId}`}
                              onClick={() => setIsNotificationOpen(false)}
                              className="block border-b border-gray-100 px-4 py-3 hover:bg-gray-50"
                            >
                              <p className="text-sm font-bold text-gray-950">{notification.webtoonTitle}</p>
                              <p className="mt-1 text-sm text-gray-700">
                                {notification.episodeNumber}화 · {notification.episodeTitle}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {formatNotificationDate(notification.createdAt)}
                              </p>
                            </Link>
                          ))
                        ) : (
                          <p className="px-4 py-6 text-center text-sm text-gray-500">아직 알림이 없습니다.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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

function formatNotificationDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

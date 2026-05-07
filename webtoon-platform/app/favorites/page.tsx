'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WebtoonCard from '@/components/webtoon/WebtoonCard';
import { webtoonApi } from '@/lib/api';
import { authApi } from '@/lib/php-api';
import { Webtoon, User } from '@/lib/types';
import { useWebtoonStore } from '@/lib/store';

export default function FavoritesPage() {
  const { user, setUser } = useWebtoonStore();
  const [favorites, setFavorites] = useState<Webtoon[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('auth_token');

      if (!token) {
        setError('즐겨찾기를 보려면 로그인이 필요합니다.');
        setIsLoading(false);
        return;
      }

      try {
        let currentUser: User | null = user;

        if (!currentUser) {
          const me = await authApi.me();
          currentUser = me.data || null;

          if (currentUser) {
            setUser(currentUser);
          }
        }

        const ids = JSON.parse(localStorage.getItem('favorite_webtoons') || '[]') as string[];
        setFavoriteIds(ids);

        if (ids.length === 0) {
          setFavorites([]);
          return;
        }

        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const response = await webtoonApi.getById(id);
              return response.data || null;
            } catch {
              return null;
            }
          })
        );

        setFavorites(results.filter((item): item is Webtoon => Boolean(item)));
      } catch (err) {
        setError(err instanceof Error ? err.message : '즐겨찾기를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [setUser, user]);

  const handleRemove = (id: string) => {
    const nextIds = favoriteIds.filter((favoriteId) => favoriteId !== id);
    localStorage.setItem('favorite_webtoons', JSON.stringify(nextIds));
    setFavoriteIds(nextIds);
    setFavorites((current) => current.filter((webtoon) => webtoon.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-950">내 즐겨찾기</h1>
            <p className="text-gray-600 mt-2">즐겨찾기한 웹툰을 한 곳에서 다시 볼 수 있습니다.</p>
          </div>
          <Link href="/webtoons" className="text-purple-700 font-semibold hover:underline">
            웹툰 둘러보기
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}{' '}
            {error.includes('로그인') && (
              <Link href="/auth/login" className="font-semibold underline">
                로그인하기
              </Link>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {favorites.map((webtoon) => (
              <div key={webtoon.id}>
                <WebtoonCard webtoon={webtoon} />
                <button
                  type="button"
                  onClick={() => handleRemove(webtoon.id)}
                  className="mt-3 w-full border border-gray-300 rounded-md px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition"
                >
                  즐겨찾기 해제
                </button>
              </div>
            ))}
          </div>
        ) : !error ? (
          <div className="text-center py-16 border border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-700 text-lg mb-4">아직 즐겨찾기한 웹툰이 없습니다.</p>
            <Link
              href="/webtoons"
              className="inline-flex bg-purple-600 text-white px-5 py-3 rounded-md font-semibold hover:bg-purple-700 transition"
            >
              웹툰 보러가기
            </Link>
          </div>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}

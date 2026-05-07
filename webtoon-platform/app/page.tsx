'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WebtoonCard from '@/components/webtoon/WebtoonCard';
import { useWebtoonStore } from '@/lib/store';
import { webtoonApi } from '@/lib/api';
import { searchApi } from '@/lib/php-api';
import { Webtoon } from '@/lib/types';

const sessionDismissedNewWebtoonKey = 'session_dismissed_new_webtoon_id';
const hiddenTodayNewWebtoonKey = 'hidden_today_new_webtoon';

export default function Home() {
  const { webtoons, setWebtoons, isLoading, setIsLoading } = useWebtoonStore();
  const [query, setQuery] = useState('');
  const [featuredNewWebtoon, setFeaturedNewWebtoon] = useState<Webtoon | null>(null);

  const latestWebtoon = useMemo(() => {
    return [...webtoons].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }, [webtoons]);

  useEffect(() => {
    const fetchWebtoons = async () => {
      try {
        setIsLoading(true);
        const response = await webtoonApi.getAll();
        if (response.success && response.data) {
          setWebtoons(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch webtoons:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebtoons();
  }, [setWebtoons, setIsLoading]);

  useEffect(() => {
    if (!latestWebtoon || query.trim()) {
      return;
    }

    const sessionDismissedId = sessionStorage.getItem(sessionDismissedNewWebtoonKey);
    const hiddenToday = JSON.parse(localStorage.getItem(hiddenTodayNewWebtoonKey) || 'null') as {
      id?: string;
      expiresAt?: number;
    } | null;
    const isHiddenToday =
      hiddenToday?.id === latestWebtoon.id &&
      typeof hiddenToday.expiresAt === 'number' &&
      hiddenToday.expiresAt > Date.now();

    if (hiddenToday?.expiresAt && hiddenToday.expiresAt <= Date.now()) {
      localStorage.removeItem(hiddenTodayNewWebtoonKey);
    }

    if (sessionDismissedId !== latestWebtoon.id && !isHiddenToday) {
      const timer = window.setTimeout(() => {
        setFeaturedNewWebtoon(latestWebtoon);
      }, 300);

      return () => window.clearTimeout(timer);
    }
  }, [latestWebtoon, query]);

  const closeNewWebtoonPopup = () => {
    if (featuredNewWebtoon) {
      sessionStorage.setItem(sessionDismissedNewWebtoonKey, featuredNewWebtoon.id);
    }

    setFeaturedNewWebtoon(null);
  };

  const hideNewWebtoonForToday = () => {
    if (featuredNewWebtoon) {
      localStorage.setItem(
        hiddenTodayNewWebtoonKey,
        JSON.stringify({
          id: featuredNewWebtoon.id,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        })
      );
    }

    setFeaturedNewWebtoon(null);
  };

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeaturedNewWebtoon(null);

    try {
      setIsLoading(true);
      const response = query.trim()
        ? await searchApi.webtoons({ q: query.trim() })
        : await webtoonApi.getAll();

      if (response.success && response.data) {
        setWebtoons(response.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow">
        <section className="bg-gray-950 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">웹툰 플랫폼</h1>
            <p className="text-lg md:text-xl mb-8 text-gray-300">
              인기 웹툰을 찾고, 에피소드를 읽고, 즐겨찾기로 감상해보세요.
            </p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="제목, 설명, 작가명 검색"
                className="flex-1 px-4 py-3 rounded-md text-white placeholder:text-gray-500"
              />
              <button
                type="submit"
                className="bg-purple-600 px-6 py-3 rounded-md font-semibold hover:bg-purple-700 transition"
              >
                검색
              </button>
            </form>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-950">
              {query.trim() ? '검색 결과' : '인기 웹툰'}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
          ) : webtoons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {webtoons.map((webtoon) => (
                <WebtoonCard key={webtoon.id} webtoon={webtoon} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-600 text-lg">표시할 웹툰이 없습니다.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {featuredNewWebtoon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
            <button
              type="button"
              onClick={closeNewWebtoonPopup}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-gray-900 shadow hover:bg-white"
              aria-label="신작 팝업 닫기"
            >
              닫기
            </button>

            <div className="grid md:grid-cols-[280px_1fr]">
              <div className="bg-gray-100">
                <img
                  src={featuredNewWebtoon.thumbnail}
                  alt={featuredNewWebtoon.title}
                  className="h-80 w-full object-cover md:h-full"
                />
              </div>
              <div className="p-8">
                <p className="text-sm font-bold text-purple-700">NEW RELEASE</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-950">
                  새 신작이 올라왔어요
                </h2>
                <h3 className="mt-4 text-2xl font-bold text-gray-900">
                  {featuredNewWebtoon.title}
                </h3>
                <p className="mt-2 text-sm text-gray-500">작가 {featuredNewWebtoon.author}</p>
                <p className="mt-4 line-clamp-4 text-gray-700">
                  {featuredNewWebtoon.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {featuredNewWebtoon.genre.slice(0, 4).map((genre) => (
                    <span key={genre} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                      {genre}
                    </span>
                  ))}
                </div>
                <div className="mt-8 flex gap-3">
                  <Link
                    href={`/webtoons/${featuredNewWebtoon.id}`}
                    onClick={closeNewWebtoonPopup}
                    className="rounded-md bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700"
                  >
                    지금 보러가기
                  </Link>
                  <button
                    type="button"
                    onClick={hideNewWebtoonForToday}
                    className="rounded-md border border-gray-300 px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50"
                  >
                    오늘 하루 안보기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

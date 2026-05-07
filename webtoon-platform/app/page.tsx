'use client';

import { FormEvent, useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WebtoonCard from '@/components/webtoon/WebtoonCard';
import { useWebtoonStore } from '@/lib/store';
import { webtoonApi } from '@/lib/api';
import { searchApi } from '@/lib/php-api';

export default function Home() {
  const { webtoons, setWebtoons, isLoading, setIsLoading } = useWebtoonStore();
  const [query, setQuery] = useState('');

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

  const handleSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
              인기 웹툰을 찾고, 에피소드를 읽고, 댓글로 감상을 남겨보세요.
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
    </div>
  );
}

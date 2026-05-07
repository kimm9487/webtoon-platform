'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import WebtoonCard from '@/components/webtoon/WebtoonCard';
import { useWebtoonStore } from '@/lib/store';
import { webtoonApi } from '@/lib/api';
import { searchApi } from '@/lib/php-api';

const genres = ['', 'Fantasy', 'Action', 'Adventure', 'School', 'Supernatural'];
const statuses = ['', 'ongoing', 'completed', 'hiatus'];

function WebtoonsContent() {
  const searchParams = useSearchParams();
  const { webtoons, setWebtoons, isLoading, setIsLoading } = useWebtoonStore();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');

  const fetchWebtoons = async (nextQuery = query, nextGenre = genre, nextStatus = status) => {
    try {
      setIsLoading(true);
      const hasFilters = nextQuery.trim() || nextGenre || nextStatus;
      const response = hasFilters
        ? await searchApi.webtoons({
            q: nextQuery.trim() || undefined,
            genre: nextGenre || undefined,
            status: nextStatus || undefined,
          })
        : await webtoonApi.getAll();

      if (response.success && response.data) {
        setWebtoons(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch webtoons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebtoons('', '', searchParams.get('status') || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    fetchWebtoons();
  };

  const handleReset = () => {
    setQuery('');
    setGenre('');
    setStatus('');
    fetchWebtoons('', '', '');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold mb-8 text-gray-950">모든 웹툰</h1>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-8 flex-wrap">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="웹툰 검색"
            className="min-w-64 border border-gray-300 rounded-md px-4 py-2"
          />
          <select
            value={genre}
            onChange={(event) => setGenre(event.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2"
          >
            {genres.map((item) => (
              <option key={item} value={item}>
                {item || '모든 장르'}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2"
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === 'ongoing' ? '연재중' : item === 'completed' ? '완결' : item === 'hiatus' ? '휴재' : '모든 상태'}
              </option>
            ))}
          </select>
          <button type="submit" className="bg-purple-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-purple-700 transition">
            적용
          </button>
          <button type="button" onClick={handleReset} className="border border-gray-300 px-5 py-2 rounded-md font-semibold hover:bg-gray-50 transition">
            초기화
          </button>
        </form>

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
            <p className="text-gray-600 text-lg">검색 결과가 없습니다.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function WebtoonsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col bg-white">
          <Header />
          <main className="flex-grow flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
          </main>
          <Footer />
        </div>
      }
    >
      <WebtoonsContent />
    </Suspense>
  );
}

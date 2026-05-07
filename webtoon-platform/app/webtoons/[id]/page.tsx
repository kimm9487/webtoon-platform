'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useWebtoonStore } from '@/lib/store';
import { webtoonApi, episodeApi } from '@/lib/api';
import { authApi } from '@/lib/php-api';
import {
  migrateLegacyFavoriteIds,
  readFavoriteIds,
  writeFavoriteIds,
  writeFavoriteLastSeenEpisode,
} from '@/lib/favorites';

export default function WebtoonDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { selectedWebtoon, setSelectedWebtoon, isLoading, setIsLoading, episodes, setEpisodes, user, setUser } =
    useWebtoonStore();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteError, setFavoriteError] = useState('');

  useEffect(() => {
    const fetchWebtoon = async () => {
      try {
        setIsLoading(true);
        const response = await webtoonApi.getById(id);
        if (response.success && response.data) {
          setSelectedWebtoon(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch webtoon:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWebtoon();
  }, [id, setSelectedWebtoon, setIsLoading]);

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
    const timer = window.setTimeout(() => {
      if (!user) {
        setIsFavorite(false);
        return;
      }

      const favorites = migrateLegacyFavoriteIds(user.id);
      setIsFavorite(favorites.includes(id));
      setFavoriteError('');
    }, 0);

    return () => window.clearTimeout(timer);
  }, [id, user]);

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const response = await episodeApi.getByWebtoonId(id);
        if (response.success && response.data) {
          setEpisodes(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch episodes:', error);
      }
    };

    if (id) fetchEpisodes();
  }, [id, setEpisodes]);

  const toggleFavorite = () => {
    setFavoriteError('');

    if (!user) {
      setFavoriteError('즐겨찾기는 로그인 후 계정별로 저장됩니다.');
      return;
    }

    const favorites = readFavoriteIds(user.id);
    const isAlreadyFavorite = favorites.includes(id);
    const nextFavorites = isAlreadyFavorite ? favorites.filter((favoriteId) => favoriteId !== id) : [...favorites, id];

    writeFavoriteIds(user.id, nextFavorites);

    if (!isAlreadyFavorite) {
      const latestEpisodeNumber = episodes.reduce(
        (latest, episode) => Math.max(latest, episode.episodeNumber),
        0
      );
      writeFavoriteLastSeenEpisode(user.id, id, latestEpisodeNumber);
    }

    setIsFavorite(nextFavorites.includes(id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!selectedWebtoon) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex justify-center items-center">
          <p className="text-gray-600 text-lg">웹툰을 찾을 수 없습니다.</p>
        </main>
        <Footer />
      </div>
    );
  }

  const statusLabel =
    selectedWebtoon.status === 'ongoing'
      ? '연재중'
      : selectedWebtoon.status === 'completed'
        ? '완결'
        : '휴재';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <img
              src={selectedWebtoon.thumbnail}
              alt={selectedWebtoon.title}
              className="w-full rounded-lg shadow-sm border border-gray-200"
            />
          </div>

          <div className="md:col-span-2">
            <h1 className="text-4xl font-bold mb-4 text-gray-950">{selectedWebtoon.title}</h1>
            <p className="text-lg text-gray-600 mb-2">작가: {selectedWebtoon.author}</p>
            <p className="text-lg text-gray-700 mb-5">{selectedWebtoon.description}</p>

            <div className="flex gap-2 mb-6 flex-wrap">
              {selectedWebtoon.genre.map((genre) => (
                <span
                  key={genre}
                  className="bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold"
                >
                  {genre}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">평점</p>
                <p className="text-3xl font-bold text-purple-600">{selectedWebtoon.rating}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">조회수</p>
                <p className="text-2xl font-bold">{(selectedWebtoon.views / 1000000).toFixed(1)}M</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">상태</p>
                <p className="text-xl font-bold">{statusLabel}</p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              {episodes[0] && (
                <Link
                  href={`/episodes/${episodes[0].id}`}
                  className="bg-purple-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-purple-700 transition"
                >
                  첫 화 보기
                </Link>
              )}
              <button
                type="button"
                onClick={toggleFavorite}
                className="border border-gray-300 px-6 py-3 rounded-md font-semibold hover:bg-gray-50 transition"
              >
                {isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}
              </button>
              {isFavorite && (
                <Link
                  href="/favorites"
                  className="border border-purple-200 text-purple-700 px-6 py-3 rounded-md font-semibold hover:bg-purple-50 transition"
                >
                  내 즐겨찾기 보기
                </Link>
              )}
            </div>
            {favoriteError && <p className="text-sm text-red-600 mt-3">{favoriteError}</p>}
          </div>
        </div>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-950">에피소드</h2>
          {episodes.length > 0 ? (
            <div className="space-y-2">
              {episodes.map((episode) => (
                <Link
                  href={`/episodes/${episode.id}`}
                  key={episode.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 rounded-lg transition border border-gray-100"
                >
                  <img
                    src={episode.images[0]}
                    alt={episode.title}
                    className="w-16 h-20 object-cover rounded bg-gray-200"
                  />
                  <div className="flex-grow">
                    <p className="font-semibold">
                      {episode.episodeNumber}화 {episode.title}
                    </p>
                    <p className="text-gray-600 text-sm">{episode.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">조회 {(episode.views / 1000).toFixed(0)}K</p>
                    <p className="text-sm text-gray-600">좋아요 {episode.likes}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">등록된 에피소드가 없습니다.</p>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

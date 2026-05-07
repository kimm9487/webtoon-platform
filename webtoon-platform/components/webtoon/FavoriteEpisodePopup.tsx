'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { episodeApi, webtoonApi } from '@/lib/api';
import { authApi } from '@/lib/php-api';
import {
  addFavoriteNotification,
  migrateLegacyFavoriteIds,
  readFavoriteLastSeenEpisode,
  writeFavoriteLastSeenEpisode,
} from '@/lib/favorites';
import { useWebtoonStore } from '@/lib/store';
import { Episode, Webtoon } from '@/lib/types';

interface FavoriteEpisodeAlert {
  webtoon: Webtoon;
  episode: Episode;
}

const sessionDismissedFavoriteEpisodeKey = 'session_dismissed_favorite_episode_id';

export default function FavoriteEpisodePopup() {
  const { user, setUser } = useWebtoonStore();
  const [alert, setAlert] = useState<FavoriteEpisodeAlert | null>(null);

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

    let isCancelled = false;

    const checkFavoriteEpisodes = async () => {
      const favoriteIds = migrateLegacyFavoriteIds(user.id);

      if (favoriteIds.length === 0) {
        setAlert(null);
        return;
      }

      const webtoonResponse = await webtoonApi.getAll();
      const webtoons = webtoonResponse.data || [];
      const favoriteSet = new Set(favoriteIds);
      const favoriteWebtoons = webtoons.filter((webtoon) => favoriteSet.has(webtoon.id));

      for (const webtoon of favoriteWebtoons) {
        const episodeResponse = await episodeApi.getByWebtoonId(webtoon.id);
        const episodes = episodeResponse.data || [];
        const latestEpisode = [...episodes].sort((a, b) => b.episodeNumber - a.episodeNumber)[0];

        if (!latestEpisode) {
          continue;
        }

        const lastSeenEpisode = readFavoriteLastSeenEpisode(user.id, webtoon.id);

        if (lastSeenEpisode === null) {
          writeFavoriteLastSeenEpisode(user.id, webtoon.id, latestEpisode.episodeNumber);
          continue;
        }

        const dismissedEpisodeId = sessionStorage.getItem(sessionDismissedFavoriteEpisodeKey);

        if (latestEpisode.episodeNumber > lastSeenEpisode && dismissedEpisodeId !== latestEpisode.id) {
          addFavoriteNotification(user.id, {
            webtoonId: webtoon.id,
            webtoonTitle: webtoon.title,
            episodeId: latestEpisode.id,
            episodeNumber: latestEpisode.episodeNumber,
            episodeTitle: latestEpisode.title,
          });

          if (!isCancelled) {
            setAlert({ webtoon, episode: latestEpisode });
          }
          return;
        }
      }

      if (!isCancelled) {
        setAlert(null);
      }
    };

    const timer = window.setTimeout(() => {
      checkFavoriteEpisodes().catch((error) => {
        console.error('Failed to check favorite episode updates:', error);
      });
    }, 500);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [user]);

  if (!alert || !user) {
    return null;
  }

  const closePopup = () => {
    sessionStorage.setItem(sessionDismissedFavoriteEpisodeKey, alert.episode.id);
    writeFavoriteLastSeenEpisode(user.id, alert.webtoon.id, alert.episode.episodeNumber);
    setAlert(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <button
          type="button"
          onClick={closePopup}
          className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-gray-900 shadow hover:bg-white"
          aria-label="새 에피소드 알림 닫기"
        >
          닫기
        </button>

        <div className="grid md:grid-cols-[220px_1fr]">
          <div className="bg-gray-100">
            <img
              src={alert.webtoon.thumbnail}
              alt={alert.webtoon.title}
              className="h-72 w-full object-cover md:h-full"
            />
          </div>
          <div className="p-7">
            <p className="text-sm font-bold text-purple-700">FAVORITE UPDATE</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-950">즐겨찾기한 웹툰에 새 에피소드가 올라왔어요</h2>
            <h3 className="mt-4 text-xl font-bold text-gray-900">{alert.webtoon.title}</h3>
            <p className="mt-2 text-gray-700">
              {alert.episode.episodeNumber}화 · {alert.episode.title}
            </p>
            {alert.episode.description && (
              <p className="mt-3 line-clamp-3 text-sm text-gray-600">{alert.episode.description}</p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href={`/episodes/${alert.episode.id}`}
                onClick={closePopup}
                className="rounded-md bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700"
              >
                새 에피소드 보기
              </Link>
              <button
                type="button"
                onClick={closePopup}
                className="rounded-md border border-gray-300 px-5 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50"
              >
                나중에 볼게요
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

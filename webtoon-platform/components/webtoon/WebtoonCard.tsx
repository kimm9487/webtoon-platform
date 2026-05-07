'use client';

import Link from 'next/link';
import { Webtoon } from '@/lib/types';

interface WebtoonCardProps {
  webtoon: Webtoon;
}

export default function WebtoonCard({ webtoon }: WebtoonCardProps) {
  const statusLabel =
    webtoon.status === 'ongoing' ? '연재중' : webtoon.status === 'completed' ? '완결' : '휴재';

  return (
    <Link href={`/webtoons/${webtoon.id}`} className="group block">
      <div className="relative overflow-hidden rounded-lg shadow-sm mb-4 aspect-[3/4] bg-gray-200">
        <img
          src={webtoon.thumbnail}
          alt={webtoon.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
        <div className="absolute top-2 right-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
              webtoon.status === 'ongoing'
                ? 'bg-red-500'
                : webtoon.status === 'completed'
                  ? 'bg-green-600'
                  : 'bg-yellow-600'
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      <h3 className="font-bold text-lg mb-1 truncate group-hover:text-purple-700 transition">
        {webtoon.title}
      </h3>
      <p className="text-gray-600 text-sm mb-2 truncate">{webtoon.author}</p>

      <div className="flex gap-1 mb-2 flex-wrap">
        {webtoon.genre.slice(0, 2).map((genre) => (
          <span key={genre} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            {genre}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600">
        <span className="font-semibold">평점 {webtoon.rating}</span>
        <span className="text-xs">{(webtoon.views / 1000000).toFixed(1)}M 조회</span>
      </div>
    </Link>
  );
}

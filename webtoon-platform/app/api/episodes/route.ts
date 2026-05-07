import { NextResponse } from 'next/server';
import { ApiResponse, Episode } from '@/lib/types';
import { prisma } from '@/lib/prisma';
import { signedMediaUrl } from '@/lib/server-media-url';

function formatEpisode(episode: {
  id: string;
  webtoonId: string;
  episodeNumber: number;
  title: string;
  description: string | null;
  images: unknown;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}): Episode {
  return {
    id: episode.id,
    webtoonId: episode.webtoonId,
    episodeNumber: episode.episodeNumber,
    title: episode.title,
    description: episode.description ?? '',
    images: Array.isArray(episode.images) ? episode.images.map((image) => signedMediaUrl(String(image))) : [],
    views: episode.views,
    likes: episode.likes,
    createdAt: episode.createdAt.toISOString().split('T')[0],
    updatedAt: episode.updatedAt.toISOString().split('T')[0],
  };
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<Episode[]>>> {
  try {
    const { searchParams } = new URL(request.url);
    const webtoonId = searchParams.get('webtoonId');

    if (!webtoonId) {
      return NextResponse.json(
        {
          success: false,
          error: 'webtoonId is required.',
        },
        { status: 400 }
      );
    }

    const episodes = await prisma.episode.findMany({
      where: { webtoonId },
      orderBy: {
        episodeNumber: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: episodes.map(formatEpisode),
      message: 'Episodes fetched.',
    });
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch episodes.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Episode>>> {
  try {
    const body = await request.json();

    if (!body.webtoonId || !body.episodeNumber || !body.title) {
      return NextResponse.json(
        {
          success: false,
          error: 'webtoonId, episodeNumber, and title are required.',
        },
        { status: 400 }
      );
    }

    const episode = await prisma.episode.create({
      data: {
        webtoonId: body.webtoonId,
        episodeNumber: body.episodeNumber,
        title: body.title,
        description: body.description,
        images: Array.isArray(body.images) ? body.images : [],
        views: body.views ?? 0,
        likes: body.likes ?? 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: formatEpisode(episode),
        message: 'Episode created.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating episode:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create episode.',
      },
      { status: 500 }
    );
  }
}

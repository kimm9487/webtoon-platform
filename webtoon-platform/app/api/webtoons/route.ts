import { NextResponse } from 'next/server';
import { ApiResponse, Webtoon } from '@/lib/types';
import { prisma } from '@/lib/prisma';

function formatWebtoon(webtoon: {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  genre: unknown;
  status: string;
  rating: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
  author: {
    user: {
      username: string;
    };
  };
}): Webtoon {
  return {
    id: webtoon.id,
    title: webtoon.title,
    author: webtoon.author.user.username,
    description: webtoon.description,
    thumbnail: webtoon.thumbnail,
    genre: Array.isArray(webtoon.genre) ? webtoon.genre.map(String) : [],
    status: webtoon.status.toLowerCase() as Webtoon['status'],
    rating: webtoon.rating,
    views: webtoon.views,
    createdAt: webtoon.createdAt.toISOString().split('T')[0],
    updatedAt: webtoon.updatedAt.toISOString().split('T')[0],
  };
}

export async function GET(): Promise<NextResponse<ApiResponse<Webtoon[]>>> {
  try {
    const webtoons = await prisma.webtoon.findMany({
      include: {
        author: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: webtoons.map(formatWebtoon),
      message: 'Webtoons fetched.',
    });
  } catch (error) {
    console.error('Error fetching webtoons:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch webtoons.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Webtoon>>> {
  try {
    const body = await request.json();

    if (!body.authorId || !body.title || !body.description || !body.thumbnail) {
      return NextResponse.json(
        {
          success: false,
          error: 'authorId, title, description, and thumbnail are required.',
        },
        { status: 400 }
      );
    }

    const webtoon = await prisma.webtoon.create({
      data: {
        title: body.title,
        authorId: body.authorId,
        description: body.description,
        thumbnail: body.thumbnail,
        genre: Array.isArray(body.genre) ? body.genre : [],
        status: body.status?.toUpperCase() ?? 'ONGOING',
        rating: body.rating ?? 0,
        views: body.views ?? 0,
      },
      include: {
        author: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: formatWebtoon(webtoon),
        message: 'Webtoon created.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating webtoon:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create webtoon.',
      },
      { status: 500 }
    );
  }
}

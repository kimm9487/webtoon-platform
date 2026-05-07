import { NextResponse } from 'next/server';
import { ApiResponse, Webtoon } from '@/lib/types';
import { prisma } from '@/lib/prisma';
import { signedMediaUrl } from '@/lib/server-media-url';

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
    thumbnail: signedMediaUrl(webtoon.thumbnail),
    genre: Array.isArray(webtoon.genre) ? webtoon.genre.map(String) : [],
    status: webtoon.status.toLowerCase() as Webtoon['status'],
    rating: webtoon.rating,
    views: webtoon.views,
    createdAt: webtoon.createdAt.toISOString().split('T')[0],
    updatedAt: webtoon.updatedAt.toISOString().split('T')[0],
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Webtoon>>> {
  try {
    const { id } = await params;
    const webtoon = await prisma.webtoon.findUnique({
      where: { id },
      include: {
        author: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!webtoon) {
      return NextResponse.json(
        {
          success: false,
          error: 'Webtoon not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatWebtoon(webtoon),
      message: 'Webtoon fetched.',
    });
  } catch (error) {
    console.error('Error fetching webtoon:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch webtoon.',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Webtoon>>> {
  try {
    const { id } = await params;
    const body = await request.json();

    const webtoon = await prisma.webtoon.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        thumbnail: body.thumbnail,
        genre: Array.isArray(body.genre) ? body.genre : undefined,
        status: body.status?.toUpperCase(),
        rating: body.rating,
        views: body.views,
      },
      include: {
        author: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: formatWebtoon(webtoon),
      message: 'Webtoon updated.',
    });
  } catch (error) {
    console.error('Error updating webtoon:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update webtoon.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<void>>> {
  try {
    const { id } = await params;

    await prisma.webtoon.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Webtoon deleted.',
    });
  } catch (error) {
    console.error('Error deleting webtoon:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete webtoon.',
      },
      { status: 500 }
    );
  }
}

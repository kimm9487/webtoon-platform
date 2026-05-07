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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Episode>>> {
  try {
    const { id } = await params;
    const episode = await prisma.episode.findUnique({
      where: { id },
    });

    if (!episode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Episode not found.',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formatEpisode(episode),
      message: 'Episode fetched.',
    });
  } catch (error) {
    console.error('Error fetching episode:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch episode.',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Episode>>> {
  try {
    const { id } = await params;
    const body = await request.json();

    const episode = await prisma.episode.update({
      where: { id },
      data: {
        episodeNumber: body.episodeNumber,
        title: body.title,
        description: body.description,
        images: Array.isArray(body.images) ? body.images : undefined,
        views: body.views,
        likes: body.likes,
      },
    });

    return NextResponse.json({
      success: true,
      data: formatEpisode(episode),
      message: 'Episode updated.',
    });
  } catch (error) {
    console.error('Error updating episode:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update episode.',
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

    await prisma.episode.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Episode deleted.',
    });
  } catch (error) {
    console.error('Error deleting episode:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete episode.',
      },
      { status: 500 }
    );
  }
}

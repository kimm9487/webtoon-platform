import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bearerTokenFromRequest, verifyAuthToken } from '@/lib/server-auth';
import { signedMediaUrl } from '@/lib/server-media-url';
import { ApiResponse, Episode } from '@/lib/types';

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

function likeId() {
  return `epl_${crypto.randomUUID().replace(/-/g, '')}`;
}

async function refreshEpisodeLikeCount(episodeId: string) {
  await prisma.$executeRawUnsafe(
    `UPDATE episodes
     SET likes = (
       SELECT COUNT(*)
       FROM episode_likes
       WHERE episodeId = ?
     )
     WHERE id = ?`,
    episodeId,
    episodeId
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ liked: boolean }>>> {
  try {
    const auth = verifyAuthToken(bearerTokenFromRequest(request));

    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id
       FROM episode_likes
       WHERE userId = ? AND episodeId = ?
       LIMIT 1`,
      auth.sub,
      id
    );

    return NextResponse.json({
      success: true,
      data: {
        liked: rows.length > 0,
      },
    });
  } catch (error) {
    console.error('Error fetching episode like:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch episode like.',
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Episode>>> {
  try {
    const auth = verifyAuthToken(bearerTokenFromRequest(request));

    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const liked = Boolean(body.liked);
    const current = await prisma.episode.findUnique({ where: { id } });

    if (!current) {
      return NextResponse.json({ success: false, error: 'Episode not found.' }, { status: 404 });
    }

    if (liked) {
      await prisma.$executeRawUnsafe(
        `INSERT IGNORE INTO episode_likes (id, userId, episodeId, createdAt)
         VALUES (?, ?, ?, NOW(3))`,
        likeId(),
        auth.sub,
        id
      );
    } else {
      await prisma.$executeRawUnsafe(
        `DELETE FROM episode_likes
         WHERE userId = ? AND episodeId = ?`,
        auth.sub,
        id
      );
    }

    await refreshEpisodeLikeCount(id);

    const episode = await prisma.episode.findUnique({ where: { id } });

    if (!episode) {
      return NextResponse.json({ success: false, error: 'Episode not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: formatEpisode(episode),
      message: liked ? 'Episode liked.' : 'Episode unliked.',
    });
  } catch (error) {
    console.error('Error updating episode like:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update episode like.',
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { ensureVectorDb } from '@/lib/rag/vectorDb';

export async function POST() {
  try {
    const db = await ensureVectorDb();

    return NextResponse.json({
      success: true,
      data: {
        embedModel: db.embedModel,
        records: db.records.length,
      },
      message: 'VectorDB reindexed.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';

    return NextResponse.json(
      {
        success: false,
        error:
          `VectorDB 인덱싱에 실패했습니다. ` +
          `Ollama를 사용한다면 "ollama pull ${process.env.LOCAL_EMBED_MODEL || 'nomic-embed-text'}" 후 다시 시도하세요. ` +
          `상세: ${message}`,
      },
      { status: 503 }
    );
  }
}

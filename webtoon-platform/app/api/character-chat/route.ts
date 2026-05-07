import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { NextResponse } from 'next/server';
import { getCharacterById } from '@/lib/characterPresets';
import { prisma } from '@/lib/prisma';
import { bearerTokenFromRequest, verifyAuthToken } from '@/lib/server-auth';
import { formatRagContext, retrieveCharacterKnowledge } from '@/lib/rag/vectorDb';

type StoredChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sequence: number;
  createdAt: Date | string;
};

const defaultLocalBaseUrl = 'http://localhost:11434/v1';
const defaultLocalModel = 'exaone3.5:2.4b';

function id(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

function requireUser(request: Request) {
  return verifyAuthToken(bearerTokenFromRequest(request));
}

function authError() {
  return NextResponse.json(
    {
      success: false,
      error: '로그인이 필요합니다.',
    },
    { status: 401 }
  );
}

function needsKoreanRewrite(content: string) {
  return /[A-Za-z\u00C0-\u024F\u0400-\u04FF\u4E00-\u9FFF]/.test(content);
}

function breaksCharacterImmersion(content: string) {
  return /(인공지능|AI|언어\s*모델|챗봇|가상\s*캐릭터|캐릭터인|역할극|연기|애니메이션\s*속|작품\s*속|설정상|도움이\s*필요하신가요|무엇을\s*도와드릴까요)/i.test(
    content
  );
}

export async function GET(request: Request) {
  const payload = requireUser(request);

  if (!payload) {
    return authError();
  }

  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get('characterId') || '';

  if (!characterId) {
    return NextResponse.json(
      {
        success: false,
        error: 'characterId가 필요합니다.',
      },
      { status: 400 }
    );
  }

  const messages = await prisma.$queryRawUnsafe<StoredChatMessage[]>(
    `SELECT id, role, content, sequence, createdAt
     FROM character_chat_messages
     WHERE userId = ? AND characterId = ?
     ORDER BY sequence ASC, createdAt ASC`,
    payload.sub,
    characterId
  );

  return NextResponse.json({
    success: true,
    data: messages
      .filter((message) => {
        return message.role !== 'assistant' || !breaksCharacterImmersion(message.content);
      })
      .map((message) => ({
        ...message,
        createdAt:
          message.createdAt instanceof Date
            ? message.createdAt.toISOString()
            : message.createdAt,
      })),
  });
}

export async function DELETE(request: Request) {
  const payload = requireUser(request);

  if (!payload) {
    return authError();
  }

  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get('characterId') || '';

  if (!characterId) {
    return NextResponse.json(
      {
        success: false,
        error: 'characterId가 필요합니다.',
      },
      { status: 400 }
    );
  }

  const character = getCharacterById(characterId);

  if (!character) {
    return NextResponse.json(
      {
        success: false,
        error: `캐릭터 "${characterId}"를 찾을 수 없습니다.`,
      },
      { status: 404 }
    );
  }

  await prisma.$executeRawUnsafe(
    `DELETE FROM character_chat_messages
     WHERE userId = ? AND characterId = ?`,
    payload.sub,
    characterId
  );

  return NextResponse.json({
    success: true,
    data: {
      characterId,
    },
    message: '대화 기록을 삭제했습니다.',
  });
}

export async function POST(request: Request) {
  try {
    const payload = requireUser(request);

    if (!payload) {
      return authError();
    }

    const body = await request.json();
    const characterId = String(body.characterId || '').trim();
    const userMessage = String(body.message || '').trim();

    if (!characterId || !userMessage) {
      return NextResponse.json(
        {
          success: false,
          error: 'characterId와 message가 필요합니다.',
        },
        { status: 400 }
      );
    }

    const character = getCharacterById(characterId);

    if (!character) {
      return NextResponse.json(
        {
          success: false,
          error: `캐릭터 "${characterId}"를 찾을 수 없습니다.`,
        },
        { status: 404 }
      );
    }

    const baseURL = process.env.LOCAL_LLM_BASE_URL || defaultLocalBaseUrl;
    const apiKey = process.env.LOCAL_LLM_API_KEY || 'local-llm';
    const modelName = process.env.LOCAL_LLM_MODEL || defaultLocalModel;

    try {
      const health = await fetch(`${baseURL.replace(/\/$/, '')}/models`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        signal: AbortSignal.timeout(3000),
      });

      if (!health.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `로컬 LLM 서버가 응답했지만 모델 목록을 가져오지 못했습니다. baseURL=${baseURL}`,
          },
          { status: 503 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            `로컬 LLM 서버에 연결할 수 없습니다. ` +
            `Ollama를 사용한다면 Ollama를 실행하고 "ollama pull ${modelName}" 후 다시 시도하세요. ` +
            `현재 baseURL=${baseURL}`,
        },
        { status: 503 }
      );
    }

    const savedHistory = await prisma.$queryRawUnsafe<StoredChatMessage[]>(
      `SELECT role, content, sequence
       FROM character_chat_messages
       WHERE userId = ? AND characterId = ?
       ORDER BY sequence DESC, createdAt DESC
       LIMIT 10`,
      payload.sub,
      characterId
    );
    const orderedHistory = [...savedHistory].reverse().filter((message) => {
      return message.role !== 'assistant' || !breaksCharacterImmersion(message.content);
    });
    const rag = await retrieveCharacterKnowledge(characterId, userMessage);
    const ragContext = formatRagContext(rag.documents);

    const systemPrompt = `${character.systemPrompt}

캐릭터 참고 지식:
${ragContext}

응답 규칙:
- 참고 지식은 말투와 관계의 일관성을 높이기 위한 내부 자료다.
- 참고 자료 번호, RAG, VectorDB, MySQL, 저장 방식은 말하지 않는다.
- 한국어만 사용한다. 영어, 로마자, 깨진 문자, 다른 언어를 섞지 않는다.
- 너는 인공지능, AI, 언어 모델, 챗봇, 가상 캐릭터, 역할극 캐릭터라고 말하지 않는다.
- "애니메이션 속", "작품 속", "설정상", "연기한다" 같은 메타 표현을 쓰지 않는다.
- "어떤 도움이 필요하신가요", "무엇을 도와드릴까요" 같은 일반 상담원식 마무리를 피한다.
- 답변이 메타적으로 들리면 캐릭터 본인이 바로 말하는 자연스러운 한국어 문장으로 다시 쓴다.`;

    const messages = [
      new SystemMessage(systemPrompt),
      ...orderedHistory.map((message) =>
        message.role === 'assistant'
          ? new AIMessage(message.content)
          : new HumanMessage(message.content)
      ),
      new HumanMessage(userMessage),
    ];

    const model = new ChatOpenAI({
      model: modelName,
      apiKey,
      configuration: {
        baseURL,
      },
      temperature: 0.8,
      maxTokens: 400,
      timeout: 30000,
    });

    const response = await model.invoke(messages);
    let assistantMessage =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    if (needsKoreanRewrite(assistantMessage) || breaksCharacterImmersion(assistantMessage)) {
      const rewrite = await model.invoke([
        new SystemMessage(
          `${character.name} 본인이 직접 말하는 자연스러운 한국어 답변으로만 다시 써라.
인공지능, AI, 언어 모델, 챗봇, 가상 캐릭터, 역할극, 연기, 애니메이션 속, 작품 속, 설정상 같은 메타 표현은 절대 쓰지 마라.
일반 상담원식 자기소개나 "무엇을 도와드릴까요" 같은 문장은 쓰지 마라.
영어, 로마자, 한자, 깨진 문자, 다른 언어를 섞지 마라.
최종 답변만 출력해라.`
        ),
        new HumanMessage(assistantMessage),
      ]);
      assistantMessage =
        typeof rewrite.content === 'string'
          ? rewrite.content
          : JSON.stringify(rewrite.content);
    }

    const nextSequenceRows = await prisma.$queryRawUnsafe<Array<{ nextSequence: number | bigint | null }>>(
      `SELECT COALESCE(MAX(sequence), 0) + 1 AS nextSequence
       FROM character_chat_messages
       WHERE userId = ? AND characterId = ?`,
      payload.sub,
      characterId
    );
    const nextSequence = Number(nextSequenceRows[0]?.nextSequence || 1);

    await prisma.$executeRawUnsafe(
      `INSERT INTO character_chat_messages (id, userId, characterId, role, content, sequence, createdAt)
       VALUES (?, ?, ?, 'user', ?, ?, NOW(3)), (?, ?, ?, 'assistant', ?, ?, NOW(3))`,
      id('ccm'),
      payload.sub,
      characterId,
      userMessage,
      nextSequence,
      id('ccm'),
      payload.sub,
      characterId,
      assistantMessage,
      nextSequence + 1
    );

    return NextResponse.json({
      success: true,
      data: {
        message: assistantMessage,
        characterName: character.name,
        series: character.series,
        avatar: character.avatar,
        provider: 'local',
        model: modelName,
        ragMode: rag.mode,
        ragDocuments: rag.documents.map((document) => ({
          id: document.id,
          title: document.title,
        })),
      },
    });
  } catch (error: unknown) {
    console.error('Character chat failed:', error);

    const message = error instanceof Error ? error.message : '알 수 없는 오류';

    return NextResponse.json(
      {
        success: false,
        error: `캐릭터 채팅 응답 생성에 실패했습니다. 상세: ${message}`,
      },
      { status: 500 }
    );
  }
}

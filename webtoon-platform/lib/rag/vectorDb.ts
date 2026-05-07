import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { characterKnowledgeDocuments, CharacterKnowledgeDocument } from './characterKnowledge';

type VectorRecord = CharacterKnowledgeDocument & {
  embedding: number[];
};

type VectorDbFile = {
  embedModel: string;
  sourceHash?: string;
  records: VectorRecord[];
};

export type RagResult = {
  documents: CharacterKnowledgeDocument[];
  mode: 'vector' | 'keyword';
};

const dataPath = path.join(process.cwd(), 'data', 'vector-db.json');
const defaultEmbedModel = 'nomic-embed-text';

function ollamaRootUrl() {
  const baseUrl = process.env.LOCAL_LLM_BASE_URL || 'http://localhost:11434/v1';
  return baseUrl.replace(/\/v1\/?$/, '').replace(/\/$/, '');
}

function embedModel() {
  return process.env.LOCAL_EMBED_MODEL || defaultEmbedModel;
}

function sourceHash() {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(characterKnowledgeDocuments))
    .digest('hex');
}

async function embed(text: string): Promise<number[]> {
  const response = await fetch(`${ollamaRootUrl()}/api/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: embedModel(),
      prompt: text,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Embedding request failed: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.embedding)) {
    throw new Error('Embedding response did not include an embedding array.');
  }

  return data.embedding;
}

async function readVectorDb(): Promise<VectorDbFile | null> {
  try {
    const raw = await fs.readFile(dataPath, 'utf8');
    return JSON.parse(raw) as VectorDbFile;
  } catch {
    return null;
  }
}

async function writeVectorDb(db: VectorDbFile) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(db, null, 2), 'utf8');
}

export async function ensureVectorDb() {
  const current = await readVectorDb();
  const model = embedModel();
  const hash = sourceHash();

  if (
    current?.embedModel === model &&
    current.sourceHash === hash &&
    current.records.length === characterKnowledgeDocuments.length
  ) {
    return current;
  }

  const records: VectorRecord[] = [];

  for (const document of characterKnowledgeDocuments) {
    records.push({
      ...document,
      embedding: await embed(`${document.title}\n${document.content}`),
    });
  }

  const db = {
    embedModel: model,
    sourceHash: hash,
    records,
  };
  await writeVectorDb(db);
  return db;
}

function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function keywordRetrieve(characterId: string, query: string, limit: number) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

  return characterKnowledgeDocuments
    .filter((document) => document.characterId === characterId)
    .map((document) => {
      const haystack = `${document.title} ${document.content}`.toLowerCase();
      const score = terms.reduce((total, term) => total + (haystack.includes(term) ? 1 : 0), 0);
      return { document, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.document);
}

export async function retrieveCharacterKnowledge(
  characterId: string,
  query: string,
  limit = 3
): Promise<RagResult> {
  try {
    const db = await ensureVectorDb();
    const queryEmbedding = await embed(query);
    const documents = db.records
      .filter((record) => record.characterId === characterId)
      .map((record) => ({
        record,
        score: cosineSimilarity(queryEmbedding, record.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => ({
        id: item.record.id,
        characterId: item.record.characterId,
        title: item.record.title,
        content: item.record.content,
      }));

    return {
      documents,
      mode: 'vector',
    };
  } catch {
    return {
      documents: keywordRetrieve(characterId, query, limit),
      mode: 'keyword',
    };
  }
}

export function formatRagContext(documents: CharacterKnowledgeDocument[]) {
  if (documents.length === 0) {
    return '추가로 검색된 캐릭터 지식이 없음.';
  }

  return documents
    .map((document, index) => `[${index + 1}] ${document.title}\n${document.content}`)
    .join('\n\n');
}

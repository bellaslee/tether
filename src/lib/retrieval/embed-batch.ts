import 'server-only';

import type OpenAI from 'openai';
import { PRM_EMBEDDING_DIMENSIONS, PRM_EMBEDDING_MODEL } from '@/lib/ai/embedding-model';

export async function embedTextsWithOpenAi(
  openai: OpenAI,
  inputs: string[],
): Promise<number[][]> {
  if (inputs.length === 0) {
    return [];
  }
  const res = await openai.embeddings.create({
    model: PRM_EMBEDDING_MODEL,
    input: inputs,
  });
  const byIndex = new Map<number, number[]>();
  for (const item of res.data) {
    const v = item.embedding;
    if (!Array.isArray(v) || v.length !== PRM_EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Unexpected embedding length ${Array.isArray(v) ? v.length : 0}; expected ${PRM_EMBEDDING_DIMENSIONS}.`,
      );
    }
    byIndex.set(item.index, v as number[]);
  }
  return inputs.map((_, i) => {
    const row = byIndex.get(i);
    if (!row) {
      throw new Error('Missing embedding index from OpenAI.');
    }
    return row;
  });
}

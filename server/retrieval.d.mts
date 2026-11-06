export interface Chunk { id: string; type: string; title: string; text: string; tags?: string[] }
export interface Hits { public: Chunk[]; experts: Chunk[] }

export function normalize(s: unknown): string;
export function queryTokens(query: string): string[];
export function scoreChunk(chunk: Chunk, query: string, tokens?: string[]): number;
export function snippet(text: string, query: string, len?: number): string;
export function pickCard(publicChunks: Chunk[], id: unknown): Chunk | null;
export function retrieve(
  query: string,
  chunks: { publicChunks: Chunk[]; expertChunks: Chunk[] },
  opts?: { publicLimit?: number; expertLimit?: number },
): Hits;

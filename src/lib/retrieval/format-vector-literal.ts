/** Format a float array for pgvector columns / RPC parameters with PostgREST. */
export function formatVectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`;
}

/**
 * Lightweight validation for IPC/API responses at system boundaries.
 * Per Rule 5: Validate inputs/outputs at system boundaries (IPC, API, DB).
 */

export function validateApiResponse<T>(
  data: unknown,
  context: string,
  requiredFields: string[],
): T {
  if (data === null || data === undefined) {
    throw new Error(`[${context}] Received null/undefined response`);
  }

  if (typeof data !== "object") {
    throw new Error(
      `[${context}] Expected object response, got ${typeof data}`,
    );
  }

  const record = data as Record<string, unknown>;
  for (const field of requiredFields) {
    if (!(field in record)) {
      throw new Error(`[${context}] Missing required field: ${field}`);
    }
  }

  return data as T;
}

export function validateApiArray<T>(data: unknown, context: string): T[] {
  if (data === null || data === undefined) {
    throw new Error(`[${context}] Received null/undefined response`);
  }

  if (!Array.isArray(data)) {
    throw new Error(`[${context}] Expected array response, got ${typeof data}`);
  }

  return data as T[];
}

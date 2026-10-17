import { vi } from "vitest";

// Records the PostgREST query contract without pretending to implement SQL/RLS.
export function database() {
  const queries: ReturnType<typeof query>[] = [];
  function query(result: {
    data?: unknown;
    error?: unknown;
    count?: number | null;
  }) {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve({ data: null, error: null, ...result }).then(resolve),
    };

    return builder;
  }
  const from = vi.fn();
  return {
    from,
    queries,
    enqueue(
      table: string,
      result: { data?: unknown; error?: unknown; count?: number | null },
    ) {
      const builder = query(result);
      queries.push(builder);
      from.mockImplementationOnce((actual: string) => {
        if (actual !== table)
          throw new Error(`Expected ${table}, received ${actual}`);
        return builder;
      });
      return builder;
    },
  };
}

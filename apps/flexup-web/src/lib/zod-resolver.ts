import type { Resolver, FieldError } from 'react-hook-form';

interface ZodIssue {
  path: (string | number)[];
  code: string;
  message: string;
}

// Structural interface satisfied by both Zod v3 and v4
interface ZodLike<T> {
  safeParseAsync(data: unknown): Promise<
    | { success: true; data: T }
    | { success: false; error: { issues: ZodIssue[] } }
  >;
}

function buildErrors(issues: ZodIssue[]): Record<string, FieldError> {
  const errors: Record<string, unknown> = {};

  for (const issue of issues) {
    if (issue.path.length === 0) continue;

    let node = errors;
    for (let i = 0; i < issue.path.length - 1; i++) {
      const key = String(issue.path[i]);
      if (!node[key] || typeof node[key] !== 'object') {
        node[key] = {};
      }
      node = node[key] as Record<string, unknown>;
    }
    const leaf = String(issue.path[issue.path.length - 1]);
    if (!node[leaf]) {
      node[leaf] = { type: issue.code, message: issue.message };
    }
  }

  return errors as Record<string, FieldError>;
}

// Drop-in replacement for zodResolver that works with Zod v3 and v4
export function zodResolver<T extends Record<string, unknown>>(
  schema: ZodLike<T>,
): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) {
      return { values: result.data as T, errors: {} };
    }
    return { values: {} as T, errors: buildErrors(result.error.issues) };
  };
}

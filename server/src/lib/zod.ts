import { z } from "zod";

/**
 * `.partial()` for update payloads WITHOUT applying field defaults.
 * (Zod 4 applies defaults inside optional fields, which would silently reset
 * columns such as `status` on every partial update.)
 */
export function partialUpdate<T extends z.ZodObject>(schema: T): ReturnType<T["partial"]> {
  const shape: Record<string, z.ZodType> = {};
  for (const [k, v] of Object.entries(schema.shape)) {
    const inner = v instanceof z.ZodDefault ? (v.unwrap() as z.ZodType) : (v as z.ZodType);
    shape[k] = inner.optional();
  }
  return z.object(shape) as unknown as ReturnType<T["partial"]>;
}

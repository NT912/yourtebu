/**
 * Zod validation helper for route handlers
 */
export function validateResponse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn('[Validator] Schema warning:', result.error.format());
    // Return original data as fallback if validation has non-fatal warnings
    return data;
  }
  return result.data;
}

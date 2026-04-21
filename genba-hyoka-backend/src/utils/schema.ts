import { t } from 'elysia';

/**
 * Standard error response schema for Swagger documentation.
 */
export const errorSchema = t.Object({
  success: t.Boolean({ default: false, description: 'Indicates if the operation was successful' }),
  message: t.String({ description: 'Detailed error message' }),
  errors: t.Optional(t.Any({ description: 'Optional list of validation errors' })),
}, {
  description: 'Standard error response'
});

/**
 * Standard pagination metadata schema.
 */
export const paginationMetaSchema = t.Object({
  total: t.Optional(t.Number()),
  limit: t.Number(),
  current_page: t.Optional(t.Number()),
  last_page: t.Optional(t.Number()),
  next_cursor: t.Optional(t.Union([t.String(), t.Null()])),
  has_more: t.Optional(t.Boolean()),
}, { description: 'Pagination metadata' });



/**
 * Helper to generate success response schema for single object.
 */
export const successResponse = (data: any) => t.Object({
  success: t.Boolean({ default: true }),
  message: t.String(),
  data: data,
});

/**
 * Helper to generate success response schema for a simple list.
 */
export const successListResponse = (data: any) => t.Object({
  success: t.Boolean({ default: true }),
  message: t.String(),
  data: t.Array(data),
});

/**
 * Helper to generate success response schema with pagination.
 */
export const paginatedResponse = (data: any) => t.Object({
  success: t.Boolean({ default: true }),
  message: t.String(),
  data: t.Array(data),
  meta: paginationMetaSchema,
});

/**
 * Common error responses for Swagger.
 */
export const commonResponses = {
  // ... existing common responses can be expanded here if needed
};

/**
 * Helper to generate error responses schema.
 * @param codes Array of HTTP status codes to include (e.g., [400, 401, 500])
 */
export const errorResponses = (codes: (400 | 401 | 403 | 404 | 422 | 500)[] = [400, 401, 500]) => {
  const responses: Record<number, any> = {};
  codes.forEach((code) => {
    responses[code] = errorSchema;
  });
  return responses;
};



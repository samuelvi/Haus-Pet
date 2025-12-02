/**
 * Pagination metadata for cursor-based pagination without count
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Default pagination values
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10);
export const ADMIN_PAGE_SIZE = parseInt(process.env.ADMIN_PAGE_SIZE || '10', 10);
export const MAX_LIMIT = parseInt(process.env.MAX_PAGE_SIZE || '100', 10);

/**
 * Validates and normalizes pagination parameters
 */
export function normalizePaginationParams(params: PaginationParams): Required<PaginationParams> {
  const page = Math.max(1, params.page || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit || DEFAULT_LIMIT));

  return { page, limit };
}

/**
 * Calculates pagination metadata using N+1 fetch pattern
 */
export function calculatePaginationMeta<T>(
  items: T[],
  page: number,
  limit: number
): PaginatedResponse<T> {
  const hasNext = items.length > limit;
  const displayItems = hasNext ? items.slice(0, limit) : items;

  return {
    items: displayItems,
    pagination: {
      page,
      limit,
      hasNext,
      hasPrevious: page > 1,
    },
  };
}

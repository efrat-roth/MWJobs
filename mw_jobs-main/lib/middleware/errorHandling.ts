/**
 * @deprecated This file is deprecated. Use lib/utils/api.ts instead for better error handling and API utilities.
 */

// Re-export from the new location for backwards compatibility
export {
  withErrorHandling,
  validateMethod,
  createApiHandler,
  requireAdmin,
  type ApiRequest,
  type ApiHandler
} from '../utils/api';

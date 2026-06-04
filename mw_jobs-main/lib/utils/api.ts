import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/authOptions';
import { Logger, AppError } from '../util/logger';
import { env } from '../config/environment';
import { generateRequestId } from '../utils/common';
import { API_METHODS, HTTP_STATUS, type ApiResponse } from '../types';

/**
 * Enhanced API utilities with better error handling and validation
 */

export interface ApiRequest extends NextApiRequest {
  requestId: string;
}

export type ApiHandler = (req: ApiRequest, res: NextApiResponse) => Promise<void>;

/**
 * Enhanced error handling middleware with request ID tracking
 */
export function withErrorHandling(handler: ApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const requestId = generateRequestId();
    const apiReq = req as ApiRequest;
    apiReq.requestId = requestId;

    // Log incoming request
    Logger.info('API Request', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    });

    try {
      await handler(apiReq, res);
    } catch (error: any) {
      // Check if it's a validation error
      if (error instanceof AppError && error.code === 'VALIDATION_ERROR') {
        Logger.warn('Validation error', {
          requestId,
          error: error.message,
          validationErrors: error.context.additionalData?.validationErrors
        });

        // Extract user-friendly validation messages
        const validationErrors = error.context.additionalData?.validationErrors || [];
        const userFriendlyMessages = validationErrors.map((err: any) => {
          // Map field names to Hebrew
          const fieldMap: Record<string, string> = {
            'eventIds': 'בחירת אירועים',
            'fullName': 'שם מלא',
            'idNumber': 'מספר זהות',
            'phone': 'מספר טלפון',
            'city': 'עיר מגורים',
            'dateOfBirth': 'תאריך לידה',
            'name': 'שם האירוע',
            'startDate': 'תאריך התחלה',
            'endDate': 'תאריך סיום',
            'startTime': 'שעת התחלה',
            'endTime': 'שעת סיום',
            'workerLimit': 'מספר עובדים מקסימלי',
            'description': 'תיאור'
          };
          
          const field = err.path?.join('.') || 'field';
          const hebrewFieldName = fieldMap[field] || field;
          return `${hebrewFieldName}: ${err.message}`;
        });

        const errorResponse: ApiResponse = {
          success: false,
          errors: userFriendlyMessages.length > 0 
            ? userFriendlyMessages
            : ['הנתונים שהוזנו אינם תקינים. אנא בדוק את הפרטים.'],
          requestId,
        };
        
        return res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      }

      Logger.error(error instanceof AppError ? error : new AppError(
        `Unhandled API error: ${error.message}`,
        'UNHANDLED_API_ERROR',
        {
          function: 'withErrorHandling',
          file: 'lib/utils/api.ts',
          requestId,
          additionalData: {
            method: req.method,
            url: req.url,
            originalError: error.message
          }
        }
      ));

      // If response hasn't been sent yet, send error response
      if (!res.headersSent) {
        const errorResponse: ApiResponse = {
          success: false,
          errors: ['שגיאה פנימית. אנא נסה שוב מאוחר יותר.'],
          requestId,
        };
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
      }
    }
  };
}

/**
 * Enhanced method validation with better error responses
 */
export function validateMethod(allowedMethods: string[]) {
  return (req: ApiRequest, res: NextApiResponse, next: () => void) => {
    if (!allowedMethods.includes(req.method || '')) {
      Logger.warn('Method not allowed', {
        requestId: req.requestId,
        method: req.method,
        allowedMethods,
      });
      
      const errorResponse: ApiResponse = {
        error: 'Method not allowed',
        message: `Method ${req.method} is not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
        requestId: req.requestId,
      };
      
      return res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json(errorResponse);
    }
    next();
  };
}

/**
 * Admin authentication middleware
 */
export async function requireAdmin(req: ApiRequest, res: NextApiResponse): Promise<boolean> {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session) {
      Logger.warn('Unauthorized access attempt - no session', { requestId: req.requestId });
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        requestId: req.requestId,
      } as ApiResponse);
      return false;
    }
    
    const adminEmail = env.getAdminEmail();
    const userEmail = session.user?.email;
    
    if (userEmail !== adminEmail) {
      Logger.warn('Unauthorized access attempt - not admin', { 
        requestId: req.requestId,
        userEmail,
        adminEmail: adminEmail.substring(0, 3) + '***'
      });
      res.status(HTTP_STATUS.FORBIDDEN).json({
        error: 'Forbidden',
        message: 'Admin privileges required',
        requestId: req.requestId,
      } as ApiResponse);
      return false;
    }
    
    return true;
  } catch (error: any) {
    Logger.error(new AppError(
      `Admin authentication failed: ${error.message}`,
      'ADMIN_AUTH_FAILED',
      {
        function: 'requireAdmin',
        file: 'lib/utils/api.ts',
        requestId: req.requestId,
        additionalData: { originalError: error.message }
      }
    ));
    
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Authentication error',
      message: 'Failed to verify authentication',
      requestId: req.requestId,
    } as ApiResponse);
    return false;
  }
}

/**
 * Validation middleware for request body schemas
 */
export function validateSchema<T>(schema: any, errorMessage?: string) {
  return (req: ApiRequest): T => {
    try {
      return schema.parse(req.body) as T;
    } catch (error: any) {
      const customMessage = errorMessage || 'Invalid request data';
      throw new AppError(
        `${customMessage}: ${error.message}`,
        'VALIDATION_ERROR',
        {
          function: 'validateSchema',
          file: 'lib/utils/api.ts',
          requestId: req.requestId,
          additionalData: {
            validationErrors: error.errors || [],
            receivedData: req.body
          }
        }
      );
    }
  };
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    ok: true,
    data,
    message
  };
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: string, message?: string, requestId?: string): ApiResponse {
  return {
    error,
    message,
    requestId
  };
}

/**
 * Combined API handler factory with common middleware
 */
export function createApiHandler(
  handler: ApiHandler,
  options: {
    allowedMethods?: string[];
    requiresAdmin?: boolean;
  } = {}
) {
  return withErrorHandling(async (req: ApiRequest, res: NextApiResponse) => {
    // Method validation
    if (options.allowedMethods) {
      const methodValidator = validateMethod(options.allowedMethods);
      await new Promise<void>((resolve, reject) => {
        methodValidator(req, res, () => resolve());
      });
      
      if (res.headersSent) return; // Method validation failed
    }
    
    // Admin authentication
    if (options.requiresAdmin) {
      const isAuthorized = await requireAdmin(req, res);
      if (!isAuthorized) return; // Authorization failed
    }
    
    // Execute the actual handler
    await handler(req, res);
  });
}

/**
 * Rate limiting utility (basic implementation)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: ApiRequest, res: NextApiResponse, next: () => void) => {
    const clientId = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    const clientData = requestCounts.get(clientId as string);
    
    if (!clientData || now > clientData.resetTime) {
      requestCounts.set(clientId as string, {
        count: 1,
        resetTime: now + windowMs
      });
      next();
      return;
    }
    
    if (clientData.count >= maxRequests) {
      Logger.warn('Rate limit exceeded', {
        requestId: req.requestId,
        clientId,
        count: clientData.count,
        maxRequests
      });
      
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Max ${maxRequests} requests per ${windowMs}ms`,
        requestId: req.requestId,
      } as ApiResponse);
      return;
    }
    
    clientData.count++;
    next();
  };
}

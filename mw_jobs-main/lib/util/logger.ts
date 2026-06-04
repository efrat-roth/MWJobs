export interface ErrorContext {
  function: string;
  file: string;
  userId?: string;
  requestId?: string;
  additionalData?: any;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    context: ErrorContext,
    isOperational = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.isOperational = isOperational;

    // Capture stack trace
    Error.captureStackTrace(this, AppError);
  }
}

export const Logger = {
  error: (error: Error | AppError, context?: Partial<ErrorContext>) => {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      message: error.message,
      stack: error.stack,
      ...(error instanceof AppError && {
        code: error.code,
        context: error.context,
        isOperational: error.isOperational,
      }),
      ...context,
    };

    console.error('🚨 APPLICATION ERROR:', JSON.stringify(errorInfo, null, 2));
    
    // In production, you might want to send this to an external logging service
    // like Sentry, LogRocket, or CloudWatch
  },

  warn: (message: string, data?: any) => {
    console.warn('⚠️ WARNING:', message, data ? JSON.stringify(data, null, 2) : '');
  },

  info: (message: string, data?: any) => {
    console.log('ℹ️ INFO:', message, data ? JSON.stringify(data, null, 2) : '');
  },

  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 DEBUG:', message, data ? JSON.stringify(data, null, 2) : '');
    }
  },
};

// Google API specific error handler
export const handleGoogleApiError = (error: any, context: ErrorContext): AppError => {
  let message = 'Unknown Google API error';
  let code = 'GOOGLE_API_UNKNOWN';

  if (error.response?.data?.error) {
    const googleError = error.response.data.error;
    switch (googleError) {
      case 'invalid_grant':
        message = 'Google OAuth refresh token has expired or been revoked. Please regenerate the refresh token.';
        code = 'GOOGLE_OAUTH_TOKEN_EXPIRED';
        break;
      case 'access_denied':
        message = 'Access denied to Google API. Check permissions and scopes.';
        code = 'GOOGLE_API_ACCESS_DENIED';
        break;
      case 'insufficient_permissions':
        message = 'Insufficient permissions for Google API operation.';
        code = 'GOOGLE_API_INSUFFICIENT_PERMISSIONS';
        break;
      default:
        message = `Google API error: ${googleError} - ${error.response.data.error_description || 'No description'}`;
        code = 'GOOGLE_API_ERROR';
    }
  } else if (error.code === 'ENOTFOUND') {
    message = 'Network error: Cannot connect to Google APIs. Check internet connection.';
    code = 'GOOGLE_API_NETWORK_ERROR';
  } else if (error.message) {
    message = `Google API error: ${error.message}`;
    code = 'GOOGLE_API_ERROR';
  }

  return new AppError(message, code, {
    ...context,
    additionalData: {
      originalError: error.message,
      googleErrorCode: error.response?.data?.error,
      googleErrorDescription: error.response?.data?.error_description,
      httpStatus: error.response?.status,
    },
  });
};

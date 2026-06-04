import { google } from 'googleapis';
import { Logger, AppError } from '../util/logger';
import { env } from '../config/environment';

let cachedClient: any;

/**
 * Check if error is due to expired refresh token
 */
function isTokenExpiredError(error: any): boolean {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code;
  
  return (
    errorMessage.includes('invalid_grant') ||
    errorMessage.includes('token has been expired') ||
    errorMessage.includes('token has been revoked') ||
    errorCode === 401
  );
}

/**
 * Provide guidance on preventing token expiration
 */
function logTokenExpirationGuidance() {
  Logger.error(new AppError(
    'Refresh token expired. To prevent this in the future:\n' +
    '1. Go to Google Cloud Console → OAuth consent screen\n' +
    '2. If status is "Testing", click "PUBLISH APP" to move to production\n' +
    '3. Or add your email as a test user for longer token validity\n' +
    '4. Production apps have refresh tokens that last 6+ months or indefinitely',
    'TOKEN_EXPIRATION_GUIDANCE',
    {
      function: 'logTokenExpirationGuidance',
      file: 'lib/google/backendClient.ts',
      additionalData: {
        solutions: [
          'Publish app to production in Google Cloud Console',
          'Add email as test user',
          'Regenerate token using scripts/getRefreshToken.ts'
        ]
      }
    }
  ));
}

export function getBackendOAuthClient() {
  try {
    if (cachedClient) {
      Logger.debug('Using cached OAuth client');
      return cachedClient;
    }

    Logger.debug('Creating new OAuth client');
    
    const config = env.getGoogleBackendConfig();

    // Validate token format
    if (config.refreshToken && !config.refreshToken.startsWith('1//')) {
      Logger.warn('Refresh token format may be invalid', { 
        tokenPrefix: config.refreshToken.substring(0, 10) + '...' 
      });
    }

    const client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    
    client.setCredentials({ refresh_token: config.refreshToken });
    cachedClient = client;

    Logger.info('OAuth client created successfully');
    return client;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    
    const appError = new AppError(
      `Failed to create OAuth client: ${error.message}`,
      'OAUTH_CLIENT_CREATION_FAILED',
      {
        function: 'getBackendOAuthClient',
        file: 'lib/google/backendClient.ts',
        additionalData: { originalError: error.message }
      }
    );
    Logger.error(appError);
    throw appError;
  }
}

export async function getAuthorizedApis() {
  try {
    Logger.debug('Getting authorized Google APIs');
    
    const auth = getBackendOAuthClient();
    
    // Test the token by making a simple API call
    try {
      await auth.getAccessToken();
      Logger.debug('OAuth token is valid');
    } catch (tokenError: any) {
      if (isTokenExpiredError(tokenError)) {
        logTokenExpirationGuidance();
        throw new AppError(
          'Google OAuth refresh token has expired or been revoked. Please regenerate the refresh token.',
          'GOOGLE_OAUTH_TOKEN_EXPIRED',
          {
            function: 'getAuthorizedApis',
            file: 'lib/google/backendClient.ts',
            additionalData: { 
              googleError: tokenError.message,
              tokenPrefix: env.getGoogleBackendConfig().refreshToken?.substring(0, 20) + '...'
            }
          }
        );
      }
      throw tokenError;
    }
    
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });
    const calendar = google.calendar({ version: 'v3', auth });

    Logger.debug('Successfully created Google API clients');
    return { drive, sheets, calendar };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    
    const appError = new AppError(
      `Failed to get authorized Google APIs: ${error.message}`,
      'GOOGLE_API_AUTHORIZATION_FAILED',
      {
        function: 'getAuthorizedApis',
        file: 'lib/google/backendClient.ts',
        additionalData: { originalError: error.message }
      }
    );
    Logger.error(appError);
    throw appError;
  }
}

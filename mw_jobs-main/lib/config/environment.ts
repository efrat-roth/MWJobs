import { Logger, AppError } from '../util/logger';

/**
 * Centralized environment configuration manager
 * Validates and provides typed access to environment variables
 */
export class EnvironmentConfig {
  private static instance: EnvironmentConfig;
  private config: Record<string, string> = {};

  private constructor() {
    this.validateAndLoadConfig();
  }

  public static getInstance(): EnvironmentConfig {
    if (!EnvironmentConfig.instance) {
      EnvironmentConfig.instance = new EnvironmentConfig();
    }
    return EnvironmentConfig.instance;
  }

  private validateAndLoadConfig(): void {
    const requiredVars = [
      'GOOGLE_BACKEND_CLIENT_ID',
      'GOOGLE_BACKEND_CLIENT_SECRET', 
      'GOOGLE_BACKEND_REFRESH_TOKEN',
      'EVENTS_METADATA_SHEET_ID',
      'LEADS_SHEET_ID',
      'EVENTS_FOLDER_ID',
      'ADMIN_EMAIL'
    ];

    const missingVars: string[] = [];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        missingVars.push(varName);
      } else {
        this.config[varName] = value;
      }
    }

    if (missingVars.length > 0) {
      const error = new AppError(
        `Missing required environment variables: ${missingVars.join(', ')}`,
        'MISSING_ENVIRONMENT_VARIABLES',
        {
          function: 'validateAndLoadConfig',
          file: 'lib/config/environment.ts',
          additionalData: { missingVars }
        }
      );
      Logger.error(error);
      throw error;
    }

    // Optional variables with defaults
    this.config.CLEANUP_SECRET = process.env.CLEANUP_SECRET || '';
    this.config.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
    this.config.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
    this.config.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '';
    this.config.NEXTAUTH_URL = process.env.NEXTAUTH_URL || '';
  }

  public get(key: string): string {
    const value = this.config[key];
    if (value === undefined) {
      throw new AppError(
        `Environment variable ${key} not found in configuration`,
        'ENVIRONMENT_VARIABLE_NOT_FOUND',
        {
          function: 'get',
          file: 'lib/config/environment.ts',
          additionalData: { requestedKey: key, availableKeys: Object.keys(this.config) }
        }
      );
    }
    return value;
  }

  public getOptional(key: string, defaultValue: string = ''): string {
    return this.config[key] || defaultValue;
  }

  public isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  public isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  // Typed getters for specific configuration values
  public getGoogleBackendConfig() {
    return {
      clientId: this.get('GOOGLE_BACKEND_CLIENT_ID'),
      clientSecret: this.get('GOOGLE_BACKEND_CLIENT_SECRET'),
      refreshToken: this.get('GOOGLE_BACKEND_REFRESH_TOKEN')
    };
  }

  public getGoogleFrontendConfig() {
    return {
      clientId: this.getOptional('GOOGLE_CLIENT_ID'),
      clientSecret: this.getOptional('GOOGLE_CLIENT_SECRET')
    };
  }

  public getSheetConfig() {
    return {
      eventsMetadataSheetId: this.get('EVENTS_METADATA_SHEET_ID'),
      leadsSheetId: this.get('LEADS_SHEET_ID'),
      eventsFolderId: this.get('EVENTS_FOLDER_ID')
    };
  }

  public getAdminEmail(): string {
    return this.get('ADMIN_EMAIL');
  }

  public getCleanupSecret(): string {
    return this.getOptional('CLEANUP_SECRET');
  }
}

// Export singleton instance
export const env = EnvironmentConfig.getInstance();

import { getAuthorizedApis } from './backendClient';
import { Logger, AppError } from '../util/logger';
import { google } from 'googleapis';

export async function createSpreadsheetInFolder(name: string, folderId: string): Promise<string> {
  try {
    Logger.debug('Creating spreadsheet in folder', { name, folderId });
    
    const { drive } = await getAuthorizedApis();
    const fileRes = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [folderId]
      },
      fields: 'id'
    });
    
    const fileId = fileRes.data.id!;
    Logger.debug('Successfully created spreadsheet', { name, fileId });
    return fileId;
  } catch (error: any) {
    const appError = new AppError(
      `Failed to create spreadsheet "${name}" in folder "${folderId}": ${error.message}`,
      'DRIVE_FILE_CREATE_FAILED',
      {
        function: 'createSpreadsheetInFolder',
        file: 'lib/google/drive.ts',
        additionalData: { name, folderId, originalError: error.message }
      }
    );
    Logger.error(appError);
    throw appError;
  }
}

export async function shareFileWithClient(fileId: string, email: string) {
  try {
    Logger.debug('Sharing file with client', { fileId, email });
    
    const { drive } = await getAuthorizedApis();
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader', // הרשאת עריכה ללקוח
        type: 'user',
        emailAddress: email,
      },
    });
    
    Logger.debug('Successfully shared file', { fileId, email });
  } catch (error: any) {
    const appError = new AppError(
      `Failed to share file "${fileId}" with "${email}": ${error.message}`,
      'DRIVE_FILE_SHARE_FAILED',
      {
        function: 'shareFileWithClient',
        file: 'lib/google/drive.ts',
        additionalData: { fileId, email, originalError: error.message }
      }
    );
    Logger.error(appError);
    throw appError;
  }
}

export async function deleteFile(fileId: string) {
  try {
    Logger.debug('Deleting file', { fileId });
    
    const { drive } = await getAuthorizedApis();
    await drive.files.delete({ fileId });
    
    Logger.debug('Successfully deleted file', { fileId });
  } catch (error: any) {
    // If file doesn't exist, that's fine - it's already "deleted"
    if (error.code === 404) {
      Logger.debug('File already deleted or not found', { fileId });
      return;
    }
    
    const appError = new AppError(
      `Failed to delete file "${fileId}": ${error.message}`,
      'DRIVE_FILE_DELETE_FAILED',
      {
        function: 'deleteFile',
        file: 'lib/google/drive.ts',
        additionalData: { fileId, originalError: error.message }
      }
    );
    Logger.error(appError);
    throw appError;
  }
}




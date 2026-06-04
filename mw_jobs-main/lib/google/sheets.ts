import { getAuthorizedApis } from './backendClient';
import { Logger, AppError, handleGoogleApiError } from '../util/logger';

export interface SheetRow { [k: string]: string; }

export async function appendRow(spreadsheetId: string, values: any[]) {
  try {
    Logger.debug('Appending row to sheet', { spreadsheetId, valueCount: values.length });
    
    const { sheets } = await getAuthorizedApis();
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: { values: [values] }
    });

    Logger.debug('Successfully appended row to sheet', { 
      spreadsheetId, 
      updatedRows: result.data.updates?.updatedRows 
    });

    return result;
  } catch (error: any) {
    const appError = handleGoogleApiError(error, {
      function: 'appendRow',
      file: 'lib/google/sheets.ts',
      additionalData: { spreadsheetId, valueCount: values.length }
    });
    Logger.error(appError);
    throw appError;
  }
}

export async function readAll(spreadsheetId: string) {
  try {
    Logger.debug('Reading all data from sheet', { spreadsheetId });
    
    const { sheets } = await getAuthorizedApis();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:Z'
    });
    
    const rows = res.data.values || [];
    Logger.debug('Successfully read sheet data', { 
      spreadsheetId, 
      totalRows: rows.length,
      hasHeaders: rows.length > 0 
    });

    if (rows.length === 0) {
      Logger.warn('Sheet is empty', { spreadsheetId });
      return { headers: [], rows: [] };
    }

    const headers = rows[0];
    if (!headers) {
      Logger.warn('No headers found in sheet', { spreadsheetId });
      return { headers: [], rows: [] };
    }

    const data = rows.slice(1).map(r => {
      const obj: any = {};
      headers.forEach((h, i) => obj[h] = r[i] ?? '');
      return obj;
    });

    Logger.debug('Processed sheet data', { 
      spreadsheetId, 
      headerCount: headers.length,
      dataRowCount: data.length 
    });

    return { headers, rows: data };
  } catch (error: any) {
    const appError = handleGoogleApiError(error, {
      function: 'readAll',
      file: 'lib/google/sheets.ts',
      additionalData: { spreadsheetId }
    });
    Logger.error(appError);
    throw appError;
  }
}

export async function overwriteAll(spreadsheetId: string, headers: string[], rows: any[]) {
  try {
    Logger.debug('Overwriting all sheet data', { 
      spreadsheetId, 
      headerCount: headers.length, 
      rowCount: rows.length 
    });
    
    const { sheets } = await getAuthorizedApis();
    const values = [headers, ...rows.map(r => headers.map(h => r[h] ?? ''))];
    
    const result = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    Logger.debug('Successfully overwrote sheet data', { 
      spreadsheetId, 
      updatedRows: result.data.updatedRows,
      updatedColumns: result.data.updatedColumns 
    });

    return result;
  } catch (error: any) {
    const appError = handleGoogleApiError(error, {
      function: 'overwriteAll',
      file: 'lib/google/sheets.ts',
      additionalData: { spreadsheetId, headerCount: headers.length, rowCount: rows.length }
    });
    Logger.error(appError);
    throw appError;
  }
}

export async function upsertByKey(spreadsheetId: string, keyCol: string, keyVal: string, headers: string[], data: Record<string,string>) {
  const existing = await readAll(spreadsheetId);
  if (existing.headers.length === 0) {
    await overwriteAll(spreadsheetId, headers, [data]);
    return;
  }
  const idx = existing.rows.findIndex(r => r[keyCol] === keyVal);
  if (idx === -1) {
    existing.rows.push(data);
  } else {
    existing.rows[idx] = { ...existing.rows[idx], ...data };
  }
  await overwriteAll(spreadsheetId, existing.headers, existing.rows);
}

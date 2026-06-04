/**
 * Standalone bootstrap script that works independently of the main application
 * 
 * This script can work with either:
 * SCENARIO A - All IDs provided:
 * - DATA_ROOT_FOLDER_ID, EVENTS_FOLDER_ID, LEADS_SHEET_ID, EVENTS_METADATA_SHEET_ID
 * 
 * SCENARIO B - Only folder IDs provided:
 * - DATA_ROOT_FOLDER_ID, EVENTS_FOLDER_ID
 * (Will create missing sheets and output their IDs)
 * 
 * Run: npx ts-node --transpile-only scripts/bootstrap-standalone.ts
 */

import { google } from 'googleapis';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Minimal logging for bootstrap
function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logData = data ? ` ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}${logData}`);
}

// Bootstrap-specific environment variables
const REQUIRED_BOOTSTRAP_VARS = [
  'GOOGLE_BACKEND_CLIENT_ID',
  'GOOGLE_BACKEND_CLIENT_SECRET', 
  'GOOGLE_BACKEND_REFRESH_TOKEN',
  'DATA_ROOT_FOLDER_ID',
  'EVENTS_FOLDER_ID'
];

function envOrThrow(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

function envOrNull(key: string): string | null {
  return process.env[key] || null;
}

// Bootstrap Google APIs client
async function getBootstrapGoogleApis() {
  const clientId = envOrThrow('GOOGLE_BACKEND_CLIENT_ID');
  const clientSecret = envOrThrow('GOOGLE_BACKEND_CLIENT_SECRET');
  const refreshToken = envOrThrow('GOOGLE_BACKEND_REFRESH_TOKEN');

  const auth = new google.auth.OAuth2(clientId, clientSecret);
  auth.setCredentials({ refresh_token: refreshToken });

  return {
    drive: google.drive({ version: 'v3', auth }),
    sheets: google.sheets({ version: 'v4', auth })
  };
}

// Create spreadsheet in folder
async function createSpreadsheetInFolder(name: string, folderId: string): Promise<string> {
  try {
    log('info', 'Creating spreadsheet in folder', { name, folderId });
    
    const { drive } = await getBootstrapGoogleApis();
    const fileRes = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [folderId]
      },
      fields: 'id'
    });
    
    const fileId = fileRes.data.id!;
    log('info', 'Successfully created spreadsheet', { name, fileId });
    return fileId;
  } catch (error: any) {
    log('error', `Failed to create spreadsheet "${name}" in folder "${folderId}"`, { error: error.message });
    throw error;
  }
}

// Read all data from sheet
async function readAllData(spreadsheetId: string): Promise<any[] | null> {
  try {
    log('info', 'Reading all data from sheet', { spreadsheetId });
    
    const { sheets } = await getBootstrapGoogleApis();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:Z'
    });

    const values = result.data.values;
    if (!values || values.length === 0) {
      log('info', 'Sheet is empty', { spreadsheetId });
      return null;
    }

    log('info', 'Successfully read sheet data', { 
      spreadsheetId, 
      rowCount: values.length 
    });

    return values;
  } catch (error: any) {
    log('error', `Failed to read sheet "${spreadsheetId}"`, { error: error.message });
    throw error;
  }
}

// Overwrite all data in sheet
async function overwriteAllData(spreadsheetId: string, headers: string[], rows: string[][]): Promise<void> {
  try {
    log('info', 'Overwriting sheet data', { 
      spreadsheetId, 
      headerCount: headers.length, 
      rowCount: rows.length 
    });
    
    const { sheets } = await getBootstrapGoogleApis();
    
    // Clear existing data first
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: 'A:Z'
    });

    // Write new data
    const values = [headers, ...rows];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: { values }
    });

    log('info', 'Successfully overwrote sheet data', { spreadsheetId });
  } catch (error: any) {
    log('error', `Failed to overwrite sheet "${spreadsheetId}"`, { error: error.message });
    throw error;
  }
}

async function main() {
  try {
    // Validate minimal required environment variables first
    log('info', 'Validating bootstrap environment variables...');
    for (const varName of REQUIRED_BOOTSTRAP_VARS) {
      envOrThrow(varName);
    }
    
    log('info', 'Starting enhanced bootstrap...');

    // Get required folder IDs from environment
    const rootId = envOrThrow('DATA_ROOT_FOLDER_ID');
    const eventsId = envOrThrow('EVENTS_FOLDER_ID');
    
    // Try to get sheet IDs, create if missing
    let leadsSheetId = envOrNull('LEADS_SHEET_ID');
    let eventsMetadataSheetId = envOrNull('EVENTS_METADATA_SHEET_ID');
    
    const createdSheets: string[] = [];

    // Create Leads sheet if missing
    if (!leadsSheetId) {
      log('info', 'LEADS_SHEET_ID not provided, creating new Leads sheet...');
      leadsSheetId = await createSpreadsheetInFolder('Leads', rootId);
      createdSheets.push(`LEADS_SHEET_ID=${leadsSheetId}`);
      log('info', 'Created Leads sheet', { leadsSheetId });
    }

    // Create Events Metadata sheet if missing  
    if (!eventsMetadataSheetId) {
      log('info', 'EVENTS_METADATA_SHEET_ID not provided, creating new Events Metadata sheet...');
      eventsMetadataSheetId = await createSpreadsheetInFolder('Events Metadata', eventsId);
      createdSheets.push(`EVENTS_METADATA_SHEET_ID=${eventsMetadataSheetId}`);
      log('info', 'Created Events Metadata sheet', { eventsMetadataSheetId });
    }

    // At this point, both sheet IDs are guaranteed to be strings
    const finalLeadsSheetId = leadsSheetId!;
    const finalEventsMetadataSheetId = eventsMetadataSheetId!;

    log('info', 'Using structure', {
      rootId,
      eventsId,
      leadsSheetId: finalLeadsSheetId,
      eventsMetadataSheetId: finalEventsMetadataSheetId,
      createdSheets: createdSheets.length
    });

    // Initialize Leads sheet if empty
    try {
      const leadsData = await readAllData(finalLeadsSheetId);
      if (!leadsData || leadsData.length === 0) {
        log('info', 'Initializing empty Leads sheet...');
        const leadsHeaders = [
          'full_name', 'phone', 'id', 'city', 'date_of_birth', 'last_updated'
        ];
        await overwriteAllData(finalLeadsSheetId, leadsHeaders, []);
        log('info', 'Leads sheet initialized with headers');
      } else {
        log('info', 'Leads sheet already has data, skipping initialization');
      }
    } catch (error: any) {
      log('warn', 'Could not check/initialize Leads sheet', { error: error?.message || String(error) });
    }

    // Initialize events_metadata sheet if empty
    try {
      const metaData = await readAllData(finalEventsMetadataSheetId);
      if (!metaData || metaData.length === 0) {
        log('info', 'Initializing empty events_metadata sheet...');
        const metaHeaders = [
          'id', 'name', 'startDate', 'endDate', 'startTime', 'endTime', 
          'startDatetime', 'endDatetime', 'worker_limit', 'sheet_file_id', 
          'calendar_event_ids', 'status', 'signups_count', 'created_at'
        ];
        await overwriteAllData(finalEventsMetadataSheetId, metaHeaders, []);
        log('info', 'Events metadata sheet initialized with new structure headers');
      } else {
        log('info', 'Events metadata sheet already has data, skipping initialization');
      }
    } catch (error: any) {
      log('warn', 'Could not check/initialize events_metadata sheet', { error: error?.message || String(error) });
    }

    log('info', '✅ Enhanced bootstrap completed successfully!');
    
    if (createdSheets.length > 0) {
      log('info', '🎉 New sheets created! Add these to your .env.local:');
      createdSheets.forEach(sheetEnv => log('info', `   ${sheetEnv}`));
      console.log('');
    }
    
    log('info', '📁 Final folder structure:');
    log('info', `   └─ Data folder: ${rootId}`);
    log('info', `      ├─ Leads sheet: ${finalLeadsSheetId}`);
    log('info', `      └─ Events folder: ${eventsId}`);
    log('info', `         └─ Events metadata: ${finalEventsMetadataSheetId}`);
    console.log('');
    log('info', '🎯 Your application is ready to:');
    log('info', '   • Create events with date ranges (startDate/endDate)');
    log('info', '   • Handle multiple event selections');
    log('info', '   • Filter events based on end dates');
    log('info', '   • Create new event sheets in the events folder');
    log('info', '   • Delete old event sheets 30 days after end date');
    console.log('');
    log('info', '✨ All operations work with drive.file scope only!');

  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    log('error', `Bootstrap failed: ${errorMsg}`);
    console.error('❌ Bootstrap failed:', errorMsg);
    process.exit(1);
  }
}

main().catch(console.error);

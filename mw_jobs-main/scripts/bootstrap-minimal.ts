/**
 * Enhanced bootstrap script for existing or minimal folder structure
 * 
 * ⚠️  IMPORTANT: This script requires ALL environment variables to be set
 *     (including sheet IDs) due to internal dependencies on EnvironmentConfig.
 * 
 *     If you only have folder IDs and want to create missing sheets,
 *     use bootstrap-standalone.ts instead.
 * 
 * This script works when you have:
 * - DATA_ROOT_FOLDER_ID
 * - EVENTS_FOLDER_ID  
 * - LEADS_SHEET_ID
 * - EVENTS_METADATA_SHEET_ID
 * - All other required environment variables
 * 
 * It will initialize sheets with proper headers if they're empty.
 * Works with drive.file scope only.
 * 
 * Run: npx ts-node --transpile-only scripts/bootstrap-minimal.ts
 * 
 * For scenarios with missing sheet IDs, use:
 * npx ts-node --transpile-only scripts/bootstrap-standalone.ts
 */

// Import Google APIs directly to avoid EnvironmentConfig validation
import { google, Auth } from 'googleapis';
import { Logger } from '../lib/util/logger';

// We'll implement bootstrap-specific versions of sheet functions
// to avoid importing functions that depend on EnvironmentConfig

interface SheetRow { [k: string]: string; }

interface SheetData {
  headers: string[];
  rows: SheetRow[];
}

// Bootstrap-specific environment variables (minimal set)
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

// Bootstrap-specific Google APIs client (without EnvironmentConfig)
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

// Bootstrap-specific function to create spreadsheet in folder
async function createSpreadsheetInFolder(name: string, folderId: string): Promise<string> {
  try {
    Logger.debug('Creating spreadsheet in folder', { name, folderId });
    
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
    Logger.debug('Successfully created spreadsheet', { name, fileId });
    return fileId;
  } catch (error: any) {
    const errorMsg = `Failed to create spreadsheet "${name}" in folder "${folderId}": ${error.message}`;
    Logger.error(new Error(errorMsg));
    throw error;
  }
}

// Bootstrap-specific function to read all data from sheet
async function readAll(spreadsheetId: string): Promise<SheetData | null> {
  try {
    Logger.debug('Reading all data from sheet', { spreadsheetId });
    
    const { sheets } = await getBootstrapGoogleApis();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:Z'
    });

    const values = result.data.values;
    if (!values || values.length === 0) {
      Logger.debug('Sheet is empty', { spreadsheetId });
      return null;
    }

    const headers = values[0] as string[];
    const rows = values.slice(1).map(row => {
      const rowObj: SheetRow = {};
      headers.forEach((header, index) => {
        rowObj[header] = row[index] || '';
      });
      return rowObj;
    });

    Logger.debug('Successfully read sheet data', { 
      spreadsheetId, 
      headerCount: headers.length, 
      rowCount: rows.length 
    });

    return { headers, rows };
  } catch (error: any) {
    const errorMsg = `Failed to read sheet "${spreadsheetId}": ${error.message}`;
    Logger.error(new Error(errorMsg));
    throw error;
  }
}

// Bootstrap-specific function to overwrite all data in sheet
async function overwriteAll(spreadsheetId: string, headers: string[], rows: string[][]): Promise<void> {
  try {
    Logger.debug('Overwriting sheet data', { 
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

    Logger.debug('Successfully overwrote sheet data', { spreadsheetId });
  } catch (error: any) {
    const errorMsg = `Failed to overwrite sheet "${spreadsheetId}": ${error.message}`;
    Logger.error(new Error(errorMsg));
    throw error;
  }
}

async function main() {
  try {
    // Validate minimal required environment variables first
    Logger.info('Validating bootstrap environment variables...');
    for (const varName of REQUIRED_BOOTSTRAP_VARS) {
      envOrThrow(varName);
    }
    
    Logger.info('Starting enhanced bootstrap...');

    // Get required folder IDs from environment
    const rootId = envOrThrow('DATA_ROOT_FOLDER_ID');
    const eventsId = envOrThrow('EVENTS_FOLDER_ID');
    
    // Try to get sheet IDs, create if missing
    let leadsSheetId = envOrNull('LEADS_SHEET_ID');
    let eventsMetadataSheetId = envOrNull('EVENTS_METADATA_SHEET_ID');
    
    const createdSheets: string[] = [];

    // Create Leads sheet if missing
    if (!leadsSheetId) {
      Logger.info('LEADS_SHEET_ID not provided, creating new Leads sheet...');
      leadsSheetId = await createSpreadsheetInFolder('Leads', rootId);
      createdSheets.push(`LEADS_SHEET_ID=${leadsSheetId}`);
      Logger.info('Created Leads sheet', { leadsSheetId });
    }

    // Create Events Metadata sheet if missing  
    if (!eventsMetadataSheetId) {
      Logger.info('EVENTS_METADATA_SHEET_ID not provided, creating new Events Metadata sheet...');
      eventsMetadataSheetId = await createSpreadsheetInFolder('Events Metadata', eventsId);
      createdSheets.push(`EVENTS_METADATA_SHEET_ID=${eventsMetadataSheetId}`);
      Logger.info('Created Events Metadata sheet', { eventsMetadataSheetId });
    }

    // At this point, both sheet IDs are guaranteed to be strings
    const finalLeadsSheetId = leadsSheetId!;
    const finalEventsMetadataSheetId = eventsMetadataSheetId!;

    Logger.info('Using structure', {
      rootId,
      eventsId,
      leadsSheetId: finalLeadsSheetId,
      eventsMetadataSheetId: finalEventsMetadataSheetId,
      createdSheets: createdSheets.length
    });

    // Initialize Leads sheet if empty
    try {
      const leadsData = await readAll(finalLeadsSheetId);
      if (!leadsData || leadsData.rows.length === 0) {
        Logger.info('Initializing empty Leads sheet...');
        const leadsHeaders = [
          'full_name', 'phone', 'id', 'city', 'date_of_birth', 'last_updated'
        ];
        await overwriteAll(finalLeadsSheetId, leadsHeaders, []);
        Logger.info('Leads sheet initialized with headers');
      } else {
        Logger.info('Leads sheet already has data, skipping initialization');
      }
    } catch (error: any) {
      Logger.warn('Could not check/initialize Leads sheet', { error: error?.message || String(error) });
    }

    // Initialize events_metadata sheet if empty
    try {
      const metaData = await readAll(finalEventsMetadataSheetId);
      if (!metaData || metaData.rows.length === 0) {
        Logger.info('Initializing empty events_metadata sheet...');
        const metaHeaders = [
          'id', 'name', 'startDate', 'endDate', 'startTime', 'endTime', 
          'startDatetime', 'endDatetime', 'worker_limit', 'sheet_file_id', 
          'calendar_event_ids', 'status', 'signups_count', 'created_at'
        ];
        await overwriteAll(finalEventsMetadataSheetId, metaHeaders, []);
        Logger.info('Events metadata sheet initialized with new structure headers');
      } else {
        Logger.info('Events metadata sheet already has data, skipping initialization');
      }
    } catch (error: any) {
      Logger.warn('Could not check/initialize events_metadata sheet', { error: error?.message || String(error) });
    }

    Logger.info('✅ Enhanced bootstrap completed successfully!');
    
    if (createdSheets.length > 0) {
      Logger.info('🎉 New sheets created! Add these to your .env.local:');
      createdSheets.forEach(sheetEnv => Logger.info(`   ${sheetEnv}`));
      Logger.info('');
    }
    
    Logger.info('📁 Final folder structure:');
    Logger.info(`   └─ Data folder: ${rootId}`);
    Logger.info(`      ├─ Leads sheet: ${finalLeadsSheetId}`);
    Logger.info(`      └─ Events folder: ${eventsId}`);
    Logger.info(`         └─ Events metadata: ${finalEventsMetadataSheetId}`);
    Logger.info('');
    Logger.info('🎯 Your application is ready to:');
    Logger.info('   • Create events with date ranges (startDate/endDate)');
    Logger.info('   • Handle multiple event selections');
    Logger.info('   • Filter events based on end dates');
    Logger.info('   • Create new event sheets in the events folder');
    Logger.info('   • Delete old event sheets 30 days after end date');
    Logger.info('');
    Logger.info('✨ All operations work with drive.file scope only!');

  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    Logger.error(new Error(`Bootstrap failed: ${errorMsg}`));
    console.error('❌ Bootstrap failed:', errorMsg);
    process.exit(1);
  }
}

main().catch(console.error);

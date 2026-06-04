/**
 * One-time script:
 *  - Creates root 'data' folder (if not exists)
 *  - Creates 'events' subfolder
 *  - Creates Leads sheet
 *  - Creates events_metadata sheet (with header)
 * Print IDs for .env configuration
 *
 * Run: npx ts-node --transpile-only scripts/bootstrap.ts
 */
import 'dotenv/config'
import { EnvironmentConfig } from '../lib/config/environment';
import { getAuthorizedApis } from '../lib/google/backendClient';
import { overwriteAll } from '../lib/google/sheets';

async function main() {
  const rootName = 'data';
  const eventsFolderName = 'events';
  const { drive } = await getAuthorizedApis();

  async function findFolderByName(name: string): Promise<string | null> {
    const res = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`,
      fields: 'files(id,name)'
    });
    const f = res.data.files?.[0];
    return f?.id || null;
  }

  async function createFolder(name: string, parent?: string): Promise<string> {
    const res = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parent ? [parent] : undefined
      },
      fields: 'id'
    });
    return res.data.id!;
  }

  let rootId = await findFolderByName(rootName);
  if (!rootId) {
    rootId = await createFolder(rootName);
  }
  let eventsId: string | null = null;
  // search for events folder inside root
  const eventsRes = await drive.files.list({
    q: `mimeType='application/vnd.google-apps.folder' and name='${eventsFolderName}' and '${rootId}' in parents and trashed=false`,
    fields: 'files(id,name)'
  });
  eventsId = eventsRes.data.files?.[0]?.id || null;
  if (!eventsId) {
    eventsId = await createFolder(eventsFolderName, rootId);
  }

  async function createSpreadsheet(name: string, parent: string): Promise<string> {
    const res = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [parent]
      },
      fields: 'id'
    });
    return res.data.id!;
  }

  // Leads sheet
  let leadsId: string | null = null;
  {
    const list = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.spreadsheet' and name='Leads' and '${rootId}' in parents and trashed=false`,
      fields: 'files(id,name)'
    });
    leadsId = list.data.files?.[0]?.id || null;
    if (!leadsId) {
      leadsId = await createSpreadsheet('Leads', rootId);
    }
  }
  // events_metadata sheet
  let metaId: string | null = null;
  {
    const list = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.spreadsheet' and name='events_metadata' and '${eventsId}' in parents and trashed=false`,
      fields: 'files(id,name)'
    });
    metaId = list.data.files?.[0]?.id || null;
    if (!metaId) {
      metaId = await createSpreadsheet('events_metadata', eventsId);
    }
  }

  // Initialize headers if empty
  const { sheets } = await getAuthorizedApis();
  async function ensureHeaders(spreadsheetId: string, headers: string[]) {
    const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'A1:Z1' });
    const values = existing.data.values;
    if(!values || values.length === 0) {
      await overwriteAll(spreadsheetId, headers, []);
    }
  }

  await ensureHeaders(leadsId!, ['full_name','phone','id','city','date_of_birth','last_updated']);
  await ensureHeaders(metaId!, ['id','name','startDate','endDate','startTime','endTime','startDatetime','endDatetime','worker_limit','sheet_file_id','calendar_event_ids','status','signups_count','created_at']);

  console.log('Bootstrap results (copy into .env.local):');
  console.log('DATA_ROOT_FOLDER_ID=', rootId);
  console.log('EVENTS_FOLDER_ID=', eventsId);
  console.log('LEADS_SHEET_ID=', leadsId);
  console.log('EVENTS_METADATA_SHEET_ID=', metaId);
}

main().catch(e=>{
  console.error(e);
  process.exit(1);
});

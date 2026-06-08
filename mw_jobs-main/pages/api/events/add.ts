import type { NextApiRequest, NextApiResponse } from 'next';
import { addEventSchema } from '../../../lib/events/validation';
import { createEventMeta, loadAllEvents, saveAllEvents } from '../../../lib/events/repository';
import { overwriteAll } from '../../../lib/google/sheets';
import { createApiHandler, validateSchema } from '../../../lib/utils/api';
import { env } from '../../../lib/config/environment';
import { createEventSheetName } from '../../../lib/utils/common';
import { Logger } from '../../../lib/util/logger';
import { type AddEventRequest, type ApiResponse } from '../../../lib/types';
import { createSpreadsheetInFolder, shareFileWithClient } from '../../../lib/google/drive';
import { getAuthorizedApis } from '../../../lib/google/backendClient';
import { createCalendarEventsForDateRange } from '../../../lib/google/calendar';
export default createApiHandler(async (req, res) => {
  const validation = validateSchema<AddEventRequest>(addEventSchema, 'Invalid event data');
  const parsed = validation(req);
  const sheetConfig = env.getSheetConfig();
  
  Logger.info('Creating new event', {
    requestId: req.requestId,
    eventName: parsed.name,
    startDate: parsed.startDate,
    endDate: parsed.endDate
  });

  if ((parsed as any).clientName && parsed.clientEmail) {
    try {
      const { sheets } = await getAuthorizedApis();
      const clientsSheetId = process.env.CLIENTS_SHEET_ID;

      if (clientsSheetId) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: clientsSheetId,
          range: 'Clients!A:B',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[(parsed as any).clientName, parsed.clientEmail]],
          },
        });
        Logger.info('Successfully added new client to database', { clientName: (parsed as any).clientName });
      }
    } catch (sheetError: any) {
      Logger.error(new Error(`Failed to save new client to sheet: ${sheetError.message}`));
    }
  }  

  const startIso = `${parsed.startDate}T${parsed.startTime}:00`;
  const endIso = `${parsed.endDate}T${parsed.endTime}:00`;

  // Create event sheet with date range in name
  const sheetName = createEventSheetName(parsed.name, parsed.startDate, parsed.endDate);
  const sheetFileId = await createSpreadsheetInFolder(sheetName, sheetConfig.eventsFolderId);
  if (parsed.clientEmail) {
    await shareFileWithClient(sheetFileId, parsed.clientEmail);
  }
  await overwriteAll(sheetFileId, ['full_name','phone','id','city','date_of_birth','signed_at'], []);

  // Create separate calendar events for each day in the date range
  const calendarEventIds = await createCalendarEventsForDateRange({
    summary: parsed.name,
    description: parsed.description || '',
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    timezone: 'Asia/Jerusalem'
  });

  Logger.info('Created calendar events for date range', {
    requestId: req.requestId,
    eventName: parsed.name,
    dateRange: `${parsed.startDate} to ${parsed.endDate}`,
    calendarEventCount: calendarEventIds.length,
    calendarEventIds
  });

  // Save metadata
  const events = await loadAllEvents();
  const meta = createEventMeta({
    name: parsed.name,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    startTime: parsed.startTime,
    endTime: parsed.endTime,
    worker_limit: parsed.workerLimit,
    hourlyRate: parsed.hourlyRate,
    sheet_file_id: sheetFileId,
    calendar_event_ids: calendarEventIds
  });
  
  events.push(meta);
  await saveAllEvents(events);

  Logger.info('Event created successfully', {
    requestId: req.requestId,
    eventId: meta.id,
    sheetFileId,
    calendarEventIds,
    calendarEventCount: calendarEventIds.length
  });

  const successResponse: ApiResponse = {
    ok: true,
    data: { event: meta },
    message: 'Event created successfully'
  };
  
  res.json(successResponse);
}, {
  allowedMethods: ['POST'],
  requiresAdmin: true
});

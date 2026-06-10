import { readAll, overwriteAll } from '../google/sheets';
import { EventMeta } from '../types';
import { v4 as uuid } from 'uuid';
import { Logger, AppError } from '../util/logger';
import { env } from '../config/environment';

const META_HEADERS = [
  'id','name','startDate','endDate','startTime','endTime','startDatetime','endDatetime','worker_limit','hourlyRate','min_age','sheet_file_id','calendar_event_ids','status','signups_count','created_at'
];

export async function loadAllEvents(): Promise<EventMeta[]> {
  try {
    Logger.debug('Loading all events from metadata sheet');
    
    const sheetConfig = env.getSheetConfig();
    Logger.debug('Using events metadata sheet', { sheetId: sheetConfig.eventsMetadataSheetId });
    
    const { rows, headers } = await readAll(sheetConfig.eventsMetadataSheetId);
    
    if(!headers || headers.length === 0) {
      Logger.warn('No headers found in events metadata sheet');
      return [];
    }

    Logger.debug('Processing events data', { 
      headerCount: headers.length, 
      rowCount: rows.length,
      headers 
    });

    const events = rows.map((r, index) => {
      try {
        return {
          id: r.id,
          name: r.name,
          startDate: r.startDate,
          endDate: r.endDate,
          startTime: r.startTime,
          endTime: r.endTime,
          startDatetime: r.startDatetime,
          endDatetime: r.endDatetime,
          worker_limit: Number(r.worker_limit),
          hourlyRate: Number(r.hourlyRate || '40'),
          min_age: r.min_age ? Number(r.min_age) : undefined,
          sheet_file_id: r.sheet_file_id,
          calendar_event_ids: r.calendar_event_ids ? JSON.parse(r.calendar_event_ids) : [],
          status: r.status as any,
          signups_count: Number(r.signups_count || '0'),
          created_at: r.created_at
        };
      } catch (error: any) {
        Logger.error(new AppError(
          `Failed to process event row ${index}: ${error.message}`,
          'EVENT_DATA_PROCESSING_ERROR',
          {
            function: 'loadAllEvents',
            file: 'lib/events/repository.ts',
            additionalData: { rowIndex: index, rowData: r }
          }
        ));
        throw error;
      }
    });

    Logger.info('Successfully loaded events', { 
      eventCount: events.length,
      sheetId: sheetConfig.eventsMetadataSheetId 
    });

    return events;
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    
    const appError = new AppError(
      `Failed to load events: ${error.message}`,
      'EVENTS_LOAD_FAILED',
      {
        function: 'loadAllEvents',
        file: 'lib/events/repository.ts',
        additionalData: { originalError: error.message }
      }
    );
    Logger.error(appError);
    throw appError;
  }
}

export async function saveAllEvents(events: EventMeta[]) {
  try {
    Logger.debug('Saving all events to metadata sheet', { eventCount: events.length });
    
    const sheetConfig = env.getSheetConfig();
    // Serialize calendar_event_ids array for storage
    const serializedEvents = events.map(e => ({
      ...e,
      calendar_event_ids: JSON.stringify(e.calendar_event_ids)
    }));
    
    await overwriteAll(sheetConfig.eventsMetadataSheetId, META_HEADERS, serializedEvents);
    
    Logger.info('Successfully saved events', { 
      eventCount: events.length, 
      sheetId: sheetConfig.eventsMetadataSheetId 
    });
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    
    const appError = new AppError(
      `Failed to save events: ${error.message}`,
      'EVENTS_SAVE_FAILED',
      {
        function: 'saveAllEvents',
        file: 'lib/events/repository.ts',
        additionalData: { eventCount: events.length, originalError: error.message }
      }
    );
    Logger.error(appError);
    throw appError;
  }
}

export function createEventMeta(params: {
  name: string; 
  startDate: string; 
  endDate: string;
  startTime: string; 
  endTime: string;
  worker_limit: number; 
  hourlyRate: number;
  sheet_file_id: string; 
  calendar_event_ids: string[];
  min_age?: number; // <--- 1. הוספנו את השדה להגדרות הפונקציה
}): EventMeta {
  // 2. חילצנו את min_age מתוך הפרמטרים
  const { name, startDate, endDate, startTime, endTime, worker_limit, hourlyRate, sheet_file_id, calendar_event_ids, min_age } = params;
  const startDatetime = `${startDate}T${startTime}:00`;
  const endDatetime = `${endDate}T${endTime}:00`;
  
  return {
    id: uuid(),
    name,
    startDate,
    endDate,
    startTime,
    endTime,
    startDatetime,
    endDatetime,
    worker_limit,
    hourlyRate,
    min_age, // <--- 3. הוספנו אותו לאובייקט שנשמר באקסל!
    sheet_file_id,
    calendar_event_ids,
    status: 'open',
    signups_count: 0,
    created_at: new Date().toISOString()
  };
}

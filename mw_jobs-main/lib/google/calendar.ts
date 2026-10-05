import { getAuthorizedApis } from './backendClient';

export interface DateRangeCalendarInput {
  summary: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  timezone?: string;
}

/**
 * Creates a single continuous calendar event from start date/time to end date/time
 * Returns array containing the calendar event ID
 */
export async function createCalendarEventsForDateRange(input: DateRangeCalendarInput): Promise<string[]> {
  const { calendar } = await getAuthorizedApis();
  const eventIds: string[] = [];
  
  // חיבור ישיר של תאריך ההתחלה לשעת ההתחלה, ותאריך הסיום לשעת הסיום
  const startIso = `${input.startDate}T${input.startTime}:00`;
  const endIso = `${input.endDate}T${input.endTime}:00`;
  
  // יצירת אירוע יחיד ורציף ביומן גוגל
  const res = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: startIso, timeZone: input.timezone || 'Asia/Jerusalem' },
      end: { dateTime: endIso, timeZone: input.timezone || 'Asia/Jerusalem' }
    }
  });
  
  eventIds.push(res.data.id!);
  
  return eventIds;
}

/**
 * Updates multiple calendar events with new details
 */
export async function updateCalendarEventsForDateRange(
  eventIds: string[],
  input: DateRangeCalendarInput
): Promise<string[]> {
  const { calendar } = await getAuthorizedApis();
  
  // First delete existing events
  await deleteCalendarEvents(eventIds);
  
  // Then create new events for the new date range
  return await createCalendarEventsForDateRange(input);
}

/**
 * Deletes multiple calendar events
 */
export async function deleteCalendarEvents(eventIds: string[]) {
  const { calendar } = await getAuthorizedApis();
  
  // Delete all events in parallel
  await Promise.all(
    eventIds.map(eventId => 
      calendar.events.delete({ calendarId: 'primary', eventId }).catch(error => {
        console.warn(`Failed to delete calendar event ${eventId}:`, error.message);
      })
    )
  );
}

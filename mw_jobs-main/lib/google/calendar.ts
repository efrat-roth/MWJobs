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
 * Creates separate calendar events for each day in the date range
 * Returns array of calendar event IDs
 */
export async function createCalendarEventsForDateRange(input: DateRangeCalendarInput): Promise<string[]> {
  const { calendar } = await getAuthorizedApis();
  const eventIds: string[] = [];
  
  // Generate all dates in the range
  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const startIso = `${dateStr}T${input.startTime}:00`;
    const endIso = `${dateStr}T${input.endTime}:00`;
    
    // Create event for this specific day
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: input.summary,
        description: input.description,
        start: { dateTime: startIso, timeZone: input.timezone || 'UTC' },
        end: { dateTime: endIso, timeZone: input.timezone || 'UTC' }
      }
    });
    
    eventIds.push(res.data.id!);
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
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

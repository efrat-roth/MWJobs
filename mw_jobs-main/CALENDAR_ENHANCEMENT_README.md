# Calendar Date Range Enhancement

## Overview
Updated the Google Calendar integration to create separate calendar events for each day in the event date range, while keeping all other functionality (sheets, dropdown, UI) exactly the same.

## What Changed

### Before
- **Single Calendar Event**: One calendar event spanning the entire date range
- **Example**: Event from Jan 15-17 → One 3-day calendar event

### After  
- **Multiple Daily Events**: Separate calendar event for each day in the range
- **Example**: Event from Jan 15-17 → Three separate calendar events:
  - "Event Name" (Jan 15, start time to end time)
  - "Event Name" (Jan 16, start time to end time) 
  - "Event Name" (Jan 17, start time to end time)

## Technical Implementation

### New Calendar Functions (`lib/google/calendar.ts`)

```typescript
// New function for creating multiple daily events
export async function createCalendarEventsForDateRange(input: DateRangeCalendarInput): Promise<string[]>

// New function for deleting multiple events
export async function deleteCalendarEvents(eventIds: string[])
```

### Updated Data Structure (`lib/types/index.ts`)

```typescript
export interface EventMeta {
  // ... existing fields ...
  calendar_event_id: string;           // Legacy: single event ID (backward compatibility)
  calendar_event_ids?: string[];       // New: multiple event IDs for date range events
}
```

### Updated Event Creation (`pages/api/events/add.ts`)

```typescript
// Creates separate calendar events for each day
const calendarEventIds = await createCalendarEventsForDateRange({
  summary: parsed.name,
  description: parsed.description || '',
  startDate: parsed.startDate,
  endDate: parsed.endDate, 
  startTime: parsed.startTime,
  endTime: parsed.endTime,
  timezone: 'Asia/Jerusalem'
});

// Stores multiple calendar event IDs
const meta = createEventMeta({
  // ... other fields ...
  calendar_event_ids: calendarEventIds
});
```

### Updated Event Deletion (`pages/api/events/delete.ts`)

```typescript
// Handles both legacy single events and new multiple events
if(ev.calendar_event_ids && ev.calendar_event_ids.length > 0) {
  await deleteCalendarEvents(ev.calendar_event_ids);
} else if(ev.calendar_event_id) {
  await deleteCalendarEvent(ev.calendar_event_id);
}
```

## What Stays the Same

✅ **Sheets Integration** - Still one sheet per event  
✅ **User Interface** - Dropdown shows events exactly as before  
✅ **Event Selection** - Users still select date ranges as before  
✅ **Admin Interface** - Event creation form unchanged  
✅ **Signup Process** - Registration process unchanged  
✅ **Event Metadata** - All event data stored the same way  

## Calendar Event Naming

Events are named with only the event name for clarity:
- **Calendar Event Name**: "Workshop Name" (same for all days)

## Backward Compatibility

- **Legacy Events**: Still work with single `calendar_event_id` 
- **New Events**: Use `calendar_event_ids` array
- **Data Migration**: Not required - both formats supported

## Example Scenarios

### Scenario 1: Single Day Event
- **Date Range**: Jan 15 - Jan 15
- **Calendar Events**: 1 event "Event Name"

### Scenario 2: Multi-Day Event  
- **Date Range**: Jan 15 - Jan 17
- **Calendar Events**: 3 events
  - "Event Name" (Jan 15, 09:00-17:00)
  - "Event Name" (Jan 16, 09:00-17:00) 
  - "Event Name" (Jan 17, 09:00-17:00)

### Scenario 3: Week-Long Event
- **Date Range**: Jan 15 - Jan 21  
- **Calendar Events**: 7 separate daily events, all named "Event Name"

## Benefits

🎯 **Better Calendar View**: Each day appears as separate event in calendar  
📅 **Clearer Scheduling**: Users see daily commitments instead of long blocks  
🔄 **Backward Compatible**: Existing events continue to work  
⚡ **No UI Changes**: Users don't see any difference in the app  
🛠️ **Maintainable**: Clean separation between calendar and app logic

## Testing

When creating new events:
1. **Admin creates event** with date range (e.g., Jan 15-17)
2. **Multiple calendar events** appear in Google Calendar
3. **Everything else works** exactly as before
4. **Deleting event** removes all associated calendar events

The enhancement is transparent to users while providing much better calendar organization! 📅✨

# Calendar Event Backward Compatibility Cleanup

## Overview
Cleaned up backward compatibility code related to calendar event handling. The system now exclusively uses the modern approach with `calendar_event_ids` array for date range events, removing all legacy single event support.

## Changes Made

### 1. Type Definitions (`lib/types/index.ts`)
- **Removed**: `calendar_event_id: string` field (legacy single event ID)
- **Updated**: `calendar_event_ids` is now required `string[]` instead of optional
- **Result**: Clean, modern interface without backward compatibility clutter

### 2. Event Repository (`lib/events/repository.ts`)
- **Removed**: Legacy field mappings in `loadAllEvents()` for old date/time format
- **Removed**: `calendar_event_id` from META_HEADERS
- **Simplified**: `calendar_event_ids` handling - no longer optional
- **Updated**: `createEventMeta()` now requires `calendar_event_ids` parameter
- **Removed**: Automatic population of `calendar_event_id` from first calendar event ID

### 3. Google Calendar API (`lib/google/calendar.ts`)
- **Removed**: `CalendarEventInput` interface (legacy single event)
- **Removed**: `createCalendarEvent()` function (legacy single event creation)
- **Removed**: `deleteCalendarEvent()` function (legacy single event deletion)
- **Kept**: `createCalendarEventsForDateRange()` and `deleteCalendarEvents()` (modern functions)

### 4. Event Deletion API (`pages/api/events/delete.ts`)
- **Removed**: Conditional logic for handling legacy `calendar_event_id`
- **Simplified**: Always uses `deleteCalendarEvents()` with `calendar_event_ids` array
- **Removed**: Import of legacy `deleteCalendarEvent` function

### 5. Bootstrap Scripts
- **Updated**: `scripts/bootstrap.ts` - metadata headers now use modern field names
- **Updated**: `scripts/bootstrap-minimal.ts` - removed `calendar_event_id` from headers
- **Updated**: `scripts/bootstrap-standalone.ts` - removed `calendar_event_id` from headers

### 6. File Removal
- **Deleted**: `lib/events/types.ts` (deprecated re-export file)

## What Was Removed

### Legacy Fields
- `calendar_event_id: string` - Single calendar event ID
- Backward compatibility mappings for `date`, `time`, `datetime` fields

### Legacy Functions
- `createCalendarEvent()` - Single event creation
- `deleteCalendarEvent()` - Single event deletion

### Legacy Logic
- Conditional calendar event deletion (single vs multiple)
- Automatic population of `calendar_event_id` from `calendar_event_ids[0]`
- Optional `calendar_event_ids` handling

## Current Clean State

### Event Creation Flow
1. Admin creates event with date range
2. `createCalendarEventsForDateRange()` creates separate calendar events for each day
3. All calendar event IDs stored in required `calendar_event_ids[]` array
4. Event metadata saved with modern field structure

### Event Deletion Flow
1. Event deletion requested
2. `deleteCalendarEvents()` removes all calendar events using `calendar_event_ids[]`
3. Event marked as deleted

### Data Structure
```typescript
interface EventMeta {
  // ... other fields ...
  calendar_event_ids: string[];  // Required array of calendar event IDs
  // No legacy calendar_event_id field
}
```

## Benefits of Cleanup

✅ **Simpler Code**: Removed conditional logic and legacy field handling  
✅ **Type Safety**: Required `calendar_event_ids` prevents undefined array issues  
✅ **Consistency**: All events now use the same modern data structure  
✅ **Maintainability**: Single code path for calendar event operations  
✅ **Performance**: No unnecessary field mapping or compatibility checks  

## Migration Notes

Since you mentioned the system is not in real use yet, no data migration was necessary. All new events will use the clean, modern structure from the start.

## Files Modified

- `lib/types/index.ts`
- `lib/events/repository.ts`
- `lib/google/calendar.ts`
- `pages/api/events/delete.ts`
- `scripts/bootstrap.ts`
- `scripts/bootstrap-minimal.ts`
- `scripts/bootstrap-standalone.ts`

## Files Removed

- `lib/events/types.ts` (deprecated re-export file)

The codebase is now clean, consistent, and ready for production use! 🎉

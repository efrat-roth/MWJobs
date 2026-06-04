# Event Editing and Freeze Feature Implementation

## Overview
This implementation adds comprehensive event editing capabilities and a freeze/unfreeze functionality to the MW Jobs system. The changes are designed to be robust, maintain data integrity, and provide a seamless user experience.

## New Features

### 1. Event Editing
Administrators can now edit the following event properties:
- **Start Date & End Date**: Changes automatically update calendar events
- **Start Time & End Time**: Changes automatically update calendar events  
- **Worker Limit**: Affects event capacity and status calculation
- **Freeze Status**: Controls signup availability

### 2. Freeze/Unfreeze Events
- Events can be temporarily frozen to prevent new signups
- Frozen events show "לא זמין" (Unavailable) instead of "מלא" (Full) to users
- Only events that are currently accepting signups can be frozen/unfrozen
- Freeze status is preserved across status calculations

## Technical Implementation

### Database Schema Changes
Added `is_frozen` field to the EventMeta interface:
```typescript
interface EventMeta {
  // ... existing fields ...
  is_frozen?: boolean;
}
```

### API Changes

#### New Endpoint: `/api/events/update`
- **Methods**: PUT, PATCH
- **Authentication**: Admin only
- **Features**:
  - Smart calendar event updates when dates/times change
  - Intelligent status recalculation
  - Validation for date/time consistency
  - Partial update support (only send changed fields)

#### Updated Endpoint: `/api/events/get`
- Enhanced to handle frozen events in status calculation
- Returns `is_frozen` field for admin view
- Filters frozen events appropriately for public view

#### Updated Endpoint: `/api/signup`  
- Rejects registrations for frozen events
- Clear error messages for unavailable events

### Smart Status Management
The system intelligently manages event status with the following logic:
1. **Past Events**: Automatically archived regardless of other conditions
2. **Frozen Events**: Status preserved, no automatic full/open transitions
3. **Capacity Changes**: Auto-transitions between open/full based on worker limit changes
4. **Date/Time Changes**: Status recalculated based on new temporal context

### Calendar Integration
- **Date/Time Changes**: Automatically deletes old calendar events and creates new ones
- **Error Tolerance**: Calendar update failures don't prevent event updates
- **Multi-day Support**: Handles date range events correctly
- **Timezone Awareness**: Uses 'Asia/Jerusalem' timezone

### Frontend Enhancements

#### Admin Interface
- **Inline Editing**: Edit events directly in the admin table
- **Freeze Controls**: One-click freeze/unfreeze for available events
- **Visual Feedback**: Color-coded status badges and action buttons
- **Validation**: Client-side validation for date/time consistency
- **Responsive Design**: Mobile-friendly edit controls

#### User Interface  
- **Availability Indicators**: Clear distinction between "מלא" and "לא זמין"
- **Disabled State**: Frozen events are visually disabled in selection
- **Status Colors**: Orange for unavailable, red for full events

## Data Flow

### Event Update Process
1. **Validation**: Zod schema validates input data
2. **Authorization**: Admin-only access verification  
3. **Change Detection**: Compare new values with existing event
4. **Calendar Updates**: Update Google Calendar if dates/times changed
5. **Status Calculation**: Recalculate event status based on new conditions
6. **Persistence**: Save updated event to Google Sheets
7. **Response**: Return updated event data

### Freeze/Unfreeze Process
1. **Eligibility Check**: Verify event is eligible for freeze operations
2. **Status Toggle**: Toggle freeze state
3. **Persistence**: Save change to database
4. **UI Feedback**: Update interface with success message

## Security Considerations
- **Admin-Only Access**: All editing functions require admin authentication
- **Input Validation**: Comprehensive validation prevents invalid data
- **Error Handling**: Graceful degradation when external services fail
- **Audit Trail**: All changes logged with request IDs

## Backward Compatibility
- **Existing Events**: All existing events work without migration
- **Default Values**: `is_frozen` defaults to `false` for existing events
- **API Compatibility**: Public APIs maintain same response structure
- **Bootstrap Scripts**: Updated to include new field in metadata

## UI/UX Features

### Admin Table Enhancements
- **Edit Mode**: Click "ערוך" to enter inline edit mode
- **Save/Cancel**: Clear actions with visual confirmation
- **Field Validation**: Real-time validation feedback
- **Freeze Button**: Context-aware freeze/unfreeze controls
- **Status Badges**: Enhanced with freeze status indication

### Visual Design
- **Color Coding**: 
  - Blue: Frozen status
  - Orange: Unavailable indicator
  - Red: Full indicator
  - Green: Open status
- **Button Hierarchy**: Primary, secondary, warning, and danger states
- **Responsive Layout**: Maintains usability on all screen sizes

## Error Handling
- **Calendar Failures**: Event updates continue even if calendar sync fails
- **Validation Errors**: Clear Hebrew error messages
- **Network Issues**: Proper error states and retry mechanisms
- **Data Consistency**: Atomic updates where possible

## Performance Optimizations
- **Selective Updates**: Only changed fields are updated
- **Efficient Calendar Sync**: Batch operations where possible
- **Optimistic UI**: Immediate feedback with background processing
- **Minimal Data Transfer**: Partial updates reduce bandwidth

## Testing Considerations
- **Edge Cases**: Past events, capacity changes, date range validation
- **Calendar Integration**: Multi-day events, timezone handling
- **User Experience**: Frozen event behavior, admin workflows
- **Data Integrity**: Status calculations, field validation

## Future Enhancements
1. **Bulk Operations**: Edit multiple events simultaneously
2. **Recurring Events**: Support for repeating event patterns
3. **Notification System**: Email alerts for status changes
4. **Audit Log**: Detailed change history tracking
5. **Advanced Permissions**: Role-based access control

## Files Modified
- `lib/types/index.ts` - Added freeze field to interfaces
- `lib/events/repository.ts` - Updated data handling for freeze field
- `lib/google/calendar.ts` - Added calendar update functionality
- `pages/api/events/update.ts` - New event update endpoint
- `pages/api/events/get.ts` - Enhanced for freeze status handling
- `pages/api/signup.ts` - Rejects frozen events
- `pages/admin/index.tsx` - Complete admin UI redesign with editing
- `pages/index.tsx` - Updated user interface for frozen events
- `styles/admin.css` - New styles for edit functionality
- `styles/main.css` - Added unavailable indicator styles
- `scripts/bootstrap*.ts` - Updated metadata headers

This implementation provides a comprehensive, user-friendly, and robust event management system that maintains data integrity while offering powerful administrative controls.

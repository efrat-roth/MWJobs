import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth/authOptions';
import { loadAllEvents, saveAllEvents } from '../../../lib/events/repository';
import { updateCalendarEventsForDateRange } from '../../../lib/google/calendar';
import { createApiHandler, validateSchema } from '../../../lib/utils/api';
import { z } from 'zod';
import { Logger, AppError } from '../../../lib/util/logger';
import { isFuture } from '../../../lib/util/time';

const updateEventSchema = z.object({
  id: z.string().min(1, "Event ID is required"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format").optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format").optional(),
  workerLimit: z.number().int().positive().max(500, "Worker limit cannot be more than 500").optional(),
  hourlyRate: z.number().min(0).optional(),
  status: z.enum(['open', 'full', 'archived', 'deleted', 'frozen']).optional()
}).refine(data => {
  // If both dates are provided, ensure end date is not before start date
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    return endDate >= startDate;
  }
  return true;
}, {
  message: "End date must be equal to or after start date",
  path: ["endDate"]
}).refine(data => {
  // If same date and both times provided, ensure end time is after start time
  if (data.startDate && data.endDate && data.startTime && data.endTime && data.startDate === data.endDate) {
    const startTime = data.startTime.split(':').map(Number);
    const endTime = data.endTime.split(':').map(Number);
    if (startTime.length === 2 && endTime.length === 2) {
      const startMinutes = startTime[0]! * 60 + startTime[1]!;
      const endMinutes = endTime[0]! * 60 + endTime[1]!;
      return endMinutes > startMinutes;
    }
  }
  return true;
}, {
  message: "End time must be after start time on the same day",
  path: ["endTime"]
});

interface UpdateEventRequest {
  id: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  workerLimit?: number;
  hourlyRate?: number;
  status?: 'open' | 'full' | 'archived' | 'deleted' | 'frozen';
}

export default createApiHandler(async (req, res) => {
  const validation = validateSchema<UpdateEventRequest>(updateEventSchema, 'Invalid update data');
  const parsed = validation(req);
  
  Logger.info('Processing event update request', { 
    requestId: req.requestId,
    updateFields: Object.keys(req.body).filter(k => k !== 'id')
  });

  const events = await loadAllEvents();
  const eventIndex = events.findIndex(e => e.id === parsed.id);
  
  if (eventIndex === -1) {
    return res.status(404).json({ 
      error: 'Event not found',
      message: 'The specified event does not exist',
      requestId: req.requestId
    });
  }

  const event = events[eventIndex]!;
  
  // Store original values for comparison
  const originalStartDate = event.startDate;
  const originalEndDate = event.endDate;
  const originalStartTime = event.startTime;
  const originalEndTime = event.endTime;
  const originalWorkerLimit = event.worker_limit;
  const originalHourlyRate = event.hourlyRate;
  const originalStatus = event.status;

  // Update event fields
  if (parsed.startDate !== undefined) event.startDate = parsed.startDate;
  if (parsed.endDate !== undefined) event.endDate = parsed.endDate;
  if (parsed.startTime !== undefined) event.startTime = parsed.startTime;
  if (parsed.endTime !== undefined) event.endTime = parsed.endTime;
  if (parsed.workerLimit !== undefined) event.worker_limit = parsed.workerLimit;
  if (parsed.hourlyRate !== undefined) event.hourlyRate = parsed.hourlyRate; 
  if (parsed.status !== undefined) event.status = parsed.status;

  // Update combined datetime fields
  event.startDatetime = `${event.startDate}T${event.startTime}:00`;
  event.endDatetime = `${event.endDate}T${event.endTime}:00`;

  // Check if calendar events need updating (date or time changed)
  const dateTimeChanged = 
    originalStartDate !== event.startDate ||
    originalEndDate !== event.endDate ||
    originalStartTime !== event.startTime ||
    originalEndTime !== event.endTime;

  if (dateTimeChanged && event.calendar_event_ids.length > 0) {
    try {
      Logger.info('Updating calendar events due to date/time change', {
        requestId: req.requestId,
        eventId: event.id,
        oldDateRange: `${originalStartDate} to ${originalEndDate}`,
        newDateRange: `${event.startDate} to ${event.endDate}`,
        oldTimeRange: `${originalStartTime}-${originalEndTime}`,
        newTimeRange: `${event.startTime}-${event.endTime}`
      });

      const newCalendarEventIds = await updateCalendarEventsForDateRange(
        event.calendar_event_ids,
        {
          summary: event.name,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          timezone: 'Asia/Jerusalem'
        }
      );
      
      event.calendar_event_ids = newCalendarEventIds;
      
      Logger.info('Calendar events updated successfully', {
        requestId: req.requestId,
        eventId: event.id,
        newCalendarEventCount: newCalendarEventIds.length
      });
    } catch (error: any) {
      const appError = new AppError(
        `Failed to update calendar events: ${error.message}`,
        'CALENDAR_UPDATE_FAILED',
        {
          function: 'updateEvent',
          file: 'pages/api/events/update.ts',
          requestId: req.requestId,
          additionalData: { 
            eventId: event.id,
            originalError: error.message 
          }
        }
      );
      Logger.error(appError);
      // Continue with the update even if calendar fails
    }
  }

  // Update event status based on new conditions (only if status wasn't explicitly set)
  if (parsed.status === undefined) {
    const wasAtCapacity = originalWorkerLimit <= event.signups_count;
    const isNowAtCapacity = event.worker_limit <= event.signups_count;
    const isPastEvent = !isFuture(event.endDate);
    
    // Smart status update logic
    if (isPastEvent) {
      event.status = 'archived';
    } else if (event.status === 'frozen') {
      // Keep frozen status unless explicitly changed
    } else {
      // Apply normal capacity-based status logic for open/full events
      if (isNowAtCapacity && event.status === 'open') {
        event.status = 'full';
      } else if (!isNowAtCapacity && event.status === 'full') {
        event.status = 'open';
      }
    }
  }

  // Save updated events
  await saveAllEvents(events);

  Logger.info('Event updated successfully', {
    requestId: req.requestId,
    eventId: event.id,
    updatedFields: Object.keys(req.body).filter(k => k !== 'id'),
    statusChange: event.status,
    calendarUpdated: dateTimeChanged
  });

  return res.json({
    ok: true,
    data: { event },
    message: 'Event updated successfully'
  });
}, {
  allowedMethods: ['PUT', 'PATCH'],
  requiresAdmin: true
});

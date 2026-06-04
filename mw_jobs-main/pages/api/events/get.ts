import type { NextApiRequest, NextApiResponse } from 'next';
import { loadAllEvents } from '../../../lib/events/repository';
import { isFuture } from '../../../lib/util/time';
import { Logger, AppError } from '../../../lib/util/logger';
import { formatDateRangeDisplay, formatTimeRangeDisplay } from '../../../lib/utils/common';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  try {
    Logger.info('Processing events/get request', { 
      requestId, 
      isAdmin: !!req.query.admin,
      userAgent: req.headers['user-agent'],
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    const isAdmin = !!req.query.admin;
    
    Logger.debug('Loading all events', { requestId });
    const events = await loadAllEvents();
    
    Logger.debug('Filtering events', { 
      requestId, 
      totalEvents: events.length, 
      isAdmin 
    });

    const now = new Date();
    const future = events
      .filter(e => {
        // Use endDate for filtering - event is available until end date passes
        const isFutureEvent = isFuture(e.endDate);
        const isNotDeleted = e.status !== 'deleted';
        return isFutureEvent && isNotDeleted;
      })
      .map(e => {
        const isFull = e.signups_count >= e.worker_limit || e.status === 'full' || e.status === 'frozen';
        const dateRange = formatDateRangeDisplay(e.startDate, e.endDate);
        const timeRange = formatTimeRangeDisplay(e.startTime, e.endTime);
        
        return {
          ...e,
          isFull,
          label: `${e.name} ${dateRange}`,
          displayText: `${e.name}\n${dateRange}\n${timeRange}`
        };
      })
      .sort((a,b)=> a.startDate.localeCompare(b.startDate));

    Logger.debug('Processed events', { 
      requestId, 
      futureEvents: future.length,
      isAdmin 
    });

    if (isAdmin) {
      Logger.info('Returning admin view of events', { 
        requestId, 
        eventCount: future.length 
      });
      return res.json({ events: future });
    }

    // For public: show open, full, and frozen events (but not archived/deleted)
    const publicEvents = future
      .filter(e=> e.status === 'open' || e.status === 'full' || e.status === 'frozen')
      .map(e=>({
        id: e.id,
        name: e.name,
        startDate: e.startDate,
        endDate: e.endDate,
        startTime: e.startTime,
        endTime: e.endTime,
        worker_limit: e.worker_limit,
        hourlyRate: e.hourlyRate,
        signups_count: e.signups_count,
        isFull: e.signups_count >= e.worker_limit || e.status === 'frozen',
        label: e.label,
        displayText: e.displayText,
        status: e.status
      }));

    Logger.info('Returning public view of events', { 
      requestId, 
      eventCount: publicEvents.length 
    });

    return res.json({ events: publicEvents });
    
  } catch (error: any) {
    Logger.error(error, { 
      requestId, 
      function: 'handler',
      file: 'pages/api/events/get.ts',
      additionalData: {
        endpoint: '/api/events/get',
        method: req.method,
        query: req.query
      }
    });

    // Return appropriate error response
    if (error instanceof AppError) {
      switch (error.code) {
        case 'GOOGLE_OAUTH_TOKEN_EXPIRED':
          return res.status(503).json({ 
            error: 'Service temporarily unavailable', 
            message: 'Google authentication needs to be refreshed',
            code: 'AUTH_EXPIRED',
            requestId 
          });
        case 'MISSING_ENVIRONMENT_VARIABLE':
          return res.status(500).json({ 
            error: 'Server configuration error', 
            message: 'Required configuration is missing',
            code: 'CONFIG_ERROR',
            requestId 
          });
        default:
          return res.status(500).json({ 
            error: 'Internal server error', 
            message: 'Failed to load events',
            code: error.code,
            requestId 
          });
      }
    }

    // Fallback for unknown errors
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      requestId 
    });
  }
}

function formatDateDisplay(dateStr: string) {
  const [y,m,d]=dateStr.split('-');
  return `${d}/${m}`;
}

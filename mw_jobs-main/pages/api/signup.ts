import type { NextApiRequest, NextApiResponse } from 'next';
import { signupSchema } from '../../lib/events/validation';
import { loadAllEvents, saveAllEvents } from '../../lib/events/repository';
import { readAll, overwriteAll } from '../../lib/google/sheets';
import { createApiHandler, validateSchema } from '../../lib/utils/api';
import { env } from '../../lib/config/environment';
import { Logger } from '../../lib/util/logger';
import { HTTP_STATUS, type ApiResponse, type SignupRequest } from '../../lib/types';

export default createApiHandler(async (req, res) => {
  const validation = validateSchema<SignupRequest>(signupSchema, 'Invalid signup data');
  const parsed = validation(req);
  const sheetConfig = env.getSheetConfig();

  Logger.info('Processing multiple event signup request', {
    requestId: req.requestId,
    eventIds: parsed.eventIds,
    fullName: parsed.fullName,
    eventCount: parsed.eventIds.length
  });

  const events = await loadAllEvents();
  const signupResults = [];
  const errors = [];
  
  // Process each selected event
  for (const eventId of parsed.eventIds) {
    try {
      const eventIndex = events.findIndex(e => e.id === eventId);
      
      if (eventIndex === -1) {
        errors.push(`Event ${eventId} not found`);
        continue;
      }

      const event = events[eventIndex]!;
      
      if (event.status === 'deleted' || event.status === 'archived') {
        errors.push(`Event "${event.name}" is no longer accepting registrations`);
        continue;
      }
      
      if (event.status === 'frozen') {
        errors.push(`Event "${event.name}" is currently unavailable for signup`);
        continue;
      }
      
      if (event.signups_count >= event.worker_limit) {
        errors.push(`Event "${event.name}" has reached its capacity`);
        continue;
      }

      // Update event sheet
      const eventSheet = await readAll(event.sheet_file_id);
      const eventHeaders = eventSheet.headers.length ? eventSheet.headers : ['full_name','phone','id','city','date_of_birth','signed_at'];
      let updatedRows = eventSheet.rows;
      const nowIso = new Date().toISOString();
      const existingIdx = updatedRows.findIndex(r => r.id === parsed.idNumber);
      const newRow = { 
        full_name: parsed.fullName, 
        phone: parsed.phone, 
        id: parsed.idNumber, 
        city: parsed.city, 
        date_of_birth: parsed.dateOfBirth,
        signed_at: nowIso 
      };
      
      if (existingIdx === -1) {
        updatedRows.push(newRow);
      } else {
        updatedRows[existingIdx] = newRow;
      }
      
      await overwriteAll(event.sheet_file_id, eventHeaders, updatedRows);

      // Update signup count and status
      const uniqueCount = updatedRows.length;
      event.signups_count = uniqueCount;
      if (uniqueCount >= event.worker_limit) {
        event.status = 'full';
      }

      signupResults.push({
        eventId: event.id,
        eventName: event.name,
        status: 'success'
      });

      Logger.info('Successfully signed up for event', {
        requestId: req.requestId,
        eventId: event.id,
        eventName: event.name,
        newSignupCount: uniqueCount
      });

    } catch (error: any) {
      Logger.error(error, {
        requestId: req.requestId,
        additionalData: {
          eventId: eventId,
          fullName: parsed.fullName
        }
      });
      errors.push(`Failed to register for event ${eventId}: ${error.message}`);
    }
  }

  // Update master leads sheet (once for all events)
  try {
    const leadsSheet = await readAll(sheetConfig.leadsSheetId);
    const leadsHeaders = leadsSheet.headers.length ? leadsSheet.headers : ['full_name','phone','id','city','date_of_birth','last_updated'];
    let leadsRows = leadsSheet.rows;
    const leadsIdx = leadsRows.findIndex(r => r.id === parsed.idNumber);
    const nowIso = new Date().toISOString();
    const leadsRow = { 
      full_name: parsed.fullName, 
      phone: parsed.phone, 
      id: parsed.idNumber, 
      city: parsed.city, 
      date_of_birth: parsed.dateOfBirth,
      last_updated: nowIso 
    };
    
    if (leadsIdx === -1) {
      leadsRows.push(leadsRow);
    } else {
      leadsRows[leadsIdx] = leadsRow;
    }
    
    await overwriteAll(sheetConfig.leadsSheetId, leadsHeaders, leadsRows);
  } catch (error: any) {
    Logger.error(error, {
      requestId: req.requestId,
      additionalData: {
        context: 'leads_sheet_update'
      }
    });
    errors.push(`Failed to update master leads: ${error.message}`);
  }

  // Save updated events
  if (signupResults.length > 0) {
    try {
      await saveAllEvents(events);
    } catch (error: any) {
      Logger.error(error, {
        requestId: req.requestId,
        additionalData: {
          context: 'save_events'
        }
      });
      errors.push(`Failed to save event updates: ${error.message}`);
    }
  }

  Logger.info('Multiple event signup completed', {
    requestId: req.requestId,
    successCount: signupResults.length,
    errorCount: errors.length,
    totalAttempted: parsed.eventIds.length
  });

  // Determine response based on results
  if (signupResults.length === 0) {
    // All failed
    const errorResponse: ApiResponse = {
      error: 'Registration failed',
      message: `Failed to register for any events: ${errors.join('; ')}`,
      requestId: req.requestId
    };
    return res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse);
  } else if (errors.length === 0) {
    // All succeeded
    const successResponse: ApiResponse = {
      ok: true,
      message: `Successfully registered for ${signupResults.length} event(s)`,
      data: { results: signupResults }
    };
    res.json(successResponse);
  } else {
    // Partial success
    const partialResponse: ApiResponse = {
      ok: true,
      message: `Registered for ${signupResults.length} of ${parsed.eventIds.length} events`,
      data: { 
        results: signupResults,
        errors: errors 
      }
    };
    res.json(partialResponse);
  }
}, {
  allowedMethods: ['POST']
});

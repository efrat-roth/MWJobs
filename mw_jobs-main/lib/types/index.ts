/**
 * Consolidated type definitions for the MW Jobs application
 * This file contains all shared types to avoid duplication
 */

// Authentication and Session Types
export interface CustomSession {
  user?: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  isAdmin?: boolean;
}

// Event-related Types
export interface EventMeta {
  id: string;
  name: string;
  startDate: string;      // YYYY-MM-DD
  endDate: string;        // YYYY-MM-DD
  startTime: string;      // HH:MM (24h)
  endTime: string;        // HH:MM (24h)
  startDatetime: string;  // ISO combined (UTC or local chosen)
  endDatetime: string;    // ISO combined (UTC or local chosen)
  worker_limit: number;
  hourlyRate: number;
  sheet_file_id: string;
  calendar_event_ids: string[];        // Multiple event IDs for date range events
  status: EventStatus;
  signups_count: number;
  created_at: string;
  
}

export type EventStatus = 'open' | 'full' | 'archived' | 'deleted' | 'frozen';

export interface EventItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
  worker_limit: number;
  hourlyRate: number;
  signups_count: number;
  isFull: boolean;
  label: string;
  displayText: string;  // For the multi-line display
}

export interface AdminEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  status: string;
  worker_limit: number;
  hourlyRate: number;
  signups_count: number;
}

// Form Types
export interface SignupForm {
  fullName: string;
  idNumber: string;
  phone: string;
  city: string;
  dateOfBirth: string;
  eventIds: string[];  // Changed from single eventId to multiple eventIds
}

export interface AdminEventForm {
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  workerLimit: number;
  hourlyRate: number;
  description: string;
}

// API Request/Response Types
export interface SignupRequest extends SignupForm {
  eventIds: string[];
}

export interface AddEventRequest {
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  workerLimit: number;
  hourlyRate: number;
  description?: string;
}

export interface DeleteEventRequest {
  id: string;
}

export interface ApiResponse<T = any> {
  ok?: boolean;
  success?: boolean;
  error?: string;
  errors?: string[];
  message?: string;
  data?: T;
  requestId?: string;
}

export interface EventsResponse {
  events: EventItem[] | AdminEvent[];
}

// Google API Types
export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  refreshToken?: string;
}

export interface CalendarEventData {
  summary: string;
  description: string;
  startIso: string;
  endIso: string;
  timezone: string;
}

// Sheet Data Types
export interface SheetRow {
  [key: string]: string;
}

export interface SheetData {
  headers: string[];
  rows: SheetRow[];
}

// Validation Schema Types (for runtime validation)
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Error Handling Types
export interface ErrorContext {
  function: string;
  file: string;
  userId?: string;
  requestId?: string;
  additionalData?: any;
}

export interface AppErrorDetails {
  code: string;
  context: ErrorContext;
  timestamp: Date;
  isOperational: boolean;
}

// Environment Configuration Types
export interface EnvironmentVariables {
  GOOGLE_BACKEND_CLIENT_ID: string;
  GOOGLE_BACKEND_CLIENT_SECRET: string;
  GOOGLE_BACKEND_REFRESH_TOKEN: string;
  EVENTS_METADATA_SHEET_ID: string;
  LEADS_SHEET_ID: string;
  EVENTS_FOLDER_ID: string;
  ADMIN_EMAIL: string;
  CLEANUP_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  NEXTAUTH_SECRET?: string;
  NEXTAUTH_URL?: string;
}

// UI State Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface FormState<T> {
  data: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Time Utility Types
export interface DateTimeInfo {
  date: string;      // YYYY-MM-DD
  time: string;      // HH:MM
  datetime: string;  // ISO string
  isFuture: boolean;
  daysSince?: number;
}

// Constants
export const EVENT_STATUSES = {
  OPEN: 'open' as const,
  FULL: 'full' as const,
  ARCHIVED: 'archived' as const,
  DELETED: 'deleted' as const
} as const;

export const API_METHODS = {
  GET: 'GET' as const,
  POST: 'POST' as const,
  PUT: 'PUT' as const,
  DELETE: 'DELETE' as const,
  PATCH: 'PATCH' as const
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  INTERNAL_SERVER_ERROR: 500
} as const;

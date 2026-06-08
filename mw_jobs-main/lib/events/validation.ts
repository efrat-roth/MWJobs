import { z } from 'zod';

export const addEventSchema = z.object({
  name: z.string().min(3, "שם האירוע חייב להכיל לפחות 3 תווים").max(120, "שם האירוע ארוך מדי - מקסימום 120 תווים"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך התחלה חייב להיות בפורמט YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך סיום חייב להיות בפורמט YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "שעת התחלה חייבת להיות בפורמט HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "שעת סיום חייבת להיות בפורמט HH:MM"),
  workerLimit: z.number().int().positive().max(500, "מספר עובדים מקסימלי לא יכול להיות יותר מ-500"),
  description: z.string().optional(),
  hourlyRate: z.number().min(0, "מחיר לא יכול להיות שלילי"),
  clientEmail: z.string().email('Invalid email address').optional()
}).refine(data => {
  // Ensure end date is not before start date
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  return endDate >= startDate;
}, {
  message: "תאריך סיום חייב להיות שווה או אחרי תאריך ההתחלה",
  path: ["endDate"]
}).refine(data => {
  // If same date, ensure end time is after start time
  if (data.startDate === data.endDate) {
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
  message: "שעת סיום חייבת להיות אחרי שעת ההתחלה באותו יום",
  path: ["endTime"]
});

export const signupSchema = z.object({
  eventIds: z.array(z.string()).min(1, "יש לבחור לפחות אירוע אחד"),
  fullName: z.string().min(2, "שם מלא חייב להכיל לפחות 2 תווים"),
  idNumber: z.string()
    .regex(/^\d{9}$/, "מספר זהות חייב להכיל 9 ספרות בדיוק"),
  phone: z.string()
    .regex(/^[0-9\-\+\s\(\)]{10,15}$/, "מספר טלפון לא תקין - השתמש רק בספרות ותווי הפרדה"),
  city: z.string().min(2, "עיר מגורים חייבת להכיל לפחות 2 תווים"),
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לידה חייב להיות בפורמט YYYY-MM-DD")
    .refine(dateStr => {
      const birthDate = new Date(dateStr);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      
      // Calculate exact age
      const exactAge = age - ((monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? 1 : 0);
      return exactAge >= 18;
    }, "חייב להיות בן 18 לפחות")
});

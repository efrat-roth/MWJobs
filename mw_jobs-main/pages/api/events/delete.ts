import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth/authOptions';
import { loadAllEvents, saveAllEvents } from '../../../lib/events/repository';
import { deleteFile } from '../../../lib/google/drive';
import { deleteCalendarEvents } from '../../../lib/google/calendar';

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = await getServerSession(req,res,authOptions);
  if (!session || (session as any).user?.email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { id } = req.body as { id?: string };
  if(!id) return res.status(400).json({ error: 'Missing id' });
  const events = await loadAllEvents();
  const idx = events.findIndex(e=>e.id===id);
  if(idx === -1) return res.status(404).json({ error: 'Not found' });
  const ev = events[idx];
  if (!ev) return res.status(404).json({ error: 'Event not found' });
  try {
    if(ev.sheet_file_id) {
      await deleteFile(ev.sheet_file_id);
    }
    
    // Delete calendar events
    if(ev.calendar_event_ids && ev.calendar_event_ids.length > 0) {
      await deleteCalendarEvents(ev.calendar_event_ids);
    }
  } catch(e:any){
    // swallow but log
    console.error('Delete side-effects', e.message);
  }
  ev.status = 'deleted';
  await saveAllEvents(events);
  res.json({ ok:true });
}

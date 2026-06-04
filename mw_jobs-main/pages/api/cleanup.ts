import type { NextApiRequest, NextApiResponse } from 'next';
import { loadAllEvents, saveAllEvents } from '../../lib/events/repository';
import { daysSince, isFuture } from '../../lib/util/time';
import { deleteFile } from '../../lib/google/drive';

export default async function handler(req:NextApiRequest, res:NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const secret = req.headers['x-cleanup-secret'];
  if (secret !== process.env.CLEANUP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const events = await loadAllEvents();
    const now = new Date();
    for (const ev of events) {
      if (ev.status === 'deleted') continue;
      // Archive past events - based on end date
      if (!isFuture(ev.endDate) && ev.status !== 'archived') {
        ev.status = ev.status === 'full' ? 'archived' : 'archived';
      }
      // Delete sheet after 30 days from end date
      if (daysSince(ev.endDate) > 30 && ev.sheet_file_id) {
        try {
            await deleteFile(ev.sheet_file_id);
            ev.sheet_file_id = '';
        } catch(e:any){
            console.error('Failed to delete sheet', ev.id, e.message);
        }
      }
    }
    await saveAllEvents(events);
    res.json({ ok:true, processed: events.length });
  } catch(e:any){
    res.status(500).json({ error: e.message });
  }
}

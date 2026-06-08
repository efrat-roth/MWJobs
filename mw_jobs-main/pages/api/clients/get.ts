import { NextApiRequest, NextApiResponse } from 'next';
import { getAuthorizedApis } from '../../../lib/google/backendClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sheets } = await getAuthorizedApis();
    const sheetId = process.env.CLIENTS_SHEET_ID;

    if (!sheetId) {
      throw new Error('CLIENTS_SHEET_ID is not defined');
    }

    // קריאת הנתונים מלשונית Clients, עמודות A ו-B (מדלגים על שורת הכותרת)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Clients!A2:B', 
    });

    const rows = response.data.values || [];
    
    // ממירים את השורות למערך של אובייקטים שהטופס יודע לקרוא
    const clients = rows.map(row => ({
      name: row[0] || '',
      email: row[1] || ''
    })).filter(client => client.email !== ''); // מסננים שורות ריקות

    res.status(200).json({ clients });
  } catch (error: any) {
    console.error('Error fetching clients:', error.message);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
}
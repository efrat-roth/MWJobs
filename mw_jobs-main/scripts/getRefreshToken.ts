import { google } from 'googleapis';
import readline from 'readline';


async function getRefreshToken() {
  const clientId = process.env.GOOGLE_BACKEND_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_BACKEND_CLIENT_SECRET!;
  const redirectUri = 'urn:ietf:wg:oauth:2.0:oob';
  if(!clientId || !clientSecret) throw new Error('Missing backend client env vars');
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/calendar'
  ];
  const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes, prompt: 'consent' });
  console.log('Open this URL in your browser:\n', url);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Paste the code here: ', async (code) => {
    try {
      const { tokens } = await oauth2Client.getToken(code.trim());
      console.log('Tokens:', tokens);
      if (!tokens.refresh_token) {
        console.error('No refresh_token received; try again with prompt=consent and ensure not using same client that already granted offline access.');
      } else {
        console.log('REFRESH TOKEN:', tokens.refresh_token);
      }
    } catch (e:any) {
      console.error(e.message);
    } finally {
      rl.close();
    }
  });
}

// Check if running directly
if (require.main === module) {
  // Load environment variables from .env.local
  const path = require('path');
  const fs = require('fs');
  
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line: string) => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
  
  getRefreshToken().catch(console.error);
}

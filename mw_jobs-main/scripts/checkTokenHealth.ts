import { google } from 'googleapis';

async function checkTokenHealth() {
  console.log('🔍 Checking Google OAuth Token Health...\n');

  const clientId = process.env.GOOGLE_BACKEND_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_BACKEND_CLIENT_SECRET!;
  const refreshToken = process.env.GOOGLE_BACKEND_REFRESH_TOKEN!;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Missing environment variables');
    return;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'urn:ietf:wg:oauth:2.0:oob'
    );
    
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    // Test token validity
    console.log('⏳ Testing token validity...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    console.log('✅ Token is valid!');
    console.log(`📅 Token expires: ${new Date(credentials.expiry_date!)}`);
    console.log(`🔑 Access token prefix: ${credentials.access_token?.substring(0, 20)}...`);
    
    // Check time until expiration
    const now = Date.now();
    const expiryTime = credentials.expiry_date!;
    const timeUntilExpiry = expiryTime - now;
    const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
    
    console.log(`⏰ Access token expires in: ${hoursUntilExpiry} hours`);
    
    if (hoursUntilExpiry < 1) {
      console.log('⚠️  Access token expires soon, but refresh token should handle it');
    }

    // Test a simple API call
    console.log('\n⏳ Testing Google Sheets API access...');
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    
    // Test with your actual spreadsheet ID
    const spreadsheetId = process.env.LEADS_SHEET_ID;
    const result = await sheets.spreadsheets.get({
      spreadsheetId,
      includeGridData: false
    });
    
    console.log('✅ Successfully accessed Google Sheets!');
    console.log(`📋 Spreadsheet title: ${result.data.properties?.title}`);
    console.log(`📊 Number of sheets: ${result.data.sheets?.length}`);

    console.log('\n🎉 All checks passed! Your OAuth setup is healthy.');
    
    // Provide guidance
    console.log('\n💡 To prevent token expiration in the future:');
    console.log('1. Go to: https://console.cloud.google.com/apis/credentials/consent');
    console.log(`2. Select your project with client ID: ${clientId.substring(0, 20)}...`);
    console.log('3. If status is "Testing", click "PUBLISH APP"');
    console.log('4. Production apps have much longer-lasting refresh tokens');

  } catch (error: any) {
    console.error('❌ Token check failed!');
    console.error(`Error: ${error.message}`);
    
    if (error.message.includes('invalid_grant')) {
      console.log('\n🔧 SOLUTION:');
      console.log('Your refresh token has expired. Run this command to get a new one:');
      console.log('npx ts-node --transpile-only scripts/getRefreshToken.ts');
      console.log('\nThen update your .env.local file with the new refresh token.');
      
      console.log('\n🛡️  PREVENTION:');
      console.log('1. Publish your app to production in Google Cloud Console');
      console.log('2. Production refresh tokens last 6+ months or indefinitely');
      console.log('3. Testing mode tokens expire much sooner (7 days)');
    }
  }
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
  
  checkTokenHealth().catch(console.error);
}

export { checkTokenHealth };

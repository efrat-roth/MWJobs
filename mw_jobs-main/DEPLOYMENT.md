# MW Jobs - Production Deployment Guide

## Deploy to Vercel

1. **Connect Repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `mw_jobs` repository

2. **Configure Environment Variables:**
   Add these environment variables in Vercel Dashboard:

   ```bash
   # NextAuth Configuration
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=your-nextauth-secret
   
   # Google OAuth (Frontend)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Google OAuth (Backend)
   GOOGLE_BACKEND_CLIENT_ID=your-backend-client-id
   GOOGLE_BACKEND_CLIENT_SECRET=your-backend-client-secret
   GOOGLE_BACKEND_REFRESH_TOKEN=your-refresh-token
   
   # Google Services
   EVENTS_FOLDER_ID=your-events-folder-id
   EVENTS_METADATA_SHEET_ID=your-metadata-sheet-id
   LEADS_SHEET_ID=your-leads-sheet-id
   
   # Admin Configuration
   ADMIN_EMAIL=your-admin-email@gmail.com
   
   # Cleanup Security
   CLEANUP_SECRET=your-cleanup-secret
   ```

3. **Deploy:**
   - Vercel will automatically build and deploy
   - Your app will be available at `https://your-app-name.vercel.app`

## Update Google Cloud OAuth Settings

After deployment, update your Google Cloud Console:

1. **OAuth Consent Screen:**
   - Application homepage link: `https://your-domain.vercel.app`
   - Privacy policy link: `https://your-domain.vercel.app/privacy`
   - Terms of service link: `https://your-domain.vercel.app/terms`

2. **OAuth Client Configuration:**
   - Authorized origins: `https://your-domain.vercel.app`
   - Authorized redirect URIs: `https://your-domain.vercel.app/api/auth/callback/google`

3. **Submit for Verification:**
   - Click "Prepare for verification" in Google Cloud Console
   - Fill in all required information
   - Submit for Google's review

## Post-Deployment Checklist

- [ ] App loads correctly at production URL
- [ ] Legal pages accessible (`/privacy`, `/terms`)
- [ ] Admin login works with Google OAuth
- [ ] Event creation and management functional
- [ ] User registration works
- [ ] Google Sheets integration working
- [ ] Google Calendar integration working

## Domain Setup (Optional)

If you want a custom domain:

1. Purchase domain from provider (GoDaddy, Namecheap, etc.)
2. In Vercel Dashboard, go to Domains
3. Add your custom domain
4. Update DNS records as instructed
5. Update Google Cloud OAuth settings with new domain

## Security Notes

- All sensitive environment variables are properly configured
- HTTPS is enforced by Vercel by default
- Security headers are configured in `next.config.js`
- Admin access is restricted to configured email only

## Support

For issues with deployment, contact: mwjobs95@gmail.com

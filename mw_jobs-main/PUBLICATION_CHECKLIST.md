# MW Jobs - Publication Checklist

## ✅ Application Requirements Completed

### Legal Pages
- [x] Privacy Policy (`/privacy`)
- [x] Terms of Service (`/terms`)
- [x] Footer links to legal pages

### Production Ready
- [x] Next.js production build successful
- [x] Security headers configured
- [x] SEO meta tags added
- [x] Vercel deployment configuration
- [x] Console logs removed in production

## 📋 Next Steps for Google Cloud Publishing

### 1. Deploy to Vercel
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Configure environment variables (see DEPLOYMENT.md)
4. Deploy and get your production URL

### 2. Update Google Cloud Console
Once deployed, update these settings in Google Cloud Console:

**OAuth Consent Screen - Branding:**
- Application name: `MW Jobs`
- User support email: `mwjobs95@gmail.com`
- Application homepage link: `https://your-domain.vercel.app`
- Application privacy policy link: `https://your-domain.vercel.app/privacy`
- Application terms of service link: `https://your-domain.vercel.app/terms`

**OAuth Client - Authorized URLs:**
- Authorized JavaScript origins: `https://your-domain.vercel.app`
- Authorized redirect URIs: `https://your-domain.vercel.app/api/auth/callback/google`

### 3. Submit for Verification
1. Click "Prepare for verification" in Google Cloud Console
2. Fill out the verification form with:
   - Your contact information
   - Detailed description of how you use each OAuth scope
   - Screenshots of your application
3. Submit for Google's review (typically takes 1-2 weeks)

### 4. Required OAuth Scopes Justification
When submitting for verification, explain each scope:

- **Google Sheets API**: Used to store event registrations and manage worker data
- **Google Drive API**: Used to create and organize event-specific spreadsheets
- **Google Calendar API**: Used to create calendar events for scheduled work events
- **User Profile Access**: Used for admin authentication and user identification

## 🚨 Important Notes

1. **Domain Consistency**: Make sure all URLs in Google Cloud Console match your actual deployed domain
2. **Environment Variables**: Double-check all environment variables are set correctly in Vercel
3. **Test Thoroughly**: Test all functionality after deployment before submitting for verification
4. **Backup Strategy**: Ensure you have backups of your Google Sheets and important data

## 📞 Support Contacts

- **Application Support**: mwjobs95@gmail.com
- **Technical Issues**: Contact through GitHub repository

---

Your application is now ready for production deployment and Google Cloud verification! 🎉

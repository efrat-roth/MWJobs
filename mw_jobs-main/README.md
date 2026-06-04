# Event Staffing System

Full implementation per specification.

## Structure

```
data/
  (Google Drive root folder - not in repo)
pages/
  index.tsx            # Landing page
  admin/index.tsx      # Admin dashboard (protected)
  api/
    events/
      get.ts
      add.ts
      delete.ts
    signup.ts
    cleanup.ts
lib/
  google/
    backendClient.ts   # OAuth2 client (service using admin refresh token)
    sheets.ts
    calendar.ts
    drive.ts
  auth/
    authOptions.ts     # NextAuth config
  events/
    repository.ts
    types.ts
    validation.ts
  util/
    time.ts
scripts/
  bootstrap.ts         # One-time creation of folders & sheets
  runCleanup.ts        # Local manual cleanup invocation
```

## Google Setup (Summary)

1. Create Google Cloud project.
2. Enable **Google Sheets API**, **Google Drive API**, **Google Calendar API**, **People API** (optional), **OAuth consent screen** (External, testing or production) with scopes:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/calendar`
3. Create **OAuth Client** (Web) for frontend (NextAuth).
   - Authorized origins: `http://localhost:3000`
   - Authorized redirect: `http://localhost:3000/api/auth/callback/google`
4. Create second OAuth Client (Web or Installed) for backend programmatic access OR reuse same one. Obtain **refresh token**:
   - Run a small auth script (not included) or use `scripts/getRefreshToken` you can add to request offline access.
   - Set `GOOGLE_BACKEND_CLIENT_ID/SECRET/REFRESH_TOKEN`.
5. `npm install`
6. Run `npm run dev`.
7. Sign in at `/admin` with admin Google; system will check `ADMIN_EMAIL`.
8. Run bootstrap script to create structure (or create manually):
   ```
   npm run bootstrap
   ```
   Copy printed IDs into `.env.local`.
9. Create events; they appear on landing page.

## Cleanup Job

Deploy Cloud Scheduler (or Cloud Function + scheduler) to POST `https://your-vercel-domain/api/cleanup` with header:
```
X-CLEANUP-SECRET: <CLEANUP_SECRET>
```

## Security Notes

- Only admin email can call add/delete endpoints (checked via NextAuth session).
- Cleanup endpoint requires secret header.
- Worker signup endpoint is public but validates event ID/date.
- Event sheets and leads update override existing row by ID.

## Extensibility

- Future: send WhatsApp, SMS after signup (add service and call after successful write).
- Add rate limiting (middleware) as needed.

Refer to inline comments for implementation details.

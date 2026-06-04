# Drive Scope Optimization

## Summary

This update allows your application to work with the **`drive.file`** scope only, removing the need for the broader **`auth/drive`** scope.

## What Changed

### 1. Updated `lib/google/drive.ts`
- Added proper error handling
- Enhanced logging
- All operations still work with `drive.file` scope:
  - ✅ `createSpreadsheetInFolder()` - creates files in existing folders
  - ✅ `deleteFile()` - deletes files created by the app

### 2. Created `scripts/bootstrap-minimal.ts`
- **No folder/file listing operations** (these require full `drive` scope)
- Uses existing folder/file IDs from environment variables
- Only initializes sheet headers if sheets are empty
- Run with: `npm run bootstrap:minimal`

### 3. Updated `package.json`
- Added new script: `bootstrap:minimal`

## Operations That Work with `drive.file` Scope

✅ **Allowed Operations:**
- Create files in existing folders (using folder ID)
- Read/write files created by your app
- Delete files created by your app
- Modify existing sheets (Leads, events_metadata)

❌ **Not Allowed (but not needed):**
- Search/list folders or files
- Create new folders
- Access files not created by your app

## Required Environment Variables

Make sure these are set in your `.env.local`:
```bash
DATA_ROOT_FOLDER_ID=your_root_folder_id
EVENTS_FOLDER_ID=your_events_folder_id
LEADS_SHEET_ID=your_leads_sheet_id
EVENTS_METADATA_SHEET_ID=your_metadata_sheet_id
```

## How to Update Google Cloud Console

1. Go to Google Cloud Console → APIs & Credentials → OAuth consent screen
2. Edit your OAuth consent screen
3. In the **Scopes** section, remove:
   ```
   https://www.googleapis.com/auth/drive
   ```
4. Keep only:
   ```
   https://www.googleapis.com/auth/drive.file
   https://www.googleapis.com/auth/spreadsheets
   https://www.googleapis.com/auth/calendar
   ```

## Testing the Changes

1. **Test minimal bootstrap:**
   ```bash
   npm run bootstrap:minimal
   ```

2. **Test main functionality:**
   - Create a new event (creates spreadsheet in events folder)
   - Sign up for an event (modifies spreadsheets)
   - Delete an event (deletes spreadsheet)

## Verification

Your app will now work with the more restrictive `drive.file` scope because:

1. **Folder structure already exists** - no need to create/search folders
2. **File IDs are known** - no need to list/search files  
3. **All operations are on files your app creates** - within `drive.file` scope permissions

This provides **better security** with **minimal permissions** while maintaining full functionality!

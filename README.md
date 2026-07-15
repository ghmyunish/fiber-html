# Fiber Factory Batch Tracking System

Static HTML dashboard for tracking fiber production, fiber sack storage, paper production, and paper sack storage with Supabase as the backend.

## What lives where

- `index.html` is the app entrypoint.
- `js/app.js` boots the app.
- `js/db.js` handles Supabase reads/writes/bootstrap checks.
- `js/domain.js` contains the business rules and derived calculations.
- `js/render.js` renders the tables and overview.
- `js/forms.js` binds form handlers and validation.
- `js/export.js` handles Excel export.
- `js/runtime-config.js` is generated at deploy time from environment variables.

## Netlify environment variables

Set these in Netlify:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Netlify will run `node scripts/generate-runtime-config.mjs` during build, which creates `js/runtime-config.js` from those variables.

## Local setup

1. Copy the example runtime config:

   ```bash
   cp js/runtime-config.example.js js/runtime-config.js
   ```

2. Edit `js/runtime-config.js` and paste your Supabase URL and anon key.

3. Make sure the database bootstrap SQL has been run once in Supabase:

   - `supabase-bootstrap.sql`

4. Serve the folder with any static server. Examples:

   ```bash
   python3 -m http.server 8000
   ```

   or

   ```bash
   npx serve .
   ```

5. Open `http://localhost:8000`.

## Notes

- This app does not use a framework or build step for the browser code.
- The only build-time step is generating `js/runtime-config.js` on Netlify.
- The app still runs from `index.html`.
- If `js/runtime-config.js` is missing, the app will show a setup banner and will not connect to Supabase.

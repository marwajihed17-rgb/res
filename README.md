
# Clone Design with Animation

  This is a code bundle for Clone Design with Animation. The original project is available at https://www.figma.com/design/TQivpyqLkq9cYZ6XtmlFAH/Clone-Design-with-Animation.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  
## Removed API Configurations

The project no longer includes server-side API routes. This simplifies deployment and focuses the app on a client-only architecture using the Google Sheets CSV for authentication and authorization.

Removed items (reversible):
- `api/auth.ts` (Auth endpoint reading Google Sheet)
- `api/send.ts` (Outgoing webhook sender)
- `api/receive.ts` (Webhook receiver)
- `api/chat/[module].ts` (Module chat handler)

Environment variables no longer in use:
- `SHEET_CSV_URL`
- `N8N_WEBHOOK_URL_INVOICE`
- `N8N_WEBHOOK_URL_KDR`
- `N8N_WEBHOOK_URL_GA`

If you need to reintroduce APIs later:
- Restore files from version control and ensure environment variables are set.
- Update `src/lib/auth.ts` to prefer the API path again (currently CSV-only).
  
# חיבור ישיר – אתר + Backend לידים
Requires Node 22.13+. No npm install needed.

## Run
1. `cp .env.example .env` and fill values (ADMIN_PASSWORD must be changed, otherwise /admin stays locked).
2. `node --env-file=.env server.js` then open http://localhost:3000
Serve behind HTTPS and persist the `data/` folder.

## Leads
Saved first in SQLite `data/leads.db`, table `leads` (id, created_at, first_name, last_name, phone, email, service, contact_consent, marketing_consent, consent_timestamp, source='website', status='new'). Sheets and email run afterwards; failures are logged and retried every 5 minutes for 48h. The lead is never lost.

## Google Sheets
1. Google Cloud: create a project and enable "Google Sheets API".
2. Create a Service Account, then Keys, then JSON. Put client_email in GOOGLE_SERVICE_ACCOUNT_EMAIL and private_key in GOOGLE_PRIVATE_KEY (keep the \n).
3. Create the sheet; row 1 headers: תאריך ושעה, Lead ID, שם פרטי, שם משפחה, טלפון, אימייל, שירות מבוקש, אישור יצירת קשר, אישור שיווק, מקור, סטטוס.
4. Share the sheet with the service-account email as Editor. Scope used: spreadsheets.
5. GOOGLE_SHEET_ID is the ID from the sheet URL; GOOGLE_SHEET_TAB is the tab name. Append-only, time zone Asia/Jerusalem.

## Email
Uses the Resend HTTP API, server-side only: verify a domain in Resend, set RESEND_API_KEY and EMAIL_FROM. Gmail SMTP is not included; swap another provider inside mail() in server.js.

## Test lead
Submit the site form, or:
curl -XPOST localhost:3000/api/leads -H 'Content-Type: application/json' -d '{"first_name":"בדיקה","last_name":"בדיקה","phone":"0521234567","service":"סלולר","contact_consent":true}'

## Admin
/admin with ADMIN_USER / ADMIN_PASSWORD (browser login). Search by name/phone, filter and change status.

## Testimonials
Edit data/testimonials.json, no code change needed.

# Setup: new GitHub repo + new Supabase + new Vercel

Use a NEW Supabase project and a NEW Vercel project for this trust. Never reuse the Sitaram trust's keys.

## 1. GitHub
Create a new repo, push this folder. `.env*` files are not in the repo.

## 2. Supabase (new project)
SQL Editor, run in this order (all safe to re-run):
1. `db/sql/000_site_config_and_media.sql`  (site settings + `media` bucket for admin uploads)
2. `db/sql/001` ... `005`  (booking core, rate limits, email system; needed for rate limiting even while online payments are off)
3. `db/sql/006_inquiries.sql`  (katha / donation / room inquiries)

Authentication > Users > Add user: the trust owner's email + a strong password. This is the `/login` account.

## 3. Vercel (new project, import the new repo)
Environment variables (Production):

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL`, `SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only, never `VITE_`) |
| `SITE_URL` | `https://shriramjankisewatrust.com` |
| `ADMIN_EMAILS` | the admin login email (comma separated if more than one) |
| `BOOKING_NOTIFY_EMAIL` | where inquiry alerts go (default in code: panditneerajtiwari1@gmail.com, please verify spelling) |
| `RESEND_API_KEY`, `MAIL_FROM` | optional: email alerts. Without them inquiries are still saved and visible in `/admin/inquiries` |
| `VITE_ONLINE_PAYMENTS` | `false` |

Leave all Cashfree / Razorpay / cron variables empty until online payments are switched on.

## 4. Domain
Add `shriramjankisewatrust.com` (and `.in`, redirect to .com) in Vercel > Domains.

## 5. First login: fill the site (no code needed)
`/login` -> Admin > Settings & Theme:
- UPI ID, Payment QR upload, bank details, registration no. / PAN / tax note (only filled fields are shown publicly)
- WhatsApp number, helpline (leave empty to hide), email, Google Maps query
- Logo, hero image, story image
Admin > Rooms: real names, prices, photos, availability. Press **Save** and confirm "Supabase publish successful".

## 6. Test before sharing the link
- Send one test on each form: Katha inquiry, Donation details, Stay request.
- Open `/admin/inquiries`: all three must appear. Email arrives only if Resend is configured.
- Open the site on a phone: check the UPI "Pay in UPI app" button and the QR.

## Later: online payments
Set `PAYMENTS_GATEWAY_LIVE = true` in `src/lib/hotel.ts` only after Cashfree keys, webhook and the booking walkthrough are done. Confirm cancellation tiers in `data/hotelPolicy.json` first.

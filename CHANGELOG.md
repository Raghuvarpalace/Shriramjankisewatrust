<!-- ROOT PATH: CHANGELOG.md -->
# CHANGELOG

## 2026-11-05 (6) — Login button + 2 admin emails only
- Navbar: "Login" link for everyone; after admin login it becomes Admin + new-inquiries badge + Logout. Customers never need to log in.
- `src/lib/adminEmails.ts`: only vermajiayush@gmail.com and panditneerajtiwari@gmail.com can log in as admin (checked in Login and in the navbar).
- `db/sql/007_admin_email_lock.sql` (also appended to the all-in-one file): `is_admin()` and new RLS policies, so only those emails can read inquiries, change settings or upload media, even with the public anon key. Tested on Postgres.
- `api/inquiry.js`: alerts go to both admin emails by default (`BOOKING_NOTIFY_EMAIL` can override, comma separated).

## 2026-11-05 (5) — Admin button in navbar
- `src/lib/useAdminSession.ts` + `src/components/Navbar.tsx`: "Admin" button (and a red "N new" inquiries badge, refreshed every minute) shows only while an admin is logged in via Supabase Auth.

## 2026-11-05 (4) — Rooms-first homepage (for ads)
- New order: Hero (stay focused, Call / WhatsApp / View Rooms) -> Rooms -> Stay request form -> Katha & Pooja -> donation band -> Donation -> Story -> Location, guide, services -> Video -> Reviews -> Guidelines.
- Hero: Hindi tagline from the card, call and WhatsApp buttons, hero photo hidden on phones so rooms come sooner, scroll cue.
- Stay request form now sits right under the rooms (light theme) with a link on to Katha & Pooja. Navbar order: Rooms, Katha & Pooja, Donate.

## 2026-11-05 (3) — One-paste Supabase setup
- `db/sql/ALL_IN_ONE_supabase_setup.sql`: 000-006 combined. Also creates `payment_requests`, `invoice_seq`, `next_invoice_no()` which the old files assumed already existed (they only existed in the other trust's database, so 004/005 would have failed on a new project). Tested twice on a real Postgres 16 with Supabase-style roles.
- Invoice / booking-ref prefix changed from SST to RJST (`api/_pay-lib.js`, `api/pay.js`, `api/_mail.js`, `db/sql/002`, `db/sql/005`).

## 2026-11-05 (2) — Mobile stat tiles + Gmail email
- Home hero stat tiles: phone number removed from the tile (was cut off on phones).
- `api/_pay-lib.js` `sendMail`: new SMTP / Gmail option (`SMTP_USER`, `SMTP_PASS`) via nodemailer, used before Resend. Inquiry alerts no longer need a verified domain.

## 2026-11-05 — Initial version for Shri Ram Janki Seva Trust
Cloned from the Shri Sitaram Seva Trust codebase (sitaram-trust-web), then:
### Changed
- Rebranded everywhere: name, phones (9454191686, 9670000112), address, logo (cropped from visiting card), SEO / schema / sitemap / manifest, emails, invoice header, policy pages. Domain assumed: shriramjankisewatrust.com.
- Removed everything that belonged to the other trust: its UPI QR image, hotel photos, videos, Facebook auto-post (api + schedule + posters), Web3Forms key, CallMeBot numbers, demo login (admin@sitaramsevatrust.org / seva2026), demo reviews and bookings, fake admin analytics, fallback notify email.
- Room defaults are neutral placeholders with price 0 ("Call for tariff").
- Home page: new hero and story, QR/hotel-only sections removed, video and review sections hidden when empty.
### Added
- Katha & Pooja section (`src/data/sevas.ts`) + inquiry modal.
- Donation section: UPI link and QR, bank details, registration / tax note, donation details form.
- `/api/inquiry` (+ `db/sql/006_inquiries.sql`): saves seva / donation / room inquiries, rate limit, honeypot, best-effort email. `/admin/inquiries` page.
- Admin settings fields: maharajName, registrationNo, panNo, taxNote, bank details.
- `db/sql/000_site_config_and_media.sql`, `SETUP_NEW_CLIENT.md`, `tests/inquiry.test.mjs`.
- Online payments stay OFF: `PAYMENTS_GATEWAY_LIVE = false` in `src/lib/hotel.ts`.

# CHANGELOG

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

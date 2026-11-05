# Shri Ram Janki Seva Trust — Website

Vite + React + TypeScript + Tailwind site for **Shri Ram Janki Seva Trust**, Luvkushnagar Ramghat, Ayodhya Dham.
Cloned from the Shri Sitaram Seva Trust codebase, then rebranded and extended.

## What is on the site
- Hero, story, location map, Ayodhya darshan guide, local services
- **Katha & Pooja** section (Bhagwat Katha, Ram Katha, Yagya anushthan, Rudrabhishek, Navgrah pooja, Ramarcha pooja, Astrology) with an inquiry form
- **Donation** section: UPI ID + QR, bank details, registration / tax note, and a "send my donation details" form
- **Yatri Niwas** rooms with a stay request form (tariff shows "Call for tariff" until a price is set)
- Policy pages (`/privacy`, `/terms`, `/refund-policy`, `/contact`)
- Admin panel: `/login` -> `/admin` (settings, theme, media, rooms, guide, services, reviews) and `/admin/inquiries`
- Cashfree online booking code is included but **switched off** (`PAYMENTS_GATEWAY_LIVE = false` in `src/lib/hotel.ts`)

## Setup
See **SETUP_NEW_CLIENT.md** (Supabase, Vercel, domain, admin).

## Local development
```bash
npm ci
cp .env.example .env.local   # fill Supabase values
npm run dev
npm run typecheck && npm test
```

## Where to edit things
| What | Where |
|---|---|
| Phone, address, UPI, bank, QR, logo, colours, images | Admin > Settings & Theme (no code change) |
| Room names, prices, photos | Admin > Rooms |
| Katha / pooja list and donation amounts/purposes | `src/data/sevas.ts` |
| Policy wording | `src/pages/Policy.tsx`, `data/hotelPolicy.json` |
| Page SEO / schema | `index.html`, `src/lib/seo.ts` |

Status and history: `PROJECT_STATUS.md`, `CHANGELOG.md`.

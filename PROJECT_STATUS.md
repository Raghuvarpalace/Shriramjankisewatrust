# PROJECT_STATUS.md — Shri Ram Janki Seva Trust

_Last updated: 2026-11-05._

## State
- Site code complete: katha/pooja, donation, stay request, admin, inquiries. `tsc`, build and 25 tests pass.
- Online room payments (Cashfree) are OFF. Owner will say when to enable; then set `PAYMENTS_GATEWAY_LIVE = true` in `src/lib/hotel.ts` and follow SETUP_NEW_CLIENT.md.

## To confirm with the trust / fill from admin
- UPI ID + QR, bank details, registration / PAN / tax (80G) note, WhatsApp number, helpline.
- Real room names, prices, photos; hero / story photos; Maharaj ji photo.
- Spelling: "Ramarcha" pooja and the contact email panditneerajtiwari1@gmail.com (read from handwriting); title for Neeraj Das Ji (card shows "मं०").
- Refund tiers in `data/hotelPolicy.json` are the Sitaram trust's defaults: review before showing publicly / enabling payments.
- Distances to temples are not shown; add if wanted.

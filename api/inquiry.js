// ROOT PATH: api/inquiry.js
// POST /api/inquiry  { kind: 'seva' | 'donation' | 'room', name, phone, ... }
// 1) validates, 2) saves to public.inquiries (never lost), 3) emails the trust (best effort).
import crypto from 'node:crypto';
import { sb, httpError, esc, sendMail, HOTEL, siteUrl, requireAdmin } from './_pay-lib.js';
import { readBody, clientIp, rateLimit, normPhone, isIndianMobile, isYmd } from './_booking-lib.js';

const KINDS = ['seva', 'donation', 'room'];
const ADMIN_NOTIFY = ['vermajiayush@gmail.com', 'panditneerajtiwari@gmail.com'];
export const notifyList = () => [...new Set([...ADMIN_NOTIFY, ...String(process.env.BOOKING_NOTIFY_EMAIL || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean)])];

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const newRef = () => `RJ-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

export function validateInquiry(b) {
  const kind = clean(b.kind, 20);
  if (!KINDS.includes(kind)) throw httpError(400, 'Request sahi nahi hai');
  const name = clean(b.name, 80);
  if (name.length < 2) throw httpError(400, 'Kripya apna naam likhein');
  const phone = normPhone(b.phone);
  if (!isIndianMobile(phone)) throw httpError(400, 'Kripya sahi 10 ank ka mobile number likhein');

  const out = {
    kind,
    name,
    phone,
    seva: clean(b.seva, 120) || null,
    purpose: clean(b.purpose, 120) || null,
    city: clean(b.city, 80) || null,
    guests: clean(b.guests, 20) || null,
    room: clean(b.room, 120) || null,
    txn_ref: clean(b.txnRef, 60) || null,
    message: clean(b.message, 800) || null,
    preferred_date: null,
    amount_inr: null,
  };

  if (b.preferredDate) {
    const d = clean(b.preferredDate, 10);
    if (!isYmd(d)) throw httpError(400, 'Tareekh sahi nahi hai');
    out.preferred_date = d;
  }
  if (b.amount !== undefined && b.amount !== null && b.amount !== '') {
    const n = Number(b.amount);
    if (!Number.isInteger(n) || n < 1 || n > 1000000) throw httpError(400, 'Rashi 1 se 10,00,000 ke beech poora ank (rupaye) honi chahiye');
    out.amount_inr = n;
  }
  if (kind === 'donation' && !out.amount_inr) throw httpError(400, 'Kripya daan ki rashi likhein');
  if (kind === 'seva' && !out.seva) throw httpError(400, 'Kripya seva chunein');
  if (kind === 'room' && !out.room) throw httpError(400, 'Kripya room chunein');
  return out;
}

const KIND_LABEL = { seva: 'Katha / Pooja inquiry', donation: 'Donation details', room: 'Room booking inquiry' };

function mailBody(row) {
  const lines = [
    ['Ref', row.ref],
    ['Name', row.name],
    ['Mobile', row.phone],
    row.seva && ['Seva', row.seva],
    row.room && ['Room', row.room],
    row.guests && ['Guests', row.guests],
    row.amount_inr && ['Amount', `Rs ${row.amount_inr.toLocaleString('en-IN')}`],
    row.purpose && ['Purpose', row.purpose],
    row.txn_ref && ['UPI / transaction ref', row.txn_ref],
    row.preferred_date && ['Preferred date', row.preferred_date],
    row.city && ['City / place', row.city],
    row.message && ['Message', row.message],
    ['Received', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' IST'],
  ].filter(Boolean);
  const text = [`${KIND_LABEL[row.kind]} - ${HOTEL.nameEn}`, '', ...lines.map(([k, v]) => `${k}: ${v}`), '', `Admin: ${siteUrl()}/admin/inquiries`].join('\n');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#3b2a30">
<h2 style="color:#4b0718;margin:0 0 12px">${esc(KIND_LABEL[row.kind])}</h2>
<table cellpadding="6" style="border-collapse:collapse">${lines.map(([k, v]) => `<tr><td style="color:#7a6a70">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join('')}</table>
<p style="margin-top:16px"><a href="tel:+91${esc(row.phone)}">Call ${esc(row.phone)}</a> &nbsp;|&nbsp; <a href="https://wa.me/91${esc(row.phone)}">WhatsApp</a> &nbsp;|&nbsp; <a href="${esc(siteUrl())}/admin/inquiries">Open inquiries in admin</a></p></div>`;
  return { text, html };
}

export default async function handler(req, res) {
  try {
    // Admin-only mail check: GET /api/inquiry?test=mail  (button on /admin/inquiries). Returns the real error.
    if (req.method === 'GET' && req.query?.test === 'mail') {
      await requireAdmin(req);
      const mode = process.env.SMTP_USER && process.env.SMTP_PASS ? 'Gmail SMTP' : process.env.RESEND_API_KEY ? 'Resend' : 'none';
      const to = notifyList();
      const r = await sendMail({ to, subject: `Test mail - ${HOTEL.nameEn}`, text: 'Ye test mail hai. Agar ye aapko mila to inquiry alerts bhi aayenge.', html: '<p>Ye test mail hai. Agar ye aapko mila to inquiry alerts bhi aayenge.</p>' });
      return res.status(200).json({ success: Boolean(r.ok), mode, to, error: r.ok ? undefined : r.error });
    }
    if (req.method !== 'POST') throw httpError(405, 'Sirf POST allowed hai');
    const body = readBody(req);
    // Honeypot: bots fill hidden "website" field. Pretend success, store nothing.
    if (clean(body.website, 50)) return res.status(200).json({ success: true, ref: newRef() });

    const ip = clientIp(req);
    await rateLimit(`inq:ip:${ip}`, 8, 600, { failOpen: true });
    const row = validateInquiry(body);
    await rateLimit(`inq:phone:${row.phone}`, 6, 3600, { failOpen: true });

    row.ref = newRef();

    // 1) Save in the database. If this fails we still try the email below, so the enquiry is not lost.
    let saved = true;
    try {
      await sb('inquiries', { method: 'POST', body: row, prefer: 'return=minimal' });
    } catch (e) {
      saved = false;
      console.error('inquiry save failed:', e.message);
    }

    // 2) Email BOTH admins. Always includes the two default addresses; BOOKING_NOTIFY_EMAIL only adds more.
    let mailed = false;
    try {
      const to = notifyList();
      const { text, html } = mailBody(row);
      const r = await sendMail({ to, subject: `[${row.ref}] ${KIND_LABEL[row.kind]} - ${row.name}`, html, text });
      mailed = Boolean(r.ok);
      if (!r.ok) console.error('inquiry mail not sent:', r.error);
    } catch (e) {
      console.error('inquiry mail failed:', e.message);
    }

    // Only fail if the enquiry reached neither the database nor the inbox.
    if (!saved && !mailed) throw httpError(500, 'Request save nahi ho payi');
    return res.status(200).json({ success: true, ref: row.ref });
  } catch (e) {
    const status = e.status || 500;
    if (status >= 500) console.error('inquiry error:', e.message);
    return res.status(status).json({ success: false, error: status >= 500 ? 'Request abhi save nahi ho payi. Kripya call karein.' : e.message });
  }
}

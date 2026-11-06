// ROOT PATH: tests/inquiry.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { validateInquiry } from '../api/inquiry.js';

const base = { kind: 'seva', name: 'Ram Kumar', phone: '+91 94541 91686', seva: 'Ram Katha' };

test('valid seva inquiry is normalised', () => {
  const r = validateInquiry({ ...base, city: ' Lucknow ', preferredDate: '2027-01-15' });
  assert.equal(r.phone, '9454191686');
  assert.equal(r.city, 'Lucknow');
  assert.equal(r.preferred_date, '2027-01-15');
});

test('bad phone, missing seva and bad date are rejected', () => {
  assert.throws(() => validateInquiry({ ...base, phone: '12345' }), /mobile/i);
  assert.throws(() => validateInquiry({ ...base, seva: '' }), /seva/i);
  assert.throws(() => validateInquiry({ ...base, preferredDate: '2027-02-31' }), /Tareekh/);
});

test('donation needs a sane whole-rupee amount', () => {
  const d = { kind: 'donation', name: 'Sita Devi', phone: '9670000112' };
  assert.throws(() => validateInquiry(d), /rashi/i);
  assert.throws(() => validateInquiry({ ...d, amount: 0 }), /Rashi/);
  assert.throws(() => validateInquiry({ ...d, amount: 12.5 }), /Rashi/);
  assert.throws(() => validateInquiry({ ...d, amount: 2000000 }), /Rashi/);
  assert.equal(validateInquiry({ ...d, amount: 501 }).amount_inr, 501);
});

test('room inquiry needs a room; unknown kind rejected; control chars stripped', () => {
  assert.throws(() => validateInquiry({ kind: 'room', name: 'Amit', phone: '9454191686' }), /room/i);
  assert.throws(() => validateInquiry({ ...base, kind: 'hack' }), /Request/);
  assert.equal(validateInquiry({ ...base, message: 'a\u0000b\nc' }).message, 'a b c');
});

const mockRes = () => {
  const r = { code: 0, body: null };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  return r;
};

test('honeypot gets a fake success and never touches the database', async () => {
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error('should not be called'); };
  try {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: { ...base, website: 'http://spam' }, socket: {} }, res);
    assert.equal(res.code, 200);
    assert.equal(res.body.success, true);
    assert.equal(calls, 0);
  } finally { globalThis.fetch = realFetch; }
});

test('GET is refused and validation errors are 400', async () => {
  const g = mockRes();
  await handler({ method: 'GET', headers: {}, socket: {} }, g);
  assert.equal(g.code, 405);
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, text: async () => 'true' }); // rate-limit rpc says ok
  try {
    const p = mockRes();
    await handler({ method: 'POST', headers: {}, body: { ...base, phone: '1' }, socket: {} }, p);
    assert.equal(p.code, 400);
  } finally { globalThis.fetch = realFetch; }
});

test('room inquiry mail goes to BOTH admin emails, even if BOOKING_NOTIFY_EMAIL is something else', async () => {
  const saved = { ...process.env };
  process.env.SUPABASE_URL = 'http://supa.test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc';
  process.env.RESEND_API_KEY = 're_test';
  delete process.env.SMTP_USER; delete process.env.SMTP_PASS;
  process.env.BOOKING_NOTIFY_EMAIL = 'other@example.com';
  const realFetch = globalThis.fetch;
  let mail = null;
  globalThis.fetch = async (u, opts) => {
    u = String(u);
    if (u.includes('api.resend.com')) { mail = JSON.parse(opts.body); return { ok: true, status: 200, json: async () => ({ id: 'm1' }) }; }
    if (u.includes('hit_rate_limit')) return { ok: true, status: 200, text: async () => 'true' };
    return { ok: true, status: 201, text: async () => '' };
  };
  try {
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, socket: {}, body: { kind: 'room', name: 'Ram Kumar', phone: '9454191686', room: 'A.C. Room', guests: '3' } }, res);
    assert.equal(res.code, 200, JSON.stringify(res.body));
    assert.ok(mail, 'mail was sent');
    assert.ok(mail.to.includes('vermajiayush@gmail.com') && mail.to.includes('panditneerajtiwari@gmail.com') && mail.to.includes('other@example.com'));
    assert.match(mail.subject, /Room booking inquiry/);
  } finally { globalThis.fetch = realFetch; process.env = saved; }
});

test('if the database save fails the mail still goes out (success); if both fail it is an error', async () => {
  const saved = { ...process.env };
  process.env.SUPABASE_URL = 'http://supa.test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'svc';
  process.env.RESEND_API_KEY = 're_test';
  delete process.env.SMTP_USER; delete process.env.SMTP_PASS;
  const realFetch = globalThis.fetch;
  let mailOk = true;
  globalThis.fetch = async (u) => {
    u = String(u);
    if (u.includes('api.resend.com')) return mailOk ? { ok: true, status: 200, json: async () => ({ id: 'm1' }) } : { ok: false, status: 500, json: async () => ({ message: 'down' }) };
    if (u.includes('hit_rate_limit')) return { ok: true, status: 200, text: async () => 'true' };
    return { ok: false, status: 500, text: async () => '{"message":"db down"}' };
  };
  const body = { kind: 'room', name: 'Sita Devi', phone: '9670000112', room: 'Non A.C. Room' };
  try {
    const a = mockRes();
    await handler({ method: 'POST', headers: {}, socket: {}, body }, a);
    assert.equal(a.code, 200);
    mailOk = false;
    const b = mockRes();
    await handler({ method: 'POST', headers: {}, socket: {}, body: { ...body, phone: '9670000113' } }, b);
    assert.equal(b.code, 500);
  } finally { globalThis.fetch = realFetch; process.env = saved; }
});

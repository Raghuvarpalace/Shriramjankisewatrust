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

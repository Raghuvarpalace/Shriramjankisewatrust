// ROOT PATH: src/lib/inquiry.ts
// One place that sends every public form (seva, donation, room) to /api/inquiry.
export type InquiryKind = 'seva' | 'donation' | 'room'

export type InquiryPayload = {
  kind: InquiryKind
  name: string
  phone: string
  seva?: string
  purpose?: string
  amount?: number
  preferredDate?: string
  city?: string
  guests?: string
  room?: string
  txnRef?: string
  message?: string
  website?: string // honeypot: must stay empty
}

export type InquiryResult = { ok: true; ref: string } | { ok: false; error: string }

export async function submitInquiry(payload: InquiryPayload): Promise<InquiryResult> {
  try {
    const res = await fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = (await res.json().catch(() => ({}))) as { success?: boolean; ref?: string; error?: string }
    if (res.ok && json.success && json.ref) return { ok: true, ref: json.ref }
    return { ok: false, error: json.error || 'Request bhej nahi paye. Kripya call karein.' }
  } catch {
    return { ok: false, error: 'Internet ya server ki dikkat hai. Kripya call karein.' }
  }
}

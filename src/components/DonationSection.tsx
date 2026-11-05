// ROOT PATH: src/components/DonationSection.tsx
// Donation (daan / seva) section: UPI + QR + bank details + a "send my donation details" form.
// Money goes straight to the trust's own UPI / bank account. Nothing is collected by this site.
import { Check, CheckCircle2, Copy, HeartHandshake, Landmark, Loader2, Phone, QrCode, ShieldCheck, Smartphone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DONATION_AMOUNTS, DONATION_PURPOSES } from '../data/sevas'
import { submitInquiry } from '../lib/inquiry'
import { trackEvent } from '../lib/metaPixel'
import type { Settings } from '../types'

function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          setDone(true)
          window.setTimeout(() => setDone(false), 1800)
        } catch {
          // clipboard blocked: user can still select the text
        }
      }}
      className="inline-flex items-center gap-1 rounded-full border border-[#d7a84f]/50 px-3 py-1 text-xs font-bold text-[#4b0718]"
    >
      {done ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {done ? 'Copied' : 'Copy'}
    </button>
  )
}

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`

export function DonationSection({ settings }: { settings: Settings }) {
  const [amount, setAmount] = useState<number | ''>(501)
  const [purpose, setPurpose] = useState(DONATION_PURPOSES[0])
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [txnRef, setTxnRef] = useState('')
  const [message, setMessage] = useState('')
  const [trap, setTrap] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ref, setRef] = useState('')

  const upiId = settings.upiId.trim()
  const hasQr = Boolean(settings.paymentQr)
  const hasBank = Boolean(settings.bankAccountNo.trim())
  const hasAnyMethod = Boolean(upiId) || hasQr || hasBank

  const upiLink = useMemo(() => {
    if (!upiId) return ''
    const params = new URLSearchParams({ pa: upiId, pn: settings.trustName, cu: 'INR', tn: `Donation ${settings.trustName}` })
    if (amount) params.set('am', String(amount))
    return `upi://pay?${params.toString()}`
  }, [upiId, amount, settings.trustName])

  const generatedQr = upiLink ? `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=16&data=${encodeURIComponent(upiLink)}` : ''
  const qrImage = settings.paymentQr || generatedQr

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!amount) {
      setError('Kripya daan ki rashi likhein')
      return
    }
    setBusy(true)
    setError('')
    const result = await submitInquiry({ kind: 'donation', name, phone: mobile, amount: Number(amount), purpose, txnRef, message, website: trap })
    setBusy(false)
    if (result.ok) {
      setRef(result.ref)
      trackEvent('Lead', { content_name: 'Donation', content_category: 'Donation', value: Number(amount), currency: 'INR' })
    } else {
      setError(result.error)
    }
  }

  const bankRows: [string, string][] = [
    ['Account name', settings.bankAccountName],
    ['Bank', settings.bankName],
    ['Account no.', settings.bankAccountNo],
    ['IFSC', settings.bankIfsc],
    ['Branch', settings.bankBranch],
  ].filter(([, v]) => v.trim()) as [string, string][]

  return (
    <section id="donate" className="bg-[#fff3d8] px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#b7812d]">Daan · Seva · Donation</p>
          <h2 className="mt-3 font-serif text-4xl font-bold text-[#4b0718] md:text-5xl">धर्म और सेवा के कार्यों में सहयोग करें</h2>
          <p className="mt-5 leading-7 text-[#6b5560]">
            Your contribution supports katha, yagya, pooja and yatri seva at {settings.trustName}, Ayodhya Dham. Donate directly by UPI or bank transfer, then share your details so the trust can thank you personally.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-[#d7a84f]/30 bg-white p-6 shadow-xl shadow-[#4b0718]/10 sm:p-8">
            <div className="flex items-center gap-3 font-serif text-2xl font-bold text-[#4b0718]"><HeartHandshake className="text-[#b7812d]" /> Choose amount</div>
            <div className="mt-5 flex flex-wrap gap-2">
              {DONATION_AMOUNTS.map((value) => (
                <button key={value} type="button" onClick={() => setAmount(value)} className={`rounded-full px-5 py-2.5 text-sm font-black transition ${amount === value ? 'bg-[#4b0718] text-[#f5d891]' : 'border border-[#d7a84f]/50 text-[#4b0718] hover:bg-[#fff3d8]'}`}>
                  {rupees(value)}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm font-semibold text-[#4b0718]">Other amount (₹)
              <input value={amount} onChange={(e) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 7); setAmount(digits ? Math.min(1000000, Number(digits)) : '') }} inputMode="numeric" placeholder="Enter amount" className="admin-input mt-2" />
            </label>

            {hasAnyMethod ? (
              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {(qrImage || upiId) && (
                  <div className="rounded-2xl border border-[#d7a84f]/25 bg-[#fffaf1] p-5 text-center">
                    <div className="flex items-center justify-center gap-2 font-bold text-[#4b0718]"><QrCode className="h-5 w-5 text-[#b7812d]" /> Scan &amp; pay (UPI)</div>
                    {qrImage && <img src={qrImage} alt={`UPI QR for ${settings.trustName}`} className="mx-auto mt-3 h-auto w-full max-w-[240px] rounded-xl bg-white object-contain p-2" loading="lazy" />}
                    {upiId && (
                      <>
                        <p className="mt-3 break-all text-sm font-bold text-[#4b0718]">{upiId}</p>
                        <div className="mt-2 flex justify-center"><CopyButton value={upiId} label="UPI ID" /></div>
                        <a href={upiLink} className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#4b0718] px-5 py-3 text-sm font-bold text-white sm:hidden"><Smartphone className="h-4 w-4" /> Pay {amount ? rupees(Number(amount)) : ''} in UPI app</a>
                      </>
                    )}
                  </div>
                )}
                {hasBank && (
                  <div className="rounded-2xl border border-[#d7a84f]/25 bg-[#fffaf1] p-5">
                    <div className="flex items-center gap-2 font-bold text-[#4b0718]"><Landmark className="h-5 w-5 text-[#b7812d]" /> Bank transfer</div>
                    <dl className="mt-3 space-y-2 text-sm">
                      {bankRows.map(([label, value]) => (
                        <div key={label} className="flex items-start justify-between gap-2">
                          <div><dt className="text-xs uppercase tracking-wider text-[#6b5560]">{label}</dt><dd className="break-all font-bold text-[#4b0718]">{value}</dd></div>
                          <CopyButton value={value} label={label} />
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-[#d7a84f]/60 bg-[#fffaf1] p-5 text-sm leading-6 text-[#6b5560]">
                Donation details (UPI / bank) are being updated. Please call <a className="font-bold underline" href={`tel:${settings.phone}`}>{settings.phone}</a> or send your details using the form and the trust will contact you.
              </div>
            )}

            {(settings.registrationNo || settings.panNo || settings.taxNote) && (
              <div className="mt-6 flex gap-3 rounded-2xl bg-[#4b0718]/5 p-4 text-sm text-[#4b0718]">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#b7812d]" />
                <div className="space-y-1">
                  {settings.registrationNo && <p><strong>Registration:</strong> {settings.registrationNo}</p>}
                  {settings.panNo && <p><strong>Trust PAN:</strong> {settings.panNo}</p>}
                  {settings.taxNote && <p>{settings.taxNote}</p>}
                </div>
              </div>
            )}
            <p className="mt-6 text-xs leading-5 text-[#6b5560]">Payment goes directly to the trust&apos;s own account. This website does not collect or store your payment details. Please pay only to the UPI ID / account shown here.</p>
          </div>

          <div className="rounded-[2rem] border border-[#d7a84f]/30 bg-[#2a0611] p-6 text-white shadow-xl sm:p-8">
            {ref ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-14 w-14 text-[#8be28b]" />
                <h3 className="mt-4 font-serif text-2xl font-bold text-[#f5d891]">Dhanyavaad 🙏</h3>
                <p className="mt-3 text-sm leading-6 text-white/75">Aapki jaankari mil gayi hai. Reference: <strong className="text-white">{ref}</strong>. Trust aapse sampark karega.</p>
                <p className="mt-2 text-sm text-white/65">Jai Shri Ram!</p>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h3 className="font-serif text-2xl font-bold text-[#f5d891]">Share your donation details</h3>
                <p className="mt-2 text-sm leading-6 text-white/65">Daan karne ke baad ya daan karne ki ichha ho to apni jaankari bhejein, taaki trust aapse sampark aur dhanyavaad kar sake.</p>
                <div className="mt-5 grid gap-3 text-[#4b0718]">
                  <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Aapka naam / Name" className="admin-input" autoComplete="name" />
                  <input value={mobile} onChange={(e) => setMobile(e.target.value)} required inputMode="numeric" placeholder="Mobile number" className="admin-input" autoComplete="tel" />
                  <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="admin-input" aria-label="Purpose">
                    {DONATION_PURPOSES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                  <input value={txnRef} onChange={(e) => setTxnRef(e.target.value)} maxLength={60} placeholder="UPI / transaction reference (optional)" className="admin-input" />
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={800} placeholder="Sandesh (optional)" className="admin-input" />
                  <input value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" name="website" />
                </div>
                <p className="mt-3 text-sm text-white/70">Amount: <strong className="text-[#f5d891]">{amount ? rupees(Number(amount)) : 'select above'}</strong></p>
                {error && <p role="alert" className="mt-3 text-sm font-semibold text-[#ffb3b3]">{error}</p>}
                <button disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#d7a84f] to-[#fff0ad] px-6 py-4 font-black text-[#4b0718] disabled:opacity-60">
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Send details
                </button>
                <a href={`tel:${settings.phone}`} className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-[#f5d891]"><Phone className="h-4 w-4" /> Questions? Call {settings.phone}</a>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

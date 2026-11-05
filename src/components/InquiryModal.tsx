// ROOT PATH: src/components/InquiryModal.tsx
// Katha / pooja / anushthan inquiry form. Sends to /api/inquiry (kind = seva).
import { CheckCircle2, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { SEVAS } from '../data/sevas'
import { submitInquiry } from '../lib/inquiry'
import { trackEvent } from '../lib/metaPixel'

export function InquiryModal({ initialSeva, phone, onClose }: { initialSeva: string; phone: string; onClose: () => void }) {
  const [seva, setSeva] = useState(initialSeva || SEVAS[0].title)
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [city, setCity] = useState('')
  const [date, setDate] = useState('')
  const [message, setMessage] = useState('')
  const [trap, setTrap] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ref, setRef] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = await submitInquiry({ kind: 'seva', name, phone: mobile, seva, city, preferredDate: date || undefined, message, website: trap })
    setBusy(false)
    if (result.ok) {
      setRef(result.ref)
      trackEvent('Lead', { content_name: seva, content_category: 'Seva Inquiry' })
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Katha and pooja inquiry">
      <div className="relative my-8 w-full max-w-lg rounded-[2rem] border border-[#d7a84f]/30 bg-white p-6 text-[#4b0718] shadow-2xl">
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full border border-[#d7a84f]/40 p-2"><X className="h-4 w-4" /></button>
        {ref ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-14 w-14 text-[#1f7a3d]" />
            <h3 className="mt-4 font-serif text-2xl font-bold">Jai Shri Ram 🙏</h3>
            <p className="mt-3 text-sm leading-6 text-[#6b5560]">Aapki inquiry mil gayi hai. Reference: <strong className="text-[#4b0718]">{ref}</strong>. Seva desk aapse jald sampark karegi.</p>
            <p className="mt-2 text-sm text-[#6b5560]">Jaldi ho to call karein: <a className="font-bold underline" href={`tel:${phone}`}>{phone}</a></p>
            <button type="button" onClick={onClose} className="mt-6 rounded-full bg-[#4b0718] px-8 py-3 font-bold text-white">Close</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#b7812d]">Katha &amp; Pooja</p>
            <h3 className="mt-1 font-serif text-2xl font-bold">Sampark / Inquiry</h3>
            <div className="mt-5 grid gap-3">
              <select value={seva} onChange={(e) => setSeva(e.target.value)} className="admin-input" aria-label="Seva">
                {SEVAS.map((item) => <option key={item.id} value={item.title}>{item.titleHi} — {item.title}</option>)}
              </select>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Aapka naam / Name" className="admin-input" autoComplete="name" />
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} required inputMode="numeric" placeholder="Mobile number" className="admin-input" autoComplete="tel" />
              <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Shehar / sthan (optional)" className="admin-input" />
              <label className="text-xs font-semibold text-[#6b5560]">Pasandida tareekh (optional)
                <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="admin-input mt-1" />
              </label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} maxLength={800} placeholder="Aapka sandesh (optional)" className="admin-input" />
              <input value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" name="website" />
            </div>
            {error && <p role="alert" className="mt-3 text-sm font-semibold text-[#9b1c1c]">{error}</p>}
            <button disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#d7a84f] px-6 py-4 font-black text-[#4b0718] disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Inquiry bhejein
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

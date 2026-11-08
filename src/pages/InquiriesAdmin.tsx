// ROOT PATH: src/pages/InquiriesAdmin.tsx
// Admin view of seva / donation / room inquiries saved by /api/inquiry.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowLeft, Loader2, MessageCircle, Phone, RefreshCw } from 'lucide-react'
import { storage } from '../lib/storage'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useNoIndex } from '../lib/useNoIndex'

type Row = {
  id: string; ref: string; kind: 'seva' | 'donation' | 'room'; name: string; phone: string
  seva: string | null; purpose: string | null; amount_inr: number | null; preferred_date: string | null
  city: string | null; guests: string | null; room: string | null; txn_ref: string | null; message: string | null
  status: 'new' | 'contacted' | 'done' | 'spam'; note: string | null; created_at: string
}

const KIND_LABEL: Record<string, string> = { all: 'All', seva: 'Katha / Pooja', donation: 'Donation', room: 'Rooms' }
const STATUS_STYLE: Record<Row['status'], string> = {
  new: 'bg-[#fff3d8] text-[#7a4b00]', contacted: 'bg-[#e8eefc] text-[#1d3a8a]', done: 'bg-[#e7f8df] text-[#255018]', spam: 'bg-[#eee] text-[#555]',
}
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })

export function InquiriesAdmin() {
  useNoIndex()
  const isAuthed = localStorage.getItem(storage.keys.authed) === 'true'
  const [rows, setRows] = useState<Row[]>([])
  const [kind, setKind] = useState('all')
  const [status, setStatus] = useState('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mailMsg, setMailMsg] = useState('')

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase configure nahi hai.')
      setLoading(false)
      return
    }
    const { data, error: err } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false }).limit(500)
    if (err) setError(`${err.message}. Kya aap logged in hain aur db/sql/006_inquiries.sql chala diya hai?`)
    else { setRows((data || []) as Row[]); setError('') }
    setLoading(false)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void load() }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  const setRowStatus = async (row: Row, next: Row['status']) => {
    const { error: err } = await supabase.from('inquiries').update({ status: next }).eq('id', row.id)
    if (err) setError(err.message)
    else setRows((list) => list.map((item) => (item.id === row.id ? { ...item, status: next } : item)))
  }

  const shown = useMemo(
    () => rows.filter((row) => (kind === 'all' || row.kind === kind) && (status === 'all' || (status === 'open' ? row.status === 'new' || row.status === 'contacted' : row.status === status))),
    [rows, kind, status],
  )
  const donationTotal = useMemo(() => rows.filter((r) => r.kind === 'donation' && r.status !== 'spam').reduce((sum, r) => sum + (r.amount_inr || 0), 0), [rows])

  const testMail = async () => {
    setMailMsg('Test mail bhej rahe hain...')
    try {
      const { data } = await supabase.auth.getSession()
      const r = await fetch('/api/inquiry?test=mail', { headers: { Authorization: `Bearer ${data.session?.access_token || ''}` } })
      const j = await r.json()
      setMailMsg(j.success ? `Mail gaya (${j.mode}) -> ${(j.to || []).join(', ')}. Inbox aur Spam dekhein.` : `Mail NAHI gaya (${j.mode || 'setup'}): ${j.error || 'unknown error'}`)
    } catch (e) {
      setMailMsg(`Test fail: ${(e as Error).message}`)
    }
  }

  if (!isAuthed) return <Navigate to="/login" replace />

  return (
    <main className="min-h-screen bg-[#fffaf1] pb-16">
      <header className="sticky top-0 z-40 border-b border-[#d7a84f]/20 bg-[#2a0611]/95 px-4 py-4 text-white backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#f5d891]">Admin Panel</p>
            <h1 className="font-serif text-2xl font-bold">Inquiries</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setLoading(true); void load() }} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-bold"><RefreshCw className="h-4 w-4" /> Refresh</button>
            <button type="button" onClick={() => { void testMail() }} className="inline-flex items-center gap-2 rounded-full border border-[#d7a84f]/60 px-4 py-2 text-sm font-bold text-[#f5d891]">Test mail</button>
            <a href="/admin" className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-bold"><ArrowLeft className="h-4 w-4" /> Dashboard</a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {mailMsg && <div role="status" className="rounded-2xl bg-[#fff3d8] p-3 text-sm font-semibold text-[#5b3a00]">{mailMsg}</div>}
        {error && <div role="alert" className="rounded-2xl bg-[#fde8e8] p-3 text-sm font-semibold text-[#9b1c1c]">{error}</div>}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl border border-[#d7a84f]/25 bg-white p-4"><p className="font-serif text-3xl font-bold text-[#4b0718]">{rows.filter((r) => r.status === 'new').length}</p><p className="text-xs uppercase tracking-wider text-[#6b5560]">New</p></div>
          <div className="rounded-2xl border border-[#d7a84f]/25 bg-white p-4"><p className="font-serif text-3xl font-bold text-[#4b0718]">{rows.length}</p><p className="text-xs uppercase tracking-wider text-[#6b5560]">Total</p></div>
          <div className="rounded-2xl border border-[#d7a84f]/25 bg-white p-4"><p className="font-serif text-3xl font-bold text-[#4b0718]">₹{donationTotal.toLocaleString('en-IN')}</p><p className="text-xs uppercase tracking-wider text-[#6b5560]">Pledged (unverified)</p></div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(KIND_LABEL).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setKind(key)} className={`rounded-full px-4 py-2 text-sm font-bold ${kind === key ? 'bg-[#4b0718] text-white' : 'border border-[#d7a84f]/50 text-[#4b0718]'}`}>{label}</button>
          ))}
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="admin-input ml-auto w-auto" aria-label="Status filter">
            <option value="open">Open (new + contacted)</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="done">Done</option>
            <option value="spam">Spam</option>
            <option value="all">All</option>
          </select>
        </div>

        {loading ? (
          <div className="grid place-items-center py-16 text-[#4b0718]"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : shown.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[#d7a84f]/50 bg-white p-8 text-center text-[#6b5560]">Koi inquiry nahi mili.</p>
        ) : (
          <ul className="space-y-3">
            {shown.map((row) => {
              const wa = `https://wa.me/91${row.phone}?text=${encodeURIComponent(`Jai Shri Ram ${row.name} ji, Shri Ram Janki Seva Trust se. Aapki ${row.kind === 'donation' ? 'daan' : 'inquiry'} (${row.ref}) ke baare me.`)}`
              return (
                <li key={row.id} className="rounded-2xl border border-[#d7a84f]/25 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-serif text-xl font-bold text-[#4b0718]">{row.name}</p>
                      <p className="text-xs text-[#6b5560]">{row.ref} · {KIND_LABEL[row.kind]} · {when(row.created_at)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLE[row.status]}`}>{row.status}</span>
                  </div>
                  <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-[#3b2a30] sm:grid-cols-2">
                    <div><dt className="inline text-[#6b5560]">Mobile: </dt><dd className="inline font-semibold">{row.phone}</dd></div>
                    {row.seva && <div><dt className="inline text-[#6b5560]">Seva: </dt><dd className="inline font-semibold">{row.seva}</dd></div>}
                    {row.room && <div><dt className="inline text-[#6b5560]">Room: </dt><dd className="inline font-semibold">{row.room}</dd></div>}
                    {row.guests && <div><dt className="inline text-[#6b5560]">Guests: </dt><dd className="inline font-semibold">{row.guests}</dd></div>}
                    {row.amount_inr && <div><dt className="inline text-[#6b5560]">Amount: </dt><dd className="inline font-semibold">₹{row.amount_inr.toLocaleString('en-IN')}</dd></div>}
                    {row.purpose && <div><dt className="inline text-[#6b5560]">Purpose: </dt><dd className="inline font-semibold">{row.purpose}</dd></div>}
                    {row.txn_ref && <div><dt className="inline text-[#6b5560]">Txn ref: </dt><dd className="inline font-semibold">{row.txn_ref}</dd></div>}
                    {row.preferred_date && <div><dt className="inline text-[#6b5560]">Date: </dt><dd className="inline font-semibold">{row.preferred_date}</dd></div>}
                    {row.city && <div><dt className="inline text-[#6b5560]">City: </dt><dd className="inline font-semibold">{row.city}</dd></div>}
                  </dl>
                  {row.message && <p className="mt-3 rounded-xl bg-[#fff8eb] p-3 text-sm text-[#3b2a30]">{row.message}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <a href={`tel:${row.phone}`} className="inline-flex items-center gap-1 rounded-full bg-[#4b0718] px-4 py-2 text-sm font-bold text-white"><Phone className="h-4 w-4" /> Call</a>
                    <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[#d7a84f]/60 px-4 py-2 text-sm font-bold text-[#4b0718]"><MessageCircle className="h-4 w-4" /> WhatsApp</a>
                    <select value={row.status} onChange={(e) => void setRowStatus(row, e.target.value as Row['status'])} className="admin-input ml-auto w-auto" aria-label="Set status">
                      <option value="new">New</option><option value="contacted">Contacted</option><option value="done">Done</option><option value="spam">Spam</option>
                    </select>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </main>
  )
}

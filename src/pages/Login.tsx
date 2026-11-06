// ROOT PATH: src/pages/Login.tsx
import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'
import { LogoMark } from '../components/LogoMark'
import { isAdminEmail } from '../lib/adminEmails'
import { storage } from '../lib/storage'
import { isSupabaseConfigured, supabase } from '../lib/supabase'
import { useNoIndex } from '../lib/useNoIndex'

export function Login() {
  useNoIndex()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    if (!isAdminEmail(email)) {
      setLoading(false)
      setError('Ye email admin ke liye allowed nahi hai. Customer ko login ki zaroorat nahi hoti.')
      return
    }

    if (isSupabaseConfigured) {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (!authError) {
        localStorage.setItem(storage.keys.authed, 'true')
        navigate('/admin')
        return
      }
      setError(authError.message)
      return
    }

    setLoading(false)
    setError('Admin login ke liye Supabase configure karna zaroori hai (VITE_SUPABASE_URL aur VITE_SUPABASE_ANON_KEY).')
  }

  return (
    <main className="min-h-screen bg-[#2a0611] bg-[radial-gradient(circle_at_top,#7d1128,transparent_45%)] px-4 py-24 text-white">
      <div className="mx-auto max-w-md rounded-[2rem] border border-[#d7a84f]/25 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <LogoMark />
        <div className="mt-8 rounded-2xl bg-[#d7a84f]/10 p-4 text-sm text-[#f5d891]">
          Trust admin login. Visitors and devotees do not need to log in to use the website.
        </div>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block text-sm font-semibold">Admin Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="admin-input bg-white text-[#4b0718]" />
          <label className="block text-sm font-semibold">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="admin-input bg-white text-[#4b0718]" />
          {error && <p className="text-sm text-[#ffd0d0]">{error}</p>}
          <button className="flex w-full items-center justify-center gap-2 rounded-full bg-[#d7a84f] px-6 py-3 font-black text-[#4b0718]">
            <LockKeyhole className="h-5 w-5" /> {loading ? 'Authenticating...' : 'Login to Dashboard'}
          </button>
        </form>
      </div>
    </main>
  )
        }

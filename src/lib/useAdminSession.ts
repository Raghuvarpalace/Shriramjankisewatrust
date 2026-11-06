// ROOT PATH: src/lib/useAdminSession.ts
// True only while an admin is logged in (Supabase Auth session). Also returns how many inquiries are still "new".
import { useEffect, useState } from 'react'
import { isAdminEmail } from './adminEmails'
import { storage } from './storage'
import { isSupabaseConfigured, supabase } from './supabase'

export function useAdminSession() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [ready, setReady] = useState(!isSupabaseConfigured)
  const [newCount, setNewCount] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let alive = true
    const apply = (session: { user?: { email?: string | null } } | null) => {
      const ok = isAdminEmail(session?.user?.email)
      if (ok) localStorage.setItem(storage.keys.authed, 'true')
      else localStorage.removeItem(storage.keys.authed)
      if (alive) { setIsAdmin(ok); setReady(true) }
    }
    void supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => apply(session))
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    let alive = true
    const load = () => {
      void supabase
        .from('inquiries')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new')
        .then(({ count, error }) => {
          if (alive && !error) setNewCount(count || 0)
        })
    }
    load()
    const timer = window.setInterval(load, 60000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [isAdmin])

  return { isAdmin, ready, newCount: isAdmin ? newCount : 0 }
}

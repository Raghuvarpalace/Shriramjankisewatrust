// ROOT PATH: src/lib/useAdminSession.ts
// True only while an admin is logged in (Supabase Auth session). Also returns how many inquiries are still "new".
import { useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from './supabase'

export function useAdminSession() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [newCount, setNewCount] = useState(0)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let alive = true
    void supabase.auth.getSession().then(({ data }) => {
      if (alive) setIsAdmin(Boolean(data.session))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (alive) setIsAdmin(Boolean(session))
    })
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

  return { isAdmin, newCount: isAdmin ? newCount : 0 }
}

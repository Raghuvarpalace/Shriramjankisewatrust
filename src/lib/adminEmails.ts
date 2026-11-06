// ROOT PATH: src/lib/adminEmails.ts
// Emails allowed to log in as admin. Must match is_admin() in db/sql/007_admin_email_lock.sql.
// Optional override: VITE_ADMIN_EMAILS="a@x.com,b@y.com"
const DEFAULT_ADMINS = ['vermajiayush@gmail.com', 'panditneerajtiwari@gmail.com']

export const ADMIN_EMAILS: string[] = (import.meta.env.VITE_ADMIN_EMAILS || DEFAULT_ADMINS.join(','))
  .split(',')
  .map((item: string) => item.trim().toLowerCase())
  .filter(Boolean)

export const isAdminEmail = (email?: string | null): boolean => Boolean(email) && ADMIN_EMAILS.includes(String(email).trim().toLowerCase())

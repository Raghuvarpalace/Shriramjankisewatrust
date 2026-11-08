// Turns whatever the admin pasted in "Google Maps Query" into a working map embed + directions link.
// Accepts: place name / address, "26.7995,82.2047" (lat,lng), a Google Maps URL (with @lat,lng or q=),
// a short link (maps.app.goo.gl), or the full <iframe ...> code from Google Maps > Share > Embed a map.
const DEFAULT_QUERY = 'Shri Ram Janki Seva Trust Luvkushnagar Ramghat Ayodhya'
const COORD = /(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/

export function resolveMap(raw: string, fallbackText = '') {
  let v = String(raw || '').trim()
  const iframeSrc = v.match(/src=["']([^"']+)["']/i)
  if (iframeSrc) v = iframeSrc[1].trim()
  const fallback = fallbackText.trim() || DEFAULT_QUERY

  if (!v) return { embed: `https://www.google.com/maps?q=${encodeURIComponent(DEFAULT_QUERY)}&output=embed`, open: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(DEFAULT_QUERY)}` }

  if (/^https?:\/\//i.test(v)) {
    if (/google\.[a-z.]+\/maps\/embed/i.test(v)) return { embed: v, open: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallback)}` }
    // short links cannot be embedded, but they open correctly for "Get Direction"
    if (/(maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(v)) return { embed: `https://www.google.com/maps?q=${encodeURIComponent(fallback)}&output=embed`, open: v }
    let url: URL | null = null
    try { url = new URL(v) } catch { url = null }
    const at = v.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)/) || v.match(/!3d(-?\d{1,3}\.\d+)!4d(-?\d{1,3}\.\d+)/)
    const q = url?.searchParams.get('q') || url?.searchParams.get('query') || ''
    const place = v.match(/\/maps\/place\/([^/@?]+)/)
    const term = at ? `${at[1]},${at[2]}` : q || (place ? decodeURIComponent(place[1].replace(/\+/g, ' ')) : fallback)
    return { embed: `https://www.google.com/maps?q=${encodeURIComponent(term)}&output=embed`, open: v }
  }

  const c = v.match(COORD)
  const term = c && v.replace(COORD, '').trim() === '' ? `${c[1]},${c[2]}` : v
  return { embed: `https://www.google.com/maps?q=${encodeURIComponent(term)}&output=embed`, open: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(term)}` }
}

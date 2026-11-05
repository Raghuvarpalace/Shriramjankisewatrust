// ROOT PATH: src/components/SevaSection.tsx
import { BookOpen, Droplets, Flame, HeartHandshake, Orbit, Phone, Sparkles, Star } from 'lucide-react'
import { SEVAS, type Seva, type SevaIcon } from '../data/sevas'
import type { Settings } from '../types'

const ICONS: Record<SevaIcon, React.ElementType> = {
  book: BookOpen,
  ram: HeartHandshake,
  flame: Flame,
  water: Droplets,
  planet: Orbit,
  sparkle: Sparkles,
  star: Star,
}

export function SevaSection({ settings, onInquire }: { settings: Settings; onInquire: (seva: Seva) => void }) {
  return (
    <section id="seva" className="bg-[#26040e] px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#f5d891]">Katha · Pooja · Anushthan</p>
          <h2 className="mt-3 font-serif text-4xl font-bold md:text-5xl">श्रीमद् भागवत कथा, यज्ञ अनुष्ठान एवं पूजा</h2>
          <p className="mt-5 leading-7 text-white/70">
            Contact {settings.maharajName ? <strong className="text-[#f5d891]">{settings.maharajName}</strong> : 'the trust'}, Shridham Ayodhya Ji, for Bhagwat Katha, Yagya anushthan and pooja. Choose a seva below and send your details.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SEVAS.map((seva) => {
            const Icon = ICONS[seva.icon]
            return (
              <article key={seva.id} className="flex flex-col rounded-[2rem] border border-[#d7a84f]/25 bg-white/[0.06] p-7 backdrop-blur transition hover:bg-white/10">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#d7a84f] text-[#4b0718]"><Icon className="h-7 w-7" /></div>
                <h3 className="mt-5 font-serif text-2xl font-bold text-[#f5d891]">{seva.titleHi}</h3>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/55">{seva.title}</p>
                <p className="mt-4 flex-1 text-sm leading-6 text-white/75">{seva.description}</p>
                <button type="button" onClick={() => onInquire(seva)} className="mt-6 rounded-full bg-gradient-to-r from-[#d7a84f] to-[#fff0ad] px-6 py-3 font-black text-[#4b0718] transition hover:scale-[1.02]">
                  Sampark / Inquiry
                </button>
              </article>
            )
          })}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
          <a href={`tel:${settings.phone}`} className="inline-flex items-center gap-2 rounded-full border border-[#d7a84f]/45 px-5 py-3 font-bold text-[#f5d891]"><Phone className="h-4 w-4" /> {settings.phone}</a>
          {settings.secondaryPhone && <a href={`tel:${settings.secondaryPhone}`} className="inline-flex items-center gap-2 rounded-full border border-[#d7a84f]/45 px-5 py-3 font-bold text-[#f5d891]"><Phone className="h-4 w-4" /> {settings.secondaryPhone}</a>}
        </div>
      </div>
    </section>
  )
}

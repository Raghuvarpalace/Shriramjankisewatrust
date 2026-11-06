// ROOT PATH: src/pages/Home.tsx
import { motion, useScroll, useTransform } from 'framer-motion'
import { CalendarCheck, Clock, FileText, HeartHandshake, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { AyodhyaGuide } from '../components/AyodhyaGuide'
import { FloatingActions } from '../components/FloatingActions'
import { InstallPrompt } from '../components/InstallPrompt'
import { LocalServices } from '../components/LocalServices'
import { OTTPlayer } from '../components/OTTPlayer'
import { DonationSection } from '../components/DonationSection'
import { InquiryModal } from '../components/InquiryModal'
import { SevaSection } from '../components/SevaSection'
import { BookPayModal } from '../components/BookPayModal'
import { RoomCard } from '../components/RoomCard'
import { TestimonialWidget } from '../components/TestimonialWidget'
import { VideoPopup } from '../components/VideoPopup'
import { submitInquiry } from '../lib/inquiry'
import { storage } from '../lib/storage'
import { trackEvent } from '../lib/metaPixel'
import { isSupabaseConfigured, loadSiteDataFromSupabase, saveSiteDataToSupabase, supabase } from '../lib/supabase'
import type { Booking, LocalService, Review, Room, Settings, Temple, VideoItem } from '../types'

function SectionTitle({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#b7812d]">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-4xl font-bold text-[#4b0718] md:text-5xl">{title}</h2>
      <p className="mt-5 leading-7 text-[#6b5560]">{text}</p>
    </div>
  )
}

export function Home() {
  const [settings, setSettings] = useState<Settings>(() => storage.getSettings())
  const [rooms, setRooms] = useState<Room[]>(() => storage.getRooms())
  const [videos, setVideos] = useState<VideoItem[]>(() => storage.getVideos())
  const [temples, setTemples] = useState<Temple[]>(() => storage.getTemples())
  const [services, setServices] = useState<LocalService[]>(() => storage.getServices())
  const [reviews, setReviews] = useState<Review[]>(() => storage.getReviews())
  const [selectedRoom, setSelectedRoom] = useState('')
  const [bookingOpen, setBookingOpen] = useState(false)
  const [payRoom, setPayRoom] = useState<Room | null>(null)
  const [sevaModal, setSevaModal] = useState<string | null>(null)
  const [bookingMsg, setBookingMsg] = useState('')
  const [bookingBusy, setBookingBusy] = useState(false)
  const [bookingTrap, setBookingTrap] = useState('')
  const [guestName, setGuestName] = useState('')
  const [phone, setPhone] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [guests, setGuests] = useState('2')
  const [promoTrigger, setPromoTrigger] = useState(0)
  const { scrollY } = useScroll()
  const heroY = useTransform(scrollY, [0, 600], [0, 180])
  const heroScale = useTransform(scrollY, [0, 600], [1, 1.12])

  useEffect(() => {
    const applyRemoteData = (data: Awaited<ReturnType<typeof loadSiteDataFromSupabase>>) => {
      if (!data) return
      if (data.settings) {
        storage.setSettings({ ...storage.getSettings(), ...(data.settings as Partial<Settings>) } as Settings)
        setSettings(storage.getSettings())
      }
      if (data.rooms) { storage.setRooms(data.rooms as Room[]); setRooms(storage.getRooms()) }
      if (data.videos) { storage.setVideos(data.videos as VideoItem[]); setVideos(storage.getVideos()) }
      if (data.temples) { storage.setTemples(data.temples as Temple[]); setTemples(data.temples as Temple[]) }
      if (data.reviews) { storage.setReviews(data.reviews as Review[]); setReviews(data.reviews as Review[]) }
      if (data.bookings) storage.setBookings(data.bookings as Booking[])
      if (data.services) { storage.setServices(data.services as LocalService[]); setServices(data.services as LocalService[]) }
    }

    const refreshFromSupabase = () => loadSiteDataFromSupabase().then(applyRemoteData)
    refreshFromSupabase()

    const interval = window.setInterval(refreshFromSupabase, 15000)
    window.addEventListener('focus', refreshFromSupabase)

    const channel = isSupabaseConfigured
      ? supabase
          .channel('public-site-config-main')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config', filter: 'id=eq.main' }, (payload) => {
            applyRemoteData((payload.new as { data?: unknown })?.data as Awaited<ReturnType<typeof loadSiteDataFromSupabase>>)
          })
          .subscribe()
      : null

    const sync = () => {
      setSettings(storage.getSettings())
      setRooms(storage.getRooms())
      setVideos(storage.getVideos())
      setTemples(storage.getTemples())
      setServices(storage.getServices())
      setReviews(storage.getReviews())
    }
    window.addEventListener('sst-storage-updated', sync)
    return () => {
      window.removeEventListener('sst-storage-updated', sync)
      window.removeEventListener('focus', refreshFromSupabase)
      window.clearInterval(interval)
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const publicVideos = useMemo(() => videos.filter((video) => video.visibility !== 'unlisted'), [videos])
  const promoVideo = publicVideos[0] ?? videos[0]

  const openBooking = (roomName?: string) => {
    if (roomName) setSelectedRoom(roomName)
    setBookingOpen(true)
    setTimeout(() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const createBooking = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!guestName || !phone) return
    const room = selectedRoom || rooms[0]?.name || ''
    setBookingBusy(true)
    setBookingMsg('')
    const result = await submitInquiry({ kind: 'room', name: guestName, phone, room, guests, preferredDate: checkIn || undefined, website: bookingTrap })
    setBookingBusy(false)
    if (!result.ok) {
      setBookingMsg(`${result.error} Call: ${settings.phone} / ${settings.secondaryPhone}`)
      return
    }
    const roomPrice = rooms.find((item) => item.name === room)?.price
    trackEvent('Lead', {
      content_name: room,
      content_category: 'Room Booking',
      ...(roomPrice ? { value: roomPrice, currency: 'INR' } : {}),
    })
    setGuestName('')
    setPhone('')
    setCheckIn('')
    setBookingOpen(false)
    setBookingMsg(`✅ Aapki inquiry ${result.ref} mil gayi hai. Seva desk aapse jald sampark karegi. 🙏`)
  }

  const addReview = async (review: Review) => {
    const updated = [review, ...reviews]
    setReviews(updated)
    storage.setReviews(updated)
    await saveSiteDataToSupabase({ settings, rooms, videos, temples, services, bookings: storage.getBookings(), reviews: updated })
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffaf1]" style={{ backgroundColor: settings.lightColor } as React.CSSProperties}>
      <Navbar onBook={() => openBooking()} settings={settings} />
      {promoVideo && <VideoPopup youtubeUrl={promoVideo.youtubeUrl} videoSrc={promoVideo.src} poster={promoVideo.poster} temples={temples} source={promoVideo.popupSource || 'storage'} trigger={promoTrigger} />}
      <main>
      <section className="relative flex min-h-[88svh] items-center overflow-hidden bg-[#2a0611] px-4 pb-16 pt-28 text-white sm:px-6 lg:min-h-screen lg:px-8">
        <motion.div style={{ y: heroY, scale: heroScale }} className="absolute inset-0">
          <img
            src={settings.heroImage}
            alt="Ayodhya Dham — Shri Ram Janki Seva Trust"
            className="h-full w-full object-cover opacity-65"
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#24020c] via-[#4b0718]/80 to-[#24020c]/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(215,168,79,0.28),transparent_42%)]" />
        </motion.div>
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 35 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7a84f]/40 bg-white/10 px-4 py-2 text-sm text-[#f5d891] backdrop-blur">
              <Sparkles className="h-4 w-4" /> Yatri Niwas · Ramghat, {settings.location}
            </div>
            <h1 className="mt-6 font-serif text-4xl font-black leading-tight sm:text-5xl md:text-6xl">
              यात्रियों के ठहरने की <span className="text-[#f5d891]">उत्तम व्यवस्था</span>
            </h1>
            <p className="mt-3 font-serif text-xl text-[#f5d891]/90 sm:text-2xl">श्री राम जानकी सेवा ट्रस्ट · Shri Ram Janki Seva Trust</p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              A.C., Non-A.C. rooms and group stay for pilgrims at Luvkushnagar, Ramghat, Ayodhya Dham. Katha, pooja and anushthan are also arranged{settings.maharajName ? ` under ${settings.maharajName}` : ''}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['A.C. Rooms', 'Non-A.C. Rooms', 'Group Stay', 'Katha & Pooja'].map((item) => (
                <span key={item} className="rounded-full border border-[#d7a84f]/35 bg-[#2a0611]/45 px-4 py-2 text-sm font-bold text-[#f5d891] backdrop-blur">{item}</span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#rooms" className="rounded-full bg-gradient-to-r from-[#d7a84f] to-[#fff0ad] px-8 py-4 text-center font-black text-[#4b0718] shadow-2xl shadow-[#d7a84f]/30 transition hover:scale-105">
                View Rooms &amp; Book
              </a>
              <a href={`tel:${settings.phone}`} onClick={() => trackEvent('Contact', { content_name: 'Hero Call' })} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-8 py-4 text-center font-bold text-white backdrop-blur transition hover:bg-white/20">
                <Phone className="h-4 w-4" /> Call Now
              </a>
              <a href={`https://wa.me/91${settings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Jai Shri Ram, mujhe Yatri Niwas ke baare me jaankari chahiye.')}`} target="_blank" rel="noreferrer" onClick={() => trackEvent('Contact', { content_name: 'Hero WhatsApp' })} className="rounded-full border border-[#d7a84f]/45 bg-[#2a0611]/55 px-8 py-4 text-center font-bold text-[#f5d891] backdrop-blur transition hover:bg-[#2a0611]/80">
                WhatsApp
              </a>
              {promoVideo && (
                <button onClick={() => setPromoTrigger((value) => value + 1)} className="rounded-full border border-white/25 px-8 py-4 text-center font-bold text-white/85 backdrop-blur transition hover:bg-white/10">
                  Watch Video
                </button>
              )}
            </div>
            <p className="mt-5 text-sm text-white/70">
              Also: <a href="#seva" className="font-semibold text-[#f5d891] underline underline-offset-4">Katha &amp; Pooja</a> · <a href="#donate" className="font-semibold text-[#f5d891] underline underline-offset-4">Donate / दान करें</a>
            </p>
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              {[['Stay', 'A.C. / Non-A.C.'], ['Location', 'Ramghat'], ['Seva', 'Katha · Pooja']].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur sm:p-4">
                  <p className="break-words font-serif text-base font-bold leading-tight text-[#f5d891] sm:text-xl">{value}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-white/60">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 35 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 0.15 }} className="hidden rounded-[2rem] border border-[#d7a84f]/30 bg-white/10 p-4 backdrop-blur lg:block">
            <img src={settings.heroCardImage} alt="Shri Ram Janki Seva Trust, Ayodhya Dham" decoding="async" className="h-[520px] w-full rounded-[1.5rem] object-cover" />
          </motion.div>
        </div>
        <a href="#rooms" aria-label="Scroll to rooms" className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 animate-bounce text-sm font-bold text-[#f5d891]/90">Rooms ↓</a>
      </section>

      <section id="rooms" className="scroll-mt-16 px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <SectionTitle eyebrow="Yatri Niwas · Rooms" title="Choose your room" text="A.C. rooms, Non-A.C. rooms and group stay for yatris. Tap Book Now to send a request, or call the seva desk for tariff and availability." />
        <div className="mx-auto mb-8 flex max-w-5xl flex-wrap justify-center gap-3">
          {['A.C. Rooms', 'Non-A.C. Rooms', 'Group Stay'].map((item) => (
            <span key={item} className="rounded-full bg-[#4b0718] px-5 py-3 text-sm font-black text-[#f5d891] shadow-lg shadow-[#4b0718]/15">{item}</span>
          ))}
        </div>
        <div className="mx-auto mb-10 grid max-w-7xl gap-4 rounded-[2rem] border border-[#d7a84f]/25 bg-white p-5 shadow-xl shadow-[#4b0718]/10 md:grid-cols-3">
          <div className="flex items-center gap-3"><Clock className="h-8 w-8 text-[#b7812d]" /><div><p className="font-bold text-[#4b0718]">Check-In / Check-Out</p><p className="text-sm text-[#6b5560]">{settings.checkIn} / {settings.checkOut}</p></div></div>
          <div className="flex items-center gap-3"><ShieldCheck className="h-8 w-8 text-[#b7812d]" /><div><p className="font-bold text-[#4b0718]">Seva Desk</p><p className="text-sm text-[#6b5560]">{settings.phone}, {settings.secondaryPhone}</p></div></div>
          <div className="flex items-center gap-3"><MapPin className="h-8 w-8 text-[#b7812d]" /><div><p className="font-bold text-[#4b0718]">Location</p><p className="text-sm text-[#6b5560]">Luvkushnagar, Ramghat, Ayodhya</p></div></div>
        </div>
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-3">
          {rooms.map((room) => <RoomCard key={room.id} room={room} onPay={setPayRoom} onBook={openBooking} whatsapp={settings.whatsapp} phone={settings.phone} />)}
        </div>
      </section>

      <section id="booking" className="scroll-mt-16 border-t border-[#d7a84f]/25 bg-[#fff3d8] px-4 py-16 text-[#4b0718] sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#b7812d]">Yatri Niwas</p>
            <h2 className="mt-3 font-serif text-5xl font-bold">Request a stay.</h2>
            <p className="mt-5 leading-8 text-[#6b5560]">Send your stay request to the trust. The seva desk will check availability and contact you.</p>
            <div className="mt-8 space-y-3 text-[#4b0718]/85">
              <p className="flex items-center gap-3"><Phone className="h-5 w-5 text-[#b7812d]" /> {settings.phone}, {settings.secondaryPhone}{settings.helpline ? ` • Helpline ${settings.helpline}` : ''}</p>
              <p className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#b7812d]" /> {settings.address}</p>
            </div>
            <a href="#seva" className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#4b0718]/25 bg-white/70 px-5 py-3 text-sm font-bold text-[#4b0718] transition hover:bg-white">Planning a katha or pooja too? See Katha &amp; Pooja ↓</a>
          </div>
          <form onSubmit={createBooking} className={`rounded-[2rem] border border-[#d7a84f]/25 bg-white p-6 text-[#4b0718] shadow-2xl ${bookingOpen ? 'ring-4 ring-[#d7a84f]/40' : ''}`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required placeholder="Guest name" className="admin-input" autoComplete="name" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="numeric" placeholder="Mobile number" className="admin-input" autoComplete="tel" />
              <select value={selectedRoom || rooms[0]?.name || ''} onChange={(e) => setSelectedRoom(e.target.value)} className="admin-input">
                {rooms.map((room) => <option key={room.id} value={room.name}>{room.name}</option>)}
              </select>
              <input value={checkIn} onChange={(e) => setCheckIn(e.target.value)} type="date" aria-label="Arrival date" className="admin-input" />
              <input value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="Guests" className="admin-input sm:col-span-2" />
            </div>
            <input value={bookingTrap} onChange={(e) => setBookingTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" name="website" />
            {bookingMsg && <p role="status" className="mt-4 rounded-xl bg-[#fff8eb] p-3 text-sm font-semibold text-[#4b0718]">{bookingMsg}</p>}
            <button disabled={bookingBusy} className="mt-6 w-full rounded-full bg-[#d7a84f] px-6 py-4 font-black text-[#4b0718] disabled:opacity-60">{bookingBusy ? 'Sending...' : 'Send Stay Request'}</button>
          </form>
        </div>
      </section>

      <SevaSection settings={settings} onInquire={(seva) => setSevaModal(seva.title)} />
      <div className="bg-gradient-to-r from-[#4b0718] via-[#6b0f24] to-[#4b0718] px-4 py-8 text-center text-white sm:px-6">
        <p className="font-serif text-xl font-bold text-[#f5d891] sm:text-2xl">सेवा में सहभागी बनें — Be a part of the seva</p>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-white/75">Your donation supports katha, yagya, pooja and yatri seva at the trust.</p>
        <a href="#donate" className="mt-4 inline-flex rounded-full bg-[#d7a84f] px-7 py-3 text-sm font-black text-[#4b0718] shadow-lg transition hover:scale-105">Donate / दान करें ↓</a>
      </div>

      <DonationSection settings={settings} />

      <section id="story" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative">
            <img src={settings.storyImage} alt="Shri Ram Janki Seva Trust, Ayodhya Dham" loading="lazy" decoding="async" className="h-full min-h-[520px] rounded-[2rem] object-cover shadow-2xl" />
            <div className="absolute -bottom-8 right-8 rounded-[2rem] bg-[#4b0718] p-6 text-white shadow-xl">
              <HeartHandshake className="mb-3 h-8 w-8 text-[#f5d891]" />
              <p className="font-serif text-2xl font-bold">Seva + Bhakti</p>
              <p className="mt-1 text-sm text-white/65">Dharma, katha and yatri seva in Ayodhya Dham.</p>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#b7812d]">Our Story</p>
            <h2 className="mt-3 font-serif text-5xl font-bold text-[#4b0718]">Katha, anushthan and seva in the holy land of Ayodhya.</h2>
            <p className="mt-6 leading-8 text-[#6b5560]">
              {settings.trustName} is located at {settings.address}.{settings.maharajName && <> Katha and anushthan are conducted under <strong className="text-[#4b0718]">{settings.maharajName}</strong>, Shridham Ayodhya Ji.</>} The trust arranges Shrimad Bhagwat Katha, Ram Katha, Yagya anushthan and pooja, and provides comfortable stay for pilgrims visiting Ayodhya Dham.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[ShieldCheck, CalendarCheck, MapPin].map((Icon, index) => (
                <div key={index} className="rounded-2xl border border-[#d7a84f]/20 bg-white p-5 shadow-lg">
                  <Icon className="h-7 w-7 text-[#b7812d]" />
                  <p className="mt-3 text-sm font-bold text-[#4b0718]">{['Yatri Niwas', `${settings.checkIn} / ${settings.checkOut}`, 'Ramghat, Ayodhya'][index]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="location" className="bg-white px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#b7812d]">Location & Distances</p>
            <h2 className="mt-3 font-serif text-5xl font-bold text-[#4b0718]">Luvkushnagar, Ramghat, Ayodhya</h2>
            <p className="mt-5 leading-8 text-[#6b5560]">{settings.address}</p>
            <p className="mt-3 text-sm font-semibold text-[#4b0718]">Near Shyama Sadan (opposite), Ramghat — Ayodhya Ji</p>
            <div className="mt-8 grid gap-3 text-sm text-[#4b0718]">
              {['Shri Ram Janmabhoomi Temple', 'Hanuman Garhi', 'Kanak Bhawan', 'Saryu Ghat'].map((item) => (
                <div key={item} className="rounded-2xl bg-[#fff8eb] p-4 font-semibold">{item} — nearby, ask the seva desk for directions</div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-[#d7a84f]/25 shadow-2xl shadow-[#4b0718]/10">
            <iframe
              title="Google Maps - Shri Ram Janki Seva Trust, Ayodhya"
              src={`https://www.google.com/maps?q=${encodeURIComponent(settings.mapQuery)}&output=embed`}
              className="h-[560px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="bg-[#4b0718] p-4 text-center">
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.mapQuery)}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-[#d7a84f] px-6 py-3 font-black text-[#4b0718]">
                Get Direction on Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      <AyodhyaGuide temples={temples} />

      <LocalServices services={services} settings={settings} />

      {videos.length > 0 && (
      <section id="video" className="bg-[#26040e] px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#f5d891]">Videos</p>
            <h2 className="mt-3 font-serif text-4xl font-bold md:text-5xl">Katha, darshan and trust moments.</h2>
          </div>
          <OTTPlayer videos={publicVideos.length ? publicVideos : videos} />
        </div>
      </section>
      )}

      {reviews.length > 0 && (
      <section className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Ratings & Testimonials" title="Words from our devotees and guests" text="Reviews added by the trust from the admin panel." />
          <TestimonialWidget reviews={reviews} onAdd={addReview} />
        </div>
      </section>
      )}

      <section id="policies" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionTitle eyebrow="Guidelines" title="Stay and seva guidelines" text="Simple guidelines for pilgrims and devotees. Detailed policies are available on the links below." />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-[#d7a84f]/25 bg-white p-7 shadow-xl shadow-[#4b0718]/10">
              <div className="mb-4 flex items-center gap-3 font-serif text-2xl font-bold text-[#4b0718]"><FileText className="text-[#b7812d]" /> Yatri Niwas</div>
              <ul className="space-y-3 text-sm leading-6 text-[#6b5560]">
                <li>All guests must carry valid government ID proof at check-in.</li>
                <li>Check-in {settings.checkIn} · Check-out {settings.checkOut}. Early check-in or late check-out depends on availability.</li>
                <li>Please maintain the religious and social dignity of the premises. Damage to property must be compensated.</li>
                <li>Room availability and tariff are confirmed by the seva desk on call.</li>
              </ul>
            </div>
            <div className="rounded-[2rem] border border-[#d7a84f]/25 bg-white p-7 shadow-xl shadow-[#4b0718]/10">
              <div className="mb-4 flex items-center gap-3 font-serif text-2xl font-bold text-[#4b0718]"><ShieldCheck className="text-[#b7812d]" /> Katha, Pooja &amp; Donation</div>
              <ul className="space-y-3 text-sm leading-6 text-[#6b5560]">
                <li>Dates, arrangements and terms for katha, yagya and pooja are settled directly with the trust.</li>
                <li>Donations are paid directly to the trust&apos;s own UPI ID / bank account shown on this website.</li>
                <li>Please keep your payment reference and share it with the seva desk if you need acknowledgement.</li>
                <li><strong className="text-[#4b0718]">Contact:</strong> {settings.maharajName || settings.trustName} — {settings.phone}, {settings.secondaryPhone}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      </main>

      <footer className="border-t border-[#d7a84f]/20 bg-[#180209] px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="font-serif text-2xl font-bold">{settings.trustName}</p>
            {settings.maharajName && <p className="mt-1 text-sm text-white/75">Contact: <strong className="text-[#f5d891]">{settings.maharajName}</strong>, Shridham Ayodhya Ji</p>}
            <p className="mt-1 text-sm text-white/55">Official Address: {settings.address}</p>
            <p className="mt-1 text-sm text-white/55">Mobile: {settings.phone}, {settings.secondaryPhone}{settings.helpline ? ` • Helpline: ${settings.helpline}` : ''}</p>
            <p className="mt-2 text-xs text-white/35">© {new Date().getFullYear()} {settings.trustName}. All rights reserved.</p>
            <nav aria-label="Policies" className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
              <a href="/privacy" className="underline-offset-2 hover:underline">Privacy Policy</a>
              <a href="/terms" className="underline-offset-2 hover:underline">Terms</a>
              <a href="/refund-policy" className="underline-offset-2 hover:underline">Cancellation &amp; Refund</a>
              <a href="/contact" className="underline-offset-2 hover:underline">Contact</a>
            </nav>
          </div>
          <a href={`tel:${settings.phone}`} onClick={() => trackEvent('Contact', { method: 'call' })} className="rounded-full border border-[#d7a84f]/35 px-6 py-3 text-[#f5d891]">Call Seva Desk</a>
        </div>
      </footer>
      {payRoom && <BookPayModal room={payRoom} onClose={() => setPayRoom(null)} />}
      {sevaModal !== null && <InquiryModal initialSeva={sevaModal} phone={settings.phone} onClose={() => setSevaModal(null)} />}
      <FloatingActions settings={settings} />
      <InstallPrompt />
    </div>
  )
}

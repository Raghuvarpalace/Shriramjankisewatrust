import type { Booking, LocalService, Review, Room, Settings, Temple, VideoItem } from '../types'

const STORAGE_KEYS = {
  settings: 'sst-settings',
  rooms: 'sst-rooms',
  videos: 'sst-videos',
  reviews: 'sst-reviews',
  bookings: 'sst-bookings',
  temples: 'sst-temples',
  services: 'sst-services',
  authed: 'sst-admin-authed',
}

export const defaultSettings: Settings = {
  trustName: 'Shri Ram Janki Seva Trust',
  location: 'Ayodhya Dham',
  phone: '9454191686',
  secondaryPhone: '9670000112',
  helpline: '',
  email: 'panditneerajtiwari@gmail.com',
  whatsapp: '9454191686',
  address: 'Shri Ram Janki Seva Trust, Luvkushnagar, Ramghat (near Shyama Sadan), Ayodhya Dham',
  logoText: 'श्री राम जानकी',
  upiId: '',
  checkIn: '12:00 PM',
  checkOut: '11:00 AM',
  mapQuery: 'Shri Ram Janki Seva Trust Luvkushnagar Ramghat Ayodhya',
  paymentQr: '',
  appInstallQr: '',
  checkinQr: '',
  roomServiceQr: '',
  logoUrl: '/images/trust-logo.png',
  heroImage: '/images/hero-ram-mandir-ai.png',
  heroCardImage: '/images/hero-ram-mandir.jpg',
  storyImage: '/images/hero-ram-mandir.jpg',
  showLogo: true,
  primaryColor: '#4b0718',
  accentColor: '#d7a84f',
  lightColor: '#fffaf1',
  maharajName: 'Neeraj Das Ji Maharaj',
  registrationNo: '',
  panNo: '',
  taxNote: '',
  bankAccountName: '',
  bankName: '',
  bankAccountNo: '',
  bankIfsc: '',
  bankBranch: '',
}

// Room prices are 0 on purpose: the site shows "Call for tariff" until the admin sets real rates (Admin > Rooms).
const roomPlaceholder = '/images/hero-ram-mandir.jpg'
export const defaultRooms: Room[] = [
  {
    id: 'ac-room',
    name: 'A.C. Room',
    tagline: 'Comfortable A.C. stay for pilgrims and families',
    description: 'A.C. room for yatris visiting Ayodhya Dham. Update this description, price and photos from Admin > Rooms.',
    price: 0,
    tax: 0,
    available: 1,
    capacity: 'Family',
    size: 'As per room',
    floor: 'Ground / 1st Floor',
    bathType: 'Attached bath',
    image: roomPlaceholder,
    gallery: [roomPlaceholder],
    amenities: ['A.C.', 'Clean bedding', 'Drinking water'],
  },
  {
    id: 'non-ac-room',
    name: 'Non A.C. Room',
    tagline: 'Simple and affordable stay for yatris',
    description: 'Non A.C. room for pilgrims. Update this description, price and photos from Admin > Rooms.',
    price: 0,
    tax: 0,
    available: 1,
    capacity: 'Family',
    size: 'As per room',
    floor: 'Ground / 1st Floor',
    bathType: 'Bath as per room',
    image: roomPlaceholder,
    gallery: [roomPlaceholder],
    amenities: ['Non A.C.', 'Clean bedding', 'Drinking water'],
  },
  {
    id: 'dormitory',
    name: 'Dormitory / Group Stay',
    tagline: 'For yatri groups and katha parties',
    description: 'Group accommodation for pilgrim batches. Update this description, price and photos from Admin > Rooms.',
    price: 0,
    tax: 0,
    available: 1,
    capacity: 'Group',
    size: 'Hall',
    floor: 'As per availability',
    bathType: 'Common bath',
    image: roomPlaceholder,
    gallery: [roomPlaceholder],
    amenities: ['Group stay', 'Drinking water'],
  },
]

// Promo videos are added from Admin > Media. Empty by default so no other trust's video is shown.
export const defaultVideos: VideoItem[] = []

export const defaultTemples: Temple[] = [
  {
    id: 'ram-mandir',
    name: 'Shri Ram Janmabhoomi Temple',
    distance: 'Near Ramghat, Ayodhya',
    image: '/images/temples/ram-mandir-real.jpg',
    description: 'The sacred birthplace of Lord Ram and the central darshan destination for Ayodhya yatris.',
  },
  {
    id: 'hanuman-garhi',
    name: 'Hanuman Garhi',
    distance: 'Ayodhya Dham',
    image: '/images/temples/hanuman-garhi-real.jpg',
    description: 'A revered Hanuman ji temple and one of the most important pilgrimage stops in Ayodhya.',
  },
  {
    id: 'kanak-bhawan',
    name: 'Kanak Bhawan Temple',
    distance: 'Ayodhya Dham',
    image: '/images/temples/kanak-bhawan-real.jpg',
    description: 'A beautiful temple associated with Lord Ram and Mata Sita, known for its ornate devotional architecture.',
  },
]

export const defaultServices: LocalService[] = [
  {
    id: 'satvik-food',
    title: 'Satvik Food',
    subtitle: 'Fresh bhojan for families and yatris',
    description: 'Clean, homely and satvik vegetarian meals can be arranged for guests and katha parties. Please ask the seva desk for timings.',
    image: '/images/services/food.jpg',
    highlights: ['Breakfast / Lunch / Dinner support', 'Family-friendly vegetarian meals', 'Group bhojan coordination'],
    cta: 'Ask for Food Timing',
  },
  {
    id: 'transportation',
    title: 'Local Transport Help',
    subtitle: 'Easy movement across Ayodhya Dham',
    description: 'Ask the seva desk for help with station pickup, airport transfer and darshan route transport.',
    image: '/images/services/transport.jpg',
    highlights: ['Railway station & airport help', 'Darshan route planning', 'Group travel support'],
    cta: 'Request Transport',
  },
  {
    id: 'ayodhya-guide',
    title: 'Ayodhya Darshan Guide',
    subtitle: 'A local guide to show sacred places',
    description: 'A knowledgeable local guide can help guests explore Ram Mandir, Hanuman Garhi, Kanak Bhawan, Saryu Ghat and other important sites.',
    image: '/images/services/guide.jpg',
    highlights: ['Main temple darshan route', 'Local history & guidance', 'Family/group tour support'],
    cta: 'Book Local Guide',
  },
]

export const defaultReviews: Review[] = []

export const defaultBookings: Booking[] = []

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : fallback
  } catch {
    return fallback
  }
}

function setStored<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event('sst-storage-updated'))
}

function mergeSettings(value: Settings): Settings {
  return { ...defaultSettings, ...value }
}

function mergeVideos(value: VideoItem[]): VideoItem[] {
  return value.map((video) => ({ ...video, visibility: video.visibility || 'public', popupSource: video.popupSource || 'storage' }))
}

export const storage = {
  keys: STORAGE_KEYS,
  getSettings: () => mergeSettings(getStored<Settings>(STORAGE_KEYS.settings, defaultSettings)),
  setSettings: (value: Settings) => setStored(STORAGE_KEYS.settings, value),
  getRooms: () => getStored<Room[]>(STORAGE_KEYS.rooms, defaultRooms),
  setRooms: (value: Room[]) => setStored(STORAGE_KEYS.rooms, value),
  getVideos: () => mergeVideos(getStored<VideoItem[]>(STORAGE_KEYS.videos, defaultVideos)),
  setVideos: (value: VideoItem[]) => setStored(STORAGE_KEYS.videos, value),
  getReviews: () => getStored<Review[]>(STORAGE_KEYS.reviews, defaultReviews),
  setReviews: (value: Review[]) => setStored(STORAGE_KEYS.reviews, value),
  getBookings: () => getStored<Booking[]>(STORAGE_KEYS.bookings, defaultBookings),
  setBookings: (value: Booking[]) => setStored(STORAGE_KEYS.bookings, value),
  getTemples: () => getStored<Temple[]>(STORAGE_KEYS.temples, defaultTemples),
  setTemples: (value: Temple[]) => setStored(STORAGE_KEYS.temples, value),
  getServices: () => getStored<LocalService[]>(STORAGE_KEYS.services, defaultServices),
  setServices: (value: LocalService[]) => setStored(STORAGE_KEYS.services, value),
}

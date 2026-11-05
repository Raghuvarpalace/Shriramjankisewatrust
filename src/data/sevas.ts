// ROOT PATH: src/data/sevas.ts
// Katha / pooja / anushthan list shown in the "Katha & Pooja" section.
// Edit this file to add, remove or reword a seva. No prices are shown on purpose:
// the trust shares details on call / WhatsApp.
export type SevaIcon = 'book' | 'ram' | 'flame' | 'water' | 'planet' | 'sparkle' | 'star'

export type Seva = {
  id: string
  title: string
  titleHi: string
  description: string
  icon: SevaIcon
}

export const SEVAS: Seva[] = [
  {
    id: 'bhagwat-katha',
    title: 'Shrimad Bhagwat Katha',
    titleHi: 'श्रीमद् भागवत कथा',
    description: 'Shrimad Bhagwat Katha by Neeraj Das Ji Maharaj. Contact the trust to plan dates, schedule and arrangements.',
    icon: 'book',
  },
  {
    id: 'ram-katha',
    title: 'Ram Katha',
    titleHi: 'राम कथा',
    description: 'Ram Katha for families, societies and special occasions. Share your preferred dates and we will get back to you.',
    icon: 'ram',
  },
  {
    id: 'yagya-anushthan',
    title: 'Yagya & Anushthan',
    titleHi: 'यज्ञ अनुष्ठान',
    description: 'Vedic yagya and anushthan performed with proper vidhi. Tell us the occasion and we will guide you.',
    icon: 'flame',
  },
  {
    id: 'rudrabhishek',
    title: 'Rudrabhishek',
    titleHi: 'रुद्राभिषेक',
    description: 'Rudrabhishek of Lord Shiva with Vedic mantras for peace and well-being of the family.',
    icon: 'water',
  },
  {
    id: 'navgrah-pooja',
    title: 'Navgrah Pooja',
    titleHi: 'नवग्रह पूजा',
    description: 'Navgrah shanti pooja as per your kundli or occasion.',
    icon: 'planet',
  },
  {
    id: 'ramarcha-pooja',
    title: 'Ramarcha Pooja',
    titleHi: 'रामार्चा पूजा',
    description: 'Ramarcha pooja and Ram worship in the sacred land of Ayodhya Dham.',
    icon: 'sparkle',
  },
  {
    id: 'astrology',
    title: 'Astrology Guidance',
    titleHi: 'ज्योतिष परामर्श',
    description: 'Jyotish guidance and muhurat advice. Please call or send your details to book a consultation.',
    icon: 'star',
  },
]

export const DONATION_PURPOSES = [
  'General seva (as per trust need)',
  'Katha / Yagya seva',
  'Yatri niwas seva',
  'Other (as per my wish)',
]

export const DONATION_AMOUNTS = [101, 501, 1100, 2100, 5100, 11000]

const phoneNumber = "919667038673";

function createWhatsAppLink(message: string) {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export const site = {
  name: "Kidzee Preschool & Daycare, Sector 12 Dwarka",
  shortName: "Kidzee Sector 12, Dwarka",
  legalLocationName: "Sector 12B, Dwarka",

  url: "https://kidzeepreschooldwarka.com",

  phone: "+919667038673",
  phoneDisplay: "+91 96670 38673",
  phoneDigits: phoneNumber,

  email: "kidzeepreschoolsector12@gmail.com",

  address:
    "Building No. 19, Block B, Sector 12B, Dwarka, New Delhi, Delhi 110075",
  addressShort: "Building No. 19, Block B, Sector 12B, Dwarka, Delhi",
  postalCode: "110075",
  locality: "Dwarka",
  region: "Delhi",
  country: "IN",

  map:
    "https://www.google.com/maps/search/?api=1&query=Kidzee+Sector+12+Dwarka",

  mapEmbed:
    "https://www.google.com/maps?q=Kidzee%20Sector%2012%20Dwarka%2C%20Building%20No.%2019%2C%20Block%20B%2C%20Sector%2012B%2C%20Dwarka%2C%20New%20Delhi%20110075&output=embed",

  googleReviews:
    "https://www.google.com/search?q=Kidzee+Sector+12+Dwarka+reviews",

  whatsappBase: `https://wa.me/${phoneNumber}`,

  whatsapp: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to know more about preschool and daycare."
  ),

  whatsappAdmission: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to enquire about admission for my child."
  ),

  whatsappVisit: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to book a school visit."
  ),

  whatsappTrial: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to know about the 3-day preschool trial."
  ),

  whatsappProgrammes: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. Please help me choose the right preschool programme for my child."
  ),

  whatsappDaycare: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to know more about daycare timings, meals, activities and availability."
  ),

  instagram: "https://www.instagram.com/kidz.eedwarka" as string,
  facebook: null,
  youtube: null,

  preschoolHours: {
    days: "Monday to Friday",
    opens: "08:30",
    closes: "13:00",
    display: "8:30 AM–1:00 PM",
  },

  daycareHours: {
    days: "Monday to Friday",
    opens: "12:30",
    closes: "19:00",
    display: "12:30 PM–7:00 PM",
  },

  trial: {
    days: 3,
    hoursPerDay: 2,
    display: "3-day trial available",
  },

  ageRange: {
    minimum: 2,
    maximum: 6,
    display: "2–6 years",
  },
} as const;

export const programmes = [
  {
    slug: "playgroup",
    title: "Playgroup",
    shortTitle: "Playgroup",
    age: "2–3 years",
    minimumAge: 2,
    maximumAge: 3,
    // Playgroup
time: "9:30 AM–12:30 PM",
    image: "/images/programmes/playgroup.jpg",
    intro:
      "A gentle introduction to preschool where children become comfortable with routines, teachers and learning alongside others.",
    highlights: [
      "Comfort with the first school experience",
      "Language through stories, songs and conversation",
      "Sensory play, movement and social interaction",
    ],
  },
  {
    slug: "nursery",
    title: "Nursery",
    shortTitle: "Nursery",
    age: "3–4 years",
    minimumAge: 3,
    maximumAge: 4,
    // Nursery
time: "9:30 AM–12:30 PM",
    image: "/images/programmes/nursery.jpg",
    intro:
      "Children build communication, curiosity and independent classroom habits while beginning early literacy and number work.",
    highlights: [
      "Early phonics and vocabulary development",
      "Number awareness and simple concepts",
      "Creativity, confidence and classroom participation",
    ],
  },
  {
    slug: "junior-kg",
    title: "Junior KG",
    shortTitle: "Junior KG",
    age: "4–5 years",
    minimumAge: 4,
    maximumAge: 5,
    // Junior KG
time: "9:30 AM–1:00 PM",
    image: "/images/programmes/junior-kg.jpg",
    intro:
      "A more structured stage that develops reading readiness, writing practice, number understanding and independent thinking.",
    highlights: [
      "Reading and writing readiness",
      "Number concepts and logical thinking",
      "Independent work and confident expression",
    ],
  },
  {
    slug: "senior-kg",
    title: "Senior KG",
    shortTitle: "Senior KG",
    age: "5–6 years",
    minimumAge: 5,
    maximumAge: 6,
    // Senior KG
time: "9:30 AM–1:00 PM",
    image: "/images/programmes/senior-kg.jpg",
    intro:
      "Children strengthen essential academic and classroom skills as they prepare for a confident transition to primary school.",
    highlights: [
      "Stronger literacy and numeracy foundations",
      "Problem-solving and communication skills",
      "Primary-school readiness and independence",
    ],
  },
] as const;

export const posts = [
  {
    slug: "prepare-your-child-for-preschool",
    title: "How to Prepare Your Child for Preschool",
    excerpt:
      "Practical steps that can make the first few weeks of preschool easier for children and parents.",
    date: "2026-07-15",
  },
  {
    slug: "signs-child-is-ready-for-preschool",
    title: "Signs Your Child Is Ready for Preschool",
    excerpt:
      "Readiness is not only about age. These everyday behaviours can help parents understand whether a child is ready to begin.",
    date: "2026-07-10",
  },
  {
    slug: "play-based-learning",
    title: "Why Play-Based Learning Matters",
    excerpt:
      "How play supports language, movement, problem-solving, classroom participation and early academic understanding.",
    date: "2026-07-05",
  },
  {
    slug: "choosing-preschool-in-dwarka",
    title: "Choosing the Right Preschool in Dwarka",
    excerpt:
      "A practical checklist for comparing classrooms, routines, communication, facilities and everyday care.",
    date: "2026-06-28",
  },
  {
    slug: "building-social-skills",
    title: "Building Social Skills in the Early Years",
    excerpt:
      "How children practise sharing, turn-taking, listening, joining group activities and expressing their needs.",
    date: "2026-06-20",
  },
] as const;

export { createWhatsAppLink };
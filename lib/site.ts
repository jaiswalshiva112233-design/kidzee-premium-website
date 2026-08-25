const phoneNumber = "919667038673";

function createWhatsAppLink(message: string) {
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export const site = {
  name: "Kidzee Preschool & Daycare, Sector 12 Dwarka",
  shortName: "Kidzee Sector 12, Dwarka",
  legalLocationName: "Sector 12B, Dwarka",

  url: "https://kidzeedwarka.com",

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
    "Hello Kidzee Sector 12, Dwarka. I would like to know more about your preschool and daycare programmes.",
  ),

  whatsappAdmission: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to enquire about admission for my child.",
  ),

  whatsappVisit: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to book a school visit.",
  ),

  whatsappTrial: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to know about the three-day preschool trial.",
  ),

  whatsappProgrammes: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. Please help me choose the right preschool programme for my child.",
  ),

  whatsappDaycare: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to check daycare timings, meals and availability for my child.",
  ),

  whatsappFees: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. Please share the current fees and availability for my child.",
  ),

  whatsappCallback: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. Please arrange a callback regarding preschool admission.",
  ),

  whatsappMeals: createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to know more about the preschool meal plan.",
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
    display: "Three-day preschool trial available",
  },

  ageRange: {
    minimum: 2,
    maximum: 6,
    display: "2–6 years",
  },

  admissions: {
    academicYear: "2026–27",
    primaryAction: "Book a School Visit",
    secondaryAction: "Call Admissions",
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
    time: "9:30 AM–12:30 PM",
    image: "/images/programmes/playgroup.jpg",
    intro:
      "A warm first-school experience where children become comfortable with routines, teachers, classmates and learning through play.",
    highlights: [
      "A gentle transition into preschool",
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
    time: "9:30 AM–12:30 PM",
    image: "/images/programmes/nursery.jpg",
    intro:
      "A playful, purposeful programme that develops communication, curiosity, independence and early literacy and number readiness.",
    highlights: [
      "Early phonics and vocabulary development",
      "Number awareness and concept-building",
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
    time: "9:30 AM–1:00 PM",
    image: "/images/programmes/junior-kg.jpg",
    intro:
      "A structured but engaging stage that strengthens reading readiness, writing practice, number understanding and independent thinking.",
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
    time: "9:30 AM–1:00 PM",
    image: "/images/programmes/senior-kg.jpg",
    intro:
      "A school-readiness programme that builds stronger academic foundations, communication, independence and confidence for primary school.",
    highlights: [
      "Stronger literacy and numeracy foundations",
      "Problem-solving and communication skills",
      "Primary-school readiness and independence",
    ],
  },
] as const;

export const pentemindLearningMinds = [
  {
    name: "Empathetic Mind",
    focus: "Emotional balance",
    description:
      "Encourages children to understand their own feelings while becoming considerate of other people.",
  },
  {
    name: "Conscientious Mind",
    focus: "Knowledge acquisition",
    description:
      "Supports thoughtful choices, responsibility and careful participation in everyday learning.",
  },
  {
    name: "Focused Mind",
    focus: "Knowledge retention",
    description:
      "Helps children practise attention, persistence and the confidence to keep trying.",
  },
  {
    name: "Analytical Mind",
    focus: "Knowledge application",
    description:
      "Builds observation, reasoning and age-appropriate problem-solving through guided experiences.",
  },
  {
    name: "Inventive Mind",
    focus: "Knowledge development",
    description:
      "Makes room for imagination, original ideas, exploration and creative expression.",
  },
] as const;

export const pentemindOfferings = [
  {
    name: "Artsy",
    description:
      "Creative expression and an age-appropriate appreciation of art.",
  },
  {
    name: "Mental Might",
    description: "Emotional wellbeing, inclusion and awareness of others.",
  },
  {
    name: "Showstopper",
    description:
      "Confidence and expression through planned dramatic experiences.",
  },
  {
    name: "Tell-a-Tale",
    description: "Listening, imagination and early storytelling experiences.",
  },
  {
    name: "Whirl & Twirl",
    description: "Movement, coordination and expression through dance.",
  },
  {
    name: "Personality Development",
    description: "Self-esteem, communication and growing independence.",
  },
  {
    name: "Critical Thinking",
    description:
      "Systematic thinking, reasoning and age-appropriate problem-solving.",
  },
  {
    name: "Eco-Conscious",
    description: "Everyday awareness of nature and responsible choices.",
  },
] as const;

export const preschoolMealPlan = {
  title: "Weekly Preschool Meal Plan",
  meal: "Breakfast",
  includedInPreschoolProgramme: true,
  description:
    "Freshly cooked, 100% vegetarian preschool meals prepared without refined oil.",
  highlights: [
    "Freshly cooked",
    "100% vegetarian",
    "No refined oil",
    "Seasonal vegetables",
  ],
  days: [
    {
      day: "Monday",
      menu: "Dal and rice",
    },
    {
      day: "Tuesday",
      menu: "Seasonal green vegetable and chapati",
    },
    {
      day: "Wednesday",
      menu: "Vegetable pulao and curd",
    },
    {
      day: "Thursday",
      menu: "Mixed vegetable paratha and curd",
    },
    {
      day: "Friday",
      menu: "Aloo sabzi and chapati",
    },
  ],
  note:
    "The menu changes with the season and may be adjusted according to seasonal vegetable availability and the centre schedule.",
} as const;

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
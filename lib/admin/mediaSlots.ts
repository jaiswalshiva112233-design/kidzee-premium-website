export type MediaSlotType = "image" | "video";

export type MediaSlot = {
  key: string;
  page: string;
  section: string;
  label: string;
  description: string;
  type: MediaSlotType;
  fallbackPath: string;
  recommendedSize: string;
  allowRemove?: boolean;
};

export const homepageMediaSlots: MediaSlot[] = [
  {
    key: "home.hero.main",
    page: "Homepage",
    section: "Hero",
    label: "Main hero photo",
    description:
      "The large photograph shown on the right side of the homepage hero.",
    type: "image",
    fallbackPath: "/images/hero/hero-main.jpg",
    recommendedSize: "Landscape, minimum 1600 × 1200 px",
  },
  {
    key: "home.hero.classroom",
    page: "Homepage",
    section: "Hero",
    label: "Hero classroom photo",
    description:
      "Small classroom photograph shown below the main hero image.",
    type: "image",
    fallbackPath: "/images/hero/hero-classroom.jpg",
    recommendedSize: "Landscape or square, minimum 1000 × 800 px",
  },
  {
    key: "home.hero.teacher",
    page: "Homepage",
    section: "Hero",
    label: "Hero teacher photo",
    description:
      "Small photograph showing a teacher interacting with children.",
    type: "image",
    fallbackPath: "/images/hero/hero-teacher-class.jpg",
    recommendedSize: "Portrait or square, minimum 1000 × 1000 px",
  },
  {
    key: "home.hero.building",
    page: "Homepage",
    section: "Hero",
    label: "Hero centre building photo",
    description:
      "Small photograph showing the Kidzee Sector 12B centre building.",
    type: "image",
    fallbackPath: "/images/hero/hero-building.jpg",
    recommendedSize: "Landscape, minimum 1400 × 900 px",
  },

  {
    key: "home.about.main",
    page: "Homepage",
    section: "About",
    label: "About main photo",
    description:
      "The large photograph used in the homepage About section.",
    type: "image",
    fallbackPath: "/images/home/about/about-main.jpg",
    recommendedSize: "Portrait, minimum 1200 × 1500 px",
  },
  {
    key: "home.about.smallOne",
    page: "Homepage",
    section: "About",
    label: "About supporting photo 1",
    description:
      "The first smaller photograph beside the main About photo.",
    type: "image",
    fallbackPath: "/images/home/about/about-classroom1.jpg",
    recommendedSize: "Square, minimum 1000 × 1000 px",
  },
  {
    key: "home.about.smallTwo",
    page: "Homepage",
    section: "About",
    label: "About supporting photo 2",
    description:
      "The second smaller photograph beside the main About photo.",
    type: "image",
    fallbackPath: "/images/home/about/about-classroom2.jpg",
    recommendedSize: "Square or portrait, minimum 1000 × 1200 px",
  },

  {
    key: "home.programmes.playgroup",
    page: "Homepage",
    section: "Programmes",
    label: "Playgroup card photo",
    description:
      "Photo displayed on the Playgroup programme card.",
    type: "image",
    fallbackPath: "/images/programmes/playgroup.jpg",
    recommendedSize: "Landscape, minimum 1200 × 900 px",
  },
  {
    key: "home.programmes.nursery",
    page: "Homepage",
    section: "Programmes",
    label: "Nursery card photo",
    description:
      "Photo displayed on the Nursery programme card.",
    type: "image",
    fallbackPath: "/images/programmes/nursery.jpg",
    recommendedSize: "Landscape, minimum 1200 × 900 px",
  },
  {
    key: "home.programmes.juniorKg",
    page: "Homepage",
    section: "Programmes",
    label: "Junior KG card photo",
    description:
      "Photo displayed on the Junior KG programme card.",
    type: "image",
    fallbackPath: "/images/programmes/junior-kg.jpg",
    recommendedSize: "Landscape, minimum 1200 × 900 px",
  },
  {
    key: "home.programmes.seniorKg",
    page: "Homepage",
    section: "Programmes",
    label: "Senior KG card photo",
    description:
      "Photo displayed on the Senior KG programme card.",
    type: "image",
    fallbackPath: "/images/programmes/senior-kg.jpg",
    recommendedSize: "Landscape, minimum 1200 × 900 px",
  },

  {
    key: "home.daycare.main",
    page: "Homepage",
    section: "Daycare",
    label: "Daycare photo",
    description:
      "Main photograph displayed in the homepage Daycare section.",
    type: "image",
    fallbackPath: "/images/daycare/daycare-main.jpg",
    recommendedSize: "Portrait or landscape, minimum 1400 × 1200 px",
  },

  {
    key: "home.facilities.classroom",
    page: "Homepage",
    section: "Facilities",
    label: "Classroom facility photo",
    description:
      "Photo showing one of the preschool classrooms.",
    type: "image",
    fallbackPath: "/images/facilities/classroom-1.jpg",
    recommendedSize: "Landscape, minimum 1400 × 1000 px",
  },
  {
    key: "home.facilities.classroomTwo",
    page: "Homepage",
    section: "Facilities",
    label: "Second classroom photo",
    description:
      "Additional classroom photograph used in the Facilities section.",
    type: "image",
    fallbackPath: "/images/facilities/classroom-2.jpg",
    recommendedSize: "Landscape, minimum 1400 × 1000 px",
  },
  {
    key: "home.facilities.firstFloorPlay",
    page: "Homepage",
    section: "Facilities",
    label: "First-floor play area",
    description:
      "Photo showing the first-floor indoor play space.",
    type: "image",
    fallbackPath: "/images/facilities/first-floor-play.jpg",
    recommendedSize: "Landscape, minimum 1400 × 1000 px",
  },
  {
    key: "home.facilities.groundFloorPlay",
    page: "Homepage",
    section: "Facilities",
    label: "Ground-floor play area",
    description:
      "Photo showing the ground-floor play space.",
    type: "image",
    fallbackPath: "/images/facilities/ground-floor-play.jpg",
    recommendedSize: "Landscape, minimum 1400 × 1000 px",
  },

  {
    key: "home.gallery.featured",
    page: "Homepage",
    section: "Gallery preview",
    label: "Featured gallery photo",
    description:
      "The large featured photograph in the homepage gallery section.",
    type: "image",
    fallbackPath: "/images/gallery/gallery-featured.jpg",
    recommendedSize: "Portrait or landscape, minimum 1600 × 1400 px",
  },
  {
    key: "home.gallery.classroom",
    page: "Homepage",
    section: "Gallery preview",
    label: "Gallery classroom photo",
    description:
      "Homepage gallery photograph showing classroom life.",
    type: "image",
    fallbackPath: "/images/gallery/gallery-classroom.jpg",
    recommendedSize: "Landscape, minimum 1400 × 1000 px",
  },
  {
    key: "home.gallery.play",
    page: "Homepage",
    section: "Gallery preview",
    label: "Gallery play photo",
    description:
      "Homepage gallery photograph showing the play area.",
    type: "image",
    fallbackPath: "/images/gallery/gallery-play-area.jpg",
    recommendedSize: "Landscape, minimum 1400 × 1000 px",
  },
  {
    key: "home.gallery.activity",
    page: "Homepage",
    section: "Gallery preview",
    label: "Gallery activity photo",
    description:
      "Homepage gallery photograph showing a creative activity.",
    type: "image",
    fallbackPath: "/images/gallery/gallery-creative-activity.jpg",
    recommendedSize: "Landscape, minimum 1400 × 1000 px",
  },
  {
    key: "home.gallery.teachers",
    page: "Homepage",
    section: "Gallery preview",
    label: "Gallery teacher photo",
    description:
      "Homepage gallery photograph showing teachers with children.",
    type: "image",
    fallbackPath: "/images/gallery/gallery-teacher-children.jpg",
    recommendedSize: "Landscape, minimum 1400 × 1000 px",
  },
  {
    key: "home.gallery.centre",
    page: "Homepage",
    section: "Gallery preview",
    label: "Gallery centre photo",
    description:
      "Homepage gallery photograph showing the centre building.",
    type: "image",
    fallbackPath: "/images/gallery/gallery-building.jpg",
    recommendedSize: "Landscape, minimum 1600 × 1000 px",
  },
];

export const aboutMediaSlots: MediaSlot[] = [
  {
    key: "about.hero.main",
    page: "About",
    section: "About Hero",
    label: "About hero photo",
    description:
      "The large photograph displayed at the top of the About page.",
    type: "image",
    fallbackPath: "/images/hero/about-main.jpg",
    recommendedSize: "Portrait, minimum 1400 × 1800 px",
  },
  {
    key: "about.welcome.main",
    page: "About",
    section: "Welcome",
    label: "Welcome section photo",
    description:
      "The teacher-and-children photograph beside the welcome introduction.",
    type: "image",
    fallbackPath: "/images/hero/hero-teacher-class.jpg",
    recommendedSize: "Portrait, minimum 1400 × 1700 px",
  },
  {
    key: "about.environment.main",
    page: "About",
    section: "Learning Environment",
    label: "Learning environment main photo",
    description:
      "The large classroom photograph in the learning environment section.",
    type: "image",
    fallbackPath: "/images/facilities/classroom-1.jpg",
    recommendedSize: "Landscape, minimum 1600 × 1200 px",
  },
  {
    key: "about.environment.play",
    page: "About",
    section: "Learning Environment",
    label: "Learning through play photo",
    description:
      "The supporting photograph showing children learning through play.",
    type: "image",
    fallbackPath: "/images/facilities/first-floor-play.jpg",
    recommendedSize: "Square or landscape, minimum 1200 × 1000 px",
  },
  {
    key: "about.environment.activity",
    page: "About",
    section: "Learning Environment",
    label: "Learning activity photo",
    description:
      "The supporting photograph showing a classroom or creative activity.",
    type: "image",
    fallbackPath: "/images/gallery/gallery-creative-activity.jpg",
    recommendedSize: "Square or landscape, minimum 1200 × 1000 px",
  },
  {
    key: "about.safety.main",
    page: "About",
    section: "Safety & Care",
    label: "Safety and care photo",
    description:
      "The main photograph supporting the safety, supervision and care section.",
    type: "image",
    fallbackPath: "/images/gallery/gallery-teacher-children.jpg",
    recommendedSize: "Landscape, minimum 1600 × 1200 px",
  },
  {
    key: "about.facilities.classroom",
    page: "About",
    section: "Facilities",
    label: "Classroom facility photo",
    description:
      "The photograph showing a preschool classroom in the facilities section.",
    type: "image",
    fallbackPath: "/images/facilities/classroom-2.jpg",
    recommendedSize: "Landscape, minimum 1600 × 1200 px",
  },
  {
    key: "about.facilities.indoorPlay",
    page: "About",
    section: "Facilities",
    label: "Indoor play facility photo",
    description:
      "The photograph showing the indoor play space in the facilities section.",
    type: "image",
    fallbackPath: "/images/facilities/ground-floor-play.jpg",
    recommendedSize: "Landscape, minimum 1600 × 1200 px",
  },
  {
    key: "about.facilities.activity",
    page: "About",
    section: "Facilities",
    label: "Activity space photo",
    description:
      "The photograph showing an activity or creative learning space.",
    type: "image",
    fallbackPath: "/images/gallery/gallery-3.jpg",
    recommendedSize: "Landscape, minimum 1600 × 1200 px",
  },
  {
    key: "about.facilities.daycare",
    page: "About",
    section: "Facilities",
    label: "Daycare facility photo",
    description:
      "The photograph showing the daycare environment in the facilities section.",
    type: "image",
    fallbackPath: "/images/daycare/daycare-main.jpg",
    recommendedSize: "Landscape, minimum 1600 × 1200 px",
  },
];

export const programmeMediaSlots: MediaSlot[] = [
  {
    key: "programmes.hero.main",
    page: "Programmes",
    section: "Programmes Hero",
    label: "Programmes hero photo",
    description:
      "The large photograph at the top of the main Programmes page.",
    type: "image",
    fallbackPath: "/images/programmes/playgroup.jpg",
    recommendedSize: "Portrait, minimum 1400 × 1800 px",
  },
  {
    key: "programmes.cards.playgroup",
    page: "Programmes",
    section: "Programme Cards",
    label: "Playgroup photo",
    description:
      "Used on the Playgroup card and the Playgroup detail page.",
    type: "image",
    fallbackPath: "/images/programmes/playgroup.jpg",
    recommendedSize: "Landscape, minimum 1400 × 1100 px",
  },
  {
    key: "programmes.cards.nursery",
    page: "Programmes",
    section: "Programme Cards",
    label: "Nursery photo",
    description:
      "Used on the Nursery card and the Nursery detail page.",
    type: "image",
    fallbackPath: "/images/programmes/nursery.jpg",
    recommendedSize: "Landscape, minimum 1400 × 1100 px",
  },
  {
    key: "programmes.cards.junior-kg",
    page: "Programmes",
    section: "Programme Cards",
    label: "Junior KG photo",
    description:
      "Used on the Junior KG card and the Junior KG detail page.",
    type: "image",
    fallbackPath: "/images/programmes/junior-kg.jpg",
    recommendedSize: "Landscape, minimum 1400 × 1100 px",
  },
  {
    key: "programmes.cards.senior-kg",
    page: "Programmes",
    section: "Programme Cards",
    label: "Senior KG photo",
    description:
      "Used on the Senior KG card and the Senior KG detail page.",
    type: "image",
    fallbackPath: "/images/programmes/senior-kg.jpg",
    recommendedSize: "Landscape, minimum 1400 × 1100 px",
  },
  {
    key: "programmes.approach.main",
    page: "Programmes",
    section: "Learning Approach",
    label: "Learning approach photo",
    description:
      "The large activity photograph in the learning-approach section.",
    type: "image",
    fallbackPath: "/images/programmes/nursery.jpg",
    recommendedSize: "Portrait, minimum 1400 × 1700 px",
  },
];

export const daycareMediaSlots: MediaSlot[] = [
  {
    key: "daycare.hero.main",
    page: "Daycare",
    section: "Daycare Hero",
    label: "Daycare main photo",
    description:
      "The large photograph at the top of the public Daycare page.",
    type: "image",
    fallbackPath: "/images/daycare/daycare-main.jpg",
    recommendedSize: "Portrait, minimum 1400 × 1700 px",
  },
];

export const allMediaSlots: MediaSlot[] = [
  ...homepageMediaSlots,
  ...aboutMediaSlots,
  ...programmeMediaSlots,
  ...daycareMediaSlots,
];

export function getMediaSlot(key: string) {
  return allMediaSlots.find((slot) => slot.key === key);
}

export function getMediaSlotsByPage(page: string) {
  return allMediaSlots.filter((slot) => slot.page === page);
}

export function getMediaSlotsBySection(page: string, section: string) {
  return allMediaSlots.filter(
    (slot) => slot.page === page && slot.section === section,
  );
}








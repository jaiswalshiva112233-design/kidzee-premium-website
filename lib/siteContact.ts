import { site } from "@/lib/site";

export type SiteContactSettings = {
  phone: string;
  phoneDisplay: string;
  email: string;
  address: string;
  addressShort: string;
  map: string;
  mapEmbed: string;
  googleReviews: string;
  instagram: string;
  facebook: string;
  youtube: string;
  preschoolDays: string;
  preschoolOpens: string;
  preschoolCloses: string;
  daycareDays: string;
  daycareOpens: string;
  daycareCloses: string;
};

export type SiteContact = SiteContactSettings & {
  shortName: string;
  admissions: typeof site.admissions;
  ageRange: typeof site.ageRange;
  phoneDigits: string;
  whatsappBase: string;
  whatsapp: string;
  whatsappAdmission: string;
  whatsappVisit: string;
  whatsappTrial: string;
  whatsappProgrammes: string;
  whatsappDaycare: string;
  whatsappFees: string;
  whatsappCallback: string;
  whatsappMeals: string;
  preschoolHours: {
    days: string;
    opens: string;
    closes: string;
    display: string;
  };
  daycareHours: {
    days: string;
    opens: string;
    closes: string;
    display: string;
  };
};

export const defaultSiteContactSettings: SiteContactSettings = {
  phone: site.phone,
  phoneDisplay: site.phoneDisplay,
  email: site.email,
  address: site.address,
  addressShort: site.addressShort,
  map: site.map,
  mapEmbed: site.mapEmbed,
  googleReviews: site.googleReviews,
  instagram: site.instagram ?? "",
  facebook: site.facebook ?? "",
  youtube: site.youtube ?? "",
  preschoolDays: site.preschoolHours.days,
  preschoolOpens: site.preschoolHours.opens,
  preschoolCloses: site.preschoolHours.closes,
  daycareDays: site.daycareHours.days,
  daycareOpens: site.daycareHours.opens,
  daycareCloses: site.daycareHours.closes,
};

function formatTime(value: string) {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function createWhatsAppLink(
  phoneDigits: string,
  message: string,
) {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}

export function buildSiteContact(
  settings: SiteContactSettings = defaultSiteContactSettings,
): SiteContact {
  const phoneDigits =
    settings.phone.replace(/\D/g, "") ||
    defaultSiteContactSettings.phone.replace(/\D/g, "");

  return {
    ...settings,
    shortName: site.shortName,
    admissions: site.admissions,
    ageRange: site.ageRange,
    phoneDigits,
    whatsappBase: `https://wa.me/${phoneDigits}`,
    whatsapp: createWhatsAppLink(
      phoneDigits,
      "Hello Kidzee Sector 12, Dwarka. I would like to know more about your preschool and daycare programmes.",
    ),
    whatsappAdmission: createWhatsAppLink(
      phoneDigits,
      "Hello Kidzee Sector 12, Dwarka. I would like to enquire about admission for my child.",
    ),
    whatsappVisit: createWhatsAppLink(
      phoneDigits,
      "Hello Kidzee Sector 12, Dwarka. I would like to book a school visit.",
    ),
    whatsappTrial: createWhatsAppLink(
      phoneDigits,
      "Hello Kidzee Sector 12, Dwarka. I would like to know about the three-day preschool trial.",
    ),
    whatsappProgrammes: createWhatsAppLink(
      phoneDigits,
      "Hello Kidzee Sector 12, Dwarka. Please help me choose the right preschool programme for my child.",
    ),
    whatsappDaycare: createWhatsAppLink(
      phoneDigits,
      "Hello Kidzee Sector 12, Dwarka. I would like to check daycare timings, meals and availability for my child.",
    ),
    whatsappFees: createWhatsAppLink(
      phoneDigits,
      "Hello Kidzee Sector 12, Dwarka. Please share the current fees and availability for my child.",
    ),
    whatsappCallback: createWhatsAppLink(
      phoneDigits,
      "Hello Kidzee Sector 12, Dwarka. Please arrange a callback regarding preschool admission.",
    ),
    whatsappMeals: createWhatsAppLink(
      phoneDigits,
      "Hello Kidzee Sector 12, Dwarka. I would like to know more about the preschool meal plan.",
    ),
    preschoolHours: {
      days: settings.preschoolDays,
      opens: settings.preschoolOpens,
      closes: settings.preschoolCloses,
      display: `${formatTime(settings.preschoolOpens)}–${formatTime(
        settings.preschoolCloses,
      )}`,
    },
    daycareHours: {
      days: settings.daycareDays,
      opens: settings.daycareOpens,
      closes: settings.daycareCloses,
      display: `${formatTime(settings.daycareOpens)}–${formatTime(
        settings.daycareCloses,
      )}`,
    },
  };
}




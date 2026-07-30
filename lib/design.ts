export const design = {
  colors: {
    purple: "#5B2A86",
    purpleDark: "#281034",
    purpleHover: "#4A2070",
    yellow: "#F6C84B",
    yellowSoft: "#FFF4CC",
    lavender: "#F8F4FC",
    lavenderStrong: "#F1E8F7",
    white: "#FFFFFF",
    heading: "#281034",
    body: "#5F5963",
    muted: "#7A737D",
    border: "#E9E0ED",
  },

  layout: {
    section:
      "relative overflow-hidden py-16 sm:py-20 lg:py-24",
    sectionCompact:
      "relative overflow-hidden py-12 sm:py-16 lg:py-20",
    contentWidth:
      "mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8",
  },

  typography: {
    eyebrow:
      "text-sm font-extrabold uppercase tracking-[0.16em] text-[#5B2A86]",
    heroTitle:
      "text-[2.65rem] font-black leading-[1.04] tracking-[-0.045em] text-[#281034] sm:text-5xl lg:text-[4rem]",
    sectionTitle:
      "text-3xl font-black leading-tight tracking-[-0.035em] text-[#281034] sm:text-4xl lg:text-[2.75rem]",
    cardTitle:
      "text-xl font-black leading-tight tracking-[-0.02em] text-[#281034] sm:text-2xl",
    body:
      "text-base leading-7 text-[#5F5963] sm:text-[1.05rem] sm:leading-8",
    bodyLarge:
      "text-lg leading-8 text-[#5F5963] sm:text-xl sm:leading-9",
    small:
      "text-sm leading-6 text-[#7A737D]",
  },

  cards: {
    base:
      "rounded-[28px] border border-[#E9E0ED] bg-white shadow-[0_18px_50px_rgba(40,16,52,0.07)]",
    interactive:
      "rounded-[28px] border border-[#E9E0ED] bg-white shadow-[0_18px_50px_rgba(40,16,52,0.07)] transition duration-300 hover:-translate-y-1 hover:border-[#DCCBE5] hover:shadow-[0_24px_70px_rgba(40,16,52,0.11)]",
    soft:
      "rounded-[28px] border border-[#E9E0ED] bg-[#F8F4FC]",
    dark:
      "rounded-[28px] border border-white/10 bg-[#281034] text-white shadow-[0_24px_70px_rgba(40,16,52,0.22)]",
  },

  images: {
    frame:
      "overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_22px_65px_rgba(40,16,52,0.13)]",
    image:
      "h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.025]",
  },

  buttons: {
    primary:
      "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-transparent bg-[#5B2A86] px-6 text-[0.95rem] font-extrabold text-white shadow-[0_14px_34px_rgba(91,42,134,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#4A2070] hover:shadow-[0_18px_44px_rgba(91,42,134,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45 focus-visible:ring-offset-2",
    secondary:
      "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-[#DCCBE5] bg-white px-6 text-[0.95rem] font-extrabold text-[#5B2A86] shadow-[0_10px_28px_rgba(40,16,52,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#CDB5DA] hover:bg-[#FAF7FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45 focus-visible:ring-offset-2",
    accent:
      "inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-transparent bg-[#F6C84B] px-6 text-[0.95rem] font-extrabold text-[#281034] shadow-[0_14px_34px_rgba(246,200,75,0.25)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#F8D266] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 focus-visible:ring-offset-2",
  },

  badges: {
    light:
      "inline-flex items-center gap-2 rounded-full border border-[#E9E0ED] bg-white px-4 py-2 text-sm font-extrabold text-[#5B2A86] shadow-[0_8px_24px_rgba(40,16,52,0.06)]",
    lavender:
      "inline-flex items-center gap-2 rounded-full border border-[#E3D5EA] bg-[#F8F4FC] px-4 py-2 text-sm font-extrabold text-[#5B2A86]",
    yellow:
      "inline-flex items-center gap-2 rounded-full border border-[#F1D878] bg-[#FFF4CC] px-4 py-2 text-sm font-extrabold text-[#281034]",
  },

  backgrounds: {
    white: "bg-white",
    lavender: "bg-[#F8F4FC]",
    gradient:
      "bg-[radial-gradient(circle_at_top_right,rgba(91,42,134,0.10),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(246,200,75,0.13),transparent_32%),#FFFFFF]",
    dark:
      "bg-[radial-gradient(circle_at_top_right,rgba(246,200,75,0.10),transparent_28%),#281034]",
  },

  animation: {
    hoverLift:
      "transition duration-300 ease-out hover:-translate-y-1",
    imageZoom:
      "transition duration-700 ease-out group-hover:scale-[1.025]",
  },
} as const;

export function joinClasses(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}
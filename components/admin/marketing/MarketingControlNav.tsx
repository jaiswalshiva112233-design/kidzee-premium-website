import Link from "next/link";

const links = [
  ["Overview", "/admin/marketing"],
  ["Google Ads", "/admin/marketing/google-ads"],
  ["Meta Ads", "/admin/marketing/meta-ads"],
  ["Organic SEO", "/admin/marketing/organic-seo"],
  ["Landing Pages", "/admin/marketing/landing-pages"],
  ["Campaign URL Builder", "/admin/marketing/campaign-urls"],
  ["Website Analytics", "/admin/website/analytics"],
  ["AI Recommendations", "/admin/growth"],
  ["Internal Traffic", "/admin/settings/integrations"],
  ["Conversions", "/admin/marketing/conversions"],
] as const;

export default function MarketingControlNav({ current }: { current: string }) {
  return (
    <nav
      aria-label="Marketing Control Centre"
      className="flex gap-2 overflow-x-auto rounded-[22px] border border-[#E6DCEB] bg-white p-2 shadow-sm"
    >
      {links.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-black ${current === href ? "bg-[#5B2A86] text-white" : "text-[#5B4A61] hover:bg-[#F5EEF8]"}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

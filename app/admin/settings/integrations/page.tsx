import { redirect } from "next/navigation";
import { Braces, CheckCircle2, Cloud, ExternalLink, MessageCircle, Search, Settings2, Sparkles, TriangleAlert } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import InternalDeviceSettings from "@/components/admin/settings/InternalDeviceSettings";
import { getAdminSession } from "@/lib/admin/auth";
import { firebaseServerConfigured } from "@/lib/firebase/googleAuth";
import { getWebsiteTrackingSettings } from "@/lib/sanity/websiteSettings";

export const dynamic = "force-dynamic";

type State = "Connected" | "Setup Required" | "Disabled";

function IntegrationCard({ title, description, state, href, icon: Icon }: { title: string; description: string; state: State; href?: string; icon: typeof Cloud }) {
  const connected = state === "Connected";
  return <article className="rounded-[24px] border border-[#E7DFEA] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]"><Icon size={20} /></span><span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${connected ? "bg-emerald-50 text-emerald-700" : state === "Disabled" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"}`}>{state}</span></div><h2 className="mt-4 text-lg font-black text-[#2D1736]">{title}</h2><p className="mt-2 min-h-12 text-sm font-semibold leading-6 text-[#776B7A]">{description}</p>{href ? <a href={href} className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#5B2A86]">Open configuration <ExternalLink size={14} /></a> : <p className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#6F6472]">{connected ? <CheckCircle2 size={14} /> : <TriangleAlert size={14} />}Secrets are never shown here</p>}</article>;
}

export default async function IntegrationsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "OWNER" && !session.permissions.includes("*") && !session.permissions.includes("centre.settings")) redirect("/admin");
  const tracking = await getWebsiteTrackingSettings();
  const cards: Array<Parameters<typeof IntegrationCard>[0]> = [
    { title: "Firebase", description: "App Hosting, Firestore mirroring and private Storage.", state: firebaseServerConfigured() ? "Connected" : "Setup Required", icon: Cloud },
    { title: "OpenAI", description: "Server-only MIRA and evidence-backed growth analysis with monthly limits.", state: process.env.OPENAI_API_KEY && process.env.OPENAI_MIRA_MODEL ? "Connected" : "Setup Required", icon: Sparkles },
    { title: "GA4", description: "Consent-aware website analytics for external visitors.", state: tracking.analyticsEnabled && tracking.googleAnalyticsId ? "Connected" : "Setup Required", href: "/admin/website/analytics", icon: Braces },
    { title: "Search Console", description: "Organic query and page performance verification.", state: tracking.googleSearchConsoleVerification ? "Connected" : "Setup Required", href: "/admin/website/seo", icon: Search },
    { title: "Google Ads", description: "Conversion tracking and campaign attribution.", state: tracking.advertisingEnabled && tracking.googleAdsId ? "Connected" : "Disabled", href: "/admin/website/analytics", icon: Settings2 },
    { title: "Meta Ads", description: "Pixel and server conversion signals for genuine leads.", state: tracking.metaPixelEnabled && tracking.metaPixelId ? "Connected" : "Disabled", href: "/admin/website/analytics", icon: Settings2 },
    { title: "WhatsApp", description: "Standard WhatsApp links always work; Cloud API remains optional.", state: process.env.WHATSAPP_ACCESS_TOKEN ? "Connected" : "Disabled", icon: MessageCircle },
  ];
  return <AdminLayout><div className="space-y-6"><section className="rounded-[30px] bg-[#2D1736] px-6 py-8 text-white"><p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6C84B]">Settings</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Integrations & traffic</h1><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/70">One place to see what is connected. Secret values remain in protected environment configuration.</p></section><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{cards.map((card) => <IntegrationCard key={card.title} {...card} />)}</div><InternalDeviceSettings /></div></AdminLayout>;
}

import type { ReactNode } from "react";

import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MarketingConsent from "@/components/MarketingConsent";
import SiteContactProvider from "@/components/SiteContactProvider";
import WebsiteAnalytics from "@/components/WebsiteAnalytics";
import WebsiteNotice from "@/components/WebsiteNotice";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { getWebsiteTrackingSettings } from "@/lib/sanity/websiteSettings";
import { getWebsiteOperationalSettings } from "@/lib/website/operationalSettings";

type PageShellProps = {
  children: ReactNode;
};

export default async function PageShell({
  children,
}: PageShellProps) {
  const [trackingSettings, contactSettings, operationalSettings] =
    await Promise.all([
      getWebsiteTrackingSettings(),
      getWebsiteContactSettings(),
      getWebsiteOperationalSettings(),
    ]);

  return (
    <SiteContactProvider settings={contactSettings}>
      <WebsiteAnalytics />
      <MarketingConsent settings={trackingSettings} />
      <WebsiteNotice settings={operationalSettings} />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <div id="main-content" tabIndex={-1}>
        {children}
      </div>
      <Footer />
      <FloatingWhatsApp />
    </SiteContactProvider>
  );
}

import type { ReactNode } from "react";

import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SiteContactProvider from "@/components/SiteContactProvider";
import WebsiteNotice from "@/components/WebsiteNotice";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { getWebsiteOperationalSettings } from "@/lib/website/operationalSettings";

type PageShellProps = {
  children: ReactNode;
};

export default async function PageShell({
  children,
}: PageShellProps) {
  const [contactSettings, operationalSettings] =
    await Promise.all([
      getWebsiteContactSettings(),
      getWebsiteOperationalSettings(),
    ]);

  return (
    <SiteContactProvider settings={contactSettings}>
      <WebsiteNotice settings={operationalSettings} />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Header />
      <div id="main-content" tabIndex={-1} data-site-page>
        {children}
      </div>
      <Footer />
      <FloatingWhatsApp />
    </SiteContactProvider>
  );
}

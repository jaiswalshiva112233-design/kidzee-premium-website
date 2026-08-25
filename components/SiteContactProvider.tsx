"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
} from "react";

import {
  buildSiteContact,
  defaultSiteContactSettings,
  type SiteContact,
  type SiteContactSettings,
} from "@/lib/siteContact";

const SiteContactContext = createContext<SiteContact>(
  buildSiteContact(defaultSiteContactSettings),
);

type SiteContactProviderProps = {
  settings: SiteContactSettings;
  children: ReactNode;
};

export default function SiteContactProvider({
  settings,
  children,
}: SiteContactProviderProps) {
  const value = useMemo(
    () => buildSiteContact(settings),
    [settings],
  );

  return (
    <SiteContactContext.Provider value={value}>
      {children}
    </SiteContactContext.Provider>
  );
}

export function useSiteContact() {
  return useContext(SiteContactContext);
}


"use client";

import WebsiteMediaManager from "@/components/admin/WebsiteMediaManager";
import { homepageMediaSlots } from "@/lib/admin/mediaSlots";

export default function HomepageMediaManager() {
  return (
    <WebsiteMediaManager
      slots={homepageMediaSlots}
      pageLabel="Homepage"
      introduction="Select a photograph, check its preview and publish it. The existing photograph remains visible until the replacement is successfully uploaded."
    />
  );
}


"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import styles from "./AdmissionsCampaign.module.css";

export default function CampaignMap({ embedUrl, directionsUrl }: { embedUrl: string; directionsUrl: string }) {
  const [opened, setOpened] = useState(false);
  return (
    <div className={styles.mapPanel}>
      {opened ? <iframe title="Google Map: Kidzee Sector 12 Dwarka" src={embedUrl}
        width="600" height="300" allowFullScreen referrerPolicy="no-referrer-when-downgrade" /> : (
        <button type="button" className={styles.mapButton} onClick={() => setOpened(true)}>
          <MapPin size={28} aria-hidden="true" />
          <strong>Show centre on Google Maps</strong>
          <span>Sector 12B, Dwarka</span>
        </button>
      )}
      <p className={styles.micro}>{opened ? "Map not loading? " : "The interactive map loads only when you choose to open Google Maps. "}<a href={directionsUrl} target="_blank" rel="noopener noreferrer">Open directions in Google Maps</a></p>
    </div>
  );
}

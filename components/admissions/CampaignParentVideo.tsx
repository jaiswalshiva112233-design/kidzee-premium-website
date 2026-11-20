"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import styles from "./AdmissionsCampaign.module.css";

// Existing centre video; its current content was confirmed by the owner on 20 Nov 2026.
const videoSource = "/videos/parent-reviews-dwarka-sec12.mp4";

export default function CampaignParentVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  function play() {
    if (!video.current) return;
    setStarted(true);
    video.current.src = videoSource;
    video.current.hidden = false;
    // A blocked play request leaves native controls available; it is not a lead event.
    void video.current.play().catch(() => {});
    video.current.focus();
  }

  return (
    <div className={styles.videoFrame}>
      {!started ? (
        <button type="button" className={styles.videoButton} onClick={play}>
          <span><Play size={24} aria-hidden="true" /></span>
          <strong>Watch a parent&apos;s experience</strong>
          <small>Kidzee Sector 12, Dwarka · Tap to play with sound</small>
        </button>
      ) : null}
      <video ref={video} hidden={!started || failed} className={styles.parentVideo}
        controls playsInline preload="none" tabIndex={0}
        aria-label="Parent experience at Kidzee Sector 12 Dwarka"
        onError={() => setFailed(true)}>
        Your browser cannot play this video. You can read parent reviews below.
      </video>
      {failed ? <p className={styles.mediaFallback} role="status">The video could not load. Please read the parent reviews below or <a href={videoSource} target="_blank" rel="noopener noreferrer">open the original video</a>.</p> : null}
    </div>
  );
}

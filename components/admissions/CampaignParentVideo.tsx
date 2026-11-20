"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Play } from "lucide-react";
import type { CampaignParentReview } from "@/lib/website/parentReviews";
import styles from "./CampaignParentVideo.module.css";

function ReviewPlayer({ review, number }: { review: CampaignParentReview; number: number }) {
  const video = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const external = review.provider !== "VIDEO";
  const provider = review.provider === "INSTAGRAM" ? "Instagram" : "YouTube";
  const title = `Parent review ${number} at Kidzee Sector 12 Dwarka`;

  function play() {
    setStarted(true);
    if (!external && video.current) {
      video.current.src = review.source;
      video.current.hidden = false;
      // Retain native controls if the browser blocks playback. This is not a lead.
      void video.current.play().catch(() => {});
      video.current.focus();
    }
  }

  return <>
    <div className={styles.player}>
      {!started ? <button type="button" className={styles.poster} onClick={play} aria-label={`Play parent review ${number}`}>
        {!posterFailed ? <Image src={review.poster} alt="" fill sizes="(max-width: 767px) calc(100vw - 32px), 420px" className={styles.posterImage} onError={() => setPosterFailed(true)} /> : null}
        <span className={styles.shade} />
        <span className={styles.play}><Play size={26} aria-hidden="true" fill="currentColor" /></span>
        <span className={styles.posterLabel}><strong>Watch parent review {number}</strong><small>{external ? `Tap to load from ${provider}` : "Tap to play with sound"}</small></span>
      </button> : null}
      {external ? (started ? <iframe key={review.id} src={review.source} title={title} className={styles.embed}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /> : null) :
        <video ref={video} hidden={!started || failed} className={styles.video} poster={review.poster}
          controls playsInline preload="none" tabIndex={0} aria-label={title} onError={() => setFailed(true)}>
          Your browser cannot play this video.
        </video>}
      {failed ? <p className={styles.failure} role="status">The video could not load. Please try another review or open the original below.</p> : null}
    </div>
    {started ? <div className={styles.fallback}>
      {external ? "Video not loading? " : "Prefer a separate player? "}
      <a href={review.publicUrl} target="_blank" rel="noopener noreferrer">{external ? `Open on ${provider}` : "Open the original video"}</a>
      {external ? <small>{provider} may ask you to sign in.</small> : null}
    </div> : null}
  </>;
}

export default function CampaignParentVideo({ reviews }: { reviews: CampaignParentReview[] }) {
  const [selected, setSelected] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const index = Math.min(selected, Math.max(0, reviews.length - 1));
  const active = reviews[index];
  if (!active) return null;

  function select(next: number) {
    setSelected(next);
    strip.current?.querySelector<HTMLButtonElement>(`[data-review-index="${next}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
  }

  return <div className={styles.gallery} data-parent-reviews>
    {/* Changing selection unmounts the previous player, stopping its video/audio. */}
    <ReviewPlayer key={active.id} review={active} number={index + 1} />
    <div className={styles.navigation}>
      <span role="status" aria-live="polite">Review {index + 1} of {reviews.length}</span>
      {reviews.length > 1 ? <div>
        <button type="button" onClick={() => select(index - 1)} disabled={index === 0}>Previous</button>
        <button type="button" onClick={() => select(index + 1)} disabled={index === reviews.length - 1}>Next</button>
      </div> : null}
    </div>
    {reviews.length > 1 ? <div ref={strip} className={styles.thumbnails} role="group" aria-label="Choose a parent review">
      {reviews.map((review, itemIndex) => <button type="button" key={review.id} data-review-index={itemIndex}
        className={styles.thumbnail} aria-label={`Choose parent review ${itemIndex + 1}`} aria-pressed={index === itemIndex} onClick={() => select(itemIndex)}>
        <Image src={review.thumbnail} alt="" width={96} height={72} sizes="96px" />
        <span>Review {itemIndex + 1}</span>
      </button>)}
    </div> : null}
  </div>;
}

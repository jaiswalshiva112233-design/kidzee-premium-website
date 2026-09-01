"use client";

import {
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRef, useState } from "react";

type ParentReelPlayerProps = {
  src: string;
  poster?: string;
  title: string;
  analyticsName: string;
  badge?: string;
  className?: string;
};

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return "0:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

export default function ParentReelPlayer({
  src,
  poster,
  title,
  analyticsName,
  badge = "Parent Story",
  className = "",
}: ParentReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function syncDuration(video: HTMLVideoElement) {
    if (Number.isFinite(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }
  }

  async function togglePlayback() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    if (video.ended) {
      video.currentTime = 0;
      setEnded(false);
    }

    if (video.paused) {
      setStarted(true);
      await video.play();
    } else {
      video.pause();
    }
  }

  function replay() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.currentTime = 0;
    setEnded(false);
    setStarted(true);
    void video.play();
  }

  function toggleMute() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = !video.muted;
    setMuted(video.muted);
  }

  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      className={`group relative aspect-[9/16] w-full overflow-hidden rounded-[30px] bg-[#170A1D] shadow-[0_22px_64px_rgba(31,16,38,0.28)] ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        aria-label={title}
        data-analytics-name={analyticsName}
        className="h-full w-full object-cover"
        onLoadedMetadata={(event) => {
          syncDuration(event.currentTarget);
          event.currentTarget.muted = false;
          setMuted(false);
        }}
        onDurationChange={(event) => syncDuration(event.currentTarget)}
        onCanPlay={(event) => syncDuration(event.currentTarget)}
        onPlay={(event) => {
          syncDuration(event.currentTarget);
          setPlaying(true);
          setStarted(true);
          setEnded(false);
        }}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(event) => {
          syncDuration(event.currentTarget);
          setCurrentTime(event.currentTarget.currentTime);
        }}
        onEnded={() => {
          setPlaying(false);
          setEnded(true);
        }}
      >
        Your browser does not support this video.
      </video>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#170A1D]/22 via-transparent to-[#170A1D]/92"
      />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4">
        <span className="rounded-full border border-white/25 bg-[#281034]/72 px-3 py-2 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#F6C84B] backdrop-blur-md">
          {badge}
        </span>

        {duration > 0 ? (
          <span className="rounded-full border border-white/20 bg-black/35 px-3 py-2 text-xs font-black text-white backdrop-blur-md">
            {formatTime(duration)}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={ended ? replay : togglePlayback}
        aria-label={
          ended
            ? `Replay ${title}`
            : playing
              ? `Pause ${title}`
              : `Play ${title}`
        }
        className="absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#F6C84B]"
      >
        {!playing ? (
          <span className="flex h-[68px] w-[68px] items-center justify-center rounded-full border border-white/45 bg-white/92 text-[#5B2A86] shadow-[0_12px_36px_rgba(0,0,0,0.3)] transition group-hover:scale-105">
            {ended ? (
              <RotateCcw aria-hidden="true" size={27} />
            ) : (
              <Play aria-hidden="true" size={29} fill="currentColor" />
            )}
          </span>
        ) : (
          <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/25 bg-black/35 text-white opacity-0 backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100">
            <Pause aria-hidden="true" size={22} fill="currentColor" />
          </span>
        )}
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <div className="pointer-events-auto flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white/80">
              {ended
                ? "Tap to watch again"
                : started
                  ? `${formatTime(currentTime)} of ${formatTime(duration)}`
                  : "Tap to watch with sound"}
            </p>
          </div>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Turn sound on" : "Mute video"}
            className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur transition hover:bg-white hover:text-[#281034] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
          >
            {muted ? (
              <VolumeX aria-hidden="true" size={19} />
            ) : (
              <Volume2 aria-hidden="true" size={19} />
            )}
          </button>
        </div>

        <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-[#F6C84B] transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

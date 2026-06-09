"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useRef } from "react";

type LiteYouTubeEmbedProps = {
  videoId: string;
  title: string;
};

export function LiteYouTubeEmbed({ videoId, title }: LiteYouTubeEmbedProps) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  if (loaded) {
    return (
      <iframe
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      />
    );
  }

  function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
    // Fallback to hqdefault if maxresdefault doesn't exist
    (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="group absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center bg-slate-800"
      aria-label={`Play video: ${title}`}
    >
      <img
        ref={imgRef}
        src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
        alt={title}
        onError={handleImgError}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
      {/* Play button overlay */}
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-brand-600/90 shadow-lg transition group-hover:bg-brand-700 group-hover:scale-110">
        <svg className="ml-1 h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </button>
  );
}

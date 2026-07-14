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

  const thumbSrc = `/api/ytthumb?videoId=${videoId}&quality=maxresdefault`;

  function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
    (e.target as HTMLImageElement).src = `/api/ytthumb?videoId=${videoId}&quality=hqdefault`;
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="group absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center bg-slate-900"
      aria-label={`Play video: ${title}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
      <img
        ref={imgRef}
        src={thumbSrc}
        alt={title}
        onError={handleImgError}
        className="absolute inset-0 h-full w-full object-cover"
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

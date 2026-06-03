"use client";

import { useState } from "react";

type LiteYouTubeEmbedProps = {
  videoId: string;
  title: string;
};

export function LiteYouTubeEmbed({ videoId, title }: LiteYouTubeEmbedProps) {
  const [loaded, setLoaded] = useState(false);

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

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="absolute inset-0 flex h-full w-full cursor-pointer items-center justify-center bg-cover bg-center transition hover:scale-105"
      style={{ backgroundImage: `url(https://img.youtube.com/vi/${videoId}/maxresdefault.jpg)` }}
      aria-label={`Play video: ${title}`}
    >
      {/* Play button overlay */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600/90 shadow-lg transition hover:bg-brand-700 hover:scale-110">
        <svg className="ml-1 h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </button>
  );
}

"use client";

import { useState, useEffect } from "react";

// ============================================================
//  PlayerPhoto — loads player image from Wikipedia
//  Falls back to colorful initials avatar
// ============================================================

const COLORS = [
  "#00e07a", "#f59e0b", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function PlayerPhoto({
  name,
  size = 44,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Try Wikipedia REST API for the player's page image
    const wikiName = encodeURIComponent(name);
    fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiName}`,
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.thumbnail?.source) {
          setImgSrc(data.thumbnail.source);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [name]);

  // Show real photo
  if (imgSrc && !imgError) {
    return (
      <div
        className={`shrink-0 overflow-hidden rounded-xl ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={imgSrc}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback: initials avatar
  const bg = colorFor(name);
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl font-bold ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: `${bg}22`,
        color: bg,
        fontSize: size * 0.36,
        letterSpacing: "0.5px",
      }}
    >
      {initials(name)}
    </div>
  );
}

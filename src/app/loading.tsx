export default function Loading() {
  return (
    <div style={{ backgroundColor: "var(--bg-root)", minHeight: "100vh" }}>
      {/* Skeleton Navbar */}
      <div className="sticky top-0 z-50 border-b" style={{ height: 56, borderColor: "var(--border-default)", backgroundColor: "rgba(8,8,15,0.85)" }}>
        <div className="mx-auto flex h-full max-w-[1440px] items-center gap-6 px-6">
          <div className="shimmer rounded-lg" style={{ width: 120, height: 24 }} />
          <div className="hidden gap-2 md:flex">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="shimmer rounded-lg" style={{ width: 60, height: 28 }} />
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="shimmer hidden rounded-lg md:block" style={{ width: 180, height: 32 }} />
            <div className="shimmer rounded-full" style={{ width: 32, height: 32 }} />
          </div>
        </div>
      </div>

      {/* Skeleton Hero */}
      <div className="flex flex-col items-center px-6 pt-20">
        <div className="shimmer rounded-full" style={{ width: 120, height: 120, marginBottom: 24 }} />
        <div className="shimmer rounded-lg" style={{ width: 380, height: 48, marginBottom: 12 }} />
        <div className="shimmer rounded-lg" style={{ width: 520, height: 20, marginBottom: 8 }} />
        <div className="shimmer rounded-lg" style={{ width: 320, height: 20, marginBottom: 40 }} />

        {/* Countdown skeleton */}
        <div className="flex gap-5 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="shimmer rounded-2xl" style={{ width: 90, height: 100 }} />
              <div className="shimmer rounded" style={{ width: 24, height: 12 }} />
            </div>
          ))}
        </div>

        {/* CTA skeleton */}
        <div className="flex gap-5 mb-16">
          <div className="shimmer rounded-2xl" style={{ width: 200, height: 56 }} />
          <div className="shimmer rounded-2xl" style={{ width: 200, height: 56 }} />
        </div>
      </div>

      {/* Skeleton Live Matches */}
      <div className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="shimmer rounded-lg" style={{ width: 120, height: 28 }} />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer shrink-0 rounded-2xl" style={{ width: 240, height: 160 }} />
          ))}
        </div>
      </div>

      {/* Skeleton Today Matches */}
      <div className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="shimmer rounded-lg" style={{ width: 160, height: 28 }} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="shimmer rounded-2xl" style={{ height: 140 }} />
          ))}
        </div>
      </div>

      {/* Skeleton Champion */}
      <div className="mx-auto max-w-[1440px] px-6 py-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="shimmer rounded-lg" style={{ width: 160, height: 28 }} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="shimmer rounded-2xl" style={{ height: 180 }} />
          ))}
        </div>
        <div className="shimmer rounded-2xl" style={{ height: 400 }} />
      </div>

      {/* Global shimmer style */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, var(--bg-card) 0%, var(--bg-card-hover) 50%, var(--bg-card) 100%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

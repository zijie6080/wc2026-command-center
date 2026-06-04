import { Suspense } from "react";
import HomeClient from "./HomeClient";

export default function HomePage() {
  return (
    <Suspense fallback={<Skeleton />}>
      <HomeClient />
    </Suspense>
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-[var(--bg-deep)]">
      <div className="glass-panel sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center px-4 md:px-6 lg:px-8">
          <span className="text-lg font-bold text-[var(--accent-primary)]">WC26</span>
          <span className="ml-3 text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] hidden sm:inline">Command Center</span>
        </div>
      </div>
      <div className="mx-auto max-w-[1600px] px-4 md:px-6 lg:px-8 py-8">
        <div className="flex gap-3 mb-8 overflow-x-auto">
          {[1,2,3,4].map(i => <div key={i} className="shimmer shrink-0 rounded-xl h-14 w-32" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2 mb-8">
          {[1,2].map(i => <div key={i} className="shimmer rounded-2xl h-28" />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="shimmer rounded-2xl h-36" />)}
        </div>
      </div>
    </div>
  );
}

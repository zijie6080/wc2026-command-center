"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import BottomTabBar from "./BottomTabBar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [transitioning, setTransitioning] = useState(false);
  const prevPath = useRef(pathname);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pullState, setPullState] = useState<"idle"|"pulling"|"ready"|"refreshing">("idle");
  const pullStartY = useRef(0);

  // Page transition on route change
  useEffect(() => {
    if (prevPath.current !== pathname) {
      setTransitioning(true);
      const timer = setTimeout(() => setTransitioning(false), 300);
      prevPath.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [pathname]);

  // Pull-to-refresh
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0 && pullStartY.current > 0) {
      const delta = e.touches[0].clientY - pullStartY.current;
      if (delta > 60) setPullState("ready");
      else if (delta > 20) setPullState("pulling");
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullState === "ready") {
      setPullState("refreshing");
      setTimeout(() => {
        window.location.reload();
      }, 600);
    }
    pullStartY.current = 0;
    if (pullState !== "refreshing") setPullState("idle");
  }, [pullState]);

  return (
    <div
      className="min-h-screen bg-[var(--bg-deep)] pb-16 md:pb-0"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullState !== "idle" && (
        <div className="fixed top-14 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="rounded-full bg-[var(--bg-card)] border border-[var(--border-subtle)] px-4 py-2 shadow-lg flex items-center gap-2"
            style={{ opacity: pullState === "refreshing" ? 1 : 0.7, transform: pullState === "ready" ? "scale(1.05)" : "scale(1)", transition: "all 0.2s" }}>
            <span className={pullState === "refreshing" ? "animate-spin" : ""} style={{ fontSize: 14 }}>
              {pullState === "refreshing" ? "⏳" : pullState === "ready" ? "↑" : "↓"}
            </span>
            <span className="text-[11px] font-medium text-[var(--text-secondary)]">
              {pullState === "refreshing" ? "刷新中..." : pullState === "ready" ? "释放刷新" : "下拉刷新"}
            </span>
          </div>
        </div>
      )}

      {/* Page content with transition */}
      <div
        style={{
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(4px)" : "translateY(0)",
          transition: "opacity 0.25s ease-out, transform 0.25s ease-out",
        }}
        key={pathname}
      >
        {children}
      </div>

      {/* Bottom Tab Bar — mobile only */}
      <BottomTabBar />
    </div>
  );
}

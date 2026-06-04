"use client";

import { useState, useEffect, useCallback } from "react";
import PageShell from "@/shared/components/ui/PageShell";
import { NAV } from "@/lib/constants";

interface HeaderProps {
  liveCount?: number;
  currentPath?: string;
}

export default function Header({ liveCount = 0, currentPath = "/" }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const worldCupStart = new Date("2026-06-11T00:00:00Z").getTime();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(i);
  }, []);

  // Lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const close = useCallback(() => setMobileOpen(false), []);

  const daysLeft = Math.max(0, Math.ceil((worldCupStart - now) / 86400000));
  const hoursLeft = Math.floor(((worldCupStart - now) % 86400000) / 3600000);

  return (
    <>
      <header className="glass-panel sticky top-0 z-50">
        <PageShell>
          <div className="flex h-14 items-center justify-between">
            {/* Left: Logo + Desktop status */}
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2 shrink-0">
                <span className="text-lg font-bold tracking-tight text-[var(--accent-primary)]">WC26</span>
              </a>
              {/* Desktop: countdown + LIVE */}
              <div className="hidden items-center gap-3 md:flex">
                <span className="h-4 w-px bg-[var(--border-default)]" />
                <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)]">
                  {daysLeft}天{hoursLeft}时
                </span>
                {liveCount > 0 && (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent-danger)]">
                    <span className="live-dot" /> {liveCount} LIVE
                  </span>
                )}
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <a key={item.href} href={item.href}
                    className="relative rounded-lg px-3 py-2 text-[13px] font-medium transition-colors hover:text-white"
                    style={{
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      backgroundColor: isActive ? "rgba(255,255,255,0.04)" : "transparent",
                    }}>
                    {item.label}
                    {isActive && <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[var(--accent-primary)]" />}
                  </a>
                );
              })}
            </nav>

            {/* Right: hamburger (mobile) + favorites */}
            <div className="flex items-center gap-2">
              <a href="/favorites"
                className="rounded-lg px-2 py-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-white">
                ⭐
              </a>
              {/* Hamburger — mobile only */}
              <button onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:text-white hover:bg-white/[0.04] md:hidden">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </PageShell>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          {/* Drawer */}
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-[var(--bg-base)] border-l border-[var(--border-subtle)] shadow-2xl animate-slide-up">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-[var(--border-subtle)]">
              <span className="text-sm font-bold text-[var(--accent-primary)]">WC26</span>
              <button onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/[0.04]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Status strip */}
            <div className="px-5 py-3 border-b border-[var(--border-subtle)] flex items-center gap-4">
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">{daysLeft}天{hoursLeft}时</span>
              {liveCount > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent-danger)]">
                  <span className="live-dot" /> {liveCount} LIVE
                </span>
              )}
            </div>

            {/* Nav items */}
            <nav className="px-3 py-2 flex flex-col gap-1">
              {NAV.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <a key={item.href} href={item.href} onClick={close}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors"
                    style={{
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      backgroundColor: isActive ? "var(--accent-primary)" : "transparent",
                    }}>
                    {isActive && <span className="h-2 w-2 rounded-full bg-white" />}
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

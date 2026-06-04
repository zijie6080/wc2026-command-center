"use client";

import { usePathname } from "next/navigation";

const TABS = [
  { key: "/", label: "首页", icon: "🏠" },
  { key: "/live", label: "比赛", icon: "⚽" },
  { key: "/schedule", label: "赛程", icon: "📅" },
  { key: "/predictions", label: "预测", icon: "🏆" },
  { key: "/favorites", label: "我的", icon: "⭐" },
];

export default function BottomTabBar() {
  const pathname = usePathname() || "/";
  const activeKey = TABS.find(t => t.key === "/" ? pathname === "/" : pathname.startsWith(t.key))?.key || "/";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border-subtle)] bg-[var(--bg-base)]/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex h-16 items-center justify-around px-1">
        {TABS.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <a key={tab.key} href={tab.key}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all active:scale-90 select-none"
              style={{
                color: isActive ? "var(--accent-primary)" : "var(--text-muted)",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                minWidth: 0,
              }}>
              <span className="text-xl leading-none">{tab.icon}</span>
              <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
              {isActive && <span className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-[var(--accent-primary)]" />}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

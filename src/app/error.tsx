"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ backgroundColor: "var(--bg-root)", color: "var(--text-primary)" }}
    >
      {/* Error icon */}
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full"
        style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--color-live)" }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold">数据加载失败</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          请检查网络连接后重试
        </p>
        {error.digest && (
          <p className="mt-1 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl px-6 py-3 text-sm font-semibold text-black transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: "var(--color-brand)" }}
        >
          重新加载
        </button>
        <a
          href="/"
          className="rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          style={{ border: "1px solid var(--border-default)", color: "var(--text-primary)" }}
        >
          返回首页
        </a>
      </div>
    </div>
  );
}

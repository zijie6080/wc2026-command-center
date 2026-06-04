"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
//  TYPES
// ============================================================

interface SectionState {
  key: string;
  label: string;
  text: string;
  status: "pending" | "streaming" | "complete" | "error";
  errorMessage?: string;
}

interface SSEEvent {
  event: string;
  data: any;
}

// ============================================================
//  HELPERS
// ============================================================

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

const SECTION_ICONS: Record<string, string> = {
  summary: "📝",
  keyEvents: "⚡",
  bestPlayer: "⭐",
  tactical: "🎯",
};

// ============================================================
//  SSE PARSER (async generator)
// ============================================================

async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SSEEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            yield { event: currentEvent, data };
          } catch {
            // skip malformed lines
          }
          currentEvent = "";
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ============================================================
//  SECTION CARD
// ============================================================

function SectionCard({
  section,
  isLast,
}: {
  section: SectionState;
  isLast: boolean;
}) {
  const icon = SECTION_ICONS[section.key] || "📄";
  const isStreaming = section.status === "streaming";
  const isComplete = section.status === "complete";
  const isError = section.status === "error";
  const isPending = section.status === "pending";

  return (
    <div
      className={cn(
        "rounded-xl border transition-all",
        isStreaming ? "border-l-2" : "",
      )}
      style={{
        borderColor: isStreaming
          ? "var(--color-brand)"
          : isError
            ? "rgba(239,68,68,0.3)"
            : "var(--border-default)",
        background: isStreaming
          ? "linear-gradient(135deg, rgba(0,224,122,0.03) 0%, var(--bg-card) 100%)"
          : "linear-gradient(135deg, var(--bg-card), rgba(15,15,26,0.6))",
        marginBottom: isLast ? 0 : 12,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{icon}</span>
          <h4 className="text-sm font-bold">{section.label}</h4>
        </div>
        <StatusBadge
          status={section.status}
          errorMessage={section.errorMessage}
        />
      </div>

      {/* Content */}
      {(isStreaming || isComplete || isError) && (
        <div className="px-4 pb-4">
          {isError ? (
            <div
              className="rounded-lg px-3 py-2 text-sm"
              style={{
                backgroundColor: "rgba(239,68,68,0.08)",
                color: "#f87171",
              }}
            >
              {section.errorMessage || "生成失败"}
            </div>
          ) : (
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: "var(--text-secondary)" }}
            >
              {section.text || (
                <span style={{ color: "var(--text-muted)" }}>
                  {isStreaming ? "正在生成..." : ""}
                </span>
              )}
              {isStreaming && (
                <span
                  className="inline-block w-2 h-4 ml-0.5 align-text-bottom"
                  style={{
                    backgroundColor: "var(--color-brand)",
                    animation: "blink 1s step-end infinite",
                  }}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Pending shimmer */}
      {isPending && (
        <div className="px-4 pb-4">
          <div className="flex flex-col gap-2">
            <div className="shimmer h-3 w-full rounded" />
            <div className="shimmer h-3 w-11/12 rounded" />
            <div className="shimmer h-3 w-3/4 rounded" />
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
  errorMessage,
}: {
  status: SectionState["status"];
  errorMessage?: string;
}) {
  switch (status) {
    case "streaming":
      return (
        <span
          className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: "rgba(0,224,122,0.1)",
            color: "var(--color-brand)",
          }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: "var(--color-brand)" }}
            />
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: "var(--color-brand)" }}
            />
          </span>
          生成中
        </span>
      );
    case "complete":
      return (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: "rgba(0,224,122,0.08)",
            color: "var(--color-brand)",
          }}
        >
          ✓ 已完成
        </span>
      );
    case "error":
      return (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: "rgba(239,68,68,0.1)",
            color: "#f87171",
          }}
        >
          ✕ 失败
        </span>
      );
    default:
      return (
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            color: "var(--text-muted)",
          }}
        >
          ⏳ 等待中
        </span>
      );
  }
}

// ============================================================
//  AI ANALYSIS TAB
// ============================================================

export default function AiAnalysisTab({
  match,
  matchId,
}: {
  match: any;
  matchId: string;
}) {
  const [sections, setSections] = useState<SectionState[]>([
    { key: "summary", label: "比赛总结", text: "", status: "pending" },
    { key: "keyEvents", label: "关键事件分析", text: "", status: "pending" },
    { key: "bestPlayer", label: "最佳球员分析", text: "", status: "pending" },
    { key: "tactical", label: "战术分析", text: "", status: "pending" },
  ]);
  const [globalStatus, setGlobalStatus] = useState<
    "idle" | "loading" | "streaming" | "complete" | "error"
  >("idle");
  const [globalError, setGlobalError] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 4 });
  const [isCached, setIsCached] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const updateSection = useCallback(
    (key: string, update: Partial<SectionState>) => {
      setSections((prev) =>
        prev.map((s) => (s.key === key ? { ...s, ...update } : s)),
      );
    },
    [],
  );

  const startAnalysis = useCallback(async () => {
    setGlobalStatus("loading");
    setGlobalError("");
    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/ai/analyze-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, match }),
        signal: abortRef.current.signal,
      });

      // Cache hit — instant JSON
      if (response.headers.get("content-type")?.includes("application/json")) {
        const json = await response.json();
        if (!mountedRef.current) return;

        if (json.cached) {
          setIsCached(true);
          const secs = json.sections;
          setSections((prev) =>
            prev.map((s) => ({
              ...s,
              text: secs[s.key] || "",
              status: "complete" as const,
            })),
          );
          setProgress({ current: 4, total: 4 });
          setGlobalStatus("complete");
        } else if (json.error) {
          setGlobalError(json.message || "分析服务不可用");
          setGlobalStatus("error");
        }
        return;
      }

      // SSE stream
      if (!mountedRef.current) return;
      setGlobalStatus("streaming");

      let completedCount = 0;
      const stream = parseSSEStream(response.body!);

      for await (const { event, data } of stream) {
        if (!mountedRef.current) break;

        switch (event) {
          case "section_start":
            updateSection(data.key, {
              status: "streaming",
              text: "",
              errorMessage: undefined,
            });
            break;

          case "token":
            setSections((prev) =>
              prev.map((s) =>
                s.key === data.key ? { ...s, text: s.text + data.text } : s,
              ),
            );
            break;

          case "section_end":
            updateSection(data.key, { status: "complete" });
            completedCount++;
            setProgress({ current: completedCount, total: 4 });
            break;

          case "done":
            setGlobalStatus("complete");
            break;

          case "error":
            updateSection(
              sections.find((s) => s.status === "streaming")?.key || "summary",
              {
                status: "error",
                errorMessage: data.message,
              },
            );
            setGlobalStatus("error");
            setGlobalError(data.message);
            break;
        }
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      if (err.name === "AbortError") return;
      setGlobalStatus("error");
      setGlobalError(err.message || "网络错误，请检查连接后重试");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, match, updateSection]);

  useEffect(() => {
    mountedRef.current = true;
    startAnalysis();
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, [startAnalysis]);

  const completedCount = sections.filter(
    (s) => s.status === "complete",
  ).length;
  const hasContent = sections.some((s) => s.text.length > 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h3 className="text-base font-bold">AI 比赛分析</h3>
          {isCached && (
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                color: "var(--text-muted)",
              }}
            >
              已缓存
            </span>
          )}
        </div>
        {globalStatus === "streaming" && (
          <span
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            正在生成... ({completedCount}/4)
          </span>
        )}
      </div>

      {/* Error banner */}
      {globalError && globalStatus === "error" && !hasContent && (
        <div
          className="mb-4 rounded-xl border px-4 py-3"
          style={{
            borderColor: "rgba(239,68,68,0.2)",
            backgroundColor: "rgba(239,68,68,0.04)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span className="text-sm font-semibold" style={{ color: "#f87171" }}>
              {globalError}
            </span>
          </div>
          <button
            onClick={() => startAnalysis()}
            className="mt-2 rounded-lg px-4 py-1.5 text-xs font-bold text-black"
            style={{ backgroundColor: "var(--color-brand)" }}
          >
            重新生成
          </button>
        </div>
      )}

      {/* Section cards */}
      <div>
        {sections.map((section, i) => (
          <SectionCard
            key={section.key}
            section={section}
            isLast={i === sections.length - 1}
          />
        ))}
      </div>

      {/* Footer note */}
      {globalStatus === "complete" && (
        <div
          className="mt-4 text-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          🤖 以上分析由 AI 自动生成，仅供参考
        </div>
      )}

      {/* Blink animation */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

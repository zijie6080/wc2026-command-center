"use client";

import { useState, useEffect, useMemo } from "react";
import { footballApi } from "@/services/football-api";
import PlayerPhoto from "@/shared/components/data-display/PlayerPhoto";
import { getChineseName } from "@/lib/player-names-zh";

// ============================================================
//  TYPES
// ============================================================

interface PlayerItem {
  id: string | number;
  name: string;
  nameCN: string;
  number: number;
  position: string;
  positionGroup: "GK" | "DEF" | "MID" | "FWD";
  teamName: string;
  teamCode: string;
  teamId: string | number;
  crest?: string;
  age?: number;
  club?: string;
  nationality?: string;
  isCaptain?: boolean;
}

// ============================================================
//  HELPERS
// ============================================================

const FLAG: Record<string, string> = {
  ARG: "🇦🇷", BRA: "🇧🇷", FRA: "🇫🇷", ESP: "🇪🇸", ENG: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  POR: "🇵🇹", GER: "🇩🇪", ITA: "🇮🇹", NED: "🇳🇱", BEL: "🇧🇪", CRO: "🇭🇷",
  USA: "🇺🇸", CAN: "🇨🇦", MEX: "🇲🇽", JPN: "🇯🇵", KOR: "🇰🇷", IRN: "🇮🇷",
  NGA: "🇳🇬", MAR: "🇲🇦", SEN: "🇸🇳", EGY: "🇪🇬", GHA: "🇬🇭", CMR: "🇨🇲",
  AUS: "🇦🇺", NZL: "🇳🇿", URU: "🇺🇾", COL: "🇨🇴", ECU: "🇪🇨", PER: "🇵🇪",
  CHI: "🇨🇱", KSA: "🇸🇦", QAT: "🇶🇦", UAE: "🇦🇪", CIV: "🇨🇮",
  JAM: "🇯🇲", CZE: "🇨🇿", UKR: "🇺🇦", SUI: "🇨🇭", DEN: "🇩🇰",
  SWE: "🇸🇪", NOR: "🇳🇴", POL: "🇵🇱", AUT: "🇦🇹", HUN: "🇭🇺",
  SRB: "🇷🇸", TUR: "🇹🇷", GRE: "🇬🇷", PAR: "🇵🇾", BOL: "🇧🇴",
  VEN: "🇻🇪", ALG: "🇩🇿", TUN: "🇹🇳", COD: "🇨🇩", MLI: "🇲🇱", BFA: "🇧🇫",
};
function flag(c: string) {
  return FLAG[c] || "🏳️";
}
function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

const POSITIONS = [
  { key: "all", label: "全部位置" },
  { key: "FWD", label: "⚽ 前锋" },
  { key: "MID", label: "🎯 中场" },
  { key: "DEF", label: "🛡️ 后卫" },
  { key: "GK", label: "🧤 门将" },
];

function mapPosition(pos: string): "GK" | "DEF" | "MID" | "FWD" {
  const p = pos?.toUpperCase() || "";
  if (p === "GOALKEEPER" || p === "GK") return "GK";
  if (p === "DEFENCE" || p === "DEFENDER" || p === "DEF" || p === "CB" || p === "LB" || p === "RB" || p === "LCB" || p === "RCB" || p === "LWB" || p === "RWB") return "DEF";
  if (p === "MIDFIELD" || p === "MIDFIELDER" || p === "MID" || p === "CM" || p === "CDM" || p === "CAM" || p === "LM" || p === "RM") return "MID";
  if (p === "OFFENCE" || p === "FORWARD" || p === "FWD" || p === "ST" || p === "CF" || p === "LW" || p === "RW" || p === "SS") return "FWD";
  return "MID";
}

// ============================================================
//  PLAYER CARD
// ============================================================

function PlayerCard({ p }: { p: PlayerItem }) {
  return (
    <a
      href={`/player/${p.id}`}
      className="group relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        borderColor: "var(--border-default)",
        background: "linear-gradient(135deg, var(--bg-card), rgba(15,15,26,0.6))",
      }}
    >
      <PlayerPhoto name={p.name} size={44} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold truncate">{p.name}</span>
          {p.nameCN && (
            <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>({p.nameCN})</span>
          )}
          {p.isCaptain && <span className="shrink-0 text-xs">©</span>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {flag(p.teamCode)} {p.teamName}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
          <span>{p.position || "—"}</span>
          {p.age != null && <><span>·</span><span>{p.age}岁</span></>}
          {p.club && <><span>·</span><span className="truncate">{p.club}</span></>}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-xl bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-[0.02]" />
    </a>
  );
}

// ============================================================
//  HEADER
// ============================================================

function Header({
  search,
  setSearch,
  posFilter,
  setPosFilter,
  teamFilter,
  setTeamFilter,
  teams,
  total,
}: {
  search: string;
  setSearch: (v: string) => void;
  posFilter: string;
  setPosFilter: (v: string) => void;
  teamFilter: string;
  setTeamFilter: (v: string) => void;
  teams: { code: string; name: string }[];
  total: number;
}) {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        borderColor: "var(--border-default)",
        backgroundColor: "rgba(8,8,15,0.9)",
        backdropFilter: "blur(16px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-2 px-4 overflow-x-auto md:gap-3 md:px-6 md:overflow-visible">
        <a
          href="/"
          className="flex shrink-0 items-center gap-1.5 text-sm font-medium transition-colors hover:text-white"
          style={{ color: "var(--text-secondary)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>

        {/* Search */}
        <div className="relative flex-1 max-w-[200px] md:max-w-sm">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ color: "var(--text-muted)" }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索球员..."
            className="w-full rounded-lg border py-1.5 pl-8 pr-3 text-sm outline-none transition-colors focus:border-white/20"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "rgba(255,255,255,0.02)",
              color: "var(--text-primary)",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Position filter */}
        <select
          value={posFilter}
          onChange={(e) => setPosFilter(e.target.value)}
          className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "rgba(255,255,255,0.02)",
            color: "var(--text-secondary)",
          }}
        >
          {POSITIONS.map((pos) => (
            <option key={pos.key} value={pos.key}>
              {pos.label}
            </option>
          ))}
        </select>

        {/* Team filter */}
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none cursor-pointer max-w-[130px]"
          style={{
            borderColor: "var(--border-default)",
            backgroundColor: "rgba(255,255,255,0.02)",
            color: "var(--text-secondary)",
          }}
        >
          <option value="all">全部国家</option>
          {teams.map((t) => (
            <option key={t.code} value={t.code}>
              {flag(t.code)} {t.name}
            </option>
          ))}
        </select>

        <span
          className="ml-auto hidden text-xs font-bold md:inline"
          style={{ color: "var(--text-muted)" }}
        >
          {total} 名球员
        </span>
      </div>
    </header>
  );
}

// ============================================================
//  PAGE
// ============================================================

export default function PlayersPage() {
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Step 1: Fetch all teams
        const teamsRes = await footballApi.teams.list();
        if (cancelled) return;

        if (!teamsRes.success || !Array.isArray(teamsRes.data)) {
          setError("Failed to load teams");
          setLoading(false);
          return;
        }

        const teams = teamsRes.data as any[];
        const allPlayers: PlayerItem[] = [];
        const seenIds = new Set<string>();

        // Step 2: Extract squad data from teams that have it
        // The /competitions/WC/teams endpoint often includes squad in each team
        for (const t of teams) {
          const squad = t.squad;
          if (Array.isArray(squad)) {
            for (const p of squad) {
              const pid = String(p.id);
              if (seenIds.has(pid)) continue;
              seenIds.add(pid);
              allPlayers.push({
                id: p.id,
                name: p.name || "",
                nameCN: getChineseName(p.name || ""),
                number: p.number || p.shirtNumber || 0,
                position: p.position || p.positionDetail || "",
                positionGroup: mapPosition(p.position || ""),
                teamName: t.shortName || t.name || "",
                teamCode: t.tla || t.fifaCode || "",
                teamId: t.id,
                crest: t.crest || "",
                age: p.age || (p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : undefined),
                club: p.club || p.currentTeam?.name || "",
                nationality: p.nationality || "",
                isCaptain: p.isCaptain || false,
              });
            }
          }
        }

        // Step 3: If no squads found, try the players API endpoint as fallback
        if (allPlayers.length === 0) {
          try {
            const playersRes = await footballApi.players.list();
            if (!cancelled && playersRes.success && Array.isArray(playersRes.data)) {
              const rawPlayers = playersRes.data as any[];
              for (const p of rawPlayers) {
                const pid = String(p.id);
                if (seenIds.has(pid)) continue;
                seenIds.add(pid);
                const playerName = p.displayName || p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim();
                allPlayers.push({
                  id: p.id,
                  name: playerName,
                  nameCN: getChineseName(playerName),
                  number: p.jerseyNumber || p.shirtNumber || 0,
                  position: p.positionDetail || p.position || "",
                  positionGroup: mapPosition(p.position || ""),
                  teamName: p.teamName || "",
                  teamCode: p.teamCode || "",
                  teamId: p.teamId || "",
                  crest: "",
                  age: p.age,
                  club: p.clubTeam || p.club || "",
                  nationality: p.nationality || "",
                  isCaptain: p.isCaptain || false,
                });
              }
            }
          } catch {
            // Silently fail — players will be empty
          }
        }

        if (!cancelled) {
          setPlayers(allPlayers);
          setError("");
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Failed to load");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Unique teams for filter
  const teamList = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of players) {
      if (!map.has(p.teamCode)) map.set(p.teamCode, p.teamName);
    }
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [players]);

  // Filter & sort
  const filtered = useMemo(() => {
    let list = [...players];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameCN.includes(q) ||
          p.teamName.toLowerCase().includes(q) ||
          (p.club && p.club.toLowerCase().includes(q)),
      );
    }
    if (posFilter !== "all") list = list.filter((p) => p.positionGroup === posFilter);
    if (teamFilter !== "all") list = list.filter((p) => p.teamCode === teamFilter);
    // Sort by number then name
    list.sort((a, b) => a.number - b.number || a.name.localeCompare(b.name));
    return list;
  }, [players, search, posFilter, teamFilter]);

  return (
    <div style={{ backgroundColor: "var(--bg-root)", minHeight: "100vh", color: "var(--text-primary)" }}>
      <Header
        search={search}
        setSearch={setSearch}
        posFilter={posFilter}
        setPosFilter={setPosFilter}
        teamFilter={teamFilter}
        setTeamFilter={setTeamFilter}
        teams={teamList}
        total={players.length}
      />

      <div className="mx-auto max-w-[900px] px-4 py-6 md:px-6">
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="shimmer rounded-xl" style={{ height: 72 }} />
            ))}
          </div>
        ) : error && players.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="text-5xl">⚠️</span>
            <h3 className="mt-4 text-lg font-bold">加载失败</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {error}
            </p>
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="text-5xl">👤</span>
            <h3 className="mt-4 text-lg font-bold">暂无球员数据</h3>
            <p className="mt-1 text-sm max-w-md" style={{ color: "var(--text-muted)" }}>
              球员数据将在世界杯开赛后更新。请先浏览球队页面查看参赛队伍信息。
            </p>
            <a
              href="/teams"
              className="mt-4 rounded-xl px-5 py-2 text-sm font-semibold text-black"
              style={{ backgroundColor: "var(--color-brand)" }}
            >
              查看球队列表
            </a>
          </div>
        ) : filtered.length > 0 ? (
          <div className="flex flex-col gap-2">
            {filtered.map((p) => (
              <PlayerCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="text-5xl">🔍</span>
            <h3 className="mt-4 text-lg font-bold">未找到匹配球员</h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              试试调整搜索词或筛选条件
            </p>
            <button
              onClick={() => {
                setSearch("");
                setPosFilter("all");
                setTeamFilter("all");
              }}
              className="mt-4 rounded-xl px-5 py-2 text-sm font-semibold text-black"
              style={{ backgroundColor: "var(--color-brand)" }}
            >
              清除筛选
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

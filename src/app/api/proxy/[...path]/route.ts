// ============================================================
//  GET /api/proxy/[...path]
//  Server-side proxy for football-data.org (solves CORS)
// ============================================================

import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://api.football-data.org/v4";

export async function GET(request: NextRequest) {
  const apiKey =
    process.env.FOOTBALL_API_KEY ||
    process.env.NEXT_PUBLIC_FOOTBALL_API_KEY ||
    "";

  // Extract path and query from the request
  const url = new URL(request.url);
  const proxyPath = url.pathname.replace("/api/proxy", "");
  const targetUrl = `${BASE_URL}${proxyPath}${url.search}`;

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "X-Auth-Token": apiKey,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "PROXY_ERROR", message: err.message },
      { status: 502 },
    );
  }
}

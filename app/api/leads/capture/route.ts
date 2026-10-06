import { NextResponse } from "next/server";

import { getProfileByCaptureToken } from "@/lib/db/queries/profiles";
import { captureLead } from "@/lib/leads/capture";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Best-effort in-memory rate limit (per warm instance).
const hits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "Too many submissions. Please try again shortly." },
      { status: 429, headers: CORS },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400, headers: CORS },
    );
  }

  const token = String(body.token ?? "").trim();
  const fullName = String(body.fullName ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const email = String(body.email ?? "").trim() || null;

  if (!token || !fullName || !phone) {
    return NextResponse.json(
      { ok: false, error: "Name and phone are required." },
      { status: 400, headers: CORS },
    );
  }

  const profile = await getProfileByCaptureToken(token);
  if (!profile || !profile.leadCaptureEnabled) {
    return NextResponse.json(
      { ok: false, error: "This form is no longer accepting submissions." },
      { status: 404, headers: CORS },
    );
  }

  const num = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };
  const areas = Array.isArray(body.areas)
    ? body.areas.map((a) => String(a)).filter(Boolean)
    : typeof body.areas === "string"
      ? body.areas.split(",").map((a) => a.trim()).filter(Boolean)
      : null;

  try {
    const result = await captureLead(profile.id, {
      fullName,
      phone,
      email,
      propertyType: body.propertyType ? String(body.propertyType) : null,
      bedrooms: num(body.bedrooms),
      budgetMin: num(body.budgetMin),
      budgetMax: num(body.budgetMax),
      areas,
      timeline: body.timeline ? String(body.timeline) : null,
      notes: body.notes ? String(body.notes) : null,
      source: body.source ? String(body.source) : "web_widget",
    });

    return NextResponse.json({ ok: true, leadId: result.leadId }, { headers: CORS });
  } catch (error) {
    console.error("[lead-capture] failed", error);
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again." },
      { status: 500, headers: CORS },
    );
  }
}

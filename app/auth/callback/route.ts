import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Handles both:
 * 1. Google OAuth callback (code param)
 * 2. Email confirmation link (token_hash + type params)
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  // OAuth code exchange (Google)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if the user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_step, onboarded_at")
          .eq("id", user.id)
          .single();

        if (!profile?.onboarded_at && (profile?.onboarding_step ?? 0) < 4) {
          const steps = ["profile", "business", "whatsapp", "goals"];
          const step = steps[profile?.onboarding_step ?? 0] ?? "profile";
          return NextResponse.redirect(`${origin}/onboarding/${step}`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Email confirmation token exchange
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "email" | "signup" });
    if (!error) {
      return NextResponse.redirect(`${origin}/onboarding/profile`);
    }
  }

  // Error fallback
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Authentication failed. Please try again.")}`);
}

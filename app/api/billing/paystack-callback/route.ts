import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const reference = searchParams.get("reference") ?? searchParams.get("trxref");

  if (!reference) {
    return NextResponse.redirect(`${origin}/settings?tab=billing&error=Missing+payment+reference`);
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.redirect(`${origin}/settings?tab=billing&error=Paystack+not+configured`);
  }

  // Verify the transaction with Paystack
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  const json = await res.json() as {
    status: boolean;
    data?: {
      status: string;
      customer: { customer_code: string; email: string };
      metadata?: { agent_id?: string };
      plan_object?: { plan_code: string };
    };
    message?: string;
  };

  if (!json.status || json.data?.status !== "success") {
    return NextResponse.redirect(
      `${origin}/settings?tab=billing&error=${encodeURIComponent(json.message ?? "Payment verification failed")}`,
    );
  }

  const agentId = json.data.metadata?.agent_id;
  const paystackCustomerCode = json.data.customer.customer_code;

  if (agentId && paystackCustomerCode) {
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Save the Paystack customer code to the agent's profile
    // (the webhook will update tier/status — this just ensures we track the customer)
    await supabase
      .from("profiles")
      .update({ paystack_customer_code: paystackCustomerCode })
      .eq("id", agentId);
  }

  return NextResponse.redirect(
    `${origin}/settings?tab=billing&success=payment_complete`,
  );
}

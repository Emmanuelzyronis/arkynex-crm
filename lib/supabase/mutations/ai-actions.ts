"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

export async function completeAction(formData: FormData) {
  const { supabase } = await getUser();
  const actionId = String(formData.get("actionId") ?? "");

  const { error } = await supabase
    .from("ai_actions")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("id", actionId);

  if (error) throw new Error(error.message);
  revalidatePath("/ai-actions");
  revalidatePath("/dashboard");
}

export async function dismissAction(formData: FormData) {
  const { supabase } = await getUser();
  const actionId = String(formData.get("actionId") ?? "");

  const { error } = await supabase
    .from("ai_actions")
    .update({ dismissed: true })
    .eq("id", actionId);

  if (error) throw new Error(error.message);
  revalidatePath("/ai-actions");
  revalidatePath("/dashboard");
}

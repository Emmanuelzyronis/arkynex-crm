import { redirect } from "next/navigation";

/** Clerk handles password reset inside the sign-in flow. */
export default function ForgotPasswordPage() {
  redirect("/login");
}

import { CreditCard, Handshake, Home, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const helpCategories: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Getting Started",
    description: "Set up your profile and business details.",
    icon: Sparkles,
  },
  {
    title: "Leads & Pipeline",
    description: "Capture, score and move leads through your pipeline.",
    icon: Users,
  },
  {
    title: "Properties & Listings",
    description: "Add listings with photos, documents, amenities and status.",
    icon: Home,
  },
  {
    title: "Deals & Commission",
    description: "Track offers, close deals and calculate commission splits.",
    icon: Handshake,
  },
  {
    title: "Billing & Plans",
    description: "Manage your subscription, plan and payment method.",
    icon: CreditCard,
  },
];

export const faqs: { question: string; answer: string }[] = [
  {
    question: "How does Arkynex capture leads?",
    answer:
      "Leads can be added manually or captured from your website form, referrals, open houses, business cards and social DMs. Every lead is scored automatically and matched to your pipeline so nothing slips through the cracks.",
  },
  {
    question: "What are AI Actions and how often are they generated?",
    answer:
      "AI Actions are a prioritized to-do list generated overnight from your leads, viewings and deals — things like following up with a quiet lead, confirming a viewing, or logging the outcome of a past viewing. They're grouped into Urgent, Today and This Week so you always know what to do next.",
  },
  {
    question: "How do I change my subscription plan?",
    answer:
      "Go to Settings → Billing to compare the Starter, Pro and Agency plans and switch at any time. Checkout is handled securely by Clerk Billing (Stripe); changes take effect immediately and are prorated for the rest of your billing cycle.",
  },
  {
    question: "Can I add a co-agent to a deal?",
    answer:
      "Yes — on the Agency plan, deals support a co-agent with its own commission split percentage. The co-agent must already have an Arkynex profile; their share is calculated automatically from the agreed price when the deal closes.",
  },
  {
    question: "How do I upload property photos and documents?",
    answer:
      "When adding or editing a property, use the Photos section to upload images (shown publicly on the listing) and the Documents section for private files like title deeds or survey plans. Files are stored in Vercel Blob; photos are served via a public URL and documents are streamed to you through an authenticated download that only your account can access.",
  },
  {
    question: "How is commission calculated?",
    answer:
      "Each deal has a commission rate (5% by default). When a deal is marked Completed, commission is calculated from the agreed price. If a co-agent or agency split applies, those percentages are deducted to produce your net commission.",
  },
  {
    question: "Is my data shared with other agents?",
    answer:
      "No. Leads, properties, deals and communications are private to your account by default — every query and mutation is scoped to your agent account, so you can only read and write your own records. The only shared data is your public profile (for co-agent lookups) and any property photos you mark as public listings.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "Go to Settings → Billing and choose Manage billing to open the Clerk subscription portal (Stripe), where you can update your payment method or cancel. Your account remains on its current plan until the end of the billing period, after which it moves to read-only access.",
  },
];

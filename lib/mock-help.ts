import {
  CreditCard,
  Handshake,
  Home,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const helpCategories: { title: string; description: string; icon: LucideIcon }[] = [
  {
    title: "Getting Started",
    description: "Set up your profile, business details and WhatsApp connection.",
    icon: Sparkles,
  },
  {
    title: "Leads & Pipeline",
    description: "Capture, score and move leads through your pipeline.",
    icon: Users,
  },
  {
    title: "WhatsApp Integration",
    description: "Connect your number and manage AI conversation summaries.",
    icon: MessageCircle,
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
    question: "How does Arkynex capture leads from WhatsApp?",
    answer:
      "Once your WhatsApp Business number is connected, incoming messages are matched to existing leads by phone number or used to create a new lead automatically. The first message is stored as the raw intake text, which AI then parses for budget, location, property type and timeline.",
  },
  {
    question: "What are AI Actions and how often are they generated?",
    answer:
      "AI Actions are a prioritized to-do list generated overnight from your leads, viewings and deals — things like following up with a quiet lead, confirming a viewing, or logging the outcome of a past viewing. They're grouped into Urgent, Today and This Week so you always know what to do next.",
  },
  {
    question: "How do I change my subscription plan?",
    answer:
      "Go to Settings → Billing to compare the Starter, Pro and Agency plans and switch at any time. Changes take effect immediately and are prorated for the rest of your billing cycle via Paystack.",
  },
  {
    question: "Can I add a co-agent to a deal?",
    answer:
      "Yes — on the Agency plan, deals support a co-agent with its own commission split percentage. The co-agent must already have an Arkynex profile; their share is calculated automatically from the agreed price when the deal closes.",
  },
  {
    question: "How do I upload property photos and documents?",
    answer:
      "When adding or editing a property, use the Photos section to upload images (shown publicly on the listing) and the Documents section for private files like title deeds or survey plans. Photos are stored in Supabase Storage and served via a public URL; documents remain private to your account.",
  },
  {
    question: "How is commission calculated?",
    answer:
      "Each deal has a commission rate (5% by default). When a deal is marked Completed, commission is calculated from the agreed price. If a co-agent or agency split applies, those percentages are deducted to produce your net commission.",
  },
  {
    question: "Is my data shared with other agents?",
    answer:
      "No. Leads, properties, deals and communications are private to your account by default — Row Level Security ensures agents can only read and write their own records. The only shared data is your public profile (for co-agent lookups) and any property photos you mark as public listings.",
  },
  {
    question: "How do I cancel my subscription?",
    answer:
      "Go to Settings → Billing and choose Manage payment method, then cancel from the Paystack portal. Your account remains on its current plan until the end of the billing period, after which it moves to read-only access.",
  },
];

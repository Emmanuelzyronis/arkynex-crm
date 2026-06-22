export type PlanTier = "starter" | "pro" | "agency";

export const timezoneOptions = [
  "Africa/Lagos",
  "Africa/Accra",
  "Africa/Nairobi",
  "Africa/Cairo",
  "Europe/London",
];

export const currentProfile = {
  fullName: "John Doe",
  email: "agent@example.com",
  phone: "801 234 5678",
  agencyName: "Doe Properties Ltd.",
  timezone: "Africa/Lagos",
  tier: "pro" as PlanTier,
  subscriptionStatus: "trialing" as const,
  trialDaysLeft: 9,
  whatsappPhone: "+234 801 234 5678",
};

export const plans: Record<
  PlanTier,
  { name: string; price: string; description: string; features: string[] }
> = {
  starter: {
    name: "Starter",
    price: "₦5,000/mo",
    description: "For solo agents getting started",
    features: ["Up to 50 active leads", "1 WhatsApp number", "Basic AI actions", "Email support"],
  },
  pro: {
    name: "Pro",
    price: "₦15,000/mo",
    description: "For growing agents and small teams",
    features: [
      "Unlimited leads",
      "WhatsApp + AI summaries",
      "Advanced analytics",
      "Priority support",
    ],
  },
  agency: {
    name: "Agency",
    price: "₦40,000/mo",
    description: "For agencies with multiple agents",
    features: [
      "Everything in Pro",
      "Multi-agent & co-agent deals",
      "Custom branding",
      "Dedicated account manager",
    ],
  },
};

export const planOrder: PlanTier[] = ["starter", "pro", "agency"];

export type NotificationItem = {
  id: string;
  label: string;
  description: string;
  defaultChecked: boolean;
};

export const notificationGroups: { title: string; items: NotificationItem[] }[] = [
  {
    title: "Leads",
    items: [
      {
        id: "new_lead",
        label: "New lead captured",
        description: "Get notified when a new lead comes in from WhatsApp, web or referral.",
        defaultChecked: true,
      },
      {
        id: "lead_reengage",
        label: "Re-engagement reminders",
        description: "AI flags leads that have gone quiet for a few days.",
        defaultChecked: true,
      },
    ],
  },
  {
    title: "Viewings",
    items: [
      {
        id: "viewing_reminder",
        label: "Upcoming viewing reminders",
        description: "A reminder 1 hour before each scheduled viewing.",
        defaultChecked: true,
      },
      {
        id: "viewing_followup",
        label: "Post-viewing follow-up",
        description: "Prompt to log the outcome and rating after a viewing.",
        defaultChecked: true,
      },
    ],
  },
  {
    title: "Deals & AI",
    items: [
      {
        id: "deal_status",
        label: "Deal status changes",
        description: "Notify when a deal moves stage or its closing probability drops.",
        defaultChecked: true,
      },
      {
        id: "daily_actions",
        label: "Daily AI action digest",
        description: "Morning summary of urgent and today's AI-suggested actions.",
        defaultChecked: true,
      },
      {
        id: "weekly_summary",
        label: "Weekly performance summary",
        description: "Revenue, pipeline and conversion recap every Monday.",
        defaultChecked: false,
      },
    ],
  },
];

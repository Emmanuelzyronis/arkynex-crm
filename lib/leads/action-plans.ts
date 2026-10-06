/** Code-defined follow-up sequences ("action plans"). Starting one creates tasks. */

export type ActionPlanStep = {
  /** Days from now the task is due. */
  dayOffset: number;
  type: "call" | "email" | "text" | "follow_up" | "viewing";
  priority: "high" | "normal" | "low";
  title: string;
  notes: string;
};

export type ActionPlan = {
  key: string;
  name: string;
  description: string;
  steps: ActionPlanStep[];
};

export const ACTION_PLANS: ActionPlan[] = [
  {
    key: "speed_to_lead",
    name: "Speed to lead",
    description: "Strike within minutes, then follow up twice this week.",
    steps: [
      { dayOffset: 0, type: "call", priority: "high", title: "Call {name} now", notes: "New enquiry — aim to connect within 5 minutes." },
      { dayOffset: 0, type: "text", priority: "high", title: "Send {name} your intro + listings", notes: "Short intro message with 2–3 matching properties." },
      { dayOffset: 1, type: "call", priority: "high", title: "Second call to {name}", notes: "If no answer, leave a voicemail and send an email." },
      { dayOffset: 3, type: "email", priority: "normal", title: "Email {name} a property shortlist", notes: "3 matching listings with photos and asking prices." },
    ],
  },
  {
    key: "nurture_2wk",
    name: "2-week nurture",
    description: "Warm follow-up cadence for a lead that isn't ready yet.",
    steps: [
      { dayOffset: 0, type: "call", priority: "normal", title: "Discovery call with {name}", notes: "Confirm budget, timeline and must-haves." },
      { dayOffset: 2, type: "email", priority: "normal", title: "Send {name} market update", notes: "Recent sales in their target area." },
      { dayOffset: 5, type: "text", priority: "normal", title: "Check in with {name}", notes: "Quick, friendly text — any change in plans?" },
      { dayOffset: 9, type: "call", priority: "normal", title: "Offer a viewing to {name}", notes: "Propose two specific viewing slots." },
      { dayOffset: 14, type: "email", priority: "low", title: "Final nudge for {name}", notes: "Keep the door open; move to long-term nurture if quiet." },
    ],
  },
  {
    key: "post_viewing",
    name: "Post-viewing follow-up",
    description: "Convert a viewing into an offer.",
    steps: [
      { dayOffset: 0, type: "follow_up", priority: "high", title: "Thank {name} for viewing", notes: "Ask for honest feedback and their rating." },
      { dayOffset: 1, type: "call", priority: "high", title: "Follow-up call with {name}", notes: "Address objections, confirm interest level." },
      { dayOffset: 3, type: "email", priority: "normal", title: "Encourage an offer from {name}", notes: "Send comparable sales and offer guidance." },
    ],
  },
];

export function getActionPlan(key: string): ActionPlan | undefined {
  return ACTION_PLANS.find((plan) => plan.key === key);
}

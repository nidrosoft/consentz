export type StepType = "modal" | "spotlight";
export type TooltipPosition = "top" | "bottom" | "left" | "right" | "center";
export type AnimationType = "pulse" | "glow" | "sequential-pulse" | "none";

export interface WalkthroughStep {
  id: string;
  type: StepType;
  title: string;
  icon: string;
  content: string;
  targetSelector: string | null;
  position: TooltipPosition;
  animation: AnimationType;
}

export type PhaseStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PAUSED"
  | "COMPLETED"
  | "SKIPPED";

export interface WalkthroughProgress {
  phase1Status: PhaseStatus;
  phase1CurrentStep: number;
  phasesCompleted: number[];
  dismissedTips: string[];
  completedFlows: string[];
  checklistCompleted: string[];
  checklistDismissed: boolean;
}

export const DEFAULT_PROGRESS: WalkthroughProgress = {
  phase1Status: "NOT_STARTED",
  phase1CurrentStep: 0,
  phasesCompleted: [],
  dismissedTips: [],
  completedFlows: [],
  checklistCompleted: [],
  checklistDismissed: false,
};

export const PHASE_1_STEPS: WalkthroughStep[] = [
  {
    id: "1-0",
    type: "modal",
    title: "Welcome to CQC Compliance!",
    icon: "🎉",
    content: "",
    targetSelector: null,
    position: "center",
    animation: "none",
  },
  {
    id: "1-1",
    type: "spotlight",
    title: "Your Navigation Sidebar",
    icon: "📋",
    content:
      "Everything in the CQC Compliance Module is one click away.\n\n• **Dashboard** — Your compliance overview at a glance\n• **Evidence** — Upload and manage compliance evidence\n• **Policies** — Create, generate, and track policies\n• **Staff** — Manage team qualifications and training\n• **Incidents** — Report and track safety incidents\n• **Tasks** — Your compliance to-do list\n• **CQC Domains** — Deep-dive into Safe, Effective, Caring, Responsive, and Well-Led\n• **Reports** — Generate compliance reports\n• **Audit Log** — Full activity trail",
    targetSelector: "[data-tour='sidebar-nav']",
    position: "right",
    animation: "sequential-pulse",
  },
  {
    id: "1-2",
    type: "spotlight",
    title: "Your Compliance Score",
    icon: "📊",
    content:
      "This is your overall CQC compliance percentage. It's calculated from your assessment answers, uploaded evidence, live Consentz data, and task completion.\n\nThe score updates automatically as you take action and as your Consentz data syncs. Your goal: get to 63%+ for a predicted \"Good\" CQC rating.",
    targetSelector: "[data-tour='compliance-score']",
    position: "bottom",
    animation: "pulse",
  },
  {
    id: "1-3",
    type: "spotlight",
    title: "Your Predicted CQC Rating",
    icon: "🏆",
    content:
      "Based on your current compliance score, this predicts what rating a CQC inspector would likely give you:\n\n• **Outstanding** — 88%+ compliance\n• **Good** — 63-87% (target for most providers)\n• **Requires Improvement** — 39-62%\n• **Inadequate** — Below 39%\n\nDon't worry if it's low right now — it improves as you upload evidence, close gaps, and complete tasks.",
    targetSelector: "[data-tour='predicted-rating']",
    position: "bottom",
    animation: "pulse",
  },
  {
    id: "1-4",
    type: "spotlight",
    title: "Your Compliance Gaps",
    icon: "⚠️",
    content:
      "These are areas where your CQC compliance is incomplete or at risk. Gaps are categorised by severity:\n\n🔴 **Critical** — Could cause immediate CQC enforcement action\n🟠 **High** — Significant risk, address within 30 days\n🟡 **Medium** — Should be addressed, but not urgent\n🔵 **Low** — Minor improvements\n\nStart with the critical ones — fixing them has the biggest impact on your score.",
    targetSelector: "[data-tour='open-gaps']",
    position: "bottom",
    animation: "pulse",
  },
  {
    id: "1-5",
    type: "spotlight",
    title: "The 5 CQC Domains",
    icon: "🎯",
    content:
      "CQC assesses every registered provider against these five questions:\n\n🛡️ **Safe** — Are people protected from harm?\n✅ **Effective** — Does care achieve good outcomes?\n💛 **Caring** — Are people treated with compassion?\n📬 **Responsive** — Are services meeting needs?\n👑 **Well-Led** — Is leadership delivering quality care?\n\nClick any domain card to see its detailed breakdown and specific gaps.",
    targetSelector: "[data-tour='domain-overview']",
    position: "top",
    animation: "sequential-pulse",
  },
  {
    id: "1-6",
    type: "spotlight",
    title: "Priority Gaps",
    icon: "🔥",
    content:
      "This list shows your most urgent compliance gaps — sorted by severity. Each gap shows what's missing, which CQC domain it belongs to, and its severity level.\n\nClick any gap to see what action to take. Many gaps can be resolved by uploading evidence, creating a policy, or completing a task.",
    targetSelector: "[data-tour='priority-gaps']",
    position: "right",
    animation: "pulse",
  },
  {
    id: "1-7",
    type: "spotlight",
    title: "Evidence",
    icon: "📎",
    content:
      "This is where you upload and manage all your CQC compliance evidence — policies, certificates, audit reports, meeting minutes, risk assessments, photos.\n\nEach piece of evidence is tagged to a CQC domain and KLOE, so it directly feeds your compliance score. The system alerts you when evidence is about to expire.",
    targetSelector: "[data-tour='sidebar-evidence']",
    position: "right",
    animation: "pulse",
  },
  {
    id: "1-8",
    type: "spotlight",
    title: "Policies",
    icon: "📄",
    content:
      "CQC requires multiple policies depending on your service type. Here you can create policies manually or generate them using AI.\n\nPolicies sync with Consentz — when staff sign off on a policy in Consentz, it's tracked here automatically.\n\n💡 **Tip:** Try the \"Generate with AI\" button — it creates a CQC-compliant policy in seconds.",
    targetSelector: "[data-tour='sidebar-policies']",
    position: "right",
    animation: "pulse",
  },
  {
    id: "1-9",
    type: "spotlight",
    title: "Staff, Incidents & Tasks",
    icon: "👥",
    content:
      "Three more essential sections:\n\n**Staff** — Track qualifications, DBS checks, training records. Staff data syncs from Consentz automatically.\n\n**Incidents** — Report and manage safety incidents. Infection events sync from Consentz.\n\n**Tasks** — Your compliance to-do list as a Kanban board. Tasks are auto-created when the system detects issues like expiring certificates.",
    targetSelector: "[data-tour='sidebar-staff']",
    position: "right",
    animation: "sequential-pulse",
  },
  {
    id: "1-10",
    type: "spotlight",
    title: "Your AI Compliance Assistant",
    icon: "🤖",
    content:
      "This is your always-available CQC expert. Click this button anytime to ask questions like:\n\n• \"What evidence do I need for KLOE S5?\"\n• \"How do I prepare for a CQC inspection?\"\n• \"What are my most critical gaps right now?\"\n\nThe assistant knows CQC regulation inside-out and can see your current compliance data to give you personalised advice.",
    targetSelector: "[data-tour='ai-chat-button']",
    position: "left",
    animation: "glow",
  },
  {
    id: "1-11",
    type: "modal",
    title: "You're All Set!",
    icon: "🎉",
    content: "",
    targetSelector: null,
    position: "center",
    animation: "none",
  },
];

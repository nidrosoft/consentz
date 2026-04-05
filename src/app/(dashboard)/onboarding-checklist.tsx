"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle, Circle, ChevronDown, ChevronUp, X, Rocket01,
  Building01, Link01, File06, Users01, ShieldTick,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { cx } from "@/utils/cx";
import { apiGet } from "@/lib/api-client";
import type { FC } from "react";

interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: FC<{ className?: string }>;
}

const STEPS: OnboardingStep[] = [
  {
    key: "org_profile",
    label: "Complete your organisation profile",
    description: "Add your CQC provider ID, location details, and registered manager.",
    href: "/settings",
    icon: Building01,
  },
  {
    key: "connect_consentz",
    label: "Connect your Consentz platform",
    description: "Link your Consentz clinic to automatically import compliance data.",
    href: "/settings?tab=integrations",
    icon: Link01,
  },
  {
    key: "upload_evidence",
    label: "Upload your first evidence",
    description: "Upload a policy document, certificate, or inspection report.",
    href: "/evidence/upload",
    icon: File06,
  },
  {
    key: "add_staff",
    label: "Add a staff member",
    description: "Add team members and assign compliance roles.",
    href: "/staff/add",
    icon: Users01,
  },
  {
    key: "review_domains",
    label: "Review your CQC domains",
    description: "Explore your compliance scores across all five CQC domains.",
    href: "/domains",
    icon: ShieldTick,
  },
];

export function OnboardingChecklist() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-progress"],
    queryFn: () =>
      apiGet<{ steps: { step_key: string; completed_at: string }[] }>("/api/onboarding/progress").then((r) => r.data),
  });

  if (dismissed || isLoading) return null;

  const completedKeys = new Set(data?.steps?.map((s) => s.step_key) ?? []);
  const completedCount = STEPS.filter((s) => completedKeys.has(s.key)).length;
  const progress = Math.round((completedCount / STEPS.length) * 100);

  if (completedCount === STEPS.length) return null;

  return (
    <div className="rounded-xl border border-brand bg-primary shadow-xs">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-secondary">
            <Rocket01 className="size-5 text-fg-brand-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-primary">Getting Started</h3>
            <p className="text-xs text-tertiary">{completedCount} of {STEPS.length} steps complete</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-24">
            <ProgressBar value={progress} />
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-1.5 transition duration-100 hover:bg-primary_hover"
          >
            {isOpen ? <ChevronUp className="size-4 text-fg-tertiary" /> : <ChevronDown className="size-4 text-fg-tertiary" />}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="rounded-lg p-1.5 transition duration-100 hover:bg-primary_hover"
          >
            <X className="size-4 text-fg-tertiary" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-secondary px-5 py-3">
          <div className="flex flex-col gap-1">
            {STEPS.map((step) => {
              const done = completedKeys.has(step.key);
              const Icon = step.icon;
              return (
                <div
                  key={step.key}
                  className={cx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition duration-100",
                    done ? "opacity-60" : "cursor-pointer hover:bg-primary_hover",
                  )}
                  onClick={() => {
                    if (!done) router.push(step.href);
                  }}
                >
                  {done ? (
                    <CheckCircle className="size-5 shrink-0 text-fg-success-primary" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-fg-quaternary" />
                  )}
                  <Icon className="size-4 shrink-0 text-fg-tertiary" />
                  <div className="flex-1">
                    <p className={cx("text-sm font-medium", done ? "text-tertiary line-through" : "text-primary")}>
                      {step.label}
                    </p>
                    <p className="text-xs text-tertiary">{step.description}</p>
                  </div>
                  {done ? (
                    <span className="text-xs text-success-primary">Done</span>
                  ) : (
                    <Button
                      color="secondary"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        router.push(step.href);
                      }}
                    >
                      Start
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

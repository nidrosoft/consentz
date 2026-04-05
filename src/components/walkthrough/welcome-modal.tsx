"use client";

import { createPortal } from "react-dom";
import { CheckCircle, Rocket01, AlertTriangle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

interface WelcomeModalProps {
  organizationName?: string;
  serviceType?: string;
  gapCount?: number;
  onStart: () => void;
  onSkip: () => void;
}

export function WelcomeModal({
  organizationName = "Your Organisation",
  serviceType = "Healthcare",
  gapCount = 0,
  onStart,
  onSkip,
}: WelcomeModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-overlay/70 p-4">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
        <div className="rounded-2xl border border-secondary bg-primary shadow-2xl">
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-brand-secondary">
                <Rocket01 className="size-6 text-fg-brand-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-primary sm:text-xl">
                  Welcome to CQC Compliance
                </h1>
                <p className="text-sm text-tertiary">{organizationName}</p>
              </div>
            </div>

            <p className="mb-5 text-sm leading-relaxed text-secondary">
              Your compliance dashboard is ready. Let&apos;s take a quick tour so
              you know exactly where everything is and how the system keeps you
              CQC-ready automatically.
            </p>

            <div className="mb-6 rounded-xl border border-secondary bg-secondary_subtle p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-tertiary">
                Here&apos;s what we&apos;ve set up
              </p>
              <ul className="space-y-2.5">
                {[
                  "Initial assessment completed",
                  `${serviceType} compliance profile active`,
                  `${gapCount} compliance gaps identified`,
                  "5 CQC domains being monitored",
                  "AI compliance assistant ready",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-primary">
                    <CheckCircle className="size-4 shrink-0 text-fg-success-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="mb-6 text-xs text-tertiary">
              This tour takes about 4 minutes and covers the essentials. You can always restart it from the Help menu.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                color="primary"
                size="lg"
                className="flex-1"
                onClick={onStart}
                iconTrailing={Rocket01}
              >
                Let&apos;s Get Started
              </Button>
              <Button color="secondary" size="lg" onClick={onSkip}>
                Skip Tour
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-b-2xl border-t border-secondary bg-secondary_subtle px-6 py-3 sm:px-8">
            <AlertTriangle className="size-3.5 shrink-0 text-fg-warning-secondary" />
            <p className="text-xs text-tertiary">
              Skipping? You can always restart the tour from Settings or the Help widget.
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

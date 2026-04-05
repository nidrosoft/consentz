"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, Lightbulb02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

interface CompletionModalProps {
  onComplete: () => void;
}

function ConfettiCanvas() {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      color: string;
      rotation: number;
      delay: number;
    }>
  >([]);

  useEffect(() => {
    const colors = [
      "#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EC4899",
      "#6366F1", "#14B8A6", "#F97316", "#EF4444", "#8B5CF6",
    ];
    const newParticles = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 40,
      size: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      delay: Math.random() * 0.8,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[10000] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotation}deg)`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function CompletionModal({ onComplete }: CompletionModalProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return createPortal(
    <>
      {showConfetti && <ConfettiCanvas />}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-overlay/70 p-4">
        <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-300">
          <div className="rounded-2xl border border-secondary bg-primary shadow-2xl">
            <div className="p-6 sm:p-8">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-secondary">
                  <CheckCircle className="size-8 text-fg-success-primary" />
                </div>
                <h1 className="text-xl font-semibold text-primary sm:text-2xl">
                  You&apos;re All Set!
                </h1>
                <p className="mt-2 text-sm text-tertiary">
                  You&apos;ve seen the essentials. Here&apos;s the most important thing to know:
                </p>
              </div>

              <div className="mb-6 rounded-xl border border-brand bg-brand-section_subtle p-4">
                <p className="mb-2 text-sm font-semibold text-primary">
                  📡 Your Consentz data syncs automatically every 6 hours.
                </p>
                <p className="text-sm leading-relaxed text-secondary">
                  Consent records, staff qualifications, incident reports, safety
                  checklists, patient feedback — all of it flows into your compliance
                  score without you lifting a finger.
                </p>
                <p className="mt-2 text-sm leading-relaxed text-secondary">
                  Your job: close the gaps the system identifies, upload additional
                  evidence, and keep policies up to date. The system handles the
                  monitoring. You handle the action.
                </p>
              </div>

              <div className="mb-6">
                <p className="mb-3 text-sm font-semibold text-primary">
                  Recommended next steps:
                </p>
                <ol className="space-y-2">
                  {[
                    "Review your Priority Gaps on the dashboard",
                    "Upload your first piece of evidence",
                    "Generate a policy using AI",
                  ].map((step, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-secondary">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-secondary text-[10px] font-bold text-fg-brand-primary">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <Button
                color="primary"
                size="lg"
                className="w-full"
                onClick={onComplete}
              >
                Go to Dashboard →
              </Button>
            </div>

            <div className="flex items-center gap-2 rounded-b-2xl border-t border-secondary bg-secondary_subtle px-6 py-3 sm:px-8">
              <Lightbulb02 className="size-3.5 shrink-0 text-fg-brand-secondary" />
              <p className="text-xs text-tertiary">
                You can restart this tour anytime from Settings or the Help widget.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

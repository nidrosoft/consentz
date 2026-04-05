"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import type { TooltipPosition } from "./walkthrough-config";

interface WalkthroughTooltipProps {
  title: string;
  icon: string;
  content: string;
  position: TooltipPosition;
  targetSelector: string;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function formatContent(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <br key={i} />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={i}>
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={j} className="font-semibold text-primary">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </span>
    );
  });
}

export function WalkthroughTooltip({
  title,
  icon,
  content,
  position,
  targetSelector,
  stepIndex,
  totalSteps,
  onNext,
  onBack,
  onSkip,
}: WalkthroughTooltipProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const measure = useCallback(() => {
    const el = document.querySelector(targetSelector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }, [targetSelector]);

  useEffect(() => {
    measure();
    const onResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(measure);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [targetSelector, measure]);

  if (!rect) return null;

  const GAP = 16;
  const TOOLTIP_WIDTH = 380;
  let style: React.CSSProperties = { position: "fixed", zIndex: 9999, width: TOOLTIP_WIDTH };

  switch (position) {
    case "right":
      style.top = Math.max(16, rect.top);
      style.left = rect.left + rect.width + GAP;
      if (style.left + TOOLTIP_WIDTH > window.innerWidth - 16) {
        style.left = rect.left - TOOLTIP_WIDTH - GAP;
      }
      break;
    case "left":
      style.top = Math.max(16, rect.top);
      style.left = rect.left - TOOLTIP_WIDTH - GAP;
      if ((style.left as number) < 16) {
        style.left = rect.left + rect.width + GAP;
      }
      break;
    case "bottom":
      style.top = rect.top + rect.height + GAP;
      style.left = Math.max(16, Math.min(rect.left, window.innerWidth - TOOLTIP_WIDTH - 16));
      break;
    case "top":
      style.left = Math.max(16, Math.min(rect.left, window.innerWidth - TOOLTIP_WIDTH - 16));
      style.bottom = window.innerHeight - rect.top + GAP;
      break;
    default:
      style.top = "50%";
      style.left = "50%";
      style.transform = "translate(-50%, -50%)";
  }

  const displayStep = stepIndex; // 0-indexed but step 0 is modal, so spotlights start at index 1
  const displayTotal = totalSteps - 2; // exclude welcome modal and completion modal

  return (
    <div ref={tooltipRef} style={style} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="rounded-xl border border-secondary bg-primary p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <h3 className="text-sm font-semibold text-primary">{title}</h3>
          </div>
          <button
            onClick={onSkip}
            className="rounded-md p-1 text-fg-quaternary transition duration-100 hover:bg-primary_hover hover:text-fg-secondary"
            aria-label="Skip tour"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[300px] overflow-y-auto text-sm leading-relaxed text-secondary">
          {formatContent(content)}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-secondary pt-3">
          <span className="text-xs font-medium text-tertiary">
            {displayStep}/{displayTotal}
          </span>
          <div className="flex items-center gap-2">
            {stepIndex > 1 && (
              <Button color="secondary" size="sm" iconLeading={ChevronLeft} onClick={onBack}>
                Back
              </Button>
            )}
            <Button color="primary" size="sm" iconTrailing={ChevronRight} onClick={onNext}>
              {stepIndex === totalSteps - 2 ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/utils/cx";
import type { AnimationType } from "./walkthrough-config";

interface SpotlightOverlayProps {
  targetSelector: string;
  padding?: number;
  animation?: AnimationType;
  children: React.ReactNode;
}

interface ViewportRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function SpotlightOverlay({
  targetSelector,
  padding = 8,
  animation = "pulse",
  children,
}: SpotlightOverlayProps) {
  const [rect, setRect] = useState<ViewportRect | null>(null);
  const rafRef = useRef<number>(0);

  const measure = useCallback(() => {
    const el = document.querySelector(targetSelector);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [targetSelector]);

  useEffect(() => {
    const el = document.querySelector(targetSelector);
    if (el) {
      const style = window.getComputedStyle(el);
      const isFixed =
        style.position === "fixed" ||
        el.closest('[style*="position: fixed"], [style*="position:fixed"]') !== null;
      if (!isFixed) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setTimeout(measure, 400);
    }
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

  const cutout = {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };

  return createPortal(
    <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: "none" }}>
      <svg className="absolute inset-0 size-full" style={{ pointerEvents: "auto" }}>
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={cutout.left}
              y={cutout.top}
              width={cutout.width}
              height={cutout.height}
              rx={12}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      <div
        className={cx(
          "absolute rounded-xl border-2 border-brand-400 transition-all duration-300",
          animation === "pulse" && "animate-walkthrough-pulse",
          animation === "glow" && "animate-walkthrough-glow",
          animation === "sequential-pulse" && "animate-walkthrough-pulse",
        )}
        style={{
          top: cutout.top,
          left: cutout.left,
          width: cutout.width,
          height: cutout.height,
          pointerEvents: "none",
        }}
      />

      <div style={{ pointerEvents: "auto" }}>{children}</div>
    </div>,
    document.body,
  );
}

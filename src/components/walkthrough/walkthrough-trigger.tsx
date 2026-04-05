"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useWalkthrough } from "./walkthrough-provider";

export function WalkthroughTrigger() {
  const { progress, startWalkthrough } = useWalkthrough();
  const pathname = usePathname();
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    if (pathname !== "/") return;
    if (progress.phase1Status !== "NOT_STARTED") return;

    triggered.current = true;
    const timer = setTimeout(startWalkthrough, 1200);
    return () => clearTimeout(timer);
  }, [pathname, progress.phase1Status, startWalkthrough]);

  return null;
}

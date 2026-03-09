"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TIERS } from "@/lib/tiers";
import { TierIcon } from "./TierIcon";

const TIERS_DESC = [...TIERS].reverse();
const COUNT = TIERS_DESC.length;
const RADIUS = 130;
const CYCLE_MS = 2500;

export function TierShowcase() {
  const [rotation, setRotation] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const activeIndex = ((rotation % COUNT) + COUNT) % COUNT;
  const activeTier = TIERS_DESC[activeIndex];

  const resetCycle = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setRotation((r) => r + 1), CYCLE_MS);
  }, []);

  // Auto-cycle (respect reduced motion)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    intervalRef.current = setInterval(() => setRotation((r) => r + 1), CYCLE_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Wheel to change tier
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cooldown = false;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (cooldown) return;
      cooldown = true;
      setTimeout(() => {
        cooldown = false;
      }, 250);
      setRotation((r) => r + Math.sign(e.deltaY));
      resetCycle();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [resetCycle]);

  // Touch swipe
  const touchStartY = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 30) {
      setRotation((r) => r + Math.sign(diff));
      resetCycle();
    }
  };

  const handleClick = (i: number) => {
    let diff = i - activeIndex;
    if (diff > COUNT / 2) diff -= COUNT;
    if (diff < -COUNT / 2) diff += COUNT;
    setRotation((r) => r + diff);
    resetCycle();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] mx-auto select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Orbital path */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--border)]/20"
        style={{ width: RADIUS * 2, height: RADIUS * 2 }}
      />

      {/* Center: Active tier */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div key={activeTier.name} className="animate-fade-in-up flex flex-col items-center">
          <div
            className={`${activeTier.color} tier-icon-glow`}
            style={{ "--tier-glow": activeTier.hex } as React.CSSProperties}
          >
            <TierIcon tier={activeTier.name} size={56} animate />
          </div>
          <span className={`text-lg font-bold mt-2 ${activeTier.color}`}>
            {activeTier.name}
          </span>
          <span className="text-sm font-mono text-[var(--muted)]">
            {activeTier.threshold}+
          </span>
        </div>
      </div>

      {/* Orbital icons */}
      {TIERS_DESC.map((tier, i) => {
        const angle = (i / COUNT) * 360 - (rotation / COUNT) * 360 - 90;
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * RADIUS;
        const y = Math.sin(rad) * RADIUS;
        const isActive = i === activeIndex;

        return (
          <button
            key={tier.name}
            className={`absolute transition-all duration-700 ease-out motion-reduce:transition-none
              ${isActive ? "opacity-100 scale-110" : "opacity-40 hover:opacity-70"}`}
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => handleClick(i)}
            aria-label={`${tier.name} tier, ${tier.threshold}+`}
          >
            <div className={tier.color}>
              <TierIcon tier={tier.name} size={24} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

import { AsciiReveal } from "@/components/asciicn/ascii-reveal";
import { rippleBackground } from "@/lib/background-ripple";
import { usePrefersReducedMotion } from "@/lib/ascii";

const HOLD_GLYPHS_MS = 1400;
const HOLD_PHOTO_MS = 2600;

const SWEEP_MS = 2200;

const PORTRAIT = `${import.meta.env.BASE_URL}img/me.png`;

const PORTRAIT_RATIO = 1080 / 1030;

export function MyInAscii() {
  const reducedMotion = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState(0);
  const revealed = step % 2 === 1;
  const wasRevealed = useRef(revealed);

  useEffect(() => {
    if (reducedMotion) {
      setStep(0);
      return;
    }
    const hold = revealed ? HOLD_PHOTO_MS : HOLD_GLYPHS_MS;
    const wait = step === 0 ? HOLD_GLYPHS_MS : SWEEP_MS + hold;
    const timer = window.setTimeout(() => setStep((value) => value + 1), wait);
    return () => window.clearTimeout(timer);
  }, [reducedMotion, step, revealed]);

  useEffect(() => {
    const was = wasRevealed.current;
    wasRevealed.current = revealed;
    if (!was || revealed) {
      return;
    }
    const box = rootRef.current?.getBoundingClientRect();
    if (!box) {
      return;
    }
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    if (x < 0 || x > window.innerWidth || y < 0 || y > window.innerHeight) {
      return;
    }
    rippleBackground(x, y);
  }, [revealed]);

  return (
    <div
      ref={rootRef}
      className="flex w-full flex-col items-center gap-3"
    >
      <AsciiReveal
        src={PORTRAIT}
        alt="Georgi Angelov, drawn in ASCII and then revealed as a photo."
        trigger="manual"
        revealed={revealed}
        direction="random"
        charset="blocks"
        colorMode="truecolor"
        accent="#ffffff"
        duration={SWEEP_MS}
        cell={10}
        ratio={PORTRAIT_RATIO}
        className="w-full"
      />
      
      <p
        aria-hidden
        className="text-muted-foreground flex gap-2 font-mono text-[11px] select-none"
      >
        <span className={revealed ? undefined : "text-foreground"}>
          glyphs
        </span>
        <span>→</span>
        <span className={revealed ? "text-foreground" : undefined}>photo</span>
      </p>
    </div>
  );
}

export default MyInAscii;

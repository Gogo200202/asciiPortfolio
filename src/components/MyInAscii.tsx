"use client";

import { useEffect, useState } from "react";

import { AsciiReveal } from "@/components/asciicn/ascii-reveal";
import { usePrefersReducedMotion } from "@/lib/ascii";

// How long each end of the loop holds before the sweep turns around.
const HOLD_GLYPHS_MS = 1400;
const HOLD_PHOTO_MS = 2600;
// One full hand-over sweep: long enough to read, short enough to loop.
const SWEEP_MS = 2200;

// A black-to-white ramp keeps the portrait monochrome: black glass and
// grayscale glyphs. The photo itself is grayscaled by the wrapper filter.
const MONO_RAMP = ["#000000", "#ffffff"] as const;

// Vite serves the app from a base path, so build the URL from it.
const PORTRAIT = `${import.meta.env.BASE_URL}img/me.png`;
// public/img/me.png is 1080 x 1030.
const PORTRAIT_RATIO = 1080 / 1030;

/**
 * A portrait that keeps resolving between ASCII glyphs and the photo.
 *
 * The loop is driven by `trigger="manual"`: it alternates `revealed` and
 * holds at each end, so the page always starts as glyphs. Under reduced
 * motion it never sweeps and stays on the glyphs.
 */
export function MyInAscii() {
  const reducedMotion = usePrefersReducedMotion();
  // Odd steps show the photo. Step 0 is the first, glyphs-only hold.
  const [step, setStep] = useState(0);
  const revealed = step % 2 === 1;

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

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <AsciiReveal
        src={PORTRAIT}
        alt="Georgi Angelov, drawn in ASCII and then revealed as a photo."
        trigger="manual"
        revealed={revealed}
        direction="down"
        charset="standard"
        colorMode="duotone"
        ramp={MONO_RAMP}
        accent="#ffffff"
        duration={SWEEP_MS}
        cell={10}
        ratio={PORTRAIT_RATIO}
        className="w-full grayscale"
      />
      {/* Which end of the loop the sweep is heading for. */}
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

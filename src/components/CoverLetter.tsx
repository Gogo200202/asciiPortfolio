"use client";

import { useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";

import { usePrefersReducedMotion } from "@/lib/ascii";

const LETTER =
  "Entry-level full-stack web developer with a strong technical foundation and a proven ability to rapidly onboard into complex engineering pipelines.\nHighly adaptable and ready to master any new technologies, workflows, or frameworks required to ensure project success.";

const MS_PER_CHAR = 7;

function CoverLetter() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const [started, setStarted] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (started || !ref.current) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);

          observer.disconnect();
        }
      },

      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started || reduced) {
      return;
    }
    let raf = 0;
    const begin = performance.now();
    const tick = (now: number) => {
      const next = Math.min(LETTER.length, Math.floor((now - begin) / MS_PER_CHAR));
      setCount(next);
      if (next < LETTER.length) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, reduced]);

  const done = reduced || count >= LETTER.length;

  return (
    <Box
      component="section"
      aria-labelledby="cover-letter-heading"
      sx={{
        minHeight: "100svh",
        width: "100%",
        px: 2,
        py: 6,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="mx-auto mb-4 flex w-full max-w-6xl items-baseline justify-between gap-4 font-mono text-base tracking-[0.18em] text-muted-foreground uppercase sm:text-lg">
        <h2 id="cover-letter-heading">cover letter</h2>
        <span>01 letter</span>
      </div>

      <div
        ref={ref}
        className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col overflow-hidden rounded-sm border border-border/60 bg-background/80 p-4 backdrop-blur-[2px] sm:p-6"
      >
        <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground sm:text-xs">
          <span style={{ color: "var(--ascii-color-blue)" }}>$</span>{" "}
          cat ~/cover-letter.txt
        </p>
        <div
          aria-hidden="true"
          className="flex flex-1 items-center whitespace-pre-wrap font-mono text-[clamp(1.1rem,2.6vw,2.25rem)] leading-[1.5] text-foreground"
        >
          <p>
            {reduced ? LETTER : started ? LETTER.slice(0, count) : ""}
            <span
              className={done ? "" : "animate-pulse"}
              style={{ color: "var(--ascii-color-green)" }}
            >
              _
            </span>
          </p>
        </div>
        <p className="sr-only">{LETTER.replace(/\n/g, " ")}</p>
      </div>
    </Box>
  );
}

export default CoverLetter;

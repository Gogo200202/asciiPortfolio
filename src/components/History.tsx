"use client";

import { useEffect, useRef, useState } from "react";

import Box from "@mui/material/Box";
import { Ascii } from "ascii.rest/react";

import * as historyLog from "@/lib/history-log";
import * as stackLog from "@/lib/stack-log";

function useFirstLook() {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (seen || !ref.current) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      
      { rootMargin: "-15% 0px -15% 0px" }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [seen]);

  return { ref, seen };
}

function TerminalPanel({
  piece,
  label,
  cols,
  rows,
  seen,
}: {
  piece: typeof historyLog | typeof stackLog;
  label: string;
  cols: number;
  rows: number;
  seen: boolean;
}) {
  return (
    <div className="mx-auto w-full min-w-0 overflow-hidden rounded-sm border border-border/60 bg-background/80 p-2.5 backdrop-blur-[2px] sm:p-3">
      
      <div
        style={{
          width: "100%",
          maxWidth: "50rem",
          margin: "0 auto",
          aspectRatio: `${cols} / ${rows * 2}`,
        }}
      >
        {seen && (
          <Ascii piece={piece} label={label} style={{ margin: 0, width: "100%" }} />
        )}
      </div>
    </div>
  );
}

function HistoryText() {
  return (
    <div className="sr-only">
      <h3>Work and education history</h3>
      <ol>
        <li>
          Master degree in Software and computer engineering, currently
          pursuing, at Technical University of Gabrovo, Gabrovo.
        </li>
        <li>
          Software engineer at Optimal Industries Ltd., Plovdiv, from February
          2026 to July 2026.
        </li>
        <li>
          Bachelor degree in Software and computer engineering, 2025, at
          Technical University of Gabrovo, Gabrovo. Average grade 4.80.
        </li>
      </ol>
      <h3>Technologies I know</h3>
      <ul>
        <li>Programming languages: Java, C#, JavaScript, HTML, CSS.</li>
        <li>
          Frameworks and libraries: React, Next.js, Tailwind CSS, React Query,
          Node.js, Spring, ASP.NET.
        </li>
        <li>Tools and technologies: Git, Linux.</li>
        <li>Databases: MongoDB, SQL.</li>
      </ul>
    </div>
  );
}

function History() {
  const { ref, seen } = useFirstLook();

  return (
    <Box
      ref={ref}
      component="section"
      aria-labelledby="history-heading"
      sx={{
        minHeight: "100svh",
        width: "100%",
        px: 2,
        py: { xs: 6, md: 7 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div className="mx-auto mb-4 flex w-full max-w-6xl items-baseline justify-between gap-4 font-mono text-base tracking-[0.18em] text-muted-foreground uppercase sm:text-lg">
        <h2 id="history-heading">history</h2>
        <span>03 entries</span>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
        <TerminalPanel
          piece={historyLog}
          label="Git log of my work and education history: a master's degree in progress, a software engineer role at Optimal Industries from February to July 2026, and a bachelor's degree from the Technical University of Gabrovo in 2025."
          cols={historyLog.meta.cols}
          rows={historyLog.meta.rows}
          seen={seen}
        />
        <div>
          <p className="mb-1.5 font-mono text-sm tracking-[0.18em] text-muted-foreground uppercase sm:text-base">
            tech stack
          </p>
          <TerminalPanel
            piece={stackLog}
            label="Boot-log style list of my tech stack: Java, C#, JavaScript, HTML, CSS, React, Next.js, Tailwind CSS, React Query, Node.js, Spring, ASP.NET, Git, Linux, MongoDB and SQL."
            cols={stackLog.meta.cols}
            rows={stackLog.meta.rows}
            seen={seen}
          />
        </div>
      </div>

      <HistoryText />
    </Box>
  );
}

export default History;

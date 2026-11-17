import type { Env, Frame, Meta } from "ascii.rest";

import { PALETTE, roleColor } from "./log-colors";
import type { LogRole } from "./log-colors";

/**
 * The tech I know, printed like ascii.rest's boot-log: each group is checked
 * in with a `[  OK  ]` status, then the finished log stays on screen.
 * Derived from ascii.rest's boot-log piece (MIT).
 */
export interface StackLogOptions {
  [key: string]: unknown;
  /** Seconds between groups being checked in on the first look. */
  pace?: number;
}

interface Entry {
  label: string;
  text: string;
  /** A line without a status, continuing the group above. */
  continuation?: boolean;
}

/** Text and one palette role, so the frame can colour each cell. */
type Segment = [text: string, role: LogRole];

const ENTRIES: Entry[] = [
  { label: "languages", text: "Java · C# · JavaScript · HTML · CSS" },
  {
    label: "frameworks",
    text: "React · Next.js · Tailwind CSS · React Query",
  },
  {
    label: "",
    text: "↳ Node.js · Spring · ASP.NET",
    continuation: true,
  },
  { label: "tools", text: "Git · Linux" },
  { label: "databases", text: "MongoDB · SQL" },
];

export const meta: Meta<StackLogOptions> = {
  name: "stack log",
  category: "ui",
  note: "boot log style check-in of the languages, frameworks, tools and databases I know",
  cols: 68,
  rows: 11,
  fps: 12,
  palette: PALETTE,
  // Negative still time: show the fully checked-in log for reduced motion.
  still: -1,
  options: { pace: 0.2 },
};

export default function stackLog({
  pace = meta.options?.pace ?? 0.2,
}: Partial<StackLogOptions> = {}): Frame {
  const { cols, rows } = meta;
  const intro = ENTRIES.length * pace;

  return (t: number, env?: Env) => {
    const settled = t < 0;
    const done = settled || t >= intro;
    const now = settled ? intro : Math.min(Math.max(t, 0), intro);
    const visible = Math.min(ENTRIES.length, Math.floor(now / pace) + 1);

    const out: string[] = [];
    const inks: number[][] = [];
    const add = (segments: Segment[]) => {
      out.push(
        segments
          .map(([text]) => text)
          .join("")
          .slice(0, cols)
          .padEnd(cols)
      );
      inks.push(
        segments.flatMap(([text, role]) =>
          Array.from({ length: text.length }, () => roleColor(role, env?.paper))
        )
      );
    };

    add([["$ cat ~/stack.log", "accent"]]);
    add([["", "ink"]]);

    for (let i = 0; i < visible; i++) {
      const entry = ENTRIES[i];
      if (entry.continuation) {
        add([["         ", "ink"], [entry.text, "value"]]);
        continue;
      }
      const landed = done || i < visible - 1 || now % pace >= pace * 0.6;
      add([
        [landed ? "[  OK  ]" : "[  ..  ]", landed ? "ok" : "wait"],
        [" ", "ink"],
        [entry.label.padEnd(13), "label"],
        [entry.text, "value"],
      ]);
    }

    if (done) {
      add([["[  OK  ] stack verified · 16 technologies", "summary"]]);
    }
    add([
      ["$ ", "accent"],
      [done || now % 0.9 < 0.6 ? "_" : " ", "ok"],
    ]);
    while (out.length < rows) add([["", "ink"]]);

    if (env?.color) {
      const fallback = roleColor("ink", env.paper);
      let i = 0;
      for (let r = 0; r < rows; r++) {
        const row = inks[r] ?? [];
        for (let c = 0; c < cols; c++) {
          env.color[i++] = row[c] ?? fallback;
        }
      }
    }

    return out.join("\n");
  };
}

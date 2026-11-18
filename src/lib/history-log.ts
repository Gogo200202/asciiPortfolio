import type { Env, Frame, Meta } from "ascii.rest";

import { PALETTE, roleColor } from "./log-colors";
import type { LogRole } from "./log-colors";

export interface HistoryLogOptions {
  [key: string]: unknown;
  
  pace?: number;
}

interface Line {
  graph: string;
  text?: string;
  marks?: string;
  branch?: string;
}

type Segment = [text: string, role: LogRole];

const LINES: Line[] = [
  {
    graph: "*   ",
    text: "Master · Software and computer engineering",
    marks: "HEAD -> main",
  },
  {
    graph: "*   ",
    text: "currently pursuing · Technical University of Gabrovo",
  },
  { graph: "|\\  " },
  {
    graph: "| * ",
    text: "Jul 2026 · contract complete",
    branch: "career",
  },
  {
    graph: "| * ",
    text: "Feb 2026 · Software engineer · Optimal Industries",
  },
  { graph: "* | ", text: "Jul 2026 · merge career into main" },
  { graph: "|/  " },
  {
    graph: "*   ",
    text: "2025 · Bachelor · Software and computer engineering",
  },
  {
    graph: "*   ",
    text: "Technical University of Gabrovo · avg 4.80",
  },
];

export const meta: Meta<HistoryLogOptions> = {
  name: "history log",
  category: "ui",
  note: "git log graph of education and work history, newest commit first",
  cols: 72,
  rows: 13,
  fps: 12,
  palette: PALETTE,

  still: -1,
  options: { pace: 0.24 },
};

function sha(i: number) {
  let h = Math.imul(i + 1, 0x9e3779b1) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0)
    .toString(16)
    .padStart(8, "0")
    .slice(0, 7);
}

const messageRole = (line: Line): LogRole => {
  if (line.graph.startsWith("| *")) return "ok";
  if (line.graph.startsWith("* |")) return "mark";
  return "accent";
};

export default function historyLog({
  pace = meta.options?.pace ?? 0.24,
}: Partial<HistoryLogOptions> = {}): Frame {
  const { cols, rows } = meta;

  const intro = LINES.length * pace;
  const type = Math.min(0.22, pace * 0.85);
  const shas = LINES.map((_, i) => sha(i));

  return (t: number, env?: Env) => {
    const settled = t < 0;
    const done = settled || t >= intro;
    const now = settled ? intro : Math.min(Math.max(t, 0), intro);
    const visible = Math.min(LINES.length, Math.floor(now / pace) + 1);
    const into = now % pace;

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

    add([["$ git log --graph --oneline", "accent"]]);
    add([["", "ink"]]);

    for (let r = 0; r < visible; r++) {
      const line = LINES[r];
      const segments: Segment[] = [[line.graph.padEnd(5), "lane"]];
      if (line.text) {
        const typed =
          !done && r === visible - 1 && into < type
            ? line.text.slice(
                0,
                Math.ceil(line.text.length * Math.min(1, into / type))
              )
            : line.text;
        const marks = [line.marks, line.branch].filter(Boolean).join(", ");
        segments.push([shas[r], "hash"], [" ", "ink"]);
        if (marks) {
          segments.push([`(${marks})`, "mark"], [" ", "ink"]);
        }
        segments.push([typed, messageRole(line)]);
      }
      add(segments);
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

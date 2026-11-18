import type { Frame, Meta } from "ascii.rest";

/**
 * The loading screen's boot log, derived from ascii.rest's `bootLog` piece
 * (MIT). Same self test / kernel / services shape, but the lines describe my
 * portfolio and the whole sequence is played across the 2s the loading screen
 * is on screen, then it holds at the login prompt.
 */
export const meta = {
  name: "portfolio boot log",
  category: "ui",
  note: "a portfolio self test counts memory, then the boot log settles at a login prompt",
  cols: 64,
  rows: 16,
  fps: 30,
  // Reduced motion lands on the finished login prompt, not a blank first frame.
  still: 2,
} satisfies Meta;

const W = 62; // text width inside a one-column margin
const MEMORY = 16384; // MB
const MEM_AT = 0.4; // when the memory test starts
const TEST = 2; // seconds it takes
const SPEED = 4.6; // play across the 2s loading window so the login lands near the end
const SPIN = "|/-\\";
const EIGHTHS = "░▏▎▍▌▋▊▉";

// Portfolio lines: seconds since the previous line on the kernel's clock, then the text.
const KERNEL: [number, string][] = [
  [0, "georgi angelov portfolio, version 1.0"],
  [0, "entry-level full-stack web developer"],
  [0.004, "education: bsc software engineering, 2025"],
  [0.077, "university: tu gabrovo, avg grade 4.80"],
  [0.082, "master: software engineering, in progress"],
  [0.047, "work: software engineer, optimal industries"],
  [0.087, "february - july 2026, plovdiv"],
  [0.022, "languages: java, c#, javascript, html, css"],
  [0.084, "frameworks: react, next.js, tailwind, query"],
  [0.002, " node.js, spring, asp.net"],
  [0.107, "tools: git, linux · databases: mongodb, sql"],
  [0.129, "mounting 6 projects ..."],
  [0.062, "init: starting portfolio"],
];
// Service lines: seconds after the previous line, then the text. A third value
// makes it a start job that spins that long before it lands. The last is the login.
const SERVICES: [number, string, number?][] = [
  [0.35, "[  OK  ] mounted portfolio root"],
  [0.12, "[  OK  ] started history graph"],

  [0.08, "[  OK  ] reached target sections"],
  [0.1, "[  OK  ] waiting for user session", 2.6],
  [0.1, "[  OK  ] session ready"],
  [0.25, "[  OK  ] synced with github"],

  [0.1, "georgi@portfolio:~$ "],
];

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function bootLog(): Frame {
  const { cols, rows } = meta;
  const rand = mulberry32(11);

  // A self test row: a label, its detail, and a status at the right edge.
  const row = (label: string, detail: string, status = "") => {
    const left = label.padEnd(11) + detail;
    return left + status.padStart(W - left.length);
  };
  // A device probe spins until it resolves at `done`.
  const probe =
    (label: string, detail: string, status: string, done: number) =>
    (now: number) =>
      now >= done
        ? row(label, detail, status)
        : row(label, "detecting " + SPIN[Math.floor((now + done) * 10) % 4]);
  const tested = (now: number) =>
    Math.min(1, Math.max(0, (now - MEM_AT) / TEST));

  // Each entry: when it appears, and how it reads at a given moment.
  const entries: { at: number; text: (now: number) => string }[] = [];
  let at = 0;
  const put = (text: string | ((now: number) => string)) =>
    entries.push({ at, text: typeof text === "string" ? () => text : text });

  at = 0.12;
  put(row("portfolio bios 1.0", "", "self test"));
  at += 0.04;
  put("─".repeat(W));
  at += 0.04;
  put(row("developer", "georgi angelov", "ok"));
  at += 0.04;
  put(row("stack", "react · next.js · java · c#", "ok"));
  at += 0.04;
  put((now) => {
    const f = tested(now);
    const mb = Math.floor(f * MEMORY);
    return row(
      "memory",
      String(mb).padStart(5) + " MB of " + MEMORY + " MB",
      f < 1 ? "testing" : "ok",
    );
  });
  // The test's progress, the address it has reached, and a percentage.
  put((now) => {
    const f = tested(now);
    const fill = f * 32;
    const full = Math.floor(fill);
    const bar = (
      "█".repeat(full) +
      (full < 32 ? EIGHTHS[Math.floor((fill - full) * 8)] : "")
    ).padEnd(32, "░");
    const top = MEMORY * 1048576;
    const addr = f < 1 ? Math.floor((f * top) / 4096) * 4096 : top - 1;
    const hex = "0x" + addr.toString(16).toUpperCase().padStart(9, "0");
    return (
      " ".repeat(11) +
      bar +
      "  " +
      hex +
      (Math.floor(f * 100) + "%").padStart(W - 56)
    );
  });
  at += 0.04;
  put(row("display", "light + dark themes, 60 Hz", "ok"));
  at += 0.04;
  put(probe("projects", "6 repos, all deployed", "ok", 1.3));
  at += 0.04;
  put(probe("contact", "github · linkedin · leetcode", "ok", 1.9));
  at += 0.04;
  put(probe("network", "portfolio online", "link up", 2.2));
  at += 0.04;
  put(probe("skills", "16 technologies loaded", "ok", 0.95));
  at += 0.04;
  put(row("sections", "home · history · letter · projects · contact"));
  at += 0.04;
  put("─".repeat(W));
  at += 0.04;
  put("scroll to explore · links in the footer");
  at = MEM_AT + TEST + 0.2;
  put("");
  at += 0.05;
  put("booting portfolio ...");
  at += 0.2;
  put("loading georgi's profile ...");

  // The kernel's burst plays at two thirds speed so it reads as a fast scroll.
  at += 0.3;
  let stamp = 0;
  for (const [gap, text] of KERNEL) {
    stamp += gap;
    at += gap * 1.5;
    const s = stamp ? stamp + rand() * 0.0009 : 0;
    put("[" + s.toFixed(6).padStart(12) + "] " + text);
  }

  for (const [gap, text, spin] of SERVICES) {
    at += gap;
    if (spin) {
      const from = at;
      put((now) => {
        const age = now - from;
        if (age >= spin) return text;
        // Three stars sweep back and forth inside the brackets while the job runs.
        const k = Math.floor(age * 8) % 6;
        const p = k < 4 ? k : 6 - k;
        const stars = (" ".repeat(p) + "***").padEnd(6);
        return (
          "[" +
          stars +
          "] a start job is running for portfolio (" +
          Math.floor(age + 5) +
          "s / 10s)"
        );
      });
      at += spin;
    } else put(text);
  }
  const login = at;

  return (t) => {
    // Advance piece time ~4.6x faster than real time, then hold at the login
    // prompt for as long as the loading screen is still up.
    const now = Math.min(t * SPEED, login);
    const lines: string[] = [];
    for (const e of entries) if (e.at <= now) lines.push(e.text(now));
    // The cursor blinks after the login prompt, or at the top of the blank screen.
    if (now >= login) lines[lines.length - 1] += t % 1 < 0.6 ? "_" : "";
    else if (!lines.length) lines.push("_");
    const top = Math.max(0, lines.length - rows);
    const out: string[] = [];
    for (let r = 0; r < rows; r++)
      out.push((" " + (lines[top + r] ?? "")).padEnd(cols).slice(0, cols));
    return out.join("\n");
  };
}

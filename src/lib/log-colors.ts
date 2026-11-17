/**
 * Palette shared by the two history logs.
 *
 * ascii.rest colours a piece on a canvas: each cell picks one palette index.
 * Light and dark variants are both in the palette; `roleColor` picks the set
 * that matches the current theme, using the `paper` flag ascii.rest passes in.
 * Derived from ascii.rest's own palette pieces (MIT).
 */
export const PALETTE = [
  "#16233a", // 0  light ink
  "#e8edf7", // 1  dark ink
  "#0b5cab", // 2  light blue
  "#79c0ff", // 3  dark blue
  "#1b7a46", // 4  light green
  "#7ee2a8", // 5  dark green
  "#7040b8", // 6  light purple
  "#c9a6ff", // 7  dark purple
  "#a35b12", // 8  light orange
  "#ffc266", // 9  dark orange
  "#6b7280", // 10 light grey
  "#a9b2c3", // 11 dark grey
  "#b8346f", // 12 light pink
  "#ff9ec4", // 13 dark pink
] as const;

export type LogRole =
  | "ink"
  | "accent"
  | "lane"
  | "hash"
  | "mark"
  | "ok"
  | "wait"
  | "label"
  | "value"
  | "summary";

const LIGHT: Record<LogRole, number> = {
  ink: 0,
  accent: 2,
  lane: 6,
  hash: 10,
  mark: 8,
  ok: 4,
  wait: 8,
  label: 6,
  value: 0,
  summary: 4,
};

const DARK: Record<LogRole, number> = {
  ink: 1,
  accent: 3,
  lane: 7,
  hash: 11,
  mark: 9,
  ok: 5,
  wait: 9,
  label: 7,
  value: 1,
  summary: 5,
};

/** Palette index for a role. `paper` is true on a light background. */
export const roleColor = (role: LogRole, paper?: boolean): number =>
  (paper ? LIGHT : DARK)[role];

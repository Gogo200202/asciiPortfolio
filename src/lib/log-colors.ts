
export const PALETTE = [
  "#16233a", 
  "#e8edf7", 
  "#0b5cab", 
  "#79c0ff", 
  "#1b7a46", 
  "#7ee2a8", 
  "#7040b8", 
  "#c9a6ff", 
  "#a35b12", 
  "#ffc266", 
  "#6b7280", 
  "#a9b2c3", 
  "#b8346f", 
  "#ff9ec4", 
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

export const roleColor = (role: LogRole, paper?: boolean): number =>
  (paper ? LIGHT : DARK)[role];

export type Rgba = readonly [number, number, number, number];

export const ASCII_COLOR_NAMES = [
  "ink",
  "blue",
  "purple",
  "green",
  "pink",
  "orange",
  "red",
  "grey",
] as const;

export type AsciiColorName = (typeof ASCII_COLOR_NAMES)[number];

const FALLBACKS = {
  blue: "oklch(0.64 0.16 245)",
  green: "oklch(0.68 0.16 152)",
  grey: "oklch(0.6 0 0)",
  ink: "oklch(0.6 0.2 270)",
  orange: "oklch(0.72 0.16 58)",
  pink: "oklch(0.66 0.19 352)",
  purple: "oklch(0.62 0.2 302)",
  red: "oklch(0.62 0.21 26)",
} as const satisfies Record<AsciiColorName, string>;

export const ASCII_COLORS = {
  blue: "--ascii-color-blue",
  green: "--ascii-color-green",
  grey: "--ascii-color-grey",
  ink: "--ascii-ink",
  orange: "--ascii-color-orange",
  pink: "--ascii-color-pink",
  purple: "--ascii-color-purple",
  red: "--ascii-color-red",
} as const satisfies Record<AsciiColorName, `--${string}`>;

export type AsciiColor = AsciiColorName | (string & {});

export type AsciiPalette = readonly [AsciiColor, AsciiColor, ...AsciiColor[]];

export const DEFAULT_PALETTE = [
  "--ascii-paper",
  "--ascii-ink",
] as const satisfies AsciiPalette;

const isColorName = (value: string): value is AsciiColorName =>
  Object.hasOwn(ASCII_COLORS, value);

export const cssColor = (value: AsciiColor): string => {
  if (isColorName(value)) {
    return `var(${ASCII_COLORS[value]}, ${FALLBACKS[value]})`;
  }
  return value.startsWith("--") ? `var(${value})` : value;
};

export const MOTION = {
  base: 240,
  ease: "cubic-bezier(0.23, 1, 0.32, 1)",
  fast: 150,
  slow: 600,
} as const;

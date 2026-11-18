export type CharsetKind = "ramp" | "braille" | "quadrants" | "edge";

export interface Charset {
  
  readonly id: string;
  
  readonly label: string;
  readonly kind: CharsetKind;
  
  readonly glyphs: readonly string[];
  
  readonly grid: readonly [number, number];
}

const split = (ramp: string): readonly string[] => [...ramp];

export const BRAILLE_BASE = 0x28_00;

export const BRAILLE_DOT_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
] as const;

export const brailleChar = (mask: number): string =>
  String.fromCodePoint(BRAILLE_BASE + (mask & 255));

export const QUADRANT_GLYPHS = split(" ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█");

export const QUADRANT_BITS = [
  [1, 2],
  [4, 8],
] as const;

export const quadrantChar = (mask: number): string =>
  QUADRANT_GLYPHS[mask & 15] ?? " ";

export const EDGE_GLYPHS = split("-/|\\");

export const edgeChar = (gx: number, gy: number): string => {
  
  let angle = Math.atan2(gy, gx);
  if (angle < 0) {
    angle += Math.PI;
  }
  const step = Math.round(angle / (Math.PI / 4)) % 4;

  return EDGE_GLYPHS[[2, 1, 0, 3][step] ?? 0] ?? "|";
};

export const EIGHTHS_UP = split(" ▁▂▃▄▅▆▇█");

export const EIGHTHS_RIGHT = split(" ▏▎▍▌▋▊▉█");

export const SHADES = split(" ░▒▓█");

export const BOX = {
  ascii: { bl: "+", br: "+", h: "-", tl: "+", tr: "+", v: "|", x: "+" },
  double: { bl: "╚", br: "╝", h: "═", tl: "╔", tr: "╗", v: "║", x: "╬" },
  heavy: { bl: "┗", br: "┛", h: "━", tl: "┏", tr: "┓", v: "┃", x: "╋" },
  light: { bl: "└", br: "┘", h: "─", tl: "┌", tr: "┐", v: "│", x: "┼" },
  rounded: { bl: "╰", br: "╯", h: "─", tl: "╭", tr: "╮", v: "│", x: "┼" },
} as const satisfies Record<
  string,
  Record<"tl" | "tr" | "bl" | "br" | "h" | "v" | "x", string>
>;

export type BoxStyle = keyof typeof BOX;

export const SPINNERS = {
  arc: split("◜◠◝◞◡◟"),
  bar: split("▁▂▃▄▅▆▇█▇▆▅▄▃▂"),
  braille: split("⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"),
  orbit: split("⣾⣽⣻⢿⡿⣟⣯⣷"),
  quadrant: split("▖▘▝▗"),
  tick: split("-\\|/"),
} as const;

export type SpinnerName = keyof typeof SPINNERS;

const BRAILLE_GLYPHS = Array.from({ length: 256 }, (_, mask) =>
  brailleChar(mask)
);

export const CHARSETS = {
  blocks: {
    glyphs: SHADES,
    grid: [1, 1],
    id: "blocks",
    kind: "ramp",
    label: "ANSI blocks",
  },
  braille: {
    glyphs: BRAILLE_GLYPHS,
    grid: [2, 4],
    id: "braille",
    kind: "braille",
    label: "Braille 2×4",
  },
  cp437: {
    glyphs: split(" ·∙•∟↔○◘♪♫☼↕‼§¶♂♀♠♣♥♦▬►◄▲▼☺☻◙░▒▓█"),
    grid: [1, 1],
    id: "cp437",
    kind: "ramp",
    label: "CP437",
  },
  dense: {
    glyphs: split(
      " .'`^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"
    ),
    grid: [1, 1],
    id: "dense",
    kind: "ramp",
    label: "Dense 70",
  },
  dots: {
    
    glyphs: split(" ·∙•⦁●"),
    grid: [1, 1],
    id: "dots",
    kind: "ramp",
    label: "Halftone",
  },
  edge: {
    glyphs: split(" .:-=+*#%@"),
    grid: [1, 1],
    id: "edge",
    kind: "edge",
    label: "Sobel edges",
  },
  katakana: {
    glyphs: split(" ·:=+ｰｼﾂｿﾝﾐﾊﾑﾒﾓﾔﾕﾗﾘﾜｦｱｳｴｵｶｷｹｺｻｽｾﾀﾃﾅﾆﾇﾈﾋﾎﾏ01234789Z"),
    grid: [1, 1],
    id: "katakana",
    kind: "ramp",
    label: "Katakana",
  },
  petscii: {
    glyphs: split(" ▁╱╲─│╭╮╰╯▂┼○◇▃♠♣♥♦●◆▄▌▅▆▊▇█"),
    grid: [1, 1],
    id: "petscii",
    kind: "ramp",
    label: "PETSCII",
  },
  quadrants: {
    glyphs: QUADRANT_GLYPHS,
    grid: [2, 2],
    id: "quadrants",
    kind: "quadrants",
    label: "Quadrants 2×2",
  },
  standard: {
    glyphs: split(" .:-=+*#%@"),
    grid: [1, 1],
    id: "standard",
    kind: "ramp",
    label: "Classic",
  },
} as const satisfies Record<string, Charset>;

export type CharsetName = keyof typeof CHARSETS;

export const CHARSET_NAMES = [
  "standard",
  "dense",
  "blocks",
  "quadrants",
  "braille",
  "cp437",
  "petscii",
  "katakana",
  "dots",
  "edge",
] as const satisfies readonly CharsetName[];

const isCharsetName = (value: string): value is CharsetName =>
  Object.hasOwn(CHARSETS, value);

export const resolveCharset = (
  charset: CharsetName | Charset = "standard",
  chars?: string
): Charset => {
  if (chars !== undefined) {
    const glyphs = split(chars);
    if (glyphs.length >= 2) {
      return {
        glyphs,
        grid: [1, 1],
        id: "custom",
        kind: "ramp",
        label: "Custom",
      };
    }
  }
  if (typeof charset !== "string") {
    return charset;
  }
  return isCharsetName(charset) ? CHARSETS[charset] : CHARSETS.standard;
};

export const charsetKey = (charset: Charset): string =>
  `${charset.kind}:${charset.glyphs.join("")}`;

export const rampChar = (charset: Charset, tone: number): string => {
  const { glyphs } = charset;
  const last = glyphs.length - 1;
  const clamped = tone > 0 ? Math.min(tone, 1) : 0;
  return glyphs[Math.round(clamped * last)] ?? " ";
};

export const eighthsBar = (
  value: number,
  width: number,
  glyphs: readonly string[] = EIGHTHS_RIGHT
): string => {
  const cells = Math.max(0, Math.floor(width));
  const clamped = value > 0 ? Math.min(value, 1) : 0;
  const eighths = Math.round(clamped * cells * 8);
  const full = Math.floor(eighths / 8);
  const rest = eighths % 8;
  const solid = glyphs[8] ?? "█";
  let out = solid.repeat(full);
  if (full < cells) {
    out += glyphs[rest] ?? " ";
    out += " ".repeat(cells - full - 1);
  }
  return out;
};

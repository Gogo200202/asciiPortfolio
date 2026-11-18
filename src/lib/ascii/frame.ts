import { rampLevel } from "@/lib/ascii/atlas";
import {
  BRAILLE_DOT_BITS,
  edgeChar,
  QUADRANT_BITS,
  QUADRANT_GLYPHS,
  resolveCharset,
} from "@/lib/ascii/charsets";
import type { Charset, CharsetName } from "@/lib/ascii/charsets";
import { getThresholdMap } from "@/lib/ascii/matrices";
import type { DitherMatrix } from "@/lib/ascii/matrices";
import type { CellMetrics } from "@/lib/ascii/measure";
import {
  ANSI16,
  gradeRgb,
  gradeTone,
  hexToRgb,
  nearestIndex,
  RAMPS,
  sampleRamp,
} from "@/lib/ascii/palettes";
import type {
  Ansi16Name,
  ColorMode,
  Grade,
  RampName,
  Rgb8,
} from "@/lib/ascii/palettes";

export interface AsciiFrame {
  readonly columns: number;
  readonly rows: number;
  
  readonly glyphs: readonly string[];
  
  readonly colors: Uint8ClampedArray | null;
}

export interface AsciiHandle {
  
  capture(): AsciiFrame | null;
  
  readonly canvas: HTMLCanvasElement | null;
  
  colors(): { ink: string; paper: string | null };
  
  metrics(): CellMetrics | null;
}

export type Rgba8 = readonly [number, number, number, number];

export class MutableFrame implements AsciiFrame {
  columns: number;
  rows: number;
  glyphs: string[];
  colors: Uint8ClampedArray | null;

  constructor(columns: number, rows: number, { color = false } = {}) {
    this.columns = Math.max(0, Math.floor(columns));
    this.rows = Math.max(0, Math.floor(rows));
    this.glyphs = Array.from({ length: this.columns * this.rows }, () => " ");
    this.colors = color
      ? new Uint8ClampedArray(this.columns * this.rows * 4)
      : null;
  }

  resize(columns: number, rows: number): void {
    const color = this.colors !== null;
    this.columns = Math.max(0, Math.floor(columns));
    this.rows = Math.max(0, Math.floor(rows));
    this.glyphs = Array.from({ length: this.columns * this.rows }, () => " ");
    this.colors = color
      ? new Uint8ClampedArray(this.columns * this.rows * 4)
      : null;
  }

  setColored(color: boolean): void {
    if (color && !this.colors) {
      this.colors = new Uint8ClampedArray(this.columns * this.rows * 4);
    } else if (!color) {
      this.colors = null;
    }
  }

  clear(glyph = " "): void {
    this.glyphs.fill(glyph);
    this.colors?.fill(0);
  }

  get(x: number, y: number): string | undefined {
    if (x < 0 || y < 0 || x >= this.columns || y >= this.rows) {
      return undefined;
    }
    return this.glyphs[Math.floor(y) * this.columns + Math.floor(x)];
  }

  put(x: number, y: number, glyph: string, rgba?: Rgba8 | Rgb8): void {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    if (cx < 0 || cy < 0 || cx >= this.columns || cy >= this.rows) {
      return;
    }
    const index = cy * this.columns + cx;
    this.glyphs[index] = glyph;
    if (rgba && this.colors) {
      const [r, g, b, a = 255] = rgba;
      this.colors.set([r, g, b, a], index * 4);
    }
  }

  write(x: number, y: number, text: string, rgba?: Rgba8 | Rgb8): void {
    let column = Math.floor(x);
    for (const glyph of text) {
      this.put(column, y, glyph, rgba);
      column += 1;
    }
  }

  fillRect(
    x: number,
    y: number,
    width: number,
    height: number,
    glyph: string,
    rgba?: Rgba8 | Rgb8
  ): void {
    for (let row = 0; row < height; row += 1) {
      for (let column = 0; column < width; column += 1) {
        this.put(x + column, y + row, glyph, rgba);
      }
    }
  }
}

export const frameLines = (frame: AsciiFrame): string[] => {
  const lines: string[] = [];
  for (let row = 0; row < frame.rows; row += 1) {
    const start = row * frame.columns;
    lines.push(frame.glyphs.slice(start, start + frame.columns).join(""));
  }
  return lines;
};

export const frameToText = (
  frame: AsciiFrame,
  { trimEnd = false }: { trimEnd?: boolean } = {}
): string =>
  frameLines(frame)
    .map((line) => (trimEnd ? line.trimEnd() : line))
    .join("\n");

export interface ToneField {
  readonly width: number;
  readonly height: number;
  readonly tones: Float32Array;
  readonly colors: Uint8ClampedArray | null;
}

export const createToneField = (
  columns: number,
  rows: number,
  charset: CharsetName | Charset = "standard",
  { color = false } = {}
): ToneField => {
  const { grid } = resolveCharset(charset);
  const width = Math.max(0, Math.floor(columns)) * grid[0];
  const height = Math.max(0, Math.floor(rows)) * grid[1];
  return {
    colors: color ? new Uint8ClampedArray(width * height * 4) : null,
    height,
    tones: new Float32Array(width * height),
    width,
  };
};

export const fillToneField = (
  field: ToneField,
  sample: (
    u: number,
    v: number
  ) => number | readonly [number, number, number, number]
): void => {
  const { width, height, tones, colors } = field;
  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height;
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const value = sample((x + 0.5) / width, v);
      if (typeof value === "number") {
        tones[index] = value;
      } else {
        const [tone, r, g, b] = value;
        tones[index] = tone;
        colors?.set([r, g, b, 255], index * 4);
      }
    }
  }
};

export interface MapOptions {
  
  charset?: CharsetName | Charset;
  
  chars?: string;
  
  grade?: Grade;
  
  invert?: boolean;
  
  threshold?: number;
  
  positions?: ArrayLike<number>;
  
  edgeThreshold?: number;
  
  dither?: "none" | DitherMatrix;
  
  colorMode?: ColorMode;
  
  ramp?: RampName | readonly string[];
  
  ansi?: Ansi16Name;
  
  palette?: readonly Rgb8[];
}

const clamp01 = (value: number) => (value > 0 ? Math.min(value, 1) : 0);

const rampStops = (ramp: MapOptions["ramp"]): readonly Rgb8[] => {
  if (ramp === undefined) {
    return RAMPS.mainframe.map(hexToRgb);
  }
  if (typeof ramp === "string") {
    return (RAMPS[ramp as RampName] ?? RAMPS.mainframe).map(hexToRgb);
  }
  return ramp.map(hexToRgb);
};

interface Sampler {
  
  readonly tone: (x: number, y: number) => number;
  
  readonly cut: (x: number, y: number) => number;
  readonly dithered: boolean;
}

const createSampler = (field: ToneField, options: MapOptions): Sampler => {
  const { grade, invert = false, dither = "none" } = options;
  const map = dither === "none" ? null : getThresholdMap(dither);
  const { width, tones } = field;
  return {
    cut: (x, y) =>
      map
        ? (map.thresholds[(y % map.size) * map.size + (x % map.size)] ?? 0.5)
        : 0.5,
    dithered: map !== null,
    tone: (x, y) => {
      const raw = tones[y * width + x] ?? 0;
      const graded = gradeTone(Number.isFinite(raw) ? raw : 0, grade);
      return invert ? 1 - graded : graded;
    },
  };
};

interface CellResult {
  readonly glyph: string;
  
  readonly tone: number;
}

const writeColor = (colors: Uint8ClampedArray, index: number, rgb: Rgb8) => {
  const [r, g, b] = rgb;
  const at = index * 4;
  colors[at] = r;
  colors[at + 1] = g;
  colors[at + 2] = b;
  colors[at + 3] = 255;
};

let gradedScratch = new Float32Array(0);

const gradeField = (field: ToneField, options: MapOptions): Float32Array => {
  const { grade, invert = false } = options;
  const { tones } = field;
  if (gradedScratch.length < tones.length) {
    gradedScratch = new Float32Array(tones.length);
  }
  const out = gradedScratch;
  const plain = grade === undefined;
  for (let index = 0; index < tones.length; index += 1) {
    const raw = tones[index] ?? 0;
    const finite = Number.isFinite(raw) ? raw : 0;
    const graded = plain ? clamp01(finite) : gradeTone(finite, grade);
    out[index] = invert ? 1 - graded : graded;
  }
  return out;
};

const BRAILLE_BITS_FLAT = BRAILLE_DOT_BITS.flat();
const QUADRANT_BITS_FLAT = QUADRANT_BITS.flat();

const mapPacked = (
  field: ToneField,
  columns: number,
  rows: number,
  charset: Charset,
  options: MapOptions,
  frame: MutableFrame,
  paint: ((column: number, row: number, tone: number) => Rgb8) | null
): void => {
  const [gx, gy] = charset.grid;
  const braille = charset.kind === "braille";
  const bits = braille ? BRAILLE_BITS_FLAT : QUADRANT_BITS_FLAT;
  const table = braille ? charset.glyphs : QUADRANT_GLYPHS;
  const { dither = "none" } = options;
  const map = dither === "none" ? null : getThresholdMap(dither);
  const threshold = options.threshold ?? 0.5;
  const tones = gradeField(field, options);
  const { width } = field;
  const samples = gx * gy;
  const { glyphs, colors } = frame;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      let mask = 0;
      let sum = 0;
      let bit = 0;
      for (let dy = 0; dy < gy; dy += 1) {
        const y = row * gy + dy;
        const base = y * width + column * gx;
        for (let dx = 0; dx < gx; dx += 1) {
          const tone = tones[base + dx] ?? 0;
          sum += tone;
          const cut = map
            ? (map.thresholds[
                (y % map.size) * map.size + ((column * gx + dx) % map.size)
              ] ?? 0.5)
            : threshold;
          if (tone > cut) {
            
            mask += bits[bit] ?? 0;
          }
          bit += 1;
        }
      }
      const index = row * columns + column;
      glyphs[index] = mask === 0 ? " " : (table[mask] ?? " ");
      if (paint && colors) {
        writeColor(colors, index, paint(column, row, sum / samples));
      }
    }
  }
};

const rampCell = (
  sampler: Sampler,
  charset: Charset,
  column: number,
  row: number,
  columns: number,
  rows: number,
  options: MapOptions
): CellResult => {
  const tone = sampler.tone(column, row);
  if (charset.kind === "edge") {
    const at = (x: number, y: number) =>
      sampler.tone(
        Math.min(columns - 1, Math.max(0, x)),
        Math.min(rows - 1, Math.max(0, y))
      );
    const sobelX =
      at(column + 1, row - 1) +
      2 * at(column + 1, row) +
      at(column + 1, row + 1) -
      at(column - 1, row - 1) -
      2 * at(column - 1, row) -
      at(column - 1, row + 1);
    const sobelY =
      at(column - 1, row + 1) +
      2 * at(column, row + 1) +
      at(column + 1, row + 1) -
      at(column - 1, row - 1) -
      2 * at(column, row - 1) -
      at(column + 1, row - 1);
    if (Math.hypot(sobelX, sobelY) / 4 > (options.edgeThreshold ?? 0.22)) {
      return { glyph: edgeChar(sobelX, sobelY), tone };
    }
  }
  const { glyphs } = charset;
  const cut = sampler.cut(column, row);
  const { positions } = options;

  if (positions && positions.length === glyphs.length) {
    return { glyph: glyphs[rampLevel(tone, positions, cut)] ?? " ", tone };
  }
  const last = glyphs.length - 1;
  const level = Math.min(last, Math.max(0, Math.floor(tone * last + cut)));
  return { glyph: glyphs[level] ?? " ", tone };
};

const cellColorizer = (
  field: ToneField,
  charset: Charset,
  options: MapOptions
): ((column: number, row: number, tone: number) => Rgb8) => {
  const { colorMode = "mono", grade } = options;
  if (colorMode === "duotone") {
    const stops = rampStops(options.ramp);
    return (_column, _row, tone) => sampleRamp(stops, tone);
  }
  if (
    colorMode === "palette" &&
    options.palette &&
    options.palette.length > 0
  ) {

    const inks =
      options.palette.length > 1 ? options.palette.slice(1) : options.palette;
    return (_column, _row, tone) => sampleRamp(inks, tone);
  }
  const ansiTable: readonly Rgb8[] = ANSI16[options.ansi ?? "vga"];
  const [gx, gy] = charset.grid;
  const { width, colors } = field;
  return (column, row, tone) => {
    let rgb: Rgb8;
    if (colors) {
      
      let r = 0;
      let g = 0;
      let b = 0;
      for (let dy = 0; dy < gy; dy += 1) {
        for (let dx = 0; dx < gx; dx += 1) {
          const at = ((row * gy + dy) * width + column * gx + dx) * 4;
          r += colors[at] ?? 0;
          g += colors[at + 1] ?? 0;
          b += colors[at + 2] ?? 0;
        }
      }
      const count = gx * gy;
      rgb = gradeRgb([r / count, g / count, b / count], grade);
    } else {
      const grey = clamp01(tone) * 255;
      rgb = [grey, grey, grey];
    }
    return colorMode === "ansi16"
      ? (ansiTable[nearestIndex(rgb, ansiTable)] ?? rgb)
      : rgb;
  };
};

export const mapTones = (
  field: ToneField,
  columns: number,
  rows: number,
  options: MapOptions = {},
  into?: MutableFrame
): MutableFrame => {
  const charset = resolveCharset(options.charset, options.chars);
  const colorMode = options.colorMode ?? "mono";
  const colored = colorMode !== "mono";
  const frame = into ?? new MutableFrame(columns, rows, { color: colored });
  if (frame.columns !== columns || frame.rows !== rows) {
    frame.resize(columns, rows);
  }
  frame.setColored(colored);

  const paint = colored ? cellColorizer(field, charset, options) : null;
  if (charset.kind === "braille" || charset.kind === "quadrants") {
    mapPacked(field, columns, rows, charset, options, frame, paint);
    return frame;
  }
  const sampler = createSampler(field, options);
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const { glyph, tone } = rampCell(
        sampler,
        charset,
        column,
        row,
        columns,
        rows,
        options
      );
      const index = row * columns + column;
      frame.glyphs[index] = glyph;
      if (paint && frame.colors) {
        writeColor(frame.colors, index, paint(column, row, tone));
      }
    }
  }
  return frame;
};

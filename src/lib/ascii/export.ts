import type { AsciiFrame, AsciiHandle } from "@/lib/ascii/frame";
import { frameToText } from "@/lib/ascii/frame";
import { glyphShape, isGeometricGlyph, shapePath } from "@/lib/ascii/glyphs";
import { DEFAULT_CELL, DEFAULT_FONT, measureCell } from "@/lib/ascii/measure";
import type { CellMetrics } from "@/lib/ascii/measure";
import { paintFrame } from "@/lib/ascii/paint";
import {
  ANSI16,
  ansiBackground,
  ansiForeground,
  hexToRgb,
  nearestIndex,
  rgbToHex,
} from "@/lib/ascii/palettes";
import type { Ansi16Name, Rgb8 } from "@/lib/ascii/palettes";

export interface TextOptions {
  
  trimEnd?: boolean;
}

export const toText = (
  frame: AsciiFrame,
  { trimEnd = false }: TextOptions = {}
): string => frameToText(frame, { trimEnd });

export type ExportColor = string | Rgb8;

const toRgb = (color: ExportColor): Rgb8 =>
  typeof color === "string" ? hexToRgb(color) : color;

export interface AnsiOptions {
  
  mode?: "truecolor" | "ansi16";
  
  ansi?: Ansi16Name;
  
  ink?: ExportColor;
  
  paper?: ExportColor;
  
  background?: boolean;
  
  trimEnd?: boolean;
}

const ESC = "\u001B[";
export const ANSI_RESET = `${ESC}0m`;

const ansiCodes = ({
  mode = "truecolor",
  ansi = "vga",
  ink,
  paper,
  background = false,
}: AnsiOptions) => {
  const table: readonly Rgb8[] = ANSI16[ansi];
  const foreground = (rgb: Rgb8) =>
    mode === "ansi16"
      ? `${ESC}${ansiForeground(nearestIndex(rgb, table))}m`
      : `${ESC}38;2;${Math.round(rgb[0])};${Math.round(rgb[1])};${Math.round(rgb[2])}m`;
  let backgroundCode = "";
  if (background && paper !== undefined) {
    const rgb = toRgb(paper);
    backgroundCode =
      mode === "ansi16"
        ? `${ESC}${ansiBackground(nearestIndex(rgb, table))}m`
        : `${ESC}48;2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
  }
  const inkCode = ink === undefined ? `${ESC}39m` : foreground(toRgb(ink));
  return { backgroundCode, foreground, inkCode };
};

export const toAnsi = (
  frame: AsciiFrame,
  options: AnsiOptions = {}
): string => {
  const { backgroundCode, foreground, inkCode } = ansiCodes(options);
  const trim = options.trimEnd === true && backgroundCode === "";
  const { columns, rows, glyphs, colors } = frame;
  const codeAt = (index: number) => {
    const at = index * 4;
    return colors && (colors[at + 3] ?? 0) > 0
      ? foreground([colors[at] ?? 0, colors[at + 1] ?? 0, colors[at + 2] ?? 0])
      : inkCode;
  };
  const lines: string[] = [];
  for (let row = 0; row < rows; row += 1) {
    let end = columns;
    if (trim) {
      while (end > 0 && glyphs[row * columns + end - 1] === " ") {
        end -= 1;
      }
    }
    let line = backgroundCode;
    let current = "";
    for (let column = 0; column < end; column += 1) {
      const index = row * columns + column;
      const glyph = glyphs[index] ?? " ";
      
      const code = glyph === " " ? current : codeAt(index);
      if (code !== current) {
        line += code;
        current = code;
      }
      line += glyph;
    }
    lines.push(line === "" ? line : `${line}${ANSI_RESET}`);
  }
  return `${lines.join("\n")}${ANSI_RESET}`;
};

export interface SvgOptions {
  
  metrics?: Pick<CellMetrics, "width" | "height"> &
    Partial<Pick<CellMetrics, "fontSize">>;
  
  ink?: string;
  
  paper?: string | null;
  
  font?: string;
  
  shapes?: boolean;
}

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const round = (value: number) => Math.round(value * 100) / 100;

const cellColor = (frame: AsciiFrame, index: number): string | null => {
  const { colors } = frame;
  if (!colors) {
    return null;
  }
  const at = index * 4;
  const alpha = colors[at + 3] ?? 0;
  if (alpha === 0) {
    return null;
  }
  const hex = rgbToHex([
    colors[at] ?? 0,
    colors[at + 1] ?? 0,
    colors[at + 2] ?? 0,
  ]);
  return alpha === 255
    ? hex
    : `${hex}${Math.round(alpha).toString(16).padStart(2, "0")}`;
};

interface SvgCell {
  readonly width: number;
  readonly height: number;
  readonly shapes: boolean;
}

const textEnd = (frame: AsciiFrame, row: number, shapes: boolean): number => {
  const { columns, glyphs } = frame;
  let end = columns;
  while (end > 0) {
    const glyph = glyphs[row * columns + end - 1] ?? " ";
    if (glyph !== " " && !(shapes && isGeometricGlyph(glyph))) {
      break;
    }
    end -= 1;
  }
  return end;
};

const svgRow = (
  frame: AsciiFrame,
  row: number,
  cell: SvgCell,
  paths: Map<string, string>
): string => {
  const { columns, glyphs } = frame;
  
  const end = textEnd(frame, row, cell.shapes);
  let body = "";
  let run = "";
  let current: string | null = null;
  const flush = () => {
    const text = escapeXml(run);
    body +=
      current === null || run === ""
        ? text
        : `<tspan fill="${current}">${text}</tspan>`;
    run = "";
  };
  for (let column = 0; column < columns; column += 1) {
    const index = row * columns + column;
    const glyph = glyphs[index] ?? " ";
    const color: string | null =
      glyph === " " ? current : cellColor(frame, index);
    const shape = cell.shapes && glyph !== " " ? glyphShape(glyph) : undefined;
    if (shape) {
      const key = color ?? "";
      paths.set(
        key,
        (paths.get(key) ?? "") +
          shapePath(shape, {
            height: cell.height,
            width: cell.width,
            x: column * cell.width,
            y: row * cell.height,
          })
      );
    }
    if (column >= end) {
      continue;
    }
    if (color !== current) {
      flush();
      current = color;
    }
    
    run += shape ? " " : glyph;
  }
  flush();
  if (body.trim() === "") {
    return "";
  }
  return `<text xml:space="preserve" y="${round((row + 0.5) * cell.height)}" textLength="${round(end * cell.width)}" lengthAdjust="spacing" dominant-baseline="central">${body}</text>`;
};

export const toSvg = (
  frame: AsciiFrame,
  {
    metrics,
    ink = "#000",
    paper = null,
    font = DEFAULT_FONT,
    shapes = true,
  }: SvgOptions = {}
): string => {
  const cell: SvgCell = {
    height: metrics?.height ?? DEFAULT_CELL,
    shapes,
    width: metrics?.width ?? DEFAULT_CELL / 2,
  };
  const fontSize = metrics?.fontSize ?? cell.height / 1.2;
  const width = round(frame.columns * cell.width);
  const height = round(frame.rows * cell.height);
  const paths = new Map<string, string>();
  const texts: string[] = [];
  for (let row = 0; row < frame.rows; row += 1) {
    texts.push(svgRow(frame, row, cell, paths));
  }
  const text = texts.join("");
  const background =
    paper === null
      ? ""
      : `<rect width="100%" height="100%" fill="${escapeXml(paper)}"/>`;
  const shapeMarkup = [...paths]
    .map(
      ([color, d]) =>
        `<path${color === "" ? "" : ` fill="${color}"`} d="${d}"/>`
    )
    .join("");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    background,
    `<g fill="${escapeXml(ink)}">`,
    shapeMarkup,
    text === ""
      ? ""
      : `<g font-family="${escapeXml(font)}" font-size="${round(fontSize)}" style="white-space:pre;font-variant-ligatures:none">${text}</g>`,
    "</g></svg>",
  ].join("");
};

export interface PngOptions {
  
  scale?: number;
  
  ink?: string;
  
  paper?: string | null;
  
  cell?: number;
  
  font?: string;
}

const isHandle = (
  value: AsciiHandle | AsciiFrame | HTMLCanvasElement
): value is AsciiHandle => "capture" in value;

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("ascii-export: the canvas could not be encoded"));
      }
    }, "image/png");
  });

const MAX_CANVAS_SIDE = 16_384;

export const renderFrame = (
  frame: AsciiFrame,
  {
    scale = 2,
    ink = "#000",
    paper = null,
    cell = DEFAULT_CELL,
    font = DEFAULT_FONT,
  }: PngOptions = {}
): HTMLCanvasElement => {
  const probe = measureCell({ cell, dpr: 1, font });
  const largest = Math.max(
    frame.columns * probe.width,
    frame.rows * probe.height,
    1
  );
  const dpr = Math.max(0.25, Math.min(scale, MAX_CANVAS_SIDE / largest));
  const metrics = measureCell({ cell, dpr, font });
  const canvas = document.createElement("canvas");
  canvas.width = frame.columns * metrics.deviceWidth;
  canvas.height = frame.rows * metrics.deviceHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("ascii-export: no 2D canvas context");
  }
  paintFrame(context, frame, metrics, { ink, paper });
  return canvas;
};

export const toPng = async (
  source: AsciiHandle | AsciiFrame | HTMLCanvasElement,
  options: PngOptions = {}
): Promise<Blob> => {
  if (source instanceof HTMLCanvasElement) {
    return await canvasToBlob(source);
  }
  if (isHandle(source)) {
    if (options.scale === undefined && source.canvas) {
      return await canvasToBlob(source.canvas);
    }
    const frame = source.capture();
    if (!frame) {
      throw new Error("ascii-export: the renderer has not drawn a frame yet");
    }
    const colors = source.colors();
    const metrics = source.metrics();
    return await canvasToBlob(
      renderFrame(frame, {
        cell: metrics?.height,
        font: metrics?.font,
        ink: colors.ink,
        paper: colors.paper,
        ...options,
      })
    );
  }
  return await canvasToBlob(renderFrame(source, options));
};

export const VIDEO_TYPES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4;codecs=avc1",
  "video/mp4",
] as const;

export const pickVideoType = (preferred?: string): string | undefined => {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }
  const candidates =
    preferred === undefined ? VIDEO_TYPES : [preferred, ...VIDEO_TYPES];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
};

export const videoExtension = (mimeType: string): "webm" | "mp4" =>
  mimeType.startsWith("video/mp4") ? "mp4" : "webm";

export interface RecorderOptions {
  
  fps?: number;
  
  mimeType?: string;
  
  bitsPerSecond?: number;
  
  onProgress?: (elapsedMs: number) => void;
}

export interface CanvasRecorder {
  
  readonly mimeType: string;
  
  readonly state: RecordingState;
  start(): void;
  
  stop(): Promise<Blob>;
}

export const createRecorder = (
  canvas: HTMLCanvasElement,
  {
    fps = 60,
    mimeType,
    bitsPerSecond = 8_000_000,
    onProgress,
  }: RecorderOptions = {}
): CanvasRecorder => {
  const type = pickVideoType(mimeType);
  if (type === undefined || typeof canvas.captureStream !== "function") {
    throw new Error("ascii-export: this browser can't record a canvas");
  }
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType: type,
    videoBitsPerSecond: bitsPerSecond,
  });
  const chunks: Blob[] = [];
  let started = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  recorder.addEventListener("dataavailable", (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  });
  const halt = () => {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    for (const track of stream.getTracks()) {
      track.stop();
    }
  };
  return {
    mimeType: type,
    start: () => {
      if (recorder.state !== "inactive") {
        return;
      }
      started = performance.now();
      recorder.start(250);
      if (onProgress) {
        timer = setInterval(() => onProgress(performance.now() - started), 100);
      }
    },
    get state() {
      return recorder.state;
    },
    stop: () =>
      
      new Promise<Blob>((resolve) => {
        const finish = () => {
          halt();
          resolve(new Blob(chunks, { type }));
        };
        if (recorder.state === "inactive") {
          finish();
          return;
        }
        recorder.addEventListener("stop", finish, { once: true });
        recorder.stop();
      }),
  };
};

export const recordCanvas = async (
  canvas: HTMLCanvasElement,
  {
    durationMs = 4000,
    ...options
  }: RecorderOptions & { durationMs?: number } = {}
): Promise<Blob> => {
  const recorder = createRecorder(canvas, options);
  recorder.start();
  
  await new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
  return await recorder.stop();
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadText = (
  text: string,
  filename: string,
  mime = "text/plain;charset=utf-8"
): void => downloadBlob(new Blob([text], { type: mime }), filename);

export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  }
};

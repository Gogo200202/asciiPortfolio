export const DEFAULT_CELL = 12;

export const GLYPH_ADVANCE = 0.6;

export const LINE_HEIGHT = 1.2;

export const DEFAULT_FONT =
  'ui-monospace, "SF Mono", "JetBrains Mono", "Cascadia Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace';

export interface CellMetrics {
  
  readonly width: number;
  
  readonly height: number;
  
  readonly deviceWidth: number;
  readonly deviceHeight: number;
  
  readonly dpr: number;
  
  readonly fontSize: number;
  
  readonly font: string;
}

let probe: CanvasRenderingContext2D | null = null;
const advanceCache = new Map<string, number>();

if (typeof document !== "undefined") {
  document.fonts?.addEventListener?.("loadingdone", () => advanceCache.clear());
}

const measureAdvance = (font: string): number => {
  const cached = advanceCache.get(font);
  if (cached !== undefined) {
    return cached;
  }
  if (typeof document === "undefined") {
    return GLYPH_ADVANCE;
  }
  probe ??= document.createElement("canvas").getContext("2d");
  if (!probe) {
    return GLYPH_ADVANCE;
  }
  probe.font = `100px ${font}`;
  const advance = probe.measureText("M").width / 100;
  const value =
    Number.isFinite(advance) && advance > 0.3 && advance < 1.2
      ? advance
      : GLYPH_ADVANCE;
  advanceCache.set(font, value);
  return value;
};

export const measureCell = ({
  cell = DEFAULT_CELL,
  font = DEFAULT_FONT,
  dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
  square = false,
}: {
  cell?: number;
  font?: string;
  dpr?: number;
  
  square?: boolean;
} = {}): CellMetrics => {
  const height = Math.max(2, cell);
  const fontSize = height / LINE_HEIGHT;
  const width = square ? height : fontSize * measureAdvance(font);
  const deviceHeight = Math.max(1, Math.round(height * dpr));
  const deviceWidth = Math.max(1, Math.round(width * dpr));
  return {
    deviceHeight,
    deviceWidth,
    dpr,
    font,
    fontSize,
    height: deviceHeight / dpr,
    width: deviceWidth / dpr,
  };
};

export const gridSize = (
  metrics: CellMetrics,
  boxWidth: number,
  boxHeight: number
): { columns: number; rows: number } => ({
  columns: Math.max(1, Math.ceil(boxWidth / metrics.width)),
  rows: Math.max(1, Math.ceil(boxHeight / metrics.height)),
});

export const readCell = (el?: Element | null): number => {
  if (typeof document === "undefined") {
    return DEFAULT_CELL;
  }
  const host = el ?? document.documentElement;
  const value = Number.parseFloat(
    getComputedStyle(host).getPropertyValue("--ascii-cell")
  );
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_CELL;
};

export const readFont = (el?: Element | null): string => {
  if (typeof document === "undefined") {
    return DEFAULT_FONT;
  }
  const host = el ?? document.documentElement;
  const value = getComputedStyle(host).getPropertyValue("--ascii-font").trim();
  return value === "" ? DEFAULT_FONT : value;
};

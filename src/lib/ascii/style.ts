import type { CSSProperties } from "react";

import { BRAILLE_BASE } from "@/lib/ascii/charsets";
import { fillGlyphShape, shapePath } from "@/lib/ascii/glyphs";
import { getThresholdMap } from "@/lib/ascii/matrices";
import type { DitherMatrix } from "@/lib/ascii/matrices";
import { DEFAULT_FONT, GLYPH_ADVANCE, LINE_HEIGHT } from "@/lib/ascii/measure";
import { cssColor } from "@/lib/ascii/tokens";
import type { AsciiColor, AsciiColorName } from "@/lib/ascii/tokens";

export const FILL_TEXTURES = [
  "shade",
  "ascii",
  "braille",
  "blocks",
  "dots",
  "hatch",
  "solid",
] as const;
export type FillTexture = (typeof FILL_TEXTURES)[number];

export const FILL_ALIASES = {
  dotted: "dots",
  gradient: "shade",
  hatched: "hatch",
} as const satisfies Record<string, FillTexture>;
export type FillAlias = keyof typeof FILL_ALIASES;

export const FILL_VARIANTS = [
  "gradient",
  "dotted",
  "hatched",
  "solid",
] as const;
export type FillVariant = (typeof FILL_VARIANTS)[number];

export type FillName = FillTexture | FillAlias;

export type RampTexture = Exclude<FillTexture, "hatch" | "solid">;

const isFillAlias = (variant: string): variant is FillAlias =>
  Object.hasOwn(FILL_ALIASES, variant);

export const fillTexture = (variant: FillName): FillTexture =>
  isFillAlias(variant) ? FILL_ALIASES[variant] : variant;

export const isRampTexture = (texture: FillTexture): texture is RampTexture =>
  texture !== "hatch" && texture !== "solid";

export const DOTTED_LEVEL = 0.3;

export type FillEdge = "top" | "bottom" | "left" | "right";

export const BLOOMS = ["off", "low", "high"] as const;
export type Bloom = (typeof BLOOMS)[number];

export const SERIES_COLORS = [
  "ink",
  "orange",
  "green",
  "pink",
  "purple",
  "blue",
  "red",
  "grey",
] as const satisfies readonly [AsciiColorName, ...AsciiColorName[]];

export const seriesColor = (color: AsciiColor | undefined, index: number) =>
  color ?? SERIES_COLORS[index % SERIES_COLORS.length] ?? "ink";

export const CELL_ASPECT = GLYPH_ADVANCE / LINE_HEIGHT;

export interface GlyphRamp {
  readonly glyphs: readonly string[];
  readonly levels: readonly number[];
}

const evenly = (glyphs: readonly string[]): GlyphRamp => ({
  glyphs,
  levels: glyphs.map((_, index) => index / Math.max(1, glyphs.length - 1)),
});

const BRAILLE_STEPS = [0, 2, 34, 42, 106, 107, 235, 251, 255].map((mask) =>
  String.fromCodePoint(BRAILLE_BASE + mask)
);

export const GLYPH_RAMPS = {
  ascii: evenly([..." .:-=+*#"]),
  blocks: { glyphs: [..." ▘▚▛█"], levels: [0, 0.25, 0.5, 0.75, 1] },
  braille: evenly(BRAILLE_STEPS),
  dots: { glyphs: [..." ·•●"], levels: [0, 0.12, 0.38, 1] },
  shade: { glyphs: [..." ·░▒▓█"], levels: [0, 0.06, 0.25, 0.5, 0.75, 1] },
} as const satisfies Record<RampTexture, GlyphRamp>;

export type FillGlyphs = RampTexture | (string & {});

const isRampName = (value: string): value is RampTexture =>
  Object.hasOwn(GLYPH_RAMPS, value);

export const glyphRamp = (glyphs: FillGlyphs = "shade"): GlyphRamp => {
  if (isRampName(glyphs)) {
    return GLYPH_RAMPS[glyphs];
  }
  const custom = [...glyphs];
  return custom.length >= 2 ? evenly(custom) : GLYPH_RAMPS.shade;
};

export const rampGlyph = (
  ramp: GlyphRamp,
  level: number,
  threshold = 0.5
): string => {
  const { glyphs, levels } = ramp;
  const clamped = level > 0 ? Math.min(level, 1) : 0;
  for (let index = 1; index < levels.length; index += 1) {
    const high = levels[index] ?? 1;
    if (clamped <= high) {
      const low = levels[index - 1] ?? 0;
      const share = high > low ? (clamped - low) / (high - low) : 1;
      return glyphs[share > threshold ? index : index - 1] ?? " ";
    }
  }
  return glyphs.at(-1) ?? " ";
};

export interface GlyphTile {
  readonly columns: number;
  readonly rows: number;
  readonly glyphs: readonly string[];
}

const tileCache = new Map<string, GlyphTile>();

const cached = (key: string, build: () => GlyphTile): GlyphTile => {
  const hit = tileCache.get(key);
  if (hit !== undefined) {
    return hit;
  }
  const tile = build();
  tileCache.set(key, tile);
  return tile;
};

export const levelTile = (
  level: number,
  {
    glyphs = "shade",
    matrix = "bayer4",
  }: { glyphs?: FillGlyphs; matrix?: DitherMatrix } = {}
): GlyphTile =>
  cached(`level:${glyphs}:${matrix}:${level}`, () => {
    const ramp = glyphRamp(glyphs);
    const { size, thresholds } = getThresholdMap(matrix);
    const cells = Array.from({ length: size * size }, (_, index) =>
      rampGlyph(ramp, level, thresholds[index] ?? 0.5)
    );
    return cells.every((glyph) => glyph === cells[0])
      ? { columns: 1, glyphs: [cells[0] ?? " "], rows: 1 }
      : { columns: size, glyphs: cells, rows: size };
  });

export interface RampOptions {
  
  edge: FillEdge;
  
  length: number;
  
  extent?: number;
  
  from: number;
  
  to: number;
  
  matrix?: DitherMatrix;
  
  glyphs?: FillGlyphs;
}

export const edgeTile = ({
  edge,
  length,
  extent = length,
  from,
  to,
  matrix = "bayer4",
  glyphs = "shade",
}: RampOptions): GlyphTile =>
  cached(
    `edge:${edge}:${length}:${extent}:${from}:${to}:${matrix}:${glyphs}`,
    () => {
      const ramp = glyphRamp(glyphs);
      const { size, thresholds } = getThresholdMap(matrix);
      const fade = Math.max(1, Math.round(length));
      const along = Math.ceil(Math.max(fade, extent) / size) * size;
      const vertical = edge === "top" || edge === "bottom";
      const columns = vertical ? size : along;
      const rows = vertical ? along : size;
      const levelAt = (index: number) => {
        const step =
          edge === "top" || edge === "left" ? index : along - 1 - index;
        return step >= fade ? to : from + (to - from) * ((step + 0.5) / fade);
      };
      const cells: string[] = [];
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < columns; x += 1) {
          cells.push(
            rampGlyph(
              ramp,
              levelAt(vertical ? y : x),
              thresholds[(y % size) * size + (x % size)] ?? 0.5
            )
          );
        }
      }
      return { columns, glyphs: cells, rows };
    }
  );

export const HATCH_TILE: GlyphTile = { columns: 1, glyphs: ["╱"], rows: 1 };

export interface TileText {
  readonly glyph: string;
  readonly x: number;
  readonly y: number;
}

export interface TileDrawing {
  
  readonly path: string;
  
  readonly text: readonly TileText[];
  readonly width: number;
  readonly height: number;
}

export const drawTile = (
  tile: GlyphTile,
  cellWidth: number,
  cellHeight: number
): TileDrawing => {
  let path = "";
  const text: TileText[] = [];
  for (const [index, glyph] of tile.glyphs.entries()) {
    if (glyph === " ") {
      continue;
    }
    const x = (index % tile.columns) * cellWidth;
    const y = Math.floor(index / tile.columns) * cellHeight;
    const shape = fillGlyphShape(glyph);
    if (shape === undefined) {
      text.push({ glyph, x, y });
    } else {
      path += shapePath(shape, { height: cellHeight, width: cellWidth, x, y });
    }
  }
  return {
    height: tile.rows * cellHeight,
    path,
    text,
    width: tile.columns * cellWidth,
  };
};

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");

const UNIT_HEIGHT = 12;
const UNIT_WIDTH = UNIT_HEIGHT * CELL_ASPECT;

export const tileSvg = (
  tile: GlyphTile,
  {
    cellWidth = UNIT_WIDTH,
    cellHeight = UNIT_HEIGHT,
    size,
  }: {
    cellWidth?: number;
    cellHeight?: number;
    
    size?: { width: number; height: number };
  } = {}
): string => {
  const drawing = drawTile(tile, cellWidth, cellHeight);
  const dimensions =
    size === undefined
      ? ""
      : ` width="${size.width}" height="${size.height}" preserveAspectRatio="none"`;
  const text = drawing.text
    .map(
      ({ glyph, x, y }) =>
        `<text x="${x + cellWidth / 2}" y="${y + cellHeight / 2}">${escapeXml(glyph)}</text>`
    )
    .join("");
  const font =
    drawing.text.length === 0
      ? ""
      : `<style>text{font:${cellHeight / LINE_HEIGHT}px ${escapeXml(DEFAULT_FONT)};text-anchor:middle;dominant-baseline:central}</style>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${drawing.width} ${drawing.height}"${dimensions}>${font}<path d="${drawing.path}"/>${text}</svg>`;
};

export const svgUrl = (svg: string): string =>
  `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

export const tileUrl = (tile: GlyphTile): string => svgUrl(tileSvg(tile));

const times = (cell: number | string, count: number) =>
  typeof cell === "number"
    ? `${Math.round(cell * count * 1000) / 1000}px`
    : `calc(${cell} * ${Math.round(count * 1000) / 1000})`;

export const tileSize = (tile: GlyphTile, cell: number | string): string =>
  `${times(cell, tile.columns * CELL_ASPECT)} ${times(cell, tile.rows)}`;

export interface FillTile {
  
  size: number;
  
  path: string;
  
  tile: GlyphTile;
}

export const fillTile = (
  variant: "dotted" | "hatched" | "dots" | "hatch"
): FillTile => {
  const tile =
    variant === "hatch" || variant === "hatched"
      ? HATCH_TILE
      : levelTile(DOTTED_LEVEL, { glyphs: "dots" });
  return {
    path: drawTile(tile, 1, 1).path,
    size: Math.max(tile.columns, tile.rows),
    tile,
  };
};

export interface RampTile {
  
  width: number;
  
  height: number;
  
  path: string;
  
  tile: GlyphTile;
}

export const asciiRamp = (options: RampOptions): RampTile => {
  const tile = edgeTile(options);
  return {
    height: tile.rows,
    path: drawTile(tile, 1, 1).path,
    tile,
    width: tile.columns,
  };
};

const EDGE_POSITION = {
  bottom: "left bottom",
  left: "left top",
  right: "right top",
  top: "left top",
} as const satisfies Record<FillEdge, string>;

export interface FillStyleOptions {
  
  color?: AsciiColor;
  
  cell?: number | string;
  
  level?: number;
  
  chars?: string;
  
  edge?: FillEdge;
  
  length?: number;
  
  from?: number;
  
  to?: number;
  
  matrix?: DitherMatrix;
}

const maskStyle = (
  layers: readonly {
    image: string;
    size: string;
    position?: string;
    repeat?: string;
  }[],
  composite?: readonly ("add" | "subtract")[]
): CSSProperties => {
  const join = (pick: (layer: (typeof layers)[number]) => string) =>
    layers.map(pick).join(", ");
  const image = join((layer) => layer.image);
  const size = join((layer) => layer.size);
  const position = join((layer) => layer.position ?? "left top");
  const repeat = join((layer) => layer.repeat ?? "repeat");
  const style: CSSProperties = {
    WebkitMaskImage: image,
    WebkitMaskPosition: position,
    WebkitMaskRepeat: repeat,
    WebkitMaskSize: size,
    maskImage: image,
    maskPosition: position,
    maskRepeat: repeat,
    maskSize: size,
  };
  if (composite !== undefined) {
    style.maskComposite = composite.join(", ");
    style.WebkitMaskComposite = composite
      .map((op) => (op === "add" ? "source-over" : "source-out"))
      .join(", ");
  }
  return style;
};

export const levelMaskStyle = (
  level: number,
  {
    cell = "var(--ascii-cell)",
    glyphs = "shade",
    matrix = "bayer4",
  }: { cell?: number | string; glyphs?: FillGlyphs; matrix?: DitherMatrix } = {}
): CSSProperties => {
  const tile = levelTile(level, { glyphs, matrix });
  return maskStyle([{ image: tileUrl(tile), size: tileSize(tile, cell) }]);
};

export const fillStyle = (
  variant: FillName,
  {
    color = "ink",
    cell = "var(--ascii-cell)",
    level,
    chars,
    edge = "bottom",
    length = 24,
    from = 1,
    to = 0.06,
    matrix = "bayer4",
  }: FillStyleOptions = {}
): CSSProperties => {
  const backgroundColor = cssColor(color);
  const texture = fillTexture(variant);
  if (texture === "solid") {
    return { backgroundColor };
  }
  if (texture === "hatch") {
    return {
      backgroundColor,
      ...maskStyle([
        { image: tileUrl(HATCH_TILE), size: tileSize(HATCH_TILE, cell) },
      ]),
    };
  }
  const glyphs = chars ?? texture;
  const even = variant === "dotted" ? (level ?? DOTTED_LEVEL) : level;
  if (even !== undefined) {
    return {
      backgroundColor,
      ...levelMaskStyle(even, { cell, glyphs, matrix }),
    };
  }
  const ramp = edgeTile({ edge, from, glyphs, length, matrix, to });
  const vertical = edge === "top" || edge === "bottom";
  const rampLayer = {
    image: tileUrl(ramp),
    position: EDGE_POSITION[edge],
    repeat: vertical ? "repeat-x" : "repeat-y",
    size: tileSize(ramp, cell),
  };
  const floor = levelTile(to, { glyphs, matrix });
  if (floor.glyphs.every((glyph) => glyph === " ")) {
    return { backgroundColor, ...maskStyle([rampLayer]) };
  }

  const reach = vertical
    ? `100% ${times(cell, ramp.rows)}`
    : `${times(cell, ramp.columns * CELL_ASPECT)} 100%`;
  return {
    backgroundColor,
    ...maskStyle(
      [
        rampLayer,
        {
          image: tileUrl(floor),
          position: EDGE_POSITION[edge],
          size: tileSize(floor, cell),
        },
        {
          image: "linear-gradient(#000, #000)",
          position: EDGE_POSITION[edge],
          repeat: "no-repeat",
          size: reach,
        },
      ],
      ["add", "subtract", "add"]
    ),
  };
};

export const BLOOM_LEVELS = {
  high: { blur: 18, strength: 0.55 },
  low: { blur: 10, strength: 0.3 },
} as const satisfies Record<
  Exclude<Bloom, "off">,
  { blur: number; strength: number }
>;

export const GLOW_VAR = "var(--ascii-glow, var(--ascii-bloom, 1))";

export const bloomLayerStyle = (bloom: Bloom): CSSProperties | undefined => {
  if (bloom === "off") {
    return undefined;
  }
  const { blur, strength } = BLOOM_LEVELS[bloom];
  return {
    filter: `blur(${blur}px)`,
    opacity: `calc(${GLOW_VAR} * ${strength})`,
  };
};

export const bloomFilter = (
  color: AsciiColor,
  bloom: Bloom
): string | undefined => {
  if (bloom === "off") {
    return undefined;
  }
  const { blur, strength } = BLOOM_LEVELS[bloom];
  const tint = (share: number) =>
    `color-mix(in oklab, ${cssColor(color)} calc(${GLOW_VAR} * ${Math.round(share * 100)}%), transparent)`;
  return `drop-shadow(0 0 ${Math.round(blur / 4)}px ${tint(strength * 1.5)}) drop-shadow(0 0 ${blur}px ${tint(strength)})`;
};

export const bloomStyle = (color: AsciiColor, bloom: Bloom): CSSProperties => {
  const filter = bloomFilter(color, bloom);
  return filter === undefined ? {} : { filter };
};

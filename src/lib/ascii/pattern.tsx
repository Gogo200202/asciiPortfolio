import type { CSSProperties } from "react";

import type { DitherMatrix } from "@/lib/ascii/matrices";
import { DEFAULT_CELL, LINE_HEIGHT } from "@/lib/ascii/measure";
import {
  CELL_ASPECT,
  drawTile,
  levelMaskStyle,
  levelTile,
  tileSvg,
  svgUrl,
} from "@/lib/ascii/style";
import type { FillGlyphs, GlyphTile } from "@/lib/ascii/style";
import { cssColor } from "@/lib/ascii/tokens";
import type { AsciiColor } from "@/lib/ascii/tokens";

export const asciiPath = (
  level: number,
  matrix: DitherMatrix = "bayer4",
  glyphs: FillGlyphs = "shade"
): string => drawTile(levelTile(level, { glyphs, matrix }), 1, 1).path;

export interface AsciiMaskOptions {
  
  matrix?: DitherMatrix;
  
  glyphs?: FillGlyphs;
  
  cell?: number;
}

export const asciiMask = (
  level: number,
  { matrix = "bayer4", glyphs = "shade", cell }: AsciiMaskOptions = {}
): string => {
  const tile = levelTile(level, { glyphs, matrix });
  return svgUrl(
    tileSvg(
      tile,
      cell === undefined
        ? {}
        : {
            size: {
              height: tile.rows * cell,
              width: tile.columns * cell * CELL_ASPECT,
            },
          }
    )
  );
};

export interface AsciiMaskStyleOptions {
  
  matrix?: DitherMatrix;
  
  glyphs?: FillGlyphs;
  
  cell?: number | string;
}

export const asciiMaskStyle = (
  level: number,
  {
    matrix = "bayer4",
    glyphs = "shade",
    cell = "var(--ascii-cell)",
  }: AsciiMaskStyleOptions = {}
): CSSProperties => levelMaskStyle(level, { cell, glyphs, matrix });

export interface TileGlyphsProps {
  
  tile: GlyphTile;
  
  cellWidth: number;
  
  cellHeight: number;
  
  fill: string;
}

export const TileGlyphs = ({
  tile,
  cellWidth,
  cellHeight,
  fill,
}: TileGlyphsProps) => {
  const drawing = drawTile(tile, cellWidth, cellHeight);
  return (
    <>
      {drawing.path === "" ? null : <path d={drawing.path} style={{ fill }} />}
      {drawing.text.map(({ glyph, x, y }) => (
        <text
          key={`${x}:${y}`}
          x={x + cellWidth / 2}
          y={y + cellHeight / 2}
          textAnchor="middle"
          dominantBaseline="central"
          style={{
            fill,
            fontFamily: "var(--ascii-font, ui-monospace, monospace)",
            fontSize: cellHeight / LINE_HEIGHT,
          }}
        >
          {glyph}
        </text>
      ))}
    </>
  );
};

export interface AsciiPatternProps {
  
  id: string;
  
  level: number;
  
  matrix?: DitherMatrix;
  
  glyphs?: FillGlyphs;
  
  cell?: number;
  
  aspect?: number;
  
  color?: AsciiColor;
  
  background?: AsciiColor;
}

export const AsciiPattern = ({
  id,
  level,
  matrix = "bayer4",
  glyphs = "shade",
  cell = DEFAULT_CELL,
  aspect = CELL_ASPECT,
  color = "--ascii-ink",
  background,
}: AsciiPatternProps) => {
  const tile = levelTile(level, { glyphs, matrix });
  const cellWidth = cell * aspect;
  const width = tile.columns * cellWidth;
  const height = tile.rows * cell;
  return (
    <pattern
      id={id}
      width={width}
      height={height}
      patternUnits="userSpaceOnUse"
    >
      {background === undefined ? null : (
        <rect
          width={width}
          height={height}
          style={{ fill: cssColor(background) }}
        />
      )}
      <TileGlyphs
        tile={tile}
        cellWidth={cellWidth}
        cellHeight={cell}
        fill={cssColor(color)}
      />
    </pattern>
  );
};

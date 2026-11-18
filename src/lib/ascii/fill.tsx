import type { ComponentProps } from "react";

import type { DitherMatrix } from "@/lib/ascii/matrices";
import { DEFAULT_CELL } from "@/lib/ascii/measure";
import { AsciiPattern, TileGlyphs } from "@/lib/ascii/pattern";
import {
  bloomFilter,
  bloomLayerStyle,
  CELL_ASPECT,
  DOTTED_LEVEL,
  edgeTile,
  fillTexture,
  HATCH_TILE,
} from "@/lib/ascii/style";
import type { Bloom, FillEdge, FillName } from "@/lib/ascii/style";
import { cssColor } from "@/lib/ascii/tokens";
import type { AsciiColor } from "@/lib/ascii/tokens";

export interface FillRamp {
  
  edge: FillEdge;
  
  at: number;
  
  length: number;
  
  extent?: number;
}

export interface FillPatternProps {
  
  id: string;
  
  fill: FillName;
  
  color?: AsciiColor;
  
  cell?: number;
  
  aspect?: number;
  
  chars?: string;
  
  level?: number;
  
  floor?: number;
  
  matrix?: DitherMatrix;
  
  ramp?: FillRamp;
}

export const FillPattern = ({
  id,
  fill,
  color = "ink",
  cell = DEFAULT_CELL,
  aspect = CELL_ASPECT,
  chars,
  level = 1,
  floor = 0.06,
  matrix = "bayer4",
  ramp,
}: FillPatternProps) => {
  const ink = cssColor(color);
  const cellWidth = cell * aspect;
  const texture = fillTexture(fill);
  if (texture === "solid") {
    return (
      <pattern
        id={id}
        width={cellWidth}
        height={cell}
        patternUnits="userSpaceOnUse"
      >
        <rect width={cellWidth} height={cell} style={{ fill: ink }} />
      </pattern>
    );
  }
  if (texture === "hatch") {
    return (
      <pattern
        id={id}
        width={cellWidth}
        height={cell}
        patternUnits="userSpaceOnUse"
      >
        <TileGlyphs
          tile={HATCH_TILE}
          cellWidth={cellWidth}
          cellHeight={cell}
          fill={ink}
        />
      </pattern>
    );
  }
  const glyphs = chars ?? texture;
  if (ramp === undefined || fill === "dotted") {
    return (
      <AsciiPattern
        id={id}
        level={fill === "dotted" ? DOTTED_LEVEL : level}
        matrix={matrix}
        glyphs={glyphs}
        cell={cell}
        aspect={aspect}
        color={color}
      />
    );
  }
  const tile = edgeTile({
    edge: ramp.edge,
    extent:
      ramp.edge === "top" || ramp.edge === "bottom"
        ? (ramp.extent ?? ramp.length) / cell
        : (ramp.extent ?? ramp.length) / cellWidth,
    from: level,
    glyphs,
    length:
      ramp.edge === "top" || ramp.edge === "bottom"
        ? ramp.length / cell
        : ramp.length / cellWidth,
    matrix,
    to: floor,
  });
  const width = tile.columns * cellWidth;
  const height = tile.rows * cell;
  const origin = {
    bottom: { x: 0, y: ramp.at - height },
    left: { x: ramp.at, y: 0 },
    right: { x: ramp.at - width, y: 0 },
    top: { x: 0, y: ramp.at },
  }[ramp.edge];
  return (
    <pattern
      id={id}
      x={origin.x}
      y={origin.y}
      width={width}
      height={height}
      patternUnits="userSpaceOnUse"
    >
      <TileGlyphs
        tile={tile}
        cellWidth={cellWidth}
        cellHeight={cell}
        fill={ink}
      />
    </pattern>
  );
};

export interface BloomGroupProps extends ComponentProps<"g"> {
  bloom: Bloom;
}

export const BloomGroup = ({ bloom, style, ...props }: BloomGroupProps) => {
  const layer = bloomLayerStyle(bloom);
  return layer === undefined ? null : (
    <g aria-hidden="true" {...props} style={{ ...layer, ...style }} />
  );
};

export type BloomBoxProps = ComponentProps<"div"> & {
  
  color?: AsciiColor;
  bloom: Bloom;
};

export const BloomBox = ({
  color = "ink",
  bloom,
  style,
  ...props
}: BloomBoxProps) => (
  <div {...props} style={{ filter: bloomFilter(color, bloom), ...style }} />
);

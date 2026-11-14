import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { play } from "ascii-magic-art/runtime/player.js";
import * as piece from "ascii-magic-art/pieces/double-line-frame.js";

function FrameStrip() {
  const ref = useRef(null);

  useEffect(() => play(ref.current, piece), []);

  return (
    <Box
      component="pre"
      ref={ref}
      aria-hidden="true"
      sx={{ m: 0, fontSize: "1vw" }}
    />
  );
}

function AsciiFrame({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        "& canvas": {
          display: "block",
          width: "100% !important",
          height: "auto !important",
        },
      }}
    >
      <FrameStrip />
      {children}
      <FrameStrip />
    </Box>
  );
}

export default AsciiFrame;

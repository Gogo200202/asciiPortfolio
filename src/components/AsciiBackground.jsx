import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { play } from "ascii-magic-art/runtime/player.js";
import * as piece from "ascii-magic-art/pieces/harbour-neon-skyline.js";

function AsciiBackground() {
  const ref = useRef(null);

  useEffect(
    () => play(ref.current, piece, { look: { look: "squares", gamma: 2 } }),
    [],
  );

  return (
    <Box
      sx={{
        inset: "10vh 0 20px 0",
        overflow: "hidden",

        "& canvas": {
          top: 0,
          left: 0,
          width: "100% !important",
          height: "100% !important",
          maxWidth: "none !important",
          objectFit: "cover",
        },
      }}
    >
      <Box
        component="pre"
        ref={ref}
        aria-hidden="true"
        sx={{ m: 0, fontSize: "1vw" }}
      />
    </Box>
  );
}

export default AsciiBackground;

import { useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import { play } from "ascii-magic-art/runtime/player.js";
import * as piece from "ascii-magic-art/pieces/boot-sequence.js";

function LoadingScreen() {
  const ref = useRef(null);

  useEffect(
    () =>
      play(ref.current, piece, {
        look: { look: "squares", gamma: 1.15 },
        speed: 5,
      }),
    [],
  );

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "& canvas": {
          width: "60% !important",
          height: "auto !important",
        },
      }}
    >
      <Box
        component="pre"
        ref={ref}
        aria-hidden="true"
        sx={{ m: 0, fontSize: "2vw" }}
      />
    </Box>
  );
}

export default LoadingScreen;

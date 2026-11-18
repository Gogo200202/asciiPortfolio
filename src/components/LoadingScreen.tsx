import Box from "@mui/material/Box";
import { Ascii } from "ascii.rest/react";

import * as bootLog from "@/lib/boot-log";

function LoadingScreen() {
  return (
    <Box
      className="dark"
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#000000",
        zIndex: 50,
        "& pre": {
          m: 0,
          color: "#ffffff",
          fontFamily: "var(--font-mono)",
          fontSize: "clamp(8px, 1.5vw, 21px)",
          lineHeight: 1.1,
        },
      }}
    >
      <Ascii
        piece={bootLog}
        label="My portfolio booting up: a self test, then work, education, projects and skills loading."
      />
    </Box>
  );
}

export default LoadingScreen;

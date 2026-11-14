import Box from "@mui/material/Box";

import { Ascii } from "ascii.rest/react";
import { scramble } from "ascii.rest/pieces";

function Header() {
  return (
    <Box
      sx={{
        top: 0,
        left: 0,
        right: 0,
        height: "10vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1,
        background:
          "radial-gradient(ellipse 55% 130% at 50% 50%, color-mix(in oklab, var(--background) 82%, transparent) 0%, color-mix(in oklab, var(--background) 45%, transparent) 58%, transparent 100%)",
      }}
    >
      <Ascii
        piece={scramble}
        label="Hi, I'm Georgi Angelov. This is my ASCII portfolio."
        style={{ fontSize: "min(3.6vw, 3.2vh)", lineHeight: 1 }}
        options={{
          phrases: [
            "Hi, im Georgi Angelov",
            "This is my portfolio",
            "I hope you like it",
            "See you on the flip side",
          ],
        }}
      />
    </Box>
  );
}

export default Header;

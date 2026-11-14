import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { Ascii } from "ascii.rest/react";
import { scramble } from "ascii.rest/pieces";

// The scramble piece is 44 columns wide with its phrase centred. The box
// below shows the middle 25 columns, so the phrase is as large as the left
// column allows instead of being squeezed by the empty padding.
const HEADER_FONT = "clamp(1.25rem, 4vw, 3rem)";

function Header() {
  return (
    <Box component="header" sx={{ minWidth: 0, textAlign: "left" }}>
      <Typography
        id="home-heading"
        component="h1"
        sx={{
          position: "absolute",
          width: "1px",
          height: "1px",
          p: 0,
          m: "-1px",
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        Hi, I'm Georgi Angelov
      </Typography>
      <Box
        aria-hidden="true"
        sx={{
          width: "min(100%, 25ch)",
          overflow: "hidden",
          fontSize: HEADER_FONT,
          lineHeight: 1.05,
        }}
      >
        <Ascii
          piece={scramble}
          label="Hi, I'm Georgi Angelov. This is my ASCII portfolio."
          style={{
            fontSize: HEADER_FONT,
            lineHeight: 1.05,
            margin: 0,
            width: "max-content",
            transform: "translateX(-10ch)",
          }}
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
    </Box>
  );
}

export default Header;

import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { Box, CssBaseline, IconButton, ThemeProvider, createTheme } from "@mui/material";

import App from "./App.jsx";

function Root() {
  const [dark, setDark] = useState(true);

  const theme = createTheme({
    palette: {
      mode: dark ? "dark" : "light",
      background: { default: dark ? "#000000" : "#ffffff" },
    },
    typography: {
      fontFamily: '"ui-monospace", "SFMono-Regular", Menlo, Consolas, monospace',
    },
  });

  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
          <IconButton
            onClick={() => setDark((value) => !value)}
            aria-label={dark ? "switch to light mode" : "switch to dark mode"}
            sx={{ position: "fixed", top: 16, right: 16 }}
          >
            {dark ? "☀" : "☾"}
          </IconButton>
          <App />
        </Box>
      </ThemeProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")).render(<Root />);

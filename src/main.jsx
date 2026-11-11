import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";

import App from "./App.jsx";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#000000" },
  },
  typography: {
    fontFamily: '"ui-monospace", "SFMono-Regular", Menlo, Consolas, monospace',
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
        <App />
      </Box>
    </ThemeProvider>
  </StrictMode>,
);

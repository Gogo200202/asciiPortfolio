import { StrictMode, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Box, CssBaseline, ThemeProvider, createTheme } from "@mui/material";

import App from "./App.jsx";
import "./index.css";

type ColorMode = "light" | "dark";

const preferredMode = (): ColorMode =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const appTheme = (mode: ColorMode) =>
  createTheme({
    palette: {
      mode,
      background: { default: mode === "dark" ? "#0a0a0a" : "#fafafa" },
      primary: { main: mode === "dark" ? "#8ab4f8" : "#1565c0" },
      text: {
        primary: mode === "dark" ? "#f5f5f5" : "#171717",
        secondary: mode === "dark" ? "#a3a3a3" : "#525252",
      },
    },
    typography: {
      fontFamily:
        '"ui-monospace", "SFMono-Regular", Menlo, Consolas, monospace',
    },
  });

function Root() {
  const [mode, setMode] = useState<ColorMode>(preferredMode);

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setMode(query.matches ? "dark" : "light");
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  const theme = useMemo(() => appTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", position: "relative", isolation: "isolate" }}>
        <App />
      </Box>
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

import { Box } from "@mui/material";
import { Banner } from "ascii.rest/react";

function App() {
  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "100vh", px: 2 }}>
      <Banner
        text="PORTFOLIO"
        color={{ light: "#111111", dark: "#e8e8e8" }}
        shadow="rounded"
      />
    </Box>
  );
}

export default App;

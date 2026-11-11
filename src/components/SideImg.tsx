import { Box } from "@mui/material";
import myImage from "../img/my-image.png";

export default function SideImg() {
  return (
    <Box
      component="img"
      src={myImage}
      alt="Side image"
      sx={{
        position: "fixed",
        left: 0,
        top: 0,
        width: "300px",
        height: "100vh",
        objectFit: "cover",
      }}
    />
  );
}

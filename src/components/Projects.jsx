import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";

function ProjectCard({ project }) {
  return (
    <Box
      sx={{
        px: 2,
        pt: 1,
        pb: 2,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Box
        component="img"
        src={project.image}
        alt={project.title}
        loading="lazy"
        sx={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover" }}
      />
      <Typography variant="h6">{project.title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {project.description}
      </Typography>
      <Typography variant="body2">{project.tags.join(" · ")}</Typography>
      <Link href={project.link} target="_blank" variant="body2">
        source ↗
      </Link>
    </Box>
  );
}

function Projects({ projects }) {
  return (
    <Box
      component="main"
      sx={{
        pt: "14vh",
        px: 2,
        pb: 8,
        maxWidth: "lg",
        mx: "auto",
      }}
    >
      <Grid container spacing={4}>
        {projects.map((project) => (
          <Grid key={project.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <ProjectCard project={project} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Projects;

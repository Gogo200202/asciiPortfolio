import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { AsciiTabs } from "./asciicn/ascii-tabs";
import type { AsciiTab } from "./asciicn/ascii-tabs";
import Header from "./Header";
import MyInAscii from "./MyInAscii";

export interface ProjectSource {
  /** Shown on the link row, e.g. the repository name. */
  label: string;
  href: string;
}

export interface Project {
  title: string;
  description: string;
  image: string;
  tags: string[];
  /** Source repositories, one entry per repo. */
  sources: ProjectSource[];
  /** Optional live deployment. */
  demo?: string;
}

const hostOf = (href: string) => {
  try {
    return new URL(href).host;
  } catch {
    return href;
  }
};

function ProjectLink({
  href,
  label,
  meta,
}: {
  href: string;
  label: string;
  meta: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="group flex min-w-0 items-baseline gap-2 rounded-[2px] font-mono text-sm outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring"
    >
      <span
        aria-hidden="true"
        className="text-muted-foreground transition-colors group-hover:text-foreground"
      >
        ↗
      </span>
      <span className="truncate underline-offset-4 group-hover:underline">
        {label}
      </span>
      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
        {meta}
      </span>
    </a>
  );
}

const tabsFor = (project: Project): AsciiTab[] => [
  {
    value: "readme",
    label: "readme",
    content: (
      <div className="min-h-[13.5rem]">
        <img
          src={project.image}
          alt={`${project.title} preview`}
          loading="lazy"
          className="mb-3 h-auto w-full rounded-[2px] border border-border/60"
        />
        <p className="text-[13px] leading-6 text-muted-foreground">
          {project.description}
        </p>
        <p className="mt-3 font-mono text-[11px] leading-5 text-muted-foreground">
          <span className="text-foreground">stack</span>
          {` · ${project.tags.join(" · ")}`}
        </p>
      </div>
    ),
  },
  {
    value: "links",
    label: "links",
    content: (
      <div className="flex min-h-[13.5rem] flex-col gap-2.5">
        {project.demo ? (
          <ProjectLink
            href={project.demo}
            label="live demo"
            meta={hostOf(project.demo)}
          />
        ) : (
          <p className="font-mono text-[11px] leading-5 text-muted-foreground">
            no live demo — source only
          </p>
        )}
        {project.sources.map((source) => (
          <ProjectLink
            key={source.href}
            href={source.href}
            label={source.label}
            meta={hostOf(source.href)}
          />
        ))}
        <p className="mt-auto font-mono text-[10px] leading-4 text-muted-foreground">
          opens in a new tab
        </p>
      </div>
    ),
  },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-sm bg-background/80 p-3 backdrop-blur-[2px]">
      <div className="mb-1 flex items-baseline justify-between gap-3 px-1 font-mono">
        <h3 className="truncate text-sm font-medium text-foreground">
          {project.title}
        </h3>
        <span className="shrink-0 text-[10px] tabular-nums tracking-[0.16em] text-muted-foreground">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <AsciiTabs
        tabs={tabsFor(project)}
        label={`${project.title} details`}
        size="lg"
      />
    </article>
  );
}

function Projects({ projects }: { projects: Project[] }) {
  const repoCount = projects.reduce(
    (count, project) => count + project.sources.length,
    0
  );

  return (
    <Box component="main" sx={{ pb: 8 }}>
      <Box
        component="section"
        aria-labelledby="home-heading"
        sx={{
          minHeight: "100svh",
          width: "100%",
          maxWidth: "lg",
          mx: "auto",
          px: 2,
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "minmax(0, 1.2fr) minmax(0, 0.8fr)",
          },
          alignItems: "center",
          columnGap: { md: 3, lg: 4 },
          rowGap: { xs: 5, md: 4 },
        }}
      >
        <Box sx={{ order: 1, minWidth: 0 }}>
          <Header />
        </Box>

        <Box
          sx={{
            order: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "center", md: "flex-end" },
            gap: { xs: 2, md: 2.5 },
            minWidth: 0,
          }}
        >
          <Typography
            component="p"
            variant="overline"
            sx={{ fontFamily: "var(--font-mono)", color: "text.secondary" }}
          >
            me
          </Typography>
          <Box sx={{ width: "100%", maxWidth: { xs: 400, md: 440 } }}>
            <MyInAscii />
          </Box>
        </Box>
      </Box>

      <Box
        component="section"
        aria-labelledby="projects-heading"
        sx={{
          px: 2,
          pt: { xs: 8, md: 10 },
          maxWidth: "lg",
          mx: "auto",
        }}
      >
        <div className="mb-6 flex items-baseline justify-between gap-4 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          <h2 id="projects-heading">projects</h2>
          <span>{String(repoCount).padStart(2, "0")} repos</span>
        </div>

        <Grid container spacing={4}>
          {projects.map((project, index) => (
            <Grid key={project.title} size={{ xs: 12, md: 6, lg: 4 }}>
              <ProjectCard project={project} index={index} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}

export default Projects;

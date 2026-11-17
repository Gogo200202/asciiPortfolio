"use client";

import Box from "@mui/material/Box";

import { ScrambleText } from "./asciicn/scramble-text";

const CHANNELS = [
  {
    label: "linkedin",
    href: "https://www.linkedin.com/in/georgi-angelov-42b720255/",
    value: "linkedin.com/in/georgi-angelov-42b720255",
  },
  {
    label: "github",
    href: "https://github.com/Gogo200202",
    value: "github.com/Gogo200202",
  },
  {
    label: "leetcode",
    href: "https://leetcode.com/u/Gogo200202/",
    value: "leetcode.com/u/Gogo200202",
  },
  {
    label: "email",
    href: "mailto:georgiangelovwork2002@gmail.com",
    value: "georgiangelovwork2002@gmail.com",
  },
] as const;

function Contact() {
  return (
    <Box
      component="footer"
      aria-labelledby="contact-heading"
      sx={{
        minHeight: "100svh",
        width: "100%",
        px: 2,
        py: 6,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="mx-auto mb-4 flex w-full items-baseline justify-between gap-4 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        <h2 id="contact-heading">contact</h2>
        <span>04 channels</span>
      </div>

      <div className="mx-auto flex w-full min-w-0 flex-1 flex-col justify-center overflow-hidden rounded-sm border border-border/60 bg-background/80 p-4 backdrop-blur-[2px] sm:p-6">
        <p className="font-mono text-[11px] tracking-[0.12em] text-muted-foreground sm:text-xs">
          <span style={{ color: "var(--ascii-color-blue)" }}>$</span>{" "}
          cat ~/contact.txt
        </p>

        <ul className="flex flex-col gap-5 py-8 font-mono sm:gap-8">
          {CHANNELS.map((channel, index) => (
            <li key={channel.label}>
              <a
                href={channel.href}
                target={channel.label === "email" ? undefined : "_blank"}
                rel={channel.label === "email" ? undefined : "noopener noreferrer"}
                className="group flex min-w-0 flex-col gap-1 rounded-[2px] outline-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-solid focus-visible:outline-ring sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <ScrambleText
                  as="h3"
                  glyphs="katakana"
                  trigger="view"
                  color="green"
                  duration={0.5}
                  stagger={0.035}
                  delay={index * 0.08}
                  className="text-3xl font-bold tracking-tight text-foreground group-hover:text-[var(--ascii-color-green)] sm:text-5xl lg:text-6xl"
                >
                  {channel.label}
                </ScrambleText>
                <ScrambleText
                  glyphs="binary"
                  trigger="view"
                  color="blue"
                  duration={0.35}
                  stagger={0.006}
                  delay={index * 0.08 + 0.2}
                  className="min-w-0 break-all text-left text-sm text-muted-foreground group-hover:text-foreground sm:text-right sm:text-base"
                >
                  {channel.value}
                </ScrambleText>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Box>
  );
}

export default Contact;

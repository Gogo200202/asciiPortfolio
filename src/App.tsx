import { useEffect, useState } from "react";
import CanvasBackdrop from "./components/CanvasBackdrop.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import Projects from "./components/Projects.jsx";

const LOAD_TIME = 1000;

const projects = [
  {
    title: "catedra-university",
    description:
      "University department site with a role-aware React 19 front end; the Express/MongoDB API with JWT auth and student, teacher and admin accounts lives in the back-end repo.",
    image: `${import.meta.env.BASE_URL}img/projects/catedra.jpg`,
    tags: ["React 19", "TypeScript", "Express", "MongoDB"],
    sources: [
      {
        label: "front end",
        href: "https://github.com/Gogo200202/Catedra-University-front-end",
      },
      {
        label: "back end",
        href: "https://github.com/Gogo200202/Catedra-University-back-end",
      },
    ],
  },
  {
    title: "e-commerce",
    description:
      "Next.js 15 storefront with product pages, search, likes and auth; the Express 5 / MongoDB API with JWT sessions and image uploads lives in the back-end repo.",
    image: `${import.meta.env.BASE_URL}img/projects/e-commerce.jpg`,
    tags: ["Next.js 15", "React 19", "Tailwind", "MongoDB"],
    sources: [
      {
        label: "front end",
        href: "https://github.com/Gogo200202/e-commerce-front-end",
      },
      {
        label: "back end",
        href: "https://github.com/Gogo200202/e-commerce-back-end",
      },
    ],
  },
  {
    title: "product-sell-store",
    description:
      "ASP.NET Core MVC marketplace with Identity roles, EF Core migrations and an NUnit + Moq test suite.",
    image: `${import.meta.env.BASE_URL}img/projects/product-sell-store.jpg`,
    tags: ["C#", ".NET 6", "EF Core", "NUnit"],
    sources: [
      {
        label: "source",
        href: "https://github.com/Gogo200202/ProductSellStore",
      },
    ],
  },
  {
    title: "team-management",
    description:
      "Front-end training project from my previous job: a team and project management dashboard in React and TypeScript, with typed API calls, TanStack Query, MUI layout and a JSON Server backend.",
    image: `${import.meta.env.BASE_URL}img/projects/team-management.jpg`,
    tags: ["React", "TypeScript", "MUI", "TanStack Query"],
    sources: [
      {
        label: "source",
        href: "https://github.com/Gogo200202/team-management",
      },
    ],
  },
  {
    title: "windows-xp-portfolio",
    description:
      "Playable Windows XP desktop in Three.js — raycast clicks open each screen of my résumé.",
    image: `${import.meta.env.BASE_URL}img/projects/windows-xp.jpg`,
    tags: ["Three.js", "React", "WebGL"],
    sources: [
      {
        label: "source",
        href: "https://github.com/Gogo200202/portFolioWindowsXp",
      },
    ],
    demo: "https://gogo200202.github.io/portFolioWindowsXp/",
  },
  {
    title: "music-player",
    description:
      "React music player with a track list, playback and volume controls, plus sign-in and sign-up screens.",
    image: `${import.meta.env.BASE_URL}img/projects/music-player.jpg`,
    tags: ["React", "Tailwind", "Vite"],
    sources: [
      {
        label: "source",
        href: "https://github.com/Gogo200202/MusicPlayerApp",
      },
    ],
    demo: "https://gogo200202.github.io/MusicPlayerApp/",
  },
];

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_TIME);
    return () => clearTimeout(timer);
  }, []);

  return loading ? (
    <LoadingScreen />
  ) : (
    <>
      <CanvasBackdrop />
      <div className="relative z-10">
        <Projects projects={projects} />
      </div>
    </>
  );
}

export default App;

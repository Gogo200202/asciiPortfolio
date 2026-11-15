import { useEffect, useState } from "react";
import CanvasBackdrop from "./components/CanvasBackdrop.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import Projects from "./components/Projects.jsx";

const LOAD_TIME = 1000;

const projects = [
  {
    title: "catedra-university",
    description:
      "University department site with a role-aware React front end and an Express/MongoDB API for paginated news and student, teacher and admin accounts.",
    image: `${import.meta.env.BASE_URL}img/projects/catedra.jpg`,
    tags: ["React 19", "TypeScript", "Express", "MongoDB"],
    link: "https://github.com/Gogo200202/Catedra-University-front-end",
  },
  {
    title: "e-commerce-front-end",
    description:
      "Next.js storefront with product pages, search, likes and auth, backed by an Express 5 / MongoDB API with JWT sessions and image uploads.",
    image: `${import.meta.env.BASE_URL}img/projects/marketplace.jpg`,
    tags: ["Next.js 15", "React 19", "Tailwind", "MongoDB"],
    link: "https://github.com/Gogo200202/e-commerce-front-end",
  },
  {
    title: "product-sell-store",
    description:
      "ASP.NET Core MVC marketplace with Identity roles, EF Core migrations and an NUnit + Moq test suite.",
    image: `${import.meta.env.BASE_URL}img/projects/product-sell-store.jpg`,
    tags: ["C#", ".NET 6", "EF Core", "NUnit"],
    link: "https://github.com/Gogo200202/ProductSellStore",
  },
  {
    title: "video-editor",
    description:
      "Browser video trimmer that loads FFmpeg.wasm to cut clips locally, so no footage ever leaves the page.",
    image: `${import.meta.env.BASE_URL}img/projects/video-editor.jpg`,
    tags: ["React", "TypeScript", "FFmpeg.wasm"],
    link: "https://github.com/Gogo200202/Video-Editor",
  },
  {
    title: "windows-xp-portfolio",
    description:
      "Playable Windows XP desktop in Three.js — raycast clicks open each screen of my résumé.",
    image: `${import.meta.env.BASE_URL}img/projects/windows-xp.jpg`,
    tags: ["Three.js", "React", "WebGL"],
    link: "https://github.com/Gogo200202/portFolioWindowsXp",
    demo: "https://gogo200202.github.io/portFolioWindowsXp/",
  },
  {
    title: "music-player",
    description:
      "React music player with a track list, playback and volume controls, plus sign-in and sign-up screens.",
    image: `${import.meta.env.BASE_URL}img/projects/music-player.jpg`,
    tags: ["React", "Tailwind", "Vite"],
    link: "https://github.com/Gogo200202/MusicPlayerApp",
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

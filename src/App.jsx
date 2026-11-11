import { useEffect, useState } from "react";
import AsciiBackground from "./components/AsciiBackground.jsx";
import Header from "./components/Header.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";
import Projects from "./components/Projects.jsx";

const LOAD_TIME = 1000;

const projects = [
  {
    title: "ascii-weather",
    description:
      "Terminal weather app that renders the forecast as animated ASCII art.",
    image: "https://picsum.photos/seed/weather/480/300?grayscale",
    tags: ["Node.js", "React", "APIs"],
    link: "https://github.com/Gogo200202",
  },
  {
    title: "devshell",
    description:
      "A dotfiles-driven shell setup with a boot menu, themes and prompt.",
    image: "https://picsum.photos/seed/devshell/480/300?grayscale",
    tags: ["Bash", "Zsh", "Tmux"],
    link: "https://github.com/Gogo200202",
  },
  {
    title: "pixel-notes",
    description:
      "Markdown note taker that turns sketches into pixel art thumbnails.",
    image: "https://picsum.photos/seed/pixelnotes/480/300?grayscale",
    tags: ["TypeScript", "Canvas"],
    link: "https://github.com/Gogo200202",
  },
  {
    title: "wireframe-blog",
    description:
      "Static blog generator that ships every post with a wireframe header.",
    image: "https://picsum.photos/seed/wireframe/480/300?grayscale",
    tags: ["Rust", "SSG"],
    link: "https://github.com/Gogo200202",
  },
  {
    title: "orbit-os",
    description: "Tiny fake operating system that boots inside the browser.",
    image: "https://picsum.photos/seed/orbitos/480/300?grayscale",
    tags: ["React", "WASM"],
    link: "https://github.com/Gogo200202",
  },
  {
    title: "packet-sniff",
    description:
      "Live network traffic visualiser that draws packets falling like rain.",
    image: "https://picsum.photos/seed/packets/480/300?grayscale",
    tags: ["Go", "WebSockets"],
    link: "https://github.com/Gogo200202",
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
      <Header />
      <AsciiBackground />
      <Projects projects={projects} />
    </>
  );
}

export default App;

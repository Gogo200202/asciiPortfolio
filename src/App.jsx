import { useEffect, useState } from "react";
import AsciiBackground from "./components/AsciiBackground.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";

const LOAD_TIME = 1000;

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), LOAD_TIME);
    return () => clearTimeout(timer);
  }, []);

  return loading ? <LoadingScreen /> : <AsciiBackground />;
}

export default App;

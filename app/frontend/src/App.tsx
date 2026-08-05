import { Routes, Route, Link } from "react-router-dom";
import Landing from "./pages/Landing.tsx";
import TeamsList from "./pages/TeamsList.tsx";
import Admin from "./pages/Admin.tsx";
import Game from "./pages/Game.tsx";

function NotFound() {
  return (
    <main className="landing">
      <h1 className="landing-title">404</h1>
      <p className="landing-subtitle">Cette page n'existe pas.</p>
      <Link to="/" className="team-submit" style={{ textDecoration: "none", display: "inline-block", marginTop: "1.5rem" }}>
        Accueil
      </Link>
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/equipes" element={<TeamsList />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/jeu" element={<Game />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

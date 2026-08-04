import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing.tsx";
import TeamsList from "./pages/TeamsList.tsx";
import Admin from "./pages/Admin.tsx";
import Game from "./pages/Game.tsx";
import "./App.css";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/equipes" element={<TeamsList />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/jeu" element={<Game />} />
    </Routes>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginScreen } from "./components/Login/LoginScreen";
import { LobbyScreen } from "./components/Lobby/LobbyScreen";
import { PartyScreen } from "./components/Party/PartyScreen";
import { AwardsScreen } from "./components/Results/AwardsScreen";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/lobby" element={<LobbyScreen />} />
        <Route path="/party/:partyId" element={<PartyScreen />} />
        <Route path="/results" element={<AwardsScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

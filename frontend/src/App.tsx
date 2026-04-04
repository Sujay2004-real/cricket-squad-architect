import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import HostSetupScreen from './screens/HostSetupScreen';
import LobbyScreen from './screens/LobbyScreen';
import GameScreen from './screens/GameScreen';
import GameOverScreen from './screens/GameOverScreen';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/host" element={<HostSetupScreen />} />
          <Route path="/lobby/:gameKey" element={<LobbyScreen />} />
          <Route path="/game/:gameKey" element={<GameScreen />} />
          <Route path="/results/:gameKey" element={<GameOverScreen />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

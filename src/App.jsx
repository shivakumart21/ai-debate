import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import DebateArena from './pages/DebateArena';
import DebateHistory from './pages/DebateHistory';

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home', 'arena', 'history'
  const [debateConfig, setDebateConfig] = useState(null);

  const startDebate = (config) => {
    setDebateConfig(config);
    setCurrentView('arena');
  };

  const goHome = () => {
    setCurrentView('home');
    setDebateConfig(null);
  };

  const goHistory = () => {
    setCurrentView('history');
  };

  return (
    <div className="app-container">
      <Header goHome={goHome} goHistory={goHistory} />

      <main className="main-content">
        {currentView === 'home' && <Home startDebate={startDebate} />}
        {currentView === 'arena' && debateConfig && (
          <DebateArena config={debateConfig} onEnd={goHome} />
        )}
        {currentView === 'history' && (
          <DebateHistory onBack={goHome} />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;

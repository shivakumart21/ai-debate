import React from 'react';

const Header = ({ goHome, goHistory }) => {
  return (
    <header>
      <div className="logo" onClick={goHome}>
        <span>⚖️</span>
        <span className="text-gradient">DebateAI</span>
      </div>
      <div className="nav-links">
        <button className="btn btn-secondary" onClick={goHistory}>📜 History</button>
        <button className="btn btn-secondary" onClick={goHome}>Home</button>
      </div>
    </header>
  );
};

export default Header;

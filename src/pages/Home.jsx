import React from 'react';

const Home = ({ startDebate }) => {
  return (
    <div className="hero">
      <h1>Welcome to the <br /><span className="text-gradient">Ultimate AI Debate Platform</span></h1>
      <p>Explore complex topics through structured debates. Choose your mode and witness the power of logical argumentation powered by AI.</p>
      
      <div className="modes-grid">
        {/* AI vs AI Mode */}
        <div className="glass-panel mode-card" onClick={() => startDebate({ mode: 'ai-vs-ai' })}>
          <div className="mode-icon">🤖 ⚡ 🤖</div>
          <h3>AI vs AI</h3>
          <p>Watch two distinct AI personas debate complex topics from opposing perspectives. Perfect for exploring all sides of an issue without bias.</p>
          <button className="btn btn-primary">Start AI Battle</button>
        </div>

        {/* Human vs AI Mode */}
        <div className="glass-panel mode-card" onClick={() => startDebate({ mode: 'human-vs-ai' })}>
          <div className="mode-icon">👤 ⚡ 🤖</div>
          <h3>Human vs AI</h3>
          <p>Test your critical thinking skills. Present your arguments and get real-time counter-arguments from an advanced AI system.</p>
          <button className="btn btn-primary">Challenge AI</button>
        </div>
      </div>
    </div>
  );
};

export default Home;

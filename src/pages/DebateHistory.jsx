import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://jnsrzkunpopiergtbttc.supabase.co";
const SUPABASE_KEY = "sb_publishable__6y-W-VaqHlSj83olT1QGQ_UzlyD5WZ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DebateHistory = ({ onBack }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('debate_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      setError(error.message);
    } else {
      setHistory(data || []);
    }
    setLoading(false);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const modeLabel = (mode) => mode === 'ai-vs-ai' ? '🤖 AI vs AI' : '👤 Human vs AI';

  return (
    <div className="history-container">
      <div className="history-header">
        <div>
          <h2>📜 <span className="text-gradient">Debate History</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'Inter, sans-serif', marginTop: '0.3rem' }}>
            All saved debates from the platform
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onBack}>← Back Home</button>
      </div>

      {loading && <p className="typing-indicator" style={{ textAlign: 'center', padding: '2rem' }}>Loading debates...</p>}
      {error && <p style={{ color: 'var(--accent-pink)', textAlign: 'center', padding: '2rem' }}>⚠️ {error}</p>}

      {!loading && !error && history.length === 0 && (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '3rem' }}>📭</p>
          <p>No debates saved yet. Start a debate to see history here!</p>
        </div>
      )}

      {!loading && !selected && history.length > 0 && (
        <div className="history-grid">
          {history.map((item) => (
            <div key={item.id} className="glass-panel history-card" onClick={() => setSelected(item)}>
              <div className="history-card-mode">{modeLabel(item.mode)}</div>
              <h3 className="history-card-topic">{item.topic}</h3>
              <div className="history-card-meta">
                <span>💬 {(item.pro_arguments?.length || 0) + (item.con_arguments?.length || 0)} arguments</span>
                <span>🕐 {formatDate(item.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div>
          <button className="btn btn-secondary" style={{ marginBottom: '1.5rem' }} onClick={() => setSelected(null)}>
            ← Back to List
          </button>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>
            {modeLabel(selected.mode)} — <span className="text-gradient">{selected.topic}</span>
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontFamily: 'Inter', marginBottom: '2rem', fontSize: '0.9rem' }}>
            {formatDate(selected.created_at)}
          </p>

          <div className="stage-split">
            <div className="glass-panel debater-box pro-side">
              <div className="debater-header">
                <div className="debater-icon">{selected.mode === 'human-vs-ai' ? '👤' : '🤖'}</div>
                <div><h3>{selected.mode === 'human-vs-ai' ? 'Human' : 'Proponent AI'}</h3></div>
              </div>
              <div className="debater-content">
                {(selected.pro_arguments || []).map((arg, i) => (
                  <p key={i}><strong>Point {i + 1}:</strong> {arg}</p>
                ))}
              </div>
            </div>
            <div className="glass-panel debater-box con-side">
              <div className="debater-header">
                <div className="debater-icon">🔴</div>
                <div><h3>Opponent AI</h3></div>
              </div>
              <div className="debater-content">
                {(selected.con_arguments || []).map((arg, i) => (
                  <p key={i}><strong>Point {i + 1}:</strong> {arg}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateHistory;

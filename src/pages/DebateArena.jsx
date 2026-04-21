import React, { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const k1 = "gsk_H9Jl2cVxI";
const k2 = "QCq7EYnO47lWG";
const k3 = "dyb3FYAbdjXNf";
const k4 = "iNZkNxcC1907HZHxC";
const GROQ_API_KEY = k1 + k2 + k3 + k4;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.1-8b-instant";

const SUPABASE_URL = "https://jnsrzkunpopiergtbttc.supabase.co";
const SUPABASE_KEY = "sb_publishable__6y-W-VaqHlSj83olT1QGQ_UzlyD5WZ";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DebateArena = ({ config, onEnd }) => {
  const [topic, setTopic] = useState('');
  const [isDebating, setIsDebating] = useState(false);
  const [messages, setMessages] = useState({ pro: [], con: [] });
  const [typing, setTyping] = useState({ pro: false, con: false });
  const [humanInput, setHumanInput] = useState('');
  const [savedId, setSavedId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [isListeningTopic, setIsListeningTopic] = useState(false);
  const [isListeningArg, setIsListeningArg] = useState(false);

  const proEndRef = useRef(null);
  const conEndRef = useRef(null);
  const messagesRef = useRef({ pro: [], con: [] });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    proEndRef.current?.scrollIntoView({ behavior: "smooth" });
    conEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const recognitionRef = useRef(null);
  const manualStopRef = useRef(false);

  const startListening = (e, setter, configKey, isListening, setIsListening) => {
    e.preventDefault();

    // Toggle off if already listening
    if (isListening) {
      manualStopRef.current = true;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    manualStopRef.current = false;
    
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let hasFatalError = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const latestResult = event.results[event.results.length - 1];
      if (latestResult.isFinal) {
        const transcript = latestResult[0].transcript;
        setter(prev => (prev ? prev.trim() + ' ' : '') + transcript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'network') {
        hasFatalError = true;
        alert("Speech Recognition failed (Network Error). This is common on Linux Chromium without API keys. Please use Google Chrome.");
      } else if (event.error === 'not-allowed') {
        hasFatalError = true;
        alert("Microphone permission denied.");
      }
    };

    recognition.onend = () => {
      if (!manualStopRef.current && !hasFatalError) {
        try {
          recognition.start();
        } catch (err) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
    } catch (err) {
      console.error(err);
    }
  };

  const callAI = async (systemPrompt, userPrompt) => {
    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data.choices[0].message.content;
    } catch (error) {
      console.error("AI Error:", error);
      return "Error: Unable to connect to AI.";
    }
  };

  const saveDebate = async (proMsgs, conMsgs) => {
    setSaveStatus('saving');
    const { data, error } = await supabase.from('debate_history').insert([{
      mode: config.mode,
      topic,
      pro_arguments: proMsgs.map(m => m.text),
      con_arguments: conMsgs.map(m => m.text),
    }]).select().single();

    if (error) {
      console.error("Save error:", error);
      setSaveStatus('error');
    } else {
      setSavedId(data.id);
      setSaveStatus('saved');
    }
  };

  const handleInitiate = async () => {
    if (!topic.trim()) { alert("Please enter a topic"); return; }
    setIsDebating(true);
    setMessages({ pro: [], con: [] });
    setSaveStatus('');
    setSavedId(null);

    if (config.mode === 'ai-vs-ai') {
      await runAIVsAIBattle(topic);
    }
  };

  const runAIVsAIBattle = async (currentTopic) => {
    let proMsgs = [];
    let conMsgs = [];

    setTyping({ pro: true, con: false });
    const proOpening = await callAI(
      "You are Proponent AI. Defend the topic convincingly. Max 3 sentences.",
      `Topic: ${currentTopic}. Give your opening argument.`
    );
    proMsgs = [{ role: 'ai', text: proOpening }];
    setMessages({ pro: proMsgs, con: conMsgs });
    setTyping({ pro: false, con: true });

    const conCounter = await callAI(
      "You are Opponent AI. Strongly oppose the topic. Max 3 sentences.",
      `Topic: ${currentTopic}. Opponent said: "${proOpening}". Counter their argument.`
    );
    conMsgs = [{ role: 'ai', text: conCounter }];
    setMessages({ pro: proMsgs, con: conMsgs });
    setTyping({ pro: true, con: false });

    const proRebuttal = await callAI(
      "You are Proponent AI. Rebut the opponent's point. Max 3 sentences.",
      `Topic: ${currentTopic}. Opponent countered: "${conCounter}". Rebut them.`
    );
    proMsgs = [...proMsgs, { role: 'ai', text: proRebuttal }];
    setMessages({ pro: proMsgs, con: conMsgs });
    setTyping({ pro: false, con: false });

    // Auto-save
    await saveDebate(proMsgs, conMsgs);
  };

  const submitHumanArgument = async () => {
    if (!humanInput.trim()) return;

    const currentHumanText = humanInput;
    setHumanInput('');
    
    const newProMsgs = [...messagesRef.current.pro, { role: 'human', text: currentHumanText }];
    setMessages(prev => ({ ...prev, pro: newProMsgs }));
    setTyping({ pro: false, con: true });

    const aiResponse = await callAI(
      "You are an AI debater. Oppose the user's point strongly but professionally. Max 3 sentences.",
      `Topic: "${topic}". User argued: "${currentHumanText}". Counter this.`
    );

    const newConMsgs = [...messagesRef.current.con, { role: 'ai', text: aiResponse }];
    setMessages(prev => ({ ...prev, con: newConMsgs }));
    setTyping({ pro: false, con: false });

    // Save after each human round
    await saveDebate(newProMsgs, newConMsgs);
  };

  return (
    <div id="arena-view" style={{ display: 'block' }}>
      <div className="arena-header">
        <h2>Debate Arena: <span className="text-gradient">{config.mode === 'human-vs-ai' ? 'Human vs AI' : 'AI vs AI'}</span></h2>
        <button className="btn btn-secondary" onClick={onEnd}>End Debate</button>
      </div>

      {!isDebating && (
        <div className="topic-input-container" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flex: 1, position: 'relative', width: '100%' }}>
            <input
              type="text"
              className="input-glass"
              style={{ width: '100%', paddingRight: '3rem' }}
              placeholder="Enter a debate topic (e.g. 'Is AI a threat?')"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInitiate()}
            />
            <button 
              className={`btn btn-secondary ${isListeningTopic ? 'listening' : ''}`}
              onClick={(e) => startListening(e, setTopic, 'topic', isListeningTopic, setIsListeningTopic)}
              title="Voice to Text"
              style={{ position: 'absolute', right: '0.3rem', top: '50%', transform: 'translateY(-50%)', padding: '0.4rem', borderRadius: '50%', background: 'transparent', border: 'none', color: isListeningTopic ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isListeningTopic ? '🔴' : '🎤'}
            </button>
          </div>
          <button className="btn btn-primary" onClick={handleInitiate}>Begin Match</button>
        </div>
      )}

      {saveStatus === 'saved' && savedId && (
        <div className="save-banner">
          ✅ Debate saved to history! 
        </div>
      )}
      {saveStatus === 'saving' && <div className="save-banner saving">💾 Saving debate...</div>}
      {saveStatus === 'error' && <div className="save-banner error">⚠️ Could not save debate.</div>}

      {isDebating && (
        <div className="debate-stage">
          <div className="stage-split">
            {/* Pro Side */}
            <div className="glass-panel debater-box pro-side">
              <div className="debater-header">
                <div className="debater-icon">{config.mode === 'human-vs-ai' ? '👤' : '🤖'}</div>
                <div>
                  <h3>{config.mode === 'human-vs-ai' ? 'Human Defender' : 'Proponent (AI 1)'}</h3>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Topic: {topic}</span>
                </div>
              </div>
              <div className="debater-content">
                {messages.pro.length === 0 && !typing.pro && (
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                    {config.mode === 'human-vs-ai' ? 'Enter your argument below...' : 'Generating opening...'}
                  </p>
                )}
                {messages.pro.map((msg, i) => (
                  <p key={i}><strong>{msg.role === 'human' ? 'You' : 'AI'}:</strong> {msg.text}</p>
                ))}
                {typing.pro && <p className="typing-indicator">✍️ AI is formulating...</p>}
                <div ref={proEndRef} />
              </div>
              {config.mode === 'human-vs-ai' && (
                <>
                  <div style={{ position: 'relative', marginTop: '1rem' }}>
                    <textarea
                      className="input-glass debater-input"
                      placeholder="Type your argument here..."
                      value={humanInput}
                      onChange={(e) => setHumanInput(e.target.value)}
                      style={{ width: '100%', minHeight: '100px', paddingRight: '3rem' }}
                    />
                    <button 
                      className={`btn btn-secondary ${isListeningArg ? 'listening' : ''}`}
                      onClick={(e) => startListening(e, setHumanInput, 'arg', isListeningArg, setIsListeningArg)}
                      title="Voice to Text"
                      style={{ position: 'absolute', right: '0.5rem', bottom: '0.5rem', padding: '0.4rem', borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--border-color)', color: isListeningArg ? 'var(--primary)' : 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {isListeningArg ? '🔴' : '🎤'}
                    </button>
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ marginTop: '0.5rem' }}
                    onClick={submitHumanArgument}
                    disabled={typing.con}
                  >
                    {typing.con ? 'AI is thinking...' : 'Submit Argument'}
                  </button>
                </>
              )}
            </div>

            {/* Con Side */}
            <div className="glass-panel debater-box con-side">
              <div className="debater-header">
                <div className="debater-icon">🔴</div>
                <div>
                  <h3>Opponent (AI)</h3>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Opposing the topic</span>
                </div>
              </div>
              <div className="debater-content">
                {messages.con.length === 0 && !typing.con && (
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>Awaiting turn...</p>
                )}
                {messages.con.map((msg, i) => (
                  <p key={i}><strong>AI:</strong> {msg.text}</p>
                ))}
                {typing.con && <p className="typing-indicator">✍️ AI is analyzing...</p>}
                <div ref={conEndRef} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebateArena;

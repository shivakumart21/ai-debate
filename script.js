// ── Configuration ──────────────────────────────────────────────
// Use relative URL - works with both Vite dev proxy and production
const API_BASE_URL = '/api';

// ── Supabase (for client-side history loading) ─────────────────
const SUPABASE_URL = "https://jnsrzkunpopiergtbttc.supabase.co";
const SUPABASE_KEY = "sb_publishable__6y-W-VaqHlSj83olT1QGQ_UzlyD5WZ";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentMode = null;
let proArgs = [];
let conArgs = [];

// Debug: Confirm script loaded
console.log('✅ script.js loaded successfully');

// ── AI call via Backend API ────────────────────────────────────
async function callAI(systemPrompt, userPrompt) {
  try {
    const response = await fetch(`${API_BASE_URL}/debate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        max_tokens: 500
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("AI Error:", error);
    return `Error: ${error.message}. Please ensure the backend server is running (npm run server).`;
  }
}

// ── Supabase helpers ──────────────────────────────────────────
function showSaveBanner(state, msg) {
  const banner = document.getElementById('save-banner');
  if (!banner) return;
  banner.style.display = 'block';
  banner.className = `save-banner${state === 'saving' ? ' saving' : state === 'error' ? ' error' : ''}`;
  banner.textContent = msg;
}

async function saveDebate(topic) {
  showSaveBanner('saving', '💾 Saving debate...');
  const { error } = await supabase.from('debate_history').insert([{
    mode: currentMode,
    topic,
    pro_arguments: proArgs,
    con_arguments: conArgs,
  }]);
  if (error) {
    console.error("Save error:", error);
    showSaveBanner('error', '⚠️ Could not save debate: ' + error.message);
  } else {
    showSaveBanner('saved', '✅ Debate saved to history!');
  }
}

// ── Navigation ────────────────────────────────────────────────
function goHome() {
  document.getElementById('home-view').style.display = 'block';
  document.getElementById('arena-view').style.display = 'none';
  document.getElementById('history-view').style.display = 'none';
  currentMode = null;
  proArgs = [];
  conArgs = [];
  resetArena();
}

async function showHistory() {
  document.getElementById('home-view').style.display = 'none';
  document.getElementById('arena-view').style.display = 'none';
  document.getElementById('history-view').style.display = 'block';
  document.getElementById('history-loading').style.display = 'block';
  document.getElementById('history-grid').style.display = 'none';
  document.getElementById('history-detail').style.display = 'none';

  const { data, error } = await supabase
    .from('debate_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  document.getElementById('history-loading').style.display = 'none';

  if (error || !data) {
    document.getElementById('history-loading').style.display = 'block';
    document.getElementById('history-loading').textContent = '⚠️ Failed to load: ' + (error?.message || 'Unknown error');
    return;
  }

  const grid = document.getElementById('history-grid');
  grid.style.display = 'grid';

  if (data.length === 0) {
    grid.innerHTML = `<div class="glass-panel" style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-secondary)">
      <p style="font-size:3rem">📭</p><p>No debates saved yet. Start a debate to see history here!</p>
    </div>`;
    return;
  }

  grid.innerHTML = data.map(item => `
    <div class="glass-panel history-card" onclick="showDebateDetail('${item.id}', ${JSON.stringify(JSON.stringify(item))})">
      <div class="history-card-mode">${item.mode === 'ai-vs-ai' ? '🤖 AI vs AI' : '👤 Human vs AI'}</div>
      <h3 class="history-card-topic">${item.topic}</h3>
      <div class="history-card-meta">
        <span>💬 ${(item.pro_arguments?.length || 0) + (item.con_arguments?.length || 0)} arguments</span>
        <span>🕐 ${new Date(item.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  `).join('');
}

function showDebateDetail(id, itemJson) {
  const item = JSON.parse(itemJson);
  document.getElementById('history-grid').style.display = 'none';
  const detail = document.getElementById('history-detail');
  detail.style.display = 'block';
  const modeLabel = item.mode === 'ai-vs-ai' ? '🤖 AI vs AI' : '👤 Human vs AI';
  const proIcon = item.mode === 'human-vs-ai' ? '👤' : '🤖';
  const proName = item.mode === 'human-vs-ai' ? 'Human' : 'Proponent AI';

  detail.innerHTML = `
    <button class="btn btn-secondary" onclick="backToHistoryGrid()" style="margin-bottom:1.5rem">← Back to List</button>
    <h3 style="margin-bottom:0.5rem;font-size:1.5rem">${modeLabel} — <span class="text-gradient">${item.topic}</span></h3>
    <p style="color:var(--text-secondary);font-family:Inter;margin-bottom:2rem;font-size:0.9rem">
      ${new Date(item.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
    </p>
    <div class="stage-split">
      <div class="glass-panel debater-box pro-side">
        <div class="debater-header">
          <div class="debater-icon">${proIcon}</div>
          <div><h3>${proName}</h3></div>
        </div>
        <div class="debater-content">
          ${(item.pro_arguments || []).map((a, i) => `<p><strong>Point ${i + 1}:</strong> ${a}</p>`).join('')}
        </div>
      </div>
      <div class="glass-panel debater-box con-side">
        <div class="debater-header">
          <div class="debater-icon">🔴</div>
          <div><h3>Opponent AI</h3></div>
        </div>
        <div class="debater-content">
          ${(item.con_arguments || []).map((a, i) => `<p><strong>Point ${i + 1}:</strong> ${a}</p>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function backToHistoryGrid() {
  document.getElementById('history-detail').style.display = 'none';
  document.getElementById('history-grid').style.display = 'grid';
}

// ── Arena ─────────────────────────────────────────────────────
function startDebate(mode) {
  console.log('🎯 startDebate called with mode:', mode);
  try {
    currentMode = mode;
    proArgs = [];
    conArgs = [];
    
    const homeView = document.getElementById('home-view');
    const arenaView = document.getElementById('arena-view');
    
    if (!homeView || !arenaView) {
      console.error('❌ Missing elements:', { homeView: !!homeView, arenaView: !!arenaView });
      alert('Error: Page elements not found. Please refresh.');
      return;
    }
    
      homeView.style.display = 'none';
    arenaView.style.display = 'block';
    console.log('✅ Views switched: home hidden, arena visible');

    const titleEl = document.getElementById('arena-mode-title');
    const proTitle = document.getElementById('pro-title');
    const proIcon = document.getElementById('pro-icon');
    const humanInput = document.getElementById('human-input-pro');
    const humanSubmitBtn = document.getElementById('human-submit-btn');
    const saveBanner = document.getElementById('save-banner');
    if (saveBanner) saveBanner.style.display = 'none';
    
    // Hide score panel when starting new debate
    const scorePanel = document.getElementById('score-panel');
    if (scorePanel) scorePanel.style.display = 'none';

    if (mode === 'human-vs-ai') {
      titleEl.innerText = 'Human vs AI';
      proTitle.innerText = 'Human Defender';
      proIcon.innerText = '👤';
      humanInput.style.display = 'block';
      const micBtn = document.getElementById('mic-arg-btn');
      if (micBtn) micBtn.style.display = 'flex';
      humanSubmitBtn.style.display = 'inline-flex';
    } else {
      titleEl.innerText = 'AI vs AI';
      proTitle.innerText = 'Proponent (AI 1)';
      proIcon.innerText = '🤖';
      humanInput.style.display = 'none';
      const micBtn = document.getElementById('mic-arg-btn');
      if (micBtn) micBtn.style.display = 'none';
      humanSubmitBtn.style.display = 'none';
    }
    console.log('✅ startDebate completed successfully');
  } catch (error) {
    console.error('❌ startDebate error:', error);
    alert('Error starting debate: ' + error.message);
  }
}

function resetArena() {
  document.getElementById('topic-input').value = '';
  document.getElementById('pro-content').innerHTML = '<p style="color: rgba(255,255,255,0.5); font-style: italic;">Awaiting topic...</p>';
  document.getElementById('con-content').innerHTML = '<p style="color: rgba(255,255,255,0.5); font-style: italic;">Awaiting topic...</p>';
  document.getElementById('human-input-pro').value = '';
  const micBtn = document.getElementById('mic-arg-btn');
  if (micBtn) micBtn.style.display = 'none';
  const saveBanner = document.getElementById('save-banner');
  if (saveBanner) saveBanner.style.display = 'none';
  
  // Hide score panel and reset score bars
  const scorePanel = document.getElementById('score-panel');
  if (scorePanel) scorePanel.style.display = 'none';
  
  // Reset score bars to 0 width for next animation
  const scoreBars = document.querySelectorAll('.score-bar-fill');
  scoreBars.forEach(bar => bar.style.width = '0%');
  
  // Reset overall scores to 0
  const proOverall = document.getElementById('pro-overall');
  const conOverall = document.getElementById('con-overall');
  if (proOverall) proOverall.textContent = '0.0';
  if (conOverall) conOverall.textContent = '0.0';
}

function initiateDebate() {
  const topic = document.getElementById('topic-input').value.trim();
  if (!topic) { alert('Please enter a debate topic first.'); return; }

  proArgs = [];
  conArgs = [];

  if (currentMode === 'ai-vs-ai') {
    simulateAIAIBattle(topic);
  } else if (currentMode === 'human-vs-ai') {
    document.getElementById('pro-content').innerHTML = '<p style="color: rgba(255,255,255,0.5); font-style: italic;">Please enter your argument below...</p>';
    document.getElementById('con-content').innerHTML = `<p style="color: rgba(255,255,255,0.5); font-style: italic;">Waiting for Human to argue on "${topic}"...</p>`;
  }
}

async function simulateAIAIBattle(topic) {
  const proContent = document.getElementById('pro-content');
  const conContent = document.getElementById('con-content');

  proContent.innerHTML = `<p class="typing-indicator">✍️ AI is formulating opening statement...</p>`;
  conContent.innerHTML = `<p style="color: rgba(255,255,255,0.5); font-style: italic;">Waiting for turn...</p>`;

  const proOpening = await callAI(
    "You are Proponent AI. Defend the topic convincingly. Max 3 sentences.",
    `Topic: "${topic}". Provide a strong opening argument.`
  );
  proArgs.push(proOpening);
  proContent.innerHTML = `<p><strong>Proponent:</strong> ${proOpening}</p>`;

  conContent.innerHTML = `<p class="typing-indicator">✍️ AI is preparing counter-argument...</p>`;
  const conCounter = await callAI(
    "You are Opponent AI. Strongly oppose the topic. Max 3 sentences.",
    `Topic: "${topic}". Opponent said: "${proOpening}". Counter this.`
  );
  conArgs.push(conCounter);
  conContent.innerHTML = `<p><strong>Opponent:</strong> ${conCounter}</p>`;

  proContent.innerHTML += `<p class="typing-indicator">✍️ AI is rebutting...</p>`;
  const proRebuttal = await callAI(
    "You are Proponent AI. Rebut the opponent's counter. Max 3 sentences.",
    `Topic: "${topic}". Opponent countered: "${conCounter}". Rebut them.`
  );
  proArgs.push(proRebuttal);
  proContent.innerHTML = proContent.innerHTML.replace('<p class="typing-indicator">✍️ AI is rebutting...</p>', '');
  proContent.innerHTML += `<p><strong>Pro Rebuttal:</strong> ${proRebuttal}</p>`;

  await saveDebate(topic);
  
  // Show and calculate logic scores after debate completes
  await showLogicScores(topic);
}

async function submitHumanArgument() {
  const humanText = document.getElementById('human-input-pro').value.trim();
  const topic = document.getElementById('topic-input').value.trim();
  if (!humanText || !topic) return;

  const proContent = document.getElementById('pro-content');
  const conContent = document.getElementById('con-content');

  if (proContent.innerHTML.includes('Please enter your argument below')) {
    proContent.innerHTML = '';
  }

  proArgs.push(humanText);
  proContent.innerHTML += `<p><strong>You:</strong> ${humanText}</p>`;
  document.getElementById('human-input-pro').value = '';
  document.getElementById('human-submit-btn').disabled = true;
  document.getElementById('human-submit-btn').textContent = 'AI is thinking...';

  conContent.innerHTML = `<p class="typing-indicator">✍️ AI is analyzing your argument...</p>`;

  const aiResponse = await callAI(
    "You are an AI debater. Oppose the user's point strongly but professionally. Max 3 sentences.",
    `Topic: "${topic}". User argued: "${humanText}". Counter this.`
  );
  conArgs.push(aiResponse);
  conContent.innerHTML = `<p><strong>AI Counter:</strong> ${aiResponse}</p>`;

  document.getElementById('human-submit-btn').disabled = false;
  document.getElementById('human-submit-btn').textContent = 'Submit Argument';

  await saveDebate(topic);
  
  // Show and calculate logic scores after debate completes
  await showLogicScores(topic);
}

// ── Logic Score Feature ───────────────────────────────────────
async function analyzeArgument(argument, topic, side) {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        argument,
        topic,
        side
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const scores = await response.json();
    return scores;
  } catch (error) {
    console.error("Score analysis error:", error);
    // Fallback scores
    return { logic: 5, evidence: 5, persuasion: 5, brief: "Analysis unavailable" };
  }
}

async function showLogicScores(topic) {
  const scorePanel = document.getElementById('score-panel');
  const scoreLoading = document.getElementById('score-loading');
  const scoreBody = document.getElementById('score-body');
  const verdictBox = document.getElementById('verdict-box');
  
  // Show panel with loading state
  scorePanel.style.display = 'block';
  scoreLoading.style.display = 'flex';
  scoreBody.style.display = 'none';
  verdictBox.style.display = 'none';
  
  // Update pro label/icon based on mode
  const proLabel = document.getElementById('score-pro-label');
  const proIcon = document.getElementById('score-pro-icon');
  if (currentMode === 'human-vs-ai') {
    proLabel.textContent = 'Human';
    proIcon.textContent = '👤';
  } else {
    proLabel.textContent = 'Proponent AI';
    proIcon.textContent = '🤖';
  }
  
  // Analyze all arguments
  const proAnalysis = await analyzeArgument(proArgs.join(' '), topic, 'pro');
  const conAnalysis = await analyzeArgument(conArgs.join(' '), topic, 'con');
  
  // Hide loading, show results
  scoreLoading.style.display = 'none';
  scoreBody.style.display = 'block';
  
  // Animate score bars for Pro
  setScoreBars('pro', proAnalysis);
  
  // Animate score bars for Con
  setTimeout(() => setScoreBars('con', conAnalysis), 200);
  
  // Calculate and display overall scores
  const proOverall = ((proAnalysis.logic + proAnalysis.evidence + proAnalysis.persuasion) / 3).toFixed(1);
  const conOverall = ((conAnalysis.logic + conAnalysis.evidence + conAnalysis.persuasion) / 3).toFixed(1);
  
  setTimeout(() => {
    animateNumber('pro-overall', parseFloat(proOverall));
  }, 400);
  setTimeout(() => {
    animateNumber('con-overall', parseFloat(conOverall));
  }, 600);
  
  // Generate verdict
  setTimeout(() => {
    generateVerdict(proOverall, conOverall, proAnalysis, conAnalysis);
  }, 900);
}

function setScoreBars(side, scores) {
  const logicBar = document.getElementById(`${side}-logic-bar`);
  const evidenceBar = document.getElementById(`${side}-evidence-bar`);
  const persuasionBar = document.getElementById(`${side}-persuasion-bar`);
  
  const logicVal = document.getElementById(`${side}-logic-val`);
  const evidenceVal = document.getElementById(`${side}-evidence-val`);
  const persuasionVal = document.getElementById(`${side}-persuasion-val`);
  
  // Update text
  logicVal.textContent = `${scores.logic}/10`;
  evidenceVal.textContent = `${scores.evidence}/10`;
  persuasionVal.textContent = `${scores.persuasion}/10`;
  
  // Animate bars (percentage based on score)
  setTimeout(() => {
    logicBar.style.width = `${scores.logic * 10}%`;
  }, 100);
  setTimeout(() => {
    evidenceBar.style.width = `${scores.evidence * 10}%`;
  }, 200);
  setTimeout(() => {
    persuasionBar.style.width = `${scores.persuasion * 10}%`;
  }, 300);
}

function animateNumber(elementId, targetValue) {
  const element = document.getElementById(elementId);
  let current = 0;
  const increment = targetValue / 20;
  const timer = setInterval(() => {
    current += increment;
    if (current >= targetValue) {
      current = targetValue;
      clearInterval(timer);
    }
    element.textContent = current.toFixed(1);
  }, 50);
}

function generateVerdict(proScore, conScore, proAnalysis, conAnalysis) {
  const verdictBox = document.getElementById('verdict-box');
  const verdictText = document.getElementById('verdict-text');
  
  let verdict = '';
  const proNum = parseFloat(proScore);
  const conNum = parseFloat(conScore);
  
  if (proNum > conNum + 1) {
    verdict = `<strong>Proponent wins!</strong> The ${currentMode === 'human-vs-ai' ? 'human' : 'proponent AI'} presented stronger arguments with better ${proAnalysis.logic > conAnalysis.logic ? 'logical reasoning' : proAnalysis.evidence > conAnalysis.evidence ? 'evidence' : 'persuasive appeal'}.`;
  } else if (conNum > proNum + 1) {
    verdict = `<strong>Opponent wins!</strong> The counter-arguments were more compelling, showing superior ${conAnalysis.logic > proAnalysis.logic ? 'logical structure' : conAnalysis.evidence > proAnalysis.evidence ? 'factual support' : 'rhetorical skill'}.`;
  } else {
    verdict = `<strong>It's a close draw!</strong> Both sides presented equally matched arguments. The ${proNum > conNum ? 'proponent had a slight edge' : conNum > proNum ? 'opponent had a marginal advantage' : 'debate was evenly balanced'}.`;
  }
  
  verdictText.innerHTML = verdict;
  verdictBox.style.display = 'flex';
  verdictBox.style.animation = 'fade-in-up 0.5s ease-out';
}

// ── Expose functions globally for HTML onclick handlers ───────
window.goHome = goHome;
window.showHistory = showHistory;
window.startDebate = startDebate;
window.initiateDebate = initiateDebate;
window.submitHumanArgument = submitHumanArgument;
window.backToHistoryGrid = backToHistoryGrid;
window.showDebateDetail = showDebateDetail;

let isListeningVanilla = false;
let activeVanillaRecognition = null;
let vanillaManualStop = false;

function startListeningVanilla(inputId, btnId, e) {
  if (e) {
    e.preventDefault();
  }
  
  if (isListeningVanilla) {
    vanillaManualStop = true;
    if (activeVanillaRecognition) {
      activeVanillaRecognition.stop();
    }
    return;
  }
  
  vanillaManualStop = false;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Your browser does not support Speech Recognition.");
    return;
  }

  const recognition = new SpeechRecognition();
  activeVanillaRecognition = recognition;
  
  const inputEl = document.getElementById(inputId);
  const btnEl = document.getElementById(btnId);
  
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  let hasFatalError = false;

  recognition.onstart = () => {
    isListeningVanilla = true;
    if(btnEl) btnEl.innerText = '🔴';
    if(btnEl) btnEl.style.color = 'var(--primary)';
  };

  recognition.onresult = (event) => {
    const latestResult = event.results[event.results.length - 1];
    if (latestResult.isFinal) {
      const transcript = latestResult[0].transcript;
      if(inputEl) {
         inputEl.value = (inputEl.value ? inputEl.value.trim() + ' ' : '') + transcript.trim();
      }
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
    if (!vanillaManualStop && !hasFatalError) {
      try {
        recognition.start();
      } catch (err) {
        handleVanillaEnd(btnId);
      }
    } else {
      handleVanillaEnd(btnId);
    }
  };

  function handleVanillaEnd(id) {
    isListeningVanilla = false;
    const b = document.getElementById(id);
    if(b) b.innerText = '🎤';
    if(b) b.style.color = id === 'mic-topic-btn' ? 'var(--text-secondary)' : 'var(--text)';
  }

  try {
    recognition.start();
  } catch (err) {
    console.error(err);
  }
}
window.startListeningVanilla = startListeningVanilla;

console.log('✅ All functions exposed to window object');

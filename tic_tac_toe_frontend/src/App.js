import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Design goals:
 * - Modern, light theme with provided palette
 * - Responsive: centered board, sidebar for scores/settings
 * - Modes: Player vs Player, Player vs AI
 * - Persistent score (localStorage)
 * - Restart current game and Reset all scores/settings
 */

// Utils
const emptyBoard = () => Array(9).fill(null);
const LS_KEY = 'ttt_scores_v1';
const LS_MODE_KEY = 'ttt_mode_v1';
const LS_THEME_KEY = 'ttt_theme_v1';
const MODES = {
  PVP: 'PVP',
  AI: 'AI',
};

// Simple AI: tries to win, then block, otherwise take center, corner, side
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinner(board) {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  if (board.every(Boolean)) return { winner: 'draw', line: [] };
  return null;
}

function bestMove(board, aiMark, humanMark) {
  // 1) can AI win now?
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const copy = board.slice();
      copy[i] = aiMark;
      if (getWinner(copy)?.winner === aiMark) return i;
    }
  }
  // 2) need to block human?
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      const copy = board.slice();
      copy[i] = humanMark;
      if (getWinner(copy)?.winner === humanMark) return i;
    }
  }
  // 3) center
  if (!board[4]) return 4;
  // 4) corners
  const corners = [0, 2, 6, 8].filter((i) => !board[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // 5) sides
  const sides = [1, 3, 5, 7].filter((i) => !board[i]);
  if (sides.length) return sides[Math.floor(Math.random() * sides.length)];
  return null;
}

// Score helpers
function loadScores() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : { X: 0, O: 0, draws: 0 };
  } catch {
    return { X: 0, O: 0, draws: 0 };
  }
}
function saveScores(scores) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(scores));
  } catch {
    // ignore
  }
}

function loadMode() {
  try {
    const raw = localStorage.getItem(LS_MODE_KEY);
    return raw || MODES.AI;
  } catch {
    return MODES.AI;
  }
}
function saveMode(mode) {
  try {
    localStorage.setItem(LS_MODE_KEY, mode);
  } catch {
    // ignore
  }
}
function loadTheme() {
  try {
    const raw = localStorage.getItem(LS_THEME_KEY);
    return raw || 'light';
  } catch {
    return 'light';
  }
}
function saveTheme(theme) {
  try {
    localStorage.setItem(LS_THEME_KEY, theme);
  } catch {
    // ignore
  }
}

// PUBLIC_INTERFACE
function App() {
  /** UI state */
  const [theme, setTheme] = useState(loadTheme());
  const [mode, setMode] = useState(loadMode()); // PVP | AI
  const [board, setBoard] = useState(emptyBoard());
  const [xIsNext, setXIsNext] = useState(true);
  const [scores, setScores] = useState(loadScores());
  const [highlight, setHighlight] = useState([]);
  const [aiThinking, setAiThinking] = useState(false);
  const [startingPlayer, setStartingPlayer] = useState('X'); // alternates each new game for fairness

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveMode(mode);
  }, [mode]);

  useEffect(() => {
    saveScores(scores);
  }, [scores]);

  const status = useMemo(() => {
    const res = getWinner(board);
    if (res?.winner === 'X') return 'X wins!';
    if (res?.winner === 'O') return 'O wins!';
    if (res?.winner === 'draw') return "It's a draw!";
    return `${xIsNext ? 'X' : 'O'} to move`;
  }, [board, xIsNext]);

  // Handle AI move
  useEffect(() => {
    if (mode !== MODES.AI) return;
    const res = getWinner(board);
    if (res) return;
    const current = xIsNext ? 'X' : 'O';
    const aiMark = 'O'; // AI plays O by default; X is human
    if (current === aiMark) {
      setAiThinking(true);
      const id = setTimeout(() => {
        const move = bestMove(board, aiMark, 'X');
        if (move != null) handleSquareClick(move);
        setAiThinking(false);
      }, 350); // small delay for UX
      return () => clearTimeout(id);
    }
  }, [board, xIsNext, mode]);

  function updateScores(winner) {
    if (winner === 'X') setScores((s) => ({ ...s, X: s.X + 1 }));
    else if (winner === 'O') setScores((s) => ({ ...s, O: s.O + 1 }));
    else setScores((s) => ({ ...s, draws: s.draws + 1 }));
  }

  // PUBLIC_INTERFACE
  function startNewRound(nextStarter) {
    setBoard(emptyBoard());
    setXIsNext(nextStarter === 'X');
    setHighlight([]);
  }

  // PUBLIC_INTERFACE
  function restartGame() {
    // keep scores, restart current round, alternate starter
    const nextStarter = startingPlayer === 'X' ? 'O' : 'X';
    setStartingPlayer(nextStarter);
    startNewRound(nextStarter);
  }

  // PUBLIC_INTERFACE
  function resetAll() {
    // reset scores and game state
    setScores({ X: 0, O: 0, draws: 0 });
    setStartingPlayer('X');
    startNewRound('X');
  }

  // PUBLIC_INTERFACE
  function handleSquareClick(index) {
    const res = getWinner(board);
    if (res || aiThinking) return;
    if (board[index]) return;

    const next = board.slice();
    next[index] = xIsNext ? 'X' : 'O';
    const after = getWinner(next);

    if (after?.winner) {
      setBoard(next);
      setHighlight(after.line || []);
      updateScores(after.winner === 'draw' ? 'draw' : after.winner);
    } else {
      setBoard(next);
      setXIsNext((v) => !v);
    }
  }

  // PUBLIC_INTERFACE
  function changeMode(newMode) {
    setMode(newMode);
    // Reset round on mode change
    setStartingPlayer('X');
    startNewRound('X');
  }

  // PUBLIC_INTERFACE
  function toggleTheme() {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  return (
    <div className="ttt-app">
      <header className="topbar" role="banner" aria-label="Game Controls">
        <div className="brand">
          <div className="logo">TTT</div>
          <div className="titles">
            <h1 className="app-title">Tic Tac Toe</h1>
            <p className="subtitle">Play with a friend or challenge the AI</p>
          </div>
        </div>

        <div className="controls">
          <div className="mode-toggle" role="group" aria-label="Game Mode">
            <button
              className={`chip ${mode === MODES.PVP ? 'active' : ''}`}
              onClick={() => changeMode(MODES.PVP)}
            >
              👥 Player vs Player
            </button>
            <button
              className={`chip ${mode === MODES.AI ? 'active' : ''}`}
              onClick={() => changeMode(MODES.AI)}
            >
              🤖 Player vs AI
            </button>
          </div>

          <div className="actions">
            <button className="btn ghost" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <button className="btn" onClick={restartGame} aria-label="Restart current round">
              ↻ Restart
            </button>
            <button className="btn danger" onClick={resetAll} aria-label="Reset scores and game">
              ⛔ Reset
            </button>
          </div>
        </div>
      </header>

      <main className="content">
        <aside className="sidebar" aria-label="Scores and settings">
          <section className="card">
            <h2 className="card-title">Scoreboard</h2>
            <div className="scores">
              <div className="score">
                <span className="badge x">X</span>
                <span className="value">{scores.X}</span>
              </div>
              <div className="score">
                <span className="badge o">O</span>
                <span className="value">{scores.O}</span>
              </div>
              <div className="score">
                <span className="badge draw">=</span>
                <span className="value">{scores.draws}</span>
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Settings</h2>
            <div className="setting-row">
              <label className="label">Starting Player</label>
              <div className="toggle-group">
                <button
                  className={`chip ${startingPlayer === 'X' ? 'active' : ''}`}
                  onClick={() => setStartingPlayer('X')}
                >
                  X
                </button>
                <button
                  className={`chip ${startingPlayer === 'O' ? 'active' : ''}`}
                  onClick={() => setStartingPlayer('O')}
                >
                  O
                </button>
                <button
                  className="btn small"
                  onClick={() => startNewRound(startingPlayer)}
                >
                  New Round
                </button>
              </div>
            </div>

            <div className="setting-row">
              <label className="label">Theme</label>
              <div className="toggle-group">
                <button
                  className={`chip ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  Light
                </button>
                <button
                  className={`chip ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  Dark
                </button>
              </div>
            </div>
          </section>

          <section className="card tips">
            <h2 className="card-title">Tips</h2>
            <ul>
              <li>Tap a square to place your mark.</li>
              <li>Get 3 in a row to win.</li>
              <li>Use Restart for a rematch; Reset clears scores.</li>
            </ul>
          </section>
        </aside>

        <section className="board-area" aria-label="Game Board">
          <div className="status">
            <span className="status-pill">
              {aiThinking ? 'AI is thinking...' : status}
            </span>
          </div>

          <div className="board" role="grid" aria-label="Tic Tac Toe Board">
            {board.map((val, idx) => {
              const isHighlighted = highlight.includes(idx);
              return (
                <button
                  key={idx}
                  role="gridcell"
                  aria-label={`Cell ${idx + 1} ${val ? `occupied by ${val}` : 'empty'}`}
                  className={`cell ${val ? 'filled' : ''} ${isHighlighted ? 'win' : ''}`}
                  onClick={() => handleSquareClick(idx)}
                  disabled={!!getWinner(board) || !!val || (aiThinking && mode === MODES.AI)}
                >
                  {val === 'X' ? <span className="mark x">X</span> : val === 'O' ? <span className="mark o">O</span> : ''}
                </button>
              );
            })}
          </div>

          <div className="legend">
            <span className="legend-item">
              <span className="dot x" /> X
            </span>
            <span className="legend-item">
              <span className="dot o" /> O
            </span>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>Made with <span aria-hidden>💙</span> · Modern, lightweight React</span>
      </footer>
    </div>
  );
}

export default App;

# Tic Tac Toe Frontend (React)

Modern, light-themed, responsive Tic Tac Toe app.
- Modes: Player vs Player, Player vs AI
- Score tracking via localStorage
- Restart current round and Reset all
- Sidebar with scores and settings
- Accessible and mobile friendly

## Getting Started

- npm start
- npm test
- npm run build

Open http://localhost:3000 in your browser.

## How it works

- Scores are stored in localStorage under `ttt_scores_v1`
- Mode preference is stored as `ttt_mode_v1`
- Theme preference is stored as `ttt_theme_v1`
- AI plays as O by default; simple strategy: win > block > center > corner > side

## Folder Structure

- src/App.js: Main app logic and UI
- src/App.css: Styling and theme
- src/index.js: Entry point

Enjoy the game!

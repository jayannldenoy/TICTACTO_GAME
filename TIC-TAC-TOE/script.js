/* ============ VARIABLES (const / let bindings) ============ */
const HUMAN = "X";
const AI = "O";
const WIN_LINES = [               // DATA STRUCTURE: array of arrays (all 8 winning lines)
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];
const X_COLORS = ["#ff4d6d", "#ff9f1c", "#2ec4b6", "#4361ee", "#9b5de5", "#f15bb5", "#06d6a0", "#ef476f", "#118ab2"];
const RESULT_OF = { X: "win", O: "loss", draw: "draw" };   // DATA STRUCTURE: object (winner -> player's result)
const db = new GameDatabase();                             // the database from database.js
let playerName = "Player";                                 // set through prompt()
let scores = { win: 0, loss: 0, draw: 0 };                 // loaded from the database
let xMoveCount = 0;                                        // counts X moves to pick a new color each time

/* ============ CLASS (OOP) ============ */
class TicTacToe {
  constructor() {                // constructor sets up the initial state
    this.reset();
  }

  reset() {                      // method: start a fresh round
    this.board = Array(9).fill(null);
    this.over = false;
    this.winLine = null;
  }

  // Method: HIGHER-ORDER FUNCTIONS (map + filter) to list empty squares
  emptyCells() {
    return this.board.map((v, i) => (v === null ? i : -1)).filter(i => i !== -1);
  }

  // Method: place a mark if the square is free
  place(index, mark) {
    if (this.over || this.board[index] !== null) return false;
    this.board[index] = mark;
    console.log(`${mark} played square ${index}`);   // OUTPUT: console.log
    return true;
  }

  // Method: check for a winner or a draw and update state
  updateResult() {
    const result = findWinner(this.board);
    if (result) {
      this.over = true;
      this.winLine = result.line;
      return result.mark;
    }
    if (this.emptyCells().length === 0) {
      this.over = true;
      return "draw";
    }
    return null;
  }
}

/* ============ FUNCTIONS (reusable) ============ */

// Returns { mark, line } if someone has three in a row, else null
function findWinner(board) {
  for (let i = 0; i < WIN_LINES.length; i++) {          // LOOP 1: for loop
    const [a, b, c] = WIN_LINES[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {   // CONDITIONAL
      return { mark: board[a], line: WIN_LINES[i] };
    }
  }
  return null;
}

// Minimax: scores a board from the AI's point of view (AI = best score, human = worst)
function minimax(board, aiTurn, depth) {
  const result = findWinner(board);
  if (result) return result.mark === AI ? 10 - depth : depth - 10;
  const free = board.map((v, i) => (v === null ? i : -1)).filter(i => i !== -1);
  if (free.length === 0) return 0;

  // HIGHER-ORDER: map every possible move to the score it leads to
  const moveScores = free.map(i => {
    const copy = [...board];
    copy[i] = aiTurn ? AI : HUMAN;
    return minimax(copy, !aiTurn, depth + 1);
  });
  // HIGHER-ORDER: reduce to the best (AI) or worst (human) score
  return moveScores.reduce((best, s) => (aiTurn ? Math.max(best, s) : Math.min(best, s)));
}

// Picks the best square for the AI
function chooseAiMove(game) {
  let bestScore = -Infinity;
  let bestMove = null;
  const free = game.emptyCells();
  let i = 0;
  while (i < free.length) {                              // LOOP 2: while loop
    const copy = [...game.board];
    copy[free[i]] = AI;
    const score = minimax(copy, false, 1);
    if (score > bestScore) { bestScore = score; bestMove = free[i]; }
    i++;
  }
  return bestMove;
}

// INPUT: ask the player's name (falls back safely if prompt() is blocked)
function askPlayerName() {
  let name = "Player";
  try {
    const answer = prompt("Welcome to Tic-Tac-Toe! Enter your name:", "Player");
    if (answer && answer.trim()) name = answer.trim();
  } catch (err) {
    console.log("prompt() unavailable, using default name.");
  }
  console.log(`Hello, ${name}! You are X. Good luck!`);
  return name;
}

/* ============ GAME UI ============ */
const game = new TicTacToe();
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const scoreEl = document.getElementById("score");
const historyEl = document.getElementById("history");

// Build the 9 buttons once
const cells = Array.from({ length: 9 }, (_, i) => {
  const btn = document.createElement("button");
  btn.className = "cell";
  btn.setAttribute("aria-label", `Square ${i + 1}`);
  btn.addEventListener("click", () => humanMove(i));
  boardEl.appendChild(btn);
  return btn;
});

// Draw a mark on a square. Each X (human) move gets a NEW color from the palette.
function paint(index, mark) {
  const cell = cells[index];
  cell.textContent = mark;
  cell.disabled = true;
  if (mark === HUMAN) {
    const color = X_COLORS[xMoveCount % X_COLORS.length];
    cell.classList.add("x");
    cell.style.background = color;       // box color changes with every X move
    xMoveCount++;
  } else {
    cell.classList.add("o");
  }
}

// Show the totals stored in the database
function renderScore() {
  scoreEl.innerHTML =
    `<span>${playerName} (X): ${scores.win}</span>` +
    `<span>Draws: ${scores.draw}</span>` +
    `<span>AI (O): ${scores.loss}</span>`;
}

// Show recent games from the database (HIGHER-ORDER: map builds the list)
function renderHistory() {
  const rows = db.getHistory(playerName);
  historyEl.innerHTML = rows.length === 0
    ? "<li>No games yet</li>"
    : rows.map(r => `<li><span>${r.result.toUpperCase()}</span><span>${r.time}</span></li>`).join("");
}

// Handle the end of a round (winner, draw, or keep playing)
function finishIfOver() {
  const outcome = game.updateResult();
  switch (outcome) {                                    // CONDITIONAL: switch
    case HUMAN:
      statusEl.textContent = `🎉 ${playerName} wins!`;
      break;
    case AI:
      statusEl.textContent = "🤖 The AI wins!";
      break;
    case "draw":
      statusEl.textContent = "It’s a draw!";
      break;
    default:
      return false;                                     // game continues
  }

  db.recordResult(playerName, RESULT_OF[outcome]);      // save the result to the database
  scores = db.getPlayer(playerName);                    // reload the updated totals

  if (game.winLine) game.winLine.forEach(i => cells[i].classList.add("win"));
  cells.forEach(c => (c.disabled = true));
  renderScore();
  renderHistory();
  console.log(`Round over: ${outcome}. Scores:`, scores);
  return true;
}

function humanMove(index) {
  if (!game.place(index, HUMAN)) return;
  paint(index, HUMAN);
  if (finishIfOver()) return;

  statusEl.textContent = "AI is thinking…";
  setTimeout(() => {                                    // small delay feels more natural
    const move = chooseAiMove(game);
    game.place(move, AI);
    paint(move, AI);
    if (!finishIfOver()) statusEl.textContent = `${playerName}, it’s your turn (X)`;
  }, 450);
}

function newGame() {
  game.reset();
  xMoveCount = 0;
  cells.forEach(c => {
    c.textContent = "";
    c.disabled = false;
    c.className = "cell";
    c.style.background = "";
  });
  statusEl.textContent = `${playerName}, it’s your turn (X)`;
  scores = db.getPlayer(playerName);
  renderScore();
  renderHistory();
}

// Buttons
document.getElementById("restart").addEventListener("click", newGame);
document.getElementById("clear").addEventListener("click", () => {
  db.clear();
  newGame();
});

// Start the game
playerName = askPlayerName();
newGame();


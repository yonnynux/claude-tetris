'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const COLORS = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#64b5f6', // J - pale blue
  '#ffb74d', // L - orange
  '#e91e63', // Nut - magenta
  '#ffeb3b', // Lightning - bright yellow
];

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  [[8,8,8],[8,0,8],[8,8,8]],                  // Nut (tuerca, centro hueco)
  [[9]],                                        // Lightning (1x1 power-up)
];

const LINE_SCORES = [0, 100, 300, 500, 800];
const MAX_RECORDS = 5;
const RECORDS_KEY = 'tetris-records';

const LIGHTNING_TYPE = 9;
const LIGHTNING_INTERVAL = 5; // lines between lightning spawns

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const comboEl = document.getElementById('combo');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const themeToggleEl = document.getElementById('theme-toggle');
const startOverlay = document.getElementById('start-overlay');
const playBtn = document.getElementById('play-btn');
const resetRecordsBtn = document.getElementById('reset-records-btn');
const startRecordsBody = document.getElementById('start-records-body');
const saveRecordSection = document.getElementById('save-record-section');
const playerNameInput = document.getElementById('player-name-input');
const saveRecordBtn = document.getElementById('save-record-btn');
const gameoverRecordsSection = document.getElementById('gameover-records-section');
const gameoverRecordsBody = document.getElementById('gameover-records-body');

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId;
let pendingLightning, nextLightningLines, lightningFlash;
let combo, maxCombo;

// ---- Records ----

function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveRecord(name, recordScore, recordLines, recordMaxCombo) {
  const records = loadRecords();
  records.push({ name: name.trim() || 'Anónimo', score: recordScore, lines: recordLines, maxCombo: recordMaxCombo });
  records.sort((a, b) => b.score - a.score);
  records.splice(MAX_RECORDS);
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  return records;
}

function qualifiesForTop5(currentScore) {
  const records = loadRecords();
  if (records.length < MAX_RECORDS) return true;
  return currentScore > records[records.length - 1].score;
}

function renderRecordsTable(tbody, records, highlightScore) {
  tbody.innerHTML = '';
  if (records.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.textContent = 'Sin records aún';
    td.className = 'records-empty';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  records.forEach((r, i) => {
    const tr = document.createElement('tr');
    if (highlightScore !== undefined && r.score === highlightScore) {
      tr.className = 'record-new';
    }
    tr.innerHTML = `<td>${i + 1}</td><td>${r.name}</td><td>${r.score.toLocaleString()}</td><td>${r.lines}</td><td>${r.maxCombo}</td>`;
    tbody.appendChild(tr);
  });
}

// ---- Board / pieces ----

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function createLightningPiece() {
  return { type: LIGHTNING_TYPE, shape: [[LIGHTNING_TYPE]], x: Math.floor(COLS / 2), y: 0 };
}

function randomPiece() {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    if (lines >= nextLightningLines) {
      pendingLightning = true;
      nextLightningLines = Math.floor(lines / LIGHTNING_INTERVAL) * LIGHTNING_INTERVAL + LIGHTNING_INTERVAL;
    }
    updateHUD();
  } else {
    combo = 0;
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function activateLightning(lx, ly) {
  lightningFlash = 12;
  board.splice(ly, 1);
  board.unshift(new Array(COLS).fill(0));
  for (let r = 0; r < ROWS; r++) board[r][lx] = 0;
  score += 500 * level;
  updateHUD();
}

function lockPiece() {
  if (current.type === LIGHTNING_TYPE) {
    activateLightning(current.x, current.y);
    spawn();
    return;
  }
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  if (pendingLightning) {
    next = createLightningPiece();
    pendingLightning = false;
  } else {
    next = randomPiece();
  }
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
  comboEl.textContent = combo;
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = COLORS[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  if (colorIndex === LIGHTNING_TYPE) {
    context.fillStyle = '#222';
    context.font = `bold ${size - 6}px sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('⚡', x * size + size / 2, y * size + size / 2 + 1);
  } else {
    context.fillStyle = 'rgba(255,255,255,0.12)';
    context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  }
  context.globalAlpha = 1;
}

function drawGrid() {
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-grid').trim();
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  // board
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  // ghost
  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  // current piece
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);

  // lightning flash overlay
  if (lightningFlash > 0) {
    ctx.globalAlpha = (lightningFlash / 12) * 0.55;
    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    lightningFlash--;
  }
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()} | Líneas: ${lines} | Combo max: ${maxCombo}`;

  // Determine if score qualifies for top 5
  if (qualifiesForTop5(score)) {
    saveRecordSection.classList.remove('hidden');
    gameoverRecordsSection.classList.add('hidden');
    playerNameInput.value = '';
    playerNameInput.focus();
  } else {
    saveRecordSection.classList.add('hidden');
    const records = loadRecords();
    renderRecordsTable(gameoverRecordsBody, records);
    gameoverRecordsSection.classList.remove('hidden');
  }

  overlay.classList.remove('hidden');
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  if (!paused) {
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    overlayTitle.textContent = 'PAUSA';
    overlayScore.textContent = '';
    saveRecordSection.classList.add('hidden');
    gameoverRecordsSection.classList.add('hidden');
    overlay.classList.remove('hidden');
  }
}

function loop(ts) {
  if (gameOver || paused) return;
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
      if (gameOver) return;
    }
  }
  draw();
  animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  combo = 0;
  maxCombo = 0;
  paused = false;
  gameOver = false;
  dropInterval = 1000;
  dropAccum = 0;
  pendingLightning = false;
  nextLightningLines = LIGHTNING_INTERVAL;
  lightningFlash = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  // Hide both overlays
  startOverlay.classList.add('hidden');
  overlay.classList.add('hidden');
  saveRecordSection.classList.add('hidden');
  gameoverRecordsSection.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

// ---- Event listeners ----

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP') { togglePause(); return; }
  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);

playBtn.addEventListener('click', init);

resetRecordsBtn.addEventListener('click', () => {
  localStorage.removeItem(RECORDS_KEY);
  renderRecordsTable(startRecordsBody, []);
});

saveRecordBtn.addEventListener('click', () => {
  const name = playerNameInput.value.trim() || 'Anónimo';
  const records = saveRecord(name, score, lines, maxCombo);
  saveRecordSection.classList.add('hidden');
  renderRecordsTable(gameoverRecordsBody, records, score);
  gameoverRecordsSection.classList.remove('hidden');
  // Also update start screen table for next visit
  renderRecordsTable(startRecordsBody, records);
});

// Allow pressing Enter to save record
playerNameInput.addEventListener('keydown', e => {
  if (e.code === 'Enter') saveRecordBtn.click();
});

function applyTheme(light) {
  if (light) {
    document.documentElement.dataset.theme = 'light';
  } else {
    delete document.documentElement.dataset.theme;
  }
  themeToggleEl.checked = light;
  localStorage.setItem('tetris-theme', light ? 'light' : 'dark');
}

themeToggleEl.addEventListener('change', () => applyTheme(themeToggleEl.checked));

// Restore saved theme (default: dark)
applyTheme(localStorage.getItem('tetris-theme') === 'light');

// Show start screen on load, populate records table
const initialRecords = loadRecords();
renderRecordsTable(startRecordsBody, initialRecords);

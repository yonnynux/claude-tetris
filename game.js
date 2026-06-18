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

const LIGHTNING_TYPE = 9;
const LIGHTNING_INTERVAL = 5; // lines between lightning spawns

// ---- Skins ----

const NEON_COLORS = [
  null,
  '#00fff5', // I
  '#ffe600', // O
  '#cc00ff', // T
  '#00ff66', // S
  '#ff2244', // Z
  '#0088ff', // J
  '#ff8800', // L
  '#ff00aa', // Nut
  '#ffff00', // Lightning
];

const PASTEL_COLORS = [
  null,
  '#b2eaf2', // I
  '#fff3b0', // O
  '#ddb8f0', // T
  '#c5e8c7', // S
  '#f5b8b8', // Z
  '#b8d8f5', // J
  '#ffd9b0', // L
  '#f5b8d8', // Nut
  '#fffaaa', // Lightning
];

const PIXEL_COLORS = [
  null,
  '#38b6c8', // I
  '#c8a000', // O
  '#8040a0', // T
  '#408040', // S
  '#a03030', // Z
  '#3060a0', // J
  '#c07030', // L
  '#a01060', // Nut
  '#c0b000', // Lightning
];

function drawLightningEmoji(context, x, y, size) {
  context.fillStyle = '#222';
  context.font = `bold ${size - 6}px sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('⚡', x * size + size / 2, y * size + size / 2 + 1);
}

const SKINS = {
  retro: {
    colors: COLORS,
    paintBlock(context, x, y, colorIndex, size, alpha) {
      const color = this.colors[colorIndex];
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      if (colorIndex === LIGHTNING_TYPE) {
        drawLightningEmoji(context, x, y, size);
      } else {
        context.fillStyle = 'rgba(255,255,255,0.12)';
        context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
      }
      context.globalAlpha = 1;
    },
  },

  neon: {
    colors: NEON_COLORS,
    paintBlock(context, x, y, colorIndex, size, alpha) {
      const color = this.colors[colorIndex];
      context.globalAlpha = alpha ?? 1;
      context.shadowBlur = 15;
      context.shadowColor = color;
      context.fillStyle = color;
      context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
      context.shadowBlur = 0;
      context.strokeStyle = 'rgba(255,255,255,0.6)';
      context.lineWidth = 1;
      context.strokeRect(x * size + 1.5, y * size + 1.5, size - 3, size - 3);
      if (colorIndex === LIGHTNING_TYPE) {
        drawLightningEmoji(context, x, y, size);
      }
      context.globalAlpha = 1;
    },
  },

  pastel: {
    colors: PASTEL_COLORS,
    paintBlock(context, x, y, colorIndex, size, alpha) {
      const color = this.colors[colorIndex];
      context.globalAlpha = alpha ?? 1;
      context.fillStyle = color;
      const px = x * size + 2;
      const py = y * size + 2;
      const w = size - 4;
      const h = size - 4;
      const rad = 5;
      if (context.roundRect) {
        context.beginPath();
        context.roundRect(px, py, w, h, rad);
        context.fill();
      } else {
        context.beginPath();
        context.moveTo(px + rad, py);
        context.lineTo(px + w - rad, py);
        context.quadraticCurveTo(px + w, py, px + w, py + rad);
        context.lineTo(px + w, py + h - rad);
        context.quadraticCurveTo(px + w, py + h, px + w - rad, py + h);
        context.lineTo(px + rad, py + h);
        context.quadraticCurveTo(px, py + h, px, py + h - rad);
        context.lineTo(px, py + rad);
        context.quadraticCurveTo(px, py, px + rad, py);
        context.closePath();
        context.fill();
      }
      if (colorIndex === LIGHTNING_TYPE) {
        drawLightningEmoji(context, x, y, size);
      }
      context.globalAlpha = 1;
    },
  },

  pixel: {
    colors: PIXEL_COLORS,
    paintBlock(context, x, y, colorIndex, size, alpha) {
      const color = this.colors[colorIndex];
      context.globalAlpha = alpha ?? 1;
      const bx = x * size;
      const by = y * size;
      context.fillStyle = '#111';
      context.fillRect(bx, by, size, size);
      context.fillStyle = color;
      context.fillRect(bx + 1, by + 1, size - 2, size - 2);
      const ps = Math.max(2, Math.floor(size / 8));
      context.fillStyle = 'rgba(255,255,255,0.35)';
      context.fillRect(bx + 2, by + 2, ps, ps);
      context.fillRect(bx + 2 + ps, by + 2, ps, ps);
      context.fillRect(bx + 2, by + 2 + ps, ps, ps);
      context.fillStyle = 'rgba(0,0,0,0.25)';
      context.fillRect(bx + size - 2 - ps, by + size - 2 - ps, ps, ps);
      if (colorIndex === LIGHTNING_TYPE) {
        drawLightningEmoji(context, x, y, size);
      }
      context.globalAlpha = 1;
    },
  },
};

let currentSkin = 'retro';

function setSkin(name) {
  if (!SKINS[name]) return;
  currentSkin = name;
  localStorage.setItem('tetris-skin', name);
  canvas.classList.toggle('skin-neon', name === 'neon');
  const skinSelectEl = document.getElementById('skin-select');
  if (skinSelectEl) skinSelectEl.value = name;
  draw();
  drawNext();
}

// ---- DOM references ----

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayScore = document.getElementById('overlay-score');
const restartBtn = document.getElementById('restart-btn');
const themeToggleEl = document.getElementById('theme-toggle');

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId;
let pendingLightning, nextLightningLines, lightningFlash;

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
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    if (lines >= nextLightningLines) {
      pendingLightning = true;
      nextLightningLines = Math.floor(lines / LIGHTNING_INTERVAL) * LIGHTNING_INTERVAL + LIGHTNING_INTERVAL;
    }
    updateHUD();
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
}

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  SKINS[currentSkin].paintBlock(context, x, y, colorIndex, size, alpha);
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
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
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
  overlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

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

// Skin selector
const skinSelectEl = document.getElementById('skin-select');
skinSelectEl.addEventListener('change', () => setSkin(skinSelectEl.value));

// Restore saved skin (default: retro)
const savedSkin = localStorage.getItem('tetris-skin');
if (savedSkin && SKINS[savedSkin]) {
  currentSkin = savedSkin;
  canvas.classList.toggle('skin-neon', savedSkin === 'neon');
  skinSelectEl.value = savedSkin;
}

init();

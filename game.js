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
  '#82b1ff', // J - pale blue
  '#ffb74d', // L - orange
];

// ---- Skins ----
// Cada skin define su paleta (1-indexada, igual que COLORS/PIECES), el color de
// rejilla por tema y una función `block` que dibuja una celda en píxeles ya
// resueltos. `block` no debe tocar globalAlpha (lo maneja drawBlock).
function roundRectPath(context, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + rad, y);
  context.lineTo(x + w - rad, y);
  context.quadraticCurveTo(x + w, y, x + w, y + rad);
  context.lineTo(x + w, y + h - rad);
  context.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  context.lineTo(x + rad, y + h);
  context.quadraticCurveTo(x, y + h, x, y + h - rad);
  context.lineTo(x, y + rad);
  context.quadraticCurveTo(x, y, x + rad, y);
  context.closePath();
}

// Aclara/oscurece un color hex (#rrggbb) por un factor (-1..1).
function shade(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const mix = (ch) => {
    const v = amount >= 0
      ? ch + (255 - ch) * amount
      : ch * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(v)));
  };
  const r = mix((num >> 16) & 0xff);
  const g = mix((num >> 8) & 0xff);
  const b = mix(num & 0xff);
  return `rgb(${r},${g},${b})`;
}

const SKINS = {
  retro: {
    label: 'Retro',
    colors: COLORS,
    grid: { dark: '#22222e', light: '#dfe3f0' },
    block(context, px, py, size, color, highlight) {
      context.fillStyle = color;
      context.fillRect(px + 1, py + 1, size - 2, size - 2);
      context.fillStyle = highlight;
      context.fillRect(px + 1, py + 1, size - 2, 4);
    },
  },

  neon: {
    label: 'Neon',
    colors: [
      null,
      '#00f0ff', // I
      '#fff320', // O
      '#e040fb', // T
      '#39ff14', // S
      '#ff1e56', // Z
      '#3d7bff', // J
      '#ff9100', // L
    ],
    grid: { dark: '#101024', light: '#101024' },
    block(context, px, py, size, color) {
      const x = px + 2, y = py + 2, s = size - 4;
      context.save();
      context.shadowColor = color;
      context.shadowBlur = size * 0.45;
      context.fillStyle = shade(color, -0.75);
      context.fillRect(x, y, s, s);
      context.strokeStyle = color;
      context.lineWidth = 2;
      context.strokeRect(x + 1, y + 1, s - 2, s - 2);
      context.restore();
      // núcleo brillante, sin glow para que no se sature
      context.fillStyle = color;
      context.globalAlpha *= 0.35;
      context.fillRect(x + 4, y + 4, s - 8, s - 8);
    },
  },

  pastel: {
    label: 'Pastel',
    colors: [
      null,
      '#a8e6e4', // I
      '#fdf1a8', // O
      '#d9c2f0', // T
      '#bfe3c4', // S
      '#f6bfc4', // Z
      '#c2d4f7', // J
      '#fbd4ab', // L
    ],
    grid: { dark: '#26263a', light: '#e8ebf5' },
    block(context, px, py, size, color) {
      const r = Math.max(3, size * 0.28);
      roundRectPath(context, px + 1.5, py + 1.5, size - 3, size - 3, r);
      context.fillStyle = color;
      context.fill();
      context.strokeStyle = shade(color, -0.25);
      context.lineWidth = 1.5;
      context.stroke();
      // brillo suave arriba a la izquierda
      roundRectPath(context, px + 4, py + 4, (size - 8) * 0.55, (size - 8) * 0.35, r * 0.6);
      context.fillStyle = shade(color, 0.55);
      context.fill();
    },
  },

  pixel: {
    label: 'Pixel art',
    colors: [
      null,
      '#2ab7c8', // I
      '#e8c022', // O
      '#9b4fc0', // T
      '#5aa94b', // S
      '#c8453c', // Z
      '#4a6fd4', // J
      '#e08a2e', // L
    ],
    grid: { dark: '#1e1e2c', light: '#d8dced' },
    block(context, px, py, size, color) {
      const unit = size / 6;
      context.fillStyle = color;
      context.fillRect(px, py, size, size);
      // bisel estilo 8-bit: luz arriba/izquierda, sombra abajo/derecha
      context.fillStyle = shade(color, 0.4);
      context.fillRect(px, py, size, unit);
      context.fillRect(px, py, unit, size);
      context.fillStyle = shade(color, -0.4);
      context.fillRect(px, py + size - unit, size, unit);
      context.fillRect(px + size - unit, py, unit, size);
      // textura de píxeles sueltos
      context.fillStyle = shade(color, 0.25);
      context.fillRect(px + unit * 2, py + unit * 2, unit, unit);
      context.fillRect(px + unit * 3, py + unit * 3, unit, unit);
      context.fillStyle = shade(color, -0.25);
      context.fillRect(px + unit * 4, py + unit * 2, unit, unit);
      context.fillRect(px + unit * 2, py + unit * 4, unit, unit);
      context.fillRect(px + unit * 4, py + unit * 4, unit, unit);
    },
  },
};

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
];

const LINE_SCORES = [0, 100, 300, 500, 800];

const THEME_COLORS = {
  dark: { ghostHighlight: 'rgba(255,255,255,0.12)' },
  light: { ghostHighlight: 'rgba(0,0,0,0.1)' },
};

const THEME_STORAGE_KEY = 'tetris-theme';
const SKIN_STORAGE_KEY = 'tetris-skin';
const DEFAULT_SKIN = 'retro';
const themeToggleBtn = document.getElementById('theme-toggle');
const skinSelect = document.getElementById('skin-select');
let theme = 'dark';
let skin = SKINS[DEFAULT_SKIN];

function redraw() {
  if (current) {
    draw();
    drawNext();
  }
}

function applyTheme(name) {
  theme = name;
  document.documentElement.setAttribute('data-theme', name);
  themeToggleBtn.textContent = name === 'light' ? '☀️' : '🌙';
  localStorage.setItem(THEME_STORAGE_KEY, name);
}

function toggleTheme() {
  applyTheme(theme === 'dark' ? 'light' : 'dark');
  redraw();
}

function applySkin(name) {
  const key = SKINS[name] ? name : DEFAULT_SKIN;
  skin = SKINS[key];
  document.documentElement.setAttribute('data-skin', key);
  skinSelect.value = key;
  localStorage.setItem(SKIN_STORAGE_KEY, key);
  redraw();
}

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

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId;

for (const [key, def] of Object.entries(SKINS)) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = def.label;
  skinSelect.appendChild(opt);
}

applyTheme(localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark');
applySkin(localStorage.getItem(SKIN_STORAGE_KEY) || DEFAULT_SKIN);
themeToggleBtn.addEventListener('click', toggleTheme);
skinSelect.addEventListener('change', () => applySkin(skinSelect.value));

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 7) + 1;
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

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
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
  context.save();
  context.globalAlpha = alpha ?? 1;
  skin.block(context, x * size, y * size, size, skin.colors[colorIndex], THEME_COLORS[theme].ghostHighlight);
  context.restore();
}

function drawGrid() {
  ctx.strokeStyle = skin.grid[theme];
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
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
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

init();

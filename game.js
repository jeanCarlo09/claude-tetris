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
  dark: { grid: '#22222e', ghostHighlight: 'rgba(255,255,255,0.12)' },
  light: { grid: '#dfe3f0', ghostHighlight: 'rgba(0,0,0,0.1)' },
};

const THEME_STORAGE_KEY = 'tetris-theme';
const themeToggleBtn = document.getElementById('theme-toggle');
let theme = 'dark';

function applyTheme(name) {
  theme = name;
  document.documentElement.setAttribute('data-theme', name);
  themeToggleBtn.textContent = name === 'light' ? '☀️' : '🌙';
  localStorage.setItem(THEME_STORAGE_KEY, name);
}

function toggleTheme() {
  applyTheme(theme === 'dark' ? 'light' : 'dark');
  if (current) {
    draw();
    drawNext();
  }
}

applyTheme(localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark');
themeToggleBtn.addEventListener('click', toggleTheme);

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
const startOverlay = document.getElementById('start-overlay');
const startRecordsTable = document.getElementById('start-records-table');
const playBtn = document.getElementById('play-btn');
const resetRecordsBtn = document.getElementById('reset-records-btn');
const gameoverRecords = document.getElementById('gameover-records');
const gameoverStats = document.getElementById('gameover-stats');
const gameoverNameForm = document.getElementById('gameover-name-form');
const gameoverRecordsTable = document.getElementById('gameover-records-table');
const nameInput = document.getElementById('name-input');
const saveNameBtn = document.getElementById('save-name-btn');

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId;
let started = false;
let combo, maxCombo, maxLines;

/* ---------- Records (localStorage) ---------- */

const RECORDS_STORAGE_KEY = 'tetris-records';
const MAX_RECORDS = 5;

function toInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

function normalizeRecord(raw) {
  return {
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 12) : 'Anónimo',
    score: toInt(raw.score, 0),
    lines: toInt(raw.lines, 0),
    level: toInt(raw.level, 1),
    maxCombo: toInt(raw.maxCombo, 0),
    maxLines: toInt(raw.maxLines, 0),
    date: typeof raw.date === 'string' ? raw.date : '',
  };
}

function loadRecords() {
  try {
    const raw = localStorage.getItem(RECORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(r => r && typeof r === 'object')
      .map(normalizeRecord)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RECORDS);
  } catch (e) {
    return [];
  }
}

function saveRecords(records) {
  try {
    localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    /* almacenamiento no disponible: se ignora */
  }
}

function qualifiesForRecords(value) {
  if (value <= 0) return false;
  const records = loadRecords();
  return records.length < MAX_RECORDS || value > records[records.length - 1].score;
}

function insertRecord(record) {
  const records = loadRecords();
  records.push(record);
  records.sort((a, b) => b.score - a.score);
  const trimmed = records.slice(0, MAX_RECORDS);
  saveRecords(trimmed);
  return trimmed.indexOf(record);
}

function cell(tag, text, className) {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  return el;
}

const RECORD_HEADERS = ['#', 'Nombre', 'Puntos', 'Líneas', 'Nivel', 'Combo', 'Máx', 'Fecha'];

function renderRecords(container, highlightIndex) {
  const records = loadRecords();
  container.textContent = '';

  if (!records.length) {
    container.appendChild(cell('p', 'Aún no hay records. ¡Sé el primero!', 'records-empty'));
    return;
  }

  const table = document.createElement('table');
  table.className = 'records-table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  RECORD_HEADERS.forEach(h => headRow.appendChild(cell('th', h)));
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  records.forEach((r, i) => {
    const row = document.createElement('tr');
    row.className = i === highlightIndex ? 'record-row highlight' : 'record-row';
    row.appendChild(cell('td', String(i + 1)));
    row.appendChild(cell('td', r.name, 'record-name'));
    row.appendChild(cell('td', r.score.toLocaleString()));
    row.appendChild(cell('td', String(r.lines)));
    row.appendChild(cell('td', String(r.level)));
    row.appendChild(cell('td', String(r.maxCombo)));
    row.appendChild(cell('td', String(r.maxLines)));
    row.appendChild(cell('td', r.date, 'record-date'));
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  container.appendChild(table);
}

function resetRecords() {
  if (!confirm('¿Seguro que quieres borrar todos los records?')) return;
  try {
    localStorage.removeItem(RECORDS_STORAGE_KEY);
  } catch (e) {
    /* almacenamiento no disponible: se ignora */
  }
  renderRecords(startRecordsTable, -1);
  if (!gameoverRecords.classList.contains('hidden')) {
    gameoverNameForm.classList.add('hidden');
    renderRecords(gameoverRecordsTable, -1);
  }
}

function saveCurrentRecord() {
  const rawName = nameInput.value.trim();
  const record = {
    name: rawName ? rawName.slice(0, 12) : 'Anónimo',
    score,
    lines,
    level,
    maxCombo,
    maxLines,
    date: new Date().toLocaleDateString('es-ES'),
  };
  const index = insertRecord(record);
  gameoverNameForm.classList.add('hidden');
  renderRecords(gameoverRecordsTable, index);
  renderRecords(startRecordsTable, -1);
}

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
    combo++;
    if (combo > maxCombo) maxCombo = combo;
    if (cleared > maxLines) maxLines = cleared;
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    updateHUD();
  }
  return cleared;
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
  if (!clearLines()) combo = 0;
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
    return;
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
  const color = COLORS[colorIndex];
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  // highlight
  context.fillStyle = THEME_COLORS[theme].ghostHighlight;
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  context.globalAlpha = 1;
}

function drawGrid() {
  ctx.strokeStyle = THEME_COLORS[theme].grid;
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
  started = false;
  cancelAnimationFrame(animId);
  animId = null;
  overlayTitle.textContent = 'GAME OVER';
  overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;

  gameoverStats.textContent = `Mejor combo: ${maxCombo} · Líneas máximas: ${maxLines}`;
  nameInput.value = '';
  if (qualifiesForRecords(score)) {
    gameoverNameForm.classList.remove('hidden');
    setTimeout(() => nameInput.focus(), 0);
  } else {
    gameoverNameForm.classList.add('hidden');
  }
  renderRecords(gameoverRecordsTable, -1);
  gameoverRecords.classList.remove('hidden');

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
    }
  }
  draw();
  // lockPiece() pudo terminar la partida en este mismo frame
  if (gameOver || paused) return;
  animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  combo = 0;
  maxCombo = 0;
  maxLines = 0;
  paused = false;
  gameOver = false;
  started = true;
  dropInterval = 1000;
  dropAccum = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  gameoverRecords.classList.add('hidden');
  gameoverNameForm.classList.add('hidden');
  overlay.classList.add('hidden');
  startOverlay.classList.add('hidden');
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

document.addEventListener('keydown', e => {
  if (!started) return;
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
resetRecordsBtn.addEventListener('click', resetRecords);
saveNameBtn.addEventListener('click', saveCurrentRecord);
nameInput.addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Enter') saveCurrentRecord();
});

renderRecords(startRecordsTable, -1);

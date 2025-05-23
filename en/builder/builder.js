let currentStart = null;
let testPassed = false;
let lastVerifiedSeed = null;

window.addEventListener('load', () => {
  console.log('[Loaded] Board generation started');
  generateBoard();
});

function generateBoard() {
  const rows = parseInt(document.getElementById('rowsInput').value);
  const cols = parseInt(document.getElementById('colsInput').value);
  const board = document.getElementById('boardBuilder');
  board.innerHTML = '';

  const cellSize = window.innerWidth < 480 ? 30 : 40;
  board.style.gridTemplateRows = `repeat(${rows}, ${cellSize}px)`;
  board.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;
  currentStart = null;
  testPassed = false;
  lastVerifiedSeed = null;

  console.log(`[Board Generated] Rows: ${rows}, Cols: ${cols}`);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = document.createElement('div');
      cell.className = 'builder-cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener('click', () => handleCellClick(cell));
      board.appendChild(cell);
    }
  }
}

function handleCellClick(cell) {
  if (cell.classList.contains('start')) {
    cell.classList.remove('start');
    currentStart = null;
  } else if (!currentStart) {
    if (cell.classList.contains('blocked')) return;
    cell.classList.add('start');
    currentStart = { x: parseInt(cell.dataset.x), y: parseInt(cell.dataset.y) };
  } else {
    cell.classList.toggle('blocked');
  }
}

function getSeedObject() {
  const rows = parseInt(document.getElementById('rowsInput').value);
  const cols = parseInt(document.getElementById('colsInput').value);
  const cells = document.querySelectorAll('.builder-cell');
  const blocked = [];

  cells.forEach(cell => {
    if (cell.classList.contains('blocked')) {
      blocked.push([parseInt(cell.dataset.x), parseInt(cell.dataset.y)]);
    }
  });

  if (!currentStart) {
    alert("Please set the starting position (orange cell).");
    return null;
  }

  const seed = { rows, cols, blocked, start: currentStart };
  console.log("[🔍 Seed Created] Blocked cells:", seed.blocked);
  return seed;
}

function testPuzzle() {
  console.log('[🧪 Test Started]');
  const seed = getSeedObject();
  if (!seed) return;

  const board = document.getElementById('boardBuilder');
  board.innerHTML = '';
  board.style.gridTemplateRows = '';
  board.style.gridTemplateColumns = '';

  const table = document.createElement('table');
  table.className = 'board';

  const boardData = [];
  for (let y = 0; y < seed.rows; y++) {
    const tr = document.createElement('tr');
    const row = [];
    for (let x = 0; x < seed.cols; x++) {
      const td = document.createElement('td');
      td.className = (x + y) % 2 === 0 ? 'light' : 'dark';
      td.dataset.x = x;
      td.dataset.y = y;
      tr.appendChild(td);
      row.push({ el: td, visited: false, blocked: false });
    }
    table.appendChild(tr);
    boardData.push(row);
  }

  seed.blocked.forEach(([x, y]) => {
    boardData[y][x].blocked = true;
    boardData[y][x].el.style.backgroundColor = '#999';
  });

  let current = null;
  let moveCount = 0;

  function highlight(x, y) {
    boardData[y][x].el.classList.add('current');
  }

  function clearHighlight() {
    boardData.forEach(row => row.forEach(cell => cell.el.classList.remove('current')));
  }

  function onClick(e) {
    const x = +e.target.dataset.x;
    const y = +e.target.dataset.y;
    const cell = boardData[y][x];
    if (cell.visited || cell.blocked) return;

    if (!current) {
      if (x !== seed.start.x || y !== seed.start.y) return;
    } else {
      const dx = Math.abs(x - current.x);
      const dy = Math.abs(y - current.y);
      if (!((dx === 2 && dy === 1) || (dx === 1 && dy === 2))) return;
    }

    cell.visited = true;
    cell.el.textContent = ++moveCount;
    clearHighlight();
    cell.el.classList.add('current');
    current = { x, y };

    if (moveCount === (seed.rows * seed.cols - seed.blocked.length)) {
      alert("🎉 Puzzle cleared! You can now submit it.");
      testPassed = true;
      lastVerifiedSeed = seed;
      console.log('[✅ Test Passed]');
    }
  }

  board.innerHTML = '';
  board.appendChild(table);
  boardData.forEach(row => row.forEach(cell => cell.el.addEventListener('click', onClick)));
  highlight(seed.start.x, seed.start.y);
}

function checkPuzzleUploadThrottle() {
  const now = Date.now();
  const lastUpload = localStorage.getItem("lastPuzzleUpload");

  if (lastUpload && now - parseInt(lastUpload, 10) < 10000) {
    const waitSec = ((10000 - (now - lastUpload)) / 1000).toFixed(1);
    alert(`⏱ You can submit a puzzle only once every 10 seconds.\n(Please wait ${waitSec} seconds)`);
    return false;
  }

  localStorage.setItem("lastPuzzleUpload", now);
  console.log(`[✅ Throttle] Puzzle submission allowed (last: ${lastUpload})`);
  return true;
}

function postPuzzle() {
  console.log('[📬 Attempting to submit puzzle]');

  if (!checkPuzzleUploadThrottle()) return;

  const title = document.getElementById('puzzleTitle').value.trim();
  const author = document.getElementById('authorName').value.trim();
  const description = document.getElementById('puzzleDesc').value.trim();
  const seed = lastVerifiedSeed;

  if (!seed) {
    alert("No puzzle seed found. Please complete the test play first.");
    return;
  }
  if (!title || !author) {
    alert("Please enter a puzzle title and your nickname.");
    return;
  }
  if (!testPassed) {
    alert("Please complete the test play before submitting.");
    return;
  }

  const encodedSeed = btoa(JSON.stringify(seed));
  console.log('[📦 Seed to be saved]', seed);
  console.log('[📦 Encoded seed]', encodedSeed);

  const data = {
    title,
    author,
    description: description || "",
    seed: encodedSeed,
    createdAt: Date.now()
  };

  if (typeof window.postPuzzleToDB !== 'function') {
    console.error('[🚨 ERROR] postPuzzleToDB is not defined.');
    alert("Internal error: Firebase module not loaded.");
    return;
  }

  window.postPuzzleToDB(data).then((ref) => {
    const puzzleId = ref.key;
    const url = `${window.location.origin}/knight-tour-ko/board/?puzzle=${puzzleId}`;
    console.log('[✅ Puzzle posted successfully] ID:', puzzleId);
    alert("✅ Puzzle has been posted successfully!");
    document.getElementById("seedOutput").textContent = url;
  }).catch(err => {
    console.error("❌ Puzzle post failed", err);
    alert("Failed to save to Firebase. Please check the console.");
  });
}

// Global connection
window.generateBoard = generateBoard;
window.testPuzzle = testPuzzle;
window.postPuzzle = postPuzzle;

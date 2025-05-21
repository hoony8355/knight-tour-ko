// ✅ 통합된 builder.js (playPuzzle + renderBoard 포함)

let currentStart = null;
let testPassed = false;

window.addEventListener('load', generateBoard);

function generateBoard() {
  const rows = parseInt(document.getElementById('rowsInput').value);
  const cols = parseInt(document.getElementById('colsInput').value);
  const board = document.getElementById('boardBuilder');
  board.innerHTML = '';
  board.style.gridTemplateRows = `repeat(${rows}, 40px)`;
  board.style.gridTemplateColumns = `repeat(${cols}, 40px)`;
  currentStart = null;
  testPassed = false;

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
    return;
  }
  if (!currentStart) {
    if (cell.classList.contains('blocked')) return;
    cell.classList.add('start');
    currentStart = { x: parseInt(cell.dataset.x), y: parseInt(cell.dataset.y) };
    return;
  }
  cell.classList.toggle('blocked');
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
    alert("시작 위치를 설정해주세요 (주황색 칸)");
    return null;
  }

  return { rows, cols, blocked, start: currentStart };
}

function renderBoard(container, seed) {
  const { rows, cols, blocked, start } = seed;
  container.innerHTML = '';

  const table = document.createElement('table');
  table.className = 'board';

  for (let y = 0; y < rows; y++) {
    const tr = document.createElement('tr');
    for (let x = 0; x < cols; x++) {
      const td = document.createElement('td');
      td.className = (x + y) % 2 === 0 ? 'light' : 'dark';
      td.dataset.x = x;
      td.dataset.y = y;

      if (blocked.some(([bx, by]) => bx === x && by === y)) {
        td.style.backgroundColor = '#999';
      }

      if (start?.x === x && start?.y === y) {
        td.style.outline = '3px solid orange';
      }

      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  container.appendChild(table);
}

function playPuzzle(container, seed) {
  const { rows, cols, blocked, start } = seed;
  if (!start) {
    alert("시작 위치가 설정되지 않았습니다.");
    return;
  }

  const board = [];
  container.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'board';

  for (let y = 0; y < rows; y++) {
    const row = [];
    const tr = document.createElement('tr');
    for (let x = 0; x < cols; x++) {
      const td = document.createElement('td');
      td.className = (x + y) % 2 === 0 ? 'light' : 'dark';
      td.dataset.x = x;
      td.dataset.y = y;
      tr.appendChild(td);
      row.push({ el: td, visited: false, blocked: false });
    }
    board.push(row);
    table.appendChild(tr);
  }

  blocked.forEach(([x, y]) => {
    board[y][x].blocked = true;
    board[y][x].el.style.backgroundColor = '#999';
  });

  let current = null;
  let moveCount = 0;

  function highlight(x, y) {
    board[y][x].el.classList.add('current');
  }

  function clearHighlight() {
    board.forEach(row => row.forEach(cell => cell.el.classList.remove('current')));
  }

  function onClick(e) {
    const x = +e.target.dataset.x;
    const y = +e.target.dataset.y;
    const cell = board[y][x];
    if (cell.visited || cell.blocked) return;

    if (!current) {
      if (x !== start.x || y !== start.y) return;
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

    if (moveCount === rows * cols - blocked.length) {
      testPassed = true;
      document.getElementById('testResult').textContent = '🎉 테스트 성공! 퍼즐 게시 가능';
    }
  }

  board.forEach(row => row.forEach(cell => cell.el.addEventListener('click', onClick)));
  container.appendChild(table);
  highlight(start.x, start.y);
}

window.testPuzzle = function () {
  const seed = getSeedObject();
  if (!seed) return;
  const container = document.getElementById('boardContainer');
  playPuzzle(container, seed);
};

window.postPuzzle = function () {
  const seedObj = getSeedObject();
  if (!seedObj) return;

  const title = document.getElementById('puzzleTitle').value.trim();
  const author = document.getElementById('authorName').value.trim();
  const description = document.getElementById('puzzleDesc').value.trim();

  if (!testPassed) {
    alert("퍼즐을 먼저 테스트하여 클리어한 뒤에만 게시할 수 있습니다.");
    return;
  }

  if (!title || !author) {
    alert("제목과 작성자 닉네임을 입력해주세요.");
    return;
  }

  const data = {
    title,
    author,
    description,
    seed: btoa(JSON.stringify(seedObj)),
    createdAt: Date.now(),
  };

  const dbPath = window.dbRef(window.db, 'puzzlePosts');
  window.dbPush(dbPath, data)
    .then(() => {
      alert('✅ 퍼즐이 게시되었습니다!');
      document.getElementById("seedOutput").textContent = `${window.location.origin}/knight-tour-ko/?custom=${data.seed}`;
    })
    .catch((err) => {
      console.error('❌ 퍼즐 게시 실패', err);
      alert('Firebase 저장 실패. 콘솔을 확인해주세요.');
    });
};

let currentStart = null;
let testPassed = false;
let lastVerifiedSeed = null;

window.addEventListener('load', () => {
  console.log('[로드됨] 보드 자동 생성 시작');
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

  console.log(`[보드 생성] 행: ${rows}, 열: ${cols}`);

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
    alert("시작 위치를 설정해주세요 (주황색 칸)");
    return null;
  }

  const seed = { rows, cols, blocked, start: currentStart };
  console.log("[🔍 시드 생성 완료] blocked 좌표:", seed.blocked);
  return seed;
}

function testPuzzle() {
  console.log('[🧪 테스트 시작]');
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
      alert("🎉 퍼즐 클리어 성공! 게시가 가능합니다.");
      testPassed = true;
      lastVerifiedSeed = seed; // ✅ 통과된 seed 저장
      console.log('[✅ 테스트 통과]');
    }
  }

  board.innerHTML = '';
  board.appendChild(table);
  boardData.forEach(row => row.forEach(cell => cell.el.addEventListener('click', onClick)));
  highlight(seed.start.x, seed.start.y);
}

function postPuzzle() {
  console.log('[📬 퍼즐 게시 시도]');
  const title = document.getElementById('puzzleTitle').value.trim();
  const author = document.getElementById('authorName').value.trim();
  const description = document.getElementById('puzzleDesc').value.trim();
  const seed = lastVerifiedSeed; // ✅ 마지막 통과된 seed 사용

  if (!seed) {
    alert("퍼즐 시드가 없습니다. 테스트 플레이를 먼저 완료해주세요.");
    return;
  }
  if (!title || !author) {
    alert("제목과 닉네임을 입력해주세요.");
    return;
  }
  if (!testPassed) {
    alert("테스트 플레이를 먼저 완료해주세요.");
    return;
  }

  const encodedSeed = btoa(JSON.stringify(seed));
  console.log('[📦 저장될 시드]', seed);
  console.log('[📦 인코딩된 시드]', encodedSeed);

  const data = {
    title,
    author,
    description,
    seed: encodedSeed,
    createdAt: Date.now()
  };

  if (typeof window.postPuzzleToDB !== 'function') {
    console.error('[🚨 오류] postPuzzleToDB가 정의되지 않았습니다.');
    alert("내부 오류: Firebase 모듈이 로드되지 않았습니다.");
    return;
  }

  window.postPuzzleToDB(data).then(() => {
    console.log('[✅ 퍼즐 게시 성공]');
    alert("✅ 퍼즐이 게시되었습니다!");
    document.getElementById("seedOutput").textContent =
      `${window.location.origin}/knight-tour-ko/?custom=${data.seed}`;
  }).catch(err => {
    console.error("❌ 퍼즐 게시 실패", err);
    alert("Firebase 저장 실패. 콘솔을 확인해주세요.");
  });
}

// 전역 연결
window.generateBoard = generateBoard;
window.testPuzzle = testPuzzle;
window.postPuzzle = postPuzzle;

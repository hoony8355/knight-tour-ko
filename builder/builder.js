let currentStart = null;

window.addEventListener('load', generateBoard);

function generateBoard() {
  const rows = parseInt(document.getElementById('rowsInput').value);
  const cols = parseInt(document.getElementById('colsInput').value);
  const board = document.getElementById('boardBuilder');
  board.innerHTML = '';
  board.style.gridTemplateRows = `repeat(${rows}, 40px)`;
  board.style.gridTemplateColumns = `repeat(${cols}, 40px)`;
  currentStart = null;

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

function generateSeed() {
  const seedObj = getSeedObject();
  if (!seedObj) return;
  const encoded = btoa(JSON.stringify(seedObj));
  const url = `${window.location.origin}/knight-tour-ko/?custom=${encoded}`;
  document.getElementById('seedOutput').textContent = url;
}

function postPuzzle() {
  const title = document.getElementById('puzzleTitle').value.trim();
  const author = document.getElementById('authorName').value.trim();
  const description = document.getElementById('puzzleDesc').value.trim();
  const seedObj = getSeedObject();
  if (!seedObj || !title || !author) return alert('제목과 닉네임, 시작 위치를 모두 입력하세요');

  const data = {
    title,
    author,
    description,
    seed: btoa(JSON.stringify(seedObj)),
    createdAt: Date.now()
  };

  const dbPath = window.dbRef(window.db, 'puzzlePosts');
  window.dbPush(dbPath, data).then(() => {
    alert('✅ 퍼즐이 게시되었습니다!');
  }).catch(err => {
    console.error('❌ 퍼즐 게시 실패', err);
    alert('Firebase 권한 오류로 실패했습니다.');
  });
}

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
  testPassed = false; // 새 보드를 만들면 다시 테스트해야 함

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

// ✅ 테스트용 게임 실행
window.testPuzzle = function () {
  const seed = getSeedObject();
  if (!seed) return;

  testPassed = false; // 초기화
  const container = document.getElementById("boardBuilder");
  container.innerHTML = '';

  playPuzzle(container, seed, () => {
    testPassed = true;
    document.getElementById("testResult").textContent = "🎉 테스트 완료! 퍼즐 게시 가능.";
  });
};

window.postPuzzle = function () {
  const title = document.getElementById('puzzleTitle').value.trim();
  const author = document.getElementById('authorName').value.trim();
  const description = document.getElementById('puzzleDesc').value.trim();
  const seedObj = getSeedObject();

  if (!testPassed) {
    alert("❗ 퍼즐을 테스트 플레이로 클리어한 뒤에만 게시할 수 있습니다.");
    return;
  }

  if (!seedObj) {
    alert("퍼즐 시드 생성 실패. 시작 위치나 보드를 확인해주세요.");
    return;
  }

  if (!title || !author) {
    alert("제목과 닉네임을 입력해주세요.");
    return;
  }

  let seed;
  try {
    seed = btoa(JSON.stringify(seedObj));
  } catch (e) {
    alert("시드 인코딩 오류 발생");
    console.error(e);
    return;
  }

  const data = {
    title,
    author,
    description,
    seed,
    createdAt: Date.now()
  };

  console.log("📦 업로드 데이터 확인:", data);

  const dbPath = window.dbRef("puzzlePosts");
  window.dbPush(dbPath, data).then(() => {
    alert("✅ 퍼즐이 게시되었습니다!");
    document.getElementById("seedOutput").textContent = `${window.location.origin}/knight-tour-ko/?custom=${seed}`;
  }).catch(err => {
    console.error("❌ 퍼즐 게시 실패", err);
    alert("Firebase 저장 실패. 콘솔을 확인해주세요.");
  });
};

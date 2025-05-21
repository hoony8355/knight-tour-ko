// ✅ builder.js (리팩토링 완료)
import { renderBoard, playPuzzle } from '../game-custom.js';

const boardContainer = document.getElementById('boardBuilder');
const testResult = document.getElementById('testResult');

let currentSeed = {
  rows: 6,
  cols: 6,
  blocked: [],
  start: null,
};

let testPassed = false;

window.generateBoard = function () {
  const rows = parseInt(document.getElementById('rowsInput').value);
  const cols = parseInt(document.getElementById('colsInput').value);
  currentSeed = { rows, cols, blocked: [], start: null };
  testPassed = false;
  boardContainer.innerHTML = '';
  boardContainer.style.gridTemplateRows = `repeat(${rows}, 40px)`;
  boardContainer.style.gridTemplateColumns = `repeat(${cols}, 40px)`;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = document.createElement('div');
      cell.className = 'builder-cell';
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.addEventListener('click', () => handleClick(cell));
      boardContainer.appendChild(cell);
    }
  }
};

function handleClick(cell) {
  if (cell.classList.contains('start')) {
    cell.classList.remove('start');
    currentSeed.start = null;
    return;
  }

  if (!currentSeed.start) {
    if (cell.classList.contains('blocked')) return;
    cell.classList.add('start');
    currentSeed.start = { x: +cell.dataset.x, y: +cell.dataset.y };
    return;
  }

  cell.classList.toggle('blocked');
}

function getSeed() {
  const cells = document.querySelectorAll('.builder-cell');
  currentSeed.blocked = [];

  cells.forEach(cell => {
    if (cell.classList.contains('blocked')) {
      currentSeed.blocked.push([+cell.dataset.x, +cell.dataset.y]);
    }
  });

  return currentSeed;
}

window.generateSeed = function () {
  getSeed();
  if (!currentSeed.start) {
    alert("시작 위치를 설정해주세요");
    return;
  }
  const encoded = btoa(JSON.stringify(currentSeed));
  document.getElementById('seedOutput').textContent = `${location.origin}/knight-tour-ko/?custom=${encoded}`;
};

window.testPuzzle = function () {
  getSeed();
  if (!currentSeed.start) {
    alert("시작 위치가 설정되지 않았습니다");
    return;
  }
  boardContainer.innerHTML = '';
  testPassed = false;
  testResult.textContent = '';

  playPuzzle(boardContainer, currentSeed, () => {
    testPassed = true;
    testResult.textContent = '🎉 테스트 클리어 완료! 퍼즐 게시 가능';
  });
};

window.postPuzzle = function () {
  const title = document.getElementById('puzzleTitle').value.trim();
  const author = document.getElementById('authorName').value.trim();
  const description = document.getElementById('puzzleDesc').value.trim();
  const seed = getSeed();

  if (!title || !author || !seed.start) {
    alert("제목, 작성자, 시작 위치를 모두 입력해주세요.");
    return;
  }
  if (!testPassed) {
    alert("먼저 테스트 플레이를 완료해야 게시할 수 있습니다.");
    return;
  }

  const payload = {
    title,
    author,
    description,
    seed: btoa(JSON.stringify(seed)),
    createdAt: Date.now(),
  };

  const ref = window.dbRef(window.db, 'puzzlePosts');
  window.dbPush(ref, payload)
    .then(() => {
      alert("✅ 퍼즐 게시 완료!");
      location.reload();
    })
    .catch(err => {
      console.error("❌ 게시 실패", err);
      alert("게시 중 오류가 발생했습니다.");
    });
};

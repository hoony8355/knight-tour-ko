// builder.js
import { renderBoard, playPuzzle } from '../game-custom.js';

const boardContainer = document.getElementById('boardBuilder');
const sizeInputRow = document.getElementById('rowsInput');
const sizeInputCol = document.getElementById('colsInput');
const postBtn = document.querySelector('[onclick="postPuzzle()"]');
const testBtn = document.querySelector('[onclick="testPuzzle()"]');
const titleInput = document.getElementById('puzzleTitle');
const authorInput = document.getElementById('authorName');
const descInput = document.getElementById('puzzleDesc');
const testResult = document.getElementById('testResult');

let currentSeed = {
  rows: 6,
  cols: 6,
  blocked: [],
  start: null,
};

let testPassed = false;

function saveSeedFromUI() {
  currentSeed.blocked = [];
  currentSeed.rows = parseInt(sizeInputRow.value);
  currentSeed.cols = parseInt(sizeInputCol.value);
  const tds = boardContainer.querySelectorAll('td');
  tds.forEach(td => {
    const x = parseInt(td.dataset.x);
    const y = parseInt(td.dataset.y);
    if (td.classList.contains('blocked')) {
      currentSeed.blocked.push([x, y]);
    }
    if (td.classList.contains('start')) {
      currentSeed.start = { x, y };
    }
  });
}

function generateBoard() {
  currentSeed.rows = parseInt(sizeInputRow.value);
  currentSeed.cols = parseInt(sizeInputCol.value);
  currentSeed.blocked = [];
  currentSeed.start = null;
  testPassed = false;
  renderBoard(boardContainer, currentSeed);

  const cells = boardContainer.querySelectorAll('td');
  cells.forEach(td => {
    td.addEventListener('click', () => {
      const x = +td.dataset.x;
      const y = +td.dataset.y;

      if (td.classList.contains('start')) {
        td.classList.remove('start');
        currentSeed.start = null;
      } else if (currentSeed.start === null) {
        td.classList.add('start');
        currentSeed.start = { x, y };
      } else {
        td.classList.toggle('blocked');
      }
    });
  });
}

window.generateBoard = generateBoard;

window.testPuzzle = function () {
  saveSeedFromUI();
  boardContainer.innerHTML = '';
  testPassed = false;
  testResult.textContent = '';

  playPuzzle(boardContainer, currentSeed, () => {
    testPassed = true;
    testResult.textContent = '🎉 테스트 성공! 퍼즐 게시 가능.';
  });
};

window.postPuzzle = function () {
  saveSeedFromUI();

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const description = descInput.value.trim();

  if (!title || !author || !currentSeed.start) {
    alert("제목, 작성자, 시작 위치를 모두 설정해주세요.");
    return;
  }

  if (!testPassed) {
    alert("퍼즐을 먼저 테스트하여 클리어한 뒤에만 게시할 수 있습니다.");
    return;
  }

  const post = {
    title,
    author,
    description,
    seed: btoa(JSON.stringify(currentSeed)),
    createdAt: Date.now()
  };

  console.log("📦 업로드 데이터 확인:", post);

  const postRef = window.dbRef(window.db, "puzzlePosts");
  window.dbPush(postRef, post)
    .then(() => {
      alert("✅ 퍼즐 게시 완료!");
      location.reload();
    })
    .catch(err => {
      console.error("❌ 퍼즐 게시 실패", err);
      alert("퍼즐 게시 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    });
};

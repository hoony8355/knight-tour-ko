const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const undoBtn = document.getElementById('undoBtn');
const sizeSelect = document.getElementById('sizeSelect');
const timerEl = document.getElementById('timeElapsed');
const rankingList = document.getElementById('rankingList');
const confettiCanvas = document.getElementById('confetti');
const darkToggle = document.getElementById('darkToggle');
const resultModal = document.getElementById('resultModal');
const resultMessage = document.getElementById('resultMessage');
const nicknameInput = document.getElementById('nicknameInput');
const submitScoreBtn = document.getElementById('submitScoreBtn');

let board = [], current = null, moveCount = 0;
let size = parseInt(sizeSelect.value);
let startTime = null, timerInterval = null;
let moveHistory = [];

if (localStorage.theme === 'dark') {
  document.documentElement.style.setProperty('--bg', '#111');
  document.documentElement.style.setProperty('--fg', '#eee');
}

darkToggle.onclick = () => {
  const dark = localStorage.theme !== 'dark';
  localStorage.theme = dark ? 'dark' : 'light';
  document.documentElement.style.setProperty('--bg', dark ? '#111' : '#fff');
  document.documentElement.style.setProperty('--fg', dark ? '#eee' : '#000');
};

function startTimer() {
  startTime = Date.now();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    timerEl.textContent = seconds;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function clearHints() {
  document.querySelectorAll('.hint').forEach(el => el.classList.remove('hint'));
}

function showHints(x, y) {
  clearHints();
  knightMoves.forEach(([dx, dy]) => {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && nx < size && ny >= 0 && ny < size && !board[ny][nx].visited) {
      board[ny][nx].el.classList.add('hint');
    }
  });
}

const knightMoves = [[2,1],[1,2],[-1,2],[-2,1],[-2,-1],[-1,-2],[1,-2],[2,-1]];

function onClick(e) {
  const x = +e.target.dataset.x;
  const y = +e.target.dataset.y;
  const square = board[y][x];
  if (square.visited) return;

  if (!current) startTimer();
  if (current) {
    const dx = Math.abs(x - current.x), dy = Math.abs(y - current.y);
    if (!((dx === 1 && dy === 2) || (dx === 2 && dy === 1))) {
      statusEl.textContent = '❌ 나이트는 L자 형태로만 이동할 수 있어요!';
      return;
    }
  }

  moveHistory.push(current);
  square.el.textContent = ++moveCount;
  square.visited = true;

  if (current) board[current.y][current.x].el.classList.remove('current');
  square.el.classList.add('current');
  current = { x, y };

  clearHints();
  showHints(x, y);

  if (moveCount === size * size) {
    stopTimer();
    const seconds = Math.floor((Date.now() - startTime) / 1000);
    fireConfetti();
    estimateAndRegisterRanking(seconds);
  } else {
    statusEl.textContent = `현재 이동 수: ${moveCount} / ${size * size}`;
  }
}

function fireConfetti() {
  confettiCanvas.style.display = 'block';
  const duration = 2 * 1000;
  const end = Date.now() + duration;
  const confettiInstance = confetti.create(confettiCanvas, { resize: true });
  (function frame() {
    confettiInstance({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
    confettiInstance({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
    else confettiCanvas.style.display = 'none';
  })();
}

function undoMove() {
  if (moveCount === 0 || moveHistory.length === 0) return;
  const { x, y } = current;
  board[y][x].visited = false;
  board[y][x].el.textContent = '';
  board[y][x].el.classList.remove('current');
  current = moveHistory.pop();
  if (current) board[current.y][current.x].el.classList.add('current');
  moveCount--;
  statusEl.textContent = `되돌림 → 이동 수: ${moveCount} / ${size * size}`;
  clearHints();
  if (current) showHints(current.x, current.y);
}

function createBoard() {
  size = parseInt(sizeSelect.value);
  boardEl.innerHTML = '';
  board = [];
  moveHistory = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    const tr = document.createElement('tr');
    for (let x = 0; x < size; x++) {
      const td = document.createElement('td');
      td.dataset.x = x;
      td.dataset.y = y;
      td.className = (x + y) % 2 === 0 ? 'light' : 'dark';
      td.addEventListener('click', onClick);
      tr.appendChild(td);
      row.push({ el: td, visited: false });
    }
    board.push(row);
    boardEl.appendChild(tr);
  }
  moveCount = 0;
  current = null;
  clearHints();
  statusEl.textContent = '시작할 칸을 클릭하세요.';
  timerEl.textContent = '0';
  stopTimer();
  renderRanking();
}

function estimateAndRegisterRanking(seconds) {
  const dbPath = window.dbRef(window.db, `rankings/${size}x${size}`);
  const q = window.dbQuery(dbPath, window.dbOrderByChild("time"), window.dbLimitToFirst(10000)); // 🔁 10,000위까지

  window.dbGet(q).then(snapshot => {
    const list = [];
    snapshot.forEach(child => list.push(child.val()));
    const rank = list.findIndex(item => seconds < item.time) + 1 || (list.length < 10000 ? list.length + 1 : null);

    resultMessage.textContent = `⏱ ${seconds}초 걸렸어요! ${rank ? `예상 랭킹: ${rank}위` : '현재 랭킹 밖이에요 😢'}`;
    resultModal.style.display = 'block';

    submitScoreBtn.onclick = () => {
      const name = nicknameInput.value.trim();
      if (!name) {
        alert("닉네임을 입력해주세요!");
        return;
      }
      localStorage.setItem("knightName", name);
      saveRanking(name, seconds);
      resultModal.style.display = 'none';
      renderRanking();
    };
  });
}

function saveRanking(name, seconds) {
  const dbPath = window.dbRef(window.db, `rankings/${size}x${size}`);
  window.dbPush(dbPath, {
    name,
    time: seconds,
    createdAt: Date.now()
  });
}

function renderRanking() {
  const dbPath = window.dbRef(window.db, `rankings/${size}x${size}`);
  const q = window.dbQuery(dbPath, window.dbOrderByChild("time"), window.dbLimitToFirst(10));
  window.dbGet(q).then(snapshot => {
    rankingList.innerHTML = "";
    snapshot.forEach((child, index) => {
      const { name, time } = child.val();
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${name} - ${time}초`;
      rankingList.appendChild(li);
    });
  });
}

resetBtn.addEventListener('click', createBoard);
undoBtn.addEventListener('click', undoMove);
sizeSelect.addEventListener('change', createBoard);
window.addEventListener('load', createBoard);

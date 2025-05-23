import {
  getDatabase, ref, get, query, orderByChild, push, set, remove, onValue
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyBle_FLyJxn7v9AMQXlCo7U7hjcx88WrlU",
  authDomain: "knight-tour-ranking.firebaseapp.com",
  databaseURL: "https://knight-tour-ranking-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "knight-tour-ranking",
  storageBucket: "knight-tour-ranking.appspot.com",
  messagingSenderId: "1073626351852",
  appId: "1:1073626351852:web:41ae6cb7db759beb703dc9"
};

const app = initializeApp(firebaseConfig, "board");
const db = getDatabase(app);

const puzzleListDiv = document.getElementById("puzzleList");
const topPuzzleListDiv = document.getElementById("topPuzzleList");
const sortSelect = document.getElementById("sortSelect");

const recommendedIds = ["RECOMMEND_ID_1", "RECOMMEND_ID_2", "RECOMMEND_ID_3", "RECOMMEND_ID_4", "RECOMMEND_ID_5"];
let allPuzzles = [];
let boardData = [], moveHistory = [], currentSeed = null, current = null;
let startTime = null;
let timerInterval = null;

const sessionId = localStorage.getItem("sessionId") || (() => {
  const id = crypto.randomUUID();
  localStorage.setItem("sessionId", id);
  return id;
})();

function updateTimerDisplay(elapsed = 0) {
  let timerEl = document.getElementById("playTimer");
  if (!timerEl) {
    timerEl = document.createElement("div");
    timerEl.id = "playTimer";
    timerEl.style.textAlign = "center";
    timerEl.style.marginTop = "0.5rem";
    document.getElementById("modalBoard").appendChild(timerEl);
  }
  timerEl.textContent = `⏱ ${elapsed.toFixed(2)}초`;
}

window.closePreview = function () {
  document.getElementById("previewModal").classList.add("hidden");
  document.getElementById("modalBoard").querySelector("table")?.remove();
  document.getElementById("playTimer")?.remove();
  document.getElementById("rankingList").innerHTML = "";
  document.getElementById("modalLikeArea").innerHTML = "";
  boardData = [];
  moveHistory = [];
  current = null;
  startTime = null;
  clearInterval(timerInterval);
};

window.undoMove = function () {
  if (moveHistory.length <= 1) {
    const first = moveHistory.pop();
    const cell = boardData[first.y][first.x];
    cell.visited = false;
    cell.el.textContent = "";
    cell.el.classList.remove("current");
    current = null;
    return;
  }
  const last = moveHistory.pop();
  const cell = boardData[last.y][last.x];
  cell.visited = false;
  cell.el.textContent = "";
  cell.el.classList.remove("current");
  const prev = moveHistory[moveHistory.length - 1];
  boardData[prev.y][prev.x].el.classList.add("current");
  current = { x: prev.x, y: prev.y };
};

window.restartPuzzle = function () {
  if (currentSeed) {
    startTime = null;
    clearInterval(timerInterval);
    updateTimerDisplay(0);
    playPuzzleInModal(currentSeed);
  }
};

function handleLike(puzzleId) {
  const likeRef = ref(db, `likes/${puzzleId}/${sessionId}`);
  get(likeRef).then(snapshot => {
    if (snapshot.exists()) {
      remove(likeRef).then(() => {
        alert("💔 추천이 취소되었습니다.");
        loadLikeCount(puzzleId);
      });
    } else {
      set(likeRef, true).then(() => {
        alert("❤️ 추천 완료!");
        loadLikeCount(puzzleId);
      });
    }
  });
}
window.handleLike = handleLike;

function loadLikeCount(puzzleId) {
  const countRef = ref(db, `likes/${puzzleId}`);
  onValue(countRef, snapshot => {
    const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    const el = document.getElementById(`like-count-${puzzleId}`);
    if (el) el.textContent = `추천: ${count}`;
    const modalEl = document.getElementById("modalLikeCount");
    if (modalEl && currentSeed?.id === puzzleId) modalEl.textContent = `추천: ${count}`;
  });
}

function openPreview(puzzle) {
  document.getElementById("modalTitle").textContent = puzzle.title;
  document.getElementById("modalAuthor").textContent = "작성자: " + puzzle.author;
  document.getElementById("modalDescription").textContent = puzzle.description || "설명 없음";

  document.getElementById("modalLikeArea").innerHTML = `
    <button onclick="handleLike('${puzzle.id}')">❤️ 추천</button>
    <span id="modalLikeCount">추천: 0</span>
  `;

  currentSeed = JSON.parse(atob(puzzle.seed));
  currentSeed.id = puzzle.id;

  playPuzzleInModal(currentSeed);
  loadRankingForPuzzle(puzzle.id);
  loadLikeCount(puzzle.id);

  document.getElementById("previewModal").classList.remove("hidden");
}

function renderPuzzleList(puzzles) {
  puzzleListDiv.innerHTML = "";
  puzzles.forEach(puzzle => {
    const card = document.createElement("div");
    card.className = "puzzle-card";

    const title = document.createElement("h4");
    title.textContent = puzzle.title;
    title.onclick = () => openPreview(puzzle);

    const author = document.createElement("p");
    author.textContent = puzzle.author;

    const likeButton = document.createElement("button");
    likeButton.textContent = "❤️ 추천";
    likeButton.onclick = (e) => {
      e.stopPropagation();
      handleLike(puzzle.id);
    };

    const likeCount = document.createElement("p");
    likeCount.id = `like-count-${puzzle.id}`;
    likeCount.textContent = "추천: 0";

    card.appendChild(title);
    card.appendChild(author);
    card.appendChild(likeButton);
    card.appendChild(likeCount);

    puzzleListDiv.appendChild(card);
    loadLikeCount(puzzle.id);
  });
}

function renderTopPuzzles(puzzles) {
  topPuzzleListDiv.innerHTML = "";
  puzzles.forEach(puzzle => {
    const div = document.createElement("div");
    div.className = "puzzle-card";
    div.innerHTML = `<h4>${puzzle.title}</h4><p>${puzzle.author}</p>`;
    div.onclick = () => openPreview(puzzle);
    topPuzzleListDiv.appendChild(div);
  });
}

function fetchPuzzles() {
  const puzzlesRef = query(ref(db, "puzzlePosts"), orderByChild("createdAt"));
  get(puzzlesRef).then(snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      allPuzzles = Object.entries(data).map(([id, value]) => ({ ...value, id })).reverse();
      renderTopPuzzles(allPuzzles.filter(p => recommendedIds.includes(p.id)));
      renderPuzzleList(allPuzzles);
    }
  });
}

function playPuzzleInModal(seed) {
  const boardArea = document.getElementById("modalBoard");
  boardArea.querySelector("table")?.remove();
  document.getElementById("playTimer")?.remove();
  updateTimerDisplay(0);
  clearInterval(timerInterval);
  startTime = null;

  const table = document.createElement("table");
  table.className = "board";
  boardData = [], moveHistory = [], current = null;

  for (let y = 0; y < seed.rows; y++) {
    const tr = document.createElement("tr");
    const row = [];
    for (let x = 0; x < seed.cols; x++) {
      const td = document.createElement("td");
      td.className = (x + y) % 2 === 0 ? "light" : "dark";
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
    boardData[y][x].el.style.backgroundColor = "#999";
  });

  function clearHighlight() {
    boardData.forEach(row => row.forEach(cell => cell.el.classList.remove("current")));
  }

  function onClick(e) {
    const x = +e.target.dataset.x;
    const y = +e.target.dataset.y;
    const cell = boardData[y][x];
    if (cell.visited || cell.blocked) return;

    if (!current) {
      if (x !== seed.start.x || y !== seed.start.y) return;
      startTime = performance.now();
      timerInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        updateTimerDisplay(elapsed);
      }, 100);
    } else {
      const dx = Math.abs(x - current.x);
      const dy = Math.abs(y - current.y);
      if (!((dx === 2 && dy === 1) || (dx === 1 && dy === 2))) return;
    }

    moveHistory.push({ x, y });
    cell.visited = true;
    cell.el.textContent = moveHistory.length;
    clearHighlight();
    cell.el.classList.add("current");
    current = { x, y };

    if (moveHistory.length === (seed.rows * seed.cols - seed.blocked.length)) {
      clearInterval(timerInterval);
      const timeTaken = ((performance.now() - startTime) / 1000).toFixed(2);
      const nickname = prompt(`🎉 클리어! 소요 시간: ${timeTaken}초\n닉네임을 입력하세요:`);
      if (nickname && nickname.trim()) {
        const rankingRef = ref(db, `rankings/${seed.id || 'custom'}`);
        const record = {
          nickname: nickname.trim(),
          time: parseFloat(timeTaken),
          createdAt: Date.now()
        };
        push(rankingRef, record);
        alert("✅ 기록이 저장되었습니다!");
        loadRankingForPuzzle(seed.id || "custom");
      } else {
        alert("❗ 닉네임이 입력되지 않아 저장되지 않았습니다.");
      }
    }
  }

  boardData.forEach(row => row.forEach(cell => cell.el.addEventListener("click", onClick)));
  boardArea.appendChild(table);
  boardData[seed.start.y][seed.start.x].el.classList.add("current");
  boardData[seed.start.y][seed.start.x].visited = true;
  boardData[seed.start.y][seed.start.x].el.textContent = 1;
  moveHistory.push({ x: seed.start.x, y: seed.start.y });
  current = { x: seed.start.x, y: seed.start.y };
}

function loadRankingForPuzzle(puzzleId) {
  const rankRef = ref(db, `rankings/${puzzleId}`);
  get(rankRef).then(snapshot => {
    if (snapshot.exists()) {
      const rankArray = Object.values(snapshot.val()).sort((a, b) => a.time - b.time).slice(0, 5);
      document.getElementById("rankingList").innerHTML = rankArray
        .map((r, i) => `<p>🥇 ${i + 1}위: ${r.nickname} - ${r.time.toFixed(2)}s</p>`).join('');
    } else {
      document.getElementById("rankingList").innerHTML = "<p>아직 기록이 없습니다.</p>";
    }
  });
}

sortSelect.addEventListener("change", () => {
  const sorted = [...allPuzzles];
  if (sortSelect.value === "latest") sorted.sort((a, b) => b.createdAt - a.createdAt);
  else sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  renderPuzzleList(sorted);
});

fetchPuzzles();

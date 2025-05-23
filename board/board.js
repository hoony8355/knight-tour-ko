import {
  getDatabase, ref, get, query, orderByChild, push
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

window.closePreview = function () {
  console.log("🔒 미리보기 닫힘");
  document.getElementById("previewModal").classList.add("hidden");
  document.getElementById("modalBoard").querySelector("table")?.remove();
  document.getElementById("playTimer")?.remove();
  document.getElementById("rankingList").innerHTML = "";
  boardData = [];
  moveHistory = [];
  current = null;
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
  if (currentSeed) playPuzzleInModal(currentSeed);
};

function openPreview(puzzle) {
  console.log("🧩 퍼즐 미리보기:", puzzle);
  document.getElementById("modalTitle").textContent = puzzle.title;
  document.getElementById("modalAuthor").textContent = "작성자: " + puzzle.author;
  document.getElementById("modalDescription").textContent = puzzle.description || "설명 없음";

  currentSeed = JSON.parse(atob(puzzle.seed));
  currentSeed.id = puzzle.id;
  playPuzzleInModal(currentSeed);
  loadRankingForPuzzle(puzzle.id);
  document.getElementById("previewModal").classList.remove("hidden");
}

function playPuzzleInModal(seed) {
  console.log("🧠 보드 렌더링 시작", seed);
  const boardArea = document.getElementById("modalBoard");
  boardArea.querySelector("table")?.remove();
  document.getElementById("playTimer")?.remove();

  const startTime = performance.now();
  let animationFrame;
  const timerDisplay = document.createElement("p");
  timerDisplay.id = "playTimer";
  timerDisplay.style.textAlign = "center";
  timerDisplay.style.margin = "0.5rem";
  timerDisplay.style.fontWeight = "bold";
  timerDisplay.textContent = "⏱️ 경과 시간: 0.00초";
  boardArea.prepend(timerDisplay);

  function updateTimer() {
    const elapsed = (performance.now() - startTime) / 1000;
    timerDisplay.textContent = `⏱️ 경과 시간: ${elapsed.toFixed(2)}초`;
    animationFrame = requestAnimationFrame(updateTimer);
  }
  updateTimer();

  const rows = seed.rows, cols = seed.cols;
  const table = document.createElement('table');
  table.className = 'board';
  boardData = [], moveHistory = [], current = null;

  for (let y = 0; y < rows; y++) {
    const tr = document.createElement('tr');
    const row = [];
    for (let x = 0; x < cols; x++) {
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

    moveHistory.push({ x, y });
    cell.visited = true;
    cell.el.textContent = moveHistory.length;
    clearHighlight();
    cell.el.classList.add('current');
    current = { x, y };

    if (moveHistory.length === (rows * cols - seed.blocked.length)) {
      cancelAnimationFrame(animationFrame);
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
        loadRankingForPuzzle(seed.id || 'custom');
      } else {
        alert("❗ 닉네임이 입력되지 않아 저장되지 않았습니다.");
      }
    }
  }

  boardData.forEach(row => row.forEach(cell => cell.el.addEventListener('click', onClick)));
  boardArea.appendChild(table);
  boardData[seed.start.y][seed.start.x].el.classList.add('current');
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

function renderPuzzleList(puzzles) {
  console.log("🧾 전체 퍼즐 렌더링", puzzles);
  puzzleListDiv.innerHTML = "";
  puzzles.forEach(puzzle => {
    const div = document.createElement("div");
    div.className = "puzzle-card";
    div.innerHTML = `<h4>${puzzle.title}</h4><p>${puzzle.author}</p>`;
    div.onclick = () => openPreview(puzzle);
    puzzleListDiv.appendChild(div);
  });
}

function renderTopPuzzles(puzzles) {
  console.log("🏅 추천 퍼즐 렌더링", puzzles);
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
  console.log("📡 Firebase fetch 시작");
  get(puzzlesRef)
    .then(snapshot => {
      console.log("📥 Firebase snapshot:", snapshot.val());
      if (snapshot.exists()) {
        const data = snapshot.val();
        allPuzzles = Object.entries(data).map(([id, value]) => ({ ...value, id })).reverse();
        renderTopPuzzles(allPuzzles.filter(p => recommendedIds.includes(p.id)));
        renderPuzzleList(allPuzzles);
      } else {
        console.warn("⚠️ Firebase snapshot이 비어있습니다.");
      }
    })
    .catch(error => {
      console.error("❌ Firebase fetch 에러:", error);
    });
}

sortSelect.addEventListener("change", () => {
  const sorted = [...allPuzzles];
  if (sortSelect.value === "latest") sorted.sort((a, b) => b.createdAt - a.createdAt);
  else sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  renderPuzzleList(sorted);
});

fetchPuzzles();

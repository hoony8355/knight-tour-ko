// board-en.js (English version with debugging + timer)
import {
  getDatabase, ref, get, query, orderByChild, push, set, remove, onValue
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { startGameTimer, stopGameTimer, getTimeTaken } from "./playTimer.js";

console.log("[board-en.js] 🎯 Board script started");

const firebaseConfig = {
  apiKey: "AIzaSyBle_FLyJxn7v9AMQXlCo7U7hjcx88WrlU",
  authDomain: "knight-tour-ranking.firebaseapp.com",
  databaseURL: "https://knight-tour-ranking-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "knight-tour-ranking",
  storageBucket: "knight-tour-ranking.appspot.com",
  messagingSenderId: "1073626351852",
  appId: "1:1073626351852:web:41ae6cb7db759beb703dc9"
};

const app = initializeApp(firebaseConfig, "board-en");
const db = getDatabase(app);

const puzzleListDiv = document.getElementById("puzzleList");
const sortSelect = document.getElementById("sortSelect");

let allPuzzles = [];
let boardData = [], moveHistory = [], currentSeed = null, current = null;

const sessionId = localStorage.getItem("sessionId") || (() => {
  const id = crypto.randomUUID();
  localStorage.setItem("sessionId", id);
  return id;
})();

window.closePreview = function () {
  document.getElementById("previewModal").classList.add("hidden");
  document.getElementById("modalBoard").querySelector("table")?.remove();
  stopGameTimer();
  document.getElementById("rankingList").innerHTML = "";
  document.getElementById("modalLikeArea").innerHTML = "";
  boardData = [];
  moveHistory = [];
  current = null;
};

window.restartPuzzle = function () {
  stopGameTimer();
  if (currentSeed) playPuzzleInModal(currentSeed);
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

function handleLike(puzzleId) {
  const likeRef = ref(db, `likes/${puzzleId}/${sessionId}`);
  get(likeRef).then(snapshot => {
    if (snapshot.exists()) {
      remove(likeRef).then(() => {
        alert("💔 Like removed");
        loadLikeCount(puzzleId);
      });
    } else {
      set(likeRef, true).then(() => {
        alert("❤️ Liked");
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
    if (el) el.textContent = `Likes: ${count}`;
    const modalEl = document.getElementById("modalLikeCount");
    if (modalEl && currentSeed?.id === puzzleId) modalEl.textContent = `Likes: ${count}`;
  });
}

function openPreview(puzzle) {
  document.getElementById("modalTitle").textContent = puzzle.title;
  document.getElementById("modalAuthor").textContent = "By: " + puzzle.author;
  document.getElementById("modalDescription").textContent = puzzle.description || "No description.";

  const likeArea = document.getElementById("modalLikeArea");
  likeArea.innerHTML = `
    <button onclick="handleLike('${puzzle.id}')">❤️ Like</button>
    <span id="modalLikeCount">Likes: 0</span>
  `;

  try {
    currentSeed = JSON.parse(atob(puzzle.seed));
    currentSeed.id = puzzle.id;
    window.currentSeed = currentSeed;
  } catch (err) {
    alert("Failed to load puzzle data.");
    return;
  }

  playPuzzleInModal(currentSeed);
  loadRankingForPuzzle(puzzle.id);
  loadLikeCount(puzzle.id);
  document.getElementById("previewModal").classList.remove("hidden");
  history.pushState(null, "", `?puzzle=${puzzle.id}`);
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
    likeButton.textContent = "❤️ Like";
    likeButton.onclick = (e) => {
      e.stopPropagation();
      handleLike(puzzle.id);
    };

    const likeCount = document.createElement("p");
    likeCount.id = `like-count-${puzzle.id}`;
    likeCount.textContent = "Likes: 0";

    card.appendChild(title);
    card.appendChild(author);
    card.appendChild(likeButton);
    card.appendChild(likeCount);

    puzzleListDiv.appendChild(card);
    loadLikeCount(puzzle.id);
  });
}

function fetchPuzzles() {
  const puzzlesRef = query(ref(db, "puzzlePosts"), orderByChild("createdAt"));
  get(puzzlesRef).then(snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();

      get(ref(db, "likes")).then(likeSnapshot => {
        const likeData = likeSnapshot.exists() ? likeSnapshot.val() : {};
        const likeCounts = {};

        for (const puzzleId in likeData) {
          likeCounts[puzzleId] = Object.keys(likeData[puzzleId]).length;
        }

        allPuzzles = Object.entries(data).map(([id, value]) => ({
          ...value,
          id,
          likes: likeCounts[id] || 0
        })).reverse();

        renderPuzzleList(allPuzzles);

        const urlParams = new URLSearchParams(window.location.search);
        const puzzleId = urlParams.get("puzzle");
        if (puzzleId) {
          const match = allPuzzles.find(p => p.id === puzzleId);
          if (match) openPreview(match);
        }
      });
    }
  });
}

function playPuzzleInModal(seed) {
  const boardArea = document.getElementById("modalBoard");
  boardArea.querySelector("table")?.remove();
  stopGameTimer();

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

  function onClick(e) {
    const x = +e.target.dataset.x;
    const y = +e.target.dataset.y;
    const cell = boardData[y][x];
    if (cell.visited || cell.blocked) return;

    if (current) {
      const dx = Math.abs(x - current.x);
      const dy = Math.abs(y - current.y);
      if (!((dx === 2 && dy === 1) || (dx === 1 && dy === 2))) return;
    }

    if (moveHistory.length === 1) startGameTimer();

    moveHistory.push({ x, y });
    cell.visited = true;
    cell.el.textContent = moveHistory.length;

    boardData.forEach(row => row.forEach(c => c.el.classList.remove("current")));
    cell.el.classList.add("current");
    current = { x, y };

    const totalMoves = seed.rows * seed.cols - seed.blocked.length;
    if (moveHistory.length === totalMoves) {
      const timeTaken = getTimeTaken().toFixed(2);
      stopGameTimer();

      const nickname = prompt(`🎉 Puzzle completed in ${timeTaken}s!\nEnter your nickname:`);
      if (nickname && nickname.trim()) {
        const rankingRef = ref(db, `rankings/${seed.id || 'custom'}`);
        const record = {
          nickname: nickname.trim(),
          time: parseFloat(timeTaken),
          createdAt: Date.now()
        };
        push(rankingRef, record);
        alert("✅ Your score has been saved!");
        loadRankingForPuzzle(seed.id || "custom");
      } else {
        alert("⚠️ Nickname not entered. Result not saved.");
      }
    }
  }

  boardData.forEach(row => row.forEach(cell => cell.el.addEventListener("click", onClick)));
  boardArea.appendChild(table);

  const start = seed.start;
  boardData[start.y][start.x].el.classList.add("current");
  boardData[start.y][start.x].visited = true;
  boardData[start.y][start.x].el.textContent = 1;
  moveHistory.push({ x: start.x, y: start.y });
  current = { x: start.x, y: start.y };
}

function loadRankingForPuzzle(puzzleId) {
  const rankRef = ref(db, `rankings/${puzzleId}`);
  get(rankRef).then(snapshot => {
    const container = document.getElementById("rankingList");
    if (snapshot.exists()) {
      const rankArray = Object.values(snapshot.val()).sort((a, b) => a.time - b.time).slice(0, 5);
      container.innerHTML = rankArray
        .map((r, i) => `<p>🏅 ${i + 1}. ${r.nickname} - ${r.time.toFixed(2)}s</p>`).join('');
    } else {
      container.innerHTML = "<p>No records yet.</p>";
    }
  });
}

sortSelect.addEventListener("change", () => {
  const sorted = [...allPuzzles];
  if (sortSelect.value === "latest") {
    sorted.sort((a, b) => b.createdAt - a.createdAt);
  } else {
    sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }
  renderPuzzleList(sorted);
});

fetchPuzzles();

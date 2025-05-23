import {
  getDatabase, ref, get, query, orderByChild
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";

// Firebase 초기화
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

const recommendedIds = [
  "RECOMMEND_ID_1",
  "RECOMMEND_ID_2",
  "RECOMMEND_ID_3",
  "RECOMMEND_ID_4",
  "RECOMMEND_ID_5"
];

let allPuzzles = [];

window.closePreview = function () {
  document.getElementById("previewModal").classList.add("hidden");
  document.getElementById("modalBoard").innerHTML = "";
  document.getElementById("rankingList").innerHTML = "";
};

function openPreview(puzzle) {
  document.getElementById("modalTitle").textContent = puzzle.title;
  document.getElementById("modalAuthor").textContent = "작성자: " + puzzle.author;
  document.getElementById("modalDescription").textContent = puzzle.description || "설명 없음";

  const seedObj = JSON.parse(atob(puzzle.seed));
  playPuzzleInModal(seedObj);
  loadRankingForPuzzle(puzzle.id);

  document.getElementById("previewModal").classList.remove("hidden");
}

function playPuzzleInModal(seedData) {
  const boardArea = document.getElementById("modalBoard");
  boardArea.innerHTML = "";
  const rows = seedData.rows;
  const cols = seedData.cols;

  const table = document.createElement('table');
  table.className = 'board';

  const boardData = [];
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

  seedData.blocked.forEach(([x, y]) => {
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
      if (x !== seedData.start.x || y !== seedData.start.y) return;
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

    if (moveCount === (rows * cols - seedData.blocked.length)) {
      alert("🎉 클리어! 축하합니다.");
    }
  }

  boardData.forEach(row => row.forEach(cell => cell.el.addEventListener('click', onClick)));
  boardArea.appendChild(table);
  highlight(seedData.start.x, seedData.start.y);
}

function loadRankingForPuzzle(puzzleId) {
  const rankRef = ref(db, `rankings/${puzzleId}`);
  get(rankRef).then(snapshot => {
    if (snapshot.exists()) {
      const rankArray = Object.values(snapshot.val());
      rankArray.sort((a, b) => a.time - b.time);
      const top5 = rankArray.slice(0, 5);

      const html = top5.map((r, i) => `<p>🥇 ${i + 1}위: ${r.nickname} - ${r.time}s</p>`).join('');
      document.getElementById("rankingList").innerHTML = html;
    } else {
      document.getElementById("rankingList").innerHTML = "<p>아직 기록이 없습니다.</p>";
    }
  });
}

function renderPuzzleList(puzzles) {
  puzzleListDiv.innerHTML = "";
  puzzles.forEach(puzzle => {
    const div = document.createElement("div");
    div.className = "puzzle-card";
    div.innerHTML = `
      <h4>${puzzle.title}</h4>
      <p>${puzzle.author}</p>
    `;
    div.onclick = () => openPreview(puzzle);
    puzzleListDiv.appendChild(div);
  });
}

function renderTopPuzzles(puzzles) {
  topPuzzleListDiv.innerHTML = "";
  puzzles.forEach(puzzle => {
    const div = document.createElement("div");
    div.className = "puzzle-card";
    div.innerHTML = `
      <h4>${puzzle.title}</h4>
      <p>${puzzle.author}</p>
    `;
    div.onclick = () => openPreview(puzzle);
    topPuzzleListDiv.appendChild(div);
  });
}

function fetchPuzzles() {
  const puzzlesRef = query(ref(db, "puzzlePosts"), orderByChild("createdAt"));
  get(puzzlesRef).then(snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      allPuzzles = Object.entries(data).map(([id, value]) => ({
        ...value,
        id
      })).reverse();

      const topPuzzles = allPuzzles.filter(p => recommendedIds.includes(p.id));
      renderTopPuzzles(topPuzzles);
      renderPuzzleList(allPuzzles);
    }
  });
}

sortSelect.addEventListener("change", () => {
  if (sortSelect.value === "latest") {
    const sorted = [...allPuzzles].sort((a, b) => b.createdAt - a.createdAt);
    renderPuzzleList(sorted);
  } else if (sortSelect.value === "likes") {
    const sorted = [...allPuzzles].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    renderPuzzleList(sorted);
  }
});

fetchPuzzles();

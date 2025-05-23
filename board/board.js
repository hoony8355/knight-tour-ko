// board.js - 완성본 (퍼즐 목록 불러오기 + 클릭 시 보드 표시 기능 포함)

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
    timerEl.style.fontWeight = "bold";
    timerEl.style.fontSize = "1.1em";
    timerEl.style.color = "#333";
    document.getElementById("modalBoard").prepend(timerEl);
  }
  timerEl.textContent = `⏱ ${elapsed.toFixed(2)}초 경과 중`;
}

window.closePreview = function () {
  document.getElementById("previewModal").classList.add("hidden");
  document.getElementById("modalBoard").querySelector("table")?.remove();
  document.getElementById("playTimer")?.remove();
  document.getElementById("rankingList").innerHTML = "";
  boardData = []; moveHistory = []; current = null; startTime = null;
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
    document.getElementById("playTimer")?.remove();
    playPuzzleInModal(currentSeed);
  }
};

function playPuzzleInModal(seed) {
  const boardArea = document.getElementById("modalBoard");
  boardArea.querySelector("table")?.remove();
  document.getElementById("playTimer")?.remove();
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

    if (!current && !startTime) {
      if (x !== seed.start.x || y !== seed.start.y) return;
      startTime = performance.now();
      timerInterval = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        updateTimerDisplay(elapsed);
      }, 100);
    } else if (!current) {
      return;
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
      } else {
        alert("❗ 닉네임이 입력되지 않아 저장되지 않았습니다.");
      }
    }
  }

  boardData.forEach(row => row.forEach(cell => cell.el.addEventListener("click", onClick)));
  boardArea.appendChild(table);
  boardData[seed.start.y][seed.start.x].el.classList.add("current");
  current = null;
}

function renderPuzzleCard(puzzle) {
  const card = document.createElement("div");
  card.className = "puzzle-card";
  card.innerHTML = `
    <h4>${puzzle.title || "제목 없음"}</h4>
    <p>작성자: ${puzzle.author || "익명"}</p>
    <p>추천수: ${puzzle.likes || 0}</p>
  `;
  card.addEventListener("click", () => {
    document.getElementById("modalTitle").textContent = puzzle.title || "제목 없음";
    document.getElementById("modalAuthor").textContent = "작성자: " + (puzzle.author || "익명");
    document.getElementById("modalDescription").textContent = puzzle.description || "";
    document.getElementById("previewModal").classList.remove("hidden");
    currentSeed = puzzle;
    playPuzzleInModal(puzzle);
  });
  return card;
}

function renderAllPuzzles(puzzles) {
  puzzleListDiv.innerHTML = "";
  puzzles.forEach(p => {
    const card = renderPuzzleCard(p);
    puzzleListDiv.appendChild(card);
  });
}

function fetchPuzzles() {
  const puzzlesRef = ref(db, "customPuzzles");
  onValue(puzzlesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    allPuzzles = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    renderAllPuzzles(allPuzzles);
  });
}

fetchPuzzles();

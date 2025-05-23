// board.js with recommendation (like) system
import {
  getDatabase, ref, get, query, orderByChild, push, set, onValue
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
const sessionId = localStorage.getItem("sessionId") || (() => {
  const id = crypto.randomUUID();
  localStorage.setItem("sessionId", id);
  return id;
})();

function renderPuzzleList(puzzles) {
  puzzleListDiv.innerHTML = "";
  puzzles.forEach(puzzle => {
    const div = document.createElement("div");
    div.className = "puzzle-card";
    div.innerHTML = `
      <h4>${puzzle.title}</h4>
      <p>${puzzle.author}</p>
      <button class="like-button" data-id="${puzzle.id}">❤️ 추천</button>
      <p id="like-count-${puzzle.id}">추천: 0</p>
    `;
    div.onclick = (e) => {
      if (e.target.classList.contains("like-button")) return;
      openPreview(puzzle);
    };
    div.querySelector(".like-button").addEventListener("click", () => handleLike(puzzle.id));
    puzzleListDiv.appendChild(div);
    loadLikeCount(puzzle.id);
  });
}

function handleLike(puzzleId) {
  const likeRef = ref(db, `likes/${puzzleId}/${sessionId}`);
  get(likeRef).then(snapshot => {
    if (snapshot.exists()) {
      alert("이미 추천한 퍼즐입니다!");
    } else {
      set(likeRef, true).then(() => {
        alert("❤️ 추천 완료!");
        loadLikeCount(puzzleId);
      });
    }
  });
}

function loadLikeCount(puzzleId) {
  const countRef = ref(db, `likes/${puzzleId}`);
  onValue(countRef, snapshot => {
    const val = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
    const countEl = document.getElementById(`like-count-${puzzleId}`);
    if (countEl) countEl.textContent = `추천: ${val}`;
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

sortSelect.addEventListener("change", () => {
  const sorted = [...allPuzzles];
  if (sortSelect.value === "latest") sorted.sort((a, b) => b.createdAt - a.createdAt);
  else sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  renderPuzzleList(sorted);
});

fetchPuzzles();

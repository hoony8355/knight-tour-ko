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

window.closePreview = function () {
  console.log("🔒 미리보기 닫힘");
  document.getElementById("previewModal").classList.add("hidden");
  document.getElementById("modalBoard").querySelector("table")?.remove();
  document.getElementById("playTimer")?.remove();
  document.getElementById("rankingList").innerHTML = "";
  document.getElementById("modalLikeArea").innerHTML = "";
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

function handleLike(puzzleId) {
  const likeRef = ref(db, `likes/${puzzleId}/${sessionId}`);
  get(likeRef).then(snapshot => {
    if (snapshot.exists()) {
      alert("이미 추천하셨습니다.");
    } else {
      set(likeRef, true).then(() => {
        console.log(`👍 추천 완료 for ${puzzleId}`);
        alert("❤️ 추천 완료!");
        loadLikeCount(puzzleId);
      });
    }
  });
}

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
  console.log("🔍 퍼즐 미리보기:", puzzle);
  document.getElementById("modalTitle").textContent = puzzle.title;
  document.getElementById("modalAuthor").textContent = "작성자: " + puzzle.author;
  document.getElementById("modalDescription").textContent = puzzle.description || "설명 없음";

  const likeArea = document.getElementById("modalLikeArea");
  likeArea.innerHTML = `
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
  console.log("📦 전체 퍼즐 렌더링 시작");
  puzzleListDiv.innerHTML = "";
  puzzles.forEach(puzzle => {
    console.log("🧾 렌더링 퍼즐:", puzzle);
    const card = document.createElement("div");
    card.className = "puzzle-card";

    const title = document.createElement("h4");
    title.textContent = puzzle.title;
    title.onclick = () => openPreview(puzzle);

    const author = document.createElement("p");
    author.textContent = puzzle.author;

    const likeButton = document.createElement("button");
    likeButton.className = "like-button";
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
  console.log("📡 Firebase 퍼즐 가져오기 시작");
  const puzzlesRef = query(ref(db, "puzzlePosts"), orderByChild("createdAt"));
  get(puzzlesRef)
    .then(snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        allPuzzles = Object.entries(data).map(([id, value]) => ({ ...value, id })).reverse();
        console.log("✅ 퍼즐 수:", allPuzzles.length);
        renderTopPuzzles(allPuzzles.filter(p => recommendedIds.includes(p.id)));
        renderPuzzleList(allPuzzles);
      } else {
        console.warn("⚠️ 퍼즐 없음");
      }
    })
    .catch(error => {
      console.error("❌ Firebase 에러:", error);
    });
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

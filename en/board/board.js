// board.js (전체 리팩토링된 코드 - 디버깅 + 타이머 포함)
import {
  getDatabase, ref, get, query, orderByChild, push, set, remove, onValue
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { startGameTimer, stopGameTimer, getTimeTaken } from "./playTimer.js";

console.log("[board.js] 📦 보드 스크립트 시작됨");

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
  console.log("[restartPuzzle] 🔁 퍼즐 재시작");
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
        alert("💔 추천 취소됨");
        loadLikeCount(puzzleId);
      });
    } else {
      set(likeRef, true).then(() => {
        alert("❤️ 추천 완료");
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
  }).catch(err => {
    console.error("❌ Firebase fetch 실패:", err);
  });
}

function loadRankingForPuzzle(puzzleId) {
  const rankRef = ref(db, `rankings/${puzzleId}`);
  get(rankRef).then(snapshot => {
    const container = document.getElementById("rankingList");
    if (snapshot.exists()) {
      const rankArray = Object.values(snapshot.val()).sort((a, b) => a.time - b.time).slice(0, 5);
      container.innerHTML = rankArray.map((r, i) => `<p>🥇 ${i + 1}위: ${r.nickname} - ${r.time.toFixed(2)}s</p>`).join('');
    } else {
      container.innerHTML = "<p>아직 기본 기록이 없습니다.</p>";
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

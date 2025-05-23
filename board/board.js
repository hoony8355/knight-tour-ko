import {
  getDatabase, ref, get, query, orderByChild
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

// 예시: 추천 퍼즐 ID 배열 (직접 관리 가능)
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
};

function openPreview(puzzle) {
  document.getElementById("modalTitle").textContent = puzzle.title;
  document.getElementById("modalAuthor").textContent = "작성자: " + puzzle.author;
  document.getElementById("modalDescription").textContent = puzzle.description || "설명 없음";
  document.getElementById("modalImage").src = `/knight-tour-ko/preview/${puzzle.id}.png`; // 미리보기 이미지 경로
  document.getElementById("playLink").href = `/knight-tour-ko/?custom=${puzzle.seed}`;
  loadRankingForPuzzle(puzzle.id);
  document.getElementById("previewModal").classList.remove("hidden");
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
      })).reverse(); // 최신순 정렬

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

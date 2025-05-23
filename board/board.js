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

function openPreview(puzzle) {
  console.log("🔍 [openPreview] 퍼즐 데이터:", puzzle);

  // 제목, 작성자, 설명 표시
  document.getElementById("modalTitle").textContent = puzzle.title;
  document.getElementById("modalAuthor").textContent = "작성자: " + puzzle.author;
  document.getElementById("modalDescription").textContent = puzzle.description || "설명 없음";

  // 추천 버튼 삽입
  const likeArea = document.getElementById("modalLikeArea");
  likeArea.innerHTML = `
    <button onclick="handleLike('${puzzle.id}')">❤️ 추천</button>
    <span id="modalLikeCount">추천: 0</span>
  `;

  // 퍼즐 시드 디코딩 및 전역 등록
  try {
    currentSeed = JSON.parse(atob(puzzle.seed));
    currentSeed.id = puzzle.id;
    window.currentSeed = currentSeed;  // ✅ 공유 URL용 전역 등록
    console.log("✅ [openPreview] 시드 디코딩 완료:", currentSeed);
  } catch (err) {
    console.error("❌ [openPreview] 퍼즐 시드 디코딩 실패:", err);
    alert("퍼즐 정보를 불러오지 못했습니다.");
    return;
  }

  // 퍼즐 실행
  playPuzzleInModal(currentSeed);

  // 랭킹/추천 수 불러오기
  loadRankingForPuzzle(puzzle.id);
  loadLikeCount(puzzle.id);

  // 모달 표시
  document.getElementById("previewModal").classList.remove("hidden");

  // URL 히스토리 반영 (뒤로가기 대응 가능)
  history.pushState(null, "", `?puzzle=${puzzle.id}`);
  console.log(`🔗 [openPreview] URL 업데이트됨 → ?puzzle=${puzzle.id}`);
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

        renderTopPuzzles(allPuzzles.filter(p => recommendedIds.includes(p.id)));
        renderPuzzleList(allPuzzles);

        // ✅ URL에 퍼즐 ID가 있다면 해당 퍼즐 모달 자동 열기
        const urlParams = new URLSearchParams(window.location.search);
        const puzzleId = urlParams.get("puzzle");
        if (puzzleId) {
          const match = allPuzzles.find(p => p.id === puzzleId);
          if (match) {
            console.log("🔎 [fetchPuzzles] URL 기반 퍼즐 자동 오픈:", puzzleId);
            openPreview(match);
          } else {
            console.warn("⚠️ [fetchPuzzles] 퍼즐 ID 못 찾음:", puzzleId);
          }
        }

      });
    } else {
      console.warn("⚠ 퍼즐 없음");
    }
  }).catch(err => {
    console.error("❌ Firebase fetch 실패:", err);
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

  function clearHighlight() {
    boardData.forEach(row => row.forEach(cell => cell.el.classList.remove("current")));
  }

  function onClick(e) {
  const x = +e.target.dataset.x;
  const y = +e.target.dataset.y;
  const cell = boardData[y][x];

  if (cell.visited || cell.blocked) {
    console.log(`[onClick] 🚫 이미 방문했거나 막힌 칸 (x:${x}, y:${y})`);
    return;
  }

  // 나이트 이동 검증
  if (current) {
    const dx = Math.abs(x - current.x);
    const dy = Math.abs(y - current.y);
    if (!((dx === 2 && dy === 1) || (dx === 1 && dy === 2))) {
      console.log(`[onClick] ❌ 나이트 이동 불가 (from x:${current.x}, y:${current.y} → x:${x}, y:${y})`);
      return;
    }
  }

  // ✅ 첫 사용자 이동 시 타이머 시작
  if (moveHistory.length === 1) {
    console.log("[onClick] ✅ 첫 사용자 이동 → 타이머 시작");
    startGameTimer();
  }

  // 이동 처리
  moveHistory.push({ x, y });
  cell.visited = true;
  cell.el.textContent = moveHistory.length;

  boardData.forEach(row => row.forEach(c => c.el.classList.remove("current")));
  cell.el.classList.add("current");
  current = { x, y };

  const totalMoves = seed.rows * seed.cols - seed.blocked.length;
  if (moveHistory.length === totalMoves) {
    const timeTaken = getTimeTaken().toFixed(2);  // ⬅️ 먼저 시간 계산
    stopGameTimer();                              // ⬅️ 그리고 나서 타이머 종료
    console.log(`[✔ 완료] 퍼즐 클리어, 소요 시간: ${timeTaken}s`);

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
        .map((r, i) => `<p>🥇 ${i + 1}위: ${r.nickname} - ${r.time.toFixed(2)}s</p>`).join('');
    } else {
      container.innerHTML = "<p>아직 기록이 없습니다.</p>";
    }
  });
}

sortSelect.addEventListener("change", () => {
  const sorted = [...allPuzzles];
  if (sortSelect.value === "latest") {
    sorted.sort((a, b) => b.createdAt - a.createdAt);
    console.log("🔃 최신순 정렬됨");
  } else {
    sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    console.log("🔃 추천순 정렬됨");
  }
  renderPuzzleList(sorted);
});

fetchPuzzles();

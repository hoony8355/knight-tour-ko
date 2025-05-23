// board.js
import { getDatabase, ref, get, query, orderByChild } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js';

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

const puzzleListElem = document.getElementById('puzzleList');
const topPuzzleListElem = document.getElementById('topPuzzleList');
const sortSelect = document.getElementById('sortSelect');

let allPuzzles = [];

async function fetchPuzzles() {
  const snapshot = await get(ref(db, 'puzzlePosts'));
  if (snapshot.exists()) {
    allPuzzles = Object.entries(snapshot.val()).map(([id, puzzle]) => ({ id, ...puzzle }));
    renderAll();
  }
}

function renderAll() {
  renderTopPuzzles();
  renderPuzzleList();
}

function renderTopPuzzles() {
  const top5 = allPuzzles.slice(0, 5); // 관리자 추천 기준으로 교체 가능
  topPuzzleListElem.innerHTML = '';
  top5.forEach(puzzle => {
    const div = document.createElement('div');
    div.className = 'puzzle-card';
    div.innerHTML = `<strong>${puzzle.title}</strong><br/><small>by ${puzzle.author}</small>`;
    div.onclick = () => showPreview(puzzle);
    topPuzzleListElem.appendChild(div);
  });
}

function renderPuzzleList() {
  const sorted = [...allPuzzles];
  const sortBy = sortSelect.value;
  if (sortBy === 'latest') {
    sorted.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sortBy === 'likes') {
    sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
  }
  puzzleListElem.innerHTML = '';
  sorted.forEach(puzzle => {
    const div = document.createElement('div');
    div.className = 'puzzle-card';
    div.innerHTML = `<strong>${puzzle.title}</strong><br/><small>by ${puzzle.author}</small>`;
    div.onclick = () => showPreview(puzzle);
    puzzleListElem.appendChild(div);
  });
}

sortSelect.addEventListener('change', renderPuzzleList);

function showPreview(puzzle) {
  document.getElementById('modalTitle').textContent = puzzle.title;
  document.getElementById('modalAuthor').textContent = `by ${puzzle.author}`;
  document.getElementById('modalDescription').textContent = puzzle.description || '-';
  document.getElementById('modalImage').src = `/knight-tour-ko/preview.png`; // TODO: 썸네일 생성 로직 적용 가능
  document.getElementById('playLink').href = `/knight-tour-ko/?custom=${puzzle.seed}`;
  document.getElementById('rankingList').innerHTML = `<p>TOP 5 랭킹 로딩 예정...</p>`; // TODO: 랭킹 연동
  document.getElementById('previewModal').classList.remove('hidden');
}

window.closePreview = function () {
  document.getElementById('previewModal').classList.add('hidden');
}

fetchPuzzles();

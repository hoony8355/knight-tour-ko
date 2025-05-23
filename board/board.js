const sessionId = localStorage.getItem("sessionId") || (() => {
  const id = crypto.randomUUID();
  localStorage.setItem("sessionId", id);
  return id;
})();

function handleLike(puzzleId) {
  const likeRef = ref(db, `likes/${puzzleId}/${sessionId}`);
  get(likeRef).then(snapshot => {
    if (snapshot.exists()) {
      alert("이미 추천하셨습니다.");
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
    title.style.cursor = "pointer";
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

function openPreview(puzzle) {
  document.getElementById("modalTitle").textContent = puzzle.title;
  document.getElementById("modalAuthor").textContent = "작성자: " + puzzle.author;
  document.getElementById("modalDescription").textContent = puzzle.description || "설명 없음";

  const modalLikeArea = document.getElementById("modalLikeArea");
  modalLikeArea.innerHTML = `
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

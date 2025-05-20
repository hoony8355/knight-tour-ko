// ✅ puzzle-board.js 리팩토링: 미리보기 + 즉시 플레이 구현

import { renderBoard, playPuzzle } from './game-custom.js';

const postsContainer = document.getElementById('puzzlePosts');

function fetchPuzzles() {
  const dbPath = window.dbRef(window.db, 'puzzlePosts');
  const q = window.dbQuery(dbPath, window.dbOrderByChild('createdAt'), window.dbLimitToFirst(50));

  window.dbGet(q).then(snapshot => {
    postsContainer.innerHTML = '';
    const puzzles = [];

    snapshot.forEach(child => {
      const val = child.val();
      puzzles.unshift({ key: child.key, ...val });
    });

    puzzles.forEach(p => {
      const wrapper = document.createElement('div');
      wrapper.className = 'puzzle-post';
      wrapper.innerHTML = `
        <h3><strong>퍼즐:</strong> ${p.title}</h3>
        <p>작성자: ${p.author}</p>
        <p>게시일: ${new Date(p.createdAt).toLocaleString()}</p>
        <div class="board-preview" data-seed="${p.seed}"></div>
        <p>시작 위치: (${p.seedObj?.start?.x ?? '?'}, ${p.seedObj?.start?.y ?? '?'}) | 보드 크기: ${p.seedObj?.rows ?? '?'}x${p.seedObj?.cols ?? '?'}</p>
        <div class="play-area" style="display:none"></div>
        <button class="play-button">🚀 이 퍼즐 플레이</button>
      `;

      postsContainer.appendChild(wrapper);

      const previewBoard = wrapper.querySelector('.board-preview');
      const playBtn = wrapper.querySelector('.play-button');
      const playArea = wrapper.querySelector('.play-area');

      try {
        const parsed = JSON.parse(atob(p.seed));
        p.seedObj = parsed;
        renderBoard(previewBoard, parsed, false);
      } catch (err) {
        previewBoard.innerHTML = '<p>❌ 미리보기 실패</p>';
      }

      playBtn.addEventListener('click', () => {
        previewBoard.style.display = 'none';
        playBtn.style.display = 'none';
        playArea.style.display = 'block';
        playArea.innerHTML = '';
        playPuzzle(playArea, p.seedObj);
      });
    });
  });
}

window.addEventListener('DOMContentLoaded', fetchPuzzles);

// game-custom.js

export function playPuzzle(container, seed, onClear) {
  const { rows, cols, blocked, start } = seed;
  if (!start) {
    alert("시작 위치가 없습니다!");
    return;
  }

  container.innerHTML = "";
  const board = [];
  const table = document.createElement("table");
  table.className = "board";

  for (let y = 0; y < rows; y++) {
    const tr = document.createElement("tr");
    const row = [];
    for (let x = 0; x < cols; x++) {
      const td = document.createElement("td");
      td.dataset.x = x;
      td.dataset.y = y;
      td.className = (x + y) % 2 === 0 ? 'light' : 'dark';
      tr.appendChild(td);
      row.push({ el: td, visited: false, blocked: false });
    }
    board.push(row);
    table.appendChild(tr);
  }

  container.appendChild(table);

  // 막힌 칸 설정
  blocked.forEach(([x, y]) => {
    board[y][x].blocked = true;
    board[y][x].el.style.backgroundColor = "#999";
  });

  let moveCount = 0;
  const total = rows * cols - blocked.length;
  let current = null;

  function handleClick(e) {
    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    const cell = board[y][x];

    if (cell.visited || cell.blocked) return;

    if (!current) {
      if (x !== start.x || y !== start.y) return;
    } else {
      const dx = Math.abs(x - current.x);
      const dy = Math.abs(y - current.y);
      if (!((dx === 2 && dy === 1) || (dx === 1 && dy === 2))) return;
    }

    cell.visited = true;
    cell.el.textContent = ++moveCount;
    if (current) board[current.y][current.x].el.classList.remove('current');
    cell.el.classList.add('current');
    current = { x, y };

    if (moveCount === total) {
      setTimeout(() => {
        onClear?.(); // 🎉 클리어 성공 시 콜백 호출
      }, 300);
    }
  }

  // 이벤트 등록
  board.forEach(row => row.forEach(cell => {
    if (!cell.blocked) {
      cell.el.addEventListener("click", handleClick);
    }
  }));

  // 시작 위치 강조
  board[start.y][start.x].el.classList.add("current");
}

export function renderBoard(container, seed, options = {}) {
  const { rows, cols, blocked, start } = seed;

  container.innerHTML = '';
  container.classList.add('custom-board');

  const table = document.createElement('table');
  table.className = 'board';

  for (let y = 0; y < rows; y++) {
    const tr = document.createElement('tr');
    for (let x = 0; x < cols; x++) {
      const td = document.createElement('td');
      td.className = (x + y) % 2 === 0 ? 'light' : 'dark';
      td.dataset.x = x;
      td.dataset.y = y;

      if (blocked.some(([bx, by]) => bx === x && by === y)) {
        td.style.backgroundColor = '#999';
      }

      if (start?.x === x && start?.y === y) {
        td.style.outline = '3px solid orange';
      }

      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  container.appendChild(table);
}

export function playPuzzle(container, seed, onClear) {
  const { rows, cols, blocked, start } = seed;
  if (!start) {
    alert("시작 위치가 설정되지 않았습니다.");
    return;
  }

  container.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'board';

  const board = [];
  const total = rows * cols - blocked.length;

  for (let y = 0; y < rows; y++) {
    const tr = document.createElement('tr');
    const row = [];
    for (let x = 0; x < cols; x++) {
      const td = document.createElement('td');
      td.className = (x + y) % 2 === 0 ? 'light' : 'dark';
      td.dataset.x = x;
      td.dataset.y = y;
      tr.appendChild(td);
      row.push({ el: td, visited: false, blocked: false });
    }
    board.push(row);
    table.appendChild(tr);
  }

  blocked.forEach(([x, y]) => {
    board[y][x].blocked = true;
    board[y][x].el.style.backgroundColor = '#999';
  });

  let current = null;
  let moveCount = 0;

  function clearHighlight() {
    board.forEach(row => row.forEach(cell => cell.el.classList.remove('current')));
  }

  function onClick(e) {
    const x = +e.target.dataset.x;
    const y = +e.target.dataset.y;
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
    clearHighlight();
    cell.el.classList.add('current');
    current = { x, y };

    if (moveCount === total) {
      setTimeout(() => {
        if (typeof onClear === 'function') {
          onClear();
        }
      }, 300);
    }
  }

  board.forEach(row => row.forEach(cell => {
    if (!cell.blocked) {
      cell.el.addEventListener('click', onClick);
    }
  }));

  container.appendChild(table);
  board[start.y][start.x].el.classList.add('current');
}

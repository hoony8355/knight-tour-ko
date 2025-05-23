// playTimer.js

let timerInterval = null;
let startTime = null;
let displayElement = null;

export function startGameTimer(displayElId = "playTimer") {
  stopGameTimer(); // 기존 타이머 중지
  startTime = performance.now();

  // 표시 엘리먼트가 없다면 새로 생성
  displayElement = document.createElement("div");
  displayElement.id = displayElId;
  displayElement.style.position = "absolute";
  displayElement.style.top = "10px";
  displayElement.style.right = "10px";
  displayElement.style.padding = "5px 10px";
  displayElement.style.background = "#333";
  displayElement.style.color = "white";
  displayElement.style.fontWeight = "bold";
  displayElement.style.borderRadius = "5px";
  displayElement.style.zIndex = "999";

  const modalBoard = document.getElementById("modalBoard");
  if (modalBoard) {
    modalBoard.appendChild(displayElement);
  }

  // 실시간 업데이트
  timerInterval = setInterval(() => {
    if (!startTime || !displayElement) return;
    const seconds = ((performance.now() - startTime) / 1000).toFixed(2);
    displayElement.textContent = `⏱ ${seconds}s`;
  }, 100);
}

export function stopGameTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  startTime = null;

  if (displayElement && displayElement.parentNode) {
    displayElement.parentNode.removeChild(displayElement);
  }

  displayElement = null;
}

export function getTimeTaken() {
  return startTime ? (performance.now() - startTime) / 1000 : 0;
}

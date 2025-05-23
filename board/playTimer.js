// playTimer.js

let timerInterval = null;
let startTime = null;
let displayElement = null;

export function startGameTimer(displayElId = "playTimer") {
  stopGameTimer(); // 중복 실행 방지
  startTime = performance.now();
  console.log("[⏱️ Timer] startGameTimer 호출됨. startTime =", startTime); // 👈 이 줄 추가
  console.log("[⏱️ Timer] 타이머 시작됨:", startTime);

  // 표시 엘리먼트 생성
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
  } else {
    console.warn("[⚠️ Timer] modalBoard 엘리먼트를 찾을 수 없습니다.");
  }

  // 0.1초 단위 실시간 업데이트
  timerInterval = setInterval(() => {
    if (!startTime || !displayElement) return;
    const elapsed = (performance.now() - startTime) / 1000;
    displayElement.textContent = `⏱ ${elapsed.toFixed(2)}s`;
  }, 100);
}

export function stopGameTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
    console.log("[🛑 Timer] 타이머 중지");
  }

  if (displayElement && displayElement.parentNode) {
    displayElement.parentNode.removeChild(displayElement);
  }

  displayElement = null;
  startTime = null;
}

export function getTimeTaken() {
  if (startTime === null) {
    console.warn("[⚠️ Timer] getTimeTaken 호출 시 startTime이 null입니다.");
    return 0;
  }
  const elapsed = (performance.now() - startTime) / 1000;
  console.log(`[📏 Timer] getTimeTaken → ${elapsed.toFixed(2)}s`);
  return elapsed;
}

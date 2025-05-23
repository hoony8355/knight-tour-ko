// playTimer.js
let timerInterval = null;
let startTime = null;

export function startGameTimer(displayElId = "playTimer") {
  stopGameTimer(); // 만약 켜져있다면 초기화

  startTime = performance.now();

  const display = document.createElement("div");
  display.id = displayElId;
  display.style.position = "absolute";
  display.style.top = "10px";
  display.style.right = "10px";
  display.style.padding = "5px 10px";
  display.style.background = "#333";
  display.style.color = "white";
  display.style.fontWeight = "bold";
  display.style.borderRadius = "5px";
  display.style.zIndex = "1000";
  document.getElementById("modalBoard").appendChild(display);

  timerInterval = setInterval(() => {
    const seconds = ((performance.now() - startTime) / 1000).toFixed(2);
    display.textContent = `⏱ ${seconds}s`;
  }, 100);
}

export function stopGameTimer() {
  clearInterval(timerInterval);
  const el = document.getElementById("playTimer");
  if (el) el.remove();
}

export function getTimeTaken() {
  if (!startTime) return 0;
  return (performance.now() - startTime) / 1000;
}

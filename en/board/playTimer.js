// playTimer.js (English version)

let timerInterval = null;
let startTime = null;
let displayElement = null;

export function startGameTimer(displayElId = "playTimer") {
  stopGameTimer(); // Prevent overlapping intervals
  startTime = performance.now();
  console.log("[⏱️ Timer] startGameTimer called. startTime =", startTime);

  const modalBoard = document.getElementById("modalBoard");

  const existing = document.getElementById(displayElId);
  if (existing) {
    displayElement = existing;
  } else {
    displayElement = document.createElement("div");
    displayElement.id = displayElId;
    displayElement.style.position = "absolute";
    displayElement.style.top = "10px";
    displayElement.style.right = "10px";
    displayElement.style.padding = "5px 10px";
    displayElement.style.background = "var(--modal-bg, #333)";
    displayElement.style.color = "var(--font-color, white)";
    displayElement.style.fontWeight = "bold";
    displayElement.style.borderRadius = "5px";
    displayElement.style.zIndex = "999";

    if (modalBoard) {
      modalBoard.appendChild(displayElement);
    } else {
      console.warn("[⚠️ Timer] modalBoard element not found.");
    }
  }

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
    console.log("[🛑 Timer] Timer stopped");
  }

  if (displayElement?.parentNode) {
    displayElement.parentNode.removeChild(displayElement);
  }

  displayElement = null;
  startTime = null;
}

export function getTimeTaken() {
  if (startTime === null) {
    console.warn("[⚠️ Timer] getTimeTaken called but startTime is null.");
    return 0;
  }
  const elapsed = (performance.now() - startTime) / 1000;
  console.log(`[📏 Timer] getTimeTaken → ${elapsed.toFixed(2)}s`);
  return elapsed;
}

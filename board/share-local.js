// share-local.js

function getShareURL() {
  const puzzleId = window.currentSeed?.id;
  const baseUrl = location.origin + location.pathname.replace(/\\/[^\\/]*$/, "/");
  return puzzleId ? `${baseUrl}?puzzle=${puzzleId}` : baseUrl;
}

function getShareText(seconds = 0) {
  return `🧩 '기사의 여행 퍼즐' 클리어! 저는 ${seconds}초 걸렸어요!\n지금 도전해보세요!`;
}

function copyLocalLink() {
  const url = getShareURL();
  navigator.clipboard.writeText(url)
    .then(() => alert("✅ 퍼즐 링크가 복사되었습니다!"))
    .catch(() => alert("❌ 복사 실패! 브라우저 설정을 확인해주세요."));
}

window.copyLocalLink = copyLocalLink;

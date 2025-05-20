function getShareText(seconds) {
  return `🧩 '기사의 여행 퍼즐' 클리어! 저는 ${seconds}초 걸렸어요!\n지금 도전해보세요!`;
}

function getShareURL() {
  return "https://hoony8355.github.io/knight-tour-ko/";
}

// ✅ 모바일 + 최신 브라우저 대응
function shareNative() {
  const seconds = document.getElementById("resultMessage")?.dataset?.seconds || 0;
  const text = getShareText(seconds);
  const url = getShareURL();

  if (navigator.share) {
    navigator.share({
      title: "기사의 여행 퍼즐 게임",
      text,
      url
    }).then(() => {
      console.log("✅ 공유 성공");
    }).catch((err) => {
      console.warn("❌ 공유 취소 또는 실패", err);
    });
  } else {
    alert("현재 브라우저는 기본 공유 기능을 지원하지 않습니다.");
  }
}

function shareOnTwitter() {
  const seconds = document.getElementById("resultMessage")?.dataset?.seconds || 0;
  const text = encodeURIComponent(getShareText(seconds));
  const url = encodeURIComponent(getShareURL());
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
}

function shareOnFacebook() {
  const url = encodeURIComponent(getShareURL());
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
}

function copyLink() {
  const url = getShareURL();
  navigator.clipboard.writeText(url)
    .then(() => alert("✅ 링크가 복사되었습니다!"))
    .catch(() => alert("❌ 복사 실패! 브라우저를 확인해주세요."));
}

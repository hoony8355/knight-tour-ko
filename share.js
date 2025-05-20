function getShareText(seconds) {
  return `🧩 '기사의 여행 퍼즐' 클리어! 저는 ${seconds}초 걸렸어요!\n지금 도전해보세요👇`;
}

function getShareURL() {
  return "https://hoony8355.github.io/knight-tour-ko/";
}

function shareOnTwitter() {
  const seconds = document.getElementById("resultMessage")?.dataset?.seconds || 0;
  const text = encodeURIComponent(getShareText(seconds));
  const url = encodeURIComponent(getShareURL());
  const twitterURL = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
  window.open(twitterURL, "_blank");
}

function shareOnFacebook() {
  const url = encodeURIComponent(getShareURL());
  const facebookURL = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
  window.open(facebookURL, "_blank");
}

function copyLink() {
  const url = getShareURL();
  navigator.clipboard.writeText(url)
    .then(() => alert("✅ 링크가 복사되었습니다!"))
    .catch(() => alert("❌ 복사 실패! 브라우저를 확인해주세요."));
}

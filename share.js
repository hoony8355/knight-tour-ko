// ✅ Kakao SDK 초기화
document.addEventListener("DOMContentLoaded", () => {
  if (window.Kakao && !Kakao.isInitialized()) {
    Kakao.init("34b8e213c2ab2805f24550b665c764d6"); // 발급받은 JavaScript 키
    console.log("✅ Kakao SDK 초기화 완료:", Kakao.isInitialized());
  } else if (!window.Kakao) {
    console.error("❌ Kakao SDK가 로드되지 않았습니다. script 순서를 확인하세요.");
  } else {
    console.log("ℹ️ Kakao SDK는 이미 초기화되어 있습니다.");
  }
});

// ✅ 공유 텍스트 및 링크 생성
function getShareText(seconds) {
  return `🧩 '기사의 여행 퍼즐' 클리어! 저는 ${seconds}초 걸렸어요!\n지금 도전해보세요!`;
}

function getShareURL() {
  return "https://hoony8355.github.io/knight-tour-ko/";
}

// ✅ Web Share API (기본 공유)
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
      console.log("✅ 기본 공유 성공");
    }).catch(err => {
      console.warn("❌ 공유 취소 또는 실패", err);
    });
  } else {
    alert("현재 브라우저는 기본 공유 기능을 지원하지 않습니다.");
  }
}

// ✅ 트위터 공유
function shareOnTwitter() {
  const seconds = document.getElementById("resultMessage")?.dataset?.seconds || 0;
  const text = encodeURIComponent(getShareText(seconds));
  const url = encodeURIComponent(getShareURL());
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
}

// ✅ 페이스북 공유
function shareOnFacebook() {
  const url = encodeURIComponent(getShareURL());
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
}

// ✅ 링크 복사
function copyLink() {
  const url = getShareURL();
  navigator.clipboard.writeText(url)
    .then(() => alert("✅ 링크가 복사되었습니다!"))
    .catch(() => alert("❌ 복사 실패! 브라우저를 확인해주세요."));
}

// ✅ 카카오 공유
function shareKakao() {
  const seconds = document.getElementById("resultMessage")?.dataset?.seconds || 0;
  const shareText = getShareText(seconds);

  if (!window.Kakao || !Kakao.isInitialized()) {
    alert("카카오톡 공유 기능 초기화 실패!");
    return;
  }

  Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: '기사의 여행 퍼즐 게임',
      description: shareText,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Chess_knight.jpg',
      link: {
        mobileWebUrl: getShareURL(),
        webUrl: getShareURL(),
      },
    },
    buttons: [
      {
        title: '퍼즐 하러 가기',
        link: {
          mobileWebUrl: getShareURL(),
          webUrl: getShareURL(),
        },
      },
    ],
  });
}

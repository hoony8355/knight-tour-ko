// ✅ 퍼즐 URL 생성
function getShareURL() {
  const puzzleId = window.currentSeed?.id;
  const baseUrl = location.origin + location.pathname.replace(/[^/]*$/, ""); // /board/ 유지
  const url = puzzleId ? `${baseUrl}?puzzle=${puzzleId}` : baseUrl;

  console.log("[🔗 share-local] 퍼즐 URL:", url);
  return url;
}

// ✅ 공유 텍스트 생성
function getShareText(seconds = 0) {
  const text = `🧩 '기사의 여행 퍼즐' 클리어! 저는 ${seconds}초 걸렸어요!\n지금 도전해보세요!`;
  console.log("[📝 share-local] 공유 텍스트:", text);
  return text;
}

// ✅ 기본 공유 (Web Share API)
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
      console.log("✅ [Web Share] 공유 성공");
    }).catch(err => {
      console.warn("⚠️ [Web Share] 공유 취소/실패", err);
    });
  } else {
    alert("⚠️ 이 브라우저는 기본 공유 기능을 지원하지 않습니다.");
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
function copyLocalLink() {
  const url = getShareURL();
  navigator.clipboard.writeText(url)
    .then(() => {
      console.log("✅ [Copy] 링크 복사 성공:", url);
      alert("✅ 퍼즐 링크가 복사되었습니다!");
    })
    .catch(err => {
      console.error("❌ [Copy] 복사 실패:", err);
      alert("❌ 복사 실패! 브라우저 설정을 확인해주세요.");
    });
}

// ✅ 카카오 공유
function shareKakao() {
  const seconds = document.getElementById("resultMessage")?.dataset?.seconds || 0;
  const shareText = getShareText(seconds);

  if (!window.Kakao || !Kakao.isInitialized()) {
    alert("⚠️ 카카오톡 공유 기능 초기화 실패!");
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

// ✅ 전역 등록
window.copyLocalLink = copyLocalLink;
window.shareNative = shareNative;
window.shareOnTwitter = shareOnTwitter;
window.shareOnFacebook = shareOnFacebook;
window.shareKakao = shareKakao;

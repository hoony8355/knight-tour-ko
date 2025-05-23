// ✅ Generate puzzle URL
function getShareURL() {
  const puzzleId = window.currentSeed?.id;
  const baseUrl = location.origin + location.pathname.replace(/[^/]*$/, ""); // keep /board/
  const url = puzzleId ? `${baseUrl}?puzzle=${puzzleId}` : baseUrl;

  console.log("[🔗 share-local-en] Puzzle URL:", url);
  return url;
}

// ✅ Generate share text
function getShareText(seconds = 0) {
  const text = `🧩 I cleared the Knight's Tour Puzzle in ${seconds} seconds!\nTry it now!`;
  console.log("[📝 share-local-en] Share text:", text);
  return text;
}

// ✅ Native share (Web Share API)
function shareNative() {
  const seconds = document.getElementById("resultMessage")?.dataset?.seconds || 0;
  const text = getShareText(seconds);
  const url = getShareURL();

  if (navigator.share) {
    navigator.share({
      title: "Knight's Tour Puzzle Game",
      text,
      url
    }).then(() => {
      console.log("✅ [Web Share] Shared successfully");
    }).catch(err => {
      console.warn("⚠️ [Web Share] Share canceled or failed", err);
    });
  } else {
    alert("⚠️ Your browser does not support native sharing.");
  }
}

// ✅ Share on Twitter
function shareOnTwitter() {
  const seconds = document.getElementById("resultMessage")?.dataset?.seconds || 0;
  const text = encodeURIComponent(getShareText(seconds));
  const url = encodeURIComponent(getShareURL());
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
}

// ✅ Share on Facebook
function shareOnFacebook() {
  const url = encodeURIComponent(getShareURL());
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
}

// ✅ Copy link
function copyLocalLink() {
  const url = getShareURL();
  navigator.clipboard.writeText(url)
    .then(() => {
      console.log("✅ [Copy] Link copied:", url);
      alert("✅ Puzzle link copied!");
    })
    .catch(err => {
      console.error("❌ [Copy] Failed to copy:", err);
      alert("❌ Failed to copy the link. Please check your browser settings.");
    });
}

// ✅ Share on KakaoTalk
function shareKakao() {
  const seconds = document.getElementById("resultMessage")?.dataset?.seconds || 0;
  const shareText = getShareText(seconds);

  if (!window.Kakao || !Kakao.isInitialized()) {
    alert("⚠️ Failed to initialize KakaoTalk sharing.");
    return;
  }

  Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: "Knight's Tour Puzzle Game",
      description: shareText,
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Chess_knight.jpg',
      link: {
        mobileWebUrl: getShareURL(),
        webUrl: getShareURL(),
      },
    },
    buttons: [
      {
        title: 'Try the puzzle',
        link: {
          mobileWebUrl: getShareURL(),
          webUrl: getShareURL(),
        },
      },
    ],
  });
}

// ✅ Register globally
window.copyLocalLink = copyLocalLink;
window.shareNative = shareNative;
window.shareOnTwitter = shareOnTwitter;
window.shareOnFacebook = shareOnFacebook;
window.shareKakao = shareKakao;

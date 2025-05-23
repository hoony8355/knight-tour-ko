import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// 🔐 Firebase 설정 (메인과 동일)
const firebaseConfig = {
  apiKey: "AIzaSyBle_FLyJxn7v9AMQXlCo7U7hjcx88WrlU",
  authDomain: "knight-tour-ranking.firebaseapp.com",
  databaseURL: "https://knight-tour-ranking-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "knight-tour-ranking",
  storageBucket: "knight-tour-ranking.appspot.com",
  messagingSenderId: "1073626351852",
  appId: "1:1073626351852:web:41ae6cb7db759beb703dc9"
};

// ⚠️ 별도 app 이름으로 초기화 → 기존 app과 충돌 방지
const builderApp = initializeApp(firebaseConfig, "builder");
const builderDB = getDatabase(builderApp);

// ✅ 퍼즐 게시용 함수만 외부에 노출
export function postPuzzleToDB(data) {
  const postRef = ref(builderDB, "puzzlePosts");
  return push(postRef, data);
}

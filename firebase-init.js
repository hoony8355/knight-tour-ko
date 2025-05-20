import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getDatabase, ref, push, get, query, orderByChild, limitToFirst
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

// Firebase 설정
const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APPID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✅ 정식으로 window에 바인딩
window.db = db;
window.dbRef = (...args) => ref(...args); // ⚠️ 꼭 이렇게 wrapping
window.dbPush = push;
window.dbGet = get;
window.dbQuery = query;
window.dbOrderByChild = orderByChild;
window.dbLimitToFirst = limitToFirst;
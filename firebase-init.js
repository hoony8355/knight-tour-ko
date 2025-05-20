import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getDatabase, ref, push, get, query, orderByChild, limitToFirst
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBle_FLyJxn7v9AMQXlCo7U7hjcx88WrlU",
  authDomain: "knight-tour-ranking.firebaseapp.com",
  databaseURL: "https://knight-tour-ranking-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "knight-tour-ranking",
  storageBucket: "knight-tour-ranking.appspot.com",
  messagingSenderId: "1073626351852",
  appId: "1:1073626351852:web:41ae6cb7db759beb703dc9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✅ 여기를 반드시 아래처럼 수정하세요
window.db = db;
window.dbRef = (path) => ref(db, path); // ✅ 이거 필수
window.dbPush = push;
window.dbGet = get;
window.dbQuery = query;
window.dbOrderByChild = orderByChild;
window.dbLimitToFirst = limitToFirst;

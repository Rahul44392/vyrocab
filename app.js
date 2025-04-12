// Firebase App Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  get,
  push,
  onValue,
  update,
  remove,
  child
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";
import {
  getAuth,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

// ✅ CONFIGURE with your actual Firebase credentials
const firebaseConfig = {
  apiKey: "AIzaSyC7h2FlCobLPebgunuZ_l1bEaGV6HS3AbA",
  authDomain: "vyro-cabs.firebaseapp.com",
  databaseURL: "https://vyro-cabs-default-rtdb.firebaseio.com",
  projectId: "vyro-cabs",
  storageBucket: "vyro-cabs.appspot.com",
  messagingSenderId: "529641708928",
  appId: "1:529641708928:web:79d465d693299ad1bdf565"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

// 🔐 Save user session
export function saveSession(role, userId) {
  localStorage.setItem("role", role);
  localStorage.setItem("userId", userId);
}

// 🔓 Clear session on logout
export function logout() {
  localStorage.clear();
  location.href = "login.html";
}

// ✅ Save data to DB
export async function saveToDB(path, data) {
  return await set(ref(db, path), data);
}

// ✅ Push new entry to list (auto ID)
export async function pushToDB(path, data) {
  return await push(ref(db, path), data);
}

// ✅ Get data
export async function getFromDB(path) {
  const snap = await get(ref(db, path));
  return snap.exists() ? snap.val() : null;
}

// ✅ Update entry
export async function updateDB(path, data) {
  return await update(ref(db, path), data);
}

// ✅ Delete
export async function deleteFromDB(path) {
  return await remove(ref(db, path));
}

// 📶 Live data listener
export function watchDB(path, callback) {
  return onValue(ref(db, path), snap => {
    if (snap.exists()) callback(snap.val());
    else callback(null);
  });
}

// 🔁 Generate unique trip ID
export function generateTripId() {
  return "TRIP-" + Date.now();
}

// 🧮 Distance in KM
export function distanceBetweenPoints(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 🌙 Dark Mode Toggle
export function toggleDarkMode(enabled = true) {
  if (enabled) {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

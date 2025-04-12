import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  get,
  onValue
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7h2FlCobLPebgunuZ_l1bEaGV6HS3AbA",
  authDomain: "vyro-cabs.firebaseapp.com",
  databaseURL: "https://vyro-cabs-default-rtdb.firebaseio.com",
  projectId: "vyro-cabs",
  storageBucket: "vyro-cabs.appspot.com",
  messagingSenderId: "529641708928",
  appId: "1:529641708928:web:79d465d693299ad1bdf565"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const driverId = localStorage.getItem("userId");
const routeDropdown = document.getElementById("routeSelect");
let currentRouteId = null;
let map;

window.initMap = () => {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 18.52, lng: 73.85 },
    zoom: 13
  });
};

async function loadDriverInfo() {
  const snap = await get(ref(db, `drivers/${driverId}`));
  const d = snap.val();
  document.getElementById("driverName").innerText = `👤 ${d.name}`;
  document.getElementById("vehicleDetails").innerText = `🚘 ${d.vehicleNumber} (${d.vehicleType}) - Seats: ${d.seats}`;

  const routeSnap = await get(ref(db, "routes"));
  const routes = routeSnap.val();
  Object.entries(routes).forEach(([id, r]) => {
    if (d.routeId === id) {
      routeDropdown.innerHTML += `<option value="${id}">${r.startPoint.name} ➝ ${r.endPoint.name}</option>`;
    }
  });
}
loadDriverInfo();

let isOnline = false;
window.toggleOnline = () => {
  isOnline = !isOnline;
  const tripType = document.getElementById("tripType").value;
  currentRouteId = routeDropdown.value;

  update(ref(db, `drivers/${driverId}`), {
    status: isOnline ? "online" : "offline",
    routeId: currentRouteId,
    tripType,
    lastOnline: Date.now()
  });

  document.getElementById("toggleBtn").textContent = isOnline ? "🔴 Go Offline" : "🟢 Go Online";
};

onValue(ref(db, "trips"), (snap) => {
  const trips = snap.val();
  const container = document.getElementById("tripRequests");
  container.innerHTML = "";
  Object.entries(trips || {}).forEach(([id, t]) => {
    if (t.status === "pending" && t.routeId === currentRouteId) {
      document.getElementById("notifySound").play();
      container.innerHTML += `
        <div class="trip-card">
          <strong>${t.customerPhone}</strong> wants to book ${t.seats} seat(s)<br/>
          Fare: ₹${t.fare}
          <button onclick="acceptTrip('${id}', '${t.customerPhone}')">✅ Accept</button>
          <button onclick="rejectTrip('${id}')">❌ Reject</button>
        </div>
      `;
    }
  });
});

window.acceptTrip = async (tripId, phone) => {
  await update(ref(db, `trips/${tripId}`), {
    driverId,
    driverPhone: phone,
    status: "accepted"
  });
  alert("Trip Accepted ✅");
};

window.rejectTrip = async (tripId) => {
  await update(ref(db, `trips/${tripId}`), { status: "rejected" });
};

onValue(ref(db, `drivers/${driverId}/logs`), (snap) => {
  const logs = snap.val() || {};
  const dates = Object.keys(logs);
  document.getElementById("tripCount").textContent = dates.length;
});

window.logout = () => {
  localStorage.clear();
  location.href = "login.html";
};

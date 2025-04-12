import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import {
  getDatabase, ref, set, onValue, update, remove
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";
import {
  getStorage, ref as sRef, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-storage.js";

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
const storage = getStorage(app);

const fleetId = localStorage.getItem("userId");
const driverRef = ref(db, `drivers`);

window.logout = () => {
  localStorage.clear();
  location.href = "login.html";
};

window.setSeats = () => {
  const type = document.getElementById("vehicleType").value;
  const seatCount = {
    "Auto": 3,
    "Car": 4,
    "SUV": 7,
    "3-Wheeler": 6
  }[type] || "";
  document.getElementById("seatCount").value = seatCount;
};

window.addDriver = async () => {
  const name = document.getElementById("driverName").value;
  const phone = document.getElementById("driverPhone").value;
  const id = document.getElementById("driverId").value;
  const pwd = document.getElementById("driverPwd").value;
  const vehicleNo = document.getElementById("vehicleNo").value;
  const type = document.getElementById("vehicleType").value;
  const seats = document.getElementById("seatCount").value;

  const photo = document.getElementById("driverPhoto").files[0];
  const vPhoto = document.getElementById("vehiclePhoto").files[0];
  const rc = document.getElementById("rcPhoto").files[0];

  if (!name || !phone || !id || !pwd || !vehicleNo || !type || !seats || !photo || !vPhoto || !rc) {
    return alert("⚠️ Fill all fields and upload all images");
  }

  const photoUrl = await upload("driverPhotos", id, photo);
  const vehicleUrl = await upload("vehiclePhotos", id, vPhoto);
  const rcUrl = await upload("rcDocs", id, rc);

  await set(ref(db, `drivers/${id}`), {
    name, phone, driverId: id, password: pwd,
    vehicleNo, vehicleType: type, seats: parseInt(seats),
    fleetId, online: false, currentTrip: null,
    driverPhoto: photoUrl,
    vehiclePhoto: vehicleUrl,
    rcPhoto: rcUrl,
    rating: 5, tripCount: 0, earnings: 0
  });

  alert("✅ Driver Added");
};

async function upload(folder, id, file) {
  const path = `${folder}/${id}-${file.name}`;
  const fileRef = sRef(storage, path);
  await uploadBytes(fileRef, file);
  return await getDownloadURL(fileRef);
}

onValue(driverRef, snap => {
  const drivers = snap.val() || {};
  const list = Object.values(drivers).filter(d => d.fleetId === fleetId);
  renderDriverList(list);
  renderSummary(list);
});

function renderDriverList(list) {
  document.getElementById("driverList").innerHTML = list.map(d => `
    <div class="glass" style="margin-bottom:10px;">
      <strong>${d.name}</strong> | ${d.vehicleNo} | Seats: ${d.seats}<br/>
      Phone: ${d.phone} | Online: ${d.online ? "🟢" : "🔴"}<br/>
      <button onclick="deleteDriver('${d.driverId}')" class="glass-button">🗑️ Delete</button>
    </div>
  `).join("");
}

window.deleteDriver = async (id) => {
  if (confirm("Delete this driver?")) {
    await remove(ref(db, `drivers/${id}`));
  }
};

function renderSummary(list) {
  const names = list.map(d => d.name);
  const trips = list.map(d => d.tripCount || 0);
  const earnings = list.map(d => d.earnings || 0);

  const ctx = document.getElementById("driverChart").getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: names,
      datasets: [
        { label: "Trips", data: trips, backgroundColor: "dodgerblue" },
        { label: "Earnings", data: earnings, backgroundColor: "limegreen" }
      ]
    }
  });
}

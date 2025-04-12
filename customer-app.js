import {
  getDatabase,
  ref,
  set,
  update,
  get,
  push,
  onValue
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-database.js";

const db = getDatabase();
let map, customerLocation, tripId = null;
let driverMarker = null;

export function setCustomerLocation(lat, lng) {
  customerLocation = { lat, lng };
  new google.maps.Marker({
    map,
    position: customerLocation,
    icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
  });
}

export async function detectAndSuggestRoutes(endText) {
  const routesSnap = await get(ref(db, "routes"));
  const routes = routesSnap.val() || {};
  const matchedRoutes = [];

  for (let [id, r] of Object.entries(routes)) {
    const points = [r.startPoint, ...(r.midpoints || []), r.endPoint];
    const startMatch = points.some(p => distance(customerLocation, p) < 0.5);
    const endMatch = points.some(p => p.name.toLowerCase().includes(endText.toLowerCase()));
    if (startMatch && endMatch) matchedRoutes.push({ id, ...r });
  }

  return matchedRoutes;
}

function distance(p1, p2) {
  const R = 6371;
  const dLat = (p2.lat - p1.lat) * Math.PI / 180;
  const dLng = (p2.lng - p1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(p1.lat * Math.PI / 180) *
      Math.cos(p2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function bookRide(routeId, fare, seats) {
  const phone = localStorage.getItem("customerPhone");
  tripId = "TRIP-" + Date.now();

  const trip = {
    tripId,
    routeId,
    customerPhone: phone,
    seats,
    fare,
    status: "pending",
    timestamp: Date.now()
  };

  await set(ref(db, "trips/" + tripId), trip);
  listenToTrip(tripId);
  return tripId;
}

function listenToTrip(tripId) {
  onValue(ref(db, "trips/" + tripId), snap => {
    const t = snap.val();
    if (!t) return;
    if (t.status === "accepted") {
      showDriverInfo(t.driverPhone, t.driverId);
      if (t.driverLat && t.driverLng) {
        showDriverOnMap(t.driverLat, t.driverLng);
      }
    }
    if (t.status === "completed") {
      renderInvoice(t);
    }
  });
}

function showDriverInfo(phone, id) {
  document.getElementById("callDriverBtn").href = "tel:" + phone;
  document.getElementById("chatDrawer").style.display = "block";
  document.getElementById("notifySound").play();
}

function showDriverOnMap(lat, lng) {
  if (driverMarker) driverMarker.setMap(null);
  driverMarker = new google.maps.Marker({
    position: { lat, lng },
    map,
    icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
  });
}

function renderInvoice(trip) {
  document.getElementById("invoiceSummary").style.display = "block";
  document.getElementById("invoiceDetails").innerHTML = `
    Trip ID: ${trip.tripId}<br/>
    Fare: ₹${trip.fare}<br/>
    Seats: ${trip.seats}<br/>
    Driver ID: ${trip.driverId}<br/>
    Route: ${trip.routeId}
  `;
}

export function submitRating(tripId, stars) {
  update(ref(db, "trips/" + tripId), { rating: stars });
}

export function sendChatMessage(tripId, msg) {
  push(ref(db, `chats/${tripId}/messages`), {
    sender: "customer",
    message: msg,
    timestamp: Date.now()
  });
}

export async function fetchTripHistory(phone) {
  const tripsSnap = await get(ref(db, "trips"));
  const all = tripsSnap.val() || {};
  return Object.values(all).filter(t => t.customerPhone === phone);
}

export function sendComplaint(tripId, issueText) {
  set(ref(db, `complaints/${tripId}`), {
    issue: issueText,
    time: Date.now(),
    status: "open"
  });
}

export function saveCustomerProfileIfNew(phone) {
  const profileRef = ref(db, `customers/${phone}`);
  get(profileRef).then(snap => {
    if (!snap.exists()) {
      set(profileRef, {
        phone: phone,
        createdAt: Date.now(),
        trips: 0,
        rating: 5
      });
    }
  });
}

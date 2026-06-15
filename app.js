// OBER — interactive gags

// ---------- Ride request: he always says no ----------
const declines = [
  "Ober has reviewed your request. No.",
  "Your driver is 3 minutes away. He is not coming.",
  "Request declined. Reason: gym at 6am.",
  "Request declined. Reason: he's mid-episode. It's a really good one.",
  "Request declined. Reason: 8,400 steps. So close. Can't risk it.",
  "Driver unavailable — Louise caught him at the door. There are jobs.",
  "Surge pricing in effect: ×0. He's on the couch and the couch is winning.",
  "Your request has been added to the queue. The queue is the bin.",
  "Ober considered it. He made the face. You know the face. It's a no.",
  "Request declined. He'd love to, genuinely. That was a lie. No.",
];

const accepts = [
  "✅ Request accepted. \"Airport? Not too bad.\" — your driver, en route, already there.",
  "✅ Request accepted. The one destination he respects. Wheels rolling.",
];

const requestBtn = document.getElementById("request-btn");
const rideResponse = document.getElementById("ride-response");
const destinationInput = document.getElementById("destination");

let declineIndex = 0;

requestBtn.addEventListener("click", () => {
  const destination = destinationInput.value.trim().toLowerCase();
  let message;

  if (destination.includes("airport")) {
    message = accepts[Math.floor(Math.random() * accepts.length)];
  } else if (destination.includes("gym")) {
    message = "✅ Request accepted instantly. Fastest pickup in Ober history. He was already in the gear.";
  } else if (destination.includes("couch") || destination.includes("home")) {
    message = "✅ Request accepted. Finally, someone who gets it.";
  } else {
    message = declines[declineIndex % declines.length];
    declineIndex++;
  }

  rideResponse.textContent = message;
  rideResponse.classList.remove("hidden");
  // retrigger the slide-in animation
  rideResponse.style.animation = "none";
  void rideResponse.offsetHeight;
  rideResponse.style.animation = "";
});

// ---------- Dashcam footage: YouTube embeds ----------
// To add a video: paste a new { id, title } below.
// id = the bit after youtu.be/  (e.g. https://youtu.be/ILyfh7CquqY  ->  "ILyfh7CquqY")
const videos = [
  { id: "ILyfh7CquqY", title: "Exhibit A — recovered dashcam footage" },
];

const videoGrid = document.getElementById("video-grid");
if (videoGrid) {
  videoGrid.innerHTML = videos
    .map(
      (v) => `
    <figure class="video-card">
      <div class="video-frame">
        <iframe
          src="https://www.youtube-nocookie.com/embed/${v.id}"
          title="${v.title}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
      <figcaption>${v.title}</figcaption>
    </figure>`
    )
    .join("");
}

// ---------- Step counter: forever almost done ----------
const stepsCount = document.getElementById("steps-count");
const stepsFill = document.getElementById("steps-fill");
const trackerStatus = document.getElementById("tracker-status");

const trackerLines = [
  "📍 Doing loops of Eadestown for the step count…",
  "📍 Walking a suspiciously precise circuit of the estate…",
  "📍 Pacing the kitchen. It counts. It all counts.",
  "📍 One more lap. He said that four laps ago.",
];

let steps = 9214;

setInterval(() => {
  steps += Math.floor(Math.random() * 18) + 4;
  // He never quite gets there while you're watching.
  if (steps > 9986) steps = 9214;
  stepsCount.textContent = steps.toLocaleString();
  stepsFill.style.width = (steps / 10000) * 100 + "%";
}, 1500);

setInterval(() => {
  trackerStatus.textContent =
    trackerLines[Math.floor(Math.random() * trackerLines.length)];
}, 6000);

// ---------- Countdown to the stag ----------
const countdown = document.getElementById("countdown");
const stagDate = new Date("2026-06-19T16:00:00+01:00");

function updateCountdown() {
  const diff = stagDate - new Date();
  if (diff <= 0) {
    countdown.textContent = "IT'S HAPPENING. THE DRIVER IS THE PASSENGER.";
    return;
  }
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  countdown.textContent = `${days}d ${hours}h ${mins}m ${secs}s until lemon o'clock`;
}

updateCountdown();
setInterval(updateCountdown, 1000);

// ---------- Lemon mode ----------
const lemonToggle = document.getElementById("lemon-toggle");

lemonToggle.addEventListener("click", () => {
  document.body.classList.toggle("lemon-mode");
  const on = document.body.classList.contains("lemon-mode");
  lemonToggle.textContent = on ? "🌑" : "🍋";
  if (on) rainLemons();
});

function rainLemons() {
  for (let i = 0; i < 24; i++) {
    const lemon = document.createElement("div");
    lemon.textContent = "🍋";
    lemon.style.cssText = `
      position: fixed;
      top: -3rem;
      left: ${Math.random() * 100}vw;
      font-size: ${1.5 + Math.random() * 2}rem;
      z-index: 999;
      pointer-events: none;
      transition: transform ${2 + Math.random() * 3}s linear, opacity 0.5s;
    `;
    document.body.appendChild(lemon);
    requestAnimationFrame(() => {
      lemon.style.transform = `translateY(110vh) rotate(${Math.random() * 720 - 360}deg)`;
    });
    setTimeout(() => lemon.remove(), 5500);
  }
}

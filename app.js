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
const pickupInput = document.getElementById("pickup");
const destinationInput = document.getElementById("destination");
const chat = document.getElementById("chat");
const appStatus = document.getElementById("app-status");
const phone = document.querySelector(".phone");

// Bring the phone (where Ober replies) into view — matters most on mobile,
// where it sits below the form.
function ensurePhoneVisible() {
  if (!phone) return;
  const r = phone.getBoundingClientRect();
  const fullyVisible = r.top >= 0 && r.bottom <= window.innerHeight;
  if (!fullyVisible) phone.scrollIntoView({ behavior: "smooth", block: "center" });
}

let declineIndex = 0;

// Decide Ober's reply using the existing gag logic.
function getReply(destination) {
  const d = destination.toLowerCase();
  if (d.includes("airport")) {
    return accepts[Math.floor(Math.random() * accepts.length)];
  } else if (d.includes("gym")) {
    return "✅ Request accepted instantly. Fastest pickup in Ober history. He was already in the gear.";
  } else if (d.includes("couch") || d.includes("home")) {
    return "✅ Request accepted. Finally, someone who gets it.";
  }
  return declines[declineIndex++ % declines.length];
}

function addBubble(text, kind) {
  const b = document.createElement("div");
  b.className = `bubble ${kind}`;
  b.textContent = text;
  chat.appendChild(b);
  chat.scrollTop = chat.scrollHeight;
  return b;
}

function showTyping() {
  const b = document.createElement("div");
  b.className = "bubble received typing";
  b.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
  chat.appendChild(b);
  chat.scrollTop = chat.scrollHeight;
  return b;
}

// Voice notes from Ober — sometimes he replies to a refusal with one of these.
// (Add more clips here; .ogg works on Android/desktop. Add .mp3 versions for iPhones.)
const voiceClips = [
  { src: "assets/audio/oran-shit.ogg", label: "0:11" },
  { src: "assets/audio/oran-eyes.ogg", label: "0:15" },
];

function isAcceptDestination(d) {
  d = d.toLowerCase();
  return d.includes("airport") || d.includes("gym") || d.includes("couch") || d.includes("home");
}

let currentAudio = null;

function addVoiceBubble(clip) {
  const src = clip.src;
  const wrap = document.createElement("div");
  wrap.className = "bubble received voice";

  const btn = document.createElement("button");
  btn.className = "voice-play";
  btn.type = "button";
  btn.setAttribute("aria-label", "Play voice message from Ober");
  btn.textContent = "▶";

  const wave = document.createElement("div");
  wave.className = "voice-wave";
  [6, 12, 18, 9, 22, 14, 8, 17, 21, 11, 7, 19, 12, 23, 9, 15, 13, 20, 8, 13].forEach((h) => {
    const bar = document.createElement("span");
    bar.style.height = h + "px";
    wave.appendChild(bar);
  });

  const dur = document.createElement("span");
  dur.className = "voice-dur";
  dur.textContent = clip.label || "🎤";

  const audio = new Audio(src);
  audio.preload = "metadata";
  function showDuration() {
    if (isFinite(audio.duration) && audio.duration > 0) {
      const m = Math.floor(audio.duration / 60);
      const s = Math.floor(audio.duration % 60);
      dur.textContent = `${m}:${String(s).padStart(2, "0")}`;
    }
  }
  audio.addEventListener("loadedmetadata", showDuration);
  audio.addEventListener("durationchange", showDuration);
  audio.addEventListener("play", () => { btn.textContent = "⏸"; wrap.classList.add("playing"); });
  audio.addEventListener("pause", () => { btn.textContent = "▶"; wrap.classList.remove("playing"); });
  audio.addEventListener("ended", () => { btn.textContent = "▶"; wrap.classList.remove("playing"); });

  function toggle() {
    if (audio.paused) {
      if (currentAudio && currentAudio !== audio) currentAudio.pause();
      currentAudio = audio;
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }
  btn.addEventListener("click", toggle);

  wrap.append(btn, wave, dur);
  chat.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;

  // Try to autoplay (works once the user has interacted — i.e. after their click).
  // Silently ignored on stricter browsers; they can tap the play button instead.
  if (currentAudio && currentAudio !== audio) currentAudio.pause();
  currentAudio = audio;
  audio.play().catch(() => {});
}

if (requestBtn && chat) {
  requestBtn.addEventListener("click", () => {
    const pickup = pickupInput.value.trim() || "wherever you are";
    const destination = destinationInput.value.trim() || "anywhere";

    // Your request, as a sent message.
    addBubble(`🚗 Pickup: ${pickup} → ${destination}`, "sent");
    ensurePhoneVisible();

    // Ober starts "typing", then replies.
    requestBtn.disabled = true;
    if (appStatus) {
      appStatus.classList.add("typing");
      appStatus.innerHTML = '<span class="app-dot"></span>typing…';
    }
    const typing = showTyping();
    const delay = 800 + Math.random() * 700;

    setTimeout(() => {
      typing.remove();
      // On a refusal, sometimes he just sends a voice note instead of typing back.
      if (!isAcceptDestination(destination) && voiceClips.length && Math.random() < 0.45) {
        addVoiceBubble(voiceClips[Math.floor(Math.random() * voiceClips.length)]);
      } else {
        addBubble(getReply(destination), "received");
      }
      requestBtn.disabled = false;
      if (appStatus) {
        appStatus.classList.remove("typing");
        appStatus.innerHTML = '<span class="app-dot"></span>online';
      }
    }, delay);
  });
}

// Seed the chat with an opening greeting so the app isn't empty.
if (chat) {
  const greet = document.createElement("div");
  greet.className = "bubble received";
  greet.textContent = "Ober here. Where to? (No promises.)";
  chat.appendChild(greet);
}

// ---------- Reviews ----------
// Add a review with { quote, reviewer }. Add an optional videoId (the bit after
// youtube.com/shorts/ or youtu.be/) to pair a video testimonial beside the quote.
const reviews = [
  { quote: "Collected six of us from three different corners of Kildare at 2am. Didn't complain once. Didn't speak once.", reviewer: "Fallo", videoId: "UAZ_mpt0G14", end: 9 },
  { quote: "Drove like an absolute maniac the entire way. Arrived ten minutes early. Couldn't fault it.", reviewer: "Steve" },
  { quote: "Asked him to come out after. He said no. Asked for a lift home instead. Already in the car park. That's Ober.", reviewer: "Killian" },
  { quote: "He's a nice lad, bit special — but I call Ian for the important jobs.", reviewer: "Louise" },
  { quote: "Fridge is always stocked with ice and Coke. The rum's my own affair. Five stars.", reviewer: "Dermot" },
  { quote: "Who?", reviewer: "Stephen Grainger" },
  { quote: "Sold that bozo a broken amp and he's never charged me once for a lift. Top tier service. 5 stars.", reviewer: "Ian" },
  { quote: "Said 'airport? not too bad' and then said nothing else for forty minutes. Perfect journey.", reviewer: "Anonymous rider" },
  { quote: "He never starts. I never stop. It works.", reviewer: "Olivia" },
  { quote: "He's a sheister.", reviewer: "Andrew Tipple" },
  { quote: "MY BOY'S A LEMON", reviewer: "Bernie Clare" },
];

const reviewsFeatured = document.getElementById("reviews-featured");
const reviewsGrid = document.getElementById("reviews-grid");

if (reviewsFeatured) {
  reviewsFeatured.innerHTML = reviews
    .filter((r) => r.videoId)
    .map((r) => {
      // Optional trimming: start/end (seconds) become YouTube embed params.
      const params = new URLSearchParams();
      if (r.start) params.set("start", r.start);
      if (r.end) params.set("end", r.end);
      const q = params.toString();
      const src = `https://www.youtube-nocookie.com/embed/${r.videoId}${q ? "?" + q : ""}`;
      return `
    <figure class="review-featured">
      <div class="review-video">
        <iframe
          src="${src}"
          title="Video review from ${r.reviewer}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen></iframe>
      </div>
      <figcaption class="review-quote">
        <p class="stars">★★★★★</p>
        <p class="review-text">"${r.quote}"</p>
        <p class="reviewer">— ${r.reviewer}</p>
        <p class="review-badge">🎥 Verified video review</p>
      </figcaption>
    </figure>`;
    })
    .join("");
}

if (reviewsGrid) {
  reviewsGrid.innerHTML = reviews
    .filter((r) => !r.videoId)
    .map(
      (r) => `
    <div class="review">
      <p class="stars">★★★★★</p>
      <p>"${r.quote}"</p>
      <p class="reviewer">— ${r.reviewer}</p>
    </div>`
    )
    .join("");
}

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

// ---------- Evidence Locker: photo gallery ----------
// To add a photo: paste a new { src, caption, category } below.
// src = a file in the repo ("assets/img/Face1.jpg") OR any full image URL.
// category groups the carousel: Childhood · Dressup · Nude/Balls · Catbol · Olivia.
const photos = [
  // ----- Childhood -----
  { src: "assets/img/Bubble Baby.jpeg", caption: "Bubble bath surge pricing. Started young.", category: "Childhood" },
  { src: "assets/img/Cute baby.jpeg", caption: "Five-star rating from birth. Never improved.", category: "Childhood" },
  { src: "assets/img/Fat baby.jpeg", caption: "Already built for the couch.", category: "Childhood" },
  { src: "assets/img/Fat Baby2.jpeg", caption: "Carb-loading for a career of sitting still.", category: "Childhood" },
  { src: "assets/img/Fat Baby3.jpeg", caption: "Peak performance. Downhill from here.", category: "Childhood" },
  { src: "assets/img/Fat Baby4.jpeg", caption: "The chins that launched a thousand naps.", category: "Childhood" },
  { src: "assets/img/Lemon Baby Weather.jpeg", caption: "Lemon jumper, lethal weather. A legend in fleece.", category: "Childhood" },
  { src: "assets/img/Funny boy.jpeg", caption: "Class clown. Still won't drive you home.", category: "Childhood" },
  { src: "assets/img/School boy.jpeg", caption: "Top of the class in everything but punctuality.", category: "Childhood" },
  { src: "assets/img/Face1.jpg", caption: "The face that turns down every lift.", category: "Childhood" },
  { src: "assets/img/Face2.jpg", caption: "Customer service, pictured.", category: "Childhood" },
  { src: "assets/img/Face3.jpg", caption: "Mid-thought. The thought was 'no'.", category: "Childhood" },
  { src: "assets/img/Face4.jpg", caption: "Caught between a yes and a couch.", category: "Childhood" },
  { src: "assets/img/Face5.jpg", caption: "This is him listening to your destination.", category: "Childhood" },
  { src: "assets/img/Face6.png", caption: "Founding member. The amp era.", category: "Childhood" },
  { src: "assets/img/Face7.png", caption: "Guns out, couch adjacent.", category: "Childhood" },
  { src: "assets/img/Face8.png", caption: "Off duty. Still off duty.", category: "Childhood" },
  { src: "assets/img/Face9.png", caption: "Gym every morning. This is the gym working.", category: "Childhood" },
  { src: "assets/img/Hair.jpg", caption: "The hair had its own surge pricing.", category: "Childhood" },
  { src: "assets/img/Hair2.jpeg", caption: "A fringe you could set your watch by.", category: "Childhood" },
  { src: "assets/img/Hair2.jpg", caption: "Big hair, bigger excuses.", category: "Childhood" },
  { src: "assets/img/Hair3.jpeg", caption: "Volume turned up, availability turned down.", category: "Childhood" },
  { src: "assets/img/Hair5.jpg", caption: "Peak follicle. Couldn't be reached for a lift.", category: "Childhood" },
  { src: "assets/img/Messer1.jpg", caption: "Messer by trade. Driver by rumour.", category: "Childhood" },
  { src: "assets/img/Messer2.jpg", caption: "Up to no good and somehow still your top-rated driver.", category: "Childhood" },

  // ----- Playing Dressup -----
  { src: "assets/img/Dressup.jpg", caption: "Committed to the bit since day one.", category: "Dressup" },
  { src: "assets/img/Dressup2.jpg", caption: "Costume on. Shift, off.", category: "Dressup" },
  { src: "assets/img/Dressup3.jpg", caption: "Method actor. The method is avoiding work.", category: "Dressup" },
  { src: "assets/img/Dressup4.jpg", caption: "Couch Certified — pictured in his natural habitat.", category: "Dressup" },
  { src: "assets/img/Dressup5.jpg", caption: "Full commitment, zero context.", category: "Dressup" },
  { src: "assets/img/Dressup6.jpg", caption: "Dressed for a job he'll never accept.", category: "Dressup" },
  { src: "assets/img/Dressup7.jpg", caption: "Available for weddings and christenings. Lifts, no.", category: "Dressup" },
  { src: "assets/img/Dressup8.jpg", caption: "Eccentric isn't a phase, it's a personality.", category: "Dressup" },
  { src: "assets/img/Dressup9.jpg", caption: "The fit is immaculate. The schedule is not.", category: "Dressup" },
  { src: "assets/img/Dressup10.jpg", caption: "He said no to this. Olivia said yes for him.", category: "Dressup" },
  { src: "assets/img/Spider Boy.jpeg", caption: "Friendly neighbourhood non-driver.", category: "Dressup" },
  { src: "assets/img/Super Boy.jpeg", caption: "Saves the day. Won't save you a seat.", category: "Dressup" },
  { src: "assets/img/Wizard boy.jpeg", caption: "Magic everywhere except your ETA.", category: "Dressup" },
  { src: "assets/img/Festival Gif.gif", caption: "Festival mode: fully booked, never moving.", category: "Dressup" },

  // ----- Nude/Balls -----
  { src: "assets/img/Naked1.jpg", caption: "Bollock naked and proud. Standard tier.", category: "Nude/Balls" },
  { src: "assets/img/Naked2.jpg", caption: "Nothing to declare.", category: "Nude/Balls" },
  { src: "assets/img/Naked3.jpg", caption: "Au naturel. As nature and the couch intended.", category: "Nude/Balls" },
  { src: "assets/img/Naked4.jpg", caption: "No uniform, no shame, no lift.", category: "Nude/Balls" },
  { src: "assets/img/Naked5.jpg", caption: "Stripped of everything but the attitude.", category: "Nude/Balls" },
  { src: "assets/img/Naked6.jpg", caption: "Free and unbothered.", category: "Nude/Balls" },
  { src: "assets/img/Naked7.jpg", caption: "The full Oran experience.", category: "Nude/Balls" },
  { src: "assets/img/Naked8.jpg", caption: "Clothing optional. Driving, also optional.", category: "Nude/Balls" },
  { src: "assets/img/Naked9.jpg", caption: "Born ready, dressed never.", category: "Nude/Balls" },
  { src: "assets/img/Pissing2.jpg", caption: "Standard tier. Pictured relieving himself of all standards.", category: "Nude/Balls" },

  // ----- Catbol in memoriam -----
  { src: "assets/img/Catbol1.jpg", caption: "Catbol. Gone, never forgotten. In memoriam.", category: "Catbol" },
  { src: "assets/img/Catbol2.jpg", caption: "The realest passenger he ever had.", category: "Catbol" },

  // ----- Olivia & family -----
  { src: "assets/img/Olivia Kiss.jpg", caption: "Olivia said yes. To the photo, not the lift.", category: "Olivia" },
  { src: "assets/img/Olivia1.jpg", caption: "The woman who answers when you can't reach Oran.", category: "Olivia" },
  { src: "assets/img/Olivia3.jpg", caption: "Better half. Does the actual driving.", category: "Olivia" },
  { src: "assets/img/Oran Family.jpeg", caption: "The Clares. A whole family of no's.", category: "Olivia" },
];

const carousel = document.getElementById("carousel");
const carImg = document.getElementById("car-img");
const carCaption = document.getElementById("car-caption");
const carCounter = document.getElementById("car-counter");
const carCats = document.getElementById("car-cats");
const carThumbs = document.getElementById("car-thumbs");
const carPrev = document.getElementById("car-prev");
const carNext = document.getElementById("car-next");
const carFs = document.getElementById("car-fs");

let carIndex = 0;

// Categories in order of first appearance, with the index of their first photo.
const categories = [...new Set(photos.map((p) => p.category).filter(Boolean))];
const categoryStart = Object.fromEntries(
  categories.map((c) => [c, photos.findIndex((p) => p.category === c)])
);

function renderCarousel() {
  const p = photos[carIndex];
  if (!p) return;
  carImg.src = p.src;
  carImg.alt = p.caption || "";
  carCaption.textContent = p.caption || "";
  // Counter shows position within the current category: "Childhood · 3 / 25".
  if (p.category) {
    const inCat = photos.filter((x) => x.category === p.category);
    const pos = inCat.indexOf(p) + 1;
    carCounter.textContent = `${p.category} · ${pos} / ${inCat.length}`;
  } else {
    carCounter.textContent = `${carIndex + 1} / ${photos.length}`;
  }
  Array.from(carCats.children).forEach((c) =>
    c.classList.toggle("active", c.dataset.cat === p.category)
  );
  Array.from(carThumbs.children).forEach((t, i) => t.classList.toggle("active", i === carIndex));
  const activeThumb = carThumbs.children[carIndex];
  if (activeThumb) activeThumb.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
}

function carGoTo(i) {
  carIndex = (i + photos.length) % photos.length;
  renderCarousel();
}

function carInView() {
  if (document.fullscreenElement === carousel) return true;
  const r = carousel.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}

if (carousel && photos.length) {
  carCats.innerHTML = categories
    .map((c) => `<button class="car-cat" type="button" data-cat="${c}">${c}</button>`)
    .join("");
  carCats.addEventListener("click", (e) => {
    const c = e.target.closest(".car-cat");
    if (c) carGoTo(categoryStart[c.dataset.cat]);
  });

  carThumbs.innerHTML = photos
    .map(
      (p, i) =>
        `<button class="car-thumb" type="button" data-index="${i}" aria-label="Exhibit ${i + 1}"><img src="${p.src}" alt="" loading="lazy" /></button>`
    )
    .join("");

  carThumbs.addEventListener("click", (e) => {
    const t = e.target.closest(".car-thumb");
    if (t) carGoTo(Number(t.dataset.index));
  });
  carPrev.addEventListener("click", () => carGoTo(carIndex - 1));
  carNext.addEventListener("click", () => carGoTo(carIndex + 1));
  carFs.addEventListener("click", () => {
    if (!document.fullscreenElement) carousel.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  });

  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea") return;
    if (!carInView()) return;
    if (e.key === "ArrowLeft") carGoTo(carIndex - 1);
    else if (e.key === "ArrowRight") carGoTo(carIndex + 1);
  });

  renderCarousel();
} else if (carousel) {
  if (carImg) carImg.remove();
  if (carCaption) carCaption.textContent = "Evidence being gathered from the lads…";
  if (carCounter) carCounter.textContent = "0 / 0";
}

// ---------- Ober types: click a tier to reveal a photo of Oran ----------
document.querySelectorAll(".tier-card[data-reveal]").forEach((card) => {
  const reveal = document.createElement("div");
  reveal.className = "tier-reveal";
  reveal.innerHTML = `<img src="${card.dataset.reveal}" alt="" loading="lazy" />`;
  card.appendChild(reveal);

  const hint = document.createElement("p");
  hint.className = "tier-hint";
  hint.textContent = "Tap to reveal";
  card.appendChild(hint);

  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-expanded", "false");

  const toggle = () => {
    const open = card.classList.toggle("open");
    card.setAttribute("aria-expanded", String(open));
    hint.textContent = open ? "Tap to hide" : "Tap to reveal";
  };
  card.addEventListener("click", toggle);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });
});

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

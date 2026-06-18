// OBER — interactive gags

// ---------- Ride request: he always says no (just more colourfully) ----------
const declines = [
  "Are you having a fuckin laugh?",
  "You can suck my cock and balls.",
  "Do I look like a lemon to you?",
  "I'd rather suck Steve's toe.",
  "Ober has reviewed your request. No.",
  "Your driver is 3 minutes away. He is not coming.",
  "Surge pricing in effect: ×0. He's on the couch and the couch is winning.",
  "Ober considered it. He made the face. You know the face. It's a no.",
  "Request declined. He'd love to, genuinely. That was a lie. No.",
];

// Destination-specific replies — matched on a keyword anywhere in the destination.
const specificReplies = [
  { match: "fishery lane", reply: "Oh, where I hit that dog?" },
  { match: "hollywood park", reply: "Steve can fuck right off." },
  { match: "johnstown", reply: "That lad has had enough lifts from me." },
  { match: "airport", reply: "Ya, not too bad." },
  { match: "red lane", reply: "Donkey Legs is on the way YEEHAWW" },
  { match: "red cow", reply: "Fucking Olivia wants me to collect her again." },
];

const requestBtn = document.getElementById("request-btn");
const pickupInput = document.getElementById("pickup");
const destinationInput = document.getElementById("destination");
const chat = document.getElementById("chat");
const appStatus = document.getElementById("app-status");
const phone = document.querySelector(".phone-response");

// Bring the phone (where Ober replies) into view — matters most on mobile,
// where it sits below the form.
function ensurePhoneVisible() {
  if (!phone) return;
  const r = phone.getBoundingClientRect();
  const fullyVisible = r.top >= 0 && r.bottom <= window.innerHeight;
  if (!fullyVisible) phone.scrollIntoView({ behavior: "smooth", block: "center" });
}

let declineIndex = 0;

// A specific reply for known destinations, or null if it's just another no.
function getSpecificReply(destination) {
  const d = destination.toLowerCase();
  const hit = specificReplies.find((s) => d.includes(s.match));
  return hit ? hit.reply : null;
}

function getDecline() {
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

// ---------- Ride types (the four Obers, now inside the request app) ----------
const rideTypes = [
  { id: "standard", emoji: "🚗", name: "Ober Standard", price: "€0", blurb: "One Kia. Immaculate. Climate control set to his preference, not yours.", photo: "assets/img/Pissing2.jpg" },
  { id: "xl", emoji: "🚐", name: "Ober XL", price: "€0 + lifelong debt", blurb: "Six lads, three pickup points, one county, 2am. Completed in total silence.", photo: "assets/img/Fat baby.jpeg" },
  { id: "lemon", emoji: "🍋", name: "Ober Lemon", price: "Priceless", blurb: "Premium tier. Driver arrives in full costume. One weekend only, June 2026.", photo: "assets/img/Lemon Baby Weather.jpeg", featured: true },
  { id: "couch", emoji: "🛋️", name: "Ober Couch", price: "Free, forever", blurb: "He stays home. You stay home. Nobody goes anywhere. Our most popular service.", photo: "assets/img/Dressup4.jpg" },
];

// ---------- Request flow: the left phone is a step-by-step booking wizard ----------
const appFlow = document.getElementById("app-flow");
const appStep = document.getElementById("app-step");
const typeList = document.getElementById("type-list");
const typeReveal = document.getElementById("type-reveal");
const summaryEl = document.getElementById("summary");

const TOTAL_STEPS = 4;
let stepNum = 1;
let selectedType = null; // highlighted but not yet confirmed
let confirmedType = null; // locked in, used in the summary + request

function showStep(n) {
  stepNum = Math.min(Math.max(n, 1), TOTAL_STEPS);
  appFlow.querySelectorAll(".step").forEach((s) =>
    s.classList.toggle("is-active", Number(s.dataset.step) === stepNum)
  );
  if (appStep) appStep.textContent = `Step ${stepNum} of ${TOTAL_STEPS}`;
  if (stepNum === 4) renderSummary();
  const active = appFlow.querySelector(".step.is-active");
  const input = active && active.querySelector(".step-input");
  if (input) input.focus({ preventScroll: true });
}

function renderTypes() {
  typeList.innerHTML = rideTypes
    .map(
      (t) => `<button type="button" class="type-opt${t.featured ? " featured" : ""}" data-type="${t.id}">
        <span class="type-emoji">${t.emoji}</span>
        <span class="type-opt-text"><span class="type-name">${t.name}</span><span class="type-price">${t.price}</span></span>
      </button>`
    )
    .join("");
}

function selectType(id) {
  selectedType = rideTypes.find((t) => t.id === id) || null;
  typeList.querySelectorAll(".type-opt").forEach((b) =>
    b.classList.toggle("selected", b.dataset.type === id)
  );
  if (!selectedType) return;
  typeReveal.hidden = false;
  typeReveal.innerHTML = `
    <img src="${selectedType.photo}" alt="" />
    <p class="type-blurb">${selectedType.blurb}</p>
    <button type="button" class="step-btn step-primary" id="type-confirm">Confirm selection</button>`;
  document.getElementById("type-confirm").addEventListener("click", () => {
    confirmedType = selectedType;
    showStep(4);
  });
}

function renderSummary() {
  const dest = destinationInput.value.trim() || "anywhere";
  const pick = pickupInput.value.trim() || "wherever you are";
  const t = confirmedType || rideTypes[0];
  summaryEl.innerHTML = `
    <div class="sum-row"><span>Destination</span><strong>${dest}</strong></div>
    <div class="sum-row"><span>Pickup</span><strong>${pick}</strong></div>
    <div class="sum-row"><span>Ride type</span><strong>${t.emoji} ${t.name}</strong></div>
    <p class="sum-note">Send it to his phone and see what he says. →</p>`;
}

if (appFlow) {
  renderTypes();
  appFlow.addEventListener("click", (e) => {
    if (e.target.closest("[data-next]")) showStep(stepNum + 1);
    else if (e.target.closest("[data-back]")) showStep(stepNum - 1);
  });
  typeList.addEventListener("click", (e) => {
    const opt = e.target.closest(".type-opt");
    if (opt) selectType(opt.dataset.type);
  });
  appFlow.querySelectorAll(".step-input").forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        showStep(stepNum + 1);
      }
    });
  });

  // Home button: wipe the booking and jump straight back to step 1.
  const appHome = document.getElementById("app-home");
  if (appHome) {
    appHome.addEventListener("click", () => {
      destinationInput.value = "";
      pickupInput.value = "";
      selectedType = null;
      confirmedType = null;
      if (typeReveal) {
        typeReveal.hidden = true;
        typeReveal.innerHTML = "";
      }
      typeList.querySelectorAll(".type-opt").forEach((b) => b.classList.remove("selected"));
      showStep(1);
    });
  }

  showStep(1);
}

// ---------- Request Ober: send the booking to the right phone ----------
if (requestBtn && chat) {
  requestBtn.addEventListener("click", () => {
    const pickup = pickupInput.value.trim() || "wherever you are";
    const destination = destinationInput.value.trim() || "anywhere";
    const t = confirmedType || rideTypes[0];

    // Your request, as a sent message on his phone.
    addBubble(`🚗 ${t.name}: ${pickup} → ${destination}`, "sent");
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
      const specific = getSpecificReply(destination);
      if (specific) {
        // Known destination — always give the bespoke reply.
        addBubble(specific, "received");
      } else if (voiceClips.length && Math.random() < 0.45) {
        // Otherwise he sometimes just fires back a voice note instead of typing.
        addVoiceBubble(voiceClips[Math.floor(Math.random() * voiceClips.length)]);
      } else {
        addBubble(getDecline(), "received");
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
  { quote: "What the fuck was that.", reviewer: "Fallo", videoId: "UAZ_mpt0G14", end: 9 },
  { quote: "Very obliging if you're in a tight spot. The resentment is barely noticeable.", reviewer: "Andrew Tipple" },
  { quote: "He's a sheister.", reviewer: "Andy Brown" },
  { quote: "MY BOY'S A LEMON", reviewer: "Bernie Clare" },
  { quote: "Drove like an absolute maniac the entire way. Arrived ten minutes early. Couldn't fault it.", reviewer: "Steve" },
  { quote: "Asked him to come out after. He said no. Asked for a lift home instead. Already in the car park. That's Ober.", reviewer: "Killian" },
  { quote: "He's a nice lad, bit special — but I call Ian for the important jobs.", reviewer: "Louise Griffin" },
  { quote: "Fridge is always stocked with ice and Coke. The rum's my own affair. Five stars.", reviewer: "Dermot Griffin" },
  { quote: "Who?", reviewer: "Stephen Grainger" },
  { quote: "Sold that bozo a broken amp and he's never charged me once for a lift. Top tier service. 5 stars.", reviewer: "Ian" },
  { quote: "Said 'airport? not too bad' and then said nothing else for forty minutes. Perfect journey.", reviewer: "Anonymous rider" },
  { quote: "Confirmed micropenis. 4 stars.", reviewer: "Olivia" },
];

const reviewsFeatured = document.getElementById("reviews-featured");

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

// Quote reviews become an auto-cycling slider (one at a time, looping).
const reviewSlider = document.getElementById("review-slider");
const reviewTrack = document.getElementById("review-track");
const reviewDots = document.getElementById("review-dots");
const revPrev = document.getElementById("rev-prev");
const revNext = document.getElementById("rev-next");

if (reviewTrack) {
  const quoteReviews = reviews.filter((r) => !r.videoId);
  reviewTrack.innerHTML = quoteReviews
    .map(
      (r) => `
    <figure class="review-slide">
      <p class="stars">★★★★★</p>
      <blockquote class="review-slide-quote">"${r.quote}"</blockquote>
      <figcaption class="reviewer">— ${r.reviewer}</figcaption>
    </figure>`
    )
    .join("");
  reviewDots.innerHTML = quoteReviews
    .map((_, i) => `<button class="review-dot" type="button" data-i="${i}" aria-label="Review ${i + 1}"></button>`)
    .join("");

  const rCount = quoteReviews.length;
  let rIndex = 0;
  let rTimer = null;

  function reviewGoTo(i) {
    rIndex = (i + rCount) % rCount;
    reviewTrack.style.transform = `translateX(-${rIndex * 100}%)`;
    Array.from(reviewDots.children).forEach((d, j) => d.classList.toggle("active", j === rIndex));
  }
  function reviewStop() { if (rTimer) { clearInterval(rTimer); rTimer = null; } }
  function reviewStart() { reviewStop(); if (rCount > 1) rTimer = setInterval(() => reviewGoTo(rIndex + 1), 4000); }

  reviewDots.addEventListener("click", (e) => {
    const d = e.target.closest(".review-dot");
    if (d) { reviewGoTo(Number(d.dataset.i)); reviewStart(); }
  });
  if (revPrev) revPrev.addEventListener("click", () => { reviewGoTo(rIndex - 1); reviewStart(); });
  if (revNext) revNext.addEventListener("click", () => { reviewGoTo(rIndex + 1); reviewStart(); });

  // Pause while the visitor is reading (hover or keyboard focus).
  reviewSlider.addEventListener("mouseenter", reviewStop);
  reviewSlider.addEventListener("mouseleave", reviewStart);
  reviewSlider.addEventListener("focusin", reviewStop);
  reviewSlider.addEventListener("focusout", reviewStart);

  reviewGoTo(0);
  reviewStart();
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

// ---------- Ober Eats: the menu ----------
// Each dish pairs a name + description with a photo or clip. Swap the media
// `src` here to re-pair a dish with a different file.
const eatsMenu = [
  { name: "Oberrito", price: "Market price", desc: "Fully loaded, fully exposed. Served couch-side, no plate.", media: { type: "img", src: "assets/img/UberEats5.jpg" } },
  { name: "Ober Chicken Boot Sandwich", price: "Two left feet", desc: "Two silver boots, one questionable dance. Hold the cutlery.", media: { type: "video", src: "assets/img/Chicken Dance Boots.mp4" } },
  { name: "Ober Wangs", price: "By the dozen", desc: "Flap-fried and flapping. Comes with the wing dance, free of charge.", media: { type: "img", src: "assets/img/Uber Eats Gif.gif" } },
  { name: "Greek Yobert", price: "Floor price", desc: "Floor-churned, locally sourced from the lino. Live cultures, live regrets.", media: { type: "img", src: "assets/img/UberEats2.gif" } },
  { name: "Lemonober", price: "Sour deal", desc: "When life gives him lemons, he eats them whole. Rind and all.", media: { type: "img", src: "assets/img/UberEats4.jpg" } },
  { name: "Obeaned", price: "On the house, man", desc: "Crisp in, lights on, nobody home. Chef's medicated special.", media: { type: "img", src: "assets/img/UberEats6.jpg" } },
];

const eatsMenuEl = document.getElementById("eats-menu");
if (eatsMenuEl) {
  eatsMenuEl.innerHTML = eatsMenu
    .map((d) => {
      const media =
        d.media.type === "video"
          ? `<video src="${d.media.src}" autoplay muted loop playsinline preload="metadata"></video>`
          : `<img src="${d.media.src}" alt="" loading="lazy" />`;
      return `
    <article class="eats-dish">
      <div class="eats-dish-media">${media}</div>
      <div class="eats-dish-text">
        <p class="eats-dish-head"><span class="eats-dish-name">${d.name}</span><span class="eats-dish-dots"></span><span class="eats-dish-price">${d.price}</span></p>
        <p class="eats-dish-desc">${d.desc}</p>
      </div>
    </article>`;
    })
    .join("");
}

// ---------- Evidence Locker: photo gallery ----------
// To add a photo: paste a new { src, caption, category } below.
// src = a file in the repo ("assets/img/Face1.jpg") OR any full image URL.
// category groups the carousel: Childhood · Dressup · Nude/Balls · Catbol · Olivia.
const allPhotos = [
  // ----- Childhood -----
  { src: "assets/img/Bubble Baby.jpeg", caption: "Bubble Bozo", category: "Childhood" },
  { src: "assets/img/Cute baby.jpeg", caption: "Five-star rating from birth. Never improved.", category: "Childhood" },
  { src: "assets/img/Fat baby.jpeg", caption: "Already built for the couch.", category: "Childhood" },
  { src: "assets/img/Fat Baby2.jpeg", caption: "Carb-loading for a career of sitting still.", category: "Childhood" },
  { src: "assets/img/Fat Baby3.jpeg", caption: "My child is about 60kgs", category: "Childhood" },
  { src: "assets/img/Fat Baby4.jpeg", caption: "Why are you doing this to me?", category: "Childhood" },
  { src: "assets/img/Lemon Baby Weather.jpeg", caption: "Lemon jumper, lethal weather. A legend in fleece.", category: "Childhood" },
  { src: "assets/img/Funny boy.jpeg", caption: "Started early on the weights.", category: "Childhood" },
  { src: "assets/img/School boy.jpeg", caption: "Top of the class in everything but maths.", category: "Childhood" },
  { src: "assets/img/Face1.jpg", caption: "The face that turns down every lift.", category: "Childhood" },
  { src: "assets/img/Face2.jpg", caption: "Customer service, pictured.", category: "Childhood" },
  { src: "assets/img/Face3.jpg", caption: "Mid-thought. The thought was 'no'.", category: "Childhood" },
  { src: "assets/img/Face4.jpg", caption: "Donkey brains", category: "Childhood" },
  { src: "assets/img/Face5.jpg", caption: "This is him listening to your destination.", category: "Childhood" },
  { src: "assets/img/Face6.png", caption: "Have ye got 2 euro for a bus to Carlow", category: "Childhood" },
  { src: "assets/img/Face7.png", caption: "When I grow up I wanna be a coconut and live in the big city all by myself", category: "Childhood" },
  { src: "assets/img/Face8.png", caption: "My hero.", category: "Childhood" },
  { src: "assets/img/Face9.png", caption: "Back when I was a skinny boi", category: "Childhood" },
  { src: "assets/img/Hair.jpg", caption: "", category: "Childhood" },
  { src: "assets/img/Hair2.jpeg", caption: "Lights down low", category: "Childhood" },
  { src: "assets/img/Hair2.jpg", caption: "Ah this era.", category: "Childhood" },
  { src: "assets/img/Hair3.jpeg", caption: "Snowbozo.", category: "Childhood" },
  { src: "assets/img/Hair5.jpg", caption: "", category: "Childhood" },
  { src: "assets/img/Messer1.jpg", caption: "Sucking toes on request.", category: "Childhood" },
  { src: "assets/img/Messer2.jpg", caption: "I'm pointing the way.", category: "Childhood" },
  { src: "assets/img/Oran Family.jpeg", caption: "Our first lemon.", category: "Childhood" },

  // ----- Playing Dressup -----
  { src: "assets/img/Dressup.jpg", caption: "Loves a hat", category: "Dressup" },
  { src: "assets/img/Dressup2.jpg", caption: "Ya not too bad", category: "Dressup" },
  { src: "assets/img/Dressup3.jpg", caption: "Method actor. The method is avoiding work.", category: "Dressup" },
  { src: "assets/img/Dressup4.jpg", caption: "Couch Certified — pictured in his natural habitat.", category: "Dressup" },
  { src: "assets/img/Dressup6.jpg", caption: "Dressed for a job he'll never accept.", category: "Dressup" },
  { src: "assets/img/Dressup7.jpg", caption: "Long John Ober", category: "Dressup" },
  { src: "assets/img/Dressup9.jpg", caption: "Pink Pony Ober", category: "Dressup" },
  { src: "assets/img/Dressup10.jpg", caption: "I'm gonna keep on dancin", category: "Dressup" },
  { src: "assets/img/Spider Boy.jpeg", caption: "Friendly neighbourhood non-driver.", category: "Dressup" },
  { src: "assets/img/Super Boy.jpeg", caption: "Saves the day. Won't save you a seat.", category: "Dressup" },
  { src: "assets/img/Wizard boy.jpeg", caption: "You're a wizard, Ober", category: "Dressup" },

  // ----- Nude/Balls -----
  { src: "assets/img/Naked1.jpg", caption: "Bollock naked and proud. Standard tier.", category: "Nude/Balls" },
  { src: "assets/img/Naked4.jpg", caption: "No uniform, no shame, no lift.", category: "Nude/Balls" },
  { src: "assets/img/Naked5.jpg", caption: "Caught mid shit", category: "Nude/Balls" },
  { src: "assets/img/Naked6.jpg", caption: "Camel Tober", category: "Nude/Balls" },
  { src: "assets/img/Naked8.jpg", caption: "Natural habitat", category: "Nude/Balls" },
  { src: "assets/img/Naked9.jpg", caption: "Strip Pober", category: "Nude/Balls" },
  { src: "assets/img/Pissing2.jpg", caption: "Standard tier. Pictured relieving himself of all standards.", category: "Nude/Balls" },

  // ----- Olivia -----
  { src: "assets/img/Olivia Kiss.jpg", caption: "He prefers kissing the mudcrab", category: "Olivia" },
  { src: "assets/img/Olivia1.jpg", caption: "Come on bol, let's go out", category: "Olivia" },
];

// Any photo already shown elsewhere — the tier reveals, the licence, the chat
// avatar — is excluded from the carousel so nothing repeats. Tier photos come
// from rideTypes; licence/avatar are read straight from the DOM, so this stays
// correct automatically if those picks ever change.
const usedElsewhere = new Set(rideTypes.map((t) => t.photo));
document.querySelectorAll(".licence-photo, .app-avatar").forEach((img) => {
  const src = img.getAttribute("src");
  if (src) usedElsewhere.add(src);
});
const photos = allPhotos.filter((p) => !usedElsewhere.has(p.src));

const carousel = document.getElementById("carousel");
const carImg = document.getElementById("car-img");
const carCaption = document.getElementById("car-caption");
const carThumbs = document.getElementById("car-thumbs");
const carPrev = document.getElementById("car-prev");
const carNext = document.getElementById("car-next");
const carFs = document.getElementById("car-fs");

let carIndex = 0;

function renderCarousel() {
  const p = photos[carIndex];
  if (!p) return;
  carImg.src = p.src;
  carImg.alt = p.caption || "";
  carCaption.textContent = p.caption || "";
  carCaption.style.display = p.caption ? "" : "none";
  Array.from(carThumbs.children).forEach((t, i) => t.classList.toggle("active", i === carIndex));
  const activeThumb = carThumbs.children[carIndex];
  // Scroll only the thumbnail strip horizontally — never the page (scrollIntoView
  // would yank the whole window down to the carousel on load).
  if (activeThumb) {
    carThumbs.scrollTo({
      left: activeThumb.offsetLeft - (carThumbs.clientWidth - activeThumb.clientWidth) / 2,
      behavior: "smooth",
    });
  }
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
}

// ---------- Step counter: forever almost done ----------
const stepsCount = document.getElementById("steps-count");
const stepsFill = document.getElementById("steps-fill");
const trackerStatus = document.getElementById("tracker-status");
const trackerFrame = document.getElementById("tracker-frame");

// Keyless Google Maps embed — swapping the coords makes the pin "jump".
const mapUrl = (lat, lng, z = 15) =>
  `https://maps.google.com/maps?q=${lat},${lng}&z=${z}&hl=en&output=embed`;

// Where Oran is "spotted" — he never actually goes anywhere useful.
const trackerSpots = [
  { line: "📍 Pulling his plumbs on the couch at home", lat: 53.192444, lng: -6.594105, z: 13 },
  { line: "📍 Johnstown, collecting Ian again", lat: 53.227483, lng: -6.607912, z: 13 },
  { line: "📍 Visiting Mammy and Daddy", lat: 53.233739, lng: -6.649594, z: 13 },
  { line: "📍 Oh look, Steve needs a lift again", lat: 53.222843, lng: -6.658297, z: 13 },
  { line: "📍 Up in the office… pullin his plumbs still", lat: 53.312831, lng: -6.344898, z: 13 },
];

const VATICAN_LINE = "📍 Oranangelo in the Sistine Chapel";
const VATICAN_SPOT = { line: VATICAN_LINE, lat: 41.9029, lng: 12.4545, z: 14 };
let oranangeloActive = false;
let spotIndex = 0;

function showSpot(spot) {
  trackerStatus.textContent = spot.line;
  if (trackerFrame) trackerFrame.src = mapUrl(spot.lat, spot.lng, spot.z);
}

let steps = 9214;

setInterval(() => {
  steps += Math.floor(Math.random() * 18) + 4;
  // He never quite gets there while you're watching.
  if (steps > 9986) steps = 9214;
  stepsCount.textContent = steps.toLocaleString();
  stepsFill.style.width = (steps / 10000) * 100 + "%";
}, 1500);

// Jump him around the map (unless the OranAngelo easter egg has him in Rome).
showSpot(trackerSpots[0]);
setInterval(() => {
  if (oranangeloActive) {
    showSpot(VATICAN_SPOT);
    return;
  }
  spotIndex = (spotIndex + 1) % trackerSpots.length;
  showSpot(trackerSpots[spotIndex]);
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

// ---------- OranAngelo easter egg ----------
// Flipping the footer switch scrolls up to the live tracker, locks the map to
// the Sistine Chapel and reveals the OranAngelo painting beside it. The X (or
// the switch / Esc) restores the normal location-cycling map.
const oaSwitch = document.getElementById("oranangelo-switch");
const tracker = document.getElementById("tracker");
const trackerAngelo = document.getElementById("tracker-angelo");
const trackerAngeloClose = document.getElementById("tracker-angelo-close");

if (oaSwitch && tracker && trackerAngelo) {
  function setEgg(on) {
    oranangeloActive = on;
    oaSwitch.classList.toggle("on", on);
    oaSwitch.setAttribute("aria-pressed", String(on));
    tracker.classList.toggle("angelo-active", on);
    trackerAngelo.hidden = !on;
    // Lock the map to Rome, or drop back into the normal cycle.
    showSpot(on ? VATICAN_SPOT : trackerSpots[spotIndex]);
    if (on) tracker.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  oaSwitch.addEventListener("click", () => setEgg(!oranangeloActive));
  trackerAngeloClose?.addEventListener("click", () => setEgg(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && oranangeloActive) setEgg(false);
  });
}

// ---------- Build stamp: when was this page last deployed? ----------
// document.lastModified comes from the page's Last-Modified header, which on
// GitHub Pages reflects the deploy time — no build step needed.
const buildDate = document.getElementById("build-date");
if (buildDate) {
  const d = new Date(document.lastModified);
  buildDate.textContent = isNaN(d)
    ? document.lastModified
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// ---------- Catbol in Memoriam ----------
// Add more photos here as they're gathered.
const catbolPhotos = [
  "assets/img/Catbol/Catbol Cute.jpg",
  "assets/img/Catbol/PXL_20220623_174550694.jpg",
  "assets/img/Catbol/PXL_20220625_234335427.jpg",
  "assets/img/Catbol/PXL_20220711_222231330.jpg",
  "assets/img/Catbol/PXL_20220731_174424613.jpg",
  "assets/img/Catbol/PXL_20220826_224318366.MP.jpg",
  "assets/img/Catbol/PXL_20220826_224406363.MP.jpg",
  "assets/img/Catbol/PXL_20220901_211658355.MP.jpg",
  "assets/img/Catbol/PXL_20220904_212502885.jpg",
  "assets/img/Catbol/PXL_20221022_223559392.MP.jpg",
  "assets/img/Catbol/PXL_20221211_205105234.jpg",
  "assets/img/Catbol/PXL_20230107_174555118.jpg",
  "assets/img/Catbol1.jpg",
  "assets/img/Catbol2.jpg",
];
const catbolBtn = document.getElementById("catbol-btn");
const catbolOverlay = document.getElementById("catbol-overlay");
const catbolClose = document.getElementById("catbol-close");
const catbolStage = document.getElementById("catbol-stage");
const catbolReel = document.getElementById("catbol-reel");
const catbolFinal = document.getElementById("catbol-final");
const catbolSkip = document.getElementById("catbol-skip");
const catbolReplay = document.getElementById("catbol-replay");
const catbolPour = document.getElementById("catbol-pour");
const catbolCanvas = document.getElementById("catbol-canvas");

if (catbolBtn && catbolOverlay) {
  // ----- Build the credits reel from the photos + memorial lines -----
  const reelLines = [
    "The realest passenger he ever had.",
    "Never paid a fare. Never had to.",
    "Always shotgun. Never seatbelt.",
  ];
  function buildReel() {
    const seq = [
      `<div class="reel-line reel-eyebrow">In loving memory of</div>`,
      `<div class="reel-line reel-name">Catbol</div>`,
      `<div class="reel-line reel-dates">June 2022 — June 2026</div>`,
      `<div class="reel-line reel-blessing">Ar dheis Dé go raibh a anam</div>`,
    ];
    // Skip the finale image so it only appears once (at the very end).
    const reelPhotos = catbolPhotos.filter((s) => s !== "assets/img/Catbol1.jpg");
    reelPhotos.forEach((src, i) => {
      seq.push(`<div class="reel-line reel-photo"><img src="${src}" alt="Catbol" /></div>`);
      if (i === 3) seq.push(`<div class="reel-line reel-quote">${reelLines[0]}</div>`);
      if (i === 7) seq.push(`<div class="reel-line reel-quote">${reelLines[1]}</div>`);
      if (i === 10) seq.push(`<div class="reel-line reel-quote">${reelLines[2]}</div>`);
    });
    seq.push(`<div class="reel-line reel-quote">Gone, but forever in the back seat.</div>`);
    seq.push(`<div class="reel-line reel-quote">We'll never forget you. 🐾</div>`);
    catbolReel.innerHTML = seq.join("");
  }
  buildReel();

  // ----- The slow credit roll (time-driven so we get an end callback) -----
  const REEL_MS = 36000;
  let reelStart = 0;
  let reelRAF = 0;

  function stepReel(ts) {
    if (!reelStart) reelStart = ts;
    const t = Math.min((ts - reelStart) / REEL_MS, 1);
    const startY = catbolStage.clientHeight;
    const endY = -catbolReel.scrollHeight;
    catbolReel.style.transform = `translateY(${startY + (endY - startY) * t}px)`;
    if (t < 1) reelRAF = requestAnimationFrame(stepReel);
    else showFinal();
  }
  function startReel() {
    catbolFinal.classList.remove("show");
    if (catbolSkip) catbolSkip.style.display = "";
    reelStart = 0;
    cancelAnimationFrame(reelRAF);
    reelRAF = requestAnimationFrame(stepReel);
  }
  function showFinal() {
    cancelAnimationFrame(reelRAF);
    if (catbolSkip) catbolSkip.style.display = "none";
    catbolFinal.classList.add("show");
  }

  // ----- three.js: black-and-white paw prints drifting up behind it -----
  let tInit = false, tRun = false, tRAF = 0, tRenderer, tScene, tCam;
  const tSprites = [];

  function pawTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#ffffff";
    g.beginPath(); g.ellipse(64, 84, 27, 21, 0, 0, Math.PI * 2); g.fill(); // pad
    [[34, 48, 11], [54, 34, 12], [78, 34, 12], [96, 48, 11]].forEach(([x, y, r]) => {
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); // toe beans
    });
    return new THREE.CanvasTexture(c);
  }
  function seedSprite(s, anywhere) {
    s.position.x = (Math.random() * 2 - 1) * 8;
    s.position.y = anywhere ? (Math.random() * 2 - 1) * 8 : -8 - Math.random() * 3;
    s.position.z = (Math.random() * 2 - 1) * 2;
    const sc = 0.4 + Math.random() * 0.9;
    s.scale.set(sc, sc, 1);
    s.userData.spd = 0.012 + Math.random() * 0.03;
    s.userData.sway = Math.random() * Math.PI * 2;
    s.material.rotation = Math.random() * Math.PI * 2;
  }
  function sizeThree() {
    if (!tRenderer) return;
    const w = catbolCanvas.clientWidth || window.innerWidth;
    const h = catbolCanvas.clientHeight || window.innerHeight;
    tRenderer.setSize(w, h, false);
    tCam.aspect = w / h;
    tCam.updateProjectionMatrix();
  }
  function initThree() {
    if (tInit || typeof THREE === "undefined" || !catbolCanvas) return;
    try {
      tRenderer = new THREE.WebGLRenderer({ canvas: catbolCanvas, alpha: true, antialias: true });
      tRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      tScene = new THREE.Scene();
      tCam = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      tCam.position.z = 10;
      const tex = pawTexture();
      for (let i = 0; i < 32; i++) {
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.1 + Math.random() * 0.22, depthTest: false });
        const s = new THREE.Sprite(mat);
        seedSprite(s, true);
        tScene.add(s);
        tSprites.push(s);
      }
      sizeThree();
      window.addEventListener("resize", sizeThree);
      tInit = true;
    } catch (e) { /* no WebGL — reel still plays */ }
  }
  function animThree() {
    if (!tRun) return;
    tSprites.forEach((s) => {
      s.position.y += s.userData.spd;
      s.userData.sway += 0.01;
      s.position.x += Math.sin(s.userData.sway) * 0.004;
      s.material.rotation += 0.0015;
      if (s.position.y > 9) seedSprite(s, false);
    });
    tRenderer.render(tScene, tCam);
    tRAF = requestAnimationFrame(animThree);
  }
  function startThree() { if (tInit && !tRun) { tRun = true; sizeThree(); animThree(); } }
  function stopThree() { tRun = false; cancelAnimationFrame(tRAF); }

  // ----- Pour one out: rain black cats + paws -----
  function pourOneOut() {
    const glyphs = ["🐾", "🐈‍⬛", "🤍"];
    for (let i = 0; i < 30; i++) {
      const drop = document.createElement("div");
      drop.className = "catbol-drop";
      drop.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      drop.style.left = Math.random() * 100 + "vw";
      drop.style.fontSize = 1.2 + Math.random() * 1.8 + "rem";
      drop.style.animationDuration = 2.4 + Math.random() * 2.2 + "s";
      drop.style.animationDelay = Math.random() * 0.6 + "s";
      catbolOverlay.appendChild(drop);
      setTimeout(() => drop.remove(), 5400);
    }
  }

  // ----- Lifecycle -----
  function openCatbol() {
    catbolOverlay.classList.add("show");
    catbolOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("intro-open");
    initThree();
    startThree();
    startReel();
  }
  function closeCatbol() {
    catbolOverlay.classList.remove("show");
    catbolOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("intro-open");
    cancelAnimationFrame(reelRAF);
    stopThree();
  }

  catbolBtn.addEventListener("click", openCatbol);
  catbolClose.addEventListener("click", closeCatbol);
  if (catbolSkip) catbolSkip.addEventListener("click", showFinal);
  if (catbolReplay) catbolReplay.addEventListener("click", startReel);
  if (catbolPour) catbolPour.addEventListener("click", pourOneOut);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && catbolOverlay.classList.contains("show")) closeCatbol();
  });
}

// ---------- Greatest Hits: self-hosted video clips ----------
// Add a clip: drop the file in assets/video/ and add its filename below.
// The section stays hidden until there's at least one clip.
const clips = [
  "Trump1.mp4",
  "Sick Doctor Niall.mp4",
  "Dobby.mp4",
  "Mashed Banana.mp4",
  "Oran German.mp4",
  "Patrice.mp4",
  "Licking foot AI.mp4",
  "Donkey Legs Kick.mp4",
  "Cotton Eye Joe.mp4",
];
const greatestHits = document.getElementById("greatest-hits");
const clipsTrack = document.getElementById("clips-track");
const clipsCounter = document.getElementById("clips-counter");
const clipPrev = document.getElementById("clip-prev");
const clipNext = document.getElementById("clip-next");

if (greatestHits && clipsTrack && clips.length) {
  greatestHits.hidden = false;
  clipsTrack.innerHTML = clips
    .map(
      (file) =>
        `<div class="clip-slide"><video src="assets/video/${file}" controls preload="metadata" playsinline></video></div>`
    )
    .join("");

  const clipCount = clips.length;
  let clipIndex = 0;

  function clipGoTo(i) {
    clipIndex = (i + clipCount) % clipCount;
    clipsTrack.style.transform = `translateX(-${clipIndex * 100}%)`;
    clipsTrack.querySelectorAll("video").forEach((v) => v.pause()); // stop the one you're leaving
    if (clipsCounter) clipsCounter.textContent = `${clipIndex + 1} / ${clipCount}`;
  }

  clipPrev?.addEventListener("click", () => clipGoTo(clipIndex - 1));
  clipNext?.addEventListener("click", () => clipGoTo(clipIndex + 1));
  if (clipCount < 2) {
    if (clipPrev) clipPrev.style.display = "none";
    if (clipNext) clipNext.style.display = "none";
  }
  clipGoTo(0);
}

// ---------- Intro gate: blacked-out splash, dismissed by "Enter site" ----------
const introGate = document.getElementById("intro-gate");
const introEnter = document.getElementById("intro-enter");
const introVideo = document.getElementById("intro-video");

if (introGate && introEnter) {
  let entered = false;
  try { entered = sessionStorage.getItem("oberEntered") === "1"; } catch (e) {}

  if (entered) {
    introGate.remove(); // already entered this session — skip the splash
  } else {
    document.body.classList.add("intro-open");
    introEnter.addEventListener("click", () => {
      try { sessionStorage.setItem("oberEntered", "1"); } catch (e) {}
      if (introVideo) introVideo.pause();
      introGate.classList.add("hide");
      document.body.classList.remove("intro-open");
      setTimeout(() => introGate.remove(), 700);
    });
  }
}

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
  { src: "assets/img/Oran Family.jpeg", caption: "The Clares. A whole family of no's.", category: "Childhood" },

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

  // ----- Nude/Balls -----
  { src: "assets/img/Naked1.jpg", caption: "Bollock naked and proud. Standard tier.", category: "Nude/Balls" },
  { src: "assets/img/Naked2.jpg", caption: "Nothing to declare.", category: "Nude/Balls" },
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

  // ----- Olivia -----
  { src: "assets/img/Olivia Kiss.jpg", caption: "Olivia said yes. To the photo, not the lift.", category: "Olivia" },
  { src: "assets/img/Olivia1.jpg", caption: "The woman who answers when you can't reach Oran.", category: "Olivia" },
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
  { line: "📍 Pulling his plumbs on the couch at home", lat: 53.192444, lng: -6.594105, z: 16 },
  { line: "📍 Johnstown, collecting Ian again", lat: 53.227483, lng: -6.607912, z: 16 },
  { line: "📍 Visiting Mammy and Daddy", lat: 53.233739, lng: -6.649594, z: 16 },
  { line: "📍 Oh look, Steve needs a lift again", lat: 53.222843, lng: -6.658297, z: 16 },
  { line: "📍 Up in the office… pullin his plumbs still", lat: 53.312831, lng: -6.344898, z: 16 },
];

const VATICAN_LINE = "📍 Oranangelo in the Sistine Chapel";
const VATICAN_SPOT = { line: VATICAN_LINE, lat: 41.9029, lng: 12.4545, z: 16 };
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
  "assets/img/Catbol1.jpg",
  "assets/img/Catbol2.jpg",
];
const catbolBtn = document.getElementById("catbol-btn");
const catbolOverlay = document.getElementById("catbol-overlay");
const catbolClose = document.getElementById("catbol-close");
const catbolGallery = document.getElementById("catbol-gallery");

if (catbolBtn && catbolOverlay) {
  catbolGallery.innerHTML = catbolPhotos
    .map((src) => `<img src="${src}" alt="Catbol" loading="lazy" />`)
    .join("");

  const openCatbol = () => {
    catbolOverlay.classList.add("show");
    catbolOverlay.setAttribute("aria-hidden", "false");
  };
  const closeCatbol = () => {
    catbolOverlay.classList.remove("show");
    catbolOverlay.setAttribute("aria-hidden", "true");
  };

  catbolBtn.addEventListener("click", openCatbol);
  catbolClose.addEventListener("click", closeCatbol);
  catbolOverlay.addEventListener("click", (e) => {
    if (e.target === catbolOverlay) closeCatbol();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && catbolOverlay.classList.contains("show")) closeCatbol();
  });
}

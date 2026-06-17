# Plan: OBER site — content refresh + feature batch

## Context

The site is in good shape; now it moves from "test content" to the real thing.
Ian has curated and labelled the real photo set and given a batch of content +
feature changes. The first job is a **photo refresh** (the current 12 images are
placeholders), after which the curated, categorised images drive the site. Then
a series of copy, layout, and feature changes. Some items need assets Ian will
supply as we go; the plan separates "do now" from "needs assets."

Decisions locked in:
- **Images:** filenames encode category + caption — I parse them.
- **Hero headline:** "Lightspeed delivery."
- **AI video section:** mixed hosting (YouTube embeds + self-hosted MP4s).

All work is in three files: `index.html`, `styles.css`, `app.js` (the
photos / reviews / videos data arrays live in `app.js`). Bump the `?v=`
cache-buster on every push.

---

## Phase 1 — Photo refresh (prerequisite, drives everything else)

**Workflow:** Ian uploads the new labelled images to `assets/img/`. Because
filenames encode the info, on execution I will:
1. `ls assets/img/` and read the actual filenames.
2. Parse each into **category + caption** (e.g. `Childhood - lemon jumper.jpg`
   → category "Childhood", caption "Lemon jumper"). Names are "close enough,"
   so I'll map loose names to the four categories and **confirm the grouping**
   with Ian before finalising.
3. Rebuild the `photos` array in `app.js` as `{ src, caption, category }`.
4. `git rm` the 12 old placeholder images.
5. Repoint the other image consumers to chosen new files: **licence photo**
   (`.licence-photo`), **chat avatar** (`.app-avatar`), and the **tier-reveal
   photos** (Phase 2) — 1 specific pick each.

**Categories:** Childhood, Nude/Balls, Playing Dressup, Catbol in memoriam
(+ any extras that emerge from the filenames).

---

## Phase 2 — Changes needing no new assets

### Hero (index.html + styles.css)
- Headline → **"Lightspeed delivery."** (second word in lemon accent).
- Confirm sub-copy still reads (reluctant on the couch, lethal once moving).

### Driver licence (index.html + styles.css)
- **Renumber fields 1–6** sequentially: 1 Surname · 2 First names · 3 Born ·
  4 Authority (NDLS) · 5 Address (the couch) · **6 = OBER-14782-LEMON** (move
  the driver number from under the photo into field 6).
- **Signature on one line** — shrink `.licence-sig` so "Oran Clare" never wraps.
- **Align licence bottom with phone bottom** on desktop: let the phone span +
  stretch to the left column height (chat flexes to fill) so both bottoms meet;
  finesse with screenshots, cap height if it grows awkward.
- New licence photo from the refreshed set.

### Reviews (app.js `reviews` array)
- **Fallo:** quote → `"…"` (keep video, `end: 9`).
- **Louise:** name → "Louise"; quote → "He's a nice lad, bit special — but I
  call Ian for the important jobs." (refine)
- **Dermot:** name → "Dermot"; quote → "Fridge is always stocked with ice and
  Coke. The rum's my own affair. Five stars." (refine)
- **Stephen:** name → "Stephen Grainger" (keep the "Who?" gag).
- **Ian:** name → "Ian"; quote → "Sold that bozo a broken amp and he's never
  charged me once for a lift. Top tier service. 5 stars."
- **Olivia:** name → "Olivia"; quote → **placeholder** (Ian to supply).
- **Add** "Andrew Tipple" → "He's a sheister."
- **Add** "Bernie Clare" → "MY BOY'S A LEMON" (proud-parent caps).
- Keep Steve / Killian / Anonymous rider unless told otherwise.

### Ober types reveal-a-photo (index.html + styles.css + app.js)
- Each `.tier-card` (Standard / XL / Lemon / Couch) **clicks to reveal a photo
  of Oran** beneath it (accordion expand, smooth). Data-driven: map each tier →
  one image. Needs 4 picks from the refreshed set.

### Photo carousel categories (app.js + styles.css)
- Carousel becomes a categorised presentation: photos carry `category`; add a
  **category nav** (chips: Childhood · Dressup · Nude/Balls · Catbol) that jump
  to the first photo of each group, and show **"Category · n / m"** in the
  counter. One continuous reel with category labels (keeps prev/next, thumbs,
  fullscreen). Extends the existing carousel in `app.js`.

---

## Phase 3 — Items needing assets from Ian

### OranAngelo easter egg (index.html + styles.css + app.js)
- A **hidden switch at the bottom** (a cryptic toggle in the footer). Flipping
  it reroutes the live-location tracker to "📍 Doing loops of the Sistine
  Chapel, Vatican City…" and fades in a **full-screen "OranAngelo" overlay**
  (Creation-of-Adam parody), dismissable.
- ⏳ Needs the OranAngelo image → `assets/img/oranangelo.*`.

### Ober Eats media (index.html + styles.css)
- Add a media strip to the eats card: **Oran eating** photos, a **chicken
  clip**, **lemon-eating**, **crisp drool face**.
- ⏳ Needs those photos/clips. Prefer short muted MP4 loops over heavy GIFs.

### AI / real video section — new last section (index.html + app.js + styles.css)
- New section before the footer ("Special Features" / "The Ober Cinematic
  Universe"): **Trump**, **Licking foot**, **Donkey legs**.
- Supports **both** a YouTube `videoId` and a self-hosted mp4 `src` per entry —
  extends the footage render pattern.
- ⏳ Needs YouTube links and/or mp4 files per clip.

---

## Sequencing
1. **Phase 1** once Ian uploads the labelled images (confirm category mapping).
2. **Phase 2** right after — no asset blocks except the 5 image picks
   (licence + 4 tiers), which come from Phase 1's set.
3. **Phase 3** as each asset lands; independent, ships piecemeal.

## Verification
- Local serve (`python3 -m http.server`) + headless screenshots for each visual
  change: hero, licence (fields 1–6, one-line signature, bottom aligned to
  phone), tier reveal, carousel categories (nav jumps + counter), reviews,
  Ober Eats strip, OranAngelo overlay, AI video section — desktop + 390px mobile.
- Browser-side structural assertions (element counts, category grouping, embed
  URLs) as in prior steps. No console errors. Push + hard-refresh to verify live.

## Open items to confirm during execution
- Category mapping once real filenames are visible.
- The 5 image picks (licence + 4 tier reveals).
- Final wording: Louise / Dermot quotes; Olivia's quote (Ian to supply).
- Assets: OranAngelo image; eating media; AI video links/files.

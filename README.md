# OBER 🍋

> Get there. Eventually.

A fake ride-sharing website dedicated to Oran "Ober" Clare, built for his stag
(19–21 June 2026, Mount Eagle, Foynes). The premise: Ireland's most reluctant
rideshare service — one driver, zero enthusiasm, five stars.

## Running it

It's a static site with no build step. Open `index.html` in a browser, or serve it:

```bash
python3 -m http.server 8000
```

Deployable as-is to GitHub Pages.

## Site flow

1. **Hero** — Uber-style landing, "Get there. Eventually."
2. **Request an Ober** — interactive ride request that always declines
   (with rotating excuses), unless the destination is the airport, the gym,
   or the couch.
3. **Ride tiers** — Ober Standard / XL / Lemon / Couch.
4. **Meet your driver** — profile card (5.0 stars, locked), badges, stats.
   Photo slot ready for a real picture.
5. **Live tracker** — step counter permanently stuck just short of 10,000.
6. **Reviews** — five-star testimonials from the lads and the Griffin family.
7. **Ober Eats** — the same burger, 47 nights running.
8. **FAQ** — every answer is no.
9. **Service interruption notice** — live countdown to the stag.
10. **Evidence Locker** — gallery placeholder awaiting photos from the lads.

Bonus: the 🍋 button in the nav activates Lemon Mode.

## Still to do

- [ ] Drop real photos into the Evidence Locker + driver profile
      (source: the shared Drive folder)
- [ ] Add any new lore from the lads' WhatsApp crowdsourcing
- [ ] Deploy to GitHub Pages (or oberclare.ie if we're committing to the bit)

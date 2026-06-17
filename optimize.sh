#!/usr/bin/env bash
#
# optimize.sh — shrink the OBER media assets for the web, conservatively.
#
# What it does (quality kept high, nothing destructive):
#   • Photos (.jpg/.jpeg/.png): downscale to a max of 1600px on the long edge
#     (only if larger), strip camera metadata, re-save at quality 85.
#   • Animated GIFs (.gif): scale down + lossy-optimise (stays a .gif, so the
#     site keeps working with no HTML changes).
#   • Videos (.mp4): re-encode H.264 at CRF 26, capped at 1280px, web-faststart.
#
# Originals are ALWAYS backed up to ./.asset-originals first, and every run
# reads from that backup — so it's repeatable and you can restore any time.
#
# Requirements (install whichever you have; missing ones are skipped with a note):
#   • ImageMagick  → `magick` or `convert`   (photos)
#   • gifsicle                                 (gifs)
#   • ffmpeg                                   (videos)
#
#   macOS:  brew install imagemagick gifsicle ffmpeg
#   Ubuntu: sudo apt install imagemagick gifsicle ffmpeg
#
# Usage:
#   cd into the repo, then:  bash optimize.sh
#   Review the before/after, then:  git add -A && git commit && git push
#
set -euo pipefail

MAX_DIM=1600        # max px on the long edge for photos
JPEG_QUALITY=85     # 85 ≈ visually lossless for the web
GIF_MAX_WIDTH=720   # cap animated GIF width
VIDEO_MAX=1280      # cap video long edge
VIDEO_CRF=26        # higher = smaller/lower quality; 26 is a safe web default

ORIG_DIR=".asset-originals"

# --- locate tools -----------------------------------------------------------
IM=""
if command -v magick >/dev/null 2>&1; then IM="magick"
elif command -v convert >/dev/null 2>&1; then IM="convert"; fi
HAVE_GIFSICLE=$(command -v gifsicle >/dev/null 2>&1 && echo 1 || echo 0)
HAVE_FFMPEG=$(command -v ffmpeg   >/dev/null 2>&1 && echo 1 || echo 0)

[ -z "$IM" ]               && echo "⚠️  ImageMagick not found — photos will be skipped."
[ "$HAVE_GIFSICLE" = 0 ]   && echo "⚠️  gifsicle not found — GIFs will be skipped."
[ "$HAVE_FFMPEG" = 0 ]     && echo "⚠️  ffmpeg not found — videos will be skipped."

# --- back up originals once, then always work from the backup ---------------
if [ ! -d "$ORIG_DIR" ]; then
  mkdir -p "$ORIG_DIR"
  [ -d assets/img ]   && cp -a assets/img   "$ORIG_DIR/"
  [ -d assets/video ] && cp -a assets/video "$ORIG_DIR/"
  echo "📦 Backed up originals to $ORIG_DIR (git-ignored; delete when happy)."
else
  echo "📦 Using existing originals backup in $ORIG_DIR."
fi

before=$(du -sh "$ORIG_DIR" | cut -f1)
echo "— Original media size: $before"
echo "— Optimising…"

shopt -s nullglob
processed=0

# Iterate over the pristine backup; write results into assets/…
while IFS= read -r -d '' src <&3; do
  rel="${src#"$ORIG_DIR"/}"     # e.g. img/Fat baby.jpeg
  dst="assets/$rel"
  mkdir -p "$(dirname "$dst")"
  ext="${src##*.}"
  ext="$(printf '%s' "$ext" | tr '[:upper:]' '[:lower:]')"

  case "$ext" in
    jpg|jpeg)
      [ -z "$IM" ] && { cp -a "$src" "$dst"; continue; }
      "$IM" "$src" -auto-orient -resize "${MAX_DIM}x${MAX_DIM}>" \
        -strip -interlace JPEG -quality "$JPEG_QUALITY" "$dst"
      processed=$((processed+1)) ;;
    png)
      [ -z "$IM" ] && { cp -a "$src" "$dst"; continue; }
      "$IM" "$src" -auto-orient -resize "${MAX_DIM}x${MAX_DIM}>" \
        -strip "$dst"
      processed=$((processed+1)) ;;
    gif)
      if [ "$HAVE_GIFSICLE" = 1 ]; then
        gifsicle -O3 --lossy=80 --resize-fit-width "$GIF_MAX_WIDTH" \
          "$src" -o "$dst"
        processed=$((processed+1))
      else
        cp -a "$src" "$dst"
      fi ;;
    mp4)
      if [ "$HAVE_FFMPEG" = 1 ]; then
        ffmpeg -y -loglevel error -i "$src" \
          -vf "scale='if(gt(iw,ih),min(${VIDEO_MAX},iw),-2)':'if(gt(iw,ih),-2,min(${VIDEO_MAX},ih))'" \
          -c:v libx264 -crf "$VIDEO_CRF" -preset slow -pix_fmt yuv420p \
          -movflags +faststart -c:a aac -b:a 96k "$dst"
        processed=$((processed+1))
      else
        cp -a "$src" "$dst"
      fi ;;
    *)
      cp -a "$src" "$dst" ;;
  esac
  printf '  ✓ %s\n' "$rel"
done 3< <(find "$ORIG_DIR" -type f -print0)

after=$(du -sh assets/img assets/video 2>/dev/null | awk '{s+=$1} END{print}' >/dev/null; du -shc assets/img assets/video 2>/dev/null | tail -1 | cut -f1)

echo ""
echo "✅ Done. Files processed: $processed"
echo "   Before: $before   →   After: $after"
echo ""
echo "Next: eyeball a few images, then:"
echo "   git add -A && git commit -m \"Compress media assets\" && git push"
echo "(Originals are safe in $ORIG_DIR — delete it once you're happy.)"

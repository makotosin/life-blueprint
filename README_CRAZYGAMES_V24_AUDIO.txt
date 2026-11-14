WEIRD EVOLUTION! — CrazyGames preparation, v0.24 AUDIO
Based on v0.23 ONE_CLICK. All previous images and game assets preserved.

CHANGES
- Self-contained procedural ORIGINAL science-fiction laboratory BGM, via Web Audio API (audio.js).
- Original procedural SFX for launch, angle lock, landing, failure, bonus pickup, level-up,
  ordinary evolution, final evolution, ultra-rare evolution, and menu confirmation.
- Separate BGM and SFX ON/OFF controls on title screen and within game footer.
- Audio preferences stored in localStorage (separate from game save).
- No external network audio or copyrighted music.
- Audio context resumes after player gesture (species selection / Continue / sound toggle).
- Pauses audio when document becomes hidden.
- All visible sound control labels are in English.

TEST NOTES
- JS syntax checked with node --check for game.js and audio.js.
- File paths and archive contents checked.
- Actual browser sound output on iPhone Safari, Android Chrome, and CrazyGames iframe
  not verified in this environment. Test on target devices before uploading.
- Existing v0.23 visuals and gameplay logic otherwise unchanged.

HOW TO RUN
Extract ZIP, host contents over http(s), launch index.html in modern browser.
For local testing, run `python -m http.server 8000` inside extracted folder.
Audio starts only after a user gesture. The player can mute BGM and SFX separately.

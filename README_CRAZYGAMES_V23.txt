WEIRD EVOLUTION! — CrazyGames Basic Launch candidate v0.23

CHANGES FROM v0.22
- One-click entry: on a fresh install, click one of four species on title to start immediately.
- One-click resume: saved unfinished game shows CONTINUE EXPERIMENT on title.
- New-game species selection remains available from in-game reset.
- Existing warm ivory origin / gray evolution contrast and safe 86% creature image contain preserved.
- No Japanese characters remain in index.html, game.js or style.css. The old CSS class titleJP was renamed titleSubtitle.
- Basic Launch: no advertising SDK or external ads; local device save remains in place.

STATIC QA PERFORMED
- node --check game.js: PASS.
- 4 species base, middle and final asset references available: PASS.
- 0 Japanese characters in text source: PASS.
- index.html is at ZIP root.

PENDING MANUAL QA
- Browser click-through and all 16 evolution routes.
- Verify display at 390px mobile and desktop; check long-play and reset.
- CrazyGames Developer Portal preview and Basic Launch acceptance.

Important: Basic Launch disables CrazyGames monetization; Full Launch requires SDK integration and further checks.

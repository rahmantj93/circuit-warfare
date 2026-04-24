# Circuit Warfare

A browser-based cyberpunk RPG that blends branching narrative choices with turn-based combat, set in the neon-soaked streets of **Dunkel City**.

**▶ [Play it now](https://rahmantj93.github.io/circuit-warfare/)**

---

## About

Circuit Warfare is a single-page web game built with HTML, CSS, and JavaScript. The player takes on the role of a covert cyber-operative responding to a distress signal, navigating through story choices and combat encounters with different enemy types before facing the **Apex Guardian**, a corporate war machine. The decisions made and the inventory preserved across the run determine which of three endings the player unlocks.

This project was produced as the practical assessment for **SET08101 — Web Technologies** (Edinburgh Napier University, 2025–26 academic year).

## Features

### Gameplay
- Branching narrative with 23 scenes and three distinct endings
- Turn-based combat system with four actions: Attack, Defend, Special, Item
- Tech-Charge meter that unlocks a double-damage Special attack when full
- Four enemy types with distinct stats and weighted AI behaviour (Syntech Drone, Street Enforcer, Neon Hacker, Apex Guardian)
- Inventory with Health Packs and Tech Cells, with post-battle loot drops
- Automatic localStorage save — resume mid-story or mid-combat

### Presentation
- Neon-accented cyberpunk UI with glitch-style title animation
- Enemy-type-specific portrait borders with boss pulse effect
- Animated HP and Tech bars, hit flashes, screen shake, and spark effects
- Typewriter-style story text with click-to-skip
- Glitching victory / defeat / ending banners
- Ambient background music with persistent mute toggle
- Seven layered sound effects tied to combat actions
- Full keyboard-shortcut support (A/D/S/I/M/Esc)

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling & Animation | CSS3 (custom properties, keyframe animations, transitions, `backdrop-filter`) |
| Logic | Vanilla JavaScript (ES6+) |
| Persistence | `localStorage` API |
| Audio | HTML5 `<audio>` |
| Hosting | GitHub Pages (static deployment) |

No frameworks, libraries, or build tools are used.

## Controls

### Story screens
Click **Continue** or a choice button to progress. Click the story panel to skip the typewriter animation.

### Combat
| Key | Action |
|---|---|
| `A` | Attack |
| `D` | Defend |
| `S` | Special (requires full Tech meter) |
| `I` | Open / close Inventory |
| `Esc` | Close open modal |
| `M` | Mute / unmute all sound |

## Running Locally

Because the site uses `localStorage` and the audio API, opening `index.html` directly via `file://` may not behave correctly in all browsers. Serve it over HTTP instead:

```bash
git clone https://github.com/rahmantj93/circuit-warfare.git
cd circuit-warfare
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Project Structure

```
circuit-warfare/
├── index.html          # Single-page layout with sectioned screens
├── style.css           # Neon cyberpunk styling + animations
├── script.js           # Game state, combat, narrative, save/load
├── assets/
│   ├── player.jpg, enemy*.jpg   # Character portraits
│   ├── bgm.mp3                  # Background music loop
│   ├── attack.mp3, defend.mp3,  # Combat sound effects
│   │   special.mp3, hit.mp3,
│   │   item.mp3, victory.mp3,
│   │   defeat.mp3
│   └── favicon.png
└── README.md
```

## Credits

- **Author:** Tanzeem Rahman (matriculation 40806632)
- **Module:** SET08101 — Web Technologies
- **Institution:** Edinburgh Napier University

### Third-party assets
- Background music and sound effects sourced from [Pixabay](https://pixabay.com) under the Pixabay Content License (free for commercial use, no attribution required).
- Character portraits sourced from Pexels / Unsplash (royalty-free).
- Favicon generated via [favicon.io](https://favicon.io).

### Inspiration
The game's tone, setting, and visual language draw on *Cyberpunk 2077* (CD Projekt Red). The turn-based combat loop and stat-driven outcomes are informed by classic JRPG franchises and by research into browser-based text RPGs such as *Sindome*.

## Licence

© 2026 Tanzeem Rahman. All rights reserved.

This repository is submitted as academic coursework for SET08101 Web Technologies
at Edinburgh Napier University (Trimester 2, 2025–26). The source code is published
for the purposes of assessment and demonstration only.

No part of this code may be copied, redistributed, or submitted for credit by any
other party. Third-party assets (sound effects, images, fonts) remain the property
of their original licensors and are used here under their respective terms.

# AURA — Music Player

A premium glassmorphism music player built with vanilla HTML, CSS, and JavaScript. No frameworks, no dependencies — just clean, modern web tech.

---

## Preview

AURA features a two-panel layout: a sidebar playlist on the left and a main player panel on the right, set against animated ambient background orbs with a dark glassmorphism aesthetic.

---

## Features

- **Now Playing view** — album art, track info, animated vinyl record, and full playback controls
- **Library view** — browse all tracks in a clean list with artwork thumbnails, artist, album, and duration
- **Favourites view** — filtered list of tracks you've liked; shows an empty state when none are liked
- **Shuffle** — randomised playback order, toggled from both the header and the controls bar
- **Repeat** — loops the current track indefinitely when active
- **Like / Heart** — mark tracks as favourites; state persists across the session
- **Seek bar** — click or drag to jump to any point in the track
- **Volume control** — slider with mute toggle
- **EQ bars** — animated equaliser indicator in the sidebar for the active track
- **Simulated playback** — if an audio file is missing, the player simulates progress automatically so the UI always works

---

## Project Structure

```
aura-player/
├── index.html      # App shell and markup
├── style.css       # All styles (glassmorphism theme, animations, views)
├── script.js       # Player logic, view switching, playback, controls
└── songs/          # Audio files (optional — see Adding Songs)
    ├── song1.mp3
    ├── song2.mp3
    └── ...
```

---

## Getting Started

1. Clone or download the project files.
2. Open `index.html` in any modern browser.
3. No build step, no server required — it works straight from the file system.

> **Note:** Browsers block autoplay on page load by design. Click play to start.

---

## Adding Songs

Each track is defined in the `tracks` array at the top of `script.js`:

```javascript
{
  title:    "Track Name",
  artist:   "Artist Name",
  album:    "Album Name",
  duration: "3:45",          // Displayed duration string (m:ss)
  icon:     "♪",             // Emoji shown as album art placeholder
  grad:     "linear-gradient(135deg, #1a0a30, #3a1060)",  // Album art background
  src:      "songs/song1.mp3"  // Path to audio file (or "" for simulation only)
}
```

Place your `.mp3` files in a `songs/` folder next to `index.html`, then update the `src` field for each track. If a file isn't found, the player falls back to simulated progress automatically.

---

## Navigation

| Nav Item | What it shows |
|---|---|
| **Now Playing** | Main player with controls, album art, seek bar |
| **Library** | All tracks in a scrollable list |
| **Favourites** | Only tracks you've liked (♥) |

Clicking any track in the Library or Favourites view loads it and switches back to Now Playing.

---

## Controls Reference

| Control | Action |
|---|---|
| ▶ / ⏸ | Play / Pause |
| ⏮ | Previous track (or restart if past 3 seconds) |
| ⏭ | Next track |
| ⇄ | Toggle shuffle |
| ↺ | Toggle repeat |
| ♡ / ♥ | Like / unlike the current track |
| Seek bar | Drag to scrub through the track |
| Volume slider | Adjust volume |
| ♪ (volume icon) | Toggle mute |

---

## Customisation

**Colours** — all design tokens are CSS variables in `:root` inside `style.css`:

```css
:root {
  --accent:  #c9a96e;   /* Gold — buttons, active states */
  --accent2: #e8c98a;   /* Light gold — track title gradient */
  --text:    #f0ece4;   /* Main text */
  --muted:   rgba(240, 236, 228, 0.45);  /* Secondary text */
}
```

**Fonts** — loaded from Google Fonts. Swap the `@import` in `index.html` to change them:
- Display: `Cormorant Garamond` (track titles, brand name)
- Body: `DM Sans` (all other text)

**Background orbs** — edit `.orb1`, `.orb2`, `.orb3` in `style.css` to change the ambient colour blobs.

---

## Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Requires support for `backdrop-filter` for the glassmorphism blur effect — all evergreen browsers support this.

---

## License

MIT — free to use, modify, and distribute.
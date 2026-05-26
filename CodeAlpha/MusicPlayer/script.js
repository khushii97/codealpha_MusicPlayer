/* ============================================================
   AURA Music Player — script.js
   Full player logic: tracks, playback, UI, controls
   ============================================================ */

/* ---------- Track Library ---------- */
const tracks = [
  {
    title:    "Midnight Bloom",
    artist:   "Elara Moon",
    album:    "Celestial Dreams",
    duration: "3:19",
    icon:     "♪",
    grad:     "linear-gradient(135deg, #1a0a30, #3a1060)",
    src:      "songs/song1.mp3"
  },
  {
    title:    "Golden Hour",
    artist:   "Solar Drift",
    album:    "Equinox",
    duration: "3:04",
    icon:     "✦",
    grad:     "linear-gradient(135deg, #2a1500, #5a3000)",
    src:      "songs/song2.mp3"
  },
  {
    title:    "Waves of Silence",
    artist:   "Noctis",
    album:    "Deep Sea",
    duration: "2:27",
    icon:     "〜",
    grad:     "linear-gradient(135deg, #001a30, #003a5a)",
    src:      "songs/song3.mp3"
  },
  {
    title:    "Velvet Sky",
    artist:   "Aurora Veil",
    album:    "Night Canvas",
    duration: "3:06",
    icon:     "◈",
    grad:     "linear-gradient(135deg, #1a0a20, #4a1a5a)",
    src:      "songs/song4.mp3"
  },
  {
    title:    "Ember & Ash",
    artist:   "Pyra",
    album:    "Ignition",
    duration: "3:29",
    icon:     "✸",
    grad:     "linear-gradient(135deg, #2a0a0a, #5a1a10)",
    src:      "songs/song5.mp3"
  },
  {
    title:    "Crystal Garden",
    artist:   "Botanica",
    album:    "Bloom",
    duration: "2:10",
    icon:     "❋",
    grad:     "linear-gradient(135deg, #0a2a15, #1a5a30)",
    src:      "songs/song6.mp3"
  },
  {
    title:    "Phantom Waltz",
    artist:   "Spectre",
    album:    "Ghost Ballroom",
    duration: "2:09",
    icon:     "⊹",
    grad:     "linear-gradient(135deg, #1a1a2a, #2a2a4a)",
    src:      "songs/song7.mp3"
  },
];

/* ---------- State ---------- */
let currentIdx  = 0;
let isPlaying   = false;
let isShuffle   = false;
let isRepeat    = false;
let isMuted     = false;
let liked       = new Set();
let simInterval = null;
let simTime     = 0;
let currentView = 'nowplaying'; // 'nowplaying' | 'library' | 'favourites'

/* ---------- DOM References ---------- */
const audio          = document.getElementById('audio');
const playBtn        = document.getElementById('play-btn');
const vinyl          = document.getElementById('vinyl');
const progressFill   = document.getElementById('progress-fill');
const seekInput      = document.getElementById('seek-input');
const currentTimeEl  = document.getElementById('current-time');
const totalTimeEl    = document.getElementById('total-time');
const volInput       = document.getElementById('vol-input');
const volFill        = document.getElementById('vol-fill');
const volLabel       = document.getElementById('vol-label');
const volIcon        = document.getElementById('vol-icon');

/* ============================================================
   HELPERS
   ============================================================ */

function formatTime(seconds) {
  seconds = Math.floor(seconds);
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function parseDuration(str) {
  const [m, s] = str.split(':').map(Number);
  return m * 60 + s;
}

/* ============================================================
   VIEW SWITCHING
   ============================================================ */

function switchView(view) {
  currentView = view;

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navMap = { nowplaying: 0, library: 1, favourites: 2 };
  document.querySelectorAll('.nav-item')[navMap[view]].classList.add('active');

  const mainPanel = document.getElementById('main-content');

  if (view === 'nowplaying') {
    mainPanel.innerHTML = getNowPlayingHTML();
    rebindMainControls();
    updateNowPlayingPanel();

  } else if (view === 'library') {
    mainPanel.innerHTML = getLibraryHTML(tracks, 'Library', '◈');
    document.querySelectorAll('.library-track-row').forEach((row, i) => {
      row.addEventListener('click', () => {
        switchView('nowplaying');
        loadTrack(i, true);
      });
    });

  } else if (view === 'favourites') {
    const favTracks = tracks.map((t, i) => ({ ...t, origIdx: i })).filter(t => liked.has(t.origIdx));
    mainPanel.innerHTML = getFavouritesHTML(favTracks);
    document.querySelectorAll('.library-track-row').forEach((row) => {
      const origIdx = parseInt(row.dataset.origIdx);
      row.addEventListener('click', () => {
        switchView('nowplaying');
        loadTrack(origIdx, true);
      });
    });
  }
}

function getNowPlayingHTML() {
  return `
    <div class="now-playing-header">
      <div class="np-label">NOW PLAYING</div>
      <div style="display:flex; gap:8px;">
        <div class="action-btn ${isShuffle ? 'active' : ''}" id="shuffle-btn" title="Shuffle" onclick="toggleShuffle()">⇄</div>
        <div class="action-btn ${isRepeat  ? 'active' : ''}" id="repeat-btn"  title="Repeat"  onclick="toggleRepeat()">↺</div>
      </div>
    </div>

    <div class="album-section">
      <div class="album-wrap">
        <div class="album-art-icon" id="album-art" style="background: linear-gradient(135deg,#1a0a30,#3a1060);">♪</div>
        <div class="album-vinyl" id="vinyl"></div>
      </div>
      <div class="track-info">
        <div class="track-title"  id="track-title">Midnight Bloom</div>
        <div class="track-artist" id="track-artist">Elara Moon</div>
        <div class="track-album"  id="track-album">Celestial Dreams</div>
        <div class="action-btns">
          <div class="action-btn" id="like-btn" onclick="toggleLike()" title="Like">♡</div>
          <div class="action-btn" onclick="addToQueue(this)" title="Add to queue">+</div>
          <div class="action-btn" title="Share">↗</div>
        </div>
      </div>
    </div>

    <div class="controls-section">
      <div class="progress-wrap">
        <div class="time-labels">
          <span id="current-time">0:00</span>
          <span id="total-time">0:00</span>
        </div>
        <div class="progress-bar" id="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
          <input type="range" class="progress-input" id="seek-input" min="0" max="100" value="0" step="0.1">
        </div>
      </div>
      <div class="main-controls">
        <button class="ctrl-btn ${isShuffle ? 'active' : ''}" id="shuffle-ctrl" onclick="toggleShuffle()" title="Shuffle">⇄</button>
        <button class="ctrl-btn" onclick="prevTrack()" title="Previous">⏮</button>
        <button class="play-btn" id="play-btn" onclick="togglePlay()">${isPlaying ? '⏸' : '▶'}</button>
        <button class="ctrl-btn" onclick="nextTrack()" title="Next">⏭</button>
        <button class="ctrl-btn ${isRepeat ? 'active' : ''}" id="repeat-ctrl" onclick="toggleRepeat()" title="Repeat">↺</button>
      </div>
      <div class="vol-section">
        <span class="vol-icon" id="vol-icon" onclick="toggleMute()">${isMuted ? '♩' : '♪'}</span>
        <div class="vol-bar">
          <div class="vol-fill" id="vol-fill" style="width:${volInput ? volInput.value : 75}%"></div>
          <input type="range" class="vol-input" id="vol-input" min="0" max="100" value="${volInput ? volInput.value : 75}" step="1">
        </div>
        <span class="vol-label" id="vol-label">${volInput ? volInput.value : 75}</span>
      </div>
    </div>
  `;
}

function getLibraryHTML(trackList, title, icon) {
  if (trackList.length === 0) {
    return `
      <div class="now-playing-header">
        <div class="np-label">${icon} ${title.toUpperCase()}</div>
      </div>
      <div class="library-empty">
        <div class="empty-icon">♬</div>
        <div class="empty-text">No tracks here yet</div>
        <div class="empty-sub">Tracks you add will appear here</div>
      </div>
    `;
  }
  const rows = trackList.map((t, i) => {
    const idx = t.origIdx !== undefined ? t.origIdx : i;
    const isActive = idx === currentIdx;
    const isLiked  = liked.has(idx);
    return `
      <div class="library-track-row ${isActive ? 'active' : ''}" data-orig-idx="${idx}">
        <div class="lib-art" style="background:${t.grad}">${t.icon}</div>
        <div class="lib-info">
          <div class="lib-title ${isActive ? 'active' : ''}">${t.title}</div>
          <div class="lib-artist">${t.artist}</div>
        </div>
        <div class="lib-album">${t.album}</div>
        <div class="lib-heart ${isLiked ? 'liked' : ''}">${isLiked ? '♥' : '♡'}</div>
        <div class="lib-dur">${t.duration}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="now-playing-header">
      <div class="np-label">${icon} ${title.toUpperCase()}</div>
      <div class="lib-count">${trackList.length} track${trackList.length !== 1 ? 's' : ''}</div>
    </div>
    <div class="library-list">${rows}</div>
  `;
}

function getFavouritesHTML(favTracks) {
  return getLibraryHTML(favTracks, 'Favourites', '✦');
}

/* ============================================================
   REBIND DOM REFS after re-render
   ============================================================ */

function rebindMainControls() {
  // Re-bind volume input
  const vi = document.getElementById('vol-input');
  const vf = document.getElementById('vol-fill');
  const vl = document.getElementById('vol-label');
  if (vi) {
    vi.addEventListener('input', () => {
      const v = vi.value;
      vf.style.width  = v + '%';
      vl.textContent  = v;
      audio.volume    = v / 100;
      isMuted         = (v == 0);
      document.getElementById('vol-icon').textContent = (v == 0) ? '♩' : '♪';
    });
  }
  // Re-bind seek input
  const si = document.getElementById('seek-input');
  if (si) {
    si.addEventListener('input', () => {
      const pct      = si.value;
      const totalSec = parseDuration(tracks[currentIdx].duration);
      simTime        = (pct / 100) * totalSec;
      document.getElementById('progress-fill').style.width = pct + '%';
      document.getElementById('current-time').textContent  = formatTime(simTime);
      if (tracks[currentIdx].src) audio.currentTime = simTime;
    });
  }
}

/* ============================================================
   NOW PLAYING PANEL UPDATE
   ============================================================ */

function updateNowPlayingPanel() {
  const t = tracks[currentIdx];
  const el = {
    title:  document.getElementById('track-title'),
    artist: document.getElementById('track-artist'),
    album:  document.getElementById('track-album'),
    art:    document.getElementById('album-art'),
    vinyl:  document.getElementById('vinyl'),
    pf:     document.getElementById('progress-fill'),
    si:     document.getElementById('seek-input'),
    ct:     document.getElementById('current-time'),
    tt:     document.getElementById('total-time'),
  };
  if (!el.title) return;

  el.title.textContent  = t.title;
  el.artist.textContent = t.artist;
  el.album.textContent  = t.album;
  el.art.textContent    = t.icon;
  el.art.style.background = t.grad;
  el.tt.textContent     = t.duration;

  const totalSec = parseDuration(t.duration);
  updateProgress(simTime, totalSec);
  updateLikeBtn();
  setPlaying(isPlaying);
}

/* ============================================================
   PLAYLIST (SIDEBAR)
   ============================================================ */

function buildPlaylist() {
  const pl = document.getElementById('playlist');
  pl.innerHTML = '';

  tracks.forEach((t, i) => {
    const isActive = i === currentIdx;
    const el = document.createElement('div');
    el.className = 'track-item' + (isActive ? ' active' : '');
    el.id = 'track-' + i;

    const numHTML = (isActive && isPlaying)
      ? `<div class="eq-bars" id="eq-${i}">
           <div class="eq-bar"></div><div class="eq-bar"></div>
           <div class="eq-bar"></div><div class="eq-bar"></div>
         </div>`
      : (i + 1);

    el.innerHTML = `
      <span class="track-num">${numHTML}</span>
      <div class="t-info">
        <div class="t-name">${t.title}</div>
        <div class="t-artist">${t.artist}</div>
      </div>
      <span class="t-dur">${t.duration}</span>
    `;

    el.addEventListener('click', () => {
      if (currentView !== 'nowplaying') switchView('nowplaying');
      loadTrack(i, true);
    });
    pl.appendChild(el);
  });
}

/* ============================================================
   TRACK LOADING
   ============================================================ */

function loadTrack(idx, autoplay = false) {
  currentIdx = idx;
  const t = tracks[idx];
  simTime = 0;

  // Update sidebar
  buildPlaylist();

  // If we're on now-playing view, update the panel
  if (currentView === 'nowplaying') {
    updateNowPlayingPanel();
  }

  const totalSec = parseDuration(t.duration);

  stopSim();

  if (t.src) {
    audio.src = t.src;
    if (autoplay) {
      audio.play()
        .then(() => setPlaying(true))
        .catch(() => {
          // Audio file not found — fall back to simulation
          setPlaying(true);
          startSim(totalSec);
        });
    }
  } else {
    if (autoplay) {
      setPlaying(true);
      startSim(totalSec);
    }
  }
}

/* ============================================================
   PLAYBACK STATE
   ============================================================ */

function setPlaying(state) {
  isPlaying = state;

  const pb = document.getElementById('play-btn');
  if (pb) pb.innerHTML = isPlaying ? '⏸' : '▶';

  const v = document.getElementById('vinyl');
  if (v) v.style.animationPlayState = isPlaying ? 'running' : 'paused';

  const eq = document.getElementById('eq-' + currentIdx);
  if (eq) {
    eq.querySelectorAll('.eq-bar').forEach(bar => {
      bar.style.animationPlayState = isPlaying ? 'running' : 'paused';
    });
  }

  buildPlaylist();
}

function togglePlay() {
  if (tracks[currentIdx].src) {
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        // Fallback to simulation if file missing
        const totalSec = parseDuration(tracks[currentIdx].duration);
        setPlaying(true);
        startSim(totalSec);
      });
    }
    setPlaying(!isPlaying);
  } else {
    if (isPlaying) {
      stopSim();
      setPlaying(false);
    } else {
      setPlaying(true);
      const totalSec = parseDuration(tracks[currentIdx].duration);
      stopSim();
      startSim(totalSec);
    }
  }
}

/* ============================================================
   SIMULATED PROGRESS
   ============================================================ */

function startSim(totalSec) {
  stopSim();
  simInterval = setInterval(() => {
    simTime += 0.25;
    if (simTime >= totalSec) {
      simTime = 0;
      if (isRepeat) {
        updateProgress(0, totalSec);
        return;
      }
      stopSim();
      nextTrack();
      return;
    }
    updateProgress(simTime, totalSec);
  }, 250);
}

function stopSim() {
  if (simInterval) { clearInterval(simInterval); simInterval = null; }
}

/* ============================================================
   PROGRESS BAR
   ============================================================ */

function updateProgress(current, total) {
  const pct = total ? (current / total) * 100 : 0;
  const pf = document.getElementById('progress-fill');
  const si = document.getElementById('seek-input');
  const ct = document.getElementById('current-time');
  if (pf) pf.style.width = pct + '%';
  if (si) si.value = pct;
  if (ct) ct.textContent = formatTime(current);
}

/* ============================================================
   NAVIGATION
   ============================================================ */

function nextTrack() {
  let next;
  if (isShuffle) {
    do { next = Math.floor(Math.random() * tracks.length); }
    while (next === currentIdx && tracks.length > 1);
  } else {
    next = (currentIdx + 1) % tracks.length;
  }
  loadTrack(next, isPlaying);
}

function prevTrack() {
  const totalSec = parseDuration(tracks[currentIdx].duration);
  if (simTime > 3) {
    simTime = 0;
    updateProgress(0, totalSec);
    if (tracks[currentIdx].src) audio.currentTime = 0;
    return;
  }
  const prev = (currentIdx - 1 + tracks.length) % tracks.length;
  loadTrack(prev, isPlaying);
}

/* ============================================================
   SHUFFLE & REPEAT — single source of truth
   ============================================================ */

function toggleShuffle() {
  isShuffle = !isShuffle;
  // Update all shuffle buttons (header + controls)
  document.querySelectorAll('#shuffle-btn, #shuffle-ctrl').forEach(el => {
    el.classList.toggle('active', isShuffle);
  });
}

function toggleRepeat() {
  isRepeat = !isRepeat;
  document.querySelectorAll('#repeat-btn, #repeat-ctrl').forEach(el => {
    el.classList.toggle('active', isRepeat);
  });
}

/* ============================================================
   LIKE / QUEUE
   ============================================================ */

function toggleLike() {
  if (liked.has(currentIdx)) {
    liked.delete(currentIdx);
  } else {
    liked.add(currentIdx);
  }
  updateLikeBtn();
}

function updateLikeBtn() {
  const btn = document.getElementById('like-btn');
  if (!btn) return;
  if (liked.has(currentIdx)) {
    btn.textContent = '♥';
    btn.classList.add('liked');
  } else {
    btn.textContent = '♡';
    btn.classList.remove('liked');
  }
}

function addToQueue(btn) {
  if (!btn) btn = event.currentTarget;
  btn.textContent = '✓';
  btn.style.color = 'var(--accent)';
  setTimeout(() => {
    btn.textContent = '+';
    btn.style.color  = '';
  }, 1200);
}

/* ============================================================
   VOLUME
   ============================================================ */

function toggleMute() {
  isMuted = !isMuted;
  audio.muted = isMuted;
  const vi = document.getElementById('vol-icon');
  const vf = document.getElementById('vol-fill');
  const vi2 = document.getElementById('vol-input');
  if (vi) vi.textContent = isMuted ? '♩' : '♪';
  if (vf) vf.style.width = isMuted ? '0%' : (vi2 ? vi2.value : 75) + '%';
}

/* ============================================================
   REAL AUDIO EVENTS
   ============================================================ */

audio.addEventListener('timeupdate', () => {
  const total = audio.duration || parseDuration(tracks[currentIdx].duration);
  updateProgress(audio.currentTime, total);
});

audio.addEventListener('ended',  nextTrack);
audio.addEventListener('play',   () => setPlaying(true));
audio.addEventListener('pause',  () => setPlaying(false));

/* ============================================================
   NAV CLICK HANDLERS
   ============================================================ */

document.querySelectorAll('.nav-item').forEach((item, idx) => {
  item.addEventListener('click', () => {
    const views = ['nowplaying', 'library', 'favourites'];
    switchView(views[idx]);
  });
});

/* ============================================================
   INIT
   ============================================================ */
switchView('nowplaying');
loadTrack(0, false);

// Set initial volume fill
setTimeout(() => {
  const vf = document.getElementById('vol-fill');
  const vi = document.getElementById('vol-input');
  if (vf && vi) {
    vf.style.width = vi.value + '%';
    audio.volume   = vi.value / 100;
  }
  rebindMainControls();
}, 0);
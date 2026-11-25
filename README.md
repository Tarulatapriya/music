# Spotify Web Player Clone 🎵

A feature-rich, high-fidelity Spotify Web & Desktop clone built with modern semantic HTML5, pure CSS3 (Spotify Design System), and vanilla JavaScript with Web Audio API.

---

## 🚀 Key Features

### 1. 🎨 Spotify 3-Column Desktop Layout & Modern UI/UX
- **Left Sidebar**: Home, Search, Your Library with custom playlist management, filter chips, and pinned Liked Songs.
- **Main Stage**:
  - **Dynamic Time-Sensitive Greeting** ("Good morning", "Good afternoon", "Good evening").
  - **Quick 6-Grid** for instant resumption of trending playlists.
  - **Curated Shelves & Carousels** ("Made For You", "Trending Artists & Hits", "Chill & Focus Beats").
  - **Dynamic Ambient Color Extraction**: Real-time canvas palette extraction that smoothly transitions the top background gradient to match the playing album artwork.
  - **Playlist & Album Detail View**: Sticky hero banner, play action buttons, and detailed track table with index, play icon on hover, duration, and heart toggle.
- **Expandable Right Drawer**:
  - **Now Playing View**: Large artwork, artist bio, and a real-time 60FPS **Web Audio Spectrum Visualizer**.
  - **Play Queue**: "Now Playing" and interactive "Next in Queue" list.
  - **Synchronized Karaoke Lyrics**: Timed, line-by-line scrolling lyrics with click-to-seek support.
- **Bottom Persistent Playback Bar**:
  - Track thumbnail, title, artist, and heart icon.
  - Center controls: Smart Shuffle, Previous, Play/Pause, Next, and 3-state Repeat (Off / All / One).
  - Hover-expanding progress bar with timestamp labels.
  - Volume slider with mute button, right drawer tabs, and full-screen theater mode.

### 2. 🎛️ Audio Engine & Advanced Features
- **5-Band Graphic Equalizer**: Web Audio API BiquadFilterNodes (60Hz, 250Hz, 1kHz, 4kHz, 12kHz) with audio presets (Flat, Bass Boost, Vocal Booster, Treble, Rock, Electronic).
- **Smooth Audio Crossfading**: Configurable 0–10 second crossfading curves between songs.
- **Live Search & Browse**:
  - Browse categories with Spotify-styled vibrant color tiles (Pop, Hip-Hop, Rock, Dance, Chill, etc.).
  - Debounced instant search querying the iTunes Search API.
- **Full-Screen Theater Mode**:
  - Atmospheric ambient blurred backdrop, oversized album cover, and live karaoke stream.
- **Spotify Stats / Session Wrapped**:
  - Real-time tracker for minutes listened, songs played, top artist, and top track.
- **Custom Playlists & Liked Songs**:
  - Persisted locally with `localStorage`.

### 3. ⌨️ Keyboard Shortcuts
- `Space`: Play / Pause
- `ArrowRight` / `ArrowLeft`: Seek forward / backward 5 seconds
- `Ctrl` + `ArrowRight` / `Ctrl` + `ArrowLeft`: Next / Previous track
- `ArrowUp` / `ArrowDown`: Volume up / down 5%
- `M`: Mute / Unmute
- `L`: Toggle Lyrics tab
- `F`: Toggle Full-Screen Theater mode

---

## 🛠️ Technologies Used
- **HTML5**: Semantic tags, SVG icons, responsive layout structure.
- **CSS3**: Custom properties, glassmorphism, flexbox & grid, custom scrollbars, transitions.
- **JavaScript (ES6+)**: Web Audio API, Canvas pixel analysis, async/await iTunes API search, localStorage persistence.

## 🎧 How to Run
Simply open `index.html` in any modern web browser or serve it with any static web server (e.g. `npx serve`, Live Server, or Python `python -m http.server`).

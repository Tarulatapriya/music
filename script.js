/* ========================================================
   SPOTIFY WEB PLAYER - JAVASCRIPT ENGINE
   ======================================================== */

// --- Application State ---
const state = {
    currentSong: null,
    currentPlaylist: [],
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    isShuffle: false,
    repeatMode: 'off', // 'off' | 'all' | 'one'
    volume: 0.7,
    isMuted: false,
    crossfadeDuration: 3,
    activeView: 'home', // 'home' | 'search' | 'playlist'
    viewHistory: ['home'],
    historyPointer: 0,
    currentOpenedPlaylist: null,
    likedSongs: JSON.parse(localStorage.getItem('spotify_liked_songs') || '[]'),
    userPlaylists: JSON.parse(localStorage.getItem('spotify_user_playlists') || '[]'),
    currentUser: sessionStorage.getItem('spotify_user') || 'Guest',
    stats: JSON.parse(localStorage.getItem('spotify_session_stats') || '{"minutes":0,"songs":0,"artists":{},"tracks":{}}'),
    lyricsLines: [],
    currentLyricIndex: -1,
    activeRightTab: null // 'now-playing' | 'queue' | 'lyrics' | null
};

// --- DOM References ---
const audio = document.getElementById('audio-engine');
const playPauseBtn = document.getElementById('play-pause-btn');
const playIconSvg = document.getElementById('play-icon-svg');
const pauseIconSvg = document.getElementById('pause-icon-svg');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
const repeatOneIndicator = document.getElementById('repeat-one-indicator');
const progressBarGroove = document.getElementById('progress-bar-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressThumb = document.getElementById('progress-thumb');
const currentTimeText = document.getElementById('current-time-text');
const durationTimeText = document.getElementById('duration-time-text');
const playerThumb = document.getElementById('player-thumb');
const playerThumbPlaceholder = document.getElementById('player-thumb-placeholder');
const playerTrackName = document.getElementById('player-track-name');
const playerTrackArtist = document.getElementById('player-track-artist');
const playerHeartBtn = document.getElementById('player-heart-btn');

// Volume Controls
const volumeGroove = document.getElementById('volume-groove');
const volumeFill = document.getElementById('volume-fill');
const volumeThumb = document.getElementById('volume-thumb');
const volumeMuteBtn = document.getElementById('volume-mute-btn');
const volumeHighSvg = document.getElementById('volume-high-svg');
const volumeMutedSvg = document.getElementById('volume-muted-svg');

// Navigation & Views
const navHomeBtn = document.getElementById('nav-home-btn');
const navSearchBtn = document.getElementById('nav-search-btn');
const viewHome = document.getElementById('view-home');
const viewSearch = document.getElementById('view-search');
const viewPlaylist = document.getElementById('view-playlist');
const topSearchWrapper = document.getElementById('top-search-wrapper');
const globalSearchInput = document.getElementById('global-search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const historyBackBtn = document.getElementById('history-back-btn');
const historyForwardBtn = document.getElementById('history-forward-btn');
const greetingText = document.getElementById('greeting-text');
const homeAmbientBg = document.getElementById('home-ambient-bg');

// Right Drawer & Side Panels
const rightPanel = document.getElementById('right-panel');
const rightPanelTitle = document.getElementById('right-panel-title');
const closeRightPanelBtn = document.getElementById('close-right-panel-btn');
const tabNowPlaying = document.getElementById('tab-now-playing');
const tabQueue = document.getElementById('tab-queue');
const tabLyrics = document.getElementById('tab-lyrics');
const nowPlayingPanelToggle = document.getElementById('now-playing-panel-toggle');
const lyricsPanelToggle = document.getElementById('lyrics-panel-toggle');
const queuePanelToggle = document.getElementById('queue-panel-toggle');

// Right Panel Now Playing elements
const rightPanelArt = document.getElementById('right-panel-art');
const rightPanelTitleText = document.getElementById('right-panel-title-text');
const rightPanelArtistText = document.getElementById('right-panel-artist-text');
const rightPanelHeartBtn = document.getElementById('right-panel-heart-btn');
const rightPanelAboutArtist = document.getElementById('right-panel-about-artist');
const visualizerCanvas = document.getElementById('visualizer-canvas');
const visualizerCtx = visualizerCanvas ? visualizerCanvas.getContext('2d') : null;

// Library & Playlists
const customPlaylistsContainer = document.getElementById('custom-playlists-container');
const likedSongsNavItem = document.getElementById('liked-songs-nav-item');
const likedSongsCount = document.getElementById('liked-songs-count');
const createPlaylistQuickBtn = document.getElementById('create-playlist-quick-btn');

// Modals
const authModal = document.getElementById('auth-modal');
const closeAuthModalBtn = document.getElementById('close-auth-modal-btn');
const openAuthModalBtn = document.getElementById('open-auth-modal-btn');
const userMenuBtn = document.getElementById('user-menu-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const userNameDisplay = document.getElementById('user-name-display');
const desktopAvatar = document.getElementById('desktop-avatar');
const logoutMenuItem = document.getElementById('logout-menu-item');
const authForm = document.getElementById('auth-form');
const tabLoginBtn = document.getElementById('tab-login-btn');
const tabRegisterBtn = document.getElementById('tab-register-btn');
const modalUsername = document.getElementById('modal-username');
const modalPassword = document.getElementById('modal-password');
const authSubmitBtn = document.getElementById('auth-submit-btn');

// Equalizer Modal
const eqModalBtn = document.getElementById('eq-modal-btn');
const eqModal = document.getElementById('eq-modal');
const closeEqModalBtn = document.getElementById('close-eq-modal-btn');
const eqPresetSelect = document.getElementById('eq-preset-select');
const crossfadeSlider = document.getElementById('crossfade-slider');
const crossfadeValueLabel = document.getElementById('crossfade-value-label');

// Wrapped & Stats Modal
const wrappedBtn = document.getElementById('wrapped-btn');
const wrappedModal = document.getElementById('wrapped-modal');
const closeWrappedModalBtn = document.getElementById('close-wrapped-modal-btn');

// Theater Fullscreen Mode
const theaterFullscreenBtn = document.getElementById('theater-fullscreen-btn');
const fullscreenTheater = document.getElementById('fullscreen-theater');
const theaterExitBtn = document.getElementById('theater-exit-btn');
const theaterCoverArt = document.getElementById('theater-cover-art');
const theaterTitle = document.getElementById('theater-title');
const theaterArtist = document.getElementById('theater-artist');
const theaterLyricsStream = document.getElementById('theater-lyrics-stream');
const theaterBackdrop = document.getElementById('theater-backdrop');

// Toast Pill
const toastPill = document.getElementById('toast-pill');

// --- Web Audio API Context & Biquad Filters ---
let audioCtx = null;
let mediaSource = null;
let analyserNode = null;
let gainNode = null;
let eqFilters = [];
let visualizerAnimationFrame = null;

// ========================================================
// 1. WEB AUDIO API & EQUALIZER INITIALIZATION
// ========================================================

function initAudioEngine() {
    if (audioCtx) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();

        mediaSource = audioCtx.createMediaElementSource(audio);
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 128;
        analyserNode.smoothingTimeConstant = 0.8;

        gainNode = audioCtx.createGain();
        gainNode.gain.value = state.volume;

        // 5-Band Equalizer frequencies: 60Hz, 250Hz, 1kHz, 4kHz, 12kHz
        const bands = [60, 250, 1000, 4000, 12000];
        let prevNode = mediaSource;

        eqFilters = bands.map((freq, idx) => {
            const filter = audioCtx.createBiquadFilter();
            if (idx === 0) {
                filter.type = 'lowshelf';
            } else if (idx === bands.length - 1) {
                filter.type = 'highshelf';
            } else {
                filter.type = 'peaking';
                filter.Q.value = 1.0;
            }
            filter.frequency.value = freq;
            filter.gain.value = 0;

            prevNode.connect(filter);
            prevNode = filter;
            return filter;
        });

        prevNode.connect(analyserNode);
        analyserNode.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        startVisualizerLoop();
    } catch (err) {
        console.warn('Audio Context initialization error:', err);
    }
}

// Draw frequency bars in Now Playing Drawer
function startVisualizerLoop() {
    if (!visualizerCanvas || !visualizerCtx) return;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    function renderFrame() {
        visualizerAnimationFrame = requestAnimationFrame(renderFrame);
        if (!analyserNode || !state.isPlaying) {
            visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
            // Draw a subtle resting line
            visualizerCtx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            visualizerCtx.fillRect(0, visualizerCanvas.height - 4, visualizerCanvas.width, 2);
            return;
        }

        analyserNode.getByteFrequencyData(dataArray);
        visualizerCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);

        const barWidth = (visualizerCanvas.width / bufferLength) * 1.8;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * (visualizerCanvas.height - 6);

            // Spotify green to emerald gradient
            const gradient = visualizerCtx.createLinearGradient(0, visualizerCanvas.height, 0, 0);
            gradient.addColorStop(0, '#1db954');
            gradient.addColorStop(1, '#1ed760');

            visualizerCtx.fillStyle = gradient;
            visualizerCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 2;
            if (x > visualizerCanvas.width) break;
        }
    }
    renderFrame();
}

// Equalizer Presets
const eqPresets = {
    flat: [0, 0, 0, 0, 0],
    bass: [6, 4, 1, 0, -1],
    vocal: [-2, 0, 4, 3, 1],
    treble: [-2, -1, 1, 4, 6],
    rock: [4, 2, -1, 2, 4],
    electronic: [5, 3, 0, 2, 4]
};

function applyEqPreset(name) {
    const values = eqPresets[name] || eqPresets.flat;
    const bands = [60, 250, '1k', '4k', '12k'];
    values.forEach((gain, i) => {
        if (eqFilters[i]) eqFilters[i].gain.value = gain;
        const slider = document.getElementById(`slider-${bands[i]}`);
        const label = document.getElementById(`gain-${bands[i]}`);
        if (slider) slider.value = gain;
        if (label) label.textContent = `${gain > 0 ? '+' : ''}${gain}dB`;
    });
}

// ========================================================
// 2. DYNAMIC AMBIENT COLOR EXTRACTION
// ========================================================

function extractDominantColor(imgUrl) {
    if (!imgUrl) return;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imgUrl;

    img.onload = () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 40;
            canvas.height = 40;
            ctx.drawImage(img, 0, 0, 40, 40);

            const imageData = ctx.getImageData(0, 0, 40, 40).data;
            let r = 0, g = 0, b = 0, count = 0;

            for (let i = 0; i < imageData.length; i += 16) {
                const red = imageData[i];
                const green = imageData[i + 1];
                const blue = imageData[i + 2];
                // Ignore overly dark or overly bright washed out pixels
                const brightness = (red + green + blue) / 3;
                if (brightness > 30 && brightness < 220) {
                    r += red;
                    g += green;
                    b += blue;
                    count++;
                }
            }

            if (count > 0) {
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
                const colorStr = `rgba(${r}, ${g}, ${b}, 0.55)`;
                document.documentElement.style.setProperty('--sp-ambient-color', colorStr);
            }
        } catch (e) {
            // CORS fallback: use Spotify classic accent
            document.documentElement.style.setProperty('--sp-ambient-color', 'rgba(29, 185, 84, 0.45)');
        }
    };
}

// ========================================================
// 3. SEED CATALOG & CURATED SPOTIFY PLAYLISTS (FULL SONGS)
// ========================================================

const curatedPlaylists = [
    {
        id: 'top-hits',
        title: "Today's Top Hits",
        description: "The hottest full-length tracks streaming right now.",
        cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
        genre: "Pop"
    },
    {
        id: 'lofi-beats',
        title: "Lofi Chill & Study",
        description: "Peaceful beats, deep focus, and cozy relaxation.",
        cover: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&auto=format&fit=crop&q=80",
        genre: "Chill"
    },
    {
        id: 'electronic-superstar',
        title: "Electronic & Dance",
        description: "High-energy festival anthems and club bangers.",
        cover: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
        genre: "Electronic"
    },
    {
        id: 'rock-classics',
        title: "Rock Legends",
        description: "Rock anthems and legendary timeless guitar riffs.",
        cover: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=600&auto=format&fit=crop&q=80",
        genre: "Rock"
    },
    {
        id: 'hiphop-vibes',
        title: "Hip-Hop Central",
        description: "Heavy 808s, rhymes, and fresh full-length beats.",
        cover: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80",
        query: "hip hop"
    },
    {
        id: 'workout-energy',
        title: "Beast Mode Workout",
        description: "High-BPM energy to push through your sets.",
        cover: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=80",
        query: "workout"
    }
];

// High-fidelity full-length sample tracks for instant playback (full length 3-6 minutes)
const sampleTracks = [
    {
        id: 's1',
        title: 'Blinding Lights (Full)',
        artist: 'The Weeknd',
        album: 'After Hours',
        cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400&auto=format&fit=crop&q=80',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        duration: '6:12',
        durationSec: 372
    },
    {
        id: 's2',
        title: 'Starboy (Full)',
        artist: 'The Weeknd, Daft Punk',
        album: 'Starboy',
        cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        duration: '7:05',
        durationSec: 425
    },
    {
        id: 's3',
        title: 'Shape of You (Full)',
        artist: 'Ed Sheeran',
        album: 'Divide',
        cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        duration: '5:43',
        durationSec: 343
    },
    {
        id: 's4',
        title: 'Levitating (Full)',
        artist: 'Dua Lipa',
        album: 'Future Nostalgia',
        cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        duration: '5:02',
        durationSec: 302
    },
    {
        id: 's5',
        title: 'As It Was (Full)',
        artist: 'Harry Styles',
        album: "Harry's House",
        cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
        duration: '4:18',
        durationSec: 258
    },
    {
        id: 's6',
        title: 'Kesariya (Full)',
        artist: 'Arijit Singh, Pritam',
        album: 'Brahmastra',
        cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&auto=format&fit=crop&q=80',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
        duration: '8:48',
        durationSec: 528
    }
];

// Fetch FULL-LENGTH tracks using Audius API with fallback
async function fetchTracks(query, limit = 20) {
    try {
        // Query Audius API which streams 100% full songs (not 30-sec previews)
        const res = await fetch(`https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&limit=${limit}&app_name=SPOTIFY_CLONE`);
        if (res.ok) {
            const data = await res.json();
            if (data.data && data.data.length > 0) {
                return data.data.map(t => ({
                    id: String(t.id),
                    title: t.title || 'Untitled Song',
                    artist: (t.user && t.user.name) || 'Unknown Artist',
                    album: t.genre || 'Single',
                    cover: (t.artwork && (t.artwork['480x480'] || t.artwork['150x150'] || t.artwork['1000x1000'])) || sampleTracks[0].cover,
                    src: `https://api.audius.co/v1/tracks/${t.id}/stream?app_name=SPOTIFY_CLONE`,
                    duration: formatDuration(t.duration || 180),
                    durationSec: t.duration || 180
                }));
            }
        }
    } catch (e) {
        console.warn('Audius full song search error:', e);
    }

    // Secondary fallback: Trending full tracks
    try {
        const trendRes = await fetch(`https://api.audius.co/v1/tracks/trending?limit=${limit}&app_name=SPOTIFY_CLONE`);
        if (trendRes.ok) {
            const tData = await trendRes.json();
            if (tData.data && tData.data.length > 0) {
                return tData.data.map(t => ({
                    id: String(t.id),
                    title: t.title || 'Untitled',
                    artist: (t.user && t.user.name) || 'Artist',
                    album: t.genre || 'Trending',
                    cover: (t.artwork && (t.artwork['480x480'] || t.artwork['150x150'])) || sampleTracks[0].cover,
                    src: `https://api.audius.co/v1/tracks/${t.id}/stream?app_name=SPOTIFY_CLONE`,
                    duration: formatDuration(t.duration || 180),
                    durationSec: t.duration || 180
                }));
            }
        }
    } catch (err) {
        console.warn('Fallback trending error:', err);
    }

    return sampleTracks;
}

function formatDuration(seconds) {
    const s = Math.round(seconds);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
}

// ========================================================
// 4. PLAYBACK CONTROLLER
// ========================================================

async function playTrack(track, index = -1, playlist = null) {
    if (!track) return;
    initAudioEngine();

    if (playlist) {
        state.currentPlaylist = [...playlist];
        state.currentIndex = index !== -1 ? index : state.currentPlaylist.findIndex(t => t.id === track.id);
    } else if (index !== -1) {
        state.currentIndex = index;
    }

    state.currentSong = track;
    audio.src = track.src;

    // Crossfade gain curve
    if (gainNode && state.crossfadeDuration > 0) {
        const now = audioCtx ? audioCtx.currentTime : 0;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0.01, now);
        gainNode.gain.linearRampToValueAtTime(state.volume, now + Math.min(state.crossfadeDuration, 2));
    }

    try {
        if (audioCtx && audioCtx.state === 'suspended') {
            await audioCtx.resume();
        }
        await audio.play();
        state.isPlaying = true;
    } catch (err) {
        console.warn('Playback error / Autoplay blocked:', err);
    }

    updatePlayerUI();
    extractDominantColor(track.cover);
    fetchAndDisplayLyrics(track.artist, track.title);
    updateQueueList();
    recordPlaybackStats(track);
}

function togglePlayPause() {
    if (!state.currentSong) {
        if (state.currentPlaylist.length > 0) {
            playTrack(state.currentPlaylist[0], 0);
        } else {
            playTrack(sampleTracks[0], 0, sampleTracks);
        }
        return;
    }

    initAudioEngine();
    if (audio.paused) {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        audio.play().then(() => {
            state.isPlaying = true;
            updatePlayPauseButton();
        }).catch(err => console.error(err));
    } else {
        audio.pause();
        state.isPlaying = false;
        updatePlayPauseButton();
    }
}

function playNextTrack() {
    if (state.currentPlaylist.length === 0) return;

    if (state.repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
        return;
    }

    let nextIndex;
    if (state.isShuffle) {
        nextIndex = Math.floor(Math.random() * state.currentPlaylist.length);
    } else {
        nextIndex = state.currentIndex + 1;
        if (nextIndex >= state.currentPlaylist.length) {
            if (state.repeatMode === 'all') {
                nextIndex = 0;
            } else {
                return; // End of playlist
            }
        }
    }

    playTrack(state.currentPlaylist[nextIndex], nextIndex);
}

function playPrevTrack() {
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
        return;
    }

    if (state.currentPlaylist.length === 0) return;

    let prevIndex = state.currentIndex - 1;
    if (prevIndex < 0) {
        prevIndex = state.currentPlaylist.length - 1;
    }
    playTrack(state.currentPlaylist[prevIndex], prevIndex);
}

// Progress scrubbing
audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const current = audio.currentTime;
    const duration = audio.duration;
    const pct = (current / duration) * 100;

    progressBarFill.style.width = `${pct}%`;
    progressThumb.style.left = `${pct}%`;
    currentTimeText.textContent = formatDuration(current);
    durationTimeText.textContent = formatDuration(duration);

    // Sync active lyrics line
    updateLyricsTimestamp(current);
});

audio.addEventListener('ended', playNextTrack);

// Scrub bar seek interaction
progressBarGroove.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressBarGroove.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    audio.currentTime = pct * audio.duration;
});

// Volume control
function setVolume(vol) {
    state.volume = Math.max(0, Math.min(1, vol));
    audio.volume = state.volume;
    if (gainNode) gainNode.gain.value = state.volume;

    volumeFill.style.width = `${state.volume * 100}%`;
    volumeThumb.style.left = `${state.volume * 100}%`;

    if (state.volume === 0) {
        state.isMuted = true;
        volumeHighSvg.style.display = 'none';
        volumeMutedSvg.style.display = 'inline-block';
    } else {
        state.isMuted = false;
        volumeHighSvg.style.display = 'inline-block';
        volumeMutedSvg.style.display = 'none';
    }
}

volumeGroove.addEventListener('click', (e) => {
    const rect = volumeGroove.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const vol = Math.max(0, Math.min(1, clickX / rect.width));
    setVolume(vol);
});

volumeMuteBtn.addEventListener('click', () => {
    if (state.isMuted) {
        setVolume(state.volume || 0.7);
    } else {
        setVolume(0);
    }
});

// Shuffle toggle
shuffleBtn.addEventListener('click', () => {
    state.isShuffle = !state.isShuffle;
    shuffleBtn.classList.toggle('active', state.isShuffle);
    showToast(state.isShuffle ? 'Smart Shuffle Enabled' : 'Shuffle Disabled');
});

// Repeat toggle (off -> all -> one -> off)
repeatBtn.addEventListener('click', () => {
    if (state.repeatMode === 'off') {
        state.repeatMode = 'all';
        repeatBtn.classList.add('active');
        repeatOneIndicator.style.display = 'none';
        showToast('Repeat Playlist');
    } else if (state.repeatMode === 'all') {
        state.repeatMode = 'one';
        repeatBtn.classList.add('active');
        repeatOneIndicator.style.display = 'inline-block';
        showToast('Repeat Current Song');
    } else {
        state.repeatMode = 'off';
        repeatBtn.classList.remove('active');
        repeatOneIndicator.style.display = 'none';
        showToast('Repeat Off');
    }
});

// Update UI when track changes
function updatePlayerUI() {
    if (!state.currentSong) return;

    playerTrackName.textContent = state.currentSong.title;
    playerTrackArtist.textContent = state.currentSong.artist;
    playerThumb.src = state.currentSong.cover;
    playerThumbPlaceholder.style.display = 'none';

    // Right Panel Now Playing View
    if (rightPanelArt) rightPanelArt.src = state.currentSong.cover;
    if (rightPanelTitleText) rightPanelTitleText.textContent = state.currentSong.title;
    if (rightPanelArtistText) rightPanelArtistText.textContent = state.currentSong.artist;
    if (rightPanelAboutArtist) rightPanelAboutArtist.textContent = state.currentSong.artist;

    // Fullscreen Theater Mode
    if (theaterCoverArt) theaterCoverArt.src = state.currentSong.cover;
    if (theaterTitle) theaterTitle.textContent = state.currentSong.title;
    if (theaterArtist) theaterArtist.textContent = state.currentSong.artist;

    updatePlayPauseButton();
    updateHeartIcons();
    highlightCurrentTrackInTable();
}

function updatePlayPauseButton() {
    if (state.isPlaying && !audio.paused) {
        playIconSvg.style.display = 'none';
        pauseIconSvg.style.display = 'inline-block';
    } else {
        playIconSvg.style.display = 'inline-block';
        pauseIconSvg.style.display = 'none';
    }
}

// ========================================================
// 5. LIKED SONGS & PLAYLIST MANAGEMENT
// ========================================================

function isTrackLiked(trackId) {
    return state.likedSongs.some(t => t.id === trackId);
}

function toggleLikeTrack(track) {
    if (!track) return;
    const index = state.likedSongs.findIndex(t => t.id === track.id);
    if (index === -1) {
        state.likedSongs.push({ ...track, addedDate: new Date().toLocaleDateString() });
        showToast('Saved to your Liked Songs');
    } else {
        state.likedSongs.splice(index, 1);
        showToast('Removed from Liked Songs');
    }
    localStorage.setItem('spotify_liked_songs', JSON.stringify(state.likedSongs));
    updateHeartIcons();
    renderLibrary();
    if (state.activeView === 'playlist' && state.currentOpenedPlaylist && state.currentOpenedPlaylist.id === 'liked-songs') {
        openPlaylistView({
            id: 'liked-songs',
            title: 'Liked Songs',
            description: 'Songs you have saved to your library.',
            cover: '',
            isLikedSongs: true,
            tracks: state.likedSongs
        });
    }
}

function updateHeartIcons() {
    if (!state.currentSong) return;
    const liked = isTrackLiked(state.currentSong.id);
    playerHeartBtn.classList.toggle('liked', liked);
    if (rightPanelHeartBtn) rightPanelHeartBtn.classList.toggle('liked', liked);
}

playerHeartBtn.addEventListener('click', () => {
    if (state.currentSong) toggleLikeTrack(state.currentSong);
});
if (rightPanelHeartBtn) {
    rightPanelHeartBtn.addEventListener('click', () => {
        if (state.currentSong) toggleLikeTrack(state.currentSong);
    });
}

function renderLibrary() {
    likedSongsCount.textContent = state.likedSongs.length;
    customPlaylistsContainer.innerHTML = '';

    state.userPlaylists.forEach(pl => {
        const item = document.createElement('div');
        item.className = 'library-item';
        item.innerHTML = `
            <img src="${pl.cover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}" class="playlist-thumb" alt="${pl.title}">
            <div class="library-item-info">
                <div class="item-title">${pl.title}</div>
                <div class="item-subtitle">Playlist • ${pl.tracks ? pl.tracks.length : 0} songs</div>
            </div>
        `;
        item.addEventListener('click', () => openPlaylistView(pl));
        customPlaylistsContainer.appendChild(item);
    });
}

createPlaylistQuickBtn.addEventListener('click', () => {
    const name = prompt('Name your new playlist:', `My Playlist #${state.userPlaylists.length + 1}`);
    if (name && name.trim()) {
        const newPl = {
            id: 'user-' + Date.now(),
            title: name.trim(),
            description: `By ${state.currentUser}`,
            cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
            tracks: []
        };
        state.userPlaylists.push(newPl);
        localStorage.setItem('spotify_user_playlists', JSON.stringify(state.userPlaylists));
        renderLibrary();
        openPlaylistView(newPl);
        showToast(`Playlist "${newPl.title}" created!`);
    }
});

likedSongsNavItem.addEventListener('click', () => {
    openPlaylistView({
        id: 'liked-songs',
        title: 'Liked Songs',
        description: 'All your favorite saved tracks in one place.',
        cover: '',
        isLikedSongs: true,
        tracks: state.likedSongs
    });
});

// ========================================================
// 6. SYNCHRONIZED KARAOKE LYRICS
// ========================================================

async function fetchAndDisplayLyrics(artist, title) {
    const lyricsScrollBox = document.getElementById('lyrics-scroll-box');
    const loadingPlaceholder = document.getElementById('lyrics-loading-text');

    if (!lyricsScrollBox) return;
    if (loadingPlaceholder) loadingPlaceholder.textContent = 'Searching lyrics...';

    state.lyricsLines = [];
    state.currentLyricIndex = -1;

    try {
        const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        if (data.lyrics) {
            parseAndRenderLyrics(data.lyrics);
            return;
        }
    } catch (e) {
        // Generate stylish rhythmic synchronized lyrics placeholder for preview tracks
        generateSyntheticLyrics(title, artist);
    }
}

function parseAndRenderLyrics(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const duration = audio.duration || 180;
    const interval = duration / (lines.length || 1);

    state.lyricsLines = lines.map((text, idx) => ({
        time: idx * interval,
        text: text
    }));

    renderLyricsUI();
}

function generateSyntheticLyrics(title, artist) {
    const mockLines = [
        `♪ [Intro: ${artist}] ♪`,
        `Yeah, listening to ${title}`,
        "Vibes are moving through the speakers right now",
        "Feel the rhythm, feel the high fidelity flow",
        "Turn it louder, let the beat take over",
        `Streaming live on Spotify Clone`,
        "Never gonna stop the frequency",
        "Keep the playlist rolling through the night",
        `♪ [Outro: ${artist}] ♪`
    ];

    const duration = audio.duration || 180;
    const interval = duration / mockLines.length;

    state.lyricsLines = mockLines.map((text, idx) => ({
        time: idx * interval,
        text: text
    }));

    renderLyricsUI();
}

function renderLyricsUI() {
    const lyricsScrollBox = document.getElementById('lyrics-scroll-box');
    if (!lyricsScrollBox) return;
    lyricsScrollBox.innerHTML = '';
    theaterLyricsStream.innerHTML = '';

    state.lyricsLines.forEach((item, index) => {
        // Drawer line
        const lineEl = document.createElement('div');
        lineEl.className = 'lyric-line';
        lineEl.textContent = item.text;
        lineEl.dataset.index = index;
        lineEl.addEventListener('click', () => {
            audio.currentTime = item.time;
        });
        lyricsScrollBox.appendChild(lineEl);

        // Theater mode line
        const theaterLine = document.createElement('div');
        theaterLine.className = 'karaoke-line';
        theaterLine.textContent = item.text;
        theaterLine.dataset.index = index;
        theaterLine.addEventListener('click', () => {
            audio.currentTime = item.time;
        });
        theaterLyricsStream.appendChild(theaterLine);
    });
}

function updateLyricsTimestamp(time) {
    if (state.lyricsLines.length === 0) return;

    let activeIdx = 0;
    for (let i = 0; i < state.lyricsLines.length; i++) {
        if (time >= state.lyricsLines[i].time) {
            activeIdx = i;
        } else {
            break;
        }
    }

    if (activeIdx !== state.currentLyricIndex) {
        state.currentLyricIndex = activeIdx;

        // Drawer
        const drawerLines = document.querySelectorAll('.lyric-line');
        drawerLines.forEach((el, idx) => {
            el.classList.toggle('active', idx === activeIdx);
            if (idx === activeIdx) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        // Theater
        const theaterLines = document.querySelectorAll('.karaoke-line');
        theaterLines.forEach((el, idx) => {
            el.classList.toggle('active', idx === activeIdx);
            if (idx === activeIdx) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }
}

// ========================================================
// 7. QUEUE & RIGHT DRAWER MANAGEMENT
// ========================================================

function updateQueueList() {
    const queueCurrentTitle = document.getElementById('queue-current-title');
    const queueCurrentArtist = document.getElementById('queue-current-artist');
    const queueCurrentImg = document.getElementById('queue-current-img');
    const queueList = document.getElementById('queue-list');

    if (state.currentSong) {
        if (queueCurrentTitle) queueCurrentTitle.textContent = state.currentSong.title;
        if (queueCurrentArtist) queueCurrentArtist.textContent = state.currentSong.artist;
        if (queueCurrentImg) queueCurrentImg.src = state.currentSong.cover;
    }

    if (!queueList) return;
    queueList.innerHTML = '';

    const upcoming = state.currentPlaylist.slice(state.currentIndex + 1);
    if (upcoming.length === 0) {
        queueList.innerHTML = '<div style="color:var(--sp-text-subdued); font-size:0.85rem; padding:12px;">Queue is empty.</div>';
        return;
    }

    upcoming.forEach((t, i) => {
        const item = document.createElement('div');
        item.className = 'queue-item';
        item.innerHTML = `
            <img src="${t.cover}" class="queue-thumb" alt="${t.title}">
            <div class="queue-info">
                <div class="queue-title">${t.title}</div>
                <div class="queue-artist">${t.artist}</div>
            </div>
        `;
        item.addEventListener('click', () => {
            playTrack(t, state.currentIndex + 1 + i);
        });
        queueList.appendChild(item);
    });
}

function toggleRightDrawerTab(tabName) {
    if (state.activeRightTab === tabName) {
        // Close drawer
        rightPanel.style.display = 'none';
        state.activeRightTab = null;
        nowPlayingPanelToggle.classList.remove('active');
        lyricsPanelToggle.classList.remove('active');
        queuePanelToggle.classList.remove('active');
        return;
    }

    state.activeRightTab = tabName;
    rightPanel.style.display = 'flex';

    tabNowPlaying.style.display = tabName === 'now-playing' ? 'block' : 'none';
    tabQueue.style.display = tabName === 'queue' ? 'block' : 'none';
    tabLyrics.style.display = tabName === 'lyrics' ? 'block' : 'none';

    nowPlayingPanelToggle.classList.toggle('active', tabName === 'now-playing');
    lyricsPanelToggle.classList.toggle('active', tabName === 'lyrics');
    queuePanelToggle.classList.toggle('active', tabName === 'queue');

    if (tabName === 'now-playing') rightPanelTitle.textContent = 'Now Playing';
    if (tabName === 'queue') {
        rightPanelTitle.textContent = 'Play Queue';
        updateQueueList();
    }
    if (tabName === 'lyrics') rightPanelTitle.textContent = 'Lyrics';
}

nowPlayingPanelToggle.addEventListener('click', () => toggleRightDrawerTab('now-playing'));
lyricsPanelToggle.addEventListener('click', () => toggleRightDrawerTab('lyrics'));
queuePanelToggle.addEventListener('click', () => toggleRightDrawerTab('queue'));
closeRightPanelBtn.addEventListener('click', () => toggleRightDrawerTab(state.activeRightTab));

// ========================================================
// 8. VIEWS & NAVIGATION SYSTEM
// ========================================================

function navigateToView(viewName, pushHistory = true) {
    state.activeView = viewName;
    viewHome.style.display = viewName === 'home' ? 'block' : 'none';
    viewSearch.style.display = viewName === 'search' ? 'block' : 'none';
    viewPlaylist.style.display = viewName === 'playlist' ? 'block' : 'none';

    navHomeBtn.classList.toggle('active', viewName === 'home');
    navSearchBtn.classList.toggle('active', viewName === 'search');
    topSearchWrapper.style.display = viewName === 'search' ? 'flex' : 'none';

    if (pushHistory) {
        state.viewHistory.push(viewName);
        state.historyPointer = state.viewHistory.length - 1;
    }
}

navHomeBtn.addEventListener('click', () => navigateToView('home'));
navSearchBtn.addEventListener('click', () => {
    navigateToView('search');
    globalSearchInput.focus();
});

historyBackBtn.addEventListener('click', () => {
    if (state.historyPointer > 0) {
        state.historyPointer--;
        navigateToView(state.viewHistory[state.historyPointer], false);
    }
});

historyForwardBtn.addEventListener('click', () => {
    if (state.historyPointer < state.viewHistory.length - 1) {
        state.historyPointer++;
        navigateToView(state.viewHistory[state.historyPointer], false);
    }
});

// Update dynamic greeting ("Good morning", "Good afternoon", "Good evening")
function updateGreeting() {
    const hours = new Date().getHours();
    let greet = 'Good evening';
    if (hours < 12) greet = 'Good morning';
    else if (hours < 18) greet = 'Good afternoon';
    greetingText.textContent = greet;
}

// Open and render Playlist Detail View
async function openPlaylistView(pl) {
    state.currentOpenedPlaylist = pl;
    navigateToView('playlist');

    const heroImg = document.getElementById('playlist-hero-img');
    const heroPlaceholder = document.getElementById('playlist-hero-placeholder');
    const heroTitle = document.getElementById('playlist-hero-title');
    const heroDesc = document.getElementById('playlist-hero-desc');
    const songsCount = document.getElementById('playlist-songs-count');
    const totalDuration = document.getElementById('playlist-total-duration');
    const playHeroBtn = document.getElementById('playlist-hero-play-btn');
    const heartHeroBtn = document.getElementById('playlist-hero-heart-btn');
    const tracklistBody = document.getElementById('playlist-tracklist-body');

    heroTitle.textContent = pl.title;
    heroDesc.textContent = pl.description || 'Spotify collection';

    if (pl.isLikedSongs) {
        heroImg.style.display = 'none';
        heroPlaceholder.style.display = 'flex';
        heroPlaceholder.textContent = '❤️';
        heroPlaceholder.style.background = 'linear-gradient(135deg, #450af5, #c4efd9)';
        heartHeroBtn.style.display = 'none';
    } else {
        heroPlaceholder.style.display = 'none';
        heroImg.style.display = 'block';
        heroImg.src = pl.cover || sampleTracks[0].cover;
        heartHeroBtn.style.display = 'inline-block';
        extractDominantColor(pl.cover);
    }

    tracklistBody.innerHTML = '<div style="padding: 24px; color: var(--sp-text-subdued);">Loading tracks...</div>';

    let tracks = pl.tracks;
    if (!tracks || tracks.length === 0) {
        if (pl.genre) {
            try {
                const gRes = await fetch(`https://api.audius.co/v1/tracks/trending?genre=${encodeURIComponent(pl.genre)}&limit=20&app_name=SPOTIFY_CLONE`);
                if (gRes.ok) {
                    const gData = await gRes.json();
                    if (gData.data && gData.data.length > 0) {
                        tracks = gData.data.map(t => ({
                            id: String(t.id),
                            title: t.title || 'Untitled',
                            artist: (t.user && t.user.name) || 'Artist',
                            album: t.genre || pl.title,
                            cover: (t.artwork && (t.artwork['480x480'] || t.artwork['150x150'])) || pl.cover,
                            src: `https://api.audius.co/v1/tracks/${t.id}/stream?app_name=SPOTIFY_CLONE`,
                            duration: formatDuration(t.duration || 180),
                            durationSec: t.duration || 180
                        }));
                        pl.tracks = tracks;
                    }
                }
            } catch (err) {
                console.warn('Genre load error:', err);
            }
        }
        if (!tracks || tracks.length === 0) {
            if (pl.query) {
                tracks = await fetchTracks(pl.query, 20);
                pl.tracks = tracks;
            } else if (pl.isLikedSongs) {
                tracks = state.likedSongs;
            } else {
                tracks = sampleTracks;
            }
        }
    }

    songsCount.textContent = `${tracks.length} songs`;
    const totalSecs = tracks.reduce((acc, t) => acc + (t.durationSec || 180), 0);
    totalDuration.textContent = `about ${Math.round(totalSecs / 60)} min`;

    renderTrackTable(tracks, tracklistBody);

    playHeroBtn.onclick = () => {
        if (tracks.length > 0) {
            playTrack(tracks[0], 0, tracks);
        }
    };
}

function renderTrackTable(tracks, container) {
    container.innerHTML = '';
    if (!tracks || tracks.length === 0) {
        container.innerHTML = '<div style="padding: 32px; color: var(--sp-text-subdued); text-align: center;">No tracks in this playlist yet. Add some!</div>';
        return;
    }

    tracks.forEach((track, idx) => {
        const row = document.createElement('div');
        row.className = 'track-row';
        row.dataset.trackId = track.id;
        if (state.currentSong && state.currentSong.id === track.id) {
            row.classList.add('active');
        }

        const isLiked = isTrackLiked(track.id);

        row.innerHTML = `
            <div class="track-index-col">
                <span class="track-index-number">${idx + 1}</span>
                <span class="track-play-icon">▶</span>
            </div>
            <div class="track-title-col">
                <img src="${track.cover}" class="track-thumb-mini" alt="${track.title}">
                <div class="track-name-artist">
                    <span class="track-title-text">${track.title}</span>
                    <span class="track-artist-text">${track.artist}</span>
                </div>
            </div>
            <div class="track-album-col">${track.album || 'Single'}</div>
            <div class="track-date-col">${track.addedDate || 'Recently'}</div>
            <div class="track-duration-col">
                <button class="track-heart-btn ${isLiked ? 'liked' : ''}" title="Like">
                    <svg viewBox="0 0 24 24"><path d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                </button>
                <span>${track.duration || '3:30'}</span>
            </div>
        `;

        row.addEventListener('click', (e) => {
            if (e.target.closest('.track-heart-btn')) {
                toggleLikeTrack(track);
                row.querySelector('.track-heart-btn').classList.toggle('liked', isTrackLiked(track.id));
                return;
            }
            playTrack(track, idx, tracks);
        });

        container.appendChild(row);
    });
}

function highlightCurrentTrackInTable() {
    const rows = document.querySelectorAll('.track-row');
    rows.forEach(r => {
        if (state.currentSong && r.dataset.trackId === state.currentSong.id) {
            r.classList.add('active');
        } else {
            r.classList.remove('active');
        }
    });
}

// Populate Home View Shelves
async function populateHome() {
    updateGreeting();

    // 1. Quick 6-Grid
    const quickGrid = document.getElementById('quick-grid');
    quickGrid.innerHTML = '';
    curatedPlaylists.slice(0, 6).forEach(pl => {
        const card = document.createElement('div');
        card.className = 'quick-card';
        card.innerHTML = `
            <img src="${pl.cover}" class="quick-card-img" alt="${pl.title}">
            <span class="quick-card-title">${pl.title}</span>
            <button class="quick-card-play-btn" title="Play">
                <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.606l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg>
            </button>
        `;
        card.addEventListener('click', (e) => {
            if (e.target.closest('.quick-card-play-btn')) {
                openPlaylistView(pl).then(() => {
                    const heroPlayBtn = document.getElementById('playlist-hero-play-btn');
                    if (heroPlayBtn) heroPlayBtn.click();
                });
                return;
            }
            openPlaylistView(pl);
        });
        quickGrid.appendChild(card);
    });

    // 2. Curated Carousels
    renderShelfCards('shelf-made-for-you', curatedPlaylists);
    renderShelfCards('shelf-trending', curatedPlaylists.slice().reverse());
    renderShelfCards('shelf-chill', [curatedPlaylists[1], curatedPlaylists[4], curatedPlaylists[5], curatedPlaylists[0]]);
}

function renderShelfCards(containerId, list) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'music-card';
        card.innerHTML = `
            <div class="music-card-img-wrap">
                <img src="${item.cover}" class="music-card-img" alt="${item.title}">
                <button class="music-card-play-btn" title="Play">
                    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.713a.7.7 0 0 1 1.05-.606l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"/></svg>
                </button>
            </div>
            <div class="music-card-title">${item.title}</div>
            <div class="music-card-desc">${item.description}</div>
        `;
        card.addEventListener('click', (e) => {
            if (e.target.closest('.music-card-play-btn')) {
                openPlaylistView(item).then(() => {
                    const heroPlay = document.getElementById('playlist-hero-play-btn');
                    if (heroPlay) heroPlay.click();
                });
                return;
            }
            openPlaylistView(item);
        });
        container.appendChild(card);
    });
}

// ========================================================
// 9. SEARCH & BROWSE TILES
// ========================================================

const browseCategories = [
    { title: 'Pop', color: '#e13300', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300' },
    { title: 'Hip-Hop', color: '#ba5d07', img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300' },
    { title: 'Rock', color: '#e91429', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=300' },
    { title: 'Dance & EDM', color: '#d84000', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300' },
    { title: 'Chill & Lofi', color: '#477d95', img: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300' },
    { title: 'Indie', color: '#608108', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300' },
    { title: 'Workout', color: '#777777', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300' },
    { title: 'Bollywood', color: '#8c1932', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300' }
];

function populateBrowseCategories() {
    const grid = document.getElementById('browse-categories-grid');
    if (!grid) return;
    grid.innerHTML = '';

    browseCategories.forEach(cat => {
        const tile = document.createElement('div');
        tile.className = 'category-tile';
        tile.style.backgroundColor = cat.color;
        tile.innerHTML = `
            <span>${cat.title}</span>
            <img src="${cat.img}" class="category-tile-art" alt="${cat.title}">
        `;
        tile.addEventListener('click', () => {
            globalSearchInput.value = cat.title;
            performSearch(cat.title);
        });
        grid.appendChild(tile);
    });
}

let searchDebounceTimer = null;
globalSearchInput.addEventListener('input', () => {
    const q = globalSearchInput.value.trim();
    clearSearchBtn.style.display = q.length > 0 ? 'inline-block' : 'none';

    clearTimeout(searchDebounceTimer);
    if (!q) {
        document.getElementById('search-view-title').textContent = 'Browse all';
        document.getElementById('browse-categories-grid').style.display = 'grid';
        document.getElementById('search-results-container').style.display = 'none';
        return;
    }

    searchDebounceTimer = setTimeout(() => {
        performSearch(q);
    }, 350);
});

clearSearchBtn.addEventListener('click', () => {
    globalSearchInput.value = '';
    clearSearchBtn.style.display = 'none';
    document.getElementById('search-view-title').textContent = 'Browse all';
    document.getElementById('browse-categories-grid').style.display = 'grid';
    document.getElementById('search-results-container').style.display = 'none';
});

async function performSearch(query) {
    document.getElementById('search-view-title').textContent = `Results for "${query}"`;
    document.getElementById('browse-categories-grid').style.display = 'none';
    const container = document.getElementById('search-results-container');
    container.style.display = 'block';

    const topResultCard = document.getElementById('top-result-card');
    const searchSongsList = document.getElementById('search-songs-list');
    topResultCard.innerHTML = '<div style="color:var(--sp-text-subdued);">Searching top match...</div>';
    searchSongsList.innerHTML = '';

    const results = await fetchTracks(query, 12);

    if (results.length > 0) {
        const top = results[0];
        topResultCard.innerHTML = `
            <img src="${top.cover}" class="top-result-img" alt="${top.title}">
            <div class="top-result-title">${top.title}</div>
            <div class="top-result-badge">
                <span class="tag-pill">Song</span>
                <span>${top.artist}</span>
            </div>
        `;
        topResultCard.onclick = () => playTrack(top, 0, results);

        renderTrackTable(results.slice(0, 6), searchSongsList);
    } else {
        topResultCard.innerHTML = '<div>No results found.</div>';
    }
}

// ========================================================
// 10. STATS & SPOTIFY WRAPPED
// ========================================================

function recordPlaybackStats(track) {
    state.stats.songs++;
    state.stats.artists[track.artist] = (state.stats.artists[track.artist] || 0) + 1;
    state.stats.tracks[track.title] = (state.stats.tracks[track.title] || 0) + 1;
    localStorage.setItem('spotify_session_stats', JSON.stringify(state.stats));
}

// Timer for minutes listened
setInterval(() => {
    if (state.isPlaying && !audio.paused) {
        state.stats.minutes = (state.stats.minutes || 0) + 0.1;
        localStorage.setItem('spotify_session_stats', JSON.stringify(state.stats));
    }
}, 6000);

wrappedBtn.addEventListener('click', () => {
    document.getElementById('stats-minutes-played').textContent = Math.round(state.stats.minutes || 0);
    document.getElementById('stats-songs-played').textContent = state.stats.songs || 0;

    // Find top artist
    let topArtist = '-';
    let maxA = 0;
    for (const a in state.stats.artists) {
        if (state.stats.artists[a] > maxA) {
            maxA = state.stats.artists[a];
            topArtist = a;
        }
    }
    document.getElementById('stats-top-artist').textContent = topArtist;

    // Find top song
    let topTrack = '-';
    let maxT = 0;
    for (const t in state.stats.tracks) {
        if (state.stats.tracks[t] > maxT) {
            maxT = state.stats.tracks[t];
            topTrack = t;
        }
    }
    document.getElementById('stats-top-song').textContent = topTrack;

    wrappedModal.style.display = 'flex';
});

closeWrappedModalBtn.addEventListener('click', () => {
    wrappedModal.style.display = 'none';
});

// ========================================================
// 11. EQUALIZER & MODALS
// ========================================================

eqModalBtn.addEventListener('click', () => {
    initAudioEngine();
    eqModal.style.display = 'flex';
});

closeEqModalBtn.addEventListener('click', () => {
    eqModal.style.display = 'none';
});

eqPresetSelect.addEventListener('change', (e) => {
    applyEqPreset(e.target.value);
});

// Crossfade slider
crossfadeSlider.addEventListener('input', (e) => {
    state.crossfadeDuration = parseInt(e.target.value);
    crossfadeValueLabel.textContent = `${state.crossfadeDuration}s`;
});

// Fullscreen Theater Toggle
theaterFullscreenBtn.addEventListener('click', () => {
    fullscreenTheater.style.display = 'flex';
});

theaterExitBtn.addEventListener('click', () => {
    fullscreenTheater.style.display = 'none';
});

// User profile & Auth Modal
userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.style.display = profileDropdown.style.display === 'none' ? 'block' : 'none';
});

document.addEventListener('click', () => {
    profileDropdown.style.display = 'none';
});

openAuthModalBtn.addEventListener('click', () => {
    authModal.style.display = 'flex';
});

closeAuthModalBtn.addEventListener('click', () => {
    authModal.style.display = 'none';
});

tabLoginBtn.addEventListener('click', () => {
    tabLoginBtn.classList.add('active');
    tabRegisterBtn.classList.remove('active');
    authSubmitBtn.textContent = 'Log In';
});

tabRegisterBtn.addEventListener('click', () => {
    tabRegisterBtn.classList.add('active');
    tabLoginBtn.classList.remove('active');
    authSubmitBtn.textContent = 'Create Account';
});

authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const uname = modalUsername.value.trim();
    if (uname) {
        state.currentUser = uname;
        sessionStorage.setItem('spotify_user', uname);
        userNameDisplay.textContent = uname;
        desktopAvatar.textContent = uname.charAt(0).toUpperCase();
        document.getElementById('dropdown-user-info').innerHTML = `Logged in as <strong>${uname}</strong>`;
        logoutMenuItem.style.display = 'block';
        authModal.style.display = 'none';
        showToast(`Welcome back, ${uname}!`);
    }
});

logoutMenuItem.addEventListener('click', () => {
    state.currentUser = 'Guest';
    sessionStorage.removeItem('spotify_user');
    userNameDisplay.textContent = 'Guest';
    desktopAvatar.textContent = 'G';
    document.getElementById('dropdown-user-info').innerHTML = 'Logged in as <strong>Guest</strong>';
    logoutMenuItem.style.display = 'none';
    showToast('Logged out');
});

// Toast notification helper
let toastTimeout = null;
function showToast(msg) {
    if (!toastPill) return;
    toastPill.textContent = msg;
    toastPill.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastPill.classList.remove('visible');
    }, 2400);
}

// ========================================================
// 12. SPOTIFY KEYBOARD SHORTCUTS
// ========================================================

document.addEventListener('keydown', (e) => {
    // Ignore keystrokes when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
    } else if (e.code === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        playNextTrack();
    } else if (e.code === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        playPrevTrack();
    } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (audio.duration) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
    } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        audio.currentTime = Math.max(0, audio.currentTime - 5);
    } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setVolume(state.volume + 0.05);
    } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setVolume(state.volume - 0.05);
    } else if (e.key.toLowerCase() === 'm') {
        volumeMuteBtn.click();
    } else if (e.key.toLowerCase() === 'l') {
        toggleRightDrawerTab('lyrics');
    } else if (e.key.toLowerCase() === 'f') {
        fullscreenTheater.style.display = fullscreenTheater.style.display === 'none' ? 'flex' : 'none';
    }
});

// ========================================================
// 13. INITIALIZATION ON BOOT
// ========================================================

window.addEventListener('DOMContentLoaded', () => {
    // Sync UI with current auth user
    if (state.currentUser && state.currentUser !== 'Guest') {
        userNameDisplay.textContent = state.currentUser;
        desktopAvatar.textContent = state.currentUser.charAt(0).toUpperCase();
        document.getElementById('dropdown-user-info').innerHTML = `Logged in as <strong>${state.currentUser}</strong>`;
        logoutMenuItem.style.display = 'block';
    }

    setVolume(0.7);
    renderLibrary();
    populateHome();
    populateBrowseCategories();

    // Attach control listeners
    playPauseBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', playNextTrack);
    prevBtn.addEventListener('click', playPrevTrack);

    // Local Audio File Import System
    const importLocalBtn = document.getElementById('import-local-btn');
    const localAudioInput = document.getElementById('local-audio-input');

    if (importLocalBtn && localAudioInput) {
        importLocalBtn.addEventListener('click', () => {
            localAudioInput.click();
        });

        localAudioInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            const importedTracks = files.map((file, i) => {
                const cleanName = file.name.replace(/\.[^/.]+$/, "");
                const parts = cleanName.split('-');
                const title = parts.length > 1 ? parts[1].trim() : cleanName;
                const artist = parts.length > 1 ? parts[0].trim() : 'Local Audio';

                return {
                    id: 'local-' + Date.now() + '-' + i,
                    title: title,
                    artist: artist,
                    album: 'Local Files',
                    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
                    src: URL.createObjectURL(file),
                    duration: 'Full Song',
                    durationSec: 210,
                    isLocal: true
                };
            });

            const localPlaylist = {
                id: 'local-imported',
                title: 'Imported PC Songs',
                description: `${importedTracks.length} full songs imported from your computer`,
                cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
                tracks: importedTracks
            };

            const existingIdx = state.userPlaylists.findIndex(p => p.id === 'local-imported');
            if (existingIdx !== -1) {
                state.userPlaylists[existingIdx].tracks.push(...importedTracks);
            } else {
                state.userPlaylists.unshift(localPlaylist);
            }

            renderLibrary();
            openPlaylistView(localPlaylist);
            showToast(`Imported ${importedTracks.length} full songs!`);
            localAudioInput.value = '';
        });
    }

    // Load initial default track so player bar is ready immediately
    state.currentPlaylist = [...sampleTracks];
    state.currentIndex = 0;
    state.currentSong = sampleTracks[0];
    updatePlayerUI();
});

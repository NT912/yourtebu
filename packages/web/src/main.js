import {
  initI18n,
  t,
  setLang,
  getLang,
  formatDuration,
  formatViews,
  YOUTUBE_WATCH_BASE,
  FALLBACK_VIDEOS,
  GOOGLE_CLIENT_ID,
  parseJwt,
} from '@yourtebu/shared';
import { initTheme, setTheme, getTheme } from './services/theme.js';
import {
  fetchVideoInfo,
  fetchSearchResults,
  fetchTrending,
  fetchPersonalizedFeed,
} from './services/api.js';
import { addToWatchHistory, getRecentVideoIds } from './services/watch-history.js';
import { sleepTimer } from './services/sleep-timer.js';
import { setupSleepTimerModal } from './components/sleep-timer-modal.js';
import { LiveChatComponent } from './components/live-chat.js';

// Clean up any previously corrupted UTF-8 user names in localStorage
let initialUser = JSON.parse(localStorage.getItem('yourtebu_user') || 'null');
if (initialUser && initialUser.name && /TrÆ|ờ|ấ/.test(initialUser.name)) {
  initialUser.name = 'Trường Nhật';
  localStorage.setItem('yourtebu_user', JSON.stringify(initialUser));
}

// State
const state = {
  currentView: 'home',
  currentVideoInfo: null,
  liveChat: null,
  isPlaying: false,
  isAudioOnly: false,
  activeCategory: 'all',
  user: initialUser,
  accessToken: localStorage.getItem('yourtebu_access_token') || null,
  history: JSON.parse(localStorage.getItem('yourtebu_history') || '[]'),
  page: 1,
  isLoadingMore: false,
  hasMore: true,
  loadedVideoIds: new Set(),
  currentSearchQuery: '',
};

// DOM Refs
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const videoEl = $('#video-element');

document.addEventListener('DOMContentLoaded', () => {
  initI18n();
  initTheme();
  updateI18nUI();

  initRouter();
  initHeader();
  initChipsBar();
  initAuth();
  initPlayer();
  initModals();
  initInfiniteScroll();

  handleRoute();
});

// Router
function initRouter() {
  window.addEventListener('hashchange', handleRoute);
}

function resetPaginationState() {
  state.page = 1;
  state.isLoadingMore = false;
  state.hasMore = true;
  state.loadedVideoIds.clear();
}

function handleRoute() {
  const hash = window.location.hash || '#/';
  const [path, params] = hash.slice(1).split('?');

  if (path.startsWith('/watch/')) {
    const videoId = path.split('/watch/')[1];
    openVideo(videoId);
    return;
  }

  $('#full-player')?.classList.add('hidden');
  if (state.liveChat) {
    state.liveChat.destroy();
    state.liveChat = null;
  }

  resetPaginationState();

  switch (path) {
    case '/':
    case '/home':
      state.currentView = 'home';
      $('#chips-bar')?.classList.remove('hidden');
      renderHome();
      break;
    case '/trending':
      state.currentView = 'trending';
      $('#chips-bar')?.classList.add('hidden');
      renderTrending();
      break;
    case '/music':
      state.currentView = 'music';
      $('#chips-bar')?.classList.add('hidden');
      renderMusic();
      break;
    case '/history':
      state.currentView = 'history';
      $('#chips-bar')?.classList.add('hidden');
      renderHistory();
      break;
    case '/search': {
      state.currentView = 'search';
      $('#chips-bar')?.classList.add('hidden');
      const q = new URLSearchParams(params).get('q');
      state.currentSearchQuery = q || '';
      if (q) renderSearch(q);
      break;
    }
    default:
      state.currentView = 'home';
      renderHome();
  }
}

// Header
function initHeader() {
  const searchInput = $('#search-input');
  $('#btn-search')?.addEventListener('click', () => {
    const q = searchInput?.value.trim();
    if (q) window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
  });
  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (q) window.location.hash = `#/search?q=${encodeURIComponent(q)}`;
    }
  });

  // Dynamic Home Logo Click Refresh
  $('.header__logo')?.addEventListener('click', (e) => {
    if (
      window.location.hash === '#/' ||
      window.location.hash === '' ||
      window.location.hash === '#/home'
    ) {
      e.preventDefault();
      resetPaginationState();
      renderHome();
      showToast(t('common.refreshing') || 'Đang làm mới đề xuất...');
    }
  });

  // Theme toggle: dark -> light -> system
  const themeBtn = $('#btn-theme-toggle');
  updateThemeIcon();

  themeBtn?.addEventListener('click', () => {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : current === 'light' ? 'system' : 'dark';
    setTheme(next);
    updateThemeIcon();
    showToast(`${t('theme.title')}: ${t(`theme.${next}`)}`);
  });

  // Language toggle: vi <-> en
  $('#btn-lang-toggle')?.addEventListener('click', () => {
    const current = getLang();
    const next = current === 'vi' ? 'en' : 'vi';
    setLang(next);
    updateI18nUI();
    showToast(`${t('lang.title')}: ${t(`lang.${next}`)}`);
  });

  // Audio mode
  $('#btn-audio-mode')?.addEventListener('click', () => {
    state.isAudioOnly = !state.isAudioOnly;
    showToast(state.isAudioOnly ? t('player.audioOnlyOn') : t('player.audioOnlyOff'));
  });

  // Timer modal trigger
  $('#btn-sleep-timer')?.addEventListener('click', () => {
    $('#sleep-timer-modal')?.classList.remove('hidden');
  });
}

function updateThemeIcon() {
  const theme = getTheme();
  const icon = $('#btn-theme-toggle .material-icons-round');
  if (!icon) return;
  if (theme === 'light') icon.textContent = 'light_mode';
  else if (theme === 'dark') icon.textContent = 'dark_mode';
  else icon.textContent = 'settings_brightness';
}

function initChipsBar() {
  const chipsBar = $('#chips-bar');
  if (chipsBar && state.user) {
    // Personalize category chips with User Name chip
    const userChipText =
      getLang() === 'vi' ? `Đề xuất cho ${state.user.name}` : `For ${state.user.name}`;
    let userChip = chipsBar.querySelector('.chip-user');
    if (!userChip) {
      userChip = document.createElement('button');
      userChip.className = 'chip chip-user';
      userChip.dataset.category = 'recommended';
      chipsBar.insertBefore(userChip, chipsBar.children[2] || chipsBar.children[1]);
    }
    userChip.textContent = userChipText;
  }

  const chips = $$('.chip');
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeCategory = chip.dataset.category || 'all';
      resetPaginationState();
      renderHome();
    });
  });
}

let tokenClient = null;

function initAuth() {
  const signinBtn = $('#btn-signin');
  const authModal = $('#auth-modal');

  updateUserUI();

  // 1. Initialize Standard Google Identity Services (GIS) for basic login (always works, non-sensitive)
  const initGIS = () => {
    const gisContainer = $('#g_id_gis_container');
    if (window.google?.accounts?.id && gisContainer) {
      gisContainer.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
      });
      window.google.accounts.id.renderButton(gisContainer, {
        theme: 'filled_blue',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
      });
    }
  };

  // 2. Initialize OAuth2 Token Client for optional YouTube scope
  const initOAuthTokenClient = () => {
    if (window.google?.accounts?.oauth2) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/youtube.readonly profile email',
        callback: handleGoogleTokenResponse,
      });
    }
  };

  setTimeout(() => {
    initGIS();
    initOAuthTokenClient();
  }, 800);

  signinBtn?.addEventListener('click', () => {
    if (state.user) {
      if (confirm(t('auth.signOutConfirm') || 'Bạn có muốn đăng xuất không?')) {
        state.user = null;
        state.accessToken = null;
        localStorage.removeItem('yourtebu_user');
        localStorage.removeItem('yourtebu_access_token');
        updateUserUI();
        window.location.reload();
      }
    } else {
      authModal?.classList.remove('hidden');
      initGIS();
    }
  });

  $('#auth-close')?.addEventListener('click', () => {
    authModal?.classList.add('hidden');
  });

  $('#btn-google-login')?.addEventListener('click', () => {
    if (tokenClient) {
      tokenClient.requestAccessToken();
    } else {
      performMockLogin();
    }
  });
}

function handleGoogleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  if (payload) {
    const user = {
      name: payload.name || payload.given_name || 'Trường Nhật',
      email: payload.email || 'tt912002@gmail.com',
      picture: payload.picture || '',
    };
    state.user = user;
    localStorage.setItem('yourtebu_user', JSON.stringify(user));
    updateUserUI();
    $('#auth-modal')?.classList.add('hidden');
    showToast(`${t('auth.welcome')}, ${user.name}!`);
    renderHome();
  }
}

async function handleGoogleTokenResponse(response) {
  if (response.error) {
    if (response.error === 'access_denied') {
      // Access denied happens if email is not added to Google Cloud Console Test Users for sensitive scopes
      performMockLogin();
      showToast(
        'Đã đăng nhập tài khoản. (Để dùng YouTube Scope, hãy thêm email vào Test Users trên Google Cloud Console)',
      );
      return;
    }
    showToast('Đăng nhập thất bại: ' + response.error);
    performMockLogin();
    return;
  }

  const accessToken = response.access_token;
  state.accessToken = accessToken;
  localStorage.setItem('yourtebu_access_token', accessToken);

  // Fetch Google User Profile info with access_token
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      const profile = await res.json();
      const user = {
        name: profile.name || profile.given_name || 'Trường Nhật',
        email: profile.email || 'tt912002@gmail.com',
        picture: profile.picture || '',
      };
      state.user = user;
      localStorage.setItem('yourtebu_user', JSON.stringify(user));
    }
  } catch {
    performMockLogin();
  }

  updateUserUI();
  $('#auth-modal')?.classList.add('hidden');
  showToast(`${t('auth.welcome')}, ${state.user.name}! Đã kết nối đề xuất YouTube cá nhân hóa.`);
  renderHome();
}

function performMockLogin() {
  const mockUser = {
    name: 'Trường Nhật',
    email: 'tt912002@gmail.com',
    picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=TruongNhat`,
  };
  state.user = mockUser;
  localStorage.setItem('yourtebu_user', JSON.stringify(mockUser));
  updateUserUI();
  $('#auth-modal')?.classList.add('hidden');
  renderHome();
}

function updateUserUI() {
  const signinBtn = $('#btn-signin');
  if (!signinBtn) return;

  if (state.user) {
    const safeAvatarUrl =
      state.user.picture && state.user.picture.startsWith('http')
        ? state.user.picture.replace('http://', 'https://')
        : '';
    signinBtn.innerHTML = `
      <img src="${safeAvatarUrl}" class="user-avatar-img" alt="${state.user.name}" onerror="this.outerHTML='<span class=\\'material-icons-round\\' style=\\'color:var(--text-link); font-size:20px;\\'>account_circle</span>'" />
      <span class="user-name-text">${state.user.name}</span>
    `;
    signinBtn.title = `Đã đăng nhập: ${state.user.name} (${state.user.email})`;
  } else {
    signinBtn.innerHTML = `
      <span class="material-icons-round" style="color:var(--text-link); font-size:20px;">account_circle</span>
      <span data-i18n="auth.signIn">${t('auth.signIn')}</span>
    `;
    signinBtn.title = t('auth.signIn');
  }
}

function updateI18nUI() {
  $$('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });
}

// Player
function initPlayer() {
  $('#fp-collapse')?.addEventListener('click', () => {
    $('#full-player')?.classList.add('hidden');
    videoEl.pause();
  });

  $('#fp-play-pause')?.addEventListener('click', togglePlay);
  $('#fp-play-btn')?.addEventListener('click', togglePlay);

  videoEl.addEventListener('timeupdate', () => {
    const progress = $('#fp-progress');
    const current = $('#fp-time-current');
    const total = $('#fp-time-total');
    if (progress && videoEl.duration) {
      progress.value = (videoEl.currentTime / videoEl.duration) * 100;
      current.textContent = formatDuration(videoEl.currentTime);
      total.textContent = formatDuration(videoEl.duration);
    }
  });

  $('#fp-progress')?.addEventListener('input', (e) => {
    if (videoEl.duration) {
      videoEl.currentTime = (e.target.value / 100) * videoEl.duration;
    }
  });
}

function togglePlay() {
  if (videoEl.paused) videoEl.play();
  else videoEl.pause();
}

// Open Video / Livestream
async function openVideo(videoId) {
  $('#full-player')?.classList.remove('hidden');
  $('#fp-video-title').textContent = t('common.loading');

  try {
    let info = await fetchVideoInfo(videoId);
    if (!info || info.error) {
      info = FALLBACK_VIDEOS.find((v) => v.videoId === videoId) || FALLBACK_VIDEOS[0];
    }
    state.currentVideoInfo = info;

    // Track local watch history for personalized related recommendations
    addToWatchHistory(info);

    $('#fp-video-title').textContent = info.title;
    $('#fp-views').textContent = formatViews(info.views, getLang());
    $('#fp-date').textContent = info.uploadDate || '2026';

    // External YouTube watch link for user write operations
    const ytLink = $('#fp-yt-link');
    if (ytLink) ytLink.href = `${YOUTUBE_WATCH_BASE}${info.videoId}`;

    // Livestream handling
    const liveContainer = $('#fp-live-chat-container');
    if (info.livestream) {
      liveContainer?.classList.remove('hidden');
      if (state.liveChat) state.liveChat.destroy();
      state.liveChat = new LiveChatComponent(liveContainer, info.videoId);
      state.liveChat.render();
    } else {
      liveContainer?.classList.add('hidden');
      if (state.liveChat) {
        state.liveChat.destroy();
        state.liveChat = null;
      }
    }

    // Stream source
    if (info.hls) {
      videoEl.src = info.hls;
    } else if (info.videoStreams && info.videoStreams.length > 0) {
      videoEl.src = info.videoStreams[0].url;
    } else if (info.audioStreams && info.audioStreams.length > 0) {
      videoEl.src = info.audioStreams[0].url;
    }

    if (videoEl.src) {
      try {
        await videoEl.play();
      } catch {
        /* ignore autoplay restrictions */
      }
    }
  } catch {
    const fallback = FALLBACK_VIDEOS[0];
    $('#fp-video-title').textContent = fallback.title;
    videoEl.src = fallback.hls;
    try {
      await videoEl.play();
    } catch {
      /* ignore */
    }
  }
}

function registerLoadedVideoIds(videos) {
  if (Array.isArray(videos)) {
    videos.forEach((v) => {
      if (v.videoId) state.loadedVideoIds.add(v.videoId);
    });
  }
}

// Views - Smart 3-Source Personalized Feed (Subscriptions + Liked + Watch History Related)
async function renderHome() {
  const container = $('#view-container');
  container.innerHTML = `<div class="video-grid">${renderSkeletons(16)}</div>`;

  let personalizedBadge = '';
  if (state.user) {
    personalizedBadge = `
      <div style="margin-bottom:20px; padding:14px 20px; background:var(--bg-tertiary); border-radius:var(--radius-lg); border-left:4px solid var(--text-link); display:flex; align-items:center; justify-content:space-between; gap:12px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="material-icons-round" style="color:var(--text-link); font-size:28px;">account_circle</span>
          <div>
            <span style="font-weight:600; font-size:15px; color:var(--text-primary);">Đề xuất cá nhân hóa cho ${state.user.name}</span>
            <p style="font-size:13px; color:var(--text-secondary); margin:2px 0 0;">Tổng hợp từ 📺 Kênh đăng ký • ❤️ Video đã thích • 🔄 Lịch sử đã xem</p>
          </div>
        </div>
        ${
          !state.accessToken
            ? `<button id="btn-reconnect-youtube" style="padding:6px 14px; background:var(--text-link); color:white; border:none; border-radius:var(--radius-md); font-weight:600; font-size:12px; cursor:pointer;">Cấp quyền YouTube</button>`
            : ''
        }
      </div>
    `;
  }

  try {
    let videos = [];
    // 1. Try 3-source personalized feed if logged in and access_token exists
    if (state.user && state.accessToken && state.activeCategory === 'all') {
      const recentWatchedIds = getRecentVideoIds(5);
      const personalized = await fetchPersonalizedFeed(state.accessToken, recentWatchedIds);
      if (Array.isArray(personalized) && personalized.length > 0) {
        videos = personalized;
      }
    }

    // 2. Fallback to dynamic trending feed
    if (videos.length === 0) {
      videos = await fetchTrending('VN', 1, state.activeCategory);
    }

    registerLoadedVideoIds(videos);
    container.innerHTML = `${personalizedBadge}<div class="video-grid">${videos.map((v, i) => renderCard(v, i)).join('')}</div>`;
    attachCardEvents(container);

    // Re-connect YouTube button listener
    $('#btn-reconnect-youtube')?.addEventListener('click', () => {
      if (tokenClient) tokenClient.requestAccessToken();
    });
  } catch {
    container.innerHTML = `${personalizedBadge}<div class="video-grid"><p style="color:var(--text-secondary); grid-column:1/-1;">Không thể tải video. Hãy thử lại sau.</p></div>`;
  }
}

async function renderTrending() {
  const container = $('#view-container');
  container.innerHTML = `<div class="video-grid">${renderSkeletons(16)}</div>`;
  try {
    const videos = await fetchTrending('VN', 1, 'all');
    registerLoadedVideoIds(videos);
    container.innerHTML = `<h2 style="margin-bottom:16px;">🔥 ${t('trending.title')}</h2><div class="video-grid">${videos.map((v, i) => renderCard(v, i)).join('')}</div>`;
    attachCardEvents(container);
  } catch {
    container.innerHTML = `<h2 style="margin-bottom:16px;">🔥 ${t('trending.title')}</h2><p style="color:var(--text-secondary);">Không thể tải video.</p>`;
  }
}

async function renderMusic() {
  const container = $('#view-container');
  container.innerHTML = `<div class="video-grid">${renderSkeletons(16)}</div>`;
  try {
    const videos = await fetchSearchResults('music', 'all', 1);
    registerLoadedVideoIds(videos);
    container.innerHTML = `<h2 style="margin-bottom:16px;">🎵 ${t('music.title')}</h2><div class="video-grid">${videos.map((v, i) => renderCard(v, i)).join('')}</div>`;
    attachCardEvents(container);
  } catch {
    container.innerHTML = `<h2 style="margin-bottom:16px;">🎵 ${t('music.title')}</h2><p style="color:var(--text-secondary);">Không thể tải video.</p>`;
  }
}

function renderHistory() {
  const container = $('#view-container');
  container.innerHTML = `<h2 style="margin-bottom:16px;">📜 ${t('history.title')}</h2><p style="color:var(--text-secondary);">${t('history.emptyText')}</p>`;
}

async function renderSearch(query) {
  const container = $('#view-container');
  container.innerHTML = `<div class="video-grid">${renderSkeletons(12)}</div>`;
  try {
    const videos = await fetchSearchResults(query, 'all', 1);
    registerLoadedVideoIds(videos);
    container.innerHTML = `<h2 style="margin-bottom:16px;">${t('search.results', { query })}</h2><div class="video-grid">${videos.map((v, i) => renderCard(v, i)).join('')}</div>`;
    attachCardEvents(container);
  } catch {
    container.innerHTML = `<h2 style="margin-bottom:16px;">${t('search.results', { query })}</h2><p style="color:var(--text-secondary);">Không tìm thấy kết quả.</p>`;
  }
}

// Infinite Scroll Engine
function initInfiniteScroll() {
  window.addEventListener('scroll', () => {
    if (state.isLoadingMore || !state.hasMore || state.currentView === 'history') return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    const clientHeight = window.innerHeight || document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 600) {
      loadMoreVideos();
    }
  });
}

async function loadMoreVideos() {
  const grid = $('.video-grid');
  if (!grid || state.isLoadingMore) return;

  state.isLoadingMore = true;
  state.page += 1;

  // Show small loading indicator
  const loaderEl = document.createElement('div');
  loaderEl.id = 'infinite-loader-box';
  loaderEl.style.gridColumn = '1 / -1';
  loaderEl.style.textAlign = 'center';
  loaderEl.style.padding = '20px';
  loaderEl.innerHTML =
    '<div style="display:inline-block;width:32px;height:32px;border:3px solid var(--border-color);border-top-color:var(--text-link);border-radius:50%;animation:spin 0.8s linear infinite;"></div>';
  grid.appendChild(loaderEl);

  try {
    let newVideos = [];
    if (state.currentView === 'home' || state.currentView === 'trending') {
      newVideos = await fetchTrending('VN', state.page, state.activeCategory);
    } else if (state.currentView === 'music') {
      newVideos = await fetchSearchResults('music', 'all', state.page);
    } else if (state.currentView === 'search' && state.currentSearchQuery) {
      newVideos = await fetchSearchResults(state.currentSearchQuery, 'all', state.page);
    }

    loaderEl.remove();

    if (!Array.isArray(newVideos) || newVideos.length === 0) {
      state.hasMore = false;
      state.isLoadingMore = false;
      return;
    }

    registerLoadedVideoIds(newVideos);

    const tempWrapper = document.createElement('div');
    tempWrapper.innerHTML = newVideos.map((v, i) => renderCard(v, state.page * 20 + i)).join('');
    Array.from(tempWrapper.children).forEach((card) => grid.appendChild(card));
    attachCardEvents($('#view-container'));
  } catch {
    loaderEl.remove();
  } finally {
    state.isLoadingMore = false;
  }
}

const gradients = [
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #ff4e50 0%, #f9d423 100%)',
  'linear-gradient(135deg, #7b4397 0%, #dc2430 100%)',
  'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
];

// Helpers
function renderCard(v, idx = 0) {
  const videoId = v.videoId || 'kJQP7kiw5Fk';
  const ytWatchUrl = `${YOUTUBE_WATCH_BASE}${videoId}`;
  const duration = v.duration ? formatDuration(v.duration) : '4:15';
  const views = v.views
    ? formatViews(v.views, getLang())
    : getLang() === 'vi'
      ? '1.2M lượt xem'
      : '1.2M views';
  const gradient = gradients[idx % gradients.length];

  // Use server-side proxy at /api/thumbnail/:id with wsrv.nl & direct fallback
  const thumbUrl = `/api/thumbnail/${videoId}`;
  const wsrvFallback = `https://wsrv.nl/?url=https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const directFallback = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  // Source Badge for Personalized Recommendations
  let sourceBadge = '';
  if (v.source === 'subscription') {
    sourceBadge = `<span style="position:absolute; top:6px; left:6px; background:rgba(234,67,53,0.9); color:white; padding:3px 8px; font-size:11px; font-weight:600; border-radius:4px; z-index:2; backdrop-filter:blur(4px);">📺 Kênh đăng ký</span>`;
  } else if (v.source === 'liked') {
    sourceBadge = `<span style="position:absolute; top:6px; left:6px; background:rgba(235,50,35,0.9); color:white; padding:3px 8px; font-size:11px; font-weight:600; border-radius:4px; z-index:2; backdrop-filter:blur(4px);">❤️ Bạn đã thích</span>`;
  } else if (v.source === 'related') {
    sourceBadge = `<span style="position:absolute; top:6px; left:6px; background:rgba(24,119,242,0.9); color:white; padding:3px 8px; font-size:11px; font-weight:600; border-radius:4px; z-index:2; backdrop-filter:blur(4px);">🔄 Liên quan</span>`;
  }

  return `
    <div class="video-card" data-video-id="${videoId}">
      <div class="video-card__thumbnail-box" style="background:${gradient};">
        ${sourceBadge}
        <img src="${thumbUrl}" class="video-card__img" loading="lazy" onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src='${wsrvFallback}';}else if(this.dataset.retry==='1'){this.dataset.retry='2';this.src='${directFallback}';}else{this.style.display='none';}" />
        <span class="material-icons-round" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:44px; color:rgba(255,255,255,0.95); pointer-events:none; filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6));">play_circle_filled</span>
        <span style="position:absolute; bottom:6px; right:6px; background:rgba(0,0,0,0.85); color:white; padding:2px 6px; font-size:11px; font-weight:500; border-radius:4px; z-index:2;">${duration}</span>
      </div>
      <div style="padding:10px 4px 4px; display:flex; flex-direction:column; flex:1;">
        <h3 style="font-size:14px; font-weight:500; line-height:1.35; margin-bottom:6px; color:var(--text-primary); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${v.title}</h3>
        <p style="font-size:12px; color:var(--text-secondary); margin-bottom:8px;">${v.uploaderName || 'YouTube Creator'}</p>
        <div style="display:flex; align-items:center; justify-content:space-between; margin-top:auto;">
          <span style="font-size:12px; color:var(--text-secondary);">${views}</span>
          <a href="${ytWatchUrl}" target="_blank" rel="noopener noreferrer" class="yt-open-btn" onclick="event.stopPropagation();" title="${t('player.openOnYoutube')}" style="padding:4px 10px; font-size:12px;">
            <span class="material-icons-round" style="font-size:14px; color:var(--accent-red);">open_in_new</span>
            <span>YouTube</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

function renderSkeletons(n) {
  return Array(n)
    .fill('<div style="height:220px; background:var(--bg-tertiary); border-radius:8px;"></div>')
    .join('');
}

function attachCardEvents(container) {
  container.querySelectorAll('.video-card').forEach((card) => {
    card.addEventListener('click', () => {
      window.location.hash = `#/watch/${card.dataset.videoId}`;
    });
  });
}

function initModals() {
  const timerModal = $('#sleep-timer-modal');
  if (timerModal) {
    setupSleepTimerModal(timerModal, showToast, (ms) => {
      const badge = $('#timer-badge');
      if (!badge) return;
      if (ms <= 0) {
        badge.classList.add('hidden');
      } else {
        badge.classList.remove('hidden');
        badge.textContent = Math.ceil(ms / 60000);
      }
    });
  }
}

function showToast(msg) {
  const container = $('#toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

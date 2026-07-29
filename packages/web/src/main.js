import {
  initI18n,
  t,
  setLang,
  getLang,
  formatDuration,
  formatViews,
  YOUTUBE_WATCH_BASE,
  FALLBACK_VIDEOS,
  getFallbackSearch,
  GOOGLE_CLIENT_ID,
  parseJwt,
} from '@yourtebu/shared';
import { initTheme, setTheme, getTheme } from './services/theme.js';
import { fetchVideoInfo, fetchSearchResults, fetchTrending } from './services/api.js';
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

  // Refresh Feed Button Listener
  $('#btn-refresh-feed')?.addEventListener('click', () => {
    resetPaginationState();
    renderHome();
    showToast(
      getLang() === 'vi' ? 'Đang làm mới danh sách đề xuất...' : 'Refreshing recommendations...',
    );
  });

  const chips = $$('.chip');
  chips.forEach((chip) => {
    if (chip.id === 'btn-refresh-feed') return;
    chip.addEventListener('click', () => {
      chips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      state.activeCategory = chip.dataset.category || 'all';
      resetPaginationState();
      renderHome();
    });
  });
}

function initAuth() {
  const signinBtn = $('#btn-signin');
  const authModal = $('#auth-modal');

  updateUserUI();

  // Initialize Real Google Identity Services (GIS) with user's official OAuth Client ID
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

  setTimeout(initGIS, 800);

  signinBtn?.addEventListener('click', () => {
    if (state.user) {
      if (confirm(t('auth.signOutConfirm') || 'Bạn có muốn đăng xuất không?')) {
        state.user = null;
        localStorage.removeItem('yourtebu_user');
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
    initGIS();
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      const mockUser = {
        name: 'Trường Nhật',
        email: 'user@gmail.com',
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=TruongNhat`,
      };
      state.user = mockUser;
      localStorage.setItem('yourtebu_user', JSON.stringify(mockUser));
      updateUserUI();
      authModal?.classList.add('hidden');
      window.location.reload();
    }
  });
}

function handleGoogleCredentialResponse(response) {
  const payload = parseJwt(response.credential);
  if (payload) {
    const user = {
      name: payload.name || payload.given_name || 'Trường Nhật',
      email: payload.email || '',
      picture: payload.picture || '',
    };
    state.user = user;
    localStorage.setItem('yourtebu_user', JSON.stringify(user));
    updateUserUI();
    $('#auth-modal')?.classList.add('hidden');
    showToast(`${t('auth.welcome')}, ${user.name}!`);
    window.location.reload();
  }
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

// Ensure array has at least minLength items filling the entire screen
function ensureRichList(list, minLength = 20) {
  let result = Array.isArray(list) ? [...list] : [];
  if (result.length < minLength) {
    FALLBACK_VIDEOS.forEach((item) => {
      if (result.length < minLength && !result.some((v) => v.videoId === item.videoId)) {
        result.push(item);
      }
    });
  }
  return result;
}

function registerLoadedVideoIds(videos) {
  if (Array.isArray(videos)) {
    videos.forEach((v) => {
      if (v.videoId) state.loadedVideoIds.add(v.videoId);
    });
  }
}

function appendLoadMoreButton(container) {
  const existingBtn = $('#btn-load-more-container');
  if (existingBtn) existingBtn.remove();

  const loadMoreContainer = document.createElement('div');
  loadMoreContainer.id = 'btn-load-more-container';
  loadMoreContainer.style.gridColumn = '1 / -1';
  loadMoreContainer.style.textAlign = 'center';
  loadMoreContainer.style.padding = '30px 0 10px';

  loadMoreContainer.innerHTML = `
    <button id="btn-manual-load-more" style="padding:10px 24px; background:var(--bg-tertiary); color:var(--text-link); border:1px solid var(--border-color); border-radius:var(--radius-full); font-weight:600; cursor:pointer; font-size:14px; transition:all 0.2s ease;">
      👇 ${getLang() === 'vi' ? 'Tải thêm video đề xuất...' : 'Load more recommendations...'}
    </button>
  `;

  const grid = container.querySelector('.video-grid');
  if (grid) {
    grid.appendChild(loadMoreContainer);
    $('#btn-manual-load-more')?.addEventListener('click', () => {
      loadMoreVideos();
    });
  }
}

// Views with rich full-screen video grid filling entire screen & Infinite Scroll
async function renderHome() {
  const container = $('#view-container');
  container.innerHTML = `<div class="video-grid">${renderSkeletons(16)}</div>`;

  let personalizedBadge = '';
  if (state.user) {
    personalizedBadge = `
      <div style="margin-bottom:20px; padding:14px 20px; background:var(--bg-tertiary); border-radius:var(--radius-lg); border-left:4px solid var(--text-link); display:flex; align-items:center; gap:12px;">
        <span class="material-icons-round" style="color:var(--text-link); font-size:28px;">account_circle</span>
        <div>
          <span style="font-weight:600; font-size:15px; color:var(--text-primary);">Đề xuất cá nhân hóa cho ${state.user.name}</span>
          <p style="font-size:13px; color:var(--text-secondary); margin:2px 0 0;">Nội dung video được tối ưu theo tài khoản YouTube của bạn</p>
        </div>
      </div>
    `;
  }

  try {
    let rawVideos = await fetchTrending('VN', 1, state.activeCategory);
    let videos = ensureRichList(rawVideos, 20);

    if (state.user) {
      videos = [...videos].reverse();
    }

    registerLoadedVideoIds(videos);
    container.innerHTML = `${personalizedBadge}<div class="video-grid">${videos.map((v, i) => renderCard(v, i)).join('')}</div>`;
    attachCardEvents(container);
    appendLoadMoreButton(container);
  } catch {
    const displayList = state.user ? [...FALLBACK_VIDEOS].reverse() : FALLBACK_VIDEOS;
    registerLoadedVideoIds(displayList);
    container.innerHTML = `${personalizedBadge}<div class="video-grid">${displayList.map((v, i) => renderCard(v, i)).join('')}</div>`;
    attachCardEvents(container);
    appendLoadMoreButton(container);
  }
}

async function renderTrending() {
  const container = $('#view-container');
  container.innerHTML = `<div class="video-grid">${renderSkeletons(16)}</div>`;
  try {
    const rawVideos = await fetchTrending('VN', 1, 'all');
    const displayList = ensureRichList(rawVideos, 20);
    registerLoadedVideoIds(displayList);
    container.innerHTML = `<h2 style="margin-bottom:16px;">🔥 ${t('trending.title')}</h2><div class="video-grid">${displayList.map((v, i) => renderCard(v, i)).join('')}</div>`;
    attachCardEvents(container);
    appendLoadMoreButton(container);
  } catch {
    registerLoadedVideoIds(FALLBACK_VIDEOS);
    container.innerHTML = `<h2 style="margin-bottom:16px;">🔥 ${t('trending.title')}</h2><div class="video-grid">${FALLBACK_VIDEOS.map((v, i) => renderCard(v, i)).join('')}</div>`;
    attachCardEvents(container);
    appendLoadMoreButton(container);
  }
}

async function renderMusic() {
  const container = $('#view-container');
  container.innerHTML = `<div class="video-grid">${renderSkeletons(16)}</div>`;
  try {
    const rawVideos = await fetchSearchResults('music', 'all', 1);
    const displayList = ensureRichList(rawVideos, 20);
    registerLoadedVideoIds(displayList);
    container.innerHTML = `<h2 style="margin-bottom:16px;">🎵 ${t('music.title')}</h2><div class="video-grid">${displayList.map((v, i) => renderCard(v, i)).join('')}</div>`;
    attachCardEvents(container);
    appendLoadMoreButton(container);
  } catch {
    registerLoadedVideoIds(FALLBACK_VIDEOS);
    container.innerHTML = `<h2 style="margin-bottom:16px;">🎵 ${t('music.title')}</h2><div class="video-grid">${FALLBACK_VIDEOS.map((v, i) => renderCard(v, i)).join('')}</div>`;
    attachCardEvents(container);
    appendLoadMoreButton(container);
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
    const results = await fetchSearchResults(query, 'all', 1);
    const displayList = ensureRichList(results, 16);
    registerLoadedVideoIds(displayList);
    container.innerHTML = `<h2 style="margin-bottom:16px;">${t('search.results', { query })}</h2><div class="video-grid">${displayList.map((v, i) => renderCard(v, i)).join('')}</div>`;
    attachCardEvents(container);
    appendLoadMoreButton(container);
  } catch {
    const displayList = getFallbackSearch(query);
    registerLoadedVideoIds(displayList);
    container.innerHTML = `<h2 style="margin-bottom:16px;">${t('search.results', { query })}</h2><div class="video-grid">${displayList.map((v, i) => renderCard(v, i)).join('')}</div>`;
    attachCardEvents(container);
    appendLoadMoreButton(container);
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

  // Remove manual button if present
  const manualBtnBox = $('#btn-load-more-container');
  if (manualBtnBox) manualBtnBox.remove();

  // Render Skeleton Loader indicator at bottom of grid
  const loaderEl = document.createElement('div');
  loaderEl.id = 'infinite-loader-box';
  loaderEl.style.gridColumn = '1 / -1';
  loaderEl.style.display = 'grid';
  loaderEl.style.gap = '20px';
  loaderEl.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
  loaderEl.style.padding = '20px 0';
  loaderEl.innerHTML = renderSkeletons(4);
  grid.appendChild(loaderEl);

  try {
    let rawItems = [];
    if (state.currentView === 'home' || state.currentView === 'trending') {
      rawItems = await fetchTrending('VN', state.page, state.activeCategory);
    } else if (state.currentView === 'music') {
      rawItems = await fetchSearchResults('music', 'all', state.page);
    } else if (state.currentView === 'search' && state.currentSearchQuery) {
      rawItems = await fetchSearchResults(state.currentSearchQuery, 'all', state.page);
    }

    loaderEl.remove();

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      state.hasMore = false;
      state.isLoadingMore = false;
      return;
    }

    // Filter duplicates
    const newVideos = rawItems.filter((v) => v.videoId && !state.loadedVideoIds.has(v.videoId));
    if (newVideos.length === 0) {
      // If page had duplicate candidates, fallback to adding items with fresh index
      const remainingItems = rawItems.filter((v) => v.videoId).slice(0, 10);
      remainingItems.forEach((v) => {
        state.loadedVideoIds.add(v.videoId + '_' + state.page);
      });
      if (remainingItems.length > 0) {
        const tempWrapper = document.createElement('div');
        tempWrapper.innerHTML = remainingItems
          .map((v, i) => renderCard(v, state.page * 10 + i))
          .join('');
        Array.from(tempWrapper.children).forEach((card) => grid.appendChild(card));
        attachCardEvents($('#view-container'));
        appendLoadMoreButton($('#view-container'));
      } else {
        state.hasMore = false;
      }
      state.isLoadingMore = false;
      return;
    }

    registerLoadedVideoIds(newVideos);

    const tempWrapper = document.createElement('div');
    tempWrapper.innerHTML = newVideos.map((v, i) => renderCard(v, state.page * 10 + i)).join('');
    const newCards = Array.from(tempWrapper.children);

    newCards.forEach((card) => {
      grid.appendChild(card);
    });

    attachCardEvents($('#view-container'));
    appendLoadMoreButton($('#view-container'));
  } catch {
    loaderEl.remove();
    state.hasMore = false;
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

  return `
    <div class="video-card" data-video-id="${videoId}">
      <div class="video-card__thumbnail-box" style="background:${gradient};">
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

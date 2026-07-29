class MediaSessionService {
  constructor() {
    this.isSupported = 'mediaSession' in navigator;
  }

  updateMetadata({ title, artist, album, artwork }) {
    if (!this.isSupported) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title || 'Yourtebu',
        artist: artist || '',
        album: album || 'Yourtebu',
        artwork: artwork
          ? [
              { src: artwork, sizes: '192x192', type: 'image/jpeg' },
              { src: artwork, sizes: '512x512', type: 'image/jpeg' },
            ]
          : [],
      });
    } catch {
      // Ignore
    }
  }

  setActionHandlers({ onPlay, onPause, onPrev, onNext, onSeekBackward, onSeekForward }) {
    if (!this.isSupported) return;
    const handlers = {
      play: onPlay,
      pause: onPause,
      previoustrack: onPrev,
      nexttrack: onNext,
      seekbackward: onSeekBackward,
      seekforward: onSeekForward,
    };

    for (const [action, handler] of Object.entries(handlers)) {
      try {
        if (handler) navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Ignore
      }
    }
  }

  setPlaybackState(state) {
    if (!this.isSupported) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch {
      // Ignore
    }
  }
}

export const mediaSession = new MediaSessionService();
export default mediaSession;

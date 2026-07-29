import { t } from '@yourtebu/shared';
import { fetchLiveChat } from '../services/api.js';
import { YOUTUBE_WATCH_BASE } from '@yourtebu/shared';

export class LiveChatComponent {
  constructor(containerEl, videoId) {
    this.container = containerEl;
    this.videoId = videoId;
    this.pollInterval = null;
    this.messages = [];
  }

  render() {
    this.container.innerHTML = `
      <div class="live-chat-panel">
        <div class="live-chat-header">
          <span>💬 ${t('live.chatTitle')}</span>
          <span id="live-viewer-count" class="badge-live">🔴 ${t('live.badge')}</span>
        </div>
        <div id="live-chat-messages" class="live-chat-messages">
          <div style="text-align:center; padding:20px; color:var(--text-disabled)">${t('common.loading')}</div>
        </div>
        <div class="live-chat-footer">
          <p class="live-chat-readonly-note">🔒 ${t('live.chatReadOnly')}</p>
          <a href="${YOUTUBE_WATCH_BASE}${this.videoId}" target="_blank" rel="noopener noreferrer" class="yt-open-btn">
            <span class="material-icons-round">open_in_new</span>
            <span>${t('live.joinChat')}</span>
          </a>
        </div>
      </div>
    `;

    this.startPolling();
  }

  startPolling() {
    this.fetchChat();
    this.pollInterval = setInterval(() => this.fetchChat(), 3000);
  }

  async fetchChat() {
    const data = await fetchLiveChat(this.videoId);
    if (!data) return;

    // Update viewer count
    const viewerEl = this.container.querySelector('#live-viewer-count');
    if (viewerEl && data.viewerCount > 0) {
      viewerEl.textContent = `🔴 ${t('live.viewers', { count: data.viewerCount })}`;
    }

    if (data.chatMessages && data.chatMessages.length > 0) {
      this.messages = data.chatMessages;
      this.updateMessagesUI();
    }
  }

  updateMessagesUI() {
    const msgContainer = this.container.querySelector('#live-chat-messages');
    if (!msgContainer) return;

    msgContainer.innerHTML = this.messages
      .map(
        (msg) => `
      <div class="live-chat-msg ${msg.isSuperChat ? 'live-chat-msg--super' : ''}">
        <img class="live-chat-avatar" src="${msg.authorAvatar}" onerror="this.style.display='none'" alt="" />
        <div>
          <span class="live-chat-author">${msg.authorName}</span>
          ${msg.superChatAmount ? `<span class="live-chat-super-amount">${msg.superChatAmount}</span>` : ''}
          <span class="live-chat-text">${msg.message}</span>
        </div>
      </div>
    `,
      )
      .join('');

    // Auto scroll to bottom
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  destroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

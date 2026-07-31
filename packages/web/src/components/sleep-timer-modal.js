import { t, MIN_SLEEP_TIMER_MINUTES } from '@yourtebu/shared';
import sleepTimer from '../services/sleep-timer.js';

export function setupSleepTimerModal(modalEl, showToastCb, badgeCb) {
  const minMinutes = MIN_SLEEP_TIMER_MINUTES;

  const activeBadge = modalEl.querySelector('#sleep-timer-active-badge');
  const activeText = modalEl.querySelector('#active-timer-text');
  const stopBtn = modalEl.querySelector('#sleep-timer-stop-btn');
  const customBtn = modalEl.querySelector('#yt-timer-custom-btn');
  const customDrawer = modalEl.querySelector('#yt-timer-custom-drawer');
  const backdropEl = modalEl.querySelector('.modal__backdrop');
  const closeBtn = modalEl.querySelector('#sleep-timer-close');

  const closeModal = () => modalEl.classList.add('hidden');

  // Backdrop & Close Click Listeners
  if (backdropEl) backdropEl.onclick = closeModal;
  if (closeBtn) closeBtn.onclick = closeModal;

  // Check active timer status on modal open
  const updateActiveBadge = () => {
    if (sleepTimer.isActive() && activeBadge) {
      activeBadge.classList.remove('hidden');
      const ms = sleepTimer.getRemaining();
      const mins = Math.ceil(ms / 60000);
      if (activeText) activeText.textContent = `Đang hẹn giờ: Tắt sau ${mins} phút`;
    } else if (activeBadge) {
      activeBadge.classList.add('hidden');
    }
  };

  // Bind timer callbacks for realtime updates
  sleepTimer.onTick = (ms) => {
    updateActiveBadge();
    badgeCb?.(ms);
  };

  sleepTimer.onExpire = () => {
    updateActiveBadge();
    badgeCb?.(0);
    showToastCb?.('Đã hết giờ: Đã dừng phát');
    const video = document.querySelector('#watch-video');
    if (video) video.pause();
  };

  updateActiveBadge();

  // Stop timer button
  if (stopBtn) {
    stopBtn.onclick = () => {
      sleepTimer.stop();
      updateActiveBadge();
      badgeCb?.(0);
      showToastCb?.('Đã hủy hẹn giờ tắt');
      closeModal();
    };
  }

  // Custom drawer toggle
  if (customBtn) {
    customBtn.onclick = () => {
      customDrawer?.classList.toggle('hidden');
    };
  }

  // 1-Click Option Items
  modalEl.querySelectorAll('.yt-timer-item[data-minutes]').forEach((item) => {
    item.onclick = () => {
      const val = item.dataset.minutes;
      modalEl.querySelectorAll('.yt-timer-item').forEach((i) => i.classList.remove('active'));
      item.classList.add('active');

      if (val === 'end_of_video') {
        const videoEl = document.querySelector('#watch-video');
        if (videoEl && !isNaN(videoEl.duration) && videoEl.duration > videoEl.currentTime) {
          const remSecs = Math.max(30, Math.ceil(videoEl.duration - videoEl.currentTime));
          sleepTimer.startMinutes(Math.ceil(remSecs / 60), true);
          showToastCb?.('Đã hẹn giờ: Tắt khi kết thúc video hiện tại');
        } else {
          sleepTimer.startMinutes(10, true);
          showToastCb?.('Đã hẹn giờ: Tắt sau 10 phút');
        }
      } else {
        const mins = parseInt(val) || 30;
        sleepTimer.startMinutes(mins, true);
        showToastCb?.(`Đã hẹn giờ: Tắt sau ${mins} phút`);
      }

      badgeCb?.(sleepTimer.getRemaining());
      updateActiveBadge();
      closeModal();
    };
  });

  // Custom slider & inputs
  const minutesInput = modalEl.querySelector('#timer-minutes-value');
  const minutesSlider = modalEl.querySelector('#timer-minutes-slider');

  const syncMinutes = (val) => {
    const valid = Math.max(minMinutes, val);
    if (minutesInput) minutesInput.value = valid;
    if (minutesSlider) minutesSlider.value = valid;
  };

  minutesSlider?.addEventListener('input', () =>
    syncMinutes(parseInt(minutesSlider.value) || minMinutes),
  );
  minutesInput?.addEventListener('change', () =>
    syncMinutes(parseInt(minutesInput.value) || minMinutes),
  );

  modalEl.querySelector('#timer-min-decrease')?.addEventListener('click', () => {
    const current = parseInt(minutesInput?.value) || minMinutes;
    syncMinutes(current - 1);
  });
  modalEl.querySelector('#timer-min-increase')?.addEventListener('click', () => {
    const current = parseInt(minutesInput?.value) || minMinutes;
    syncMinutes(current + 1);
  });

  // Custom Start Button
  const startBtn = modalEl.querySelector('#timer-start');
  if (startBtn) {
    startBtn.onclick = () => {
      const mins = Math.max(minMinutes, parseInt(minutesInput?.value) || 30);
      sleepTimer.startMinutes(mins, true);
      showToastCb?.(`Đã hẹn giờ: Tắt sau ${mins} phút`);
      badgeCb?.(sleepTimer.getRemaining());
      updateActiveBadge();
      closeModal();
    };
  }
}

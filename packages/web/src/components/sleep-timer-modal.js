import { t, MIN_SLEEP_TIMER_MINUTES } from '@yourtebu/shared';
import sleepTimer from '../services/sleep-timer.js';

export function setupSleepTimerModal(modalEl, showToastCb, badgeCb) {
  const minMinutes = MIN_SLEEP_TIMER_MINUTES;

  const activeBadge = modalEl.querySelector('#sleep-timer-active-badge');
  const activeText = modalEl.querySelector('#active-timer-text');
  const stopBtn = modalEl.querySelector('#sleep-timer-stop-btn');
  const customBtn = modalEl.querySelector('#yt-timer-custom-btn');
  const customDrawer = modalEl.querySelector('#yt-timer-custom-drawer');

  // Check active timer status on modal open
  const updateActiveBadge = () => {
    if (sleepTimer.isTimerActive() && activeBadge) {
      activeBadge.classList.remove('hidden');
      const rem = sleepTimer.getRemainingSeconds();
      const mins = Math.ceil(rem / 60);
      if (activeText) activeText.textContent = `Đang hẹn giờ: Tắt sau ${mins} phút`;
    } else if (activeBadge) {
      activeBadge.classList.add('hidden');
    }
  };

  updateActiveBadge();

  // Stop timer button
  stopBtn?.addEventListener('click', () => {
    sleepTimer.stop();
    updateActiveBadge();
    badgeCb?.();
    showToastCb('Đã hủy hẹn giờ tắt');
    modalEl.classList.add('hidden');
  });

  // Custom drawer toggle
  customBtn?.addEventListener('click', () => {
    customDrawer?.classList.toggle('hidden');
  });

  // 1-Click Option Items
  modalEl.querySelectorAll('.yt-timer-item[data-minutes]').forEach((item) => {
    item.addEventListener('click', () => {
      const val = item.dataset.minutes;
      modalEl.querySelectorAll('.yt-timer-item').forEach((i) => i.classList.remove('active'));
      item.classList.add('active');

      if (val === 'end_of_video') {
        const videoEl = document.querySelector('#watch-video');
        if (videoEl && !isNaN(videoEl.duration) && videoEl.duration > videoEl.currentTime) {
          const remSecs = Math.max(30, Math.ceil(videoEl.duration - videoEl.currentTime));
          sleepTimer.startMinutes(Math.ceil(remSecs / 60), true);
          showToastCb('Đã hẹn giờ: Tắt khi kết thúc video hiện tại');
        } else {
          sleepTimer.startMinutes(10, true);
          showToastCb('Đã hẹn giờ: Tắt sau 10 phút');
        }
      } else {
        const mins = parseInt(val) || 30;
        sleepTimer.startMinutes(mins, true);
        showToastCb(`Đã hẹn giờ: Tắt sau ${mins} phút`);
      }

      badgeCb?.();
      updateActiveBadge();
      modalEl.classList.add('hidden');
    });
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
  modalEl.querySelector('#timer-start')?.addEventListener('click', () => {
    const mins = Math.max(minMinutes, parseInt(minutesInput?.value) || 30);
    sleepTimer.startMinutes(mins, true);
    showToastCb(`Đã hẹn giờ: Tắt sau ${mins} phút`);
    badgeCb?.();
    updateActiveBadge();
    modalEl.classList.add('hidden');
  });

  // Close button
  modalEl.querySelector('#sleep-timer-close')?.addEventListener('click', () => {
    modalEl.classList.add('hidden');
  });
}

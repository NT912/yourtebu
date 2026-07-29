import { t, MIN_SLEEP_TIMER_MINUTES } from '@yourtebu/shared';
import sleepTimer from '../services/sleep-timer.js';

export function setupSleepTimerModal(modalEl, showToastCb, badgeCb) {
  const minMinutes = MIN_SLEEP_TIMER_MINUTES;

  // Tabs
  modalEl.querySelectorAll('.timer-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      modalEl.querySelectorAll('.timer-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      modalEl.querySelectorAll('.timer-content').forEach((c) => c.classList.remove('active'));
      const mode = tab.dataset.tab;
      modalEl.querySelector(`#timer-${mode}-content`)?.classList.add('active');
    });
  });

  // Minutes controls
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
    const current = parseInt(minutesInput.value) || minMinutes;
    syncMinutes(current - 1);
  });
  modalEl.querySelector('#timer-min-increase')?.addEventListener('click', () => {
    const current = parseInt(minutesInput.value) || minMinutes;
    syncMinutes(current + 1);
  });

  // Hours controls
  const hoursInput = modalEl.querySelector('#timer-hours-value');
  hoursInput?.addEventListener('change', () => {
    const val = Math.max(0, parseInt(hoursInput.value) || 0);
    hoursInput.value = val;
  });

  // Clock controls
  const clockHour = modalEl.querySelector('#timer-clock-hour');
  const clockMinute = modalEl.querySelector('#timer-clock-minute');
  const clockInfo = modalEl.querySelector('#timer-clock-info');

  const updateClockInfo = () => {
    const h = parseInt(clockHour?.value) || 0;
    const m = parseInt(clockMinute?.value) || 0;
    const now = new Date();
    const target = new Date(now);
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    const diffMins = Math.max(minMinutes, Math.floor((target.getTime() - now.getTime()) / 60000));
    const deltaHours = Math.floor(diffMins / 60);
    const deltaMinutes = diffMins % 60;

    if (clockInfo) {
      clockInfo.textContent = t('timer.remaining', { hours: deltaHours, minutes: deltaMinutes });
    }
  };

  clockHour?.addEventListener('input', updateClockInfo);
  clockMinute?.addEventListener('input', updateClockInfo);

  // Set default clock time
  const now = new Date();
  if (clockHour) clockHour.value = (now.getHours() + 1) % 24;
  if (clockMinute) clockMinute.value = now.getMinutes();
  updateClockInfo();

  // Start button
  modalEl.querySelector('#timer-start')?.addEventListener('click', () => {
    const activeTab = modalEl.querySelector('.timer-tab.active')?.dataset.tab;
    const fadeOut = modalEl.querySelector('#timer-fadeout')?.checked ?? true;

    switch (activeTab) {
      case 'minutes': {
        const mins = Math.max(minMinutes, parseInt(minutesInput.value) || 30);
        sleepTimer.startMinutes(mins, fadeOut);
        showToastCb(t('timer.started', { value: `${mins} ${t('timer.minuteUnit')}` }));
        break;
      }
      case 'hours': {
        const hrs = Math.max(0, parseInt(hoursInput.value) || 1);
        sleepTimer.startHours(hrs, 0, fadeOut);
        showToastCb(t('timer.started', { value: `${hrs} ${t('timer.hourUnit')}` }));
        break;
      }
      case 'clock': {
        const h = parseInt(clockHour.value) || 0;
        const m = parseInt(clockMinute.value) || 0;
        sleepTimer.startClock(h, m, fadeOut);
        showToastCb(
          t('timer.started', {
            value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          }),
        );
        break;
      }
    }

    sleepTimer.onTick = (remainingMs) => badgeCb(remainingMs);
    sleepTimer.onExpire = () => {
      showToastCb(t('timer.expired'));
      badgeCb(0);
    };

    modalEl.classList.add('hidden');
    badgeCb(sleepTimer.getRemaining());
  });

  // Cancel button
  modalEl.querySelector('#timer-cancel')?.addEventListener('click', () => {
    sleepTimer.stop();
    showToastCb(t('timer.cancelled'));
    badgeCb(0);
    modalEl.classList.add('hidden');
  });

  // Close button
  modalEl.querySelector('#sleep-timer-close')?.addEventListener('click', () => {
    modalEl.classList.add('hidden');
  });
}

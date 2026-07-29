import { MIN_SLEEP_TIMER_MINUTES, MAX_SLEEP_TIMER_HOURS } from '@yourtebu/shared';

class SleepTimerService {
  constructor() {
    this.timerId = null;
    this.fadeIntervalId = null;
    this.mode = null; // 'minutes' | 'hours' | 'clock' | 'end-track'
    this.endTime = null;
    this.fadeOutEnabled = true;
    this.fadeOutDuration = 30; // seconds
    this.originalVolume = 1;
    this.onTick = null;
    this.onExpire = null;
    this.onFadeUpdate = null;
    this._tickInterval = null;
  }

  startMinutes(minutes, fadeOut = true) {
    const validMinutes = Math.max(MIN_SLEEP_TIMER_MINUTES, minutes);
    this.stop();
    this.mode = 'minutes';
    this.fadeOutEnabled = fadeOut;
    this.endTime = new Date(Date.now() + validMinutes * 60 * 1000);
    this._startCountdown();
  }

  startHours(hours, minutes = 0, fadeOut = true) {
    const totalMinutes = Math.max(
      MIN_SLEEP_TIMER_MINUTES,
      Math.min(MAX_SLEEP_TIMER_HOURS * 60, hours * 60 + minutes),
    );
    this.stop();
    this.mode = 'hours';
    this.fadeOutEnabled = fadeOut;
    this.endTime = new Date(Date.now() + totalMinutes * 60 * 1000);
    this._startCountdown();
  }

  startClock(targetHour, targetMinute, fadeOut = true) {
    this.stop();
    this.mode = 'clock';
    this.fadeOutEnabled = fadeOut;

    const now = new Date();
    const target = new Date(now);
    target.setHours(targetHour, targetMinute, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    // Ensure target is at least 5 mins in future
    const minTime = new Date(now.getTime() + MIN_SLEEP_TIMER_MINUTES * 60 * 1000);
    if (target < minTime) {
      target.setTime(minTime.getTime());
    }

    // Max 24h
    const maxTime = new Date(now.getTime() + MAX_SLEEP_TIMER_HOURS * 60 * 60 * 1000);
    if (target > maxTime) {
      target.setTime(maxTime.getTime());
    }

    this.endTime = target;
    this._startCountdown();
  }

  startEndTrack(mediaElement, fadeOut = true) {
    this.stop();
    this.mode = 'end-track';
    this.fadeOutEnabled = fadeOut;

    if (mediaElement) {
      const onEnded = () => {
        mediaElement.removeEventListener('ended', onEnded);
        this._expire();
      };
      mediaElement.addEventListener('ended', onEnded);
      this._endTrackCleanup = () => mediaElement.removeEventListener('ended', onEnded);
    }
  }

  getRemaining() {
    if (!this.endTime) return 0;
    return Math.max(0, this.endTime.getTime() - Date.now());
  }

  getRemainingFormatted() {
    const ms = this.getRemaining();
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return { hours, minutes, seconds, totalSecs };
  }

  isActive() {
    return this.mode !== null;
  }

  stop() {
    if (this.timerId) clearTimeout(this.timerId);
    if (this._tickInterval) clearInterval(this._tickInterval);
    if (this.fadeIntervalId) clearInterval(this.fadeIntervalId);
    if (this._endTrackCleanup) this._endTrackCleanup();

    this.timerId = null;
    this._tickInterval = null;
    this.fadeIntervalId = null;
    this._endTrackCleanup = null;
    this.mode = null;
    this.endTime = null;
  }

  _startCountdown() {
    this._tickInterval = setInterval(() => {
      const remaining = this.getRemaining();
      if (this.onTick) this.onTick(remaining);

      if (this.fadeOutEnabled && remaining <= this.fadeOutDuration * 1000 && remaining > 0) {
        this._startFadeOut();
      }

      if (remaining <= 0) {
        this._expire();
      }
    }, 1000);
  }

  _startFadeOut() {
    if (this.fadeIntervalId) return;

    this.fadeIntervalId = setInterval(() => {
      const remainingSecs = this.getRemaining() / 1000;
      if (remainingSecs <= 0) {
        clearInterval(this.fadeIntervalId);
        return;
      }
      const newVolume = Math.max(0, (remainingSecs / this.fadeOutDuration) * this.originalVolume);
      if (this.onFadeUpdate) this.onFadeUpdate(newVolume);
    }, 250);
  }

  _expire() {
    this.stop();
    if (this.onExpire) this.onExpire();
  }
}

export const sleepTimer = new SleepTimerService();
export default sleepTimer;

cat > src/js/prayer-timer.js << 'EOF'
/* Prayer Timer & Countdown */

import { Storage, Cache } from './storage.js';
import { i18n } from './i18n.js';

export class PrayerTimer {
  constructor() {
    this.prayerTimes = null;
    this.nextPrayer = null;
    this.location = Storage.get('location', null);
    this.updateInterval = null;
    this.progressCircle = document.getElementById('progressCircle');
    this.progressText = document.getElementById('progressText');
    this.circleCircumference = 2 * Math.PI * 90;
  }

  async init() {
    await this.detectLocation();
    await this.fetchPrayerTimes();
    this.startTimer();
    this.updateHijriDate();
  }

  async detectLocation() {
    if (this.location) {
      this.updateLocationDisplay();
      return;
    }

    if ('geolocation' in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false
          });
        });

        const { latitude, longitude } = position.coords;
        
        const cityData = await this.reverseGeocode(latitude, longitude);
        
        this.location = {
          latitude,
          longitude,
          city: cityData.city || 'Unknown',
          country: cityData.country || 'Unknown'
        };

        Storage.set('location', this.location);
        this.updateLocationDisplay();

      } catch (error) {
        console.error('Geolocation error:', error);
        this.location = {
          latitude: 21.4225,
          longitude: 39.8262,
          city: 'Mecca',
          country: 'Saudi Arabia'
        };
        this.updateLocationDisplay();
      }
    }
  }

  async reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      
      return {
        city: data.address.city || data.address.town || data.address.village || 'Unknown',
        country: data.address.country || 'Unknown'
      };
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return { city: 'Unknown', country: 'Unknown' };
    }
  }

  async fetchPrayerTimes() {
    if (!this.location) {
      await this.detectLocation();
    }

    const cacheKey = `prayers_${this.location.city}_${new Date().toDateString()}`;
    const cached = Cache.get(cacheKey);
    
    if (cached) {
      this.prayerTimes = cached;
      this.findNextPrayer();
      return;
    }

    try {
      const response = await fetch(
        `/api/prayers?city=${encodeURIComponent(this.location.city)}&country=${encodeURIComponent(this.location.country)}`
      );

      if (!response.ok) throw new Error('Failed to fetch prayer times');

      const result = await response.json();
      
      if (result.success) {
        this.prayerTimes = result.data.timings;
        Cache.set(cacheKey, this.prayerTimes, 86400000);
        this.findNextPrayer();
      }

    } catch (error) {
      console.error('Prayer times fetch error:', error);
      this.useFallbackTimes();
    }
  }

  findNextPrayer() {
    if (!this.prayerTimes) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'Fajr', time: this.prayerTimes.Fajr },
      { name: 'Dhuhr', time: this.prayerTimes.Dhuhr },
      { name: 'Asr', time: this.prayerTimes.Asr },
      { name: 'Maghrib', time: this.prayerTimes.Maghrib },
      { name: 'Isha', time: this.prayerTimes.Isha }
    ];

    const prayerMinutes = prayers.map(p => {
      const [hours, minutes] = p.time.split(':').map(Number);
      return { ...p, minutes: hours * 60 + minutes };
    });

    let next = prayerMinutes.find(p => p.minutes > currentTime);
    
    if (!next) {
      next = prayerMinutes[0];
      next.tomorrow = true;
    }

    this.nextPrayer = next;
    this.updatePrayerDisplay();
  }

  updatePrayerDisplay() {
    if (!this.nextPrayer) return;

    const nameEl = document.getElementById('nextPrayerName');
    const timeEl = document.getElementById('nextPrayerTime');

    if (nameEl) nameEl.textContent = i18n.t(this.nextPrayer.name.toLowerCase());
    if (timeEl) timeEl.textContent = this.nextPrayer.time;
  }

  updateLocationDisplay() {
    const locationEl = document.getElementById('userLocation');
    if (locationEl && this.location) {
      locationEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span>${this.location.city}, ${this.location.country}</span>
      `;
    }
  }

  startTimer() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    this.updateCountdown();

    this.updateInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    if (!this.nextPrayer) return;

    const now = new Date();
    let targetTime = new Date();
    const [hours, minutes] = this.nextPrayer.time.split(':').map(Number);
    
    targetTime.setHours(hours, minutes, 0, 0);

    if (this.nextPrayer.tomorrow || targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    const diff = targetTime - now;

    if (diff <= 0) {
      this.findNextPrayer();
      return;
    }

    const hours_remaining = Math.floor(diff / (1000 * 60 * 60));
    const minutes_remaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds_remaining = Math.floor((diff % (1000 * 60)) / 1000);

    const countdownEl = document.getElementById('prayerCountdown');
    if (countdownEl) {
      countdownEl.textContent = `${hours_remaining}h ${minutes_remaining}m ${seconds_remaining}s`;
    }

    this.updateProgressRing(diff);
  }

  updateProgressRing(timeRemaining) {
    if (!this.progressCircle || !this.progressText) return;

    const totalTime = 24 * 60 * 60 * 1000;
    const elapsed = totalTime - timeRemaining;
    const percentage = (elapsed / totalTime) * 100;

    const offset = this.circleCircumference - (percentage / 100) * this.circleCircumference;

    requestAnimationFrame(() => {
      this.progressCircle.style.strokeDashoffset = offset;
      this.progressText.textContent = `${Math.round(100 - percentage)}%`;
    });
  }

  async updateHijriDate() {
    try {
      const response = await fetch('/api/prayers?city=Mecca&country=Saudi%20Arabia');
      const result = await response.json();
      
      if (result.success && result.data.date.hijri) {
        const hijri = result.data.date.hijri;
        const dateEl = document.getElementById('hijriDate');
        if (dateEl) {
          dateEl.textContent = `${hijri.day} ${hijri.month.en} ${hijri.year}`;
        }
      }
    } catch (error) {
      console.error('Hijri date fetch error:', error);
    }
  }

  useFallbackTimes() {
    this.prayerTimes = {
      Fajr: '05:00',
      Dhuhr: '12:30',
      Asr: '15:45',
      Maghrib: '18:15',
      Isha: '19:45'
    };
    this.findNextPrayer();
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  async restart(newLocation) {
    this.location = newLocation;
    Storage.set('location', newLocation);
    this.stop();
    await this.fetchPrayerTimes();
    this.startTimer();
  }
}

export const prayerTimer = new PrayerTimer();
EOF

echo "✅ Created src/js/prayer-timer.js"
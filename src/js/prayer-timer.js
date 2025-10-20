/**
 * Prayer Timer Module
 * Handles prayer times, countdown, and progress ring animation
 */

import StorageManager from './storage.js';
import I18n from './il8n.js';

const PrayerTimer = {
  prayers: ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
  prayerNames: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
  currentPrayerIndex: 0,
  prayerTimes: null,
  countdownInterval: null,
  userLocation: null,
  notificationShown: {},

  async init() {
    await this.loadUserLocation();
    await this.fetchPrayerTimes();
    this.startCountdown();
    this.updateHijriDate();
    this.scheduleDailyUpdate();
  },

  scheduleDailyUpdate() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 1, 0);
    const timeUntilMidnight = tomorrow - now;

    setTimeout(() => {
      this.fetchPrayerTimes();
      setInterval(() => this.fetchPrayerTimes(), 86400000);
    }, timeUntilMidnight);
  },

  async loadUserLocation() {
    const prefs = StorageManager.getPreferences();
    
    if (prefs.location) {
      this.userLocation = prefs.location;
      return;
    }

    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            maximumAge: 300000
          });
        });

        this.userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          method: 'geolocation'
        };

        await this.reverseGeocode(this.userLocation.latitude, this.userLocation.longitude);
        StorageManager.setPreferences({ location: this.userLocation });
      } catch (error) {
        console.warn('Geolocation error:', error);
        this.useDefaultLocation();
      }
    } else {
      this.useDefaultLocation();
    }
  },

  async reverseGeocode(lat, lon) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        {
          headers: {
            'User-Agent': 'NeekiHub/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Geocoding failed');
      
      const data = await response.json();
      
      if (data.address) {
        this.userLocation.city = data.address.city || data.address.town || data.address.village || 'Unknown';
        this.userLocation.country = data.address.country || 'Unknown';
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
      this.userLocation.city = 'Unknown';
      this.userLocation.country = 'Unknown';
    }
  },

  useDefaultLocation() {
    this.userLocation = {
      city: 'Makkah',
      country: 'Saudi Arabia',
      latitude: 21.4225,
      longitude: 39.8262,
      method: 'default'
    };
  },

  async fetchPrayerTimes() {
    const locationText = document.getElementById('userLocation');
    if (locationText) {
      locationText.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span>${I18n.t('detecting_location')}</span>
      `;
    }

    try {
      const cacheKey = `prayer_times_${this.userLocation.latitude}_${this.userLocation.longitude}_${new Date().toDateString()}`;
      const cached = await StorageManager.getCache(cacheKey);
      
      if (cached) {
        this.prayerTimes = cached;
        this.updateUI();
        return;
      }

      const url = this.userLocation.city && this.userLocation.city !== 'Unknown'
        ? `/api/prayers?city=${encodeURIComponent(this.userLocation.city)}&country=${encodeURIComponent(this.userLocation.country)}`
        : `/api/prayers?latitude=${this.userLocation.latitude}&longitude=${this.userLocation.longitude}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        this.prayerTimes = result.data;
        
        const now = new Date();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        const ttl = endOfDay - now;
        
        await StorageManager.setCache(cacheKey, this.prayerTimes, ttl);
        
        this.updateUI();
      } else {
        throw new Error(result.error || 'Failed to fetch prayer times');
      }
    } catch (error) {
      console.error('Prayer times fetch error:', error);
      this.showError('Failed to load prayer times. Using cached data if available.');
    }
  },

  updateUI() {
    if (!this.prayerTimes) return;

    const locationText = document.getElementById('userLocation');
    if (locationText) {
      const cityName = this.userLocation.city || 'Unknown';
      const countryName = this.userLocation.country || '';
      
      locationText.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span>${cityName}${countryName ? ', ' + countryName : ''}</span>
      `;
    }

    this.findNextPrayer();
  },

  findNextPrayer() {
    if (!this.prayerTimes) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    let nextPrayer = null;
    let nextPrayerTime = null;

    for (let i = 0; i < this.prayerNames.length; i++) {
      const prayerName = this.prayerNames[i];
      const prayerTimeStr = this.prayerTimes.timings[prayerName];
      
      if (!prayerTimeStr) continue;

      const [hours, minutes] = this.parseTime(prayerTimeStr);
      const prayerMinutes = hours * 60 + minutes;

      if (prayerMinutes > currentTime) {
        nextPrayer = prayerName;
        nextPrayerTime = prayerTimeStr;
        this.currentPrayerIndex = i;
        break;
      }
    }

    if (!nextPrayer) {
      nextPrayer = 'Fajr';
      nextPrayerTime = this.prayerTimes.timings.Fajr;
      this.currentPrayerIndex = 0;
    }

    this.displayNextPrayer(nextPrayer, nextPrayerTime);
  },

  parseTime(timeStr) {
    const cleanTime = timeStr.split('(')[0].trim();
    const parts = cleanTime.split(':');
    return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
  },

  displayNextPrayer(prayerName, prayerTime) {
    const nameElement = document.getElementById('nextPrayerName');
    const timeElement = document.getElementById('nextPrayerTime');

    if (nameElement) nameElement.textContent = prayerName;
    if (timeElement) timeElement.textContent = this.formatTime(prayerTime);
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    
    const [hours, minutes] = this.parseTime(timeStr);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return date.toLocaleTimeString(I18n.getCurrentLanguage(), { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  },

  startCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.updateCountdown();
    
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  },

  updateCountdown() {
    if (!this.prayerTimes) return;

    const prayerName = this.prayerNames[this.currentPrayerIndex];
    const prayerTimeStr = this.prayerTimes.timings[prayerName];
    
    if (!prayerTimeStr) return;

    const now = new Date();
    const [hours, minutes] = this.parseTime(prayerTimeStr);
    const prayerTime = new Date();
    prayerTime.setHours(hours, minutes, 0, 0);

    if (prayerTime < now) {
      prayerTime.setDate(prayerTime.getDate() + 1);
    }

    const diff = prayerTime - now;
    
    if (diff <= 0) {
      this.findNextPrayer();
      this.showPrayerNotification(prayerName);
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const hours_remaining = Math.floor(totalSeconds / 3600);
    const minutes_remaining = Math.floor((totalSeconds % 3600) / 60);
    const seconds_remaining = totalSeconds % 60;

    const countdownElement = document.getElementById('prayerCountdown');
    if (countdownElement) {
      const formatted = `${hours_remaining}h ${minutes_remaining}m ${seconds_remaining}s`;
      countdownElement.textContent = formatted;
    }

    this.updateProgressRing(diff, prayerName);
  },

  updateProgressRing(remainingTime, prayerName) {
    const prayerIndex = this.prayerNames.indexOf(prayerName);
    const prevPrayerIndex = prayerIndex === 0 ? this.prayerNames.length - 1 : prayerIndex - 1;
    const prevPrayerName = this.prayerNames[prevPrayerIndex];
    
    const currentPrayerTime = this.getTimeInMinutes(this.prayerTimes.timings[prayerName]);
    let prevPrayerTime = this.getTimeInMinutes(this.prayerTimes.timings[prevPrayerName]);
    
    let totalInterval = currentPrayerTime - prevPrayerTime;
    if (totalInterval < 0) totalInterval += 1440;

    const remainingMinutes = Math.floor(remainingTime / 60000);
    const elapsed = totalInterval - remainingMinutes;
    const percentage = Math.max(0, Math.min(100, (elapsed / totalInterval) * 100));

    const circle = document.getElementById('progressCircle');
    const progressText = document.getElementById('progressText');
    
    if (circle) {
      const circumference = 2 * Math.PI * 90;
      const offset = circumference - (percentage / 100) * circumference;
      circle.style.strokeDasharray = circumference;
      circle.style.strokeDashoffset = offset;
    }

    if (progressText) {
      progressText.textContent = Math.round(percentage) + '%';
    }
  },

  getTimeInMinutes(timeStr) {
    const [hours, minutes] = this.parseTime(timeStr);
    return hours * 60 + minutes;
  },

  showPrayerNotification(prayerName) {
    const today = new Date().toDateString();
    const notificationKey = `${today}_${prayerName}`;
    
    if (this.notificationShown[notificationKey]) return;
    this.notificationShown[notificationKey] = true;

    const prefs = StorageManager.getPreferences();
    
    if (prefs.notifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(I18n.t('prayer_notification'), {
        body: `Time for ${prayerName} prayer`,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        tag: `prayer-${prayerName}`,
        vibrate: [200, 100, 200],
        requireInteraction: true
      });
    }

    this.showToast(`${I18n.t('prayer_notification')}: ${prayerName}`, 'info');
  },

  updateHijriDate() {
    if (!this.prayerTimes?.date?.hijri) return;

    const hijriElement = document.getElementById('hijriDate');
    if (hijriElement) {
      const hijri = this.prayerTimes.date.hijri;
      const hijriDate = `${hijri.day} ${hijri.month.en} ${hijri.year} AH`;
      const gregorian = new Date().toLocaleDateString(I18n.getCurrentLanguage(), { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      hijriElement.textContent = `${gregorian} • ${hijriDate}`;
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  },

  showError(message) {
    this.showToast(message, 'error');
  },

  destroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }
};

export default PrayerTimer;
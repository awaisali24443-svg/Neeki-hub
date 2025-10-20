/**
 * Qibla Finder Module
 * Compass functionality with device orientation and iOS support
 */

import StorageManager from './storage.js';
import I18n from './i18n.js';

const QiblaFinder = {
  qiblaDirection: null,
  distance: null,
  userLocation: null,
  compassHeading: 0,
  compassSupported: false,
  isIOS: false,

  async init() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    this.renderUI();
    await this.getUserLocation();
    await this.checkCompassSupport();
  },

  renderUI() {
    const container = document.getElementById('qiblaContent');
    if (!container) return;

    container.innerHTML = `
      <div class="qibla-compass">
        <div class="compass-container">
          <div class="compass-rose" id="compassRose">
            <div class="compass-direction n">N</div>
            <div class="compass-direction e">E</div>
            <div class="compass-direction s">S</div>
            <div class="compass-direction w">W</div>
          </div>
          <div class="qibla-needle" id="qiblaNeedle">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="needleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#f5d76e;stop-opacity:1" />
                  <stop offset="50%" style="stop-color:#d4af37;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#b8860b;stop-opacity:1" />
                </linearGradient>
              </defs>
              <polygon points="50,10 55,50 50,90 45,50" fill="url(#needleGrad)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
              <circle cx="50" cy="50" r="5" fill="#d4af37"/>
            </svg>
          </div>
          <div class="compass-center"></div>
        </div>
        
        <div class="qibla-info">
          <div class="info-item">
            <span class="label">${I18n.t('direction_to_kaaba')}:</span>
            <span class="value gold-text" id="qiblaAngle">--°</span>
          </div>
          <div class="info-item">
            <span class="label">${I18n.t('distance_km')}:</span>
            <span class="value gold-text" id="qiblaDistance">-- km</span>
          </div>
        </div>

        <div class="qibla-status" id="qiblaStatus">
          ${I18n.t('detecting_location')}
        </div>

        <div class="qibla-controls">
          <button class="btn-primary" id="recalculateQibla">
            Recalculate
          </button>
          <button class="btn-text" id="manualLocation">
            Enter Manual Coordinates
          </button>
          ${this.isIOS ? '<button class="btn-text" id="requestIOSPermission">Enable Compass (iOS)</button>' : ''}
        </div>
      </div>

      <style>
        .qibla-compass {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 1rem;
        }

        .compass-container {
          position: relative;
          width: min(300px, 90vw);
          height: min(300px, 90vw);
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,175,55,0.1) 0%, rgba(5,4,6,0.5) 100%);
          border: 3px solid rgba(212,175,55,0.3);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(212,175,55,0.1);
        }

        .compass-rose {
          position: absolute;
          inset: 0;
          transition: transform 0.3s ease-out;
          will-change: transform;
        }

        .compass-direction {
          position: absolute;
          font-weight: 700;
          color: var(--gold-primary);
          font-size: 1.2rem;
        }

        .compass-direction.n { top: 10px; left: 50%; transform: translateX(-50%); }
        .compass-direction.e { right: 10px; top: 50%; transform: translateY(-50%); }
        .compass-direction.s { bottom: 10px; left: 50%; transform: translateX(-50%); }
        .compass-direction.w { left: 10px; top: 50%; transform: translateY(-50%); }

        .qibla-needle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: transform;
          pointer-events: none;
        }

        .compass-center {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          background: var(--gold-gradient);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 10px rgba(212,175,55,0.8);
        }

        .qibla-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          width: 100%;
          max-width: 500px;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 0.5rem;
        }

        .info-item .label {
          font-size: 0.9rem;
          color: var(--color-text-secondary);
        }

        .info-item .value {
          font-size: 1.5rem;
        }

        .qibla-status {
          text-align: center;
          padding: 1rem;
          background: rgba(212,175,55,0.1);
          border-radius: 0.5rem;
          border: 1px solid rgba(212,175,55,0.3);
          width: 100%;
          max-width: 500px;
        }

        .qibla-controls {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          max-width: 300px;
        }
      </style>
    `;

    this.attachEventListeners();
  },

  attachEventListeners() {
    const recalcBtn = document.getElementById('recalculateQibla');
    const manualBtn = document.getElementById('manualLocation');
    const iosBtn = document.getElementById('requestIOSPermission');

    recalcBtn?.addEventListener('click', () => this.getUserLocation());
    manualBtn?.addEventListener('click', () => this.showManualInput());
    iosBtn?.addEventListener('click', () => this.requestIOSPermission());
  },

  async getUserLocation() {
    this.updateStatus(I18n.t('detecting_location'));

    const prefs = StorageManager.getPreferences();
    if (prefs.location?.latitude && prefs.location?.longitude) {
      this.userLocation = prefs.location;
      await this.calculateQibla();
      return;
    }

    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });

        this.userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        StorageManager.setPreferences({ location: this.userLocation });

        await this.calculateQibla();
      } catch (error) {
        console.error('Geolocation error:', error);
        this.updateStatus(I18n.t('location_denied') + '. Please enter manually or allow location access.');
        this.showManualInput();
      }
    } else {
      this.updateStatus('Geolocation not supported');
      this.showManualInput();
    }
  },

  async calculateQibla() {
    if (!this.userLocation) return;

    this.updateStatus('Calculating Qibla direction...');

    try {
      const response = await fetch('/api/qibla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.userLocation)
      });

      const result = await response.json();

      if (result.success) {
        this.qiblaDirection = result.data.qiblaDirection;
        this.distance = result.data.distanceToKaaba;

        this.updateUI();
        this.updateStatus('Qibla direction calculated successfully');
      } else {
        throw new Error(result.error || 'Calculation failed');
      }
    } catch (error) {
      console.error('Qibla calculation error:', error);
      this.updateStatus('Error: ' + error.message);
    }
  },

  updateUI() {
    const angleElement = document.getElementById('qiblaAngle');
    const distanceElement = document.getElementById('qiblaDistance');

    if (angleElement) {
      angleElement.textContent = Math.round(this.qiblaDirection) + '°';
    }

    if (distanceElement) {
      distanceElement.textContent = I18n.formatNumber(Math.round(this.distance)) + ' km';
    }

    this.updateNeedle();
  },

  async checkCompassSupport() {
    if (!('DeviceOrientationEvent' in window)) {
      console.warn('Device orientation not supported');
      this.updateStatus('Compass not supported on this device');
      return;
    }

    if (this.isIOS && typeof DeviceOrientationEvent.requestPermission === 'function') {
      this.compassSupported = true;
      this.updateStatus('Tap "Enable Compass (iOS)" button to activate compass');
      return;
    }

    this.compassSupported = true;
    this.startCompass();
  },

  async requestIOSPermission() {
    if (!this.isIOS || typeof DeviceOrientationEvent.requestPermission !== 'function') {
      return;
    }

    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      
      if (permission === 'granted') {
        this.startCompass();
        this.updateStatus('Compass activated');
        
        const iosBtn = document.getElementById('requestIOSPermission');
        if (iosBtn) iosBtn.style.display = 'none';
      } else {
        this.updateStatus('Compass permission denied');
      }
    } catch (error) {
      console.error('Permission request error:', error);
      this.updateStatus('Error requesting compass permission');
    }
  },

  startCompass() {
    if (window.DeviceOrientationEvent) {
      if ('ondeviceorientationabsolute' in window) {
        window.addEventListener('deviceorientationabsolute', (e) => this.handleOrientation(e), true);
      } else {
        window.addEventListener('deviceorientation', (e) => this.handleOrientation(e), true);
      }
      
      this.updateStatus('Compass active - Point device north to calibrate');
    }
  },

  handleOrientation(event) {
    if (!event || event.alpha === null) return;

    let heading = null;

    if (event.webkitCompassHeading !== undefined) {
      heading = event.webkitCompassHeading;
    } else if (event.absolute && event.alpha !== null) {
      heading = 360 - event.alpha;
    } else if (event.alpha !== null) {
      heading = 360 - event.alpha;
    }

    if (heading !== null) {
      this.compassHeading = heading;
      this.updateNeedle();
      this.rotateCompassRose(heading);
    }
  },

  updateNeedle() {
    if (this.qiblaDirection === null) return;

    const needle = document.getElementById('qiblaNeedle');
    if (!needle) return;

    const rotation = this.qiblaDirection - this.compassHeading;
    needle.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
  },

  rotateCompassRose(heading) {
    const rose = document.getElementById('compassRose');
    if (!rose) return;

    rose.style.transform = `rotate(${-heading}deg)`;
  },

  updateStatus(message) {
    const statusElement = document.getElementById('qiblaStatus');
    if (statusElement) {
      statusElement.textContent = message;
    }
  },

  showManualInput() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content glass-card">
        <div class="modal-header">
          <h3 class="gold-text">Enter Your Location</h3>
          <button class="icon-btn close-modal" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="padding: 1.5rem;">
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div>
              <label for="manualLat" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Latitude:</label>
              <input type="number" id="manualLat" step="0.000001" placeholder="e.g., 24.8607" 
                style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 0.5rem; color: var(--color-text); font-size: 1rem;">
              <small style="color: var(--color-text-secondary); font-size: 0.85rem;">Range: -90 to 90</small>
            </div>
            <div>
              <label for="manualLon" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Longitude:</label>
              <input type="number" id="manualLon" step="0.000001" placeholder="e.g., 67.0011"
                style="width: 100%; padding: 0.75rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 0.5rem; color: var(--color-text); font-size: 1rem;">
              <small style="color: var(--color-text-secondary); font-size: 0.85rem;">Range: -180 to 180</small>
            </div>
            <button class="btn-primary" id="calculateManual" style="margin-top: 1rem;">Calculate Qibla</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();

    modal.querySelector('.close-modal')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    document.getElementById('calculateManual')?.addEventListener('click', () => {
      const lat = parseFloat(document.getElementById('manualLat').value);
      const lon = parseFloat(document.getElementById('manualLon').value);

      if (isNaN(lat) || isNaN(lon)) {
        alert('Please enter valid coordinates');
        return;
      }

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        alert('Coordinates out of range\nLatitude: -90 to 90\nLongitude: -180 to 180');
        return;
      }

      this.userLocation = { latitude: lat, longitude: lon };
      StorageManager.setPreferences({ location: this.userLocation });
      this.calculateQibla();
      closeModal();
    });
  }
};

export default QiblaFinder;
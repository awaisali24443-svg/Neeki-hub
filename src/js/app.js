/**
 * Main Application Entry Point
 * Coordinates all modules and handles navigation
 */

import StorageManager from './storage.js';
import I18n from './il8n.js';
import PrayerTimer from './prayer-timer.js';
import QiblaFinder from './qibla.js';
import AIChat from './ai-chat.js';
import QuranModule from './quran.js';

const App = {
  currentSection: 'dashboard',
  modules: {},
  dailyContentType: 'verse',

  async init() {
    console.log('🚀 Initializing Neeki Hub...');

    await StorageManager.initDB();
    I18n.init();

    this.modules.prayerTimer = PrayerTimer;
    this.modules.aiChat = AIChat;

    this.setupNavigation();
    this.setupParallax();
    this.setupDailyContent();
    this.setupQuickActions();

    await PrayerTimer.init();
    AIChat.init();

    this.handleDeepLink();
    this.setupConnectivityHandlers();

    console.log('✅ Neeki Hub initialized successfully');
  },

  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        if (section) {
          this.navigateTo(section);
        }
      });
    });
  },

  setupQuickActions() {
    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleQuickAction(action);
      });
    });
  },

  async navigateTo(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
      section.classList.remove('active');
      section.style.display = 'none';
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const targetSection = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetSection) {
      targetSection.classList.add('active');
      targetSection.style.display = 'block';
    }

    const navBtn = document.querySelector(`.nav-btn[data-section="${sectionName}"]`);
    if (navBtn) {
      navBtn.classList.add('active');
    }

    await this.initializeSection(sectionName);

    this.currentSection = sectionName;

    if (window.history && window.history.pushState) {
      window.history.pushState({ section: sectionName }, '', `?section=${sectionName}`);
    }
  },

  async initializeSection(sectionName) {
    switch (sectionName) {
      case 'quran':
        if (!this.modules.quran) {
          this.modules.quran = QuranModule;
          await QuranModule.init();
        }
        break;
      
      case 'qibla':
        if (!this.modules.qibla) {
          this.modules.qibla = QiblaFinder;
          await QiblaFinder.init();
        }
        break;

      case 'hadith':
        await this.loadHadithSection();
        break;

      case 'dua':
        await this.loadDuaSection();
        break;

      case 'settings':
        this.loadSettingsSection();
        break;
    }
  },

  async loadHadithSection() {
    const container = document.getElementById('hadithContent');
    if (!container || container.dataset.loaded === 'true') return;

    container.innerHTML = '<div class="loading"></div>';

    try {
      const response = await fetch('/api/hadith?random=true');
      const result = await response.json();

      if (result.success) {
        const hadith = result.data.hadith;
        const lang = I18n.getCurrentLanguage();

        const hadithData = {
          arabic: hadith.arabic,
          text: hadith.text[lang] || hadith.text.en,
          reference: result.data.reference
        };

        container.innerHTML = `
          <div class="hadith-display">
            <div class="arabic-text">${hadithData.arabic}</div>
            <div class="translation">${hadithData.text}</div>
            <div class="reference gold-text">${hadithData.reference}</div>
            <div class="hadith-actions" style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <button class="action-btn" id="refreshHadith">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                Get Another
              </button>
              <button class="action-btn" id="bookmarkHadith">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                </svg>
                Bookmark
              </button>
            </div>
          </div>
        `;

        document.getElementById('refreshHadith')?.addEventListener('click', () => {
          container.dataset.loaded = 'false';
          this.loadHadithSection();
        });

        document.getElementById('bookmarkHadith')?.addEventListener('click', async () => {
          await StorageManager.addBookmark({
            type: 'hadith',
            content: result.data,
            note: `Hadith: ${hadithData.reference}`
          });
          this.showToast(I18n.t('bookmark_added'), 'success');
        });

        container.dataset.loaded = 'true';
      }
    } catch (error) {
      console.error('Failed to load hadith:', error);
      container.innerHTML = '<p>Failed to load hadith. Please check your connection and try again.</p>';
    }
  },

  async loadDuaSection() {
    const container = document.getElementById('duaContent');
    if (!container || container.dataset.loaded === 'true') return;

    container.innerHTML = '<div class="loading"></div>';

    try {
      const response = await fetch('/api/duas?random=true');
      const result = await response.json();

      if (result.success) {
        const dua = result.data.dua;
        const lang = I18n.getCurrentLanguage();

        const duaData = {
          arabic: dua.arabic,
          transliteration: dua.transliteration,
          translation: dua.translation[lang] || dua.translation.en,
          reference: result.data.reference,
          category: result.data.category,
          usage: result.data.usage
        };

        container.innerHTML = `
          <div class="dua-display">
            <div class="arabic-text">${duaData.arabic}</div>
            <div class="transliteration" style="font-style: italic; margin: 1rem 0; color: var(--color-text-secondary); font-size: 1.1rem;">
              ${duaData.transliteration}
            </div>
            <div class="translation">${duaData.translation}</div>
            <div class="reference gold-text">${duaData.reference}</div>
            <div class="dua-meta" style="margin-top: 1rem; font-size: 0.9rem; color: var(--color-text-secondary);">
              <strong>Category:</strong> ${duaData.category} | <strong>Usage:</strong> ${duaData.usage}
            </div>
            <div class="dua-actions" style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <button class="action-btn" id="refreshDua">Get Another</button>
              <button class="action-btn" id="bookmarkDua">Bookmark</button>
            </div>
          </div>
        `;

        document.getElementById('refreshDua')?.addEventListener('click', () => {
          container.dataset.loaded = 'false';
          this.loadDuaSection();
        });

        document.getElementById('bookmarkDua')?.addEventListener('click', async () => {
          await StorageManager.addBookmark({
            type: 'dua',
            content: result.data,
            note: `Dua: ${duaData.reference}`
          });
          this.showToast(I18n.t('bookmark_added'), 'success');
        });

        container.dataset.loaded = 'true';
      }
    } catch (error) {
      console.error('Failed to load dua:', error);
      container.innerHTML = '<p>Failed to load dua. Please check your connection and try again.</p>';
    }
  },

  loadSettingsSection() {
    const container = document.getElementById('settingsContent');
    if (!container) return;

    const prefs = StorageManager.getPreferences();

    container.innerHTML = `
      <div class="settings-panel">
        <div class="setting-item">
          <label for="languageSelect">${I18n.t('language')}:</label>
          <select id="languageSelect" class="setting-select">
            <option value="en" ${prefs.language === 'en' ? 'selected' : ''}>English</option>
            <option value="ur" ${prefs.language === 'ur' ? 'selected' : ''}>اردو (Urdu)</option>
            <option value="ps" ${prefs.language === 'ps' ? 'selected' : ''}>پښتو (Pashto)</option>
          </select>
        </div>

        <div class="setting-item">
          <label for="notificationsToggle">Prayer Notifications:</label>
          <label class="switch">
            <input type="checkbox" id="notificationsToggle" ${prefs.notifications ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <button class="btn-primary" id="viewBookmarks">View Bookmarks</button>
        </div>

        <div class="setting-item">
          <button class="btn-primary" id="exportBookmarks">Export Bookmarks</button>
        </div>

        <div class="setting-item">
          <button class="btn-text" id="clearChatHistory">Clear Chat History</button>
        </div>

        <div class="setting-item">
          <button class="btn-text" id="clearAllData" style="color: #f44336;">Clear All Data</button>
        </div>
      </div>

      <style>
        .settings-panel {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          max-width: 600px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 0.5rem;
        }

        .setting-select {
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 0.5rem;
          color: var(--color-text);
          font-size: 1rem;
        }

        .switch {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 24px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(255,255,255,0.2);
          transition: 0.4s;
          border-radius: 24px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background: var(--gold-gradient);
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }
      </style>
    `;

    document.getElementById('languageSelect')?.addEventListener('change', (e) => {
      I18n.setLanguage(e.target.value);
      StorageManager.setPreferences({ language: e.target.value });
      this.showToast('Language changed. Page will reload...', 'info');
      setTimeout(() => location.reload(), 1500);
    });

    document.getElementById('notificationsToggle')?.addEventListener('change', async (e) => {
      if (e.target.checked && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          StorageManager.setPreferences({ notifications: true });
          this.showToast('Notifications enabled', 'success');
        } else {
          e.target.checked = false;
          this.showToast('Notification permission denied', 'error');
        }
      } else {
        StorageManager.setPreferences({ notifications: e.target.checked });
      }
    });

    document.getElementById('viewBookmarks')?.addEventListener('click', () => {
      this.showBookmarks();
    });

    document.getElementById('exportBookmarks')?.addEventListener('click', () => {
      this.exportBookmarks();
    });

    document.getElementById('clearChatHistory')?.addEventListener('click', async () => {
      if (confirm('Clear all chat history? This cannot be undone.')) {
        await StorageManager.clearChatHistory();
        this.showToast('Chat history cleared', 'success');
      }
    });

    document.getElementById('clearAllData')?.addEventListener('click', () => {
      this.clearAllData();
    });
  },

  handleQuickAction(action) {
    switch (action) {
      case 'quran':
        this.navigateTo('quran');
        break;
      case 'tafseer':
        this.navigateTo('quran');
        setTimeout(() => {
          const tafseerBtn = document.getElementById('viewTafseer');
          if (tafseerBtn) tafseerBtn.click();
        }, 500);
        break;
      case 'bookmarks':
        this.showBookmarks();
        break;
      case 'notifications':
        this.toggleNotifications();
        break;
    }
  },

  async showBookmarks() {
    const bookmarks = await StorageManager.getBookmarks();
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content glass-card" style="max-width: 700px; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
        <div class="modal-header">
          <h3 class="gold-text">${I18n.t('bookmarks')} (${bookmarks.length})</h3>
          <button class="icon-btn close-modal" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="flex: 1; overflow-y: auto; padding: 1rem;">
          ${bookmarks.length === 0 ? 
            '<p style="text-align: center; padding: 2rem; color: var(--color-text-secondary);">No bookmarks yet. Start bookmarking verses, duas, and hadiths!</p>' :
            bookmarks.map((bookmark, index) => {
              let displayText = '';
              let arabicText = '';
              
              if (bookmark.content.verse) {
                arabicText = bookmark.content.verse.arabic;
                displayText = bookmark.content.verse.translation?.en || '';
              } else if (bookmark.content.hadith) {
                arabicText = bookmark.content.hadith.arabic;
                displayText = bookmark.content.hadith.text?.en || '';
              } else if (bookmark.content.dua) {
                arabicText = bookmark.content.dua.arabic;
                displayText = bookmark.content.dua.translation?.en || '';
              }

              return `
                <div class="bookmark-item glass-card" style="margin-bottom: 1rem; padding: 1rem;">
                  <div class="arabic-text" style="font-size: 1.2rem; margin-bottom: 0.5rem;">${arabicText}</div>
                  <p style="margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--color-text-secondary);">${displayText.substring(0, 100)}${displayText.length > 100 ? '...' : ''}</p>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 0.85rem; color: var(--color-text-secondary);">${bookmark.note || 'No note'}</span>
                    <button class="btn-text delete-bookmark" data-bookmark-id="${bookmark.id}" style="color: #f44336;">${I18n.t('delete')}</button>
                  </div>
                </div>
              `;
            }).join('')
          }
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.close-modal')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelectorAll('.delete-bookmark').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = parseInt(btn.dataset.bookmarkId);
        if (confirm('Delete this bookmark?')) {
          await StorageManager.deleteBookmark(id);
          modal.remove();
          this.showBookmarks();
          this.showToast(I18n.t('bookmark_removed'), 'success');
        }
      });
    });
  },

  async toggleNotifications() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.showToast('Notifications are already enabled', 'info');
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          new Notification('Neeki Hub', {
            body: 'Notifications enabled successfully!',
            icon: '/assets/icons/icon-192x192.png'
          });
          StorageManager.setPreferences({ notifications: true });
        }
      } else {
        this.showToast('Notifications are blocked. Please enable them in your browser settings.', 'error');
      }
    } else {
      this.showToast('Notifications are not supported in your browser', 'error');
    }
  },

  setupParallax() {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.pageYOffset;
          const horizon = document.getElementById('horizon');
          const stars = document.getElementById('stars');

          if (horizon) {
            horizon.style.transform = `translateY(${scrolled * 0.3}px)`;
          }
          if (stars) {
            stars.style.transform = `translateY(${scrolled * 0.1}px)`;
          }

          ticking = false;
        });

        ticking = true;
      }
    }, { passive: true });
  },

  async setupDailyContent() {
    const loadDaily = async () => {
      try {
        const endpoints = {
          verse: '/api/verse?random=true',
          hadith: '/api/hadith?random=true',
          dua: '/api/duas?random=true'
        };

        const endpoint = endpoints[this.dailyContentType] || endpoints.verse;
        const response = await fetch(endpoint);
        const result = await response.json();

        if (result.success) {
          this.displayDailyContent(result.data);
        }
      } catch (error) {
        console.error('Failed to load daily content:', error);
        const container = document.getElementById('dailyContent');
        if (container) {
          container.innerHTML = `
            <p class="arabic-text" style="font-size: 1.2rem;">Connection error</p>
            <p class="translation">Please check your internet connection</p>
            <p class="reference gold-text">Offline</p>
          `;
        }
      }
    };

    loadDaily();

    document.getElementById('nextDaily')?.addEventListener('click', () => {
      const types = ['verse', 'hadith', 'dua'];
      const currentIndex = types.indexOf(this.dailyContentType);
      this.dailyContentType = types[(currentIndex + 1) % types.length];
      loadDaily();
    });

    document.getElementById('prevDaily')?.addEventListener('click', () => {
      const types = ['verse', 'hadith', 'dua'];
      const currentIndex = types.indexOf(this.dailyContentType);
      this.dailyContentType = types[(currentIndex - 1 + types.length) % types.length];
      loadDaily();
    });

    document.getElementById('bookmarkDaily')?.addEventListener('click', async () => {
      const container = document.getElementById('dailyContent');
      if (!container) return;

      const arabicText = container.querySelector('.arabic-text')?.textContent;
      const translation = container.querySelector('.translation')?.textContent;
      const reference = container.querySelector('.reference')?.textContent;

      if (arabicText && translation && reference) {
        await StorageManager.addBookmark({
          type: 'daily',
          content: { arabic: arabicText, translation, reference },
          note: 'Daily inspiration'
        });

        this.showToast(I18n.t('bookmark_added'), 'success');
      }
    });
  },

  displayDailyContent(data) {
    const container = document.getElementById('dailyContent');
    if (!container) return;

    const lang = I18n.getCurrentLanguage();
    
    let arabic, translation, reference;

    if (data.verse) {
      arabic = data.verse.arabic;
      translation = data.verse.translation[lang] || data.verse.translation.en;
      reference = `${data.surah.name} ${data.verse.number}`;
    } else if (data.hadith) {
      arabic = data.hadith.arabic;
      translation = data.hadith.text[lang] || data.hadith.text.en;
      reference = data.reference;
    } else if (data.dua) {
      arabic = data.dua.arabic;
      translation = data.dua.translation[lang] || data.dua.translation.en;
      reference = data.reference;
    } else {
      arabic = data.arabic || 'Content not available';
      translation = data.translation || '';
      reference = data.reference || '';
    }

    container.innerHTML = `
      <p class="arabic-text">${arabic}</p>
      <p class="translation">${translation}</p>
      <p class="reference gold-text">${reference}</p>
    `;
  },

  handleDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');

    if (section) {
      this.navigateTo(section);
    }
  },

  setupConnectivityHandlers() {
    window.addEventListener('online', () => {
      this.showToast('You are back online', 'success');
    });

    window.addEventListener('offline', () => {
      this.showToast(I18n.t('offline'), 'info');
    });
  },

  async clearAllData() {
    if (confirm('Are you sure you want to clear all data? This will remove all bookmarks, chat history, and settings. This cannot be undone.')) {
      if (confirm('This is your last warning. All your data will be permanently deleted. Continue?')) {
        try {
          StorageManager.clearLocal();
          
          if (StorageManager.db) {
            StorageManager.db.close();
          }
          
          const deleteRequest = indexedDB.deleteDatabase(StorageManager.DB_NAME);
          
          deleteRequest.onsuccess = () => {
            this.showToast('All data cleared. Reloading...', 'success');
            setTimeout(() => location.reload(), 1500);
          };
          
          deleteRequest.onerror = () => {
            this.showToast('Error clearing data', 'error');
          };
        } catch (error) {
          console.error('Clear data error:', error);
          this.showToast('Error clearing data', 'error');
        }
      }
    }
  },

  async exportBookmarks() {
    try {
      const bookmarks = await StorageManager.getBookmarks();
      
      if (bookmarks.length === 0) {
        this.showToast('No bookmarks to export', 'info');
        return;
      }

      const dataStr = JSON.stringify(bookmarks, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `neeki-hub-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      this.showToast('Bookmarks exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      this.showToast('Failed to export bookmarks', 'error');
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
    }, 3000);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

export default App;
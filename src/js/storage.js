/**
 * Storage Manager
 * Handles localStorage and IndexedDB operations with fallbacks
 */

const StorageManager = {
  // IndexedDB configuration
  DB_NAME: 'NeekiHubDB',
  DB_VERSION: 1,
  db: null,

  /**
   * Initialize IndexedDB
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, using localStorage only');
        resolve(null);
        return;
      }

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id', autoIncrement: true });
          bookmarkStore.createIndex('type', 'type', { unique: false });
          bookmarkStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'type' });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('expires', 'expires', { unique: false });
        }

        if (!db.objectStoreNames.contains('chatHistory')) {
          const chatStore = db.createObjectStore('chatHistory', { keyPath: 'id', autoIncrement: true });
          chatStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        console.log('IndexedDB stores created/upgraded');
      };
    });
  },

  /**
   * LocalStorage operations with error handling
   */
  setLocal(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('localStorage setItem error:', error);
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing old data...');
        this.clearOldLocalStorage();
      }
      return false;
    }
  },

  getLocal(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('localStorage getItem error:', error);
      return defaultValue;
    }
  },

  removeLocal(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('localStorage removeItem error:', error);
      return false;
    }
  },

  clearLocal() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('localStorage clear error:', error);
      return false;
    }
  },

  clearOldLocalStorage() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item.expires && Date.now() > item.expires) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      }
    });
  },

  /**
   * IndexedDB operations
   */
  async addToStore(storeName, data) {
    if (!this.db) await this.initDB();
    if (!this.db) return this.setLocal(`${storeName}_fallback`, data);

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  },

  async getFromStore(storeName, key) {
    if (!this.db) await this.initDB();
    if (!this.db) return this.getLocal(`${storeName}_fallback`);

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  },

  async getAllFromStore(storeName) {
    if (!this.db) await this.initDB();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  },

  async updateInStore(storeName, data) {
    if (!this.db) await this.initDB();
    if (!this.db) return this.setLocal(`${storeName}_fallback`, data);

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  },

  async deleteFromStore(storeName, key) {
    if (!this.db) await this.initDB();
    if (!this.db) return this.removeLocal(`${storeName}_fallback`);

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Bookmark operations
   */
  async addBookmark(content) {
    const bookmark = {
      ...content,
      timestamp: Date.now()
    };
    return await this.addToStore('bookmarks', bookmark);
  },

  async getBookmarks() {
    try {
      const bookmarks = await this.getAllFromStore('bookmarks');
      return bookmarks.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Get bookmarks error:', error);
      return [];
    }
  },

  async deleteBookmark(id) {
    return await this.deleteFromStore('bookmarks', id);
  },

  /**
   * Progress tracking
   */
  async saveProgress(type, data) {
    return await this.updateInStore('progress', { type, ...data, lastUpdated: Date.now() });
  },

  async getProgress(type) {
    return await this.getFromStore('progress', type);
  },

  /**
   * Chat history
   */
  async saveChatMessage(message) {
    try {
      const messages = await this.getChatHistory();
      
      if (messages.length >= 50) {
        const oldest = messages[0];
        if (oldest && oldest.id) {
          await this.deleteFromStore('chatHistory', oldest.id);
        }
      }

      return await this.addToStore('chatHistory', {
        ...message,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Save chat message error:', error);
      return null;
    }
  },

  async getChatHistory() {
    try {
      const history = await this.getAllFromStore('chatHistory');
      return history.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Get chat history error:', error);
      return [];
    }
  },

  async clearChatHistory() {
    if (!this.db) await this.initDB();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction(['chatHistory'], 'readwrite');
        const store = transaction.objectStore('chatHistory');
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Cache management
   */
  async setCache(key, value, ttl = 3600000) {
    return await this.updateInStore('cache', {
      key,
      value,
      expires: Date.now() + ttl
    });
  },

  async getCache(key) {
    try {
      const cached = await this.getFromStore('cache', key);
      if (!cached) return null;
      
      if (Date.now() > cached.expires) {
        await this.deleteFromStore('cache', key);
        return null;
      }
      
      return cached.value;
    } catch (error) {
      console.error('Get cache error:', error);
      return null;
    }
  },

  async clearExpiredCache() {
    if (!this.db) await this.initDB();
    if (!this.db) return;

    try {
      const allCache = await this.getAllFromStore('cache');
      const now = Date.now();
      
      for (const item of allCache) {
        if (item.expires && now > item.expires) {
          await this.deleteFromStore('cache', item.key);
        }
      }
    } catch (error) {
      console.error('Clear expired cache error:', error);
    }
  },

  /**
   * User preferences
   */
  getPreferences() {
    return this.getLocal('userPreferences', {
      language: 'en',
      location: null,
      notifications: false,
      theme: 'dark'
    });
  },

  setPreferences(prefs) {
    const current = this.getPreferences();
    return this.setLocal('userPreferences', { ...current, ...prefs });
  }
};

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    StorageManager.initDB();
    StorageManager.clearExpiredCache();
  });
} else {
  StorageManager.initDB();
  StorageManager.clearExpiredCache();
}

export default StorageManager;
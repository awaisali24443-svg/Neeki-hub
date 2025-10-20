/**
 * Quran Learning Module
 * Browse and learn Quran with translations
 */

import StorageManager from './storage.js';
import I18n from './i18n.js';

const QuranModule = {
  currentVerse: null,
  currentIndex: 0,
  verses: [],
  isLoading: false,

  async init() {
    this.isLoading = true;
    await this.loadVerses();
    this.renderUI();
    await this.loadProgress();
    this.isLoading = false;
  },

  async loadVerses() {
    try {
      const cached = await StorageManager.getCache('quran_verses');
      if (cached) {
        this.verses = cached;
        return;
      }

      const response = await fetch('/data/sample-verses.json');
      
      if (!response.ok) {
        throw new Error('Failed to load verses');
      }

      this.verses = await response.json();

      await StorageManager.setCache('quran_verses', this.verses, 604800000);
    } catch (error) {
      console.error('Failed to load verses:', error);
      this.showError('Failed to load Quran verses. Please check your connection.');
      this.verses = [];
    }
  },

  async loadProgress() {
    try {
      const progress = await StorageManager.getProgress('quran');
      if (progress?.currentIndex !== undefined && progress.currentIndex < this.verses.length) {
        this.currentIndex = progress.currentIndex;
      }
    } catch (error) {
      console.warn('Failed to load progress:', error);
    }
    
    this.displayVerse();
  },

  async saveProgress() {
    try {
      await StorageManager.saveProgress('quran', {
        currentIndex: this.currentIndex,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.warn('Failed to save progress:', error);
    }
  },

  renderUI() {
    const container = document.getElementById('quranContent');
    if (!container) return;

    if (this.verses.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <p>Failed to load Quran content. Please refresh the page.</p>
          <button class="btn-primary" onclick="location.reload()">Refresh</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="quran-reader">
        <div class="verse-navigation">
          <button class="nav-btn" id="prevVerse" aria-label="Previous Verse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            Previous
          </button>
          <div class="verse-counter">
            <span id="verseNumber">1</span> / <span id="totalVerses">${this.verses.length}</span>
          </div>
          <button class="nav-btn" id="nextVerse" aria-label="Next Verse">
            Next
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>

        <div class="verse-display">
          <div class="surah-info gold-text" id="surahInfo">Loading...</div>
          <div class="arabic-text" id="arabicText" style="font-size: 2rem; line-height: 2.5; margin: 2rem 0;">Loading...</div>
          <div class="translation" id="translationText" style="font-size: 1.15rem; line-height: 1.8;">Loading...</div>
        </div>

        <div class="verse-actions">
          <button class="action-btn" id="bookmarkVerse">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
            Bookmark
          </button>
          <button class="action-btn" id="viewTafseer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            View Tafseer
          </button>
          <button class="action-btn" id="shareVerse">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
            </svg>
            Share
          </button>
        </div>

        <div class="tafseer-links" id="tafseerLinks" style="margin-top: 2rem;"></div>
      </div>

      <style>
        .quran-reader {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .verse-navigation {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 0.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .verse-counter {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--gold-primary);
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--gold-gradient);
          color: var(--color-bg);
          border: none;
          border-radius: 0.5rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .nav-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(212,175,55,0.4);
        }

        .nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .verse-display {
          text-align: center;
          padding: 2rem 1rem;
        }

        .surah-info {
          font-size: 1.2rem;
          margin-bottom: 2rem;
        }

        .verse-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 0.5rem;
          color: var(--color-text);
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(212,175,55,0.2);
          border-color: var(--gold-primary);
          color: var(--gold-primary);
        }

        .tafseer-links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .tafseer-link {
          display: block;
          padding: 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 0.5rem;
          color: var(--gold-primary);
          text-decoration: none;
          transition: all 0.2s;
        }

        .tafseer-link:hover {
          background: rgba(212,175,55,0.1);
          border-color: var(--gold-primary);
          transform: translateX(4px);
        }

        @media (max-width: 640px) {
          .verse-navigation {
            flex-direction: column;
          }
          
          .nav-btn {
            width: 100%;
            justify-content: center;
          }
        }
      </style>
    `;

    this.attachEventListeners();
  },

  attachEventListeners() {
    document.getElementById('prevVerse')?.addEventListener('click', () => this.previousVerse());
    document.getElementById('nextVerse')?.addEventListener('click', () => this.nextVerse());
    document.getElementById('bookmarkVerse')?.addEventListener('click', () => this.bookmarkVerse());
    document.getElementById('viewTafseer')?.addEventListener('click', () => this.scrollToTafseer());
    document.getElementById('shareVerse')?.addEventListener('click', () => this.shareVerse());

    document.addEventListener('keydown', (e) => {
      if (this.isActive()) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          this.previousVerse();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          this.nextVerse();
        } else if (e.key === 'b' || e.key === 'B') {
          this.bookmarkVerse();
        }
      }
    });
  },

  isActive() {
    const section = document.querySelector('[data-section="quran"]');
    return section && section.classList.contains('active');
  },

  displayVerse() {
    if (!this.verses.length) return;

    this.currentVerse = this.verses[this.currentIndex];

    const verseNumber = document.getElementById('verseNumber');
    const totalVerses = document.getElementById('totalVerses');
    const surahInfo = document.getElementById('surahInfo');
    const arabicText = document.getElementById('arabicText');
    const translationText = document.getElementById('translationText');

    if (verseNumber) verseNumber.textContent = this.currentIndex + 1;
    if (totalVerses) totalVerses.textContent = this.verses.length;

    if (surahInfo) {
      surahInfo.textContent = `${this.currentVerse.surah.name} (${this.currentVerse.surah.nameArabic}) - Verse ${this.currentVerse.verse.number}`;
    }

    if (arabicText) {
      arabicText.textContent = this.currentVerse.verse.arabic;
    }

    const lang = I18n.getCurrentLanguage();
    const translation = this.currentVerse.verse.translation[lang] || 
                       this.currentVerse.verse.translation.en ||
                       'Translation not available';
    
    if (translationText) {
      translationText.textContent = translation;
    }

    this.displayTafseerLinks();

    const prevBtn = document.getElementById('prevVerse');
    const nextBtn = document.getElementById('nextVerse');
    
    if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
    if (nextBtn) nextBtn.disabled = this.currentIndex === this.verses.length - 1;

    this.saveProgress();
  },

  displayTafseerLinks() {
    const container = document.getElementById('tafseerLinks');
    if (!container) return;

    if (!this.currentVerse.tafseer || this.currentVerse.tafseer.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = '<h4 class="gold-text" style="margin-bottom: 1rem;">Tafseer Resources:</h4>';

    this.currentVerse.tafseer.forEach(tafseer => {
      const link = document.createElement('a');
      link.className = 'tafseer-link';
      link.href = tafseer.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.innerHTML = `
        <strong>${tafseer.name}</strong>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-left: 0.5rem;">
          <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/>
        </svg>
      `;
      container.appendChild(link);
    });
  },

  previousVerse() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.displayVerse();
    }
  },

  nextVerse() {
    if (this.currentIndex < this.verses.length - 1) {
      this.currentIndex++;
      this.displayVerse();
    }
  },

  async bookmarkVerse() {
    try {
      await StorageManager.addBookmark({
        type: 'verse',
        content: this.currentVerse,
        note: `Surah ${this.currentVerse.surah.name}, Verse ${this.currentVerse.verse.number}`
      });

      this.showToast(I18n.t('bookmark_added'), 'success');
      
      const btn = document.getElementById('bookmarkVerse');
      if (btn) {
        btn.style.background = 'rgba(76, 175, 80, 0.3)';
        btn.style.borderColor = '#4caf50';
        setTimeout(() => {
          btn.style.background = '';
          btn.style.borderColor = '';
        }, 1000);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
      this.showToast('Failed to bookmark', 'error');
    }
  },

  scrollToTafseer() {
    const tafseerSection = document.getElementById('tafseerLinks');
    if (tafseerSection) {
      tafseerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  async shareVerse() {
    const verse = this.currentVerse;
    const lang = I18n.getCurrentLanguage();
    const translation = verse.verse.translation[lang] || verse.verse.translation.en;
    
    const shareText = `${verse.verse.arabic}\n\n${translation}\n\n— ${verse.surah.name} ${verse.verse.number}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${verse.surah.name} ${verse.verse.number}`,
          text: shareText
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          this.fallbackShare(shareText);
        }
      }
    } else {
      this.fallbackShare(shareText);
    }
  },

  fallbackShare(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Verse copied to clipboard', 'success');
      }).catch(() => {
        this.showToast('Failed to copy', 'error');
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.showToast('Verse copied to clipboard', 'success');
      } catch (error) {
        this.showToast('Failed to copy', 'error');
      }
      document.body.removeChild(textarea);
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
  },

  showError(message) {
    this.showToast(message, 'error');
  }
};

export default QuranModule;
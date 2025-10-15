// =========================================
// QURAN LEARNING - SPIRITUAL EDITION
// =========================================

class QuranLearning {
    constructor() {
        this.currentSurah = 1;
        this.currentVerse = 1;
        this.audioPlayer = new Audio();
        this.init();
    }
    
    init() {
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const surahSelect = document.getElementById('surahSelect');
        if (surahSelect) {
            surahSelect.addEventListener('change', (e) => {
                this.currentSurah = parseInt(e.target.value);
                this.currentVerse = 1;
                this.loadVerse(this.currentSurah, this.currentVerse);
            });
        }
    }
    
    async loadVerse(surahNumber, verseNumber) {
        try {
            const lang = app?.currentLanguage || 'en';
            const response = await fetch(`/api/quran/verse/${surahNumber}/${verseNumber}?lang=${lang}`);
            const data = await response.json();
            
            if (data.success) {
                this.displayVerse(data.data);
                this.currentSurah = surahNumber;
                this.currentVerse = verseNumber;
            }
        } catch (error) {
            console.error('Error loading verse:', error);
        }
    }
    
    displayVerse(data) {
        const { verse, surah } = data;
        const lang = app?.currentLanguage || 'en';
        
        const container = document.getElementById('verseDisplay');
        if (!container) return;
        
        container.innerHTML = `
            <div class="arabic-text">${verse.arabic}</div>
            <div class="translation-text">${verse.translations[lang] || verse.translations.en}</div>
            ${verse.tafseer ? `
                <div class="tafseer-section" style="margin-top: 30px; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 15px;">
                    <h4 style="color: var(--gold); margin-bottom: 15px;">Tafseer</h4>
                    <p style="color: var(--beige); line-height: 1.8;">${verse.tafseer[lang] || verse.tafseer.en}</p>
                </div>
            ` : ''}
            <div class="verse-actions" style="margin-top: 25px; display: flex; gap: 10px; justify-content: center;">
                <button class="spiritual-btn" onclick="window.quranLearning.playAudio()" style="flex: 1;">
                    <i class="fas fa-play"></i>
                    <span>Play Audio</span>
                </button>
                <button class="spiritual-btn" onclick="window.quranLearning.bookmark()" style="flex: 1;">
                    <i class="far fa-bookmark"></i>
                    <span>Bookmark</span>
                </button>
            </div>
        `;
        
        // Update counter
        const counter = document.getElementById('verseCounter');
        if (counter) {
            counter.textContent = `${this.currentVerse}/7`;
        }
        
        // Set audio
        if (verse.audio) {
            this.audioPlayer.src = verse.audio;
        }
    }
    
    playAudio() {
        if (this.audioPlayer.src) {
            if (this.audioPlayer.paused) {
                this.audioPlayer.play();
                app?.showToast('Playing audio...', 'info');
            } else {
                this.audioPlayer.pause();
            }
        }
    }
    
    bookmark() {
        app?.showToast('Verse bookmarked!', 'success');
        // Save to localStorage
        const bookmarks = JSON.parse(localStorage.getItem('neekihub_bookmarks') || '[]');
        bookmarks.push({
            type: 'verse',
            surah: this.currentSurah,
            verse: this.currentVerse,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('neekihub_bookmarks', JSON.stringify(bookmarks));
    }
}

window.quranLearning = new QuranLearning();
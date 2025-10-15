// =========================================
// DUAS MANAGER - SPIRITUAL EDITION
// =========================================

class DuasManager {
    constructor() {
        this.currentCategory = 'all';
        this.duas = [];
        this.audioPlayer = new Audio();
    }
    
    async loadDuas(category = 'all') {
        try {
            const lang = app?.currentLanguage || 'en';
            const response = await fetch(`/api/duas?category=${category}&lang=${lang}`);
            const data = await response.json();
            
            if (data.success) {
                this.duas = data.data;
                this.currentCategory = category;
                this.displayDuas();
                
                // Update active category
                document.querySelectorAll('.category-tag').forEach(tag => {
                    tag.classList.remove('active');
                    if (tag.getAttribute('data-category') === category) {
                        tag.classList.add('active');
                    }
                });
            }
        } catch (error) {
            console.error('Error loading duas:', error);
        }
    }
    
    displayDuas() {
        const container = document.getElementById('duasContainer');
        if (!container) return;
        
        const lang = app?.currentLanguage || 'en';
        
        container.innerHTML = this.duas.map((dua, index) => `
            <div class="dua-item">
                <div class="arabic-text">${dua.arabic}</div>
                <div class="translation-text">${dua.translations[lang] || dua.translations.en}</div>
                <div class="reference-text">${dua.reference}</div>
                <div style="margin-top: 20px; display: flex; gap: 10px;">
                    <button class="spiritual-btn" onclick="window.duasManager.playAudio(${index})" style="flex: 1;">
                        <i class="fas fa-volume-up"></i>
                        <span>Play</span>
                    </button>
                    <button class="spiritual-btn" onclick="window.duasManager.bookmark(${index})" style="flex: 1;">
                        <i class="far fa-bookmark"></i>
                        <span>Save</span>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    playAudio(index) {
        const dua = this.duas[index];
        if (dua && dua.audio) {
            this.audioPlayer.src = dua.audio;
            this.audioPlayer.play().catch(() => {
                app?.showToast('Audio not available', 'error');
            });
        }
    }
    
    bookmark(index) {
        const dua = this.duas[index];
        if (dua) {
            const bookmarks = JSON.parse(localStorage.getItem('neekihub_bookmarks') || '[]');
            bookmarks.push({
                type: 'dua',
                id: dua.id,
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('neekihub_bookmarks', JSON.stringify(bookmarks));
            app?.showToast('Dua bookmarked!', 'success');
        }
    }
}

window.duasManager = new DuasManager();

// Setup category filters
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.category-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            const category = tag.getAttribute('data-category');
            window.duasManager.loadDuas(category);
        });
    });
});

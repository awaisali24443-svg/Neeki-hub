// =========================================
// RANDOM CONTENT MANAGER
// Handles daily rotation of content
// =========================================

class RandomContentManager {
    constructor() {
        this.contentCache = this.loadCache();
        this.lastUpdate = localStorage.getItem('neekihub_last_update');
        
        this.init();
    }
    
    init() {
        // Check if we need to update content (once per day)
        const today = new Date().toDateString();
        
        if (this.lastUpdate !== today) {
            this.updateDailyContent();
            localStorage.setItem('neekihub_last_update', today);
        }
    }
    
    loadCache() {
        const cache = localStorage.getItem('neekihub_content_cache');
        if (cache) {
            return JSON.parse(cache);
        }
        return null;
    }
    
    saveCache(content) {
        localStorage.setItem('neekihub_content_cache', JSON.stringify(content));
    }
    
    async updateDailyContent() {
        console.log('🔄 Updating daily content...');
        
        // Fetch fresh content
        const content = {
            verse: await this.fetchDailyVerse(),
            hadith: await this.fetchDailyHadith(),
            dua: await this.fetchDailyDua(),
            quote: await this.fetchDailyQuote(),
            timestamp: new Date().toISOString()
        };
        
        this.contentCache = content;
        this.saveCache(content);
        
        console.log('✅ Daily content updated');
    }
    
    async fetchDailyVerse() {
        // Use date-based selection for consistent daily verse
        const dayOfYear = this.getDayOfYear();
        const surahNumber = (dayOfYear % 114) + 1;
        
        try {
            const response = await fetch(`/api/quran/surah/${surahNumber}`);
            const data = await response.json();
            
            if (data.success && data.data.verses.length > 0) {
                const verse = data.data.verses[0];
                return {
                    arabic: verse.arabic,
                    translations: verse.translations,
                    reference: `${data.data.surahName} ${verse.verseNumber}`
                };
            }
        } catch (error) {
            console.error('Error fetching daily verse:', error);
        }
        
        return null;
    }
    
    async fetchDailyHadith() {
        const hadiths = [
            {
                arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
                en: 'Actions are judged by intentions.',
                ur: 'اعمال کا دارومدار نیتوں پر ہے۔',
                ps: 'کړنې د نیتونو سره دي.',
                ref: 'Sahih Bukhari 1'
            },
            {
                arabic: 'الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ',
                en: 'A Muslim is one from whose tongue and hands other Muslims are safe.',
                ur: 'مسلمان وہ ہے جس کی زبان اور ہاتھ سے دوسرے مسلمان محفوظ ہوں۔',
                ps: 'مسلمان هغه دی چې نور مسلمانان د هغه له ژبې او لاسونو څخه خوندي وي.',
                ref: 'Sahih Bukhari 10'
            }
        ];
        
        const dayIndex = this.getDayOfYear() % hadiths.length;
        return hadiths[dayIndex];
    }
    
    async fetchDailyDua() {
        try {
            const response = await fetch('/api/duas?category=all');
            const data = await response.json();
            
            if (data.success && data.data.length > 0) {
                const dayIndex = this.getDayOfYear() % data.data.length;
                return data.data[dayIndex];
            }
        } catch (error) {
            console.error('Error fetching daily dua:', error);
        }
        
        return null;
    }
    
    async fetchDailyQuote() {
        const quotes = [
            {
                text: {
                    en: 'The best richness is the richness of the soul.',
                    ur: 'بہترین دولت روح کی دولت ہے۔',
                    ps: 'غوره شتمني د روح شتمني ده.'
                },
                author: 'Prophet Muhammad ﷺ'
            },
            {
                text: {
                    en: 'Patience is the key to relief.',
                    ur: 'صبر فرج کی کنجی ہے۔',
                    ps: 'صبر د آسانتیا کیلی ده.'
                },
                author: 'Islamic Wisdom'
            }
        ];
        
        const dayIndex = this.getDayOfYear() % quotes.length;
        return quotes[dayIndex];
    }
    
    getDayOfYear() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }
    
    getCachedContent() {
        return this.contentCache;
    }
}

// Initialize
window.randomContentManager = new RandomContentManager();
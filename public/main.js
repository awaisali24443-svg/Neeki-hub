// =========================================
// NEEKIHUB - SPIRITUAL EDITION
// Main Application Logic
// =========================================

class NeekihubSpiritual {
    constructor() {
        this.currentLanguage = localStorage.getItem('neekihub_lang') || 'en';
        this.currentSection = 'home';
        this.userProgress = this.loadProgress();
        this.translations = this.loadTranslations();
        
        this.init();
    }
    
    init() {
        console.log('🕌 Neekihub Spiritual Edition Loading...');
        
        // Initialize stars background
        this.createStars();
        
        // Hide loading screen
        setTimeout(() => {
            this.hideLoader();
        }, 2000);
        
        // Setup event listeners
        this.setupNavigation();
        this.setupLanguage();
        this.setupAI();
        
        // Load initial content
        this.loadRandomContent();
        
        // Setup RTL if needed
        if (this.currentLanguage === 'ur' || this.currentLanguage === 'ps') {
            document.body.setAttribute('dir', 'rtl');
        }
        
        // Translate page
        this.translatePage();
        
        console.log('✅ Neekihub Ready');
    }
    
    createStars() {
        const container = document.getElementById('starsContainer');
        if (!container) return;
        
        const starCount = 150;
        
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 3}s`;
            star.style.animationDuration = `${2 + Math.random() * 2}s`;
            container.appendChild(star);
        }
    }
    
    hideLoader() {
        const loader = document.getElementById('spiritualLoader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 500);
        }
    }
    
    setupNavigation() {
        const navIcons = document.querySelectorAll('.nav-icon');
        
        navIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                const section = icon.getAttribute('data-section');
                this.navigateToSection(section);
            });
        });
    }
    
    navigateToSection(section) {
        // Remove active from all nav icons
        document.querySelectorAll('.nav-icon').forEach(icon => {
            icon.classList.remove('active');
        });
        
        // Add active to clicked icon
        const activeIcon = document.querySelector(`[data-section="${section}"]`);
        if (activeIcon) {
            activeIcon.classList.add('active');
        }
        
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = section;
            
            // Load section-specific content
            this.loadSectionContent(section);
        }
    }
    
    loadSectionContent(section) {
        switch(section) {
            case 'dua':
                if (window.duasManager) {
                    window.duasManager.loadDuas('all');
                }
                break;
            case 'quran':
                if (window.quranLearning) {
                    window.quranLearning.loadVerse(1, 1);
                }
                break;
            case 'hadith':
                this.loadHadith();
                break;
            case 'quotes':
                this.loadQuotes();
                break;
        }
    }
    
    setupLanguage() {
        const langIcons = document.querySelectorAll('.lang-icon');
        
        langIcons.forEach(icon => {
            icon.addEventListener('click', () => {
                const lang = icon.getAttribute('data-lang');
                this.changeLanguage(lang);
            });
        });
    }
    
    changeLanguage(lang) {
        this.currentLanguage = lang;
        localStorage.setItem('neekihub_lang', lang);
        
        // Update active language icon
        document.querySelectorAll('.lang-icon').forEach(icon => {
            icon.classList.remove('active');
        });
        
        const activeIcon = document.querySelector(`[data-lang="${lang}"]`);
        if (activeIcon) {
            activeIcon.classList.add('active');
        }
        
        // Update RTL/LTR
        if (lang === 'ur' || lang === 'ps') {
            document.body.setAttribute('dir', 'rtl');
        } else {
            document.body.setAttribute('dir', 'ltr');
        }
        
        // Translate page
        this.translatePage();
        
        // Reload current section content
        this.loadSectionContent(this.currentSection);
        
        // Reload random content
        this.loadRandomContent();
        
        this.showToast('Language updated', 'success');
    }
    
    loadTranslations() {
        return {
            en: {
                'nav.home': 'Home',
                'nav.dua': 'Dua',
                'nav.quran': 'Quran',
                'nav.hadith': 'Hadith',
                'nav.quotes': 'Quotes',
                'nav.qibla': 'Qibla',
                'nav.settings': 'Settings',
                'home.welcome': 'Welcome to Neekihub',
                'home.subtitle': 'Your Spiritual Journey Companion',
                'quick.dua': 'Daily Duas',
                'quick.quran': 'Quran',
                'quick.hadith': 'Hadith',
                'quick.qibla': 'Qibla',
                'common.refresh': 'Refresh',
                'common.next': 'Next',
                'common.previous': 'Previous',
                'dua.title': 'Daily Duas',
                'dua.all': 'All',
                'dua.morning': 'Morning',
                'dua.evening': 'Evening',
                'dua.eating': 'Eating',
                'dua.travel': 'Travel',
                'quran.title': 'Holy Quran',
                'hadith.title': 'Hadith Collection',
                'quotes.title': 'Islamic Wisdom',
                'qibla.title': 'Qibla Finder',
                'qibla.direction': 'Direction',
                'qibla.distance': 'Distance',
                'qibla.find': 'Find Qibla',
                'settings.title': 'Settings',
                'settings.theme': 'Theme',
                'settings.notifications': 'Prayer Notifications',
                'settings.audio': 'Audio Playback',
                'ai.title': 'Ask Neeki AI',
                'ai.greeting': 'As-salamu alaykum! I\'m Neeki AI, your Islamic knowledge assistant.',
                'ai.placeholder': 'Ask your question...'
            },
            ur: {
                'nav.home': 'گھر',
                'nav.dua': 'دعا',
                'nav.quran': 'قرآن',
                'nav.hadith': 'حدیث',
                'nav.quotes': 'اقوال',
                'nav.qibla': 'قبلہ',
                'nav.settings': 'ترتیبات',
                'home.welcome': 'نیکی ہب میں خوش آمدید',
                'home.subtitle': 'آپ کا روحانی سفر کا ساتھی',
                'quick.dua': 'روزانہ کی دعائیں',
                'quick.quran': 'قرآن',
                'quick.hadith': 'حدیث',
                'quick.qibla': 'قبلہ',
                'common.refresh': 'تازہ کریں',
                'common.next': 'اگلا',
                'common.previous': 'پچھلا',
                'dua.title': 'روزانہ کی دعائیں',
                'dua.all': 'تمام',
                'dua.morning': 'صبح',
                'dua.evening': 'شام',
                'dua.eating': 'کھانا',
                'dua.travel': 'سفر',
                'quran.title': 'قرآن مجید',
                'hadith.title': 'احادیث',
                'quotes.title': 'اسلامی حکمت',
                'qibla.title': 'قبلہ تلاش کنندہ',
                'qibla.direction': 'سمت',
                'qibla.distance': 'فاصلہ',
                'qibla.find': 'قبلہ تلاش کریں',
                'settings.title': 'ترتیبات',
                'settings.theme': 'تھیم',
                'settings.notifications': 'نماز کی اطلاعات',
                'settings.audio': 'آڈیو پلے بیک',
                'ai.title': 'نیکی AI سے پوچھیں',
                'ai.greeting': 'السلام علیکم! میں نیکی AI ہوں، آپ کا اسلامی علم کا معاون۔',
                'ai.placeholder': 'اپنا سوال پوچھیں...'
            },
            ps: {
                'nav.home': 'کور',
                'nav.dua': 'دعا',
                'nav.quran': 'قرآن',
                'nav.hadith': 'حدیث',
                'nav.quotes': 'وینا',
                'nav.qibla': 'قبله',
                'nav.settings': 'تنظیمات',
                'home.welcome': 'نیکي هب ته ښه راغلاست',
                'home.subtitle': 'ستاسو روحاني سفر ملګری',
                'quick.dua': 'ورځني دعاګانې',
                'quick.quran': 'قرآن',
                'quick.hadith': 'حدیث',
                'quick.qibla': 'قبله',
                'common.refresh': 'تازه کړئ',
                'common.next': 'بل',
                'common.previous': 'مخکینی',
                'dua.title': 'ورځني دعاګانې',
                'dua.all': 'ټول',
                'dua.morning': 'سهار',
                'dua.evening': 'ماښام',
                'dua.eating': 'خوړل',
                'dua.travel': 'سفر',
                'quran.title': 'قرآن کریم',
                'hadith.title': 'د حدیثونو ټولګه',
                'quotes.title': 'اسلامي حکمت',
                'qibla.title': 'د قبلې موندونکی',
                'qibla.direction': 'لوري',
                'qibla.distance': 'واټن',
                'qibla.find': 'قبله ومومئ',
                'settings.title': 'تنظیمات',
                'settings.theme': 'تیم',
                'settings.notifications': 'د لمانځه خبرتیاوې',
                'settings.audio': 'آډیو غږول',
                'ai.title': 'نیکي AI څخه وپوښتئ',
                'ai.greeting': 'السلام علیکم! زه نیکي AI یم، ستاسو اسلامي پوهې مرستندوی.',
                'ai.placeholder': 'خپله پوښتنه وکړئ...'
            }
        };
    }
    
    translatePage() {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(el => {
            const key = el.getAttribute('data-translate');
            const translation = this.translations[this.currentLanguage]?.[key] || 
                              this.translations.en[key] || key;
            el.textContent = translation;
        });
        
        // Translate placeholders
        const placeholders = document.querySelectorAll('[data-translate-placeholder]');
        placeholders.forEach(el => {
            const key = el.getAttribute('data-translate-placeholder');
            const translation = this.translations[this.currentLanguage]?.[key] || 
                              this.translations.en[key] || key;
            el.placeholder = translation;
        });
    }
    
    async loadRandomContent() {
        const contentTypes = ['verse', 'hadith', 'dua', 'quote'];
        const randomType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
        
        const typeEl = document.getElementById('contentType');
        const arabicEl = document.getElementById('arabicText');
        const translationEl = document.getElementById('translationText');
        const referenceEl = document.getElementById('referenceText');
        
        if (!typeEl || !arabicEl || !translationEl || !referenceEl) return;
        
        // Show loading
        arabicEl.textContent = 'Loading...';
        translationEl.textContent = '';
        referenceEl.textContent = '';
        
        try {
            let content;
            
            switch(randomType) {
                case 'verse':
                    typeEl.textContent = this.currentLanguage === 'ur' ? 'آج کی آیت' : 
                                        this.currentLanguage === 'ps' ? 'د ورځې آیت' : 
                                        'Ayah of the Day';
                    content = await this.fetchRandomVerse();
                    break;
                case 'hadith':
                    typeEl.textContent = this.currentLanguage === 'ur' ? 'آج کی حدیث' : 
                                        this.currentLanguage === 'ps' ? 'د ورځې حدیث' : 
                                        'Hadith of the Day';
                    content = await this.fetchRandomHadith();
                    break;
                case 'dua':
                    typeEl.textContent = this.currentLanguage === 'ur' ? 'آج کی دعا' : 
                                        this.currentLanguage === 'ps' ? 'د ورځې دعا' : 
                                        'Dua of the Day';
                    content = await this.fetchRandomDua();
                    break;
                case 'quote':
                    typeEl.textContent = this.currentLanguage === 'ur' ? 'آج کا قول' : 
                                        this.currentLanguage === 'ps' ? 'د ورځې وینا' : 
                                        'Quote of the Day';
                    content = await this.fetchRandomQuote();
                    break;
            }
            
            if (content) {
                arabicEl.textContent = content.arabic;
                translationEl.textContent = content.translation;
                referenceEl.textContent = content.reference;
            }
        } catch (error) {
            console.error('Error loading random content:', error);
            arabicEl.textContent = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
            translationEl.textContent = 'In the name of Allah, the Most Gracious, the Most Merciful';
            referenceEl.textContent = 'Al-Fatiha 1:1';
        }
    }
    
    async fetchRandomVerse() {
        const response = await fetch(`/api/quran/verse/1/1?lang=${this.currentLanguage}`);
        const data = await response.json();
        
        if (data.success) {
            const verse = data.data.verse;
            return {
                arabic: verse.arabic,
                translation: verse.translations[this.currentLanguage] || verse.translations.en,
                reference: `${data.data.surah.name} ${verse.verseNumber}`
            };
        }
        return null;
    }
    
    async fetchRandomHadith() {
        // Mock hadith - in production, fetch from API
        const hadiths = [
            {
                arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
                en: 'Actions are judged by intentions',
                ur: 'اعمال کا دارومدار نیتوں پر ہے',
                ps: 'کړنې د نیتونو سره دي',
                ref: 'Sahih Bukhari 1'
            },
            {
                arabic: 'الدِّينُ النَّصِيحَةُ',
                en: 'Religion is sincere advice',
                ur: 'دین خیرخواہی کا نام ہے',
                ps: 'دین د خیرخواهۍ نوم دی',
                ref: 'Sahih Muslim 55'
            }
        ];
        
        const random = hadiths[Math.floor(Math.random() * hadiths.length)];
        
        return {
            arabic: random.arabic,
            translation: random[this.currentLanguage] || random.en,
            reference: random.ref
        };
    }
    
    async fetchRandomDua() {
        const response = await fetch(`/api/duas?lang=${this.currentLanguage}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            const random = data.data[Math.floor(Math.random() * data.data.length)];
            return {
                arabic: random.arabic,
                translation: random.translations[this.currentLanguage] || random.translations.en,
                reference: random.reference
            };
        }
        return null;
    }
    
    async fetchRandomQuote() {
        const quotes = [
            {
                arabic: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
                en: 'Do not grieve; indeed Allah is with us',
                ur: 'غم نہ کرو، بیشک اللہ ہمارے ساتھ ہے',
                ps: 'غمجن مه کیږئ، بې شکه الله زموږ سره دی',
                ref: 'Quran 9:40'
            },
            {
                arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا',
                en: 'Indeed, with hardship comes ease',
                ur: 'بیشک مشکل کے ساتھ آسانی ہے',
                ps: 'بې شکه د سختۍ سره اسانتیا ده',
                ref: 'Quran 94:6'
            }
        ];
        
        const random = quotes[Math.floor(Math.random() * quotes.length)];
        
        return {
            arabic: random.arabic,
            translation: random[this.currentLanguage] || random.en,
            reference: random.ref
        };
    }
    
    setupAI() {
        const aiInput = document.getElementById('aiInput');
        if (aiInput) {
            aiInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendAIMessage();
                }
            });
        }
    }
    
    async sendAIMessage() {
        const input = document.getElementById('aiInput');
        const messagesContainer = document.getElementById('aiMessages');
        
        if (!input || !messagesContainer) return;
        
        const question = input.value.trim();
        if (!question) return;
        
        // Add user message
        this.addAIMessage(question, 'user');
        input.value = '';
        
        // Show typing indicator
        const typingId = this.addAIMessage('Typing...', 'bot', true);
        
        try {
            const response = await fetch('/api/ai/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    question, 
                    language: this.currentLanguage 
                })
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            
            if (data.success) {
                this.addAIMessage(data.data.answer, 'bot');
            } else {
                this.addAIMessage('Sorry, I encountered an error.', 'bot');
            }
        } catch (error) {
            console.error('AI Error:', error);
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
            this.addAIMessage('Sorry, I encountered an error.', 'bot');
        }
    }
    
    addAIMessage(text, type, isTyping = false) {
        const messagesContainer = document.getElementById('aiMessages');
        if (!messagesContainer) return;
        
        const messageId = `msg-${Date.now()}`;
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${type}`;
        messageDiv.id = messageId;
        
        messageDiv.innerHTML = `
            <div class="message-bubble">
                <p>${text}</p>
            </div>
        `;
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageId;
    }
    
    async loadHadith() {
        const container = document.getElementById('hadithContainer');
        if (!container) return;
        
        const hadiths = [
            {
                arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ',
                en: 'Actions are judged by intentions, and every person will get what they intended.',
                ur: 'اعمال کا دارومدار نیتوں پر ہے اور ہر شخص کو وہی ملے گا جس کی اس نے نیت کی۔',
                ps: 'کړنې د نیتونو سره دي او هر څوک به هغه شی ترلاسه کړي چې یې نیت کړی وي.',
                ref: 'Sahih Bukhari 1, Sahih Muslim 1907'
            },
            {
                arabic: 'الدِّينُ النَّصِيحَةُ',
                en: 'Religion is sincere advice and goodwill for all.',
                ur: 'دین خیرخواہی کا نام ہے۔',
                ps: 'دین د خیرخواهۍ نوم دی.',
                ref: 'Sahih Muslim 55'
            },
            {
                arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
                en: 'Whoever believes in Allah and the Last Day should speak good or remain silent.',
                ur: 'جو اللہ اور آخرت کے دن پر ایمان رکھتا ہے وہ بھلائی کی بات کرے یا خاموش رہے۔',
                ps: 'څوک چې په الله او په قیامت باندې ایمان لري باید ښه خبرې وکړي یا خاموش پاتې شي.',
                ref: 'Sahih Bukhari 6018, Sahih Muslim 47'
            }
        ];
        
        container.innerHTML = hadiths.map(hadith => `
            <div class="hadith-item">
                <div class="arabic-text">${hadith.arabic}</div>
                <div class="translation-text">${hadith[this.currentLanguage] || hadith.en}</div>
                <div class="reference-text">${hadith.ref}</div>
            </div>
        `).join('');
    }
    
    async loadQuotes() {
        const container = document.getElementById('quotesContainer');
        if (!container) return;
        
        const quotes = [
            {
                text: {
                    en: 'The best of you are those who are best to their families.',
                    ur: 'تم میں سے بہترین وہ ہے جو اپنے گھر والوں کے ساتھ بہترین ہو۔',
                    ps: 'ستاسو څخه غوره هغه دی چې د خپلې کورنۍ سره غوره وي.'
                },
                author: 'Prophet Muhammad ﷺ'
            },
            {
                text: {
                    en: 'Knowledge is better than wealth, for knowledge guards you while you guard wealth.',
                    ur: 'علم دولت سے بہتر ہے، کیونکہ علم تمہاری حفاظت کرتا ہے جبکہ تم دولت کی حفاظت کرتے ہو۔',
                    ps: 'پوهه له شتمنۍ څخه غوره ده، ځکه چې پوهه ستاسو ساتنه کوي په داسې حال کې چې تاسو د شتمنۍ ساتنه کوئ.'
                },
                author: 'Ali ibn Abi Talib (RA)'
            },
            {
                text: {
                    en: 'This world is a prison for the believer and a paradise for the disbeliever.',
                    ur: 'یہ دنیا مومن کے لیے قید خانہ اور کافر کے لیے جنت ہے۔',
                    ps: 'دا نړۍ د مومن لپاره زندان او د کافر لپاره جنت دی.'
                },
                author: 'Prophet Muhammad ﷺ'
            }
        ];
        
        container.innerHTML = quotes.map(quote => `
            <div class="quote-item">
                <div class="quote-text">"${quote.text[this.currentLanguage] || quote.text.en}"</div>
                <div class="author">— ${quote.author}</div>
            </div>
        `).join('');
    }
    
    loadProgress() {
        const saved = localStorage.getItem('neekihub_progress');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            versesRead: 0,
            duasLearned: 0,
            streak: 0,
            lastVisit: new Date().toISOString()
        };
    }
    
    saveProgress() {
        localStorage.setItem('neekihub_progress', JSON.stringify(this.userProgress));
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.4s ease reverse';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
}

// =========================================
// GLOBAL FUNCTIONS
// =========================================

let app;

window.addEventListener('DOMContentLoaded', () => {
    app = new NeekihubSpiritual();
});

function openSection(section) {
    if (app) {
        app.navigateToSection(section);
    }
}

function goToHome() {
    if (app) {
        app.navigateToSection('home');
    }
}

function loadRandomContent() {
    if (app) {
        app.loadRandomContent();
    }
}

function toggleAIChat() {
    const modal = document.getElementById('aiChatModal');
    if (modal) {
        modal.classList.toggle('active');
    }
}

function sendAIMessage() {
    if (app) {
        app.sendAIMessage();
    }
}

function findQibla() {
    if (window.qiblaFinder) {
        window.qiblaFinder.findQibla();
    }
}

function navigateVerse(direction) {
    if (window.quranLearning) {
        if (direction === 'next') {
            window.quranLearning.currentVerse++;
        } else if (direction === 'prev' && window.quranLearning.currentVerse > 1) {
            window.quranLearning.currentVerse--;
        }
        window.quranLearning.loadVerse(
            window.quranLearning.currentSurah,
            window.quranLearning.currentVerse
        );
    }
}

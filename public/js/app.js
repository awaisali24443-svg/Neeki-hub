/* ═══════════════════════════════════════════════════════════════════════
   NEEKI HUB - APPLICATION LOGIC
   Production-Ready Frontend with Full Offline Support
   ═══════════════════════════════════════════════════════════════════════ */

(function() {
    'use strict';

    /* ═══════════════════════════════════════════════════════════════════
       CONFIGURATION
       ═══════════════════════════════════════════════════════════════════ */

    // To change API base URL, set window.__API_BASE__ before this script loads
    // Example: <script>window.__API_BASE__ = 'https://api.example.com';</script>
    const API_BASE = window.__API_BASE__ || window.location.origin;
    
    const STORAGE_KEYS = {
        LANG: 'neeki_lang',
        CHAT_HISTORY: 'neeki_chat',
        LAST_VERSE: 'neeki_last_verse',
        LAST_HADITH: 'neeki_last_hadith',
        LAST_DUA: 'neeki_last_dua',
        LAST_QUOTE: 'neeki_last_quote',
        PRAYER_DATA: 'neeki_prayers',
        CITY: 'neeki_city',
        BOOKMARKS: 'neeki_bookmarks'
    };

    /* ═══════════════════════════════════════════════════════════════════
       UTILITIES
       ═══════════════════════════════════════════════════════════════════ */

    const localSave = (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('localStorage save failed:', e);
            return false;
        }
    };

    const localLoad = (key) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.warn('localStorage load failed:', e);
            return null;
        }
    };

    const debounce = (fn, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(context, args), wait);
        };
    };

    const throttle = (fn, limit) => {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                fn.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
                // To enable credentials: add credentials: 'include' here
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    };

    const showToast = (message, type = 'info') => {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.setAttribute('role', 'status');
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    /* ═══════════════════════════════════════════════════════════════════
       FOCUS TRAP - For accessibility
       ═══════════════════════════════════════════════════════════════════ */

    const focusTrap = {
        lastFocusedElement: null,
        
        activate(element) {
            this.lastFocusedElement = document.activeElement;
            
            const focusableElements = element.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (firstElement) {
                setTimeout(() => firstElement.focus(), 100);
            }
            
            const trapFocus = (e) => {
                if (e.key !== 'Tab') return;
                
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement?.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement?.focus();
                    }
                }
            };
            
            element.addEventListener('keydown', trapFocus);
            element._trapFocusHandler = trapFocus;
        },
        
        deactivate(element) {
            if (element._trapFocusHandler) {
                element.removeEventListener('keydown', element._trapFocusHandler);
            }
            
            if (this.lastFocusedElement) {
                this.lastFocusedElement.focus();
                this.lastFocusedElement = null;
            }
        }
    };

    /* ═══════════════════════════════════════════════════════════════════
       STATE
       ═══════════════════════════════════════════════════════════════════ */

    const state = {
        lang: localLoad(STORAGE_KEYS.LANG) || 'en',
        currentContentType: 'verse',
        prayerData: null,
        countdownInterval: null,
        progressAnimationFrame: null,
        isOnline: navigator.onLine
    };

    /* ═══════════════════════════════════════════════════════════════════
       LANGUAGE
       ═══════════════════════════════════════════════════════════════════ */

    const setLanguage = (lang) => {
        state.lang = lang;
        localSave(STORAGE_KEYS.LANG, lang);
        
        // Update UI
        document.querySelectorAll('.lang-btn').forEach(btn => {
            const isActive = btn.dataset.lang === lang;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-checked', isActive);
        });
        
        // Set RTL for Urdu/Pashto/Arabic
        if (lang === 'ur' || lang === 'ps' || lang === 'ar') {
            document.documentElement.setAttribute('dir', 'rtl');
            document.documentElement.setAttribute('lang', lang);
        } else {
            document.documentElement.setAttribute('dir', 'ltr');
            document.documentElement.setAttribute('lang', 'en');
        }
        
        // Reload current content
        loadContent(state.currentContentType);
    };

    /* ═══════════════════════════════════════════════════════════════════
       PRAYER TIMES
       ═══════════════════════════════════════════════════════════════════ */

    const loadPrayerTimes = async () => {
        const city = localLoad(STORAGE_KEYS.CITY) || 'Mecca';
        const country = 'Saudi Arabia';
        
        try {
            const data = await fetchWithTimeout(
                `${API_BASE}/api/prayers?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`
            );
            
            if (data.success) {
                state.prayerData = data.data;
                localSave(STORAGE_KEYS.PRAYER_DATA, data.data);
                updatePrayerUI();
                startCountdown();
            }
        } catch (error) {
            console.error('Prayer times error:', error);
            
            // Try cached data
            const cached = localLoad(STORAGE_KEYS.PRAYER_DATA);
            if (cached) {
                state.prayerData = cached;
                updatePrayerUI();
                startCountdown();
                showToast('Using cached prayer times (offline)', 'info');
            } else {
                showToast('Unable to load prayer times', 'error');
            }
        }
    };

    const updatePrayerUI = () => {
        const data = state.prayerData;
        if (!data) return;
        
        // Update city
        const cityEl = document.getElementById('cityName');
        if (cityEl) {
            cityEl.textContent = localLoad(STORAGE_KEYS.CITY) || 'Mecca';
            cityEl.classList.remove('skeleton');
        }
        
        // Update Hijri date
        if (data.date && data.date.hijri) {
            const hijri = data.date.hijri;
            const hijriEl = document.getElementById('hijriDate');
            if (hijriEl) {
                hijriEl.textContent = `${hijri.day} ${hijri.month.en} ${hijri.year} AH`;
                hijriEl.classList.remove('skeleton');
            }
        }
    };

    const startCountdown = () => {
        if (state.countdownInterval) {
            clearInterval(state.countdownInterval);
        }
        
        if (state.progressAnimationFrame) {
            cancelAnimationFrame(state.progressAnimationFrame);
        }
        
        updateCountdown();
        state.countdownInterval = setInterval(updateCountdown, 1000);
    };

    const updateCountdown = () => {
        const data = state.prayerData;
        if (!data || !data.timings) return;
        
        const now = new Date();
        const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        
        let nextPrayer = null;
        let nextTime = null;
        
        for (const prayer of prayers) {
            const timeStr = data.timings[prayer];
            if (!timeStr) continue;
            
            const [hours, minutes] = timeStr.split(':');
            const prayerTime = new Date();
            prayerTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            if (prayerTime > now) {
                nextPrayer = prayer;
                nextTime = prayerTime;
                break;
            }
        }
        
        // If no prayer found today, next is Fajr tomorrow
        if (!nextPrayer) {
            nextPrayer = 'Fajr';
            const [hours, minutes] = data.timings.Fajr.split(':');
            nextTime = new Date();
            nextTime.setDate(nextTime.getDate() + 1);
            nextTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        
        const diff = nextTime - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Update UI
        const nameEl = document.getElementById('nextPrayerName');
        const timeEl = document.getElementById('nextPrayerTime');
        const timerEl = document.getElementById('countdownTimer');
        
        if (nameEl) nameEl.textContent = nextPrayer;
        if (timeEl) timeEl.textContent = data.timings[nextPrayer];
        if (timerEl) {
            timerEl.textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        
        // Update progress ring (using requestAnimationFrame for smooth animation)
        state.progressAnimationFrame = requestAnimationFrame(() => {
            const totalSeconds = 24 * 60 * 60;
            const elapsedSeconds = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
            const progress = (elapsedSeconds / totalSeconds) * 565.48;
            
            const ring = document.getElementById('progressRing');
            if (ring) {
                ring.style.strokeDashoffset = String(565.48 - progress);
            }
        });
    };

    /* ═══════════════════════════════════════════════════════════════════
       DAILY CONTENT
       ═══════════════════════════════════════════════════════════════════ */

    const loadContent = async (type) => {
        state.currentContentType = type;
        
        // Update tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const isActive = btn.dataset.type === type;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive);
        });
        
        // Show skeleton
        const content = document.getElementById('carouselContent');
        content.innerHTML = `
            <div class="skeleton skeleton-text" style="height: 60px;"></div>
            <div class="skeleton skeleton-text" style="height: 40px; margin-top: 1rem;"></div>
        `;
        
        let endpoint = '';
        let cacheKey = '';
        
        switch(type) {
            case 'verse':
                endpoint = '/api/verse';
                cacheKey = STORAGE_KEYS.LAST_VERSE;
                break;
            case 'hadith':
                endpoint = '/api/hadith';
                cacheKey = STORAGE_KEYS.LAST_HADITH;
                break;
            case 'dua':
                endpoint = '/api/duas';
                cacheKey = STORAGE_KEYS.LAST_DUA;
                break;
            case 'quote':
                endpoint = '/api/hadith'; // Quotes from hadith
                cacheKey = STORAGE_KEYS.LAST_QUOTE;
                break;
        }
        
        try {
            const data = await fetchWithTimeout(`${API_BASE}${endpoint}`);
            
            if (data.success) {
                const item = Array.isArray(data.data) ? data.data[0] : data.data;
                localSave(cacheKey, item);
                displayContent(item, type);
            }
        } catch (error) {
            console.error(`${type} load error:`, error);
            
            // Try cached
            const cached = localLoad(cacheKey);
            if (cached) {
                displayContent(cached, type);
                showToast('Showing cached content (offline)', 'info');
            } else {
                content.innerHTML = '<p>Unable to load content. Please check your connection.</p>';
            }
        }
    };

    const displayContent = (item, type) => {
        const content = document.getElementById('carouselContent');
        if (!content) return;
        
        let arabic = '';
        let translation = '';
        let reference = '';
        
        if (type === 'verse' && item.verse) {
            arabic = item.verse.arabic || item.arabic || '';
            translation = item.verse.translation?.[state.lang] || item.verse.translation?.en || '';
            reference = `${item.surah?.name || ''} ${item.verse.number || ''}`;
        } else if (type === 'hadith' && item.hadith) {
            arabic = item.hadith.arabic || item.arabic || '';
            translation = item.hadith.text?.[state.lang] || item.hadith.text?.en || '';
            reference = item.hadith.reference || item.reference || '';
        } else if (type === 'dua') {
            arabic = item.arabic || '';
            translation = item.translation?.[state.lang] || item.translation?.en || '';
            reference = item.reference || '';
        } else {
            // Fallback
            arabic = item.arabic || '';
            translation = item.translation?.[state.lang] || item.translation?.en || item.text || '';
            reference = item.reference || '';
        }
        
        content.innerHTML = `
            <div class="content-arabic">${arabic}</div>
            <div class="content-translation">${translation}</div>
            <div class="content-reference">${reference}</div>
        `;
    };

    /* ═══════════════════════════════════════════════════════════════════
       PANELS
       ═══════════════════════════════════════════════════════════════════ */

    const openPanel = (panelId) => {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        panel.setAttribute('aria-hidden', 'false');
        panel.setAttribute('aria-modal', 'true');
        focusTrap.activate(panel);
    };

    const closePanel = (panel) => {
        if (!panel) return;
        
        panel.setAttribute('aria-hidden', 'true');
        panel.setAttribute('aria-modal', 'false');
        focusTrap.deactivate(panel);
    };

    const closePanels = () => {
        document.querySelectorAll('.panel').forEach(panel => {
            closePanel(panel);
        });
    };

    /* ═══════════════════════════════════════════════════════════════════
       QIBLA
       ═══════════════════════════════════════════════════════════════════ */

    const findQibla = async () => {
        if (!navigator.geolocation) {
            showToast('Geolocation not supported', 'error');
            return;
        }
        
        showToast('Getting your location...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    const data = await fetchWithTimeout(`${API_BASE}/api/qibla`, {
                        method: 'POST',
                        body: JSON.stringify({ latitude, longitude })
                    });
                    
                    if (data.success && data.data) {
                        const { qiblaDirection, distanceToKaaba } = data.data;
                        
                        // Rotate compass needle
                        const needle = document.getElementById('compassNeedle');
                        if (needle) {
                            needle.style.transform = `translate(-50%, -50%) rotate(${qiblaDirection}deg)`;
                        }
                        
                        // Update info
                        const directionEl = document.getElementById('qiblaDirection');
                        const distanceEl = document.getElementById('qiblaDistance');
                        
                        if (directionEl) directionEl.textContent = `${Math.round(qiblaDirection)}°`;
                        if (distanceEl) distanceEl.textContent = `${Math.round(distanceToKaaba)} km`;
                        
                        showToast('Qibla direction found!', 'success');
                    }
                } catch (error) {
                    console.error('Qibla error:', error);
                    showToast('Unable to calculate Qibla direction', 'error');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                showToast('Please enable location access', 'error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    /* ═══════════════════════════════════════════════════════════════════
       AI CHAT
       ═══════════════════════════════════════════════════════════════════ */

    let chatHistory = localLoad(STORAGE_KEYS.CHAT_HISTORY) || [];

    const openAIChat = () => {
        const modal = document.getElementById('aiChatModal');
        if (!modal) return;
        
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        
        // Load history
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = chatHistory.map(msg => {
            const sourcesHTML = msg.sources?.length ? 
                `<div class="chat-sources">Sources: ${msg.sources.join(', ')}</div>` : '';
            
            return `<div class="chat-message ${msg.role}">
                <p>${msg.content}</p>
                ${sourcesHTML}
            </div>`;
        }).join('');
        
        if (chatHistory.length === 0) {
            messagesContainer.innerHTML = `
                <div class="chat-message bot">
                    <p>السلام عليكم! Ask me any Islamic question.</p>
                </div>
            `;
        }
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Focus input
        const input = document.getElementById('chatInput');
        if (input) {
            setTimeout(() => input.focus(), 100);
        }
        
        focusTrap.activate(modal);
    };

    const closeAIChat = () => {
        const modal = document.getElementById('aiChatModal');
        if (!modal) return;
        
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        focusTrap.deactivate(modal);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        
        const input = document.getElementById('chatInput');
        if (!input) return;
        
        const question = input.value.trim();
        if (!question) return;
        
        // Add user message
        const userMsg = { role: 'user', content: question };
        chatHistory.push(userMsg);
        
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML += `
            <div class="chat-message user">
                <p>${question}</p>
            </div>
        `;
        
        input.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Show loading
        const loadingId = `msg-loading-${Date.now()}`;
        messagesContainer.innerHTML += `
            <div class="chat-message bot" id="${loadingId}">
                <p>Thinking...</p>
            </div>
        `;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        try {
            const data = await fetchWithTimeout(`${API_BASE}/api/ai`, {
                method: 'POST',
                body: JSON.stringify({ question, lang: state.lang })
            }, 15000);
            
            // Remove loading
            document.getElementById(loadingId)?.remove();
            
            if (data.success && data.data) {
                const botMsg = { 
                    role: 'bot', 
                    content: data.data.answer,
                    sources: data.data.sources || []
                };
                chatHistory.push(botMsg);
                
                const sourcesHTML = data.data.sources?.length ? 
                    `<div class="chat-sources">Sources: ${data.data.sources.join(', ')}</div>` : '';
                
                messagesContainer.innerHTML += `
                    <div class="chat-message bot">
                        <p>${data.data.answer}</p>
                        ${sourcesHTML}
                    </div>
                `;
            } else {
                throw new Error('No response from AI');
            }
        } catch (error) {
            console.error('AI error:', error);
            document.getElementById(loadingId)?.remove();
            
            messagesContainer.innerHTML += `
                <div class="chat-message bot">
                    <p>Sorry, I'm having trouble connecting. AI temporarily offline.</p>
                </div>
            `;
        }
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Save history (limit to last 50 messages to prevent bloat)
        if (chatHistory.length > 50) {
            chatHistory = chatHistory.slice(-50);
        }
        localSave(STORAGE_KEYS.CHAT_HISTORY, chatHistory);
    };

    /* ═══════════════════════════════════════════════════════════════════
       BOOKMARKS
       ═══════════════════════════════════════════════════════════════════ */

    const bookmarkCurrent = () => {
        const type = state.currentContentType;
        const bookmarks = localLoad(STORAGE_KEYS.BOOKMARKS) || [];
        
        const content = document.getElementById('carouselContent');
        if (!content) return;
        
        const bookmark = {
            type,
            content: content.innerHTML,
            timestamp: Date.now()
        };
        
        bookmarks.push(bookmark);
        localSave(STORAGE_KEYS.BOOKMARKS, bookmarks);
        showToast('Content bookmarked!', 'success');
    };

    /* ═══════════════════════════════════════════════════════════════════
       PWA INSTALL
       ═══════════════════════════════════════════════════════════════════ */

    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.classList.remove('hidden');
            
            installBtn.addEventListener('click', async () => {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    
                    if (outcome === 'accepted') {
                        showToast('App installed successfully!', 'success');
                    }
                    
                    deferredPrompt = null;
                    installBtn.classList.add('hidden');
                }
            }, { once: true });
        }
    });

    /* ═══════════════════════════════════════════════════════════════════
       SERVICE WORKER
       ═══════════════════════════════════════════════════════════════════ */

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => {
                    console.log('✅ Service Worker registered:', reg.scope);
                    
                    // Check for updates periodically
                    setInterval(() => {
                        reg.update();
                    }, 60 * 60 * 1000); // Check every hour
                })
                .catch(err => console.error('❌ SW registration failed:', err));
        });
    }

    /* ═══════════════════════════════════════════════════════════════════
       EVENT LISTENERS
       ═══════════════════════════════════════════════════════════════════ */

    const init = () => {
        // Language switcher
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
        });
        
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const panel = btn.dataset.panel;
                
                if (panel === 'home') {
                    closePanels();
                    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                } else if (panel === 'qibla') {
                    openPanel('qiblaPanel');
                } else {
                    openPanel('contentPanel');
                    const titleEl = document.getElementById('contentPanelTitle');
                    if (titleEl) {
                        titleEl.textContent = panel.charAt(0).toUpperCase() + panel.slice(1);
                    }
                }
                
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Quick access cards
        document.querySelectorAll('.quick-card').forEach(card => {
            card.addEventListener('click', () => {
                const panel = card.dataset.panel;
                if (panel === 'qibla') {
                    openPanel('qiblaPanel');
                } else {
                    openPanel('contentPanel');
                }
            });
        });
        
        // Panel close buttons
        document.querySelectorAll('.panel-close').forEach(btn => {
            btn.addEventListener('click', () => {
                closePanel(btn.closest('.panel'));
            });
        });
        
        // ESC to close panels and chat
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closePanels();
                closeAIChat();
            }
        });
        
        // Carousel tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                loadContent(btn.dataset.type);
            });
        });
        
        // Next content button (debounced to prevent spam)
        const nextBtn = document.getElementById('nextContentBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', 
                debounce(() => loadContent(state.currentContentType), 500)
            );
        }
        
        // Bookmark button
        const bookmarkBtn = document.getElementById('bookmarkBtn');
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener('click', bookmarkCurrent);
        }
        
        // Qibla finder
        const findQiblaBtn = document.getElementById('findQiblaBtn');
        if (findQiblaBtn) {
            findQiblaBtn.addEventListener('click', findQibla);
        }
        
        // AI Chat
        const aiFab = document.getElementById('aiFab');
        if (aiFab) {
            aiFab.addEventListener('click', openAIChat);
        }
        
        const chatClose = document.querySelector('.chat-close');
        if (chatClose) {
            chatClose.addEventListener('click', closeAIChat);
        }
        
        const chatForm = document.getElementById('chatForm');
        if (chatForm) {
            chatForm.addEventListener('submit', sendMessage);
        }
        
        // Online/offline detection
        window.addEventListener('online', () => {
            state.isOnline = true;
            showToast('Back online', 'success');
            loadPrayerTimes();
            loadContent(state.currentContentType);
        });
        
        window.addEventListener('offline', () => {
            state.isOnline = false;
            showToast('You are offline - using cached data', 'info');
        });
        
        // Parallax scroll effect (throttled for performance)
        const handleScroll = throttle(() => {
            if (window.scrollY > 50) {
                document.body.classList.add('scrolled');
            } else {
                document.body.classList.remove('scrolled');
            }
        }, 100);
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Initialize language
        setLanguage(state.lang);
        
        // Load initial data
        loadPrayerTimes();
        loadContent('verse');
        
        console.log('✅ Neeki Hub initialized successfully');
    };

    // Start app when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Cleanup on unload
    window.addEventListener('beforeunload', () => {
        if (state.countdownInterval) {
            clearInterval(state.countdownInterval);
        }
        if (state.progressAnimationFrame) {
            cancelAnimationFrame(state.progressAnimationFrame);
        }
    });

})();

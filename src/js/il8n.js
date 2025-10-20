/**
 * Internationalization (i18n) Manager
 * Handles multi-language support with RTL
 */

const translations = {
  en: {
    app_title: 'Neeki Hub',
    greeting: 'As-salamu alaykum',
    next_prayer: 'Next Prayer',
    daily_inspiration: 'Daily Inspiration',
    learn_quran: 'Learn Quran',
    hadith_collection: 'Hadith Collection',
    duas: 'Duas',
    qibla_finder: 'Qibla Finder',
    settings: 'Settings',
    bookmarks: 'Bookmarks',
    notifications: 'Notifications',
    tafseer: 'Tafseer',
    ask_question: 'Ask an Islamic question...',
    send: 'Send',
    close: 'Close',
    save: 'Save',
    delete: 'Delete',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    offline: 'You are offline',
    install_app: 'Install Neeki Hub for offline access',
    detecting_location: 'Detecting location...',
    location_denied: 'Location permission denied',
    language: 'Language',
    direction_to_kaaba: 'Direction to Kaaba',
    distance_km: 'Distance (km)',
    bookmark_added: 'Bookmark added',
    bookmark_removed: 'Bookmark removed',
    prayer_notification: 'Time for prayer',
    ai_assistant: 'Islamic AI Assistant',
    sources: 'Sources',
    no_sources: 'No sources available',
    translation_not_available: 'Translation not available'
  },
  ur: {
    app_title: 'نیکی ہب',
    greeting: 'السلام علیکم',
    next_prayer: 'اگلی نماز',
    daily_inspiration: 'روزانہ الہام',
    learn_quran: 'قرآن سیکھیں',
    hadith_collection: 'حدیث کا مجموعہ',
    duas: 'دعائیں',
    qibla_finder: 'قبلہ تلاش کریں',
    settings: 'ترتیبات',
    bookmarks: 'نشانیاں',
    notifications: 'اطلاعات',
    tafseer: 'تفسیر',
    ask_question: 'اسلامی سوال پوچھیں...',
    send: 'بھیجیں',
    close: 'بند کریں',
    save: 'محفوظ کریں',
    delete: 'حذف کریں',
    cancel: 'منسوخ کریں',
    loading: 'لوڈ ہو رہا ہے...',
    error: 'خرابی',
    success: 'کامیابی',
    offline: 'آپ آف لائن ہیں',
    install_app: 'آف لائن رسائی کے لیے نیکی ہب انسٹال کریں',
    detecting_location: 'مقام تلاش کیا جا رہا ہے...',
    location_denied: 'مقام کی اجازت مسترد',
    language: 'زبان',
    direction_to_kaaba: 'کعبہ کی سمت',
    distance_km: 'فاصلہ (کلومیٹر)',
    bookmark_added: 'نشانی شامل کی گئی',
    bookmark_removed: 'نشانی ہٹائی گئی',
    prayer_notification: 'نماز کا وقت',
    ai_assistant: 'اسلامی اے آئی معاون',
    sources: 'ذرائع',
    no_sources: 'کوئی ذرائع دستیاب نہیں',
    translation_not_available: 'ترجمہ دستیاب نہیں'
  },
  ps: {
    app_title: 'نیکی هب',
    greeting: 'السلام علیکم',
    next_prayer: 'راتلونکی لمانځه',
    daily_inspiration: 'ورځنۍ الهام',
    learn_quran: 'قرآن زده کړئ',
    hadith_collection: 'د احادیثو ټولګه',
    duas: 'دعاګانې',
    qibla_finder: 'قبله موندنه',
    settings: 'تنظیمات',
    bookmarks: 'نښانې',
    notifications: 'خبرتیاوې',
    tafseer: 'تفسیر',
    ask_question: 'اسلامي پوښتنه وکړئ...',
    send: 'واستوئ',
    close: 'بند کړئ',
    save: 'خوندي کړئ',
    delete: 'حذف کړئ',
    cancel: 'لغوه کړئ',
    loading: 'بارېږي...',
    error: 'تېروتنه',
    success: 'بریالیتوب',
    offline: 'تاسو آفلاین یاست',
    install_app: 'د آفلاین لاسرسي لپاره نیکی هب نصب کړئ',
    detecting_location: 'موقعیت موندل کېږي...',
    location_denied: 'د موقعیت اجازه رد شوه',
    language: 'ژبه',
    direction_to_kaaba: 'کعبې ته لوري',
    distance_km: 'واټن (کیلومتره)',
    bookmark_added: 'نښه اضافه شوه',
    bookmark_removed: 'نښه لرې شوه',
    prayer_notification: 'د لمانځه وخت',
    ai_assistant: 'اسلامي AI معاون',
    sources: 'سرچینې',
    no_sources: 'هیڅ سرچینې شتون نلري',
    translation_not_available: 'ژباړه شتون نلري'
  }
};

const I18n = {
  currentLang: 'en',
  rtlLanguages: ['ur', 'ps', 'ar'],

  init() {
    const savedLang = localStorage.getItem('language');
    const browserLang = navigator.language.split('-')[0];
    
    this.currentLang = savedLang || (translations[browserLang] ? browserLang : 'en');
    this.applyLanguage(this.currentLang);
  },

  setLanguage(lang) {
    if (!translations[lang]) {
      console.warn(`Language ${lang} not supported, falling back to English`);
      lang = 'en';
    }
    
    this.currentLang = lang;
    localStorage.setItem('language', lang);
    this.applyLanguage(lang);
  },

  applyLanguage(lang) {
    const isRTL = this.rtlLanguages.includes(lang);
    
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    
    if (isRTL) {
      this.loadRTLStyles();
    } else {
      this.unloadRTLStyles();
    }
    
    this.updateTranslations();
    
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  },

  loadRTLStyles() {
    if (!document.getElementById('rtl-styles')) {
      const link = document.createElement('link');
      link.id = 'rtl-styles';
      link.rel = 'stylesheet';
      link.href = '/src/styles/rtl.css';
      document.head.appendChild(link);
    }
  },

  unloadRTLStyles() {
    const rtlStyles = document.getElementById('rtl-styles');
    if (rtlStyles) rtlStyles.remove();
  },

  t(key, fallback = '') {
    const translation = translations[this.currentLang]?.[key];
    return translation || translations.en[key] || fallback || key;
  },

  updateTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      element.textContent = this.t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      element.placeholder = this.t(key);
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria');
      element.setAttribute('aria-label', this.t(key));
    });
  },

  formatNumber(number) {
    const locale = this.currentLang === 'en' ? 'en-US' : 
                   this.currentLang === 'ur' ? 'ur-PK' : 
                   this.currentLang === 'ps' ? 'ps-AF' : 'en-US';
    
    return new Intl.NumberFormat(locale).format(number);
  },

  formatDate(date, options = {}) {
    const locale = this.currentLang === 'en' ? 'en-US' : 
                   this.currentLang === 'ur' ? 'ur-PK' : 
                   this.currentLang === 'ps' ? 'ps-AF' : 'en-US';
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  },

  getCurrentLanguage() {
    return this.currentLang;
  },

  isRTL() {
    return this.rtlLanguages.includes(this.currentLang);
  }
};

export default I18n;
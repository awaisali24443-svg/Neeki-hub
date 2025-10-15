// =========================================
// NEEKIHUB - Backend Server
// =========================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// =========================================
// DATA STORAGE (Mock Database)
// =========================================

// Quran Data (Sample - In production, use complete Quran database)
const quranData = [
    {
        id: 1,
        surahNumber: 1,
        surahName: "Al-Fatihah",
        surahNameArabic: "الفاتحة",
        verses: [
            {
                verseNumber: 1,
                arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
                transliteration: "Bismillah ir-Rahman ir-Raheem",
                translations: {
                    en: "In the name of Allah, the Most Gracious, the Most Merciful",
                    ur: "شروع اللہ کے نام سے جو بڑا مہربان نہایت رحم والا ہے",
                    ps: "د الله په نامه چې ډېر مهربان او رحم کوونکی دی",
                    ar: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
                },
                tafseer: {
                    en: "This is the Basmala - the opening phrase of the Quran. It teaches us to begin everything with Allah's name, seeking His blessings and mercy.",
                    ur: "یہ بسم اللہ ہے - قرآن کی ابتدائی آیت۔ یہ ہمیں سکھاتی ہے کہ ہر کام اللہ کے نام سے شروع کریں۔",
                    ps: "دا بسم الله دی - د قرآن لومړی آیت چې موږ ته زده کوي هره کار د الله په نامه پیل کړو۔"
                },
                audio: "https://everyayah.com/data/Abdul_Basit_Murattal_64kbps/001001.mp3"
            },
            {
                verseNumber: 2,
                arabic: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
                transliteration: "Alhamdulillahi Rabbil 'Alameen",
                translations: {
                    en: "All praise is due to Allah, Lord of all the worlds",
                    ur: "تمام تعریفیں اللہ کے لیے ہیں جو تمام جہانوں کا رب ہے",
                    ps: "ټول ستاینه د الله لپاره چې د ټولو جهانونو رب دی",
                    ar: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ"
                },
                tafseer: {
                    en: "All forms of praise and gratitude belong to Allah alone, who created and sustains all existence.",
                    ur: "ہر قسم کی تعریف اور شکر صرف اللہ کے لیے ہے جو تمام کائنات کا خالق ہے۔",
                    ps: "هر ډول ستاینه یوازې د الله لپاره چې د ټول کائنات خالق دی."
                },
                audio: "https://everyayah.com/data/Abdul_Basit_Murattal_64kbps/001002.mp3"
            }
        ]
    },
    {
        id: 2,
        surahNumber: 112,
        surahName: "Al-Ikhlas",
        surahNameArabic: "الإخلاص",
        verses: [
            {
                verseNumber: 1,
                arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ",
                transliteration: "Qul Huwa Allahu Ahad",
                translations: {
                    en: "Say: He is Allah, the One",
                    ur: "کہہ دو وہ اللہ ایک ہے",
                    ps: "ووایه: هغه الله یو دی",
                    ar: "قُلْ هُوَ اللَّهُ أَحَدٌ"
                },
                tafseer: {
                    en: "This Surah declares the absolute oneness of Allah (Tawheed), the foundation of Islamic faith.",
                    ur: "یہ سورہ اللہ کی مکمل وحدانیت کا اعلان کرتی ہے جو اسلامی عقیدے کی بنیاد ہے۔",
                    ps: "دا سورت د الله یووالی بیانوي چې د اسلامي عقیدې بنسټ دی."
                },
                audio: "https://everyayah.com/data/Abdul_Basit_Murattal_64kbps/112001.mp3"
            }
        ]
    }
];

// Duas Database
const duasData = {
    daily: [
        {
            id: 1,
            category: "before_eating",
            title: "Before Eating",
            arabic: "بِسْمِ اللَّهِ",
            transliteration: "Bismillah",
            translations: {
                en: "In the name of Allah",
                ur: "اللہ کے نام سے",
                ps: "د الله په نامه",
                ar: "بِسْمِ اللَّهِ"
            },
            reference: "Sahih Muslim 2017",
            audio: "/assets/audio/bismillah.mp3"
        },
        {
            id: 2,
            category: "after_eating",
            title: "After Eating",
            arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",
            transliteration: "Alhamdulillahi ladhi at'amana wa saqana wa ja'alana muslimeen",
            translations: {
                en: "All praise is due to Allah who gave us food and drink and made us Muslims",
                ur: "تمام تعریفیں اللہ کے لیے ہیں جس نے ہمیں کھانا پینا دیا اور مسلمان بنایا",
                ps: "ټول ستاینه د الله لپاره چې موږ ته یې خواړه او څښاک راکړ او موږ یې مسلمانان کړو",
                ar: "الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ"
            },
            reference: "Abu Dawud 3850",
            audio: "/assets/audio/after_eating.mp3"
        },
        {
            id: 3,
            category: "morning",
            title: "Morning Dua",
            arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ",
            transliteration: "Asbahna wa asbahal mulku lillahi walhamdulillah",
            translations: {
                en: "We have entered the morning and the kingdom belongs to Allah, and all praise is to Allah",
                ur: "ہم نے صبح کی اور بادشاہی اللہ کی ہے اور تمام تعریفیں اللہ کے لیے",
                ps: "موږ سهار ته ورسېدو او پاچاهي د الله ده او ټوله ستاینه د الله لپاره",
                ar: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ"
            },
            reference: "Sahih Muslim 2723",
            audio: "/assets/audio/morning.mp3"
        },
        {
            id: 4,
            category: "evening",
            title: "Evening Dua",
            arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ",
            transliteration: "Amsayna wa amsal mulku lillah",
            translations: {
                en: "We have entered the evening and the kingdom belongs to Allah",
                ur: "ہم نے شام کی اور بادشاہی اللہ کی ہے",
                ps: "موږ ماښام ته ورسېدو او پاچاهي د الله ده",
                ar: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ"
            },
            reference: "Sahih Muslim 2723",
            audio: "/assets/audio/evening.mp3"
        },
        {
            id: 5,
            category: "sleeping",
            title: "Before Sleeping",
            arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
            transliteration: "Bismika Allahumma amutu wa ahya",
            translations: {
                en: "In Your name O Allah, I die and I live",
                ur: "اے اللہ تیرے نام سے میں مرتا ہوں اور جیتا ہوں",
                ps: "په ستا نامه ای الله زه مړم او ژوندی کېږم",
                ar: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا"
            },
            reference: "Sahih Bukhari 6312",
            audio: "/assets/audio/sleeping.mp3"
        },
        {
            id: 6,
            category: "waking",
            title: "After Waking Up",
            arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ",
            transliteration: "Alhamdulillahi ladhi ahyana ba'da ma amatana wa ilayhin nushur",
            translations: {
                en: "All praise is to Allah who gave us life after death and to Him is the resurrection",
                ur: "تمام تعریفیں اللہ کے لیے جس نے مرنے کے بعد زندہ کیا اور اسی کی طرف اٹھنا ہے",
                ps: "ټوله ستاینه د الله لپاره چې موږ یې د مړینې وروسته ژوندي کړو",
                ar: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا"
            },
            reference: "Sahih Bukhari 6312",
            audio: "/assets/audio/waking.mp3"
        },
        {
            id: 7,
            category: "travel",
            title: "Before Travel",
            arabic: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ",
            transliteration: "Subhanal ladhi sakhara lana hadha wa ma kunna lahu muqrineen",
            translations: {
                en: "Glory be to Him who has subjected this to us, and we could never have it by our efforts",
                ur: "پاک ہے وہ جس نے اس کو ہمارے قابو میں کیا حالانکہ ہم اس کی طاقت نہیں رکھتے تھے",
                ps: "پاک دی هغه چې دا یې زموږ لپاره رام کړ او موږ د دې توان نه درلود",
                ar: "سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا"
            },
            reference: "Quran 43:13-14",
            audio: "/assets/audio/travel.mp3"
        },
        {
            id: 8,
            category: "drinking_water",
            title: "Before Drinking Water",
            arabic: "بِسْمِ اللَّهِ",
            transliteration: "Bismillah",
            translations: {
                en: "In the name of Allah",
                ur: "اللہ کے نام سے",
                ps: "د الله په نامه",
                ar: "بِسْمِ اللَّهِ"
            },
            reference: "Islamic Etiquette",
            audio: "/assets/audio/bismillah.mp3"
        }
    ]
};

// AI Knowledge Base for Islamic Questions
const islamicKnowledgeBase = {
    prayer: {
        keywords: ['salah', 'namaz', 'prayer', 'نماز', 'صلاة'],
        response: {
            en: "Prayer (Salah/Namaz) is the second pillar of Islam and one of the most important acts of worship. Muslims are required to pray five times daily: Fajr (dawn), Dhuhr (noon), Asr (afternoon), Maghrib (sunset), and Isha (night). Each prayer consists of specific units (rak'ahs) with recitations from the Quran, standing, bowing, and prostrating before Allah.",
            ur: "نماز اسلام کا دوسرا رکن اور سب سے اہم عبادت ہے۔ مسلمانوں کو دن میں پانچ بار نماز پڑھنی ضروری ہے: فجر، ظہر، عصر، مغرب اور عشاء۔",
            ps: "لمونځ د اسلام دویمه ستنه او خورا مهمه عبادت دی. مسلمانان باید په ورځ کې پنځه ځله لمونځ وکړي.",
            references: ["Quran 2:238", "Sahih Bukhari 527", "Quran 29:45"]
        }
    },
    ramadan: {
        keywords: ['ramadan', 'fasting', 'sawm', 'روزہ', 'رمضان', 'صيام'],
        response: {
            en: "Ramadan is the ninth month of the Islamic calendar and the month in which the Quran was revealed. Muslims fast from dawn to sunset, abstaining from food, drink, and intimate relations. Fasting teaches self-discipline, God-consciousness, and empathy for those less fortunate. It is one of the Five Pillars of Islam.",
            ur: "رمضان اسلامی کیلنڈر کا نواں مہینہ ہے جس میں قرآن نازل ہوا۔ مسلمان طلوع فجر سے غروب آفتاب تک روزہ رکھتے ہیں۔",
            ps: "رمضان د اسلامي کلیزې نهمه میاشت ده چې په کې قرآن نازل شوی. مسلمانان له سهار څخه تر ماښام پورې روژه نیسي.",
            references: ["Quran 2:183-185", "Sahih Bukhari 1891", "Quran 2:187"]
        }
    },
    zakat: {
        keywords: ['zakat', 'charity', 'زکوٰۃ', 'زکات', 'صدقہ'],
        response: {
            en: "Zakat is obligatory charity and the third pillar of Islam. Muslims who possess wealth above the nisab (threshold) must give 2.5% of their qualifying assets annually to help the poor, needy, and other specified categories mentioned in the Quran (9:60). Zakat purifies wealth and creates social equity.",
            ur: "زکوٰۃ فرض خیرات اور اسلام کا تیسرا رکن ہے۔ جن مسلمانوں کے پاس نصاب سے زیادہ دولت ہو انہیں سالانہ 2.5% زکوٰۃ دینا فرض ہے۔",
            ps: "زکات فرض خیرات او د اسلام درېمه ستنه ده. هغه مسلمانان چې له نصاب څخه ډېر شتمني ولري باید کلنۍ 2.5% زکات ورکړي.",
            references: ["Quran 2:43", "Quran 9:60", "Sahih Muslim 987"]
        }
    },
    hajj: {
        keywords: ['hajj', 'pilgrimage', 'حج', 'کعبہ'],
        response: {
            en: "Hajj is the annual Islamic pilgrimage to Mecca and the fifth pillar of Islam. It is obligatory once in a lifetime for every adult Muslim who is physically and financially capable. Hajj occurs during the Islamic month of Dhul-Hijjah and includes rituals such as Tawaf (circling the Kaaba), Sa'i, and standing at Arafat.",
            ur: "حج مکہ کی سالانہ زیارت اور اسلام کا پانچواں رکن ہے۔ ہر بالغ مسلمان پر جو جسمانی اور مالی طور پر قادر ہو، زندگی میں ایک بار حج فرض ہے۔",
            ps: "حج د مکې کلنۍ زیارت او د اسلام پنځمه ستنه ده. په هر بالغ مسلمان باندې چې فزیکي او مالي توان ولري په ژوند کې یو ځل حج فرض دی.",
            references: ["Quran 3:97", "Quran 2:196-197", "Sahih Bukhari 1519"]
        }
    },
    tawheed: {
        keywords: ['tawheed', 'oneness', 'توحید', 'وحدانیت'],
        response: {
            en: "Tawheed is the absolute oneness and uniqueness of Allah. It is the foundation of Islamic faith, declaring that there is no god but Allah, and He has no partners, equals, or offspring. Tawheed encompasses Allah's oneness in His lordship, worship, names, and attributes.",
            ur: "توحید اللہ کی مکمل یکتائی اور وحدانیت ہے۔ یہ اسلامی عقیدے کی بنیاد ہے کہ اللہ کے سوا کوئی معبود نہیں۔",
            ps: "توحید د الله یووالی او بې شریکه والی دی. دا د اسلامي عقیدې بنسټ دی چې له الله پرته بل معبود نشته.",
            references: ["Quran 112:1-4", "Quran 2:163", "Sahih Bukhari 7372"]
        }
    }
};

// =========================================
// API ENDPOINTS
// =========================================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Neekihub API is running',
        timestamp: new Date().toISOString()
    });
});

// Get All Surahs List
app.get('/api/quran/surahs', (req, res) => {
    const surahsList = quranData.map(surah => ({
        id: surah.id,
        surahNumber: surah.surahNumber,
        surahName: surah.surahName,
        surahNameArabic: surah.surahNameArabic,
        versesCount: surah.verses.length
    }));
    
    res.json({
        success: true,
        data: surahsList,
        count: surahsList.length
    });
});

// Get Specific Surah with Verses
app.get('/api/quran/surah/:surahNumber', (req, res) => {
    const { surahNumber } = req.params;
    const { lang = 'en' } = req.query;
    
    const surah = quranData.find(s => s.surahNumber == surahNumber);
    
    if (!surah) {
        return res.status(404).json({
            success: false,
            message: 'Surah not found'
        });
    }
    
    res.json({
        success: true,
        data: surah
    });
});

// Get Specific Verse
app.get('/api/quran/verse/:surahNumber/:verseNumber', (req, res) => {
    const { surahNumber, verseNumber } = req.params;
    const { lang = 'en' } = req.query;
    
    const surah = quranData.find(s => s.surahNumber == surahNumber);
    if (!surah) {
        return res.status(404).json({
            success: false,
            message: 'Surah not found'
        });
    }
    
    const verse = surah.verses.find(v => v.verseNumber == verseNumber);
    if (!verse) {
        return res.status(404).json({
            success: false,
            message: 'Verse not found'
        });
    }
    
    res.json({
        success: true,
        data: {
            surah: {
                number: surah.surahNumber,
                name: surah.surahName,
                nameArabic: surah.surahNameArabic
            },
            verse
        }
    });
});

// Get All Duas
app.get('/api/duas', (req, res) => {
    const { category, lang = 'en' } = req.query;
    
    let duas = duasData.daily;
    
    if (category && category !== 'all') {
        duas = duas.filter(d => d.category === category);
    }
    
    res.json({
        success: true,
        data: duas,
        count: duas.length
    });
});

// Get Specific Dua
app.get('/api/duas/:id', (req, res) => {
    const { id } = req.params;
    const dua = duasData.daily.find(d => d.id == id);
    
    if (!dua) {
        return res.status(404).json({
            success: false,
            message: 'Dua not found'
        });
    }
    
    res.json({
        success: true,
        data: dua
    });
});

// Prayer Times API (Proxy to Aladhan API or return cached)
app.get('/api/prayer-times', async (req, res) => {
    const { city = 'Mecca', country = 'Saudi Arabia', method = '2' } = req.query;
    
    try {
        // Mock prayer times for development
        // In production, fetch from Aladhan API
        const currentDate = new Date();
        const mockPrayerData = {
            success: true,
            data: {
                date: {
                    readable: currentDate.toLocaleDateString('en-US', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    }),
                    timestamp: currentDate.getTime(),
                    hijri: {
                        date: "15-07-1445",
                        format: "DD-MM-YYYY",
                        day: "15",
                        weekday: { en: "Friday", ar: "الجمعة" },
                        month: { number: 7, en: "Rajab", ar: "رَجَب" },
                        year: "1445",
                        designation: { abbreviated: "AH", expanded: "Anno Hegirae" }
                    },
                    gregorian: {
                        date: currentDate.toISOString().split('T')[0],
                        day: currentDate.getDate().toString(),
                        month: { number: currentDate.getMonth() + 1, en: currentDate.toLocaleString('en-US', { month: 'long' }) },
                        year: currentDate.getFullYear().toString()
                    }
                },
                timings: {
                    Fajr: "05:30",
                    Sunrise: "06:50",
                    Dhuhr: "12:15",
                    Asr: "15:30",
                    Sunset: "17:40",
                    Maghrib: "17:45",
                    Isha: "19:00",
                    Imsak: "05:20",
                    Midnight: "00:15"
                },
                meta: {
                    latitude: 21.4225,
                    longitude: 39.8262,
                    timezone: "Asia/Riyadh",
                    method: {
                        id: 2,
                        name: "Islamic Society of North America (ISNA)",
                        params: { Fajr: 15, Isha: 15 }
                    },
                    latitudeAdjustmentMethod: "ANGLE_BASED",
                    midnightMode: "STANDARD",
                    school: "STANDARD",
                    offset: {
                        Imsak: 0, Fajr: 0, Sunrise: 0, Dhuhr: 0,
                        Asr: 0, Maghrib: 0, Sunset: 0, Isha: 0, Midnight: 0
                    }
                }
            }
        };
        
        res.json(mockPrayerData);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching prayer times',
            error: error.message
        });
    }
});

// AI Islamic Q&A Endpoint
app.post('/api/ai/ask', (req, res) => {
    const { question, language = 'en' } = req.body;
    
    if (!question || question.trim().length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Question is required'
        });
    }
    
    // Sanitize input
    const sanitizedQuestion = question.toLowerCase().trim();
    
    // Check if question is Islamic-related
    let response = null;
    let references = [];
    
    // Search knowledge base
    for (const [topic, data] of Object.entries(islamicKnowledgeBase)) {
        if (data.keywords.some(keyword => sanitizedQuestion.includes(keyword))) {
            response = data.response[language] || data.response.en;
            references = data.response.references;
            break;
        }
    }
    
    // Default response if no match found
    if (!response) {
        const defaultResponses = {
            en: "Thank you for your question. For specific Islamic rulings and detailed answers, I recommend consulting qualified Islamic scholars or trusted Islamic resources. I can provide general information about the Five Pillars of Islam, Quran, Hadith, prayer, fasting, Zakat, Hajj, and basic Islamic teachings. Please feel free to ask more specific questions about these topics.",
            ur: "آپ کے سوال کا شکریہ۔ مخصوص اسلامی احکام کے لیے علماء سے رجوع کریں۔ میں اسلام کے پانچ ارکان، قرآن، حدیث، نماز، روزہ، زکوٰۃ اور حج کے بارے میں عمومی معلومات فراہم کر سکتا ہوں۔",
            ps: "ستاسو د پوښتنې مننه. د مشخصو اسلامي احکامو لپاره له عالمانو سره مشوره وکړئ. زه د اسلام د پنځو ستنو، قرآن، حدیث، لمونځ، روژې، زکات او حج په اړه عمومي معلومات ورکولی شم.",
            ar: "شكراً لسؤالك. للأحكام الإسلامية المحددة، يُرجى استشارة العلماء المؤهلين. يمكنني تقديم معلومات عامة عن أركان الإسلام الخمسة والقرآن والحديث والصلاة والصيام والزكاة والحج."
        };
        
        response = defaultResponses[language] || defaultResponses.en;
        references = ["General Islamic Knowledge"];
    }
    
    // Simulate AI thinking delay
    setTimeout(() => {
        res.json({
            success: true,
            data: {
                question,
                answer: response,
                references,
                language,
                timestamp: new Date().toISOString()
            }
        });
    }, 800);
});

// Qibla Direction Calculator
app.post('/api/qibla', (req, res) => {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
        return res.status(400).json({
            success: false,
            message: 'Latitude and longitude are required'
        });
    }
    
    // Kaaba coordinates
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;
    
    // Calculate bearing (Qibla direction)
    const calculateBearing = (lat1, lon1, lat2, lon2) => {
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
        const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
                  Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        bearing = (bearing + 360) % 360;
        return bearing;
    };
    
    // Calculate distance
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };
    
    const bearing = calculateBearing(latitude, longitude, kaabaLat, kaabaLng);
    const distance = calculateDistance(latitude, longitude, kaabaLat, kaabaLng);
    
    res.json({
        success: true,
        data: {
            qiblaDirection: Math.round(bearing),
            distanceToKaaba: Math.round(distance),
            userLocation: { latitude, longitude },
            kaabaLocation: { latitude: kaabaLat, longitude: kaabaLng }
        }
    });
});

// User Progress Save (using localStorage on client side)
app.post('/api/user/progress', (req, res) => {
    // In production, save to database
    // For now, acknowledge receipt
    res.json({
        success: true,
        message: 'Progress saved successfully'
    });
});

// Serve main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`
    ╔══════════════════════════════════════╗
    ║                                      ║
    ║        🕌 NEEKIHUB SERVER 🕌        ║
    ║                                      ║
    ║  Server running on port ${PORT}       ║
    ║  http://localhost:${PORT}             ║
    ║                                      ║
    ║  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ  ║
    ║                                      ║
    ╚══════════════════════════════════════╝
    `);
});
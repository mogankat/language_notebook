/* Projects and languages: the page shows one project at a time, picked in the profile sidebar
   (saved per device). A project is either a language (with its dictionary, letters and audio) or
   Blank (your own terms and definitions). Each project has its own words, tags, progress and settings. */

const LANGS = {
  ja: {
    name: 'Japanese', native: '日本語', tts: 'ja-JP', voice: /kyoko|otoya|hattori|o-ren/i, voiceName: 'Kyoko',
    lettersTab: 'Characters', lettersWord: 'kana', handwriting: true,
    dict: 'dict/jmdict-common.json', dictSize: '22,000+',
    dictCredit: '<a href="https://www.edrdg.org/wiki/index.php/JMdict-EDICT_Dictionary_Project" target="_blank" rel="noopener">JMdict</a>, © <a href="https://www.edrdg.org/edrdg/licence.html" target="_blank" rel="noopener">EDRDG</a>, used under CC BY-SA 4.0.',
    readingLabel: 'Reading (kana or romaji)', wordPlaceholder: '猫 / ねこ / おはようございます', readingPlaceholder: 'ねこ · neko',
    searchHint: 'English, romaji or Japanese', sortLabel: 'あいうえお order',
    bulkPlaceholder: '水 | みず | water\nこんにちは | hello\nありがとう | arigatou | thank you | Unit 1',
    samples: [['猫', 'ねこ', 'cat', 'word', 'animals'], ['水', 'みず', 'water', 'word', 'Unit 1'], ['おはようございます', 'ohayou gozaimasu', 'good morning', 'phrase', 'greetings'],
      ['ありがとう', 'arigatou', 'thank you', 'phrase', 'greetings'], ['コーヒー', 'こーひー', 'coffee', 'word', 'food'], ['ごはん', 'gohan', 'rice; meal', 'word', 'food'], ['〜はどこですか', '~ wa doko desu ka', 'where is ~?', 'grammar', 'Unit 2']],
  },
  zh: {
    name: 'Chinese', native: '中文', tts: 'zh-CN', voice: /tingting|lili|yu-shu|lilian/i, voiceName: 'Tingting',
    lettersTab: 'Pinyin', lettersWord: null, handwriting: true,
    dict: 'dict/zh.json', dictSize: '15,000+',
    dictCredit: '<a href="https://cc-cedict.org/wiki/" target="_blank" rel="noopener">CC-CEDICT</a> (MDBG) and <a href="https://github.com/hermitdave/FrequencyWords" target="_blank" rel="noopener">FrequencyWords</a>, CC BY-SA 4.0.',
    readingLabel: 'Pinyin', wordPlaceholder: '猫 / 你好 / 谢谢', readingPlaceholder: 'māo · mao1',
    searchHint: 'English, pinyin or characters', sortLabel: 'Pinyin order',
    bulkPlaceholder: '猫 | māo | cat\n你好 | hello\n谢谢 | xiè xie | thank you | Unit 1',
    samples: [['猫', 'māo', 'cat', 'word', 'animals'], ['水', 'shuǐ', 'water', 'word', 'Unit 1'], ['你好', 'nǐ hǎo', 'hello', 'phrase', 'greetings'],
      ['谢谢', 'xièxie', 'thank you', 'phrase', 'greetings'], ['咖啡', 'kāfēi', 'coffee', 'word', 'food']],
  },
  fr: {
    name: 'French', native: 'Français', tts: 'fr-FR', voice: /thomas|amélie|amelie|audrey|marie|daniel/i, voiceName: 'Thomas',
    latin: true, lettersTab: 'Letters', lettersWord: 'special letters (é, ç, œ…)', handwriting: false, accents: ['é', 'è', 'ê', 'ë', 'à', 'â', 'ç', 'î', 'ï', 'ô', 'û', 'ù', 'œ', '’'],
    dict: 'dict/fr.json', dictSize: '20,000+',
    dictCredit: '<a href="https://en.wiktionary.org" target="_blank" rel="noopener">Wiktionary</a> via <a href="https://kaikki.org" target="_blank" rel="noopener">kaikki.org</a> and <a href="https://github.com/hermitdave/FrequencyWords" target="_blank" rel="noopener">FrequencyWords</a>, CC BY-SA 4.0.',
    readingLabel: 'Pronunciation (optional)', wordPlaceholder: 'le chat / bonjour / s’il vous plaît', readingPlaceholder: '/ʃa/ · shah',
    searchHint: 'English or French, accents optional', sortLabel: 'A–Z (French)',
    bulkPlaceholder: 'le chat | cat\nbonjour | hello\nmerci | thank you | | Unit 1',
    samples: [['le chat', '/ʃa/', 'cat', 'word', 'animals'], ['l’eau', '/o/', 'water', 'word', 'Unit 1'], ['bonjour', '/bɔ̃.ʒuʁ/', 'hello', 'phrase', 'greetings'],
      ['merci', '/mɛʁ.si/', 'thank you', 'phrase', 'greetings'], ['le café', '/ka.fe/', 'coffee', 'word', 'food']],
  },
  ko: {
    name: 'Korean', native: '한국어', tts: 'ko-KR', voice: /yuna|sora|minsu|jian/i, voiceName: 'Yuna',
    lettersTab: 'Hangul', lettersWord: 'Hangul letters', handwriting: true,
    dict: 'dict/ko.json', dictSize: '6,500+',
    dictCredit: '<a href="https://en.wiktionary.org" target="_blank" rel="noopener">Wiktionary</a> via <a href="https://kaikki.org" target="_blank" rel="noopener">kaikki.org</a> and <a href="https://github.com/hermitdave/FrequencyWords" target="_blank" rel="noopener">FrequencyWords</a>, CC BY-SA 4.0.',
    readingLabel: 'Romanization (optional)', wordPlaceholder: '고양이 / 안녕하세요', readingPlaceholder: 'goyangi',
    searchHint: 'English, romanization or Hangul', sortLabel: '가나다 order',
    bulkPlaceholder: '고양이 | goyangi | cat\n안녕하세요 | hello\n감사합니다 | gamsahamnida | thank you | Unit 1',
    samples: [['고양이', 'goyangi', 'cat', 'word', 'animals'], ['물', 'mul', 'water', 'word', 'Unit 1'], ['안녕하세요', 'annyeonghaseyo', 'hello', 'phrase', 'greetings'],
      ['감사합니다', 'gamsahamnida', 'thank you', 'phrase', 'greetings'], ['커피', 'keopi', 'coffee', 'word', 'food']],
  },
  es: {
    name: 'Spanish', native: 'Español', tts: 'es-MX', voice: /paulina|juan|mónica|monica|jorge|diego/i, voiceName: 'Paulina',
    latin: true, lettersTab: 'Letters', lettersWord: 'special letters (ñ, á, ü…)', handwriting: false, accents: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡'],
    dict: 'dict/es.json', dictSize: '18,000+',
    dictCredit: '<a href="https://en.wiktionary.org" target="_blank" rel="noopener">Wiktionary</a> via <a href="https://kaikki.org" target="_blank" rel="noopener">kaikki.org</a> and <a href="https://github.com/hermitdave/FrequencyWords" target="_blank" rel="noopener">FrequencyWords</a>, CC BY-SA 4.0.',
    readingLabel: 'Pronunciation (optional)', wordPlaceholder: 'el gato / hola / por favor', readingPlaceholder: '/ˈɡato/',
    searchHint: 'English or Spanish, accents optional', sortLabel: 'A–Z (Spanish)',
    bulkPlaceholder: 'el gato | cat\nhola | hello\ngracias | thank you | | Unit 1',
    samples: [['el gato', '/ˈɡato/', 'cat', 'word', 'animals'], ['el agua', '/ˈaɣwa/', 'water', 'word', 'Unit 1'], ['hola', '/ˈola/', 'hello', 'phrase', 'greetings'],
      ['gracias', '/ˈɡɾasjas/', 'thank you', 'phrase', 'greetings'], ['el café', '/kaˈfe/', 'coffee', 'word', 'food']],
  },
  de: {
    name: 'German', native: 'Deutsch', tts: 'de-DE', voice: /anna|petra|markus|helena|yannick/i, voiceName: 'Anna',
    latin: true, lettersTab: 'Letters', lettersWord: 'special letters (ä, ö, ü, ß)', handwriting: false, accents: ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'],
    dict: 'dict/de.json', dictSize: '16,000+',
    dictCredit: '<a href="https://en.wiktionary.org" target="_blank" rel="noopener">Wiktionary</a> via <a href="https://kaikki.org" target="_blank" rel="noopener">kaikki.org</a> and <a href="https://github.com/hermitdave/FrequencyWords" target="_blank" rel="noopener">FrequencyWords</a>, CC BY-SA 4.0.',
    readingLabel: 'Pronunciation (optional)', wordPlaceholder: 'die Katze / guten Morgen', readingPlaceholder: '/ˈkatsə/',
    searchHint: 'English or German, umlauts optional', sortLabel: 'A–Z (German)',
    bulkPlaceholder: 'die Katze | cat\nguten Morgen | good morning\ndanke | thank you | | Unit 1',
    samples: [['die Katze', '/ˈkatsə/', 'cat', 'word', 'animals'], ['das Wasser', '/ˈvasɐ/', 'water', 'word', 'Unit 1'], ['guten Morgen', '', 'good morning', 'phrase', 'greetings'],
      ['danke', '/ˈdaŋkə/', 'thank you', 'phrase', 'greetings'], ['der Kaffee', '/ˈkafe/', 'coffee', 'word', 'food']],
  },
};
const LANG_ORDER = ['ja', 'zh', 'ko', 'fr', 'es', 'de'];

// Blank projects: your own terms and definitions (no dictionary, letters or audio)
const BLANK = {
  name: 'Blank', blank: true, latin: true, tts: '', voice: /^$/, voiceName: '', handwriting: false, accents: [],
  lettersTab: '', lettersWord: null, dict: '', readingLabel: '', wordPlaceholder: 'e.g. mitochondrion',
  searchHint: '', sortLabel: 'A–Z (terms)',
  bulkPlaceholder: 'mitochondrion | the part of a cell that makes energy\nosmosis | movement of water across a membrane | Unit 1',
  samples: [['mitochondrion', '', 'the part of a cell that makes energy', 'word', 'Biology'],
    ['osmosis', '', 'movement of water across a semi-permeable membrane', 'word', 'Biology'],
    ['photosynthesis', '', 'how plants turn light into chemical energy', 'word', 'Biology']],
};
const typeInfo = type => type === 'blank' ? BLANK : LANGS[type];

/* The project on screen: {id, type, name}. Projects made before projects existed keep their old
   storage: id "ja" (the original notebook) and ids "zh", "ko", "fr", "es", "de" (one per language). */
let PROJECT = { id: 'ja', type: 'ja', name: 'Japanese' };
try {
  const forced = new URLSearchParams(location.search).get('lang'); // ?lang=fr opens that language's original project
  const cur = JSON.parse(localStorage.getItem('jn.current') || 'null');
  const legacy = localStorage.getItem('jn.lang');
  if (LANGS[forced]) PROJECT = { id: forced, type: forced, name: LANGS[forced].name };
  else if (cur?.id && typeInfo(cur.type)) PROJECT = cur;
  else if (LANGS[legacy]) PROJECT = { id: legacy, type: legacy, name: LANGS[legacy].name };
} catch {}
const LANG = PROJECT.type; // 'ja' … 'de', or 'blank'
const L = typeInfo(LANG);
// Per-project storage keys; the original notebooks keep their keys so nothing has to move
const lkey = (k, id = PROJECT.id) => id === 'ja' ? `jn.${k}` : LANGS[id] ? `jn.${id}.${k}` : `jn.p.${id}.${k}`;

/* Letter charts for the Letters / Hangul tab (Japanese kana live in index.html).
   Strict JSON between the markers: make-letter-audio.py reads it to record audio/<lang>/<id>.m4a.
   k: shown letter(s), r: sound hint, say: what the voice reads, id: audio file name.
   For French and German, only the first group counts as "special letters" for flashcards. */
const LETTERS = /*LETTERS-JSON*/{
  "ko": [
    {"title": "Basic consonants", "cols": 5, "items": [
      {"k": "ㄱ", "r": "g / k", "say": "가", "id": "g"}, {"k": "ㄴ", "r": "n", "say": "나", "id": "n"}, {"k": "ㄷ", "r": "d / t", "say": "다", "id": "d"},
      {"k": "ㄹ", "r": "r / l", "say": "라", "id": "r"}, {"k": "ㅁ", "r": "m", "say": "마", "id": "m"}, {"k": "ㅂ", "r": "b / p", "say": "바", "id": "b"},
      {"k": "ㅅ", "r": "s", "say": "사", "id": "s"}, {"k": "ㅇ", "r": "silent / ng", "say": "아", "id": "ng"}, {"k": "ㅈ", "r": "j", "say": "자", "id": "j"},
      {"k": "ㅊ", "r": "ch", "say": "차", "id": "ch"}, {"k": "ㅋ", "r": "k", "say": "카", "id": "k"}, {"k": "ㅌ", "r": "t", "say": "타", "id": "t"},
      {"k": "ㅍ", "r": "p", "say": "파", "id": "p"}, {"k": "ㅎ", "r": "h", "say": "하", "id": "h"}]},
    {"title": "Double consonants", "cols": 5, "items": [
      {"k": "ㄲ", "r": "kk", "say": "까", "id": "kk"}, {"k": "ㄸ", "r": "tt", "say": "따", "id": "tt"}, {"k": "ㅃ", "r": "pp", "say": "빠", "id": "pp"},
      {"k": "ㅆ", "r": "ss", "say": "싸", "id": "ss"}, {"k": "ㅉ", "r": "jj", "say": "짜", "id": "jj"}]},
    {"title": "Basic vowels", "cols": 5, "items": [
      {"k": "ㅏ", "r": "a", "say": "아", "id": "a"}, {"k": "ㅑ", "r": "ya", "say": "야", "id": "ya"}, {"k": "ㅓ", "r": "eo", "say": "어", "id": "eo"},
      {"k": "ㅕ", "r": "yeo", "say": "여", "id": "yeo"}, {"k": "ㅗ", "r": "o", "say": "오", "id": "o"}, {"k": "ㅛ", "r": "yo", "say": "요", "id": "yo"},
      {"k": "ㅜ", "r": "u", "say": "우", "id": "u"}, {"k": "ㅠ", "r": "yu", "say": "유", "id": "yu"}, {"k": "ㅡ", "r": "eu", "say": "으", "id": "eu"},
      {"k": "ㅣ", "r": "i", "say": "이", "id": "i"}]},
    {"title": "Compound vowels", "cols": 5, "items": [
      {"k": "ㅐ", "r": "ae", "say": "애", "id": "ae"}, {"k": "ㅒ", "r": "yae", "say": "얘", "id": "yae"}, {"k": "ㅔ", "r": "e", "say": "에", "id": "e"},
      {"k": "ㅖ", "r": "ye", "say": "예", "id": "ye"}, {"k": "ㅘ", "r": "wa", "say": "와", "id": "wa"}, {"k": "ㅙ", "r": "wae", "say": "왜", "id": "wae"},
      {"k": "ㅚ", "r": "oe", "say": "외", "id": "oe"}, {"k": "ㅝ", "r": "wo", "say": "워", "id": "wo"}, {"k": "ㅞ", "r": "we", "say": "웨", "id": "we"},
      {"k": "ㅟ", "r": "wi", "say": "위", "id": "wi"}, {"k": "ㅢ", "r": "ui", "say": "의", "id": "ui"}]}
  ],
  "zh": [
    {"title": "Tones", "cols": 5, "items": [
      {"k": "mā", "r": "1st: high, flat · 妈 mum", "say": "妈", "id": "tone1"}, {"k": "má", "r": "2nd: rising · 麻 hemp", "say": "麻", "id": "tone2"},
      {"k": "mǎ", "r": "3rd: dips, then rises · 马 horse", "say": "马", "id": "tone3"}, {"k": "mà", "r": "4th: falling · 骂 scold", "say": "骂", "id": "tone4"},
      {"k": "ma", "r": "neutral: light, short · 吗 (question)", "say": "吗", "id": "tone5"}]},
    {"title": "Initials", "cols": 5, "items": [
      {"k": "b", "r": "bō 波", "say": "波", "id": "i-b"}, {"k": "p", "r": "pō 坡", "say": "坡", "id": "i-p"}, {"k": "m", "r": "mō 摸", "say": "摸", "id": "i-m"},
      {"k": "f", "r": "fó 佛", "say": "佛", "id": "i-f"}, {"k": "d", "r": "dé 得", "say": "得", "id": "i-d"}, {"k": "t", "r": "tè 特", "say": "特", "id": "i-t"},
      {"k": "n", "r": "nà 那", "say": "那", "id": "i-n"}, {"k": "l", "r": "lā 拉", "say": "拉", "id": "i-l"}, {"k": "g", "r": "gē 哥", "say": "哥", "id": "i-g"},
      {"k": "k", "r": "kē 科", "say": "科", "id": "i-k"}, {"k": "h", "r": "hē 喝", "say": "喝", "id": "i-h"}, {"k": "j", "r": "jī 鸡", "say": "鸡", "id": "i-j"},
      {"k": "q", "r": "“ch” · qī 七", "say": "七", "id": "i-q"}, {"k": "x", "r": "“sh” · xī 西", "say": "西", "id": "i-x"}, {"k": "zh", "r": "zhī 知", "say": "知", "id": "i-zh"},
      {"k": "ch", "r": "chī 吃", "say": "吃", "id": "i-ch"}, {"k": "sh", "r": "shī 诗", "say": "诗", "id": "i-sh"}, {"k": "r", "r": "rì 日", "say": "日", "id": "i-r"},
      {"k": "z", "r": "“dz” · zī 资", "say": "资", "id": "i-z"}, {"k": "c", "r": "“ts” · cí 词", "say": "词", "id": "i-c"}, {"k": "s", "r": "sī 思", "say": "思", "id": "i-s"}]},
    {"title": "Finals", "cols": 4, "items": [
      {"k": "a", "r": "ā 啊", "say": "啊", "id": "f-a"}, {"k": "o", "r": "ó 哦", "say": "哦", "id": "f-o"}, {"k": "e", "r": "é 鹅", "say": "鹅", "id": "f-e"},
      {"k": "i", "r": "yī 衣", "say": "衣", "id": "f-i"}, {"k": "u", "r": "wū 乌", "say": "乌", "id": "f-u"}, {"k": "ü", "r": "yú 鱼", "say": "鱼", "id": "f-v"},
      {"k": "ai", "r": "ài 爱", "say": "爱", "id": "f-ai"}, {"k": "ei", "r": "běi 北", "say": "北", "id": "f-ei"}, {"k": "ao", "r": "hǎo 好", "say": "好", "id": "f-ao"},
      {"k": "ou", "r": "gǒu 狗", "say": "狗", "id": "f-ou"}, {"k": "an", "r": "ān 安", "say": "安", "id": "f-an"}, {"k": "en", "r": "ēn 恩", "say": "恩", "id": "f-en"},
      {"k": "ang", "r": "áng 昂", "say": "昂", "id": "f-ang"}, {"k": "eng", "r": "lěng 冷", "say": "冷", "id": "f-eng"}, {"k": "ong", "r": "hóng 红", "say": "红", "id": "f-ong"},
      {"k": "er", "r": "èr 二", "say": "二", "id": "f-er"}]}
  ],
  "es": [
    {"title": "Special letters", "cols": 4, "items": [
      {"k": "á", "r": "stressed “a” · está", "say": "está", "id": "a-acute"}, {"k": "é", "r": "stressed “e” · café", "say": "café", "id": "e-acute"},
      {"k": "í", "r": "stressed “ee” · día", "say": "día", "id": "i-acute"}, {"k": "ó", "r": "stressed “o” · adiós", "say": "adiós", "id": "o-acute"},
      {"k": "ú", "r": "stressed “oo” · menú", "say": "menú", "id": "u-acute"}, {"k": "ñ", "r": "“ny” · niño", "say": "niño", "id": "enye"},
      {"k": "ü", "r": "“w” sound · pingüino", "say": "pingüino", "id": "u-umlaut"}, {"k": "¿", "r": "starts a question · ¿Qué?", "say": "¿Qué?", "id": "question"},
      {"k": "¡", "r": "starts an exclamation · ¡Hola!", "say": "¡Hola!", "id": "exclamation"}]},
    {"title": "Letter combinations", "cols": 4, "items": [
      {"k": "ll", "r": "“y” · llamar", "say": "llamar", "id": "ll"}, {"k": "rr", "r": "rolled r · perro", "say": "perro", "id": "rr"},
      {"k": "r", "r": "tapped r · pero", "say": "pero", "id": "r"}, {"k": "ch", "r": "“ch” · chico", "say": "chico", "id": "ch"},
      {"k": "j", "r": "throaty “h” · jamón", "say": "jamón", "id": "j"}, {"k": "h", "r": "silent · hola", "say": "hola", "id": "h"},
      {"k": "z", "r": "“s” · zapato", "say": "zapato", "id": "z"}, {"k": "ce ci", "r": "“s” · cine", "say": "cine", "id": "ce"},
      {"k": "ge gi", "r": "throaty “h” · gente", "say": "gente", "id": "ge"}, {"k": "qu", "r": "“k” · queso", "say": "queso", "id": "qu"},
      {"k": "gu", "r": "“g” before e/i · guitarra", "say": "guitarra", "id": "gu"}, {"k": "v", "r": "like “b” · vaca", "say": "vaca", "id": "v"}]}
  ],
  "fr": [
    {"title": "Special letters", "cols": 4, "items": [
      {"k": "é", "r": "“ay” · été", "say": "été", "id": "e-acute"}, {"k": "è", "r": "“eh” · père", "say": "père", "id": "e-grave"},
      {"k": "ê", "r": "“eh” · fête", "say": "fête", "id": "e-circ"}, {"k": "ë", "r": "said separately · Noël", "say": "Noël", "id": "e-trema"},
      {"k": "à", "r": "“a” · là", "say": "là", "id": "a-grave"}, {"k": "â", "r": "“ah” · pâte", "say": "pâte", "id": "a-circ"},
      {"k": "ç", "r": "“s” · garçon", "say": "garçon", "id": "c-cedille"}, {"k": "î", "r": "“ee” · île", "say": "île", "id": "i-circ"},
      {"k": "ï", "r": "said separately · maïs", "say": "maïs", "id": "i-trema"}, {"k": "ô", "r": "“oh” · hôtel", "say": "hôtel", "id": "o-circ"},
      {"k": "û", "r": "“u” · sûr", "say": "sûr", "id": "u-circ"}, {"k": "ù", "r": "“u” · où", "say": "où", "id": "u-grave"},
      {"k": "œ", "r": "“eu” · cœur", "say": "cœur", "id": "oe"}]},
    {"title": "Letter combinations", "cols": 4, "items": [
      {"k": "ou", "r": "“oo” · vous", "say": "vous", "id": "ou"}, {"k": "oi", "r": "“wa” · moi", "say": "moi", "id": "oi"},
      {"k": "ai", "r": "“eh” · lait", "say": "lait", "id": "ai"}, {"k": "eu", "r": "“uh” · deux", "say": "deux", "id": "eu"},
      {"k": "au", "r": "“oh” · chaud", "say": "chaud", "id": "au"}, {"k": "eau", "r": "“oh” · beau", "say": "beau", "id": "eau"},
      {"k": "u", "r": "“ee” with round lips · tu", "say": "tu", "id": "u"}, {"k": "on", "r": "nasal “on” · bon", "say": "bon", "id": "on"},
      {"k": "an", "r": "nasal “ahn” · dans", "say": "dans", "id": "an"}, {"k": "en", "r": "nasal “ahn” · enfant", "say": "enfant", "id": "en"},
      {"k": "in", "r": "nasal “an” · vin", "say": "vin", "id": "in"}, {"k": "un", "r": "nasal “un” · brun", "say": "brun", "id": "un"},
      {"k": "ch", "r": "“sh” · chat", "say": "chat", "id": "ch"}, {"k": "gn", "r": "“ny” · montagne", "say": "montagne", "id": "gn"},
      {"k": "qu", "r": "“k” · qui", "say": "qui", "id": "qu"}, {"k": "ill", "r": "“y” · fille", "say": "fille", "id": "ill"},
      {"k": "h", "r": "silent · homme", "say": "homme", "id": "h"}, {"k": "r", "r": "throaty r · rouge", "say": "rouge", "id": "r"}]}
  ],
  "de": [
    {"title": "Special letters", "cols": 4, "items": [
      {"k": "ä", "r": "“eh” · Bär", "say": "Bär", "id": "a-umlaut"}, {"k": "ö", "r": "“ur”, round lips · schön", "say": "schön", "id": "o-umlaut"},
      {"k": "ü", "r": "“ee”, round lips · über", "say": "über", "id": "u-umlaut"}, {"k": "ß", "r": "“ss” · Straße", "say": "Straße", "id": "eszett"}]},
    {"title": "Letter combinations", "cols": 4, "items": [
      {"k": "ei", "r": "“eye” · Wein", "say": "Wein", "id": "ei"}, {"k": "ie", "r": "“ee” · Liebe", "say": "Liebe", "id": "ie"},
      {"k": "eu", "r": "“oy” · heute", "say": "heute", "id": "eu"}, {"k": "äu", "r": "“oy” · Häuser", "say": "Häuser", "id": "aeu"},
      {"k": "au", "r": "“ow” · Haus", "say": "Haus", "id": "au"}, {"k": "ch", "r": "soft · ich / throaty · Buch", "say": "ich, Buch", "id": "ch"},
      {"k": "sch", "r": "“sh” · Schule", "say": "Schule", "id": "sch"}, {"k": "sp", "r": "“shp” at the start · Sport", "say": "Sport", "id": "sp"},
      {"k": "st", "r": "“sht” at the start · Stadt", "say": "Stadt", "id": "st"}, {"k": "z", "r": "“ts” · Zeit", "say": "Zeit", "id": "z"},
      {"k": "w", "r": "“v” · Wasser", "say": "Wasser", "id": "w"}, {"k": "v", "r": "“f” · Vater", "say": "Vater", "id": "v"},
      {"k": "j", "r": "“y” · ja", "say": "ja", "id": "j"}, {"k": "s", "r": "“z” before a vowel · Sonne", "say": "Sonne", "id": "s"},
      {"k": "r", "r": "throaty r · rot", "say": "rot", "id": "r"}, {"k": "pf", "r": "“pf” · Apfel", "say": "Apfel", "id": "pf"},
      {"k": "tsch", "r": "“ch” · Deutsch", "say": "Deutsch", "id": "tsch"}, {"k": "ck", "r": "“k” · Brücke", "say": "Brücke", "id": "ck"}]}
  ]
}/*END-LETTERS-JSON*/;

/* ---------- text helpers per language ---------- */
// French/German: compare without accents or case (ecole → école, strasse → Straße)
const fold = s => String(s || '').toLowerCase().replace(/ß/g, 'ss').replace(/œ/g, 'oe').replace(/æ/g, 'ae')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`´]/g, "'");
// German typed without umlauts: mueller → muller (fold already turns ü into u)
const collapseUmlauts = s => s.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
const ARTICLE = /^(le|la|les|l'|l’|un|une|des|der|die|das|ein|eine|einen|dem|den|el|los|las|unos|unas)\s*/i;
const stripArticle = s => String(s || '').replace(ARTICLE, '');

// Korean: Hangul → Revised Romanization (with the common sound changes), for search and readings
const KO_L = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const KO_V = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const KO_T = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
const KO_LIAISON = { 1: 0, 2: 1, 4: 2, 7: 3, 8: 5, 16: 6, 17: 7, 19: 9, 20: 10, 22: 12, 23: 14, 24: 15, 25: 16, 26: 17 };
function romanizeKo(s) {
  const syl = [...String(s || '')].map(ch => {
    const c = ch.charCodeAt(0) - 0xac00;
    return c >= 0 && c < 11172 ? { l: Math.floor(c / 588), v: Math.floor((c % 588) / 28), t: c % 28 } : { raw: ch };
  });
  let out = '';
  syl.forEach((x, i) => {
    if (x.raw) { out += x.raw; return; }
    const next = syl[i + 1];
    let l = KO_L[x.l], t = KO_T[x.t];
    if (x.prevMoved) l = x.prevMoved;
    if (next && !next.raw && x.t) {
      if (next.l === 11 && KO_LIAISON[x.t] != null) { next.prevMoved = KO_L[KO_LIAISON[x.t]] || 'l'; t = ''; } // 한국어 → hangugeo
      else if (next.l === 11 && x.t === 27) t = '';                                                          // ㅎ before a vowel is silent
      else if (next.l === 2 || next.l === 6) t = { k: 'ng', t: 'n', p: 'm', l: 'l' }[t] ?? t;              // 합니다 → hamnida
      if (x.t === 8 && next.l === 2) next.prevMoved = 'l';                                                     // ㄹ+ㄴ → ll
      if (x.t === 4 && next.l === 5) { t = 'l'; next.prevMoved = 'l'; }                                        // ㄴ+ㄹ → ll
    }
    out += l + KO_V[x.v] + t;
  });
  return out;
}
// Hangul syllables → letters (jamo), for the letter cards and "In your notebook" lists
const KO_L_JAMO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', KO_V_JAMO = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
const KO_T_JAMO = ['', 'ㄱ', 'ㄲ', '', 'ㄴ', '', '', 'ㄷ', 'ㄹ', '', '', '', '', '', '', '', 'ㅁ', 'ㅂ', '', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
function hangulJamo(s) {
  const out = [];
  for (const ch of String(s || '')) {
    const c = ch.charCodeAt(0) - 0xac00;
    if (c < 0 || c >= 11172) { if (/[ㄱ-ㆎ]/.test(ch)) out.push(ch); continue; }
    out.push(KO_L_JAMO[Math.floor(c / 588)], KO_V_JAMO[Math.floor((c % 588) / 28)]);
    if (KO_T_JAMO[c % 28]) out.push(KO_T_JAMO[c % 28]);
  }
  return out;
}
// Loose romanization for search: g/k, d/t, b/p, r/l and apostrophes don't matter
const looseRoman = s => s.toLowerCase().replace(/[^a-z]/g, '').replace(/k/g, 'g').replace(/t/g, 'd').replace(/p/g, 'b').replace(/l/g, 'r');

// Chinese: "ni3 hao3" → "nǐ hǎo" (CC-CEDICT style tone numbers), and toneless pinyin for search
const TONE_MARKS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ' };
function pinyinMarks(s) {
  return String(s || '').split(/\s+/).map(syl => {
    const m = syl.match(/^([a-zA-ZüÜ:]+)([1-5])$/);
    if (!m) return syl;
    const base = m[1].replace(/u:|v/g, 'ü').replace(/U:|V/g, 'Ü'), tone = +m[2];
    if (tone === 5) return base;
    const low = base.toLowerCase();
    // tone mark goes on a or e; on the o of "ou"; otherwise on the last vowel
    let i = low.indexOf('a');
    if (i < 0) i = low.indexOf('e');
    if (i < 0 && low.includes('ou')) i = low.indexOf('o');
    if (i < 0) for (let k = low.length - 1; k >= 0; k--) if ('aeiouü'.includes(low[k])) { i = k; break; }
    if (i < 0) return base;
    const mark = TONE_MARKS[low[i]][tone - 1];
    return base.slice(0, i) + (base[i] !== low[i] ? mark.toUpperCase() : mark) + base.slice(i + 1);
  }).join(' ');
}
// "nǐ hǎo", "ni3 hao3", "nihao", "lü"/"lv" → "nihao" / "lu"
const plainPinyin = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/u:|v/g, 'u').replace(/[^a-z]/g, '');

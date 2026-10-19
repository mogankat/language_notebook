/* Starter phrases for language projects, grouped into topics that become tags.
   Each row: English meaning, then per language [text, reading]. Readings: romaji (Japanese),
   pinyin (Chinese), Revised Romanization (Korean); none for French, Spanish and German.
   A language left out of a row skips it (e.g. French "Bonjour" already covers "Good morning"). */

const STARTER = [
  { tag: 'Greetings', rows: [
    { en: 'Hello', ja: ['こんにちは', 'konnichiwa'], zh: ['你好', 'nǐ hǎo'], ko: ['안녕하세요', 'annyeonghaseyo'], fr: ['Bonjour'], es: ['Hola'], de: ['Hallo'] },
    { en: 'Good morning', ja: ['おはようございます', 'ohayou gozaimasu'], zh: ['早上好', 'zǎoshang hǎo'], ko: ['좋은 아침이에요', 'joeun achimieyo'], es: ['Buenos días'], de: ['Guten Morgen'] },
    { en: 'Good evening', ja: ['こんばんは', 'konbanwa'], zh: ['晚上好', 'wǎnshang hǎo'], fr: ['Bonsoir'], es: ['Buenas tardes'], de: ['Guten Abend'] },
    { en: 'Good night', ja: ['おやすみなさい', 'oyasuminasai'], zh: ['晚安', 'wǎn’ān'], ko: ['안녕히 주무세요', 'annyeonghi jumuseyo'], fr: ['Bonne nuit'], es: ['Buenas noches'], de: ['Gute Nacht'] },
    { en: 'Goodbye', ja: ['さようなら', 'sayounara'], zh: ['再见', 'zàijiàn'], ko: ['안녕히 가세요', 'annyeonghi gaseyo'], fr: ['Au revoir'], es: ['Adiós'], de: ['Auf Wiedersehen'] },
    { en: 'See you later', ja: ['またね', 'mata ne'], zh: ['回头见', 'huítóu jiàn'], ko: ['나중에 봐요', 'najunge bwayo'], fr: ['À plus tard'], es: ['Hasta luego'], de: ['Bis später'] },
    { en: 'Nice to meet you', ja: ['はじめまして', 'hajimemashite'], zh: ['很高兴认识你', 'hěn gāoxìng rènshi nǐ'], ko: ['만나서 반가워요', 'mannaseo bangawoyo'], fr: ['Enchanté'], es: ['Mucho gusto'], de: ['Freut mich'] },
    { en: 'My name is …', ja: ['私の名前は…です', 'watashi no namae wa … desu'], zh: ['我叫…', 'wǒ jiào …'], ko: ['제 이름은 …입니다', 'je ireumeun … imnida'], fr: ['Je m’appelle …'], es: ['Me llamo …'], de: ['Ich heiße …'] },
    { en: 'What’s your name?', ja: ['お名前は何ですか', 'onamae wa nan desu ka'], zh: ['你叫什么名字？', 'nǐ jiào shénme míngzi?'], ko: ['이름이 뭐예요?', 'ireumi mwoyeyo?'], fr: ['Comment vous appelez-vous ?'], es: ['¿Cómo se llama?'], de: ['Wie heißen Sie?'] },
    { en: 'Thank you', ja: ['ありがとうございます', 'arigatou gozaimasu'], zh: ['谢谢', 'xièxie'], ko: ['감사합니다', 'gamsahamnida'], fr: ['Merci'], es: ['Gracias'], de: ['Danke'] },
    { en: 'You’re welcome', ja: ['どういたしまして', 'douitashimashite'], zh: ['不客气', 'bú kèqi'], ko: ['천만에요', 'cheonmaneyo'], fr: ['De rien'], es: ['De nada'], de: ['Bitte schön'] },
    { en: 'Excuse me', ja: ['すみません', 'sumimasen'], zh: ['不好意思', 'bù hǎoyìsi'], ko: ['실례합니다', 'sillyehamnida'], fr: ['Excusez-moi'], es: ['Disculpe'], de: ['Entschuldigung'] },
    { en: 'Yes', ja: ['はい', 'hai'], zh: ['是', 'shì'], ko: ['네', 'ne'], fr: ['Oui'], es: ['Sí'], de: ['Ja'] },
    { en: 'No', ja: ['いいえ', 'iie'], zh: ['不是', 'bú shì'], ko: ['아니요', 'aniyo'], fr: ['Non'], es: ['No'], de: ['Nein'] },
  ] },
  { tag: 'How are you', rows: [
    { en: 'How are you?', ja: ['お元気ですか', 'ogenki desu ka'], zh: ['你好吗？', 'nǐ hǎo ma?'], ko: ['어떻게 지내세요?', 'eotteoke jinaeseyo?'], fr: ['Comment allez-vous ?'], es: ['¿Cómo estás?'], de: ['Wie geht es Ihnen?'] },
    { en: 'I’m well', ja: ['元気です', 'genki desu'], zh: ['我很好', 'wǒ hěn hǎo'], ko: ['잘 지내요', 'jal jinaeyo'], fr: ['Je vais bien'], es: ['Estoy bien'], de: ['Mir geht es gut'] },
    { en: 'And you?', ja: ['あなたは？', 'anata wa?'], zh: ['你呢？', 'nǐ ne?'], ko: ['당신은요?', 'dangsineunyo?'], fr: ['Et vous ?'], es: ['¿Y tú?'], de: ['Und Ihnen?'] },
    { en: 'Not so good', ja: ['あまり元気じゃないです', 'amari genki ja nai desu'], zh: ['不太好', 'bú tài hǎo'], ko: ['별로 안 좋아요', 'byeollo an joayo'], fr: ['Pas très bien'], es: ['No muy bien'], de: ['Nicht so gut'] },
    { en: 'I’m sick', ja: ['具合が悪いです', 'guai ga warui desu'], zh: ['我病了', 'wǒ bìng le'], ko: ['아파요', 'apayo'], fr: ['Je suis malade'], es: ['Estoy enfermo'], de: ['Ich bin krank'] },
    { en: 'I’m hungry', ja: ['お腹がすきました', 'onaka ga sukimashita'], zh: ['我饿了', 'wǒ è le'], ko: ['배고파요', 'baegopayo'], fr: ['J’ai faim'], es: ['Tengo hambre'], de: ['Ich habe Hunger'] },
    { en: 'I’m thirsty', ja: ['喉が渇きました', 'nodo ga kawakimashita'], zh: ['我渴了', 'wǒ kě le'], ko: ['목말라요', 'mongmallayo'], fr: ['J’ai soif'], es: ['Tengo sed'], de: ['Ich habe Durst'] },
    { en: 'I’m tired', ja: ['疲れました', 'tsukaremashita'], zh: ['我累了', 'wǒ lèi le'], ko: ['피곤해요', 'pigonhaeyo'], fr: ['Je suis fatigué'], es: ['Estoy cansado'], de: ['Ich bin müde'] },
  ] },
  { tag: 'Directions', rows: [
    { en: 'Where is …?', ja: ['…はどこですか', '… wa doko desu ka'], zh: ['…在哪里？', '… zài nǎlǐ?'], ko: ['…이/가 어디예요?', '… i/ga eodiyeyo?'], fr: ['Où est … ?'], es: ['¿Dónde está …?'], de: ['Wo ist …?'] },
    { en: 'Where is the bathroom?', ja: ['トイレはどこですか', 'toire wa doko desu ka'], zh: ['洗手间在哪里？', 'xǐshǒujiān zài nǎlǐ?'], ko: ['화장실이 어디예요?', 'hwajangsiri eodiyeyo?'], fr: ['Où sont les toilettes ?'], es: ['¿Dónde está el baño?'], de: ['Wo ist die Toilette?'] },
    { en: 'bathroom', ja: ['トイレ', 'toire'], zh: ['洗手间', 'xǐshǒujiān'], ko: ['화장실', 'hwajangsil'], fr: ['les toilettes'], es: ['el baño'], de: ['die Toilette'] },
    { en: 'hotel', ja: ['ホテル', 'hoteru'], zh: ['酒店', 'jiǔdiàn'], ko: ['호텔', 'hotel'], fr: ['l’hôtel'], es: ['el hotel'], de: ['das Hotel'] },
    { en: 'street', ja: ['通り', 'toori'], zh: ['街', 'jiē'], ko: ['거리', 'geori'], fr: ['la rue'], es: ['la calle'], de: ['die Straße'] },
    { en: 'hospital', ja: ['病院', 'byouin'], zh: ['医院', 'yīyuàn'], ko: ['병원', 'byeongwon'], fr: ['l’hôpital'], es: ['el hospital'], de: ['das Krankenhaus'] },
    { en: 'embassy', ja: ['大使館', 'taishikan'], zh: ['大使馆', 'dàshǐguǎn'], ko: ['대사관', 'daesagwan'], fr: ['l’ambassade'], es: ['la embajada'], de: ['die Botschaft'] },
    { en: 'train station', ja: ['駅', 'eki'], zh: ['火车站', 'huǒchēzhàn'], ko: ['기차역', 'gichayeok'], fr: ['la gare'], es: ['la estación de tren'], de: ['der Bahnhof'] },
    { en: 'airport', ja: ['空港', 'kuukou'], zh: ['机场', 'jīchǎng'], ko: ['공항', 'gonghang'], fr: ['l’aéroport'], es: ['el aeropuerto'], de: ['der Flughafen'] },
    { en: 'restaurant', ja: ['レストラン', 'resutoran'], zh: ['餐厅', 'cāntīng'], ko: ['식당', 'sikdang'], fr: ['le restaurant'], es: ['el restaurante'], de: ['das Restaurant'] },
    { en: 'pharmacy', ja: ['薬局', 'yakkyoku'], zh: ['药店', 'yàodiàn'], ko: ['약국', 'yakguk'], fr: ['la pharmacie'], es: ['la farmacia'], de: ['die Apotheke'] },
    { en: 'police station', ja: ['交番', 'kouban'], zh: ['警察局', 'jǐngchájú'], ko: ['경찰서', 'gyeongchalseo'], fr: ['le commissariat'], es: ['la comisaría'], de: ['die Polizeiwache'] },
    { en: 'left', ja: ['左', 'hidari'], zh: ['左边', 'zuǒbian'], ko: ['왼쪽', 'oenjjok'], fr: ['à gauche'], es: ['a la izquierda'], de: ['links'] },
    { en: 'right', ja: ['右', 'migi'], zh: ['右边', 'yòubian'], ko: ['오른쪽', 'oreunjjok'], fr: ['à droite'], es: ['a la derecha'], de: ['rechts'] },
    { en: 'straight ahead', ja: ['まっすぐ', 'massugu'], zh: ['一直走', 'yìzhí zǒu'], ko: ['직진', 'jikjin'], fr: ['tout droit'], es: ['todo recto'], de: ['geradeaus'] },
    { en: 'I’m lost', ja: ['道に迷いました', 'michi ni mayoimashita'], zh: ['我迷路了', 'wǒ mílù le'], ko: ['길을 잃었어요', 'gireul ileosseoyo'], fr: ['Je suis perdu'], es: ['Estoy perdido'], de: ['Ich habe mich verlaufen'] },
  ] },
  { tag: 'Shopping', rows: [
    { en: 'How much does it cost?', ja: ['いくらですか', 'ikura desu ka'], zh: ['多少钱？', 'duōshao qián?'], ko: ['얼마예요?', 'eolmayeyo?'], fr: ['Combien ça coûte ?'], es: ['¿Cuánto cuesta?'], de: ['Wie viel kostet das?'] },
    { en: 'That’s too expensive', ja: ['高すぎます', 'takasugimasu'], zh: ['太贵了', 'tài guì le'], ko: ['너무 비싸요', 'neomu bissayo'], fr: ['C’est trop cher'], es: ['Es demasiado caro'], de: ['Das ist zu teuer'] },
    { en: 'I’d like this, please', ja: ['これをください', 'kore o kudasai'], zh: ['我要这个', 'wǒ yào zhège'], ko: ['이거 주세요', 'igeo juseyo'], fr: ['Je voudrais ceci, s’il vous plaît'], es: ['Quiero esto, por favor'], de: ['Ich möchte das, bitte'] },
    { en: 'Do you have …?', ja: ['…はありますか', '… wa arimasu ka'], zh: ['有…吗？', 'yǒu … ma?'], ko: ['…있어요?', '… isseoyo?'], fr: ['Avez-vous … ?'], es: ['¿Tiene …?'], de: ['Haben Sie …?'] },
    { en: 'Do you take credit cards?', ja: ['クレジットカードは使えますか', 'kurejitto kaado wa tsukaemasu ka'], zh: ['可以刷卡吗？', 'kěyǐ shuākǎ ma?'], ko: ['카드 돼요?', 'kadeu dwaeyo?'], fr: ['Vous acceptez les cartes ?'], es: ['¿Aceptan tarjeta?'], de: ['Kann ich mit Karte zahlen?'] },
    { en: 'The bill, please', ja: ['お会計お願いします', 'okaikei onegaishimasu'], zh: ['买单', 'mǎidān'], ko: ['계산서 주세요', 'gyesanseo juseyo'], fr: ['L’addition, s’il vous plaît'], es: ['La cuenta, por favor'], de: ['Die Rechnung, bitte'] },
    { en: 'I’m just looking', ja: ['見ているだけです', 'mite iru dake desu'], zh: ['我只是看看', 'wǒ zhǐshì kànkan'], ko: ['그냥 구경하는 거예요', 'geunyang gugyeonghaneun geoyeyo'], fr: ['Je regarde seulement'], es: ['Solo estoy mirando'], de: ['Ich schaue nur'] },
    { en: 'money', ja: ['お金', 'okane'], zh: ['钱', 'qián'], ko: ['돈', 'don'], fr: ['l’argent'], es: ['el dinero'], de: ['das Geld'] },
    { en: 'cheap', ja: ['安い', 'yasui'], zh: ['便宜', 'piányi'], ko: ['싸요', 'ssayo'], fr: ['bon marché'], es: ['barato'], de: ['billig'] },
  ] },
];

// Starter phrases of the chosen topics as notebook entries for a language
function starterWords(lang, tags = STARTER.map(t => t.tag)) {
  const out = [], t0 = Date.now();
  for (const topic of STARTER) {
    if (!tags.includes(topic.tag)) continue;
    for (const row of topic.rows) {
      const v = row[lang];
      if (!v) continue;
      out.push({
        id: uid(), added: t0 + out.length, jp: v[0], reading: v[1] || '', meaning: row.en,
        type: /^[A-Z]/.test(row.en) ? 'phrase' : 'word', // "Hello", "Where is …?" are phrases; "hotel", "left" are words
        tags: [topic.tag], notes: '',
      });
    }
  }
  return out;
}

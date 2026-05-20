// Vercel Serverless Function — Caption Generator Proxy
// Caption → nous/deepseek/deepseek-v4-flash (via gateway-api.dkzhen.org)
// Image → manual URL dari user (ditampilkan, bukan digenerate)

const CAPTION_API_BASE = process.env.CAPTION_API_BASE_DS || 'https://gateway-api.dkzhen.org/v1';
const CAPTION_API_KEY = process.env.CAPTION_API_KEY_DS;
const CAPTION_MODEL = process.env.CAPTION_MODEL_DS || 'nous/deepseek/deepseek-v4-flash';

const SYSTEM_PROMPTS = {
  review: `Kamu asisten pembuat caption Threads untuk produk afiliasi lintas kategori.
GAYA: cerita personal, hook pembuka relatable, pengalaman pribadi, trus ke solusi produk.
Bahasa Indonesia santai anak muda, pake emoji secukupnya.
Tonjolin keunggulan produk yang relevan (misalnya kualitas, fungsi, hasil pakai, kenyamanan, harga, atau value).
Jika input menyebut kategori spesifik, fokuskan caption ke kategori itu. Jika tidak, tetap relevan secara umum lintas produk.
Maks 200 kata. Akhiri dengan ajakan klik link di bio.`,

  rekomendasi: `Kamu asisten pembuat caption Threads rekomendasi produk lintas kategori.
GAYA: kayak ngerekomendasiin ke temen sendiri. Bahasa santai, personal.
Sertakan alasan kenapa produk ini recommended + testimoni singkat.
Jika input menyebut kategori spesifik, fokuskan caption ke kategori itu. Jika tidak, tetap relevan secara umum lintas produk.
Maks 200 kata. Akhiri dengan link di bio.`,

  unboxing: `Kamu asisten pembuat caption Threads unboxing produk.
Ceritakan kesan pertama: packaging, build/tekstur, detail utama, first impression.
Gaya antusias, engaging, pake emoji.
Jika input menyebut kategori spesifik, fokuskan caption ke kategori itu. Jika tidak, tetap relevan secara umum lintas produk.
Maks 200 kata.`,

  tips: `Kamu asisten pembuat caption Threads berisi tips terkait produk.
Beri tips bermanfaat yg relate dengan produk ini.
Gaya santai informatif, pake emoji.
Jika input menyebut kategori spesifik, fokuskan caption ke kategori itu. Jika tidak, tetap relevan secara umum lintas produk.
Maks 200 kata.`,

  'skincare-routine': `Kamu asisten pembuat caption Threads tema rutinitas pemakaian produk.
Jelaskan langkah pemakaian harian yg mencakup produk ini secara fleksibel sesuai konteks kategori.
Gaya personal story, pake emoji.
Jika input menyebut kategori spesifik, fokuskan caption ke kategori itu. Jika tidak, tetap relevan secara umum lintas produk.
Maks 200 kata.`,

  hemat: `Kamu asisten pembuat caption Threads tema hemat/budget friendly.
Tekanin produk bagus gak harus mahal.
Gaya engaging, pake emoji.
Jika input menyebut kategori spesifik, fokuskan caption ke kategori itu. Jika tidak, tetap relevan secara umum lintas produk.
Maks 200 kata.`
};

const TONE_INSTRUCTIONS = {
  casual: 'Gaya ngobrol santai, natural, kayak cerita ke temen.',
  funny: 'Gaya lucu, humor ringan, relatable tapi tetap informatif.',
  informative: 'Gaya informatif, fakta produk, tekstur, manfaat. Agak formal tapi engaging.',
  storytelling: 'Gaya bercerita, personal experience, ada alur dari masalah ke solusi.'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { productName, productPrice, style, tone, extraNotes, link, imageUrl } = req.body;

    if (!productName) {
      return res.status(400).json({ error: 'productName required' });
    }

    const stylePrompt = SYSTEM_PROMPTS[style] || SYSTEM_PROMPTS.review;
    const toneInstruction = TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.casual;

    let userPrompt = `Buat caption untuk produk: ${productName}`;
    if (productPrice && productPrice !== '-') userPrompt += `\nHarga: ${productPrice}`;
    if (extraNotes) userPrompt += `\nCatatan tambahan: ${extraNotes}`;
    if (link) userPrompt += `\nLink afiliasi: ${link}`;
    userPrompt += `\n\n${toneInstruction}\n\nAkhiri dengan link afiliasi: ${link || '⬇️ link di bio'}`;

    const response = await fetch(`${CAPTION_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CAPTION_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: CAPTION_MODEL,
        messages: [
          { role: 'system', content: stylePrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.8,
        stream: false
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('API error:', response.status, errText);
      return res.status(502).json({ error: 'API call failed', detail: errText });
    }

    const data = await response.json();
    let caption = data.choices?.[0]?.message?.content || '';

    // DeepSeek reasoning model: content might be null if reasoning consumed all tokens
    if (!caption) {
      caption = '⚠️ Model kehabisan token. Coba generate lagi.';
    }

    // Hashtag sets
    const hashtagSets = {
      review: '\n#reviewproduk #reviewjujur #belanjapintar #produkviral',
      rekomendasi: '\n#rekomendasiproduk #produkrecommended #wishlistbelanja #belanjacerdas',
      unboxing: '\n#unboxing #firstimpression #produkbaru #belanjatoday',
      tips: '\n#tipsproduk #tipspenggunaan #carapakai #produkwajibcoba',
      'skincare-routine': '\n#rutinitasharian #dailyroutine #tipsproduk #carapakai',
      hemat: '\n#hematbelanja #budgetfriendly #valueformoney #produkterjangkau'
    };
    const hashtags = hashtagSets[style] || hashtagSets.review;

    // Fallback: if link in input but not in caption, append
    const fullCaption = link && !caption.includes(link)
      ? caption + `\n\n🔗 ${link}`
      : caption;

    res.json({
      caption: fullCaption,
      hashtags: hashtags,
      imageUrl: imageUrl || '',
      model: CAPTION_MODEL
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal error', detail: err.message });
  }
}

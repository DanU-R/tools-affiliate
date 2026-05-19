// Vercel Serverless Function — Caption Generator Proxy
// Caption → nous/deepseek/deepseek-v4-flash (via gateway-api.dkzhen.org)
// Image → manual URL dari user (ditampilkan, bukan digenerate)

const CAPTION_API_BASE = process.env.CAPTION_API_BASE_DS || 'https://gateway-api.dkzhen.org/v1';
const CAPTION_API_KEY = process.env.CAPTION_API_KEY_DS;
const CAPTION_MODEL = process.env.CAPTION_MODEL_DS || 'nous/deepseek/deepseek-v4-flash';

const SYSTEM_PROMPTS = {
  review: `Kamu asisten pembuat caption Threads untuk produk afiliasi skincare Indonesia.
GAYA: cerita personal, hook pembuka relatable, pengalaman pribadi, trus ke solusi produk.
Bahasa Indonesia santai anak muda, pake emoji secukupnya.
Tonjolin tekstur, hasil, harga, kenapa worth it.
Maks 200 kata. Akhiri dengan ajakan klik link di bio.`,

  rekomendasi: `Kamu asisten pembuat caption Threads rekomendasi produk.
GAYA: kayak ngerekomendasiin ke temen sendiri. Bahasa santai, personal.
Sertakan alasan kenapa produk ini recommended + testimoni singkat.
Maks 200 kata. Akhiri dengan link di bio.`,

  unboxing: `Kamu asisten pembuat caption Threads unboxing.
Ceritakan kesan pertama: packaging, tekstur, wangi, first impression.
Gaya antusias, engaging, pake emoji.
Maks 200 kata.`,

  tips: `Kamu asisten pembuat caption Threads tips skincare.
Beri tips bermanfaat yg relate dengan produk ini.
Gaya santai informatif, pake emoji.
Maks 200 kata.`,

  'skincare-routine': `Kamu asisten pembuat caption Threads skincare routine.
Jelaskan step routine harian yg mencakup produk ini.
Gaya personal story, pake emoji.
Maks 200 kata.`,

  hemat: `Kamu asisten pembuat caption Threads tema hemat/budget friendly.
Tekanin produk bagus gak harus mahal.
Gaya engaging, pake emoji.
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
      review: '\n#reviewskincare #skincareindonesia #skincarereview #hanasui',
      rekomendasi: '\n#rekomendasi #skincarerecommendation #skincarewajah #produkrecommended',
      unboxing: '\n#unboxing #skincareunboxing #newskincare #firstimpression',
      tips: '\n#tipsskincare #skincaretips #skincareroutine #skincareindonesia',
      'skincare-routine': '\n#skincareroutine #morningroutine #skincareindonesia #skincaretips',
      hemat: '\n#skincaremurah #budgetskincare #produkmurah #skincarehemat'
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

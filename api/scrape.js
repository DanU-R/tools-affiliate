// Scrape product data from e-commerce URL
// Note: Shopee/Tokopedia are client-rendered (no SSR data).
// We try LLM browsing, fallback to manual input.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url required' });

  const API_BASE = process.env.CAPTION_API_BASE;
  const API_KEY = process.env.CAPTION_API_KEY;
  const MODEL = process.env.CAPTION_MODEL || 'cx/gpt-5.5-review';

  if (!API_BASE || !API_KEY) {
    return res.status(500).json({ error: 'API not configured' });
  }

  // Detect JS-rendered sites — these can't be scraped server-side
  const jsOnlySites = ['shopee.co.id', 'tokopedia.com', 'bukalapak.com', 'lazada.co.id', 'blibli.com'];
  const isJsOnly = jsOnlySites.some(s => url.includes(s));

  if (isJsOnly) {
    // Still try LLM — it might have web browsing capability
    return tryLlmScrape(url, API_BASE, API_KEY, MODEL, res);
  }

  // Try direct HTML fetch for SSR sites
  try {
    const pageRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'id-ID,id;q=0.9'
      },
      redirect: 'follow'
    });
    const html = await pageRes.text();

    let name = '', price = '', image = '';

    // Title tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) name = titleMatch[1].trim();

    // OG tags
    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);
    if (ogTitle && !name) name = ogTitle[1];
    const ogImg = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i);
    if (ogImg) image = ogImg[1];

    // Price meta
    const priceMeta = html.match(/<meta[^>]+property="product:price:amount"[^>]+content="([^"]+)"/i);
    if (priceMeta) price = priceMeta[1];

    // Clean name
    if (name) {
      name = name.split('|')[0].split('-')[0].trim();
      name = name.replace(/^(Jual|Beli|Promo|Harga)\s+/i, '').trim();
      name = name.replace(/\s{2,}/g, ' ').trim();
    }

    return res.status(200).json({
      name: name || '-',
      price: price || '-',
      image: image || '',
      url,
      source: 'html'
    });
  } catch {
    return tryLlmScrape(url, API_BASE, API_KEY, MODEL, res);
  }
}

async function tryLlmScrape(url, API_BASE, API_KEY, MODEL, res) {
  try {
    const llmRes = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'Extract product name, price, and image URL from this e-commerce link. Return ONLY JSON: {"name":"...","price":"...","image":"..."}. Set empty string if unknown. Do not make up data.' },
          { role: 'user', content: url }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    const llmData = await llmRes.json();
    const text = llmData.choices?.[0]?.message?.content || '';

    const jsonMatch = text.match(/\{[\s\S]*"name"[\s\S]*"price"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.name) {
        let p = parsed.price || '-';
        if (p && !p.startsWith('Rp')) {
          const n = parseFloat(p.replace(/[^0-9.,]/g, '').replace(/\./g, '').replace(',', '.'));
          if (!isNaN(n)) p = 'Rp' + Math.round(n).toLocaleString('id-ID');
          else p = 'Rp' + p;
        }
        return res.status(200).json({
          name: parsed.name.replace(/\s{2,}/g, ' ').trim(),
          price: p,
          image: parsed.image || '',
          url,
          source: 'llm'
        });
      }
    }

    return res.status(200).json({
      name: '-', price: '-', image: '', url,
      source: 'none',
      _note: 'Auto-scrape gagal — isi manual aja'
    });
  } catch {
    return res.status(200).json({
      name: '-', price: '-', image: '', url,
      source: 'error',
      _note: 'Auto-scrape gagal — isi manual aja'
    });
  }
}

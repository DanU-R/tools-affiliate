import { list, put } from '@vercel/blob';

const STORE_PATH = process.env.LINK_STORE_PATH || 'tools-affiliate/link-store.json';
const MAX_BODY_BYTES = 80 * 1024;

function isValidDateString(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value.trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeLinkBio(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter(e => e && typeof e === 'object')
    .map(e => ({
      name: typeof e.name === 'string' ? e.name.trim().slice(0, 200) : '',
      link: typeof e.link === 'string' ? e.link.trim() : '',
      addedAt: isValidDateString(e.addedAt) ? e.addedAt : new Date().toISOString()
    }))
    .filter(e => e.name && isHttpUrl(e.link));
}

function sanitizeTextLinks(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter(e => e && typeof e === 'object')
    .map(e => ({
      label: typeof e.label === 'string' ? e.label.trim().slice(0, 200) : '',
      url: typeof e.url === 'string' ? e.url.trim() : '',
      addedAt: isValidDateString(e.addedAt) ? e.addedAt : new Date().toISOString()
    }))
    .filter(e => e.label && isHttpUrl(e.url));
}

function normalizeState(input) {
  const linkBio = sanitizeLinkBio(input?.linkBio);
  const textLinks = sanitizeTextLinks(input?.textLinks);
  const updatedAt = isValidDateString(input?.updatedAt)
    ? input.updatedAt
    : new Date().toISOString();

  return {
    version: 1,
    updatedAt,
    linkBio,
    textLinks
  };
}

function emptyState() {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    linkBio: [],
    textLinks: []
  };
}

async function readStoreState() {
  const result = await list({
    prefix: STORE_PATH,
    limit: 10,
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  const found = result.blobs.find(b => b.pathname === STORE_PATH)
    || result.blobs[0];

  if (!found?.url) return emptyState();

  const resp = await fetch(found.url, { cache: 'no-store' });
  if (!resp.ok) return emptyState();

  const data = await resp.json().catch(() => null);
  if (!data) return emptyState();

  return normalizeState(data);
}

async function writeStoreState(input) {
  const normalized = normalizeState({
    ...input,
    updatedAt: new Date().toISOString()
  });

  await put(STORE_PATH, JSON.stringify(normalized), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json; charset=utf-8',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });

  return normalized;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'Blob token not configured' });
  }

  try {
    if (req.method === 'GET') {
      const state = await readStoreState();
      return res.status(200).json(state);
    }

    const body = req.body || {};
    const roughBytes = Buffer.byteLength(JSON.stringify(body), 'utf8');
    if (roughBytes > MAX_BODY_BYTES) {
      return res.status(413).json({ error: 'Payload too large' });
    }

    const current = await readStoreState();
    const next = normalizeState({
      linkBio: Object.prototype.hasOwnProperty.call(body, 'linkBio') ? body.linkBio : current.linkBio,
      textLinks: Object.prototype.hasOwnProperty.call(body, 'textLinks') ? body.textLinks : current.textLinks,
      updatedAt: body.updatedAt || new Date().toISOString()
    });

    const saved = await writeStoreState(next);
    return res.status(200).json(saved);
  } catch (err) {
    console.error('link-store error:', err);
    return res.status(500).json({ error: 'Internal error', detail: err?.message || 'Unknown error' });
  }
}

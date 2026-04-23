// api/sumup.js — Proxy para SumUp API
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-sumup-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Accept key from header OR query param
  const apiKey = req.headers['x-sumup-key'] || req.query.key;
  if (!apiKey) return res.status(401).json({ error: 'Missing API key' });

  const rawQuery = req.url.split('?')[1] || '';
  const params = new URLSearchParams(rawQuery);
  const path = params.get('path');
  if (!path) return res.status(400).json({ error: 'Missing path' });

  // Remove internal params
  params.delete('path');
  params.delete('key');
  const qs = params.toString();
  const url = `https://api.sumup.com${path}${qs ? '?' + qs : ''}`;

  console.log('SumUp request:', req.method, url);

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const text = await response.text();
    console.log('SumUp status:', response.status, 'body:', text.slice(0, 200));

    let data;
    try { data = JSON.parse(text); } catch(e) { data = { raw: text }; }
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

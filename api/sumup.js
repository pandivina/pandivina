// api/sumup.js — Proxy para SumUp API (evita CORS)
// Vercel despliega esto automáticamente como /api/sumup

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  if (!path) {
    return res.status(400).json({ error: 'Missing path parameter' });
  }

  // Get API key from header (passed from frontend)
  const apiKey = req.headers['x-sumup-key'];
  if (!apiKey) {
    return res.status(401).json({ error: 'Missing SumUp API key' });
  }

  // Build SumUp API URL
  const sumupBase = 'https://api.sumup.com';
  const decodedPath = decodeURIComponent(path);
  
  // Forward query params (except 'path')
  const forwardParams = { ...req.query };
  delete forwardParams.path;
  const queryString = new URLSearchParams(forwardParams).toString();
  const url = `${sumupBase}${decodedPath}${queryString ? '?' + queryString : ''}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

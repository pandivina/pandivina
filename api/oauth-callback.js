// api/oauth-callback.js — Recibe el código OAuth de SumUp y lo intercambia por un token
export default async function handler(req, res) {
  const { code, error, error_description } = req.query;

  if (error) {
    return res.status(400).send(`<html><body style="font-family:sans-serif;padding:40px;text-align:center">
      <h2 style="color:#d4506a">❌ Error de autorización</h2>
      <p>${error_description || error}</p>
      <a href="https://pandivina.vercel.app/pandivina_admin.html">Volver al admin</a>
    </body></html>`);
  }

  if (!code) return res.status(400).send('Missing code');

  const CLIENT_ID     = 'cc_classic_AOwKinAj4GdwrTpL4wD2fE6W036si';
  const CLIENT_SECRET = 'cc_sk_classic_79lXSqd1q4VzbXiEvr4xPZFAcvFOO8sRXgalDKLZCvPyFbiyTg';
  const REDIRECT_URI  = 'https://pandivina.vercel.app/api/oauth-callback';

  try {
    const tokenRes = await fetch('https://api.sumup.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'authorization_code',
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code:          code,
        redirect_uri:  REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      return res.status(400).send(`<html><body style="font-family:sans-serif;padding:40px;text-align:center">
        <h2 style="color:#d4506a">❌ Error obteniendo token</h2>
        <p>${tokenData.error_description || JSON.stringify(tokenData)}</p>
        <a href="https://pandivina.vercel.app/pandivina_admin.html">Volver al admin</a>
      </body></html>`);
    }

    const expires_at = Date.now() + ((tokenData.expires_in || 3600) * 1000);
    const payload = JSON.stringify({
      access_token:  tokenData.access_token,
      refresh_token: tokenData.refresh_token || '',
      expires_at
    });

    return res.status(200).send(`<html>
    <head><title>Conectando con SumUp…</title></head>
    <body style="font-family:sans-serif;padding:40px;text-align:center;background:#f7f2ee">
      <div style="max-width:400px;margin:80px auto;background:white;border-radius:12px;padding:32px;box-shadow:0 4px 20px rgba(0,0,0,.08)">
        <div style="font-size:40px;margin-bottom:16px">✅</div>
        <h2 style="color:#5a9e82;font-family:Georgia,serif;margin-bottom:8px">¡SumUp conectado!</h2>
        <p style="color:#9a8880;font-size:14px">Cerrando esta ventana…</p>
      </div>
      <script>
        var data = ${payload};
        function done() {
          if(window.opener) {
            window.opener.postMessage({type:'SUMUP_TOKEN', data: data}, '*');
            setTimeout(function(){ window.close(); }, 1200);
          } else {
            window.location.href = 'https://pandivina.vercel.app/pandivina_admin.html#sumup=' + encodeURIComponent(JSON.stringify(data));
          }
        }
        done();
      </script>
    </body></html>`);

  } catch(err) {
    return res.status(500).send(`<html><body style="font-family:sans-serif;padding:40px;text-align:center">
      <h2 style="color:#d4506a">❌ Error del servidor</h2><p>${err.message}</p>
      <a href="https://pandivina.vercel.app/pandivina_admin.html">Volver al admin</a>
    </body></html>`);
  }
}

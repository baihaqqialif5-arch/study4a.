// Vercel serverless function (percuma): panggil Gemini API. API key disimpan di Vercel, bukan dalam halaman.
export default async function handler(req, res) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  // Buka alamat-anda/api/ai dalam pelayar untuk semak: keySet mesti true.
  if (req.method === 'GET')
    return res.status(200).json({ ok: true, keySet: !!process.env.GEMINI_API_KEY, model });
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST sahaja' });
  const allowed = process.env.ALLOWED_ORIGIN; // pilihan, contoh: https://study4a.vercel.app
  if (allowed && !(req.headers.origin || req.headers.referer || '').startsWith(allowed))
    return res.status(403).json({ error: 'Origin tidak dibenarkan' });
  const prompt = req.body && req.body.prompt;
  if (typeof prompt !== 'string' || prompt.length > 14000)
    return res.status(400).json({ error: 'Input tidak sah' });
  if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: 'GEMINI_API_KEY belum ditetapkan' });
  try {
    const r = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
        })
      }
    );
    const data = await r.json();
    const text = ((data.candidates || [])[0]?.content?.parts || []).map(p => p.text || '').join('');
    if (!r.ok || !text) return res.status(502).json({ error: (data.error && data.error.message) || 'Tiada jawapan', text: '' });
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: 'Ralat pelayan' });
  }
}

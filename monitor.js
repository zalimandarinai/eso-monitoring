import fetch from 'node-fetch';

(async () => {
  const ESO_ID        = process.env.ESO_ID;
  const BOT_TOKEN     = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID       = process.env.TELEGRAM_CHAT_ID;
  const URL           = `https://www.eso.lt/web/namams/gaminantis-vartotojas/laisvos-galios-pasitikrinimas/362?objectCode=${ESO_ID}`;
  const USER_AGENT    = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36';

  // 1) Parsisiunčiam HTML kaip „nelaukiant Chrome“:
  const resp = await fetch(URL, {
    headers: { 'User-Agent': USER_AGENT }
  });
  const html = await resp.text();

  // 2) Ištraukime <div class="result-block"> turinį:
  const match = html.match(/<div\s+class="result-block">([\s\S]*?)<\/div>/i);
  const text = match
    ? match[1].replace(/<[^>]+>/g, '')   // išvalom HTML tag’us
          .trim()
    : '❌ Neradau jokio „result-block“ elemento.';

  // 3) Siunčiam į Telegram:
  const telegramRes = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        chat_id: CHAT_ID,
        text:    `🔔 ESO statusas pasikeitė:\n${text}`
      })
    }
  );

  process.exit(telegramRes.ok ? 0 : 1);
})();


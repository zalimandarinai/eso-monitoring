// monitor.js
// 1) Tiesioginė HTTP GET užklausa be Playwright
// 2) Naudoja globalų fetch (Node 18+)
// 3) Regex ištraukia tik <div class="result-block">

const ESO_ID      = process.env.ESO_ID;
const BOT_TOKEN   = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID     = process.env.TELEGRAM_CHAT_ID;
const URL         = `https://www.eso.lt/web/namams/gaminantis-vartotojas/laisvos-galios-pasitikrinimas/362?objectCode=${ESO_ID}`;
const UA          = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36';

(async () => {
  try {
    // 1) Parsisiunčiam HTML
    const res = await fetch(URL, { headers: { 'User-Agent': UA } });
    const html = await res.text();

    // 2) Ištraukiam „result-block“:
    const m = html.match(/<div\s+class="result-block">([\s\S]*?)<\/div>/i);
    const text = m
      ? m[1].replace(/<[^>]+>/g, '').trim()
      : '⚠️ Neradau „result-block“ elemento.';

    // 3) Siunčiam į Telegram
    const tg = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          chat_id: CHAT_ID,
          text:    `🔔 ESO statusas pasikeitė:\n${text}`
        })
      }
    );

    process.exit(tg.ok ? 0 : 1);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

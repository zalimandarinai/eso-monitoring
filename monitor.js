// monitor.js
import { chromium } from 'playwright';

(async () => {
  const ESO_ID = process.env.ESO_ID;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID  = process.env.TELEGRAM_CHAT_ID;
  const URL = `https://www.eso.lt/web/namams/gaminantis-vartotojas/laisvos-galios-pasitikrinimas/362?objectCode=${ESO_ID}`;

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });

  // Ištraukiame dinaminius rezultatus
  const raw = await page.locator('div.result-block').textContent();
  await browser.close();

  const text = raw ? raw.trim() : '❌ Neradau jokio rezultato.';
  
  // Siunčiame Telegram pranešimą
  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: `🔔 ESO statusas pasikeitė:\n${text}`
      })
    }
  );
  process.exit(res.ok ? 0 : 1);
})();

#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';

const ESO_ID = process.env.ESO_ID;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function fetchHtml() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const url = `https://www.eso.lt/web/narams/gaminantis-vartotojas/laisvos-galios-pasitikrinimas/${ESO_ID}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  const html = await page.content();
  await browser.close();
  return html;
}

function extractStatus(html) {
  const m = html.match(/<div class="result-block">([\s\S]*?)<\/div>/);
  return m ? m[1].trim() : null;
}

async function sendTelegram(text) {
  await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        parse_mode: 'HTML',
        text
      })
    }
  );
}

async function main() {
  const html = await fetchHtml();
  const status = extractStatus(html);
  if (!status) {
    console.error('⚠️ Nepavyko ištraukti ESO statuso');
    process.exit(1);
  }

  const lastFile   = path.resolve('last.txt');
  let previous = '';
  try {
    previous = await fs.readFile(lastFile, 'utf8');
  } catch {}

  if (status !== previous) {
    await fs.writeFile(lastFile, status, 'utf8');
    await fs.writeFile(path.resolve('result.txt'), status, 'utf8');
    await sendTelegram(`🔔 <b>ESO statusas pasikeitė:</b>\n${status}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * ESO laisvų galimybių tikrinimo monitorius
 * Veikia Node.js aplinkoje, naudoja Playwright puslapio turiniui parsisiųsti
 */

import fs from 'fs/promises';
import path from 'path';
import playwright from 'playwright';
import fetch from 'node-fetch';  // jeigu priklausomybė neinstaliuota, paleisk `npm install node-fetch`

// **1. Konfigūracija** – naudok ENV kintamuosius arba hardcode’intus reikšmes
const ESO_ID = process.env.ESO_ID || 'ĮVESK_TAVO_ESO_ID';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'ĮVESK_TAVO_BOT_TOKEN';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'ĮVESK_TAVO_CHAT_ID';

// Jeigu dar neturi package.json, įprojektink:
//   npm init -y
//   npm install playwright node-fetch

async function fetchPageHtml() {
  const browser = await playwright.chromium.launch({ headless: true });
  const page = await browser.newPage();
  const url = `https://www.eso.lt/web/narams/gaminantis-vartotojas/laisvos-galios-pasitikrinimas/${ESO_ID}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  const html = await page.content();
  await browser.close();
  return html;
}

function extractStatus(html) {
  const match = html.match(/<div class="result-block">([\s\S]*?)<\/div>/);
  return match ? match[1].trim() : null;
}

async function sendTelegram(message) {
  const resp = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    }
  );
  return resp.json();
}

async function main() {
  const html = await fetchPageHtml();
  const status = extractStatus(html);
  if (!status) {
    console.warn('Nepavyko ištraukti ESO statuso');
    process.exit(1);
  }

  const resultPath = path.resolve('result.txt');
  const lastPath   = path.resolve('last.txt');
  let previous = null;
  try { previous = await fs.readFile(lastPath, 'utf8'); }
  catch (e) { /* pirmas paleidimas – laukiam */ }

  if (status !== previous) {
    // jei pakeitėsi – įrašom snapshot ir siūbam pranešimą
    await fs.writeFile(lastPath, status, 'utf8');
    await fs.writeFile(resultPath, status, 'utf8');
    await sendTelegram(`🔔 <b>ESO statusas pasikeitė:</b>\n${status}`);
  } else {
    console.log('Nėra naujienų, statusas tas pats.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

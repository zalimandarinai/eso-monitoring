import asyncio
from playwright.async_api import async_playwright
import os
import requests

ESO_OBJECT_ID = "71177586"
CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]
BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
LAST_RESULT_FILE = "last_result.txt"

async def check():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("https://www.eso.lt/web/namams/gaminantis-vartotojas/laisvos-galios-pasitikrinimas/362")
        await page.fill("input[name='objectCode']", ESO_OBJECT_ID)
        await page.click("button:has-text('Tikrinti')")
        await page.wait_for_selector("div.result-block", timeout=10000)
        result = await page.inner_text("div.result-block")
        previous = ""
        if os.path.exists(LAST_RESULT_FILE):
            with open(LAST_RESULT_FILE, "r", encoding="utf-8") as f:
                previous = f.read().strip()
        if result.strip() != previous:
            send_telegram(f"🔔 ESO rezultatas pasikeitė!\n\n{result.strip()}")
            with open(LAST_RESULT_FILE, "w", encoding="utf-8") as f:
                f.write(result.strip())
        await browser.close()

def send_telegram(message):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    data = {"chat_id": CHAT_ID, "text": message}
    requests.post(url, data=data)

asyncio.run(check())